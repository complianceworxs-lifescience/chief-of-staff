/**
 * ====================================================
 * BLOG CADENCE SCHEDULER v2.0
 * ====================================================
 * 
 * Chief of Staff Scheduling Directive – Blog Cadence
 * 
 * Frequency: 2 posts per week
 * Days: Monday and Thursday
 * Time: 15:00 UTC
 * 
 * ENHANCEMENTS:
 * - Brief Buffer: Pre-approved queue ensures publishing never stalls
 * - Fallback Logic: Uses evergreen content if primary brief fails
 * - Inventory Alerts: Warns when brief buffer runs low
 * 
 * This scheduler automatically triggers RUN_BLOG_PUBLISH_PIPELINE
 * at the configured times.
 */

import { blogPublishPipeline } from './blog-publish-pipeline.js';
import * as fs from 'fs';
import { nanoid } from 'nanoid';

// Brief Buffer Configuration
const BRIEF_BUFFER_CONFIG = {
  minBufferSize: 3,         // Minimum briefs to have ready
  targetBufferSize: 5,      // Ideal buffer size
  lowInventoryThreshold: 2, // Alert when this low
  evergreenFallback: true,  // Use evergreen content as fallback
  maxRetries: 2             // Retries before using fallback
} as const;

// Pre-approved evergreen topics for fallback
const EVERGREEN_FALLBACK_BRIEFS = [
  {
    id: 'evergreen-1',
    topic: 'Preparing for FDA Audits: A Validation Leader\'s Quarterly Checklist',
    angle: 'proactive compliance preparation',
    persona: 'Validation Strategist',
    pillar: 'Time Reclaimed',
    revenueHook: 'audit preparation efficiency'
  },
  {
    id: 'evergreen-2', 
    topic: 'The True Cost of Manual Compliance: Calculating Your Hidden Overhead',
    angle: 'ROI quantification',
    persona: 'Rising Leader',
    pillar: 'Proof of ROI',
    revenueHook: 'cost reduction demonstration'
  },
  {
    id: 'evergreen-3',
    topic: 'Building a Compliance Culture That Scales: From Lab to Enterprise',
    angle: 'organizational transformation',
    persona: 'Compliance Architect',
    pillar: 'Professional Equity',
    revenueHook: 'enterprise readiness positioning'
  }
] as const;

interface BriefBufferItem {
  id: string;
  topic: string;
  angle: string;
  persona: string;
  pillar: string;
  revenueHook: string;
  addedAt: string;
  status: 'pending' | 'used' | 'failed';
  priority: number;
  isEvergreen: boolean;
}

interface SchedulerState {
  enabled: boolean;
  lastRun: string | null;
  nextScheduledRun: string | null;
  briefBuffer: BriefBufferItem[];
  briefsUsedToday: number;
  lastBufferRefill: string | null;
  evergreenFallbackCount: number;
  executionHistory: Array<{
    timestamp: string;
    day: string;
    success: boolean;
    pipelineId?: string;
    postUrl?: string;
    error?: string;
    briefId?: string;
    usedFallback?: boolean;
  }>;
}

class BlogCadenceScheduler {
  private schedulerInterval: NodeJS.Timeout | null = null;
  private stateFilePath = 'state/blog_scheduler_state.json';
  private state: SchedulerState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): SchedulerState {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const loaded = JSON.parse(fs.readFileSync(this.stateFilePath, 'utf-8'));
        // Ensure new fields exist
        return {
          ...loaded,
          briefBuffer: loaded.briefBuffer || [],
          briefsUsedToday: loaded.briefsUsedToday || 0,
          lastBufferRefill: loaded.lastBufferRefill || null,
          evergreenFallbackCount: loaded.evergreenFallbackCount || 0
        };
      }
    } catch (error) {
      console.log('📅 Blog Scheduler: Initializing fresh state');
    }
    
    return {
      enabled: true,
      lastRun: null,
      nextScheduledRun: null,
      briefBuffer: [],
      briefsUsedToday: 0,
      lastBufferRefill: null,
      evergreenFallbackCount: 0,
      executionHistory: []
    };
  }

  private saveState(): void {
    try {
      const dir = 'state';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('❌ Blog Scheduler: Failed to save state:', error);
    }
  }

  getScheduleConfig(): { days: string[]; time_utc: string; enabled: boolean } {
    try {
      const directive = JSON.parse(fs.readFileSync('state/L7_MASTER_DIRECTIVE.json', 'utf-8'));
      const scheduler = directive.SCHEDULER?.BLOG_CADENCE;
      
      if (scheduler) {
        return {
          days: scheduler.days || ['MON', 'THU'],
          time_utc: scheduler.time_utc || '15:00',
          enabled: scheduler.enabled !== false
        };
      }
    } catch {
      // Default config
    }
    
    return {
      days: ['MON', 'THU'],
      time_utc: '15:00',
      enabled: true
    };
  }

  private getDayName(date: Date): string {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getUTCDay()];
  }

  private isScheduledTime(): boolean {
    const config = this.getScheduleConfig();
    const now = new Date();
    const currentDay = this.getDayName(now);
    const [scheduleHour, scheduleMinute] = config.time_utc.split(':').map(Number);

    // Check if it's a scheduled day
    if (!config.days.includes(currentDay)) {
      return false;
    }

    // Check if it's within 5 minutes of scheduled time
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    if (currentHour !== scheduleHour) return false;
    if (Math.abs(currentMinute - scheduleMinute) > 5) return false;

    // Check if we already ran today
    if (this.state.lastRun) {
      const lastRun = new Date(this.state.lastRun);
      const isSameDay = lastRun.toISOString().split('T')[0] === now.toISOString().split('T')[0];
      if (isSameDay) return false;
    }

    return true;
  }

  getNextScheduledRun(): string {
    const config = this.getScheduleConfig();
    const now = new Date();
    const [scheduleHour, scheduleMinute] = config.time_utc.split(':').map(Number);

    // Find next scheduled day
    for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
      const checkDate = new Date(now);
      checkDate.setUTCDate(checkDate.getUTCDate() + daysAhead);
      checkDate.setUTCHours(scheduleHour, scheduleMinute, 0, 0);

      const dayName = this.getDayName(checkDate);
      
      if (config.days.includes(dayName)) {
        // If it's today, check if the time has passed
        if (daysAhead === 0 && checkDate <= now) {
          continue;
        }
        return checkDate.toISOString();
      }
    }

    return 'Unknown';
  }

  async runPipeline(): Promise<void> {
    if (!this.state.enabled) {
      console.log('📅 Blog Scheduler: Scheduler is disabled');
      return;
    }

    const config = this.getScheduleConfig();
    if (!config.enabled) {
      console.log('📅 Blog Scheduler: Blog cadence is disabled in L7 directive');
      return;
    }

    console.log('\n📅 Blog Scheduler: Triggering RUN_BLOG_PUBLISH_PIPELINE');
    
    const now = new Date();
    const currentDay = this.getDayName(now);
    
    try {
      const result = await blogPublishPipeline.runBlogPublishPipeline();
      
      this.state.lastRun = now.toISOString();
      this.state.nextScheduledRun = this.getNextScheduledRun();
      this.state.executionHistory.unshift({
        timestamp: now.toISOString(),
        day: currentDay,
        success: result.success,
        pipelineId: result.pipelineId,
        postUrl: result.wordpress?.postUrl,
        error: result.error
      });

      // Keep last 50 executions
      if (this.state.executionHistory.length > 50) {
        this.state.executionHistory = this.state.executionHistory.slice(0, 50);
      }

      this.saveState();

      if (result.success) {
        console.log(`✅ Blog Scheduler: Post published successfully at ${result.wordpress?.postUrl}`);
      } else {
        console.log(`⚠️ Blog Scheduler: Pipeline completed with issues - ${result.error}`);
      }
    } catch (error: any) {
      console.error('❌ Blog Scheduler: Pipeline execution failed:', error.message);
      
      this.state.executionHistory.unshift({
        timestamp: now.toISOString(),
        day: currentDay,
        success: false,
        error: error.message
      });
      this.saveState();
    }
  }

  start(): void {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       BLOG CADENCE SCHEDULER STARTED                             ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    
    const config = this.getScheduleConfig();
    console.log(`   📅 Schedule: ${config.days.join(', ')} at ${config.time_utc} UTC`);
    console.log(`   🔄 Status: ${config.enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   ⏰ Next run: ${this.getNextScheduledRun()}`);

    // Check every minute
    this.schedulerInterval = setInterval(() => {
      if (this.isScheduledTime()) {
        this.runPipeline();
      }
    }, 60000);

    // Also check immediately on start
    setTimeout(() => {
      if (this.isScheduledTime()) {
        this.runPipeline();
      }
    }, 5000);
  }

  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    console.log('📅 Blog Scheduler: Stopped');
  }

  enable(): void {
    this.state.enabled = true;
    this.saveState();
    console.log('📅 Blog Scheduler: Enabled');
  }

  disable(): void {
    this.state.enabled = false;
    this.saveState();
    console.log('📅 Blog Scheduler: Disabled');
  }

  // ============================================
  // BRIEF BUFFER MANAGEMENT (New v2.0)
  // ============================================

  /**
   * Get current buffer status - checks both scheduler buffer AND content_briefs.json
   */
  getBufferStatus(): {
    currentSize: number;
    targetSize: number;
    isLow: boolean;
    pendingBriefs: BriefBufferItem[];
    evergreenFallbackCount: number;
    needsRefill: boolean;
  } {
    const pendingBriefs = this.state.briefBuffer.filter(b => b.status === 'pending');
    
    // Also check content_briefs.json for Life Sciences briefs ready for publishing
    const contentBriefsCount = this.getLifeSciencesBriefsCount();
    const totalAvailable = pendingBriefs.length + contentBriefsCount;
    
    const isLow = totalAvailable <= BRIEF_BUFFER_CONFIG.lowInventoryThreshold;
    const needsRefill = totalAvailable < BRIEF_BUFFER_CONFIG.minBufferSize;

    if (isLow && totalAvailable > 0) {
      console.log(`⚠️ Brief Buffer LOW: ${totalAvailable} briefs remaining (threshold: ${BRIEF_BUFFER_CONFIG.lowInventoryThreshold})`);
    }

    return {
      currentSize: totalAvailable,
      targetSize: BRIEF_BUFFER_CONFIG.targetBufferSize,
      isLow,
      pendingBriefs,
      evergreenFallbackCount: this.state.evergreenFallbackCount,
      needsRefill
    };
  }
  
  /**
   * Count Life Sciences briefs available in content_briefs.json
   * Filters for: unused, approved, and passes basic Life Sciences domain check
   */
  private getLifeSciencesBriefsCount(): number {
    try {
      const briefsPath = 'state/content_briefs.json';
      if (!fs.existsSync(briefsPath)) return 0;
      
      const data = JSON.parse(fs.readFileSync(briefsPath, 'utf-8'));
      const briefs = data.briefs || [];
      
      // Life Sciences domain anchors (must have at least 1)
      const lifeSciences = ['fda', 'gxp', 'csv', 'validation', 'qms', 'annex 11', '21 cfr', 'audit', 'capa', 'deviation', 'quality'];
      
      // Corporate compliance terms to filter out
      const prohibited = ['sox', 'sarbanes', 'sec enforcement', 'gdpr fines', 'corporate governance', 'aml', 'kyc'];
      
      return briefs.filter((b: any) => {
        if (b.used) return false;
        if (!b.approvedBy) return false;
        
        const content = `${b.title} ${b.coreMessage || ''} ${b.valueProposition || ''}`.toLowerCase();
        
        // Must have Life Sciences terms
        const hasLifeSciences = lifeSciences.some(term => content.includes(term));
        
        // Must NOT have prohibited corporate compliance terms
        const hasProhibited = prohibited.some(term => content.includes(term));
        
        return hasLifeSciences && !hasProhibited;
      }).length;
    } catch {
      return 0;
    }
  }

  /**
   * Add a brief to the buffer (called by CMO/CoS after approval)
   */
  addBriefToBuffer(brief: {
    topic: string;
    angle: string;
    persona: string;
    pillar: string;
    revenueHook: string;
    priority?: number;
  }): BriefBufferItem {
    const bufferedBrief: BriefBufferItem = {
      id: nanoid(),
      topic: brief.topic,
      angle: brief.angle,
      persona: brief.persona,
      pillar: brief.pillar,
      revenueHook: brief.revenueHook,
      addedAt: new Date().toISOString(),
      status: 'pending',
      priority: brief.priority || 1,
      isEvergreen: false
    };

    this.state.briefBuffer.push(bufferedBrief);
    this.saveState();

    console.log(`📝 Brief Buffer: Added "${brief.topic.slice(0, 50)}..." (Buffer: ${this.state.briefBuffer.filter(b => b.status === 'pending').length})`);
    return bufferedBrief;
  }

  /**
   * Get the next brief from buffer (highest priority first)
   */
  private getNextBriefFromBuffer(): BriefBufferItem | null {
    const pendingBriefs = this.state.briefBuffer
      .filter(b => b.status === 'pending')
      .sort((a, b) => b.priority - a.priority);

    return pendingBriefs[0] || null;
  }

  /**
   * Get evergreen fallback brief
   */
  private getEvergreenFallback(): BriefBufferItem {
    // Rotate through evergreen content
    const evergreenIndex = this.state.evergreenFallbackCount % EVERGREEN_FALLBACK_BRIEFS.length;
    const evergreenBrief = EVERGREEN_FALLBACK_BRIEFS[evergreenIndex];

    this.state.evergreenFallbackCount++;
    this.saveState();

    console.log(`🌲 Using evergreen fallback: "${evergreenBrief.topic.slice(0, 50)}..."`);

    return {
      id: `${evergreenBrief.id}-${Date.now()}`,
      topic: evergreenBrief.topic,
      angle: evergreenBrief.angle,
      persona: evergreenBrief.persona,
      pillar: evergreenBrief.pillar,
      revenueHook: evergreenBrief.revenueHook,
      addedAt: new Date().toISOString(),
      status: 'pending',
      priority: 0,
      isEvergreen: true
    };
  }

  /**
   * Get brief with fallback logic
   * Priority: Buffer > Evergreen > null
   */
  getBriefWithFallback(): { brief: BriefBufferItem | null; source: 'buffer' | 'evergreen' | 'none' } {
    // Try buffer first
    const bufferedBrief = this.getNextBriefFromBuffer();
    if (bufferedBrief) {
      return { brief: bufferedBrief, source: 'buffer' };
    }

    // Fallback to evergreen if enabled
    if (BRIEF_BUFFER_CONFIG.evergreenFallback) {
      const evergreenBrief = this.getEvergreenFallback();
      return { brief: evergreenBrief, source: 'evergreen' };
    }

    return { brief: null, source: 'none' };
  }

  /**
   * Mark brief as used (successful publish)
   */
  markBriefUsed(briefId: string): void {
    const brief = this.state.briefBuffer.find(b => b.id === briefId);
    if (brief) {
      brief.status = 'used';
      this.saveState();
    }
  }

  /**
   * Mark brief as failed
   */
  markBriefFailed(briefId: string): void {
    const brief = this.state.briefBuffer.find(b => b.id === briefId);
    if (brief) {
      brief.status = 'failed';
      this.saveState();
    }
  }

  /**
   * Pre-populate buffer with CMO-suggested topics
   */
  async refillBufferIfNeeded(): Promise<void> {
    const status = this.getBufferStatus();
    
    if (!status.needsRefill) {
      return;
    }

    console.log(`📥 Brief Buffer: Refilling (current: ${status.currentSize}, target: ${BRIEF_BUFFER_CONFIG.targetBufferSize})`);

    // Generate placeholder briefs for CMO to approve
    // In production, this would call the CMO agent to generate topic ideas
    const suggestedTopics = [
      {
        topic: 'Emerging Trends in CSV Automation for 2025',
        angle: 'technology advancement',
        persona: 'Rising Leader',
        pillar: 'Time Reclaimed',
        revenueHook: 'future-proofing investment'
      },
      {
        topic: 'How Top Pharma Companies Measure Compliance ROI',
        angle: 'industry benchmarking',
        persona: 'Validation Strategist',
        pillar: 'Proof of ROI',
        revenueHook: 'competitive benchmarking'
      }
    ];

    // Add suggested topics to buffer (these would typically go through CoS approval first)
    for (const topic of suggestedTopics) {
      if (this.state.briefBuffer.filter(b => b.status === 'pending').length < BRIEF_BUFFER_CONFIG.targetBufferSize) {
        this.addBriefToBuffer({ ...topic, priority: 1 });
      }
    }

    this.state.lastBufferRefill = new Date().toISOString();
    this.saveState();
  }

  /**
   * Clear old used/failed briefs from buffer
   */
  cleanupBuffer(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    this.state.briefBuffer = this.state.briefBuffer.filter(brief => {
      if (brief.status === 'pending') return true;
      const addedDate = new Date(brief.addedAt).getTime();
      return addedDate > thirtyDaysAgo;
    });

    this.saveState();
    console.log('📦 Brief Buffer: Cleaned up old entries');
  }

  getStatus(): {
    enabled: boolean;
    lastRun: string | null;
    nextScheduledRun: string;
    schedule: { days: string[]; time_utc: string };
    briefBuffer: ReturnType<typeof this.getBufferStatus>;
    recentExecutions: SchedulerState['executionHistory'];
  } {
    const config = this.getScheduleConfig();
    return {
      enabled: this.state.enabled && config.enabled,
      lastRun: this.state.lastRun,
      nextScheduledRun: this.getNextScheduledRun(),
      schedule: {
        days: config.days,
        time_utc: config.time_utc
      },
      briefBuffer: this.getBufferStatus(),
      recentExecutions: this.state.executionHistory.slice(0, 10)
    };
  }

  async triggerManualRun(): Promise<any> {
    console.log('📅 Blog Scheduler: Manual trigger requested');
    await this.runPipeline();
    return this.getStatus();
  }
}

export const blogCadenceScheduler = new BlogCadenceScheduler();
