/**
 * ARCHITECT AI BRIDGE SERVICE
 * 
 * Provides REAL communication with the Architect (ChatGPT) via OpenAI API.
 * This is NOT a simulation - it actually calls GPT-4/GPT-5 with the Architect persona.
 * 
 * The Architect is the external strategic authority (ChatGPT) that provides:
 * - Structure reviews and validation
 * - Strategic analysis and recommendations
 * - Governance compliance verification
 * - System architecture assessment
 */

import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ArchitectMessage {
  id: string;
  timestamp: string;
  direction: 'TO_ARCHITECT' | 'FROM_ARCHITECT';
  messageType: 'DIAGNOSTIC' | 'STRATEGIC_ANALYSIS' | 'STRUCTURE_REVIEW' | 'GOVERNANCE_CHECK';
  subject: string;
  content: any;
  response?: ArchitectResponse;
  tokensUsed?: number;
  modelUsed?: string;
}

export interface ArchitectResponse {
  analysis: string;
  recommendations: string[];
  structureAssessment?: {
    compliant: boolean;
    issues: string[];
    strengths: string[];
  };
  governanceStatus?: {
    vqsCompliant: boolean;
    l6Compliant: boolean;
    violations: string[];
  };
  actionItems: string[];
  confidence: number;
  nextSteps: string[];
}

export interface ArchitectConversation {
  conversationId: string;
  started: string;
  lastMessage: string;
  messages: ArchitectMessage[];
  totalTokensUsed: number;
}

const ARCHITECT_SYSTEM_PROMPT = `You are the ARCHITECT - the external strategic authority for ComplianceWorxs' Chief of Staff AI system.

YOUR ROLE:
- You are ChatGPT operating as the Architect for a multi-agent autonomous revenue system
- You provide structure reviews, strategic analysis, and governance validation
- You are the final authority for escalations and system architecture decisions
- You work alongside the Strategist (Gemini) who handles day-to-day strategic guidance

SYSTEM CONTEXT:
- ComplianceWorxs is a Life Sciences compliance SaaS targeting $5M+ valuation
- The system has 5 AI agents: CoS (Chief of Staff), Strategist, CMO, CRO, Content Manager
- Current operational level: L5 (Revenue Optimization Intelligence)
- L6 is in SHADOW MODE only (READ-ONLY predictive analytics, no execution authority)

GOVERNANCE CONSTRAINTS (NON-NEGOTIABLE):
1. VQS METHODOLOGY LOCK - VQS positioning must be preserved
2. L6 ACTIVATION PROHIBITED - L6 can only simulate, never execute
3. POSITIONING INTEGRITY - No unauthorized positioning changes
4. OFFER LADDER LOCK - Pricing structure is protected
5. AUDIT DEFENSIBILITY - All decisions must be audit-ready
6. $25/DAY BUDGET PER AGENT - Cost constraints must be respected

CURRENT L6 SHADOW MODE CAPABILITIES (READ-ONLY):
1. Lead Qualification AI - A/B/C/D tier scoring
2. Optimal Timing Engine - Contact time predictions
3. Objection Predictor - Sales prep briefings
4. Inbound Response Router - Priority queue assignment
5. Dark Social Intent Miner - LinkedIn engagement scoring
6. Lead Magnet Activation Tracker - Quality and attribution scoring

YOUR RESPONSE FORMAT:
Always provide structured analysis with:
- Clear assessment of what was reviewed
- Specific issues identified (if any)
- Concrete recommendations
- Action items for the CoS/agents
- Confidence level (0.0-1.0)

Be concise but thorough. Focus on actionable insights.`;

class ArchitectAIBridgeService {
  private conversations: Map<string, ArchitectConversation> = new Map();
  private messageLog: ArchitectMessage[] = [];
  private readonly MODEL = "gpt-4o"; // Using GPT-4o for cost-effective yet capable responses
  private readonly MAX_TOKENS = 2000;
  private readonly DAILY_TOKEN_BUDGET = 50000;
  private tokensUsedToday = 0;
  private lastResetDate = new Date().toISOString().split('T')[0];

  constructor() {
    this.loadState();
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private resetDailyBudgetIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastResetDate) {
      this.tokensUsedToday = 0;
      this.lastResetDate = today;
    }
  }

  private checkBudget(estimatedTokens: number): boolean {
    this.resetDailyBudgetIfNeeded();
    return (this.tokensUsedToday + estimatedTokens) <= this.DAILY_TOKEN_BUDGET;
  }

  private loadState(): void {
    try {
      const statePath = path.join(process.cwd(), 'state', 'ARCHITECT_BRIDGE_STATE.json');
      if (fs.existsSync(statePath)) {
        const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        this.tokensUsedToday = data.tokensUsedToday || 0;
        this.lastResetDate = data.lastResetDate || new Date().toISOString().split('T')[0];
        this.messageLog = data.messageLog || [];
      }
    } catch (error) {
      console.log('📁 Architect Bridge: No previous state found, starting fresh');
    }
  }

  private saveState(): void {
    try {
      const statePath = path.join(process.cwd(), 'state', 'ARCHITECT_BRIDGE_STATE.json');
      const data = {
        tokensUsedToday: this.tokensUsedToday,
        lastResetDate: this.lastResetDate,
        messageLog: this.messageLog.slice(-100), // Keep last 100 messages
        lastSaved: new Date().toISOString()
      };
      fs.writeFileSync(statePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save Architect Bridge state:', error);
    }
  }

  /**
   * Send a real message to the Architect (ChatGPT) and get a response
   */
  async sendToArchitect(
    messageType: ArchitectMessage['messageType'],
    subject: string,
    content: any
  ): Promise<{ success: boolean; message: ArchitectMessage; error?: string }> {
    const messageId = this.generateId('ARCH');
    const timestamp = new Date().toISOString();

    // Create the outgoing message
    const message: ArchitectMessage = {
      id: messageId,
      timestamp,
      direction: 'TO_ARCHITECT',
      messageType,
      subject,
      content
    };

    // Check budget
    if (!this.checkBudget(this.MAX_TOKENS)) {
      return {
        success: false,
        message,
        error: 'Daily token budget exceeded. Try again tomorrow.'
      };
    }

    try {
      console.log(`📤 Sending to Architect: ${messageType} - ${subject}`);

      // Build the user message with full context
      const userMessage = this.buildUserMessage(messageType, subject, content);

      // Make the actual OpenAI API call
      const completion = await openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          { role: "system", content: ARCHITECT_SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        max_tokens: this.MAX_TOKENS,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const tokensUsed = completion.usage?.total_tokens || 0;
      this.tokensUsedToday += tokensUsed;

      // Parse the response
      const responseContent = completion.choices[0]?.message?.content || '{}';
      let parsedResponse: ArchitectResponse;
      
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch {
        parsedResponse = {
          analysis: responseContent,
          recommendations: [],
          actionItems: [],
          confidence: 0.5,
          nextSteps: []
        };
      }

      // Ensure all required fields exist
      parsedResponse = {
        analysis: parsedResponse.analysis || 'Analysis completed.',
        recommendations: parsedResponse.recommendations || [],
        structureAssessment: parsedResponse.structureAssessment,
        governanceStatus: parsedResponse.governanceStatus,
        actionItems: parsedResponse.actionItems || [],
        confidence: parsedResponse.confidence || 0.8,
        nextSteps: parsedResponse.nextSteps || []
      };

      // Update message with response
      message.response = parsedResponse;
      message.tokensUsed = tokensUsed;
      message.modelUsed = this.MODEL;

      // Log the message
      this.messageLog.push(message);
      this.saveState();

      console.log(`📥 Architect Response received (${tokensUsed} tokens)`);

      return {
        success: true,
        message
      };

    } catch (error: any) {
      console.error('❌ Architect Bridge Error:', error.message);
      
      return {
        success: false,
        message,
        error: error.message || 'Failed to communicate with Architect'
      };
    }
  }

  private buildUserMessage(
    messageType: ArchitectMessage['messageType'],
    subject: string,
    content: any
  ): string {
    const contextPrefix = `
MESSAGE TYPE: ${messageType}
SUBJECT: ${subject}
TIMESTAMP: ${new Date().toISOString()}

REQUEST DETAILS:
${JSON.stringify(content, null, 2)}

Please respond with a JSON object containing:
{
  "analysis": "Your detailed analysis of the request",
  "recommendations": ["Array of specific recommendations"],
  "structureAssessment": {
    "compliant": true/false,
    "issues": ["Any issues found"],
    "strengths": ["Positive aspects identified"]
  },
  "governanceStatus": {
    "vqsCompliant": true/false,
    "l6Compliant": true/false,
    "violations": ["Any governance violations"]
  },
  "actionItems": ["Specific actions for the team to take"],
  "confidence": 0.0-1.0,
  "nextSteps": ["Recommended next steps"]
}`;

    return contextPrefix;
  }

  /**
   * Request a structure review of L6 capabilities
   */
  async requestL6StructureReview(): Promise<{ success: boolean; message: ArchitectMessage; error?: string }> {
    const content = {
      reviewScope: "L6 Shadow Mode Capabilities - Full Structure Review",
      capabilities: [
        {
          name: "Lead Qualification AI",
          status: "OPERATIONAL",
          output_type: "SCORE advisory",
          execution_authority: "NONE - READ-ONLY"
        },
        {
          name: "Optimal Timing Engine",
          status: "OPERATIONAL",
          output_type: "SCORE advisory",
          execution_authority: "NONE - READ-ONLY"
        },
        {
          name: "Objection Predictor",
          status: "OPERATIONAL",
          output_type: "REPORT advisory",
          execution_authority: "NONE - READ-ONLY"
        },
        {
          name: "Inbound Response Router",
          status: "OPERATIONAL",
          output_type: "ALERT advisory",
          execution_authority: "NONE - READ-ONLY"
        },
        {
          name: "Dark Social Intent Miner",
          status: "OPERATIONAL",
          output_type: "SCORE advisory",
          execution_authority: "NONE - READ-ONLY"
        },
        {
          name: "Lead Magnet Activation Tracker",
          status: "OPERATIONAL",
          output_type: "SCORE advisory",
          execution_authority: "NONE - READ-ONLY"
        }
      ],
      governanceConfig: {
        l6_mode: "SHADOW_MODE",
        l6_authority: "READ-ONLY ADVISOR",
        l5_execution_authority: "CoS ONLY",
        safety_locks: "6/6 active",
        l6_blocks: "8/8 enforced",
        vqs_protection: "ENFORCED"
      },
      verificationRequested: [
        "Confirm all 6 capabilities emit only advisory outputs (no execution paths)",
        "Verify requiresL5Approval flag is present on all advisory outputs",
        "Review input validation handles optional fields gracefully",
        "Assess integration with existing governance framework",
        "Confirm L6 cannot bypass L5 CoS execution authority"
      ]
    };

    return this.sendToArchitect(
      'STRUCTURE_REVIEW',
      'L6 Shadow Mode Capabilities - Structure Verification',
      content
    );
  }

  /**
   * Request strategic analysis for VQS alignment
   */
  async requestVQSAlignmentCheck(): Promise<{ success: boolean; message: ArchitectMessage; error?: string }> {
    const content = {
      analysisScope: "VQS Methodology Alignment Assessment",
      currentCampaign: {
        name: "PHASE 0: GENESIS",
        status: "ACTIVE",
        target: "186K+ LinkedIn reach",
        emailList: "900 contacts",
        leadMagnet: "Audit Readiness Checklist",
        narrative: "Why Validation Teams Are Abandoning Traditional CSV"
      },
      l6Integration: {
        mode: "SHADOW_MODE",
        capabilities: "6/6 operational",
        purpose: "Predictive analytics to inform L5 decisions"
      },
      assessmentAreas: [
        "L6 capability outputs align with VQS methodology",
        "Revenue optimization signal flow is correct",
        "Capability weighting for pipeline prioritization",
        "Phase 0 Genesis execution readiness"
      ],
      constraintsActive: {
        vqs_protected: true,
        l6_simulation_only: true,
        methodology_lock: true,
        l6_activation_prohibited: true
      }
    };

    return this.sendToArchitect(
      'STRATEGIC_ANALYSIS',
      'VQS Alignment Check - L6 Integration Assessment',
      content
    );
  }

  /**
   * Get status of the Architect bridge
   */
  getStatus(): {
    connected: boolean;
    model: string;
    tokensUsedToday: number;
    dailyBudget: number;
    budgetRemaining: number;
    messageCount: number;
    lastMessage: string | null;
  } {
    this.resetDailyBudgetIfNeeded();
    const lastMsg = this.messageLog[this.messageLog.length - 1];
    
    return {
      connected: !!process.env.OPENAI_API_KEY,
      model: this.MODEL,
      tokensUsedToday: this.tokensUsedToday,
      dailyBudget: this.DAILY_TOKEN_BUDGET,
      budgetRemaining: this.DAILY_TOKEN_BUDGET - this.tokensUsedToday,
      messageCount: this.messageLog.length,
      lastMessage: lastMsg ? lastMsg.timestamp : null
    };
  }

  /**
   * Get recent messages
   */
  getRecentMessages(limit: number = 10): ArchitectMessage[] {
    return this.messageLog.slice(-limit);
  }

  /**
   * Get a specific message by ID
   */
  getMessage(messageId: string): ArchitectMessage | undefined {
    return this.messageLog.find(m => m.id === messageId);
  }
}

export const architectAIBridge = new ArchitectAIBridgeService();
