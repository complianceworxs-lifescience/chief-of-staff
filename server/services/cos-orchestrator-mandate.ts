/**
 * CHIEF OF STAFF ORCHESTRATOR MANDATE (Enhanced v1.1)
 * ====================================================
 * 
 * MANDATE:
 * Continuously maximize the ARR Predictability Score and Enterprise Valuation Index 
 * by governing all agents through data-driven constraint checks, outcome feedback 
 * loops, and enforced revenue alignment.
 * 
 * CONTROL PLANE FUNCTION:
 * Operate as the enterprise-wide arbitration layer: activate agents, validate outputs, 
 * monitor performance deltas, and update agent-level directives based on historical 
 * success patterns. Route all actions through valuation logic before execution.
 * 
 * AUTONOMY & LEARNING:
 * Specialized agents operate independently but must submit outputs for validation. 
 * The CoS logs vetoes, updates agent feedback vectors, and triggers iterative 
 * refinement cycles to strengthen system-wide predictive accuracy.
 * 
 * This is the SINGLE MASTER DIRECTIVE for the Chief of Staff Agent.
 */

import { storage } from '../storage.js';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// IMMUTABLE GOVERNANCE RULES (Enhanced Clarity)
// ============================================
export const STRATEGIC_CONSTRAINTS = {
  CONSTRAINT_1: {
    id: 'SC-001',
    name: 'REJECT_UNMEASURABLE_TACTICS',
    description: 'Reject any tactic not tied to measurable revenue acceleration.',
    keywords: ['vanity metrics', 'engagement-only', 'brand awareness without attribution', 'spray and pray', 'general awareness'],
    checkFunction: 'rejectUnmeasurableTactics'
  },
  CONSTRAINT_2: {
    id: 'SC-002',
    name: 'REJECT_ENGINE_VIOLATIONS',
    description: 'Reject initiatives outside the 3-layer engine unless proven to increase ARR Predictability.',
    keywords: ['multiple campaigns', 'fragmented effort', 'scattered focus', 'new channel without ROI', 'side project'],
    checkFunction: 'rejectEngineViolations'
  },
  CONSTRAINT_3: {
    id: 'SC-003',
    name: 'REJECT_VANITY_OPTIMIZATION',
    description: 'Reject outputs optimized for vanity (likes, opens, followers).',
    keywords: ['likes', 'shares', 'impressions', 'reach', 'engagement rate', 'followers', 'open rate only'],
    conversionKeywords: ['conversion', 'revenue', 'ARR', 'MRR', 'paid', 'purchase', 'close rate', 'deal signed'],
    checkFunction: 'rejectVanityOptimization'
  },
  CONSTRAINT_4: {
    id: 'SC-004',
    name: 'REQUIRE_REVENUE_MAPPING',
    description: 'All actions must map to: ARR growth, MRR stability, pipeline velocity, churn reduction, or monetized asset creation.',
    revenueKeywords: ['ARR', 'MRR', 'pipeline', 'revenue', 'deal value', 'contract value', 'LTV', 'CAC', 'churn', 'retention', 'monetized asset'],
    validMappings: ['ARR growth', 'MRR stability', 'pipeline velocity', 'churn reduction', 'monetized asset creation'],
    checkFunction: 'requireRevenueMapping'
  }
} as const;

// ============================================
// VALUATION LOGIC GATE
// All actions must pass through this before execution
// ============================================
export interface ValuationCheckResult {
  passed: boolean;
  valuationScore: number;
  arrPredictabilityImpact: number;
  enterpriseValuationDelta: number;
  reasoning: string;
}

// ============================================
// TYPES
// ============================================
export interface AgentAction {
  id: string;
  agentId: string;
  agentType: 'Strategic' | 'CMO' | 'CRO' | 'ContentManager';
  action: string;
  description: string;
  expectedOutcome: string;
  targetMetrics?: string[];
  revenueImpact?: {
    type: 'ARR' | 'MRR' | 'pipeline' | 'none';
    estimatedValue?: number;
    confidence?: number;
  };
  timestamp: string;
}

export interface ConstraintViolation {
  id: string;
  actionId: string;
  agentId: string;
  constraintId: string;
  constraintName: string;
  violationReason: string;
  violationDetails: string;
  severity: 'warning' | 'veto';
  timestamp: string;
  feedbackDelivered: boolean;
  feedbackContent?: string;
}

export interface AuditResult {
  actionId: string;
  agentId: string;
  status: 'APPROVED' | 'VETOED' | 'WARNING';
  constraintsChecked: string[];
  violations: ConstraintViolation[];
  feedbackToAgent?: string;
  timestamp: string;
}

export interface MandateState {
  version: string;
  lastUpdated: string;
  totalActionsAudited: number;
  totalVetoes: number;
  totalWarnings: number;
  constraintViolationCounts: Record<string, number>;
  agentFeedbackHistory: AgentFeedback[];
  recentAudits: AuditResult[];
}

export interface AgentFeedback {
  id: string;
  agentId: string;
  violatedConstraint: string;
  feedback: string;
  deliveredAt: string;
  acknowledgedAt?: string;
}

// ============================================
// COS ORCHESTRATOR MANDATE SERVICE
// ============================================
class CoSOrchestatorMandateService {
  private state: MandateState;
  private stateFilePath = 'state/cos-orchestrator-mandate.json';

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): MandateState {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        return JSON.parse(fs.readFileSync(this.stateFilePath, 'utf-8'));
      }
    } catch (error: any) {
      console.log('📋 CoS Mandate: Initializing fresh state');
    }
    
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalActionsAudited: 0,
      totalVetoes: 0,
      totalWarnings: 0,
      constraintViolationCounts: {
        'SC-001': 0,
        'SC-002': 0,
        'SC-003': 0,
        'SC-004': 0
      },
      agentFeedbackHistory: [],
      recentAudits: []
    };
  }

  private saveState(): void {
    try {
      const dir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('❌ CoS Mandate: Failed to save state:', error);
    }
  }

  // ============================================
  // CORE MANDATE FUNCTION: AUDIT AGENT ACTION
  // ============================================
  async auditAgentAction(action: AgentAction): Promise<AuditResult> {
    console.log(`🔍 CoS Mandate: Auditing action from ${action.agentType} Agent`);
    
    const violations: ConstraintViolation[] = [];
    const constraintsChecked: string[] = [];

    // Check all 4 immutable constraints
    const constraint1Result = this.checkConstraint1(action);
    constraintsChecked.push(STRATEGIC_CONSTRAINTS.CONSTRAINT_1.id);
    if (constraint1Result) violations.push(constraint1Result);

    const constraint2Result = this.checkConstraint2(action);
    constraintsChecked.push(STRATEGIC_CONSTRAINTS.CONSTRAINT_2.id);
    if (constraint2Result) violations.push(constraint2Result);

    const constraint3Result = this.checkConstraint3(action);
    constraintsChecked.push(STRATEGIC_CONSTRAINTS.CONSTRAINT_3.id);
    if (constraint3Result) violations.push(constraint3Result);

    const constraint4Result = this.checkConstraint4(action);
    constraintsChecked.push(STRATEGIC_CONSTRAINTS.CONSTRAINT_4.id);
    if (constraint4Result) violations.push(constraint4Result);

    // Determine final status
    const hasVeto = violations.some(v => v.severity === 'veto');
    const hasWarning = violations.some(v => v.severity === 'warning');
    
    let status: 'APPROVED' | 'VETOED' | 'WARNING' = 'APPROVED';
    if (hasVeto) {
      status = 'VETOED';
      this.state.totalVetoes++;
    } else if (hasWarning) {
      status = 'WARNING';
      this.state.totalWarnings++;
    }

    // Generate feedback for agent if violations exist
    let feedbackToAgent: string | undefined;
    if (violations.length > 0) {
      feedbackToAgent = this.generateAgentFeedback(action, violations);
      await this.deliverFeedbackToAgent(action.agentId, action.agentType, feedbackToAgent, violations);
    }

    // Update state
    this.state.totalActionsAudited++;
    violations.forEach(v => {
      this.state.constraintViolationCounts[v.constraintId]++;
    });

    const auditResult: AuditResult = {
      actionId: action.id,
      agentId: action.agentId,
      status,
      constraintsChecked,
      violations,
      feedbackToAgent,
      timestamp: new Date().toISOString()
    };

    // Keep recent audits (last 100)
    this.state.recentAudits.unshift(auditResult);
    if (this.state.recentAudits.length > 100) {
      this.state.recentAudits = this.state.recentAudits.slice(0, 100);
    }

    this.state.lastUpdated = new Date().toISOString();
    this.saveState();

    // Log the result
    if (status === 'VETOED') {
      console.log(`🚫 CoS Mandate: VETOED action from ${action.agentType} - ${violations.map(v => v.constraintName).join(', ')}`);
    } else if (status === 'WARNING') {
      console.log(`⚠️ CoS Mandate: WARNING for ${action.agentType} - ${violations.map(v => v.constraintName).join(', ')}`);
    } else {
      console.log(`✅ CoS Mandate: APPROVED action from ${action.agentType}`);
    }

    return auditResult;
  }

  // ============================================
  // CONSTRAINT CHECKS
  // ============================================

  /**
   * Constraint 1: Reject conventional marketing tactics that produce noise
   */
  private checkConstraint1(action: AgentAction): ConstraintViolation | null {
    const noiseIndicators = [
      'brand awareness campaign',
      'social media presence',
      'content calendar',
      'engagement campaign',
      'influencer outreach',
      'viral marketing',
      'thought leadership',
      'community building'
    ];

    const actionText = `${action.action} ${action.description} ${action.expectedOutcome}`.toLowerCase();
    
    // Check for noise indicators without clear revenue tie
    for (const indicator of noiseIndicators) {
      if (actionText.includes(indicator.toLowerCase())) {
        // Check if there's a clear revenue connection
        const hasRevenueTie = action.revenueImpact && action.revenueImpact.type !== 'none';
        const hasRevenueKeywords = STRATEGIC_CONSTRAINTS.CONSTRAINT_4.revenueKeywords.some(
          kw => actionText.includes(kw.toLowerCase())
        );

        if (!hasRevenueTie && !hasRevenueKeywords) {
          return {
            id: nanoid(),
            actionId: action.id,
            agentId: action.agentId,
            constraintId: 'SC-001',
            constraintName: 'REJECT_CONVENTIONAL_NOISE',
            violationReason: `Action appears to be conventional marketing noise: "${indicator}"`,
            violationDetails: `Detected noise indicator without clear revenue attribution. Actions must produce measurable revenue impact, not vanity metrics.`,
            severity: 'veto',
            timestamp: new Date().toISOString(),
            feedbackDelivered: false
          };
        }
      }
    }

    return null;
  }

  /**
   * Constraint 2: Reject campaign proliferation
   */
  private checkConstraint2(action: AgentAction): ConstraintViolation | null {
    const proliferationIndicators = [
      'new campaign',
      'additional channel',
      'launch another',
      'spin up',
      'test new platform',
      'expand to',
      'add new touchpoint',
      'create separate'
    ];

    const actionText = `${action.action} ${action.description}`.toLowerCase();
    
    for (const indicator of proliferationIndicators) {
      if (actionText.includes(indicator.toLowerCase())) {
        // Check if it's supporting the 3-layer engine
        const supportsEngine = actionText.includes('strategic') || 
                              actionText.includes('nurture') || 
                              actionText.includes('conversion') ||
                              actionText.includes('pipeline');

        if (!supportsEngine) {
          return {
            id: nanoid(),
            actionId: action.id,
            agentId: action.agentId,
            constraintId: 'SC-002',
            constraintName: 'REJECT_CAMPAIGN_PROLIFERATION',
            violationReason: `Action suggests campaign proliferation: "${indicator}"`,
            violationDetails: `All actions must support the 3-layer revenue engine (Strategic → CMO → CRO). Adding new campaigns/channels without clear engine alignment is prohibited.`,
            severity: 'veto',
            timestamp: new Date().toISOString(),
            feedbackDelivered: false
          };
        }
      }
    }

    return null;
  }

  /**
   * Constraint 3: Optimize for conversion, not engagement
   */
  private checkConstraint3(action: AgentAction): ConstraintViolation | null {
    const engagementOnlyMetrics = ['likes', 'shares', 'impressions', 'reach', 'followers', 'views', 'engagement rate', 'open rate'];
    const conversionMetrics = ['conversion', 'revenue', 'arr', 'mrr', 'paid', 'purchase', 'close', 'deal', 'signed', 'contract'];

    const targetMetrics = action.targetMetrics?.map(m => m.toLowerCase()) || [];
    const actionText = `${action.action} ${action.description} ${action.expectedOutcome}`.toLowerCase();
    const allText = [...targetMetrics, actionText].join(' ');

    // Count engagement vs conversion focus
    let engagementFocus = 0;
    let conversionFocus = 0;

    for (const metric of engagementOnlyMetrics) {
      if (allText.includes(metric)) engagementFocus++;
    }

    for (const metric of conversionMetrics) {
      if (allText.includes(metric)) conversionFocus++;
    }

    // If primarily focused on engagement without conversion
    if (engagementFocus > 0 && conversionFocus === 0) {
      return {
        id: nanoid(),
        actionId: action.id,
        agentId: action.agentId,
        constraintId: 'SC-003',
        constraintName: 'OPTIMIZE_FOR_CONVERSION',
        violationReason: `Action optimizes for engagement metrics without conversion tie`,
        violationDetails: `Detected focus on engagement metrics (${engagementOnlyMetrics.filter(m => allText.includes(m)).join(', ')}) without conversion goals. All actions must optimize for conversion to paid value.`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
        feedbackDelivered: false
      };
    }

    return null;
  }

  /**
   * Constraint 4: All actions must tie to ARR, MRR, or pipeline value
   */
  private checkConstraint4(action: AgentAction): ConstraintViolation | null {
    // Check explicit revenue impact
    if (action.revenueImpact && action.revenueImpact.type !== 'none' && action.revenueImpact.estimatedValue) {
      return null; // Has clear revenue tie
    }

    // Check for revenue keywords in action description
    const actionText = `${action.action} ${action.description} ${action.expectedOutcome}`.toLowerCase();
    const hasRevenueTie = STRATEGIC_CONSTRAINTS.CONSTRAINT_4.revenueKeywords.some(
      kw => actionText.includes(kw.toLowerCase())
    );

    if (!hasRevenueTie) {
      return {
        id: nanoid(),
        actionId: action.id,
        agentId: action.agentId,
        constraintId: 'SC-004',
        constraintName: 'TIE_TO_REVENUE',
        violationReason: `Action does not tie to ARR, MRR, or pipeline value`,
        violationDetails: `All agent actions must have a clear connection to revenue metrics. Add revenueImpact with estimated value, or clearly state ARR/MRR/pipeline impact.`,
        severity: 'veto',
        timestamp: new Date().toISOString(),
        feedbackDelivered: false
      };
    }

    return null;
  }

  // ============================================
  // FEEDBACK MECHANISM
  // ============================================

  private generateAgentFeedback(action: AgentAction, violations: ConstraintViolation[]): string {
    const violationSummaries = violations.map(v => 
      `- ${v.constraintName}: ${v.violationReason}`
    ).join('\n');

    return `
CHIEF OF STAFF FEEDBACK - ACTION AUDIT RESULT
==============================================
Agent: ${action.agentType}
Action ID: ${action.id}
Status: ${violations.some(v => v.severity === 'veto') ? 'VETOED' : 'WARNING'}

CONSTRAINT VIOLATIONS:
${violationSummaries}

REQUIRED CORRECTION:
${violations.map(v => `• ${v.violationDetails}`).join('\n')}

GUIDANCE:
All actions must:
1. Produce measurable revenue impact (ARR/MRR/pipeline)
2. Support the 3-layer revenue engine (Strategic → CMO → CRO)
3. Optimize for conversion, not engagement
4. Reject noise-producing tactics

Please adjust your action to meet these constraints and resubmit.
    `.trim();
  }

  private async deliverFeedbackToAgent(
    agentId: string, 
    agentType: string, 
    feedback: string, 
    violations: ConstraintViolation[]
  ): Promise<void> {
    const feedbackRecord: AgentFeedback = {
      id: nanoid(),
      agentId,
      violatedConstraint: violations.map(v => v.constraintId).join(', '),
      feedback,
      deliveredAt: new Date().toISOString()
    };

    this.state.agentFeedbackHistory.unshift(feedbackRecord);
    
    // Keep last 200 feedback records
    if (this.state.agentFeedbackHistory.length > 200) {
      this.state.agentFeedbackHistory = this.state.agentFeedbackHistory.slice(0, 200);
    }

    // Log for agent communication
    try {
      await storage.createAgentCommunication({
        fromAgent: 'ChiefOfStaff',
        toAgent: agentType,
        content: feedback,
        type: 'feedback',
        action: 'constraint_violation'
      });
    } catch (error) {
      console.error('Failed to store agent feedback communication:', error);
    }

    console.log(`📨 CoS Mandate: Feedback delivered to ${agentType} Agent`);
  }

  // ============================================
  // ORCHESTRATION FUNCTIONS
  // ============================================

  /**
   * Validate the three-layer revenue engine flow
   * Strategic → CMO → CRO
   */
  validateRevenueEngineFlow(actions: AgentAction[]): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Group actions by agent type
    const byAgent = {
      Strategic: actions.filter(a => a.agentType === 'Strategic'),
      CMO: actions.filter(a => a.agentType === 'CMO'),
      CRO: actions.filter(a => a.agentType === 'CRO')
    };

    // Check flow integrity
    if (byAgent.Strategic.length === 0) {
      issues.push('No Strategic layer actions - revenue engine has no direction');
      recommendations.push('Strategic Agent must provide market positioning and ICP guidance');
    }

    if (byAgent.CMO.length === 0 && byAgent.Strategic.length > 0) {
      issues.push('Strategic actions without CMO execution - demand generation gap');
      recommendations.push('CMO Agent must translate strategic direction into nurture sequences');
    }

    if (byAgent.CRO.length === 0 && byAgent.CMO.length > 0) {
      issues.push('CMO actions without CRO conversion - revenue capture gap');
      recommendations.push('CRO Agent must convert CMO-generated leads to revenue');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Get mandate status for dashboard/reporting
   */
  getMandateStatus(): {
    version: string;
    constraintsActive: number;
    totalAudits: number;
    vetoRate: number;
    warningRate: number;
    topViolatedConstraint: { id: string; name: string; count: number } | null;
    recentVetoes: AuditResult[];
  } {
    const totalViolations = Object.values(this.state.constraintViolationCounts).reduce((a, b) => a + b, 0);
    
    // Find top violated constraint
    let topViolated: { id: string; name: string; count: number } | null = null;
    let maxCount = 0;
    
    for (const [id, count] of Object.entries(this.state.constraintViolationCounts)) {
      if (count > maxCount) {
        maxCount = count;
        const constraint = Object.values(STRATEGIC_CONSTRAINTS).find(c => c.id === id);
        topViolated = {
          id,
          name: constraint?.name || id,
          count
        };
      }
    }

    return {
      version: this.state.version,
      constraintsActive: 4,
      totalAudits: this.state.totalActionsAudited,
      vetoRate: this.state.totalActionsAudited > 0 
        ? (this.state.totalVetoes / this.state.totalActionsAudited) * 100 
        : 0,
      warningRate: this.state.totalActionsAudited > 0 
        ? (this.state.totalWarnings / this.state.totalActionsAudited) * 100 
        : 0,
      topViolatedConstraint: topViolated,
      recentVetoes: this.state.recentAudits.filter(a => a.status === 'VETOED').slice(0, 10)
    };
  }

  /**
   * Get the full mandate text for reference (Enhanced v1.1)
   */
  getMandateText(): string {
    return `
CHIEF OF STAFF ORCHESTRATOR MANDATE v${this.state.version} (Enhanced)
======================================================================

MANDATE:
Continuously maximize the ARR Predictability Score and Enterprise 
Valuation Index by governing all agents through data-driven constraint 
checks, outcome feedback loops, and enforced revenue alignment.

CONTROL PLANE FUNCTION:
Operate as the enterprise-wide arbitration layer: activate agents, 
validate outputs, monitor performance deltas, and update agent-level 
directives based on historical success patterns. Route all actions 
through valuation logic before execution.

GOVERNANCE RULES (Enhanced Clarity):

1. ${STRATEGIC_CONSTRAINTS.CONSTRAINT_1.name}
   ${STRATEGIC_CONSTRAINTS.CONSTRAINT_1.description}

2. ${STRATEGIC_CONSTRAINTS.CONSTRAINT_2.name}
   ${STRATEGIC_CONSTRAINTS.CONSTRAINT_2.description}

3. ${STRATEGIC_CONSTRAINTS.CONSTRAINT_3.name}
   ${STRATEGIC_CONSTRAINTS.CONSTRAINT_3.description}

4. ${STRATEGIC_CONSTRAINTS.CONSTRAINT_4.name}
   ${STRATEGIC_CONSTRAINTS.CONSTRAINT_4.description}

AUTONOMY & LEARNING:
Specialized agents operate independently but must submit outputs for 
validation. The CoS logs vetoes, updates agent feedback vectors, and 
triggers iterative refinement cycles to strengthen system-wide 
predictive accuracy.

THREE-LAYER REVENUE ENGINE:
Strategic Agent → CMO Agent → CRO Agent
(Direction)     → (Demand)  → (Conversion)
    `.trim();
  }

  /**
   * Route action through valuation logic before execution
   */
  routeThroughValuationLogic(action: AgentAction): ValuationCheckResult {
    let score = 100;
    let arrImpact = 0;
    let valuationDelta = 0;
    const reasons: string[] = [];

    // Check for explicit revenue impact
    if (action.revenueImpact && action.revenueImpact.type !== 'none') {
      const value = action.revenueImpact.estimatedValue || 0;
      const confidence = action.revenueImpact.confidence || 0.5;
      
      switch (action.revenueImpact.type) {
        case 'ARR':
          arrImpact = value * confidence;
          valuationDelta = arrImpact * 10; // 10x ARR multiple for SaaS
          reasons.push(`Direct ARR impact: $${value.toLocaleString()} at ${(confidence * 100).toFixed(0)}% confidence`);
          break;
        case 'MRR':
          arrImpact = value * 12 * confidence; // Annualize MRR
          valuationDelta = arrImpact * 10;
          reasons.push(`MRR impact: $${value.toLocaleString()}/mo → $${arrImpact.toLocaleString()} ARR`);
          break;
        case 'pipeline':
          arrImpact = value * 0.25 * confidence; // 25% pipeline conversion
          valuationDelta = arrImpact * 10;
          reasons.push(`Pipeline value: $${value.toLocaleString()} → $${arrImpact.toLocaleString()} expected ARR`);
          break;
      }
    } else {
      score -= 30;
      reasons.push('No explicit revenue impact defined');
    }

    // Check action alignment with revenue keywords
    const actionText = `${action.action} ${action.description} ${action.expectedOutcome}`.toLowerCase();
    const revenueKeywords = STRATEGIC_CONSTRAINTS.CONSTRAINT_4.revenueKeywords;
    const matchedKeywords = revenueKeywords.filter(kw => actionText.includes(kw.toLowerCase()));
    
    if (matchedKeywords.length > 0) {
      score += matchedKeywords.length * 5;
      reasons.push(`Revenue-aligned keywords: ${matchedKeywords.join(', ')}`);
    }

    // Check for vanity metrics (penalty)
    const vanityKeywords = STRATEGIC_CONSTRAINTS.CONSTRAINT_3.keywords;
    const vanityMatches = vanityKeywords.filter(kw => actionText.includes(kw.toLowerCase()));
    
    if (vanityMatches.length > 0) {
      score -= vanityMatches.length * 15;
      reasons.push(`Warning: Vanity metric focus detected: ${vanityMatches.join(', ')}`);
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));
    const passed = score >= 50;

    return {
      passed,
      valuationScore: score,
      arrPredictabilityImpact: arrImpact,
      enterpriseValuationDelta: valuationDelta,
      reasoning: reasons.join('. ')
    };
  }

  /**
   * Update agent feedback vectors based on audit results
   */
  async updateAgentFeedbackVector(agentId: string, auditResult: AuditResult): Promise<void> {
    const feedbackVector = {
      agentId,
      lastAuditStatus: auditResult.status,
      violationHistory: auditResult.violations.map(v => ({
        constraintId: v.constraintId,
        timestamp: v.timestamp
      })),
      refinementSuggestion: auditResult.feedbackToAgent,
      updatedAt: new Date().toISOString()
    };

    console.log(`📊 CoS Mandate: Updated feedback vector for ${agentId}`);
    
    // Store in agent communication for the agent to consume
    try {
      await storage.createAgentCommunication({
        fromAgent: 'ChiefOfStaff',
        toAgent: agentId,
        content: JSON.stringify(feedbackVector),
        type: 'feedback_vector_update',
        action: 'refinement_cycle'
      });
    } catch (error) {
      console.error('Failed to store feedback vector:', error);
    }
  }
}

// Export singleton instance
export const cosOrchestratorMandate = new CoSOrchestatorMandateService();

// Export for direct API use
export default cosOrchestratorMandate;

// ============================================
// EXECUTION GATE - Called from Action Tracker
// This is the mandatory gate all agent actions must pass
// ============================================
export interface CoSGateResult {
  allowed: boolean;
  status: 'APPROVED' | 'VETOED' | 'WARNING';
  constraintAudit: AuditResult;
  valuationCheck: ValuationCheckResult;
  blockReason?: string;
  feedbackToAgent?: string;
}

/**
 * CoS Execution Gate - MANDATORY for all agent actions
 * 
 * This function combines:
 * 1. Constraint audit (4 immutable rules)
 * 2. Valuation logic check (ARR/MRR impact scoring)
 * 
 * Returns whether the action can proceed to execution
 */
export async function cosExecutionGate(
  actionId: string,
  agentId: string,
  agentType: string,
  actionTitle: string,
  actionDescription: string,
  expectedOutcome: string,
  revenueImpact?: {
    type: 'ARR' | 'MRR' | 'pipeline' | 'none';
    estimatedValue?: number;
    confidence?: number;
  }
): Promise<CoSGateResult> {
  console.log(`🚦 CoS EXECUTION GATE: Processing action from ${agentType}`);
  
  // Build action object
  const action: AgentAction = {
    id: actionId,
    agentId,
    agentType: agentType as any,
    action: actionTitle,
    description: actionDescription,
    expectedOutcome,
    revenueImpact: revenueImpact || { type: 'none' },
    timestamp: new Date().toISOString()
  };

  // Step 1: Constraint Audit
  const constraintAudit = await cosOrchestratorMandate.auditAgentAction(action);
  
  // Step 2: Valuation Logic Check
  const valuationCheck = cosOrchestratorMandate.routeThroughValuationLogic(action);

  // Determine if action is allowed
  let allowed = true;
  let blockReason: string | undefined;

  // Block if VETOED by constraints
  if (constraintAudit.status === 'VETOED') {
    allowed = false;
    blockReason = `CoS MANDATE VETOED: ${constraintAudit.violations.map(v => v.constraintName).join(', ')}`;
  }
  
  // Block if valuation score too low (< 30 is definite block)
  if (valuationCheck.valuationScore < 30) {
    allowed = false;
    blockReason = blockReason 
      ? `${blockReason} | Valuation Score: ${valuationCheck.valuationScore}/100 (minimum 30)`
      : `Valuation Score too low: ${valuationCheck.valuationScore}/100 (minimum 30 required)`;
  }

  // Log gate decision
  if (allowed) {
    console.log(`✅ CoS GATE PASSED: ${agentType} action approved (Valuation: ${valuationCheck.valuationScore}/100)`);
  } else {
    console.log(`🚫 CoS GATE BLOCKED: ${agentType} action rejected`);
    console.log(`   Reason: ${blockReason}`);
  }

  return {
    allowed,
    status: constraintAudit.status,
    constraintAudit,
    valuationCheck,
    blockReason,
    feedbackToAgent: constraintAudit.feedbackToAgent
  };
}

/**
 * Quick check for action-tracker integration
 * Returns simple pass/fail without full audit trail
 */
export function quickCoSCheck(
  actionTitle: string,
  actionDescription: string,
  agentType: string
): { pass: boolean; reason: string } {
  const actionText = `${actionTitle} ${actionDescription}`.toLowerCase();
  
  // Quick check for revenue keywords
  const hasRevenueTie = STRATEGIC_CONSTRAINTS.CONSTRAINT_4.revenueKeywords.some(
    kw => actionText.includes(kw.toLowerCase())
  );
  
  // Quick check for vanity metrics
  const vanityKeywords = STRATEGIC_CONSTRAINTS.CONSTRAINT_3.keywords;
  const hasVanityFocus = vanityKeywords.some(kw => actionText.includes(kw.toLowerCase()));
  
  // Quick check for noise indicators
  const noiseIndicators = ['brand awareness', 'social presence', 'engagement only', 'followers'];
  const isNoise = noiseIndicators.some(n => actionText.includes(n));
  
  if (isNoise && !hasRevenueTie) {
    return { pass: false, reason: 'Action appears to be noise without revenue tie' };
  }
  
  if (hasVanityFocus && !hasRevenueTie) {
    return { pass: false, reason: 'Action focuses on vanity metrics without conversion goal' };
  }
  
  if (!hasRevenueTie) {
    return { pass: false, reason: 'No clear revenue connection (ARR/MRR/pipeline)' };
  }
  
  return { pass: true, reason: 'Revenue-aligned action' };
}
