/**
 * ====================================================
 * MESSAGE BUS - Agent-to-Agent Communication
 * /utils/messageBus.ts
 * ====================================================
 * 
 * Inter-agent wiring for the Editorial Firewall.
 * 
 * Flow:
 * CMO → TOPIC_IDEA_QUEUE → CMA (idea validation)
 *   → IDEA_REJECTED or BRIEF_READY
 * 
 * CMA → BRIEF_FOR_REVIEW → CoS (brief validation)
 *   → BRIEF_REJECTED or BRIEF_APPROVED
 * 
 * CoS → CPA_WORK_QUEUE → CPA (content generation)
 *   → DRAFT_FOR_PUBLISH_REVIEW
 * 
 * CPA → DRAFT_FOR_PUBLISH_REVIEW → CoS (final validation)
 *   → DRAFT_REJECTED or PUBLISH_QUEUE → WordPress
 * 
 * CPA must NEVER call WordPress directly. Only CoS publishes.
 */

import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import {
  editorialFirewall,
  ContentMessage,
  FirewallResult,
  TextAnalysis
} from './editorialFirewall.js';

// Message Topics
export const TOPICS = {
  // CMO → CMA
  TOPIC_IDEA_QUEUE: 'TOPIC_IDEA_QUEUE',
  IDEA_REJECTED: 'IDEA_REJECTED',
  BRIEF_READY: 'BRIEF_READY',
  
  // CMA → CoS
  BRIEF_FOR_REVIEW: 'BRIEF_FOR_REVIEW',
  BRIEF_REJECTED: 'BRIEF_REJECTED',
  BRIEF_APPROVED: 'BRIEF_APPROVED',
  
  // CoS → CPA
  CPA_WORK_QUEUE: 'CPA_WORK_QUEUE',
  
  // CPA → CoS (final review)
  DRAFT_FOR_PUBLISH_REVIEW: 'DRAFT_FOR_PUBLISH_REVIEW',
  DRAFT_REJECTED: 'DRAFT_REJECTED',
  
  // CoS → WordPress
  PUBLISH_QUEUE: 'PUBLISH_QUEUE',
  PUBLISH_SUCCESS: 'PUBLISH_SUCCESS',
  PUBLISH_FAILED: 'PUBLISH_FAILED'
} as const;

export interface IdeaMessage {
  id: string;
  topic: 'BLOG_ARTICLE' | 'LINKEDIN_POST' | 'EMAIL_CAMPAIGN';
  persona: string;
  title: string;
  rawIdea: string;
  metadata: {
    domainAnchors: string[];
    prohibitedTerms: string[];
    pillars: string[];
    lifecycleStage: 'idea';
  };
  timestamp: string;
  source: 'CMO';
}

export interface BriefMessage extends Omit<IdeaMessage, 'metadata' | 'source'> {
  metadata: {
    domainAnchors: string[];
    prohibitedTerms: string[];
    pillars: string[];
    lifecycleStage: 'brief';
  };
  source: 'CMA';
  enrichedBy: 'CMA';
}

export interface ApprovedBriefMessage extends Omit<BriefMessage, 'metadata'> {
  approvedBrief: string;
  metadata: {
    domainAnchors: string[];
    prohibitedTerms: string[];
    pillars: string[];
    lifecycleStage: 'brief-validated';
  };
  approvedBy: 'CoS';
}

export interface DraftMessage {
  id: string;
  topic: 'BLOG_ARTICLE' | 'LINKEDIN_POST' | 'EMAIL_CAMPAIGN';
  persona: string;
  title: string;
  rawIdea: string;
  approvedBrief: string;
  draftContent: string;
  draftHtml: string;
  excerpt: string;
  metadata: {
    domainAnchors: string[];
    prohibitedTerms: string[];
    pillars: string[];
    lifecycleStage: 'draft';
  };
  source: 'CMA';
  enrichedBy: 'CMA';
  approvedBy: 'CoS';
  generatedBy: 'CPA';
  timestamp: string;
}

export interface PublishMessage {
  id: string;
  topic: 'BLOG_ARTICLE' | 'LINKEDIN_POST' | 'EMAIL_CAMPAIGN';
  persona: string;
  title: string;
  rawIdea: string;
  approvedBrief: string;
  draftContent: string;
  draftHtml: string;
  excerpt: string;
  metadata: {
    domainAnchors: string[];
    prohibitedTerms: string[];
    pillars: string[];
    lifecycleStage: 'final';
  };
  source: 'CMA';
  enrichedBy: 'CMA';
  approvedBy: 'CoS';
  generatedBy: 'CPA';
  publishApprovedBy: 'CoS';
  timestamp: string;
}

export interface RejectionMessage {
  id: string;
  originalMessageId: string;
  stage: 'idea' | 'brief' | 'draft';
  reason: string;
  failedChecks: string[];
  analysis: TextAnalysis;
  rejectedBy: 'CMA' | 'CoS';
  timestamp: string;
}

interface MessageBusEvent {
  id: string;
  topic: string;
  payload: any;
  timestamp: string;
}

class MessageBus extends EventEmitter {
  private messageLog: MessageBusEvent[] = [];
  private logPath = 'state/message_bus_log.json';

  constructor() {
    super();
    this.loadLog();
    this.setupSubscribers();
  }

  private loadLog(): void {
    try {
      if (fs.existsSync(this.logPath)) {
        const data = JSON.parse(fs.readFileSync(this.logPath, 'utf-8'));
        this.messageLog = data.messages || [];
      }
    } catch {
      this.messageLog = [];
    }
  }

  private saveLog(): void {
    try {
      const dir = 'state';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Keep last 500 messages
      if (this.messageLog.length > 500) {
        this.messageLog = this.messageLog.slice(-500);
      }
      
      fs.writeFileSync(this.logPath, JSON.stringify({ messages: this.messageLog }, null, 2));
    } catch (error) {
      console.error('Failed to save message bus log:', error);
    }
  }

  /**
   * Publish a message to a topic
   */
  publish(topic: string, payload: any): void {
    const event: MessageBusEvent = {
      id: nanoid(),
      topic,
      payload,
      timestamp: new Date().toISOString()
    };

    this.messageLog.push(event);
    this.saveLog();

    console.log(`📬 [MessageBus] ${topic} | ID: ${event.id}`);
    this.emit(topic, payload);
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, handler: (payload: any) => void): void {
    this.on(topic, handler);
    console.log(`🔔 [MessageBus] Subscribed to ${topic}`);
  }

  /**
   * Setup all agent subscribers with firewall checks
   */
  private setupSubscribers(): void {
    // CMA subscribes to TOPIC_IDEA_QUEUE (idea stage validation)
    this.subscribe(TOPICS.TOPIC_IDEA_QUEUE, (message: IdeaMessage) => {
      console.log(`\n🔍 [CMA] Processing idea: "${message.title}"`);
      
      const result = editorialFirewall.firewallCheckIdea(message.rawIdea, message.persona);
      
      if (result.passed) {
        console.log(`   ✅ [CMA] Idea PASSED - forwarding to BRIEF_READY`);
        
        const briefMessage: BriefMessage = {
          ...message,
          metadata: {
            domainAnchors: result.analysis.domainAnchors,
            prohibitedTerms: result.analysis.prohibitedTerms,
            pillars: result.analysis.pillarsDetected,
            lifecycleStage: 'brief'
          },
          source: 'CMA',
          enrichedBy: 'CMA'
        };
        
        this.publish(TOPICS.BRIEF_READY, briefMessage);
      } else {
        console.log(`   ❌ [CMA] Idea REJECTED - ${result.summary}`);
        
        const rejection: RejectionMessage = {
          id: nanoid(),
          originalMessageId: message.id,
          stage: 'idea',
          reason: result.summary,
          failedChecks: result.failedChecks,
          analysis: result.analysis,
          rejectedBy: 'CMA',
          timestamp: new Date().toISOString()
        };
        
        this.publish(TOPICS.IDEA_REJECTED, rejection);
      }
    });

    // CoS subscribes to BRIEF_FOR_REVIEW (brief stage validation)
    this.subscribe(TOPICS.BRIEF_FOR_REVIEW, (message: BriefMessage) => {
      console.log(`\n🔍 [CoS] Reviewing brief: "${message.title}"`);
      
      const contentMessage: ContentMessage = {
        topic: message.topic,
        persona: message.persona,
        title: message.title,
        rawIdea: message.rawIdea,
        metadata: message.metadata
      };
      
      const result = editorialFirewall.firewallCheckBrief(contentMessage);
      
      if (result.passed) {
        console.log(`   ✅ [CoS] Brief APPROVED - forwarding to CPA_WORK_QUEUE`);
        
        const approvedMessage: ApprovedBriefMessage = {
          ...message,
          approvedBrief: message.rawIdea,
          metadata: {
            ...message.metadata,
            lifecycleStage: 'brief-validated'
          },
          approvedBy: 'CoS'
        };
        
        this.publish(TOPICS.BRIEF_APPROVED, approvedMessage);
        this.publish(TOPICS.CPA_WORK_QUEUE, approvedMessage);
      } else {
        console.log(`   ❌ [CoS] Brief REJECTED - ${result.summary}`);
        
        const rejection: RejectionMessage = {
          id: nanoid(),
          originalMessageId: message.id,
          stage: 'brief',
          reason: result.summary,
          failedChecks: result.failedChecks,
          analysis: result.analysis,
          rejectedBy: 'CoS',
          timestamp: new Date().toISOString()
        };
        
        this.publish(TOPICS.BRIEF_REJECTED, rejection);
      }
    });

    // CoS subscribes to DRAFT_FOR_PUBLISH_REVIEW (final validation before WordPress)
    this.subscribe(TOPICS.DRAFT_FOR_PUBLISH_REVIEW, (message: DraftMessage) => {
      console.log(`\n🔍 [CoS] Final review of draft: "${message.title}"`);
      
      const result = editorialFirewall.firewallCheckDraft(message.draftContent, message.persona);
      
      if (result.passed) {
        console.log(`   ✅ [CoS] Draft APPROVED - forwarding to PUBLISH_QUEUE`);
        
        const publishMessage: PublishMessage = {
          ...message,
          metadata: {
            ...message.metadata,
            lifecycleStage: 'final'
          },
          publishApprovedBy: 'CoS'
        };
        
        this.publish(TOPICS.PUBLISH_QUEUE, publishMessage);
      } else {
        console.log(`   ❌ [CoS] Draft REJECTED - ${result.summary}`);
        
        const rejection: RejectionMessage = {
          id: nanoid(),
          originalMessageId: message.id,
          stage: 'draft',
          reason: result.summary,
          failedChecks: result.failedChecks,
          analysis: result.analysis,
          rejectedBy: 'CoS',
          timestamp: new Date().toISOString()
        };
        
        this.publish(TOPICS.DRAFT_REJECTED, rejection);
      }
    });

    // Log rejections
    this.subscribe(TOPICS.IDEA_REJECTED, (rejection: RejectionMessage) => {
      console.log(`\n🚫 [FIREWALL] IDEA_REJECTED`);
      console.log(`   Message: ${rejection.originalMessageId}`);
      console.log(`   Reason: ${rejection.reason}`);
      console.log(`   Failed: ${rejection.failedChecks.join(', ')}`);
    });

    this.subscribe(TOPICS.BRIEF_REJECTED, (rejection: RejectionMessage) => {
      console.log(`\n🚫 [FIREWALL] BRIEF_REJECTED`);
      console.log(`   Message: ${rejection.originalMessageId}`);
      console.log(`   Reason: ${rejection.reason}`);
      console.log(`   Failed: ${rejection.failedChecks.join(', ')}`);
    });

    this.subscribe(TOPICS.DRAFT_REJECTED, (rejection: RejectionMessage) => {
      console.log(`\n🚫 [FIREWALL] DRAFT_REJECTED`);
      console.log(`   Message: ${rejection.originalMessageId}`);
      console.log(`   Reason: ${rejection.reason}`);
      console.log(`   Failed: ${rejection.failedChecks.join(', ')}`);
    });
  }

  /**
   * CMO submits an idea for validation
   */
  submitIdea(idea: {
    topic: 'BLOG_ARTICLE' | 'LINKEDIN_POST' | 'EMAIL_CAMPAIGN';
    persona: string;
    title: string;
    rawIdea: string;
  }): string {
    const message: IdeaMessage = {
      id: nanoid(),
      ...idea,
      metadata: {
        domainAnchors: [],
        prohibitedTerms: [],
        pillars: [],
        lifecycleStage: 'idea'
      },
      timestamp: new Date().toISOString(),
      source: 'CMO'
    };

    console.log(`\n📤 [CMO] Submitting idea: "${idea.title}"`);
    this.publish(TOPICS.TOPIC_IDEA_QUEUE, message);
    
    return message.id;
  }

  /**
   * CMA forwards brief for CoS review
   */
  submitBriefForReview(brief: BriefMessage): void {
    console.log(`\n📤 [CMA] Submitting brief for CoS review: "${brief.title}"`);
    this.publish(TOPICS.BRIEF_FOR_REVIEW, brief);
  }

  /**
   * CPA submits draft for final CoS review
   * CPA must NEVER call WordPress directly!
   */
  submitDraftForReview(draft: DraftMessage): void {
    console.log(`\n📤 [CPA] Submitting draft for CoS final review: "${draft.title}"`);
    this.publish(TOPICS.DRAFT_FOR_PUBLISH_REVIEW, draft);
  }

  /**
   * Get recent messages
   */
  getRecentMessages(limit: number = 50): MessageBusEvent[] {
    return this.messageLog.slice(-limit);
  }

  /**
   * Get messages by topic
   */
  getMessagesByTopic(topic: string, limit: number = 20): MessageBusEvent[] {
    return this.messageLog
      .filter(m => m.topic === topic)
      .slice(-limit);
  }
}

export const messageBus = new MessageBus();
