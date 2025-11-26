/**
 * LLM AGENT REASONING SERVICE
 * 
 * Provides real AI-powered decision-making for all agents using OpenAI GPT-5.
 * Each agent has specialized reasoning capabilities based on their role and governance rules.
 * 
 * The newest OpenAI model is "gpt-5" which was released August 7, 2025.
 * Do not change this unless explicitly requested by the user.
 */

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type AgentRole = 'CoS' | 'Strategist' | 'CMO' | 'CRO' | 'ContentManager';

export interface AgentContext {
  role: AgentRole;
  currentState: Record<string, any>;
  governanceRules: string[];
  recentActions: string[];
  activeGoals: string[];
}

export interface ReasoningDecision {
  id: string;
  agent: AgentRole;
  timestamp: string;
  prompt: string;
  reasoning: string;
  decision: string;
  confidence: number;
  actions: string[];
  rationale: string;
  tokensUsed: number;
  modelUsed: string;
}

export interface ConflictAnalysis {
  conflictId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rootCause: string;
  recommendedStrategy: string;
  resourceReallocation: Record<string, number>;
  expectedImpact: number;
  confidence: number;
}

export interface StrategicRecommendation {
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedRevenueDelta: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
  requiredResources: string[];
  vqsCompliant: boolean;
}

export interface ContentDecision {
  contentType: string;
  archetype: string;
  targetAudience: string;
  keyMessages: string[];
  callToAction: string;
  estimatedEngagement: number;
  complianceNotes: string;
}

export interface OfferOptimization {
  offerId: string;
  recommendedChanges: string[];
  pricingAdjustment: number;
  targetSegment: string;
  expectedConversionLift: number;
  abTestRecommendation: string;
}

class LLMAgentReasoningService {
  private decisionLog: ReasoningDecision[] = [];
  
  private readonly COST_PER_1K_TOKENS = 0.01;
  private readonly DAILY_BUDGET_PER_AGENT = 25;
  
  private agentBudgets: Record<AgentRole, { used: number; lastReset: string }> = {
    CoS: { used: 0, lastReset: new Date().toISOString().split('T')[0] },
    Strategist: { used: 0, lastReset: new Date().toISOString().split('T')[0] },
    CMO: { used: 0, lastReset: new Date().toISOString().split('T')[0] },
    CRO: { used: 0, lastReset: new Date().toISOString().split('T')[0] },
    ContentManager: { used: 0, lastReset: new Date().toISOString().split('T')[0] }
  };
  
  private tokenBudget = {
    daily: 50000,
    used: 0,
    lastReset: new Date().toISOString().split('T')[0]
  };

  private readonly GOVERNANCE_CONTEXT = `
You are an AI agent for ComplianceWorxs, a Life Sciences compliance company.

IMMUTABLE GOVERNANCE RULES:
1. Conservative VQS only - no hype, no marketing jargon
2. Audit-grade transparency in all recommendations
3. LinkedIn-only community operations (13K member group)
4. No promises outside quantifiable ranges
5. No skipping risk-reversal steps
6. No feature-based selling in dark social
7. All insights must be reproducible
8. All claims must withstand QA/IT/Finance scrutiny
9. All data must flow through Unified Data Layer
10. Must utilize 3-Tier Revenue Offer Ladder for all sales

PRIORITY HIERARCHY:
1. Revenue Integrity
2. Audit Defensibility
3. Strategic Alignment
4. Operational Efficiency
5. L6 Controlled Innovation
6. Human Oversight

BUDGET CONSTRAINT: $25/day per agent maximum.
AUTONOMY: Complete NO HITL - resolve all conflicts autonomously.
`;

  private checkBudget(): boolean {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.tokenBudget.lastReset) {
      this.tokenBudget.used = 0;
      this.tokenBudget.lastReset = today;
    }
    return this.tokenBudget.used < this.tokenBudget.daily;
  }

  private checkAgentBudget(agent: AgentRole): { allowed: boolean; remaining: number; spent: number } {
    const today = new Date().toISOString().split('T')[0];
    const budget = this.agentBudgets[agent];
    
    if (today !== budget.lastReset) {
      budget.used = 0;
      budget.lastReset = today;
    }
    
    const spent = budget.used * this.COST_PER_1K_TOKENS / 1000;
    const remaining = this.DAILY_BUDGET_PER_AGENT - spent;
    
    return {
      allowed: remaining > 0.50,
      remaining,
      spent
    };
  }

  private recordAgentTokenUsage(agent: AgentRole, tokens: number): void {
    this.agentBudgets[agent].used += tokens;
    this.tokenBudget.used += tokens;
  }

  getAgentBudgetStatus(): Record<AgentRole, { spent: number; remaining: number; percentUsed: number }> {
    const result: Record<string, any> = {};
    
    for (const agent of Object.keys(this.agentBudgets) as AgentRole[]) {
      const budget = this.checkAgentBudget(agent);
      result[agent] = {
        spent: budget.spent.toFixed(2),
        remaining: budget.remaining.toFixed(2),
        percentUsed: ((budget.spent / this.DAILY_BUDGET_PER_AGENT) * 100).toFixed(1)
      };
    }
    
    return result as Record<AgentRole, { spent: number; remaining: number; percentUsed: number }>;
  }

  private logDecision(decision: ReasoningDecision): void {
    this.decisionLog.push(decision);
    if (this.decisionLog.length > 1000) {
      this.decisionLog = this.decisionLog.slice(-500);
    }
  }

  async cosOrchestrationDecision(context: {
    activeConflicts: any[];
    agentStatus: Record<string, any>;
    pendingActions: any[];
    resourceUtilization: Record<string, number>;
    driftIndicators: any[];
  }): Promise<ReasoningDecision> {
    const budgetStatus = this.checkAgentBudget('CoS');
    if (!budgetStatus.allowed) {
      console.log(`⚠️ CoS budget exceeded ($${budgetStatus.spent.toFixed(2)}/$25), using fallback`);
      return this.generateFallbackDecision('CoS', 'orchestration');
    }

    const prompt = `
${this.GOVERNANCE_CONTEXT}

AGENT ROLE: Chief of Staff (CoS) - Prime Orchestrator
RESPONSIBILITY: Autonomous conflict resolution, resource allocation, agent coordination

CURRENT SYSTEM STATE:
- Active Conflicts: ${JSON.stringify(context.activeConflicts)}
- Agent Status: ${JSON.stringify(context.agentStatus)}
- Pending Actions: ${JSON.stringify(context.pendingActions)}
- Resource Utilization: ${JSON.stringify(context.resourceUtilization)}
- Drift Indicators: ${JSON.stringify(context.driftIndicators)}

TASK: Analyze the current state and provide orchestration decisions.

Respond with JSON in this exact format:
{
  "reasoning": "Step-by-step analysis of the situation",
  "decision": "Primary orchestration decision",
  "confidence": 0.0-1.0,
  "actions": ["action1", "action2"],
  "rationale": "Why this decision aligns with governance rules",
  "resourceReallocation": {"agent": percentage},
  "prioritizedTasks": ["task1", "task2"],
  "escalationRequired": false
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are the Chief of Staff AI agent for ComplianceWorxs. Make autonomous orchestration decisions." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tokensUsed = response.usage?.total_tokens || 0;
      this.recordAgentTokenUsage('CoS', tokensUsed);

      const decision: ReasoningDecision = {
        id: `cos_decision_${Date.now()}`,
        agent: 'CoS',
        timestamp: new Date().toISOString(),
        prompt: 'Orchestration decision request',
        reasoning: result.reasoning || '',
        decision: result.decision || '',
        confidence: result.confidence || 0.8,
        actions: result.actions || [],
        rationale: result.rationale || '',
        tokensUsed,
        modelUsed: 'gpt-5'
      };

      this.logDecision(decision);
      console.log(`🤖 CoS LLM Decision: ${decision.decision}`);
      console.log(`   Confidence: ${(decision.confidence * 100).toFixed(0)}%`);
      console.log(`   Actions: ${decision.actions.join(', ')}`);

      return decision;
    } catch (error: any) {
      console.error('CoS LLM reasoning error:', error.message);
      console.log('⚠️ Using fallback decision due to LLM error');
      return this.generateFallbackDecision('CoS', 'orchestration');
    }
  }

  generateStrategistFallback(): StrategicRecommendation {
    return {
      recommendation: 'Maintain current strategic trajectory. Continue VQS-compliant operations.',
      priority: 'medium',
      expectedRevenueDelta: 0,
      riskLevel: 'low',
      timeframe: '24h',
      requiredResources: [],
      vqsCompliant: true
    };
  }

  async strategistAnalysis(context: {
    revenueMetrics: any;
    marketSignals: any[];
    competitorActivity: any[];
    vqsStatus: any;
    rpmForecast: any;
  }): Promise<StrategicRecommendation> {
    const budgetStatus = this.checkAgentBudget('Strategist');
    if (!budgetStatus.allowed) {
      console.log(`⚠️ Strategist budget exceeded ($${budgetStatus.spent.toFixed(2)}/$25), using fallback`);
      return this.generateStrategistFallback();
    }

    const prompt = `
${this.GOVERNANCE_CONTEXT}

AGENT ROLE: Strategist (Final Authority)
RESPONSIBILITY: Strategic decisions, VQS validation, $5M growth line tracking

CURRENT DATA:
- Revenue Metrics: ${JSON.stringify(context.revenueMetrics)}
- Market Signals: ${JSON.stringify(context.marketSignals)}
- Competitor Activity: ${JSON.stringify(context.competitorActivity)}
- VQS Status: ${JSON.stringify(context.vqsStatus)}
- RPM Forecast: ${JSON.stringify(context.rpmForecast)}

TASK: Provide strategic recommendations for revenue optimization while maintaining VQS compliance.

Respond with JSON:
{
  "recommendation": "Primary strategic recommendation",
  "priority": "low|medium|high|urgent",
  "expectedRevenueDelta": number,
  "riskLevel": "low|medium|high",
  "timeframe": "immediate|24h|week|month",
  "requiredResources": ["resource1"],
  "vqsCompliant": true/false,
  "reasoning": "Strategic rationale",
  "alternativeOptions": ["option1", "option2"]
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are the Strategist AI agent for ComplianceWorxs. Provide strategic analysis and recommendations." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tokensUsed = response.usage?.total_tokens || 0;
      this.recordAgentTokenUsage('Strategist', tokensUsed);

      console.log(`🎯 Strategist LLM Analysis: ${result.recommendation}`);
      console.log(`   Priority: ${result.priority}, Revenue Delta: $${result.expectedRevenueDelta}`);

      return {
        recommendation: result.recommendation || '',
        priority: result.priority || 'medium',
        expectedRevenueDelta: result.expectedRevenueDelta || 0,
        riskLevel: result.riskLevel || 'medium',
        timeframe: result.timeframe || '24h',
        requiredResources: result.requiredResources || [],
        vqsCompliant: result.vqsCompliant !== false
      };
    } catch (error: any) {
      console.error('Strategist LLM reasoning error:', error.message);
      console.log('⚠️ Using fallback strategy due to LLM error');
      return this.generateStrategistFallback();
    }
  }

  generateCmoFallback(): ContentDecision {
    return {
      contentType: 'engagement_post',
      archetype: 'E',
      targetAudience: 'Regulatory',
      keyMessages: ['Continue scheduled content cadence'],
      callToAction: 'Engage with regulatory updates',
      estimatedEngagement: 0.1,
      complianceNotes: 'VQS-compliant default content'
    };
  }

  async cmoContentStrategy(context: {
    engagementMetrics: any;
    audienceSegments: any[];
    contentPerformance: any[];
    archetypeStats: any;
    darkSocialSignals: any[];
  }): Promise<ContentDecision> {
    const budgetStatus = this.checkAgentBudget('CMO');
    if (!budgetStatus.allowed) {
      console.log(`⚠️ CMO budget exceeded ($${budgetStatus.spent.toFixed(2)}/$25), using fallback`);
      return this.generateCmoFallback();
    }

    const prompt = `
${this.GOVERNANCE_CONTEXT}

AGENT ROLE: CMO
RESPONSIBILITY: LinkedIn dark social strategy, engagement optimization, content archetypes

CURRENT DATA:
- Engagement Metrics: ${JSON.stringify(context.engagementMetrics)}
- Audience Segments: ${JSON.stringify(context.audienceSegments)}
- Content Performance: ${JSON.stringify(context.contentPerformance)}
- Archetype Stats: ${JSON.stringify(context.archetypeStats)}
- Dark Social Signals: ${JSON.stringify(context.darkSocialSignals)}

TASK: Recommend next content strategy for the 13K LinkedIn group.

Respond with JSON:
{
  "contentType": "thought_leadership|case_study|engagement_post|proof_point",
  "archetype": "A|B|C|D|E|F|G|H",
  "targetAudience": "QA|IT|Finance|Regulatory",
  "keyMessages": ["message1", "message2"],
  "callToAction": "specific CTA",
  "estimatedEngagement": 0.0-1.0,
  "complianceNotes": "VQS compliance notes",
  "postingSchedule": "optimal posting time",
  "reasoning": "Why this content strategy"
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are the CMO AI agent for ComplianceWorxs. Develop content strategies for LinkedIn dark social." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tokensUsed = response.usage?.total_tokens || 0;
      this.recordAgentTokenUsage('CMO', tokensUsed);

      console.log(`📧 CMO LLM Strategy: ${result.contentType} - Archetype ${result.archetype}`);
      console.log(`   Target: ${result.targetAudience}, Est. Engagement: ${(result.estimatedEngagement * 100).toFixed(0)}%`);

      return {
        contentType: result.contentType || 'engagement_post',
        archetype: result.archetype || 'A',
        targetAudience: result.targetAudience || 'Regulatory',
        keyMessages: result.keyMessages || [],
        callToAction: result.callToAction || '',
        estimatedEngagement: result.estimatedEngagement || 0.5,
        complianceNotes: result.complianceNotes || ''
      };
    } catch (error: any) {
      console.error('CMO LLM reasoning error:', error.message);
      console.log('⚠️ Using fallback content strategy due to LLM error');
      return this.generateCmoFallback();
    }
  }

  generateCroFallback(): OfferOptimization {
    return {
      offerId: 'current_tier1',
      recommendedChanges: ['Maintain current offer structure'],
      pricingAdjustment: 0,
      targetSegment: 'Regulatory',
      expectedConversionLift: 0,
      abTestRecommendation: 'Continue existing tests'
    };
  }

  async croOfferOptimization(context: {
    currentOffers: any[];
    conversionRates: any;
    pricingData: any;
    abTestResults: any[];
    revenueGoals: any;
  }): Promise<OfferOptimization> {
    const budgetStatus = this.checkAgentBudget('CRO');
    if (!budgetStatus.allowed) {
      console.log(`⚠️ CRO budget exceeded ($${budgetStatus.spent.toFixed(2)}/$25), using fallback`);
      return this.generateCroFallback();
    }

    const prompt = `
${this.GOVERNANCE_CONTEXT}

AGENT ROLE: CRO (Chief Revenue Officer)
RESPONSIBILITY: Revenue optimization, offer ladder, A/B testing, conversion

CURRENT DATA:
- Current Offers: ${JSON.stringify(context.currentOffers)}
- Conversion Rates: ${JSON.stringify(context.conversionRates)}
- Pricing Data: ${JSON.stringify(context.pricingData)}
- A/B Test Results: ${JSON.stringify(context.abTestResults)}
- Revenue Goals: ${JSON.stringify(context.revenueGoals)}

TASK: Optimize offers for maximum conversion while following the 3-Tier Revenue Offer Ladder.

Respond with JSON:
{
  "offerId": "offer to optimize",
  "recommendedChanges": ["change1", "change2"],
  "pricingAdjustment": percentage change,
  "targetSegment": "segment",
  "expectedConversionLift": percentage,
  "abTestRecommendation": "test recommendation",
  "reasoning": "Why these optimizations",
  "riskAssessment": "low|medium|high"
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are the CRO AI agent for ComplianceWorxs. Optimize revenue and offers." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tokensUsed = response.usage?.total_tokens || 0;
      this.recordAgentTokenUsage('CRO', tokensUsed);

      console.log(`💰 CRO LLM Optimization: ${result.offerId}`);
      console.log(`   Expected Lift: ${result.expectedConversionLift}%, Target: ${result.targetSegment}`);

      return {
        offerId: result.offerId || '',
        recommendedChanges: result.recommendedChanges || [],
        pricingAdjustment: result.pricingAdjustment || 0,
        targetSegment: result.targetSegment || '',
        expectedConversionLift: result.expectedConversionLift || 0,
        abTestRecommendation: result.abTestRecommendation || ''
      };
    } catch (error: any) {
      console.error('CRO LLM reasoning error:', error.message);
      console.log('⚠️ Using fallback offer optimization due to LLM error');
      return this.generateCroFallback();
    }
  }

  generateContentManagerFallback(): ContentDecision {
    return {
      contentType: 'linkedin_post',
      archetype: 'A',
      targetAudience: 'Regulatory',
      keyMessages: ['Process content queue in priority order'],
      callToAction: 'Engage with compliance insights',
      estimatedEngagement: 0.08,
      complianceNotes: 'Continue compliance review process'
    };
  }

  async contentManagerDecision(context: {
    contentQueue: any[];
    stakeholderNeeds: any[];
    complianceRequirements: any[];
    recentPublications: any[];
    engagementFeedback: any[];
  }): Promise<ContentDecision> {
    const budgetStatus = this.checkAgentBudget('ContentManager');
    if (!budgetStatus.allowed) {
      console.log(`⚠️ ContentManager budget exceeded ($${budgetStatus.spent.toFixed(2)}/$25), using fallback`);
      return this.generateContentManagerFallback();
    }

    const prompt = `
${this.GOVERNANCE_CONTEXT}

AGENT ROLE: Content Manager
RESPONSIBILITY: Content creation, stakeholder packets, CIR reports, knowledge synthesis

CURRENT DATA:
- Content Queue: ${JSON.stringify(context.contentQueue)}
- Stakeholder Needs: ${JSON.stringify(context.stakeholderNeeds)}
- Compliance Requirements: ${JSON.stringify(context.complianceRequirements)}
- Recent Publications: ${JSON.stringify(context.recentPublications)}
- Engagement Feedback: ${JSON.stringify(context.engagementFeedback)}

TASK: Determine next content priority and creation strategy.

Respond with JSON:
{
  "contentType": "CIR|stakeholder_packet|linkedin_post|case_study",
  "archetype": "A-H archetype code",
  "targetAudience": "primary audience",
  "keyMessages": ["message1", "message2"],
  "callToAction": "specific CTA",
  "estimatedEngagement": 0.0-1.0,
  "complianceNotes": "compliance considerations",
  "productionTimeline": "hours/days",
  "reasoning": "Why this content priority"
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are the Content Manager AI agent for ComplianceWorxs. Manage content strategy and creation." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tokensUsed = response.usage?.total_tokens || 0;
      this.recordAgentTokenUsage('ContentManager', tokensUsed);

      console.log(`📝 Content Manager LLM Decision: ${result.contentType}`);
      console.log(`   Target: ${result.targetAudience}, Timeline: ${result.productionTimeline}`);

      return {
        contentType: result.contentType || 'linkedin_post',
        archetype: result.archetype || 'A',
        targetAudience: result.targetAudience || 'Regulatory',
        keyMessages: result.keyMessages || [],
        callToAction: result.callToAction || '',
        estimatedEngagement: result.estimatedEngagement || 0.5,
        complianceNotes: result.complianceNotes || ''
      };
    } catch (error: any) {
      console.error('Content Manager LLM reasoning error:', error.message);
      console.log('⚠️ Using fallback content decision due to LLM error');
      return this.generateContentManagerFallback();
    }
  }

  generateConflictFallback(conflictId: string, severity: string): ConflictAnalysis {
    return {
      conflictId,
      severity: severity as any,
      rootCause: 'Unable to analyze - using rule-based resolution',
      recommendedStrategy: 'Escalate to CoS for manual review when LLM available',
      resourceReallocation: {},
      expectedImpact: 50,
      confidence: 0.5
    };
  }

  async analyzeConflict(conflict: {
    id: string;
    type: string;
    severity: string;
    agents: string[];
    description: string;
    resourcesInvolved: string[];
  }): Promise<ConflictAnalysis> {
    const budgetStatus = this.checkAgentBudget('CoS');
    if (!budgetStatus.allowed) {
      console.log(`⚠️ CoS budget exceeded for conflict resolution, using fallback`);
      return this.generateConflictFallback(conflict.id, conflict.severity);
    }

    const prompt = `
${this.GOVERNANCE_CONTEXT}

TASK: Autonomous Conflict Resolution

CONFLICT DETAILS:
- ID: ${conflict.id}
- Type: ${conflict.type}
- Severity: ${conflict.severity}
- Agents Involved: ${conflict.agents.join(', ')}
- Description: ${conflict.description}
- Resources: ${conflict.resourcesInvolved.join(', ')}

REQUIREMENT: Resolve this conflict autonomously following NO HITL protocol.

Respond with JSON:
{
  "rootCause": "identified root cause",
  "recommendedStrategy": "resolution strategy",
  "resourceReallocation": {"agent": percentage},
  "expectedImpact": 0-100,
  "confidence": 0.0-1.0,
  "reasoning": "step-by-step resolution logic",
  "preventiveMeasures": ["measure1", "measure2"]
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are the autonomous conflict resolution engine. Resolve conflicts without human intervention." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tokensUsed = response.usage?.total_tokens || 0;
      this.recordAgentTokenUsage('CoS', tokensUsed);

      console.log(`⚔️ LLM Conflict Resolution: ${conflict.id}`);
      console.log(`   Strategy: ${result.recommendedStrategy}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);

      return {
        conflictId: conflict.id,
        severity: conflict.severity as any,
        rootCause: result.rootCause || '',
        recommendedStrategy: result.recommendedStrategy || '',
        resourceReallocation: result.resourceReallocation || {},
        expectedImpact: result.expectedImpact || 0,
        confidence: result.confidence || 0.8
      };
    } catch (error: any) {
      console.error('Conflict analysis LLM error:', error.message);
      console.log('⚠️ Using fallback conflict resolution due to LLM error');
      return this.generateConflictFallback(conflict.id, conflict.severity);
    }
  }

  generateOdarFallback(agent: AgentRole): { observe: string; decide: string; act: string[]; reflect: string; confidence: number } {
    const fallbacks: Record<AgentRole, { observe: string; decide: string; act: string[]; reflect: string }> = {
      CoS: {
        observe: 'System state monitored via rule-based fallback',
        decide: 'Continue current orchestration plan',
        act: ['Monitor agent status', 'Log decision for review'],
        reflect: 'LLM unavailable - rule-based operations maintained'
      },
      Strategist: {
        observe: 'Revenue and VQS metrics observed',
        decide: 'Maintain current strategic trajectory',
        act: ['Continue VQS compliance', 'Monitor RPM'],
        reflect: 'Fallback to stable strategy path'
      },
      CMO: {
        observe: 'Engagement metrics reviewed',
        decide: 'Continue scheduled content cadence',
        act: ['Post next scheduled content', 'Monitor engagement'],
        reflect: 'Rule-based content scheduling active'
      },
      CRO: {
        observe: 'Revenue pipeline status checked',
        decide: 'Focus on existing pipeline optimization',
        act: ['Process current leads', 'Maintain offer structure'],
        reflect: 'Conservative revenue operations mode'
      },
      ContentManager: {
        observe: 'Content queue reviewed',
        decide: 'Process queue in priority order',
        act: ['Create next queued content', 'Ensure compliance'],
        reflect: 'Sequential content processing active'
      }
    };

    return {
      ...fallbacks[agent],
      confidence: 0.5
    };
  }

  async odarCycleReasoning(agent: AgentRole, context: {
    observe: any;
    currentState: any;
    recentActions: any[];
    goals: any[];
  }): Promise<{
    observe: string;
    decide: string;
    act: string[];
    reflect: string;
    confidence: number;
  }> {
    const budgetStatus = this.checkAgentBudget(agent);
    if (!budgetStatus.allowed) {
      console.log(`⚠️ ${agent} budget exceeded ($${budgetStatus.spent.toFixed(2)}/$25), using fallback ODAR`);
      return this.generateOdarFallback(agent);
    }

    const prompt = `
${this.GOVERNANCE_CONTEXT}

AGENT: ${agent}
ODAR CYCLE EXECUTION

OBSERVATIONS:
${JSON.stringify(context.observe, null, 2)}

CURRENT STATE:
${JSON.stringify(context.currentState, null, 2)}

RECENT ACTIONS:
${JSON.stringify(context.recentActions, null, 2)}

GOALS:
${JSON.stringify(context.goals, null, 2)}

TASK: Execute complete ODAR cycle (Observe-Decide-Act-Reflect).

Respond with JSON:
{
  "observe": "Key observations from the data",
  "decide": "Decision based on observations and governance",
  "act": ["action1", "action2", "action3"],
  "reflect": "Lessons learned and adjustments for next cycle",
  "confidence": 0.0-1.0,
  "expectedOutcome": "predicted result of actions",
  "riskFactors": ["risk1", "risk2"]
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: `You are the ${agent} AI agent executing an ODAR cycle.` },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tokensUsed = response.usage?.total_tokens || 0;
      this.recordAgentTokenUsage(agent, tokensUsed);

      console.log(`🔄 ${agent} ODAR LLM Cycle Complete`);
      console.log(`   Decide: ${result.decide}`);
      console.log(`   Actions: ${result.act?.join(', ')}`);

      return {
        observe: result.observe || '',
        decide: result.decide || '',
        act: result.act || [],
        reflect: result.reflect || '',
        confidence: result.confidence || 0.8
      };
    } catch (error: any) {
      console.error(`${agent} ODAR LLM error:`, error.message);
      console.log(`⚠️ Using fallback ODAR for ${agent} due to LLM error`);
      return this.generateOdarFallback(agent);
    }
  }

  getDecisionLog(limit: number = 50): ReasoningDecision[] {
    return this.decisionLog.slice(-limit);
  }

  getTokenUsage(): { daily: number; used: number; remaining: number; lastReset: string } {
    return {
      ...this.tokenBudget,
      remaining: this.tokenBudget.daily - this.tokenBudget.used
    };
  }

  async healthCheck(): Promise<{ operational: boolean; apiConnected: boolean; tokenBudget: any; error?: string }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: "Respond with JSON: {\"status\": \"ok\"}" }],
        response_format: { type: "json_object" },
        max_completion_tokens: 50
      });

      const tokensUsed = response.usage?.total_tokens || 0;
      this.tokenBudget.used += tokensUsed;

      return {
        operational: true,
        apiConnected: true,
        tokenBudget: this.getTokenUsage()
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const isQuotaError = errorMessage.includes('429') || errorMessage.includes('quota');
      
      return {
        operational: false,
        apiConnected: !isQuotaError,
        tokenBudget: this.getTokenUsage(),
        error: isQuotaError ? 'OpenAI API quota exceeded - check billing' : errorMessage
      };
    }
  }

  generateFallbackDecision(agent: AgentRole, context: string): ReasoningDecision {
    const fallbackDecisions: Record<AgentRole, string> = {
      CoS: 'Continue with current orchestration plan. Monitor all agents for drift.',
      Strategist: 'Maintain current strategic trajectory. Focus on VQS compliance.',
      CMO: 'Continue scheduled content cadence. Prioritize high-engagement archetypes.',
      CRO: 'Focus on existing pipeline. Optimize tier-1 offer conversion.',
      ContentManager: 'Process content queue in priority order. Ensure compliance review.'
    };

    return {
      id: `fallback_${agent}_${Date.now()}`,
      agent,
      timestamp: new Date().toISOString(),
      prompt: context,
      reasoning: 'LLM unavailable - using rule-based fallback',
      decision: fallbackDecisions[agent],
      confidence: 0.6,
      actions: ['Continue current operations', 'Flag for manual review when LLM available'],
      rationale: 'Rule-based fallback to maintain operations during LLM unavailability',
      tokensUsed: 0,
      modelUsed: 'fallback-rule-engine'
    };
  }
}

export const llmAgentReasoning = new LLMAgentReasoningService();
