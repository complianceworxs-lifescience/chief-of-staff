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
// L7 MASTER DIRECTIVE GUARDRAILS
// System-Level Immutable Rules from L7 Revenue-First Operating System
// ============================================
export const L7_GUARDRAILS = {
  minimumRevenueProbability7Day: 0.15,
  requiredAttributionLogging: true,
  spendCapDaily: 25,
  spendCapWeekly: 150,
  // ROI-BASED BUDGET EXCEPTIONS (New)
  roiBasedBudgetExceptions: {
    enabled: true,
    minROIThreshold: 3.0,  // Allow higher spend if projected ROI > 3x
    maxSpendWithROI: 150,  // Maximum daily spend with ROI exception
    requiresConfidenceLevel: 0.7,  // Minimum confidence for ROI projection
    weeklySpendWithROI: 500  // Maximum weekly with ROI exception
  },
  forbiddenActions: [
    'noise_content',
    'vanity_metrics',
    'non_revenue_activities',
    'engagement_only_optimization'
  ],
  valuationRules: {
    rejectPredictabilityDecrease: true,
    rejectLTVDecrease: true,
    rejectARRInstability: true
  },
  corePrinciple: 'If an action cannot be traced to revenue, probability of revenue, or ARR stability → it is vetoed.'
} as const;

// ============================================
// POSITIVE FEEDBACK LOOPS (New)
// Reward signals for high-performing agents and actions
// ============================================
export interface PositiveFeedbackRecord {
  id: string;
  agentId: string;
  agentType: string;
  actionId: string;
  revenueGenerated: number;
  revenueType: 'ARR' | 'MRR' | 'pipeline' | 'conversion';
  performanceScore: number;
  recordedAt: string;
  autoPromoted: boolean;
}

export const POSITIVE_FEEDBACK_CONFIG = {
  enabled: true,
  // Auto-promotion thresholds
  autoPromoteThreshold: {
    consecutiveSuccesses: 3,
    revenueThreshold: 5000,
    performanceScore: 85
  },
  // Reward signals
  rewardSignals: {
    revenueGenerated: { weight: 0.4, boost: 1.2 },
    conversionRate: { weight: 0.3, boost: 1.15 },
    timeToConversion: { weight: 0.2, boost: 1.1 },
    repeatSuccess: { weight: 0.1, boost: 1.25 }
  },
  // Autonomy level increases
  autonomyBoosts: {
    level1to2: { successesRequired: 5, revenueRequired: 10000 },
    level2to3: { successesRequired: 10, revenueRequired: 50000 },
    level3toMax: { successesRequired: 20, revenueRequired: 100000 }
  },
  // Always-approve list criteria
  alwaysApproveListCriteria: {
    consecutiveSuccesses: 5,
    minRevenueGenerated: 10000,
    noViolationsInDays: 30
  }
} as const;

// ============================================
// 3-DAY SPRINT CYCLE (Replaces 7-Day Weekly Loop)
// Faster learning cycles for rapid iteration
// ============================================
export const SPRINT_CYCLE_CONFIG = {
  durationDays: 3,
  phases: {
    day1: {
      phase: 'Deploy',
      actions: [
        'Score all assets → approve top 20%',
        'CMO publishes CoS-approved assets immediately',
        'CRO activates offer switching based on user intent'
      ],
      kpis: ['assets_scored', 'assets_published', 'initial_engagement']
    },
    day2: {
      phase: 'Measure',
      actions: [
        'Track conversion metrics across all deployed assets',
        'CRO runs price experiments on high-intent visitors',
        'Trigger checkout recovery for abandoned carts'
      ],
      kpis: ['conversion_rate', 'checkout_recovery', 'revenue_velocity']
    },
    day3: {
      phase: 'Optimize',
      actions: [
        'Remove assets with conversion < 0.25%',
        'Amplify assets with conversion > 1%',
        'Compile KPIs → update next cycle targeting',
        'CoS generates sprint report'
      ],
      kpis: ['revenue_per_asset', 'winners_amplified', 'losers_removed']
    }
  },
  automatedActions: {
    removeThreshold: 0.0025,  // Remove if < 0.25% conversion
    amplifyThreshold: 0.01,   // Amplify if > 1% conversion
    maxConcurrentTests: 5
  }
} as const;

// ============================================
// ATTRIBUTION HEALTH CHECK (New)
// Weekly verification of attribution chain integrity
// ============================================
export const ATTRIBUTION_HEALTH_CONFIG = {
  enabled: true,
  checkInterval: 'weekly',
  healthThresholds: {
    minimumAttributionRate: 0.8,  // 80% of conversions must have full attribution
    orphanAlertThreshold: 0.1,    // Alert if > 10% orphan conversions
    chainCompletionTarget: 0.9    // 90% target for full chain completion
  },
  attributionChain: ['content', 'click', 'engagement', 'checkout', 'revenue'],
  alerts: {
    critical: { orphanRate: 0.2, chainCompletion: 0.7 },
    warning: { orphanRate: 0.1, chainCompletion: 0.8 }
  }
} as const;

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
  // NEW: Positive feedback tracking
  positiveFeedback: PositiveFeedbackRecord[];
  agentSuccessStreaks: Record<string, number>;
  alwaysApproveList: string[];  // Action patterns that auto-approve
  autonomyLevels: Record<string, number>;  // Agent autonomy levels (1-3)
  // NEW: Attribution health tracking
  attributionHealth: {
    lastCheckDate: string;
    overallHealthScore: number;
    chainCompletionRate: number;
    orphanConversionRate: number;
    alerts: Array<{ level: string; message: string; timestamp: string }>;
  };
  // NEW: Sprint cycle tracking
  currentSprintCycle: {
    cycleNumber: number;
    startDate: string;
    currentDay: number;
    phase: string;
    metrics: {
      assetsScored: number;
      assetsPublished: number;
      winnersAmplified: number;
      losersRemoved: number;
      revenueGenerated: number;
    };
  };
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
// 2026 Master Directive Type
interface MasterDirective2026 {
  directive_id: string;
  primary_objective: {
    target: string;
    deadline: string;
  };
  core_protocol: {
    name: string;
    rule: string;
    spear_tip_narrative: {
      non_negotiable: boolean;
      pillars: Array<{ id: string; label: string; message: string }>;
    };
  };
  strategic_upgrades: Record<string, any>;
  agent_mandates: Record<string, { role: string; responsibilities: string[] }>;
  validation_rules: {
    all_actions_require: string;
    auto_veto_conditions: string[];
  };
  organic_growth_model: {
    channels: string[];
    no_paid_media: boolean;
    rules: string[];
  };
}

class CoSOrchestatorMandateService {
  private state: MandateState;
  private stateFilePath = 'state/cos-orchestrator-mandate.json';
  private masterDirective2026: MasterDirective2026 | null = null;

  constructor() {
    this.state = this.loadState();
    this.loadMasterDirective2026();
  }

  private loadMasterDirective2026(): void {
    try {
      const directivePath = 'state/2026_MASTER_DIRECTIVE.json';
      if (fs.existsSync(directivePath)) {
        this.masterDirective2026 = JSON.parse(fs.readFileSync(directivePath, 'utf-8'));
        console.log('📋 CoS: 2026 Master Directive loaded - Target: ' + this.masterDirective2026?.primary_objective.target);
      }
    } catch (error) {
      console.warn('⚠️ CoS: Could not load 2026 Master Directive');
    }
  }

  getMasterDirective2026(): MasterDirective2026 | null {
    return this.masterDirective2026;
  }

  validateAgainstSpearTip(content: string): { valid: boolean; reason?: string } {
    if (!this.masterDirective2026) return { valid: true };
    
    const pillars = this.masterDirective2026.core_protocol.spear_tip_narrative.pillars;
    const lowerContent = content.toLowerCase();
    
    // Check if content aligns with at least one pillar
    const alignedPillars = pillars.filter(p => {
      const keywords = p.message.toLowerCase().split(' ');
      return keywords.some(k => lowerContent.includes(k));
    });

    if (alignedPillars.length === 0) {
      return { 
        valid: false, 
        reason: 'Content does not align with Spear-Tip Narrative (Audit Risk, Economic Consequence, or System Fix)'
      };
    }

    return { valid: true };
  }

  checkAutoVetoConditions(action: { description?: string; revenueLink?: string }): { 
    shouldVeto: boolean; 
    reason?: string 
  } {
    if (!this.masterDirective2026) return { shouldVeto: false };

    const conditions = this.masterDirective2026.validation_rules.auto_veto_conditions;
    
    // Check: No demonstrable revenue link
    if (!action.revenueLink && conditions.includes('No demonstrable revenue link')) {
      return { shouldVeto: true, reason: '2026 DIRECTIVE: No demonstrable revenue link' };
    }

    // Check: Fluff content
    const fluffIndicators = ['engaging', 'trending', 'viral', 'awareness', 'impressions'];
    const description = (action.description || '').toLowerCase();
    if (fluffIndicators.some(f => description.includes(f)) && !description.includes('conversion')) {
      return { shouldVeto: true, reason: '2026 DIRECTIVE: Fluff content without conversion focus' };
    }

    return { shouldVeto: false };
  }

  // ============================================
  // EMERGENCY ALIGNMENT PROTOCOL (EAP-26)
  // Trigger: Monthly Net Member Growth < 90% of Forecast for 7 consecutive days
  // ============================================
  private eap26State: {
    active: boolean;
    activatedAt: string | null;
    diagnosticScenario: 'A' | 'B' | 'C' | null;
    daysUnderThreshold: number;
    lastCheck: string;
  } = {
    active: false,
    activatedAt: null,
    diagnosticScenario: null,
    daysUnderThreshold: 0,
    lastCheck: new Date().toISOString()
  };

  checkEAP26Trigger(currentGrowth: number, forecastGrowth: number): {
    triggered: boolean;
    percentOfForecast: number;
    daysUnderThreshold: number;
  } {
    const percentOfForecast = forecastGrowth > 0 ? (currentGrowth / forecastGrowth) * 100 : 100;
    const threshold = 90;

    if (percentOfForecast < threshold) {
      this.eap26State.daysUnderThreshold++;
    } else {
      this.eap26State.daysUnderThreshold = 0;
    }

    const triggered = this.eap26State.daysUnderThreshold >= 7;

    if (triggered && !this.eap26State.active) {
      console.log('🚨 EAP-26 TRIGGERED: Monthly growth at ' + percentOfForecast.toFixed(1) + '% of forecast for 7 days');
      this.eap26State.active = true;
      this.eap26State.activatedAt = new Date().toISOString();
    }

    this.eap26State.lastCheck = new Date().toISOString();
    return {
      triggered,
      percentOfForecast,
      daysUnderThreshold: this.eap26State.daysUnderThreshold
    };
  }

  runDiagnosticTriage(metrics: {
    toolVisitors: number;
    weeklyVisitorTarget: number;
    toolToMemberRate: number;
    targetConversionRate: number;
    churnRate: number;
  }): { scenario: 'A' | 'B' | 'C'; name: string; interventions: string[] } {
    // Scenario A: Traffic Failure
    if (metrics.toolVisitors < metrics.weeklyVisitorTarget) {
      this.eap26State.diagnosticScenario = 'A';
      return {
        scenario: 'A',
        name: 'Traffic Failure',
        interventions: [
          "CMO: Shift content mix to 100% Risk/Fear Narrative",
          "CMO: Deploy 'The Cost of Doing Nothing' charts daily",
          "CMO: Repost top-performing asset from previous quarter",
          "Strategist: Execute 'Controversial Industry Poll' in 13k Group"
        ]
      };
    }

    // Scenario B: Conversion Failure
    if (metrics.toolToMemberRate < metrics.targetConversionRate) {
      this.eap26State.diagnosticScenario = 'B';
      return {
        scenario: 'B',
        name: 'Conversion Failure',
        interventions: [
          "CRO: Activate 'Frictionless Mode'",
          "CRO: Remove 'Company Name' and 'Phone' from opt-in",
          "CRO: Change CTA to 'Get Your Board-Ready Slide'",
          "Content: Create specific 'Before/After' ROI visual"
        ]
      };
    }

    // Scenario C: Churn Spike
    if (metrics.churnRate > 0.05) {
      this.eap26State.diagnosticScenario = 'C';
      return {
        scenario: 'C',
        name: 'Churn Spike',
        interventions: [
          "CRO: Activate 'Red Alert Retention'",
          "CRO: Pause all acquisition emails",
          "CRO: Send plain-text personal email from Founder",
          "CRO: Offer 1:1 'Audit Strategy Audit' to high-value churn risks"
        ]
      };
    }

    // Default to traffic if no clear scenario
    this.eap26State.diagnosticScenario = 'A';
    return {
      scenario: 'A',
      name: 'Traffic Failure (Default)',
      interventions: ["CMO: Shift content mix to 100% Risk/Fear Narrative"]
    };
  }

  isEAP26Active(): boolean {
    return this.eap26State.active;
  }

  getEAP26Status(): typeof this.eap26State {
    return this.eap26State;
  }

  checkEAP26ExitCriteria(currentGrowth: number, forecastGrowth: number): boolean {
    const percentOfForecast = forecastGrowth > 0 ? (currentGrowth / forecastGrowth) * 100 : 100;
    
    if (percentOfForecast >= 95) {
      console.log('✅ EAP-26 EXIT CRITERIA MET: Growth at ' + percentOfForecast.toFixed(1) + '% of forecast');
      this.eap26State.active = false;
      this.eap26State.diagnosticScenario = null;
      this.eap26State.daysUnderThreshold = 0;
      return true;
    }
    return false;
  }

  getOperationalFreezeRules(): string[] {
    if (!this.eap26State.active) return [];
    
    return [
      "No New Experiments: All A/B testing stops. Winning variants are hard-coded.",
      "No Brand Building: 'Thought leadership' posts suspended. Only 'Direct Response' assets permitted.",
      "Veto Power: CoS rejects any output that does not address the identified Diagnostic Scenario."
    ];
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
      version: '2.0.0',
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
      recentAudits: [],
      // NEW: Positive feedback defaults
      positiveFeedback: [],
      agentSuccessStreaks: {
        'CMO': 0,
        'CRO': 0,
        'ContentManager': 0,
        'Strategic': 0
      },
      alwaysApproveList: [],
      autonomyLevels: {
        'CMO': 1,
        'CRO': 1,
        'ContentManager': 1,
        'Strategic': 2
      },
      // NEW: Attribution health defaults
      attributionHealth: {
        lastCheckDate: new Date().toISOString(),
        overallHealthScore: 100,
        chainCompletionRate: 1.0,
        orphanConversionRate: 0,
        alerts: []
      },
      // NEW: Sprint cycle defaults
      currentSprintCycle: {
        cycleNumber: 1,
        startDate: new Date().toISOString(),
        currentDay: 1,
        phase: 'Deploy',
        metrics: {
          assetsScored: 0,
          assetsPublished: 0,
          winnersAmplified: 0,
          losersRemoved: 0,
          revenueGenerated: 0
        }
      }
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

    // Check L7 Master Directive guardrails
    const l7Violations = this.checkL7Guardrails(action);
    constraintsChecked.push('L7-GUARDRAILS');
    violations.push(...l7Violations);

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
  // L7 GUARDRAILS CHECK
  // System-Level Immutable Rules from L7 Revenue-First Operating System
  // ============================================
  private checkL7Guardrails(action: AgentAction): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const actionText = `${action.action} ${action.description} ${action.expectedOutcome}`.toLowerCase();

    // Check for forbidden actions
    const forbiddenPatterns: Record<string, string[]> = {
      'noise_content': ['noise', 'filler', 'generic content', 'placeholder'],
      'vanity_metrics': ['likes', 'followers', 'impressions only', 'reach only'],
      'non_revenue_activities': ['brand building', 'awareness only', 'visibility'],
      'engagement_only_optimization': ['engagement rate', 'open rate only', 'click rate only']
    };

    for (const [forbiddenType, patterns] of Object.entries(forbiddenPatterns)) {
      for (const pattern of patterns) {
        if (actionText.includes(pattern)) {
          violations.push({
            id: nanoid(),
            actionId: action.id,
            agentId: action.agentId,
            constraintId: 'L7-FORBIDDEN',
            constraintName: `L7_FORBIDDEN_ACTION_${forbiddenType.toUpperCase()}`,
            violationReason: `L7 Guardrail: Forbidden action type detected - ${forbiddenType}`,
            violationDetails: `L7 Master Directive prohibits "${forbiddenType}" actions. Pattern detected: "${pattern}". Core principle: ${L7_GUARDRAILS.corePrinciple}`,
            severity: 'veto',
            timestamp: new Date().toISOString(),
            feedbackDelivered: false
          });
          break;
        }
      }
    }

    // Check spend caps (if action has spend component)
    // NEW: ROI-based budget exceptions allow higher spend if projected ROI > 3x
    const spendMatch = actionText.match(/\$(\d+)/);
    if (spendMatch) {
      const spendAmount = parseInt(spendMatch[1]);
      const roiConfig = L7_GUARDRAILS.roiBasedBudgetExceptions;
      
      // Calculate projected ROI if revenue impact is specified
      let projectedROI = 0;
      let hasValidROI = false;
      
      if (action.revenueImpact && action.revenueImpact.estimatedValue && spendAmount > 0) {
        projectedROI = action.revenueImpact.estimatedValue / spendAmount;
        const confidence = action.revenueImpact.confidence || 0;
        hasValidROI = roiConfig.enabled && 
                      projectedROI >= roiConfig.minROIThreshold && 
                      confidence >= roiConfig.requiresConfidenceLevel;
      }
      
      // Determine effective spend cap based on ROI
      const effectiveSpendCap = hasValidROI ? roiConfig.maxSpendWithROI : L7_GUARDRAILS.spendCapDaily;
      
      if (spendAmount > effectiveSpendCap) {
        violations.push({
          id: nanoid(),
          actionId: action.id,
          agentId: action.agentId,
          constraintId: 'L7-SPEND-CAP',
          constraintName: 'L7_DAILY_SPEND_CAP_EXCEEDED',
          violationReason: `L7 Guardrail: Daily spend cap exceeded ($${spendAmount} > $${effectiveSpendCap})`,
          violationDetails: hasValidROI 
            ? `ROI exception applied (${projectedROI.toFixed(1)}x), but spend still exceeds elevated cap of $${roiConfig.maxSpendWithROI}/day. Max allowed: $${effectiveSpendCap}`
            : `L7 Master Directive enforces a $${L7_GUARDRAILS.spendCapDaily}/day spend cap. Requested spend: $${spendAmount}. To unlock higher spend: provide revenueImpact with ROI > ${roiConfig.minROIThreshold}x and confidence >= ${roiConfig.requiresConfidenceLevel * 100}%`,
          severity: 'veto',
          timestamp: new Date().toISOString(),
          feedbackDelivered: false
        });
      } else if (hasValidROI && spendAmount > L7_GUARDRAILS.spendCapDaily) {
        // Log ROI exception approval
        console.log(`✅ L7 ROI EXCEPTION: Spend of $${spendAmount} approved (${projectedROI.toFixed(1)}x ROI, cap elevated to $${effectiveSpendCap})`);
      }
    }

    // Check for revenue probability (actions must have clear revenue path)
    const hasRevenuePath = action.revenueImpact && 
                          action.revenueImpact.type !== 'none' &&
                          (action.revenueImpact.confidence || 0) >= L7_GUARDRAILS.minimumRevenueProbability7Day;

    const hasRevenueKeywords = ['arr', 'mrr', 'revenue', 'conversion', 'checkout', 'purchase', 'deal', 'pipeline']
      .some(kw => actionText.includes(kw));

    if (!hasRevenuePath && !hasRevenueKeywords) {
      violations.push({
        id: nanoid(),
        actionId: action.id,
        agentId: action.agentId,
        constraintId: 'L7-REVENUE-PROB',
        constraintName: 'L7_MINIMUM_REVENUE_PROBABILITY',
        violationReason: `L7 Guardrail: Action lacks minimum revenue probability (${L7_GUARDRAILS.minimumRevenueProbability7Day * 100}% threshold)`,
        violationDetails: `L7 Master Directive requires all actions to have a minimum 7-day revenue probability of ${L7_GUARDRAILS.minimumRevenueProbability7Day * 100}%. Add revenueImpact with confidence >= ${L7_GUARDRAILS.minimumRevenueProbability7Day}.`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
        feedbackDelivered: false
      });
    }

    return violations;
  }

  // ============================================
  // FEEDBACK MECHANISM
  // ============================================

  private generateAgentFeedback(action: AgentAction, violations: ConstraintViolation[]): string {
    const violationSummaries = violations.map(v => 
      `- ${v.constraintName}: ${v.violationReason}`
    ).join('\n');

    // Generate a revenue-focused reworded suggestion
    const suggestedReword = this.generateRevenueAlignedSuggestion(action, violations);

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

═══════════════════════════════════════════════
SUGGESTED REVENUE-ALIGNED REWORD
═══════════════════════════════════════════════
${suggestedReword}

RESUBMISSION INSTRUCTIONS:
1. Use the suggested reword above as your new action
2. Ensure you include specific revenue targets (ARR/MRR/pipeline $)
3. Focus on conversion outcomes, not engagement metrics
4. Resubmit through the standard action flow

The CoS will automatically approve revenue-aligned actions.
    `.trim();
  }

  /**
   * Generate a revenue-aligned suggestion for a vetoed action
   */
  private generateRevenueAlignedSuggestion(action: AgentAction, violations: ConstraintViolation[]): string {
    const actionLower = action.action.toLowerCase();
    const descLower = action.description.toLowerCase();
    
    // Detect the type of action and generate appropriate suggestion
    if (actionLower.includes('content') || actionLower.includes('marketing') || descLower.includes('reach')) {
      return `
ORIGINAL: "${action.action}"
REWORD TO:

ACTION: "Convert content audience to pipeline opportunities"
DESCRIPTION: "Deploy targeted content sequence to convert ${this.extractAudienceSize(action)} engaged readers into qualified demo requests, targeting 5% conversion rate"
EXPECTED OUTCOME: "Generate $15,000 in new pipeline value through content-driven lead qualification"
REVENUE IMPACT: { type: "pipeline", estimatedValue: 15000, confidence: 0.7 }

WHY THIS WORKS:
• Focuses on conversion (readers → demo requests) not reach
• Ties directly to pipeline value ($15,000)
• Measurable outcome with specific conversion target (5%)
      `.trim();
    }
    
    if (actionLower.includes('social') || descLower.includes('followers') || descLower.includes('likes')) {
      return `
ORIGINAL: "${action.action}"
REWORD TO:

ACTION: "Drive qualified leads through social proof campaigns"
DESCRIPTION: "Use social channels to amplify customer success stories, targeting decision-makers in Life Sciences with direct CTA to schedule consultation"
EXPECTED OUTCOME: "Generate 10 qualified leads from social campaigns, targeting $50,000 pipeline value"
REVENUE IMPACT: { type: "pipeline", estimatedValue: 50000, confidence: 0.6 }

WHY THIS WORKS:
• Targets decision-makers (buyers) not general audience
• Includes direct CTA to revenue action (schedule consultation)
• Measurable pipeline value ($50,000)
      `.trim();
    }
    
    if (actionLower.includes('engagement') || actionLower.includes('awareness')) {
      return `
ORIGINAL: "${action.action}"
REWORD TO:

ACTION: "Accelerate prospect-to-MQL conversion"
DESCRIPTION: "Implement intent-based nurture sequence to move ${this.extractAudienceSize(action)} prospects to Marketing Qualified Lead status through targeted value messaging"
EXPECTED OUTCOME: "Convert 20% of engaged prospects to MQLs, generating $25,000 in qualified pipeline"
REVENUE IMPACT: { type: "pipeline", estimatedValue: 25000, confidence: 0.65 }

WHY THIS WORKS:
• Focuses on pipeline stage progression (prospect → MQL)
• Includes specific conversion target (20%)
• Clear revenue attribution ($25,000 pipeline)
      `.trim();
    }
    
    if (actionLower.includes('email') || actionLower.includes('newsletter')) {
      return `
ORIGINAL: "${action.action}"
REWORD TO:

ACTION: "Execute revenue-focused email sequence"
DESCRIPTION: "Deploy 3-email conversion sequence to ${this.extractAudienceSize(action)} subscribers with progressive CTAs leading to paid trial signup"
EXPECTED OUTCOME: "Achieve 3% subscriber-to-trial conversion, generating $5,000 in new MRR"
REVENUE IMPACT: { type: "MRR", estimatedValue: 5000, confidence: 0.7 }

WHY THIS WORKS:
• Conversion-focused (subscriber → paid trial)
• Specific MRR target ($5,000)
• Measurable conversion rate (3%)
      `.trim();
    }
    
    // Default suggestion for other action types
    return `
ORIGINAL: "${action.action}"
REWORD TO:

ACTION: "Drive measurable revenue through ${this.extractActionType(action)}"
DESCRIPTION: "Execute ${action.action.toLowerCase()} with explicit focus on converting engaged prospects to revenue-generating customers"
EXPECTED OUTCOME: "Achieve [X]% conversion rate, generating $[Y] in [ARR/MRR/pipeline]"
REVENUE IMPACT: { type: "[ARR/MRR/pipeline]", estimatedValue: [amount], confidence: [0.5-0.9] }

REQUIRED ELEMENTS:
• Specific conversion metric (% or count)
• Dollar value tied to ARR, MRR, or pipeline
• Confidence level based on historical data
• Clear path from action to revenue

EXAMPLE FOR ${action.agentType}:
"Convert [audience] to [revenue action] generating $[X] in [revenue type]"
    `.trim();
  }

  /**
   * Extract audience size hint from action description
   */
  private extractAudienceSize(action: AgentAction): string {
    const text = `${action.description} ${action.expectedOutcome}`;
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return numbers[0];
    }
    return 'targeted';
  }

  /**
   * Extract action type for generic suggestion
   */
  private extractActionType(action: AgentAction): string {
    const actionWords = action.action.toLowerCase().split(' ');
    const meaningfulWords = actionWords.filter(w => 
      !['the', 'a', 'an', 'to', 'for', 'and', 'or', 'of', 'in', 'on'].includes(w)
    );
    return meaningfulWords.slice(0, 3).join(' ') || 'strategic initiative';
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

  // ============================================
  // POSITIVE FEEDBACK LOOPS (New)
  // Reward signals for high-performing agents
  // ============================================

  /**
   * Record positive feedback when an action generates revenue
   */
  recordPositiveFeedback(
    agentId: string,
    agentType: string,
    actionId: string,
    revenueGenerated: number,
    revenueType: 'ARR' | 'MRR' | 'pipeline' | 'conversion'
  ): void {
    if (!POSITIVE_FEEDBACK_CONFIG.enabled) return;

    const performanceScore = this.calculatePerformanceScore(revenueGenerated, revenueType);
    
    const feedback: PositiveFeedbackRecord = {
      id: nanoid(),
      agentId,
      agentType,
      actionId,
      revenueGenerated,
      revenueType,
      performanceScore,
      recordedAt: new Date().toISOString(),
      autoPromoted: false
    };

    // Initialize if not exists
    if (!this.state.positiveFeedback) this.state.positiveFeedback = [];
    if (!this.state.agentSuccessStreaks) this.state.agentSuccessStreaks = {};
    
    this.state.positiveFeedback.unshift(feedback);
    
    // Keep last 500 positive feedback records
    if (this.state.positiveFeedback.length > 500) {
      this.state.positiveFeedback = this.state.positiveFeedback.slice(0, 500);
    }

    // Update success streak
    this.state.agentSuccessStreaks[agentType] = (this.state.agentSuccessStreaks[agentType] || 0) + 1;

    // Check for auto-promotion
    this.checkAutoPromotion(agentType);

    console.log(`🌟 POSITIVE FEEDBACK: ${agentType} generated $${revenueGenerated} ${revenueType} (Score: ${performanceScore})`);
    this.saveState();
  }

  /**
   * Calculate performance score based on revenue generated
   */
  private calculatePerformanceScore(revenueGenerated: number, revenueType: string): number {
    const config = POSITIVE_FEEDBACK_CONFIG.rewardSignals;
    let score = 50; // Base score

    // Revenue-based scoring
    if (revenueGenerated >= 10000) score += 40;
    else if (revenueGenerated >= 5000) score += 30;
    else if (revenueGenerated >= 1000) score += 20;
    else if (revenueGenerated > 0) score += 10;

    // Revenue type bonus
    if (revenueType === 'ARR') score += 10;
    else if (revenueType === 'MRR') score += 8;
    else if (revenueType === 'conversion') score += 5;

    return Math.min(100, score);
  }

  /**
   * Check if an agent qualifies for auto-promotion
   */
  private checkAutoPromotion(agentType: string): void {
    const config = POSITIVE_FEEDBACK_CONFIG.autoPromoteThreshold;
    const streak = this.state.agentSuccessStreaks[agentType] || 0;
    
    if (streak >= config.consecutiveSuccesses) {
      // Calculate total revenue from recent successes
      const recentFeedback = this.state.positiveFeedback
        .filter(f => f.agentType === agentType)
        .slice(0, config.consecutiveSuccesses);
      
      const totalRevenue = recentFeedback.reduce((sum, f) => sum + f.revenueGenerated, 0);
      const avgScore = recentFeedback.reduce((sum, f) => sum + f.performanceScore, 0) / recentFeedback.length;

      if (totalRevenue >= config.revenueThreshold && avgScore >= config.performanceScore) {
        this.promoteAgentAutonomy(agentType);
        console.log(`🚀 AUTO-PROMOTION: ${agentType} upgraded for consistent revenue performance`);
      }
    }
  }

  /**
   * Increase agent autonomy level
   */
  promoteAgentAutonomy(agentType: string): void {
    if (!this.state.autonomyLevels) this.state.autonomyLevels = {};
    
    const currentLevel = this.state.autonomyLevels[agentType] || 1;
    const boosts = POSITIVE_FEEDBACK_CONFIG.autonomyBoosts;
    
    // Check requirements for next level
    const recentFeedback = this.state.positiveFeedback.filter(f => f.agentType === agentType);
    const totalRevenue = recentFeedback.reduce((sum, f) => sum + f.revenueGenerated, 0);
    const successCount = recentFeedback.length;

    let newLevel = currentLevel;
    
    if (currentLevel === 1 && successCount >= boosts.level1to2.successesRequired && totalRevenue >= boosts.level1to2.revenueRequired) {
      newLevel = 2;
    } else if (currentLevel === 2 && successCount >= boosts.level2to3.successesRequired && totalRevenue >= boosts.level2to3.revenueRequired) {
      newLevel = 3;
    }

    if (newLevel > currentLevel) {
      this.state.autonomyLevels[agentType] = newLevel;
      console.log(`⬆️ AUTONOMY BOOST: ${agentType} promoted from L${currentLevel} to L${newLevel}`);
      this.saveState();
    }
  }

  /**
   * Reset success streak on veto (negative feedback)
   */
  resetSuccessStreak(agentType: string): void {
    if (this.state.agentSuccessStreaks) {
      this.state.agentSuccessStreaks[agentType] = 0;
      this.saveState();
    }
  }

  /**
   * Add action pattern to always-approve list
   */
  addToAlwaysApproveList(actionPattern: string, agentType: string): void {
    if (!this.state.alwaysApproveList) this.state.alwaysApproveList = [];
    
    const entry = `${agentType}:${actionPattern}`;
    if (!this.state.alwaysApproveList.includes(entry)) {
      this.state.alwaysApproveList.push(entry);
      console.log(`✅ ALWAYS-APPROVE: Added pattern "${actionPattern}" for ${agentType}`);
      this.saveState();
    }
  }

  /**
   * Check if action matches always-approve pattern
   */
  isInAlwaysApproveList(actionTitle: string, agentType: string): boolean {
    if (!this.state.alwaysApproveList) return false;
    
    return this.state.alwaysApproveList.some(entry => {
      const [entryAgent, pattern] = entry.split(':');
      return entryAgent === agentType && actionTitle.toLowerCase().includes(pattern.toLowerCase());
    });
  }

  // ============================================
  // ATTRIBUTION HEALTH CHECK (New)
  // Weekly verification of attribution chain integrity
  // ============================================

  /**
   * Run weekly attribution health check
   */
  runAttributionHealthCheck(conversions: Array<{
    id: string;
    hasContent: boolean;
    hasClick: boolean;
    hasEngagement: boolean;
    hasCheckout: boolean;
    hasRevenue: boolean;
  }>): {
    healthScore: number;
    chainCompletionRate: number;
    orphanRate: number;
    alerts: Array<{ level: string; message: string }>;
  } {
    if (!ATTRIBUTION_HEALTH_CONFIG.enabled || conversions.length === 0) {
      return { healthScore: 100, chainCompletionRate: 1, orphanRate: 0, alerts: [] };
    }

    const alerts: Array<{ level: string; message: string }> = [];
    const thresholds = ATTRIBUTION_HEALTH_CONFIG.healthThresholds;

    // Calculate full chain completion (all 5 points)
    const fullChainCount = conversions.filter(c => 
      c.hasContent && c.hasClick && c.hasEngagement && c.hasCheckout && c.hasRevenue
    ).length;
    
    // Calculate orphan conversions (revenue without attribution)
    const orphanCount = conversions.filter(c => 
      c.hasRevenue && !c.hasContent && !c.hasClick
    ).length;

    const chainCompletionRate = fullChainCount / conversions.length;
    const orphanRate = orphanCount / conversions.length;

    // Calculate health score
    let healthScore = 100;
    if (chainCompletionRate < thresholds.chainCompletionTarget) {
      healthScore -= (thresholds.chainCompletionTarget - chainCompletionRate) * 100;
    }
    if (orphanRate > thresholds.orphanAlertThreshold) {
      healthScore -= (orphanRate - thresholds.orphanAlertThreshold) * 50;
    }
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Generate alerts
    const alertConfig = ATTRIBUTION_HEALTH_CONFIG.alerts;
    
    if (orphanRate >= alertConfig.critical.orphanRate) {
      alerts.push({ level: 'CRITICAL', message: `${(orphanRate * 100).toFixed(1)}% orphan conversions (>${alertConfig.critical.orphanRate * 100}%)` });
    } else if (orphanRate >= alertConfig.warning.orphanRate) {
      alerts.push({ level: 'WARNING', message: `${(orphanRate * 100).toFixed(1)}% orphan conversions detected` });
    }

    if (chainCompletionRate <= alertConfig.critical.chainCompletion) {
      alerts.push({ level: 'CRITICAL', message: `Chain completion at ${(chainCompletionRate * 100).toFixed(1)}% (<${alertConfig.critical.chainCompletion * 100}%)` });
    } else if (chainCompletionRate <= alertConfig.warning.chainCompletion) {
      alerts.push({ level: 'WARNING', message: `Chain completion at ${(chainCompletionRate * 100).toFixed(1)}%` });
    }

    // Update state
    if (!this.state.attributionHealth) {
      this.state.attributionHealth = {
        lastCheckDate: new Date().toISOString(),
        overallHealthScore: 100,
        chainCompletionRate: 1,
        orphanConversionRate: 0,
        alerts: []
      };
    }
    
    this.state.attributionHealth = {
      lastCheckDate: new Date().toISOString(),
      overallHealthScore: healthScore,
      chainCompletionRate,
      orphanConversionRate: orphanRate,
      alerts: alerts.map(a => ({ ...a, timestamp: new Date().toISOString() }))
    };
    
    this.saveState();

    console.log(`📊 ATTRIBUTION HEALTH CHECK: Score ${healthScore.toFixed(0)}% | Chain: ${(chainCompletionRate * 100).toFixed(1)}% | Orphans: ${(orphanRate * 100).toFixed(1)}%`);
    if (alerts.length > 0) {
      alerts.forEach(a => console.log(`   ⚠️ ${a.level}: ${a.message}`));
    }

    return { healthScore, chainCompletionRate, orphanRate, alerts };
  }

  getAttributionHealth(): typeof this.state.attributionHealth {
    return this.state.attributionHealth;
  }

  // ============================================
  // 3-DAY SPRINT CYCLE MANAGEMENT (New)
  // Faster learning cycles for rapid iteration
  // ============================================

  /**
   * Get current sprint cycle day and phase
   */
  getCurrentSprintPhase(): {
    cycleNumber: number;
    day: number;
    phase: string;
    actions: string[];
    kpis: string[];
  } {
    // Initialize if not exists
    if (!this.state.currentSprintCycle) {
      this.state.currentSprintCycle = {
        cycleNumber: 1,
        startDate: new Date().toISOString(),
        currentDay: 1,
        phase: 'Deploy',
        metrics: { assetsScored: 0, assetsPublished: 0, winnersAmplified: 0, losersRemoved: 0, revenueGenerated: 0 }
      };
      this.saveState();
    }

    const config = SPRINT_CYCLE_CONFIG;
    const cycle = this.state.currentSprintCycle;
    
    // Calculate current day based on start date
    const startDate = new Date(cycle.startDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = (daysSinceStart % config.durationDays) + 1;
    
    // Check if we've moved to a new cycle
    if (daysSinceStart >= config.durationDays && currentDay === 1) {
      this.advanceSprintCycle();
    }

    const dayKey = `day${currentDay}` as keyof typeof config.phases;
    const phase = config.phases[dayKey];

    return {
      cycleNumber: cycle.cycleNumber,
      day: currentDay,
      phase: phase.phase,
      actions: [...phase.actions],
      kpis: [...phase.kpis]
    };
  }

  /**
   * Advance to next sprint cycle
   */
  advanceSprintCycle(): void {
    const prevMetrics = this.state.currentSprintCycle.metrics;
    
    console.log(`\n🔄 SPRINT CYCLE ${this.state.currentSprintCycle.cycleNumber} COMPLETE`);
    console.log(`   📊 Assets: ${prevMetrics.assetsScored} scored, ${prevMetrics.assetsPublished} published`);
    console.log(`   🏆 Winners: ${prevMetrics.winnersAmplified} amplified, ${prevMetrics.losersRemoved} removed`);
    console.log(`   💰 Revenue: $${prevMetrics.revenueGenerated}`);

    this.state.currentSprintCycle = {
      cycleNumber: this.state.currentSprintCycle.cycleNumber + 1,
      startDate: new Date().toISOString(),
      currentDay: 1,
      phase: 'Deploy',
      metrics: { assetsScored: 0, assetsPublished: 0, winnersAmplified: 0, losersRemoved: 0, revenueGenerated: 0 }
    };

    console.log(`\n🚀 SPRINT CYCLE ${this.state.currentSprintCycle.cycleNumber} STARTED`);
    this.saveState();
  }

  /**
   * Update sprint metrics
   */
  updateSprintMetrics(updates: Partial<{
    assetsScored: number;
    assetsPublished: number;
    winnersAmplified: number;
    losersRemoved: number;
    revenueGenerated: number;
  }>): void {
    if (!this.state.currentSprintCycle) return;
    
    Object.assign(this.state.currentSprintCycle.metrics, updates);
    this.saveState();
  }

  /**
   * Get sprint cycle report
   */
  getSprintReport(): {
    currentCycle: MandateState['currentSprintCycle'];
    phase: { cycleNumber: number; day: number; phase: string; actions: string[]; kpis: string[] };
    config: typeof SPRINT_CYCLE_CONFIG;
  } {
    return {
      currentCycle: this.state.currentSprintCycle,
      phase: this.getCurrentSprintPhase(),
      config: SPRINT_CYCLE_CONFIG
    };
  }

  // ============================================
  // CONSOLIDATED 2-LAYER GUARDRAIL SYSTEM (New)
  // Layer 1: Pre-Flight (syntax, forbidden, domain)
  // Layer 2: Revenue Gate (CoS Mandate + L7)
  // ============================================

  /**
   * Layer 1: Pre-Flight Check - Fast validation before full audit
   * Returns immediately if basic checks fail
   */
  preFlightCheck(actionTitle: string, actionDescription: string): {
    pass: boolean;
    layer: 'PRE_FLIGHT';
    reason?: string;
    proceedToRevenueGate: boolean;
  } {
    const text = `${actionTitle} ${actionDescription}`.toLowerCase();
    
    // Check forbidden vocabulary
    const forbiddenTerms = ['spam', 'scam', 'fake', 'hack', 'illegal'];
    for (const term of forbiddenTerms) {
      if (text.includes(term)) {
        return { pass: false, layer: 'PRE_FLIGHT', reason: `Forbidden term detected: ${term}`, proceedToRevenueGate: false };
      }
    }

    // Check domain fence (must be life sciences related for content actions)
    if (text.includes('content') || text.includes('article') || text.includes('publish')) {
      const lifeSciTerms = ['fda', 'gxp', 'csv', 'validation', 'compliance', 'pharma', 'biotech', 'medical', 'capa', 'qms'];
      const hasLifeSciContext = lifeSciTerms.some(t => text.includes(t));
      
      if (!hasLifeSciContext) {
        return { pass: false, layer: 'PRE_FLIGHT', reason: 'Content action missing life sciences context', proceedToRevenueGate: false };
      }
    }

    // Pre-flight passed, proceed to revenue gate
    return { pass: true, layer: 'PRE_FLIGHT', proceedToRevenueGate: true };
  }

  /**
   * Consolidated 2-layer check: Pre-Flight + Revenue Gate
   */
  async twoLayerGuardrailCheck(
    actionId: string,
    agentType: string,
    actionTitle: string,
    actionDescription: string,
    expectedOutcome: string,
    revenueImpact?: { type: 'ARR' | 'MRR' | 'pipeline' | 'none'; estimatedValue?: number; confidence?: number }
  ): Promise<{
    layer1: { pass: boolean; layer: 'PRE_FLIGHT'; reason?: string; proceedToRevenueGate: boolean };
    layer2?: CoSGateResult;
    finalDecision: 'APPROVED' | 'BLOCKED';
    blockReason?: string;
  }> {
    // Layer 1: Pre-Flight
    const layer1 = this.preFlightCheck(actionTitle, actionDescription);
    
    if (!layer1.pass) {
      return {
        layer1,
        finalDecision: 'BLOCKED',
        blockReason: `Layer 1 Pre-Flight: ${layer1.reason}`
      };
    }

    // Layer 2: Revenue Gate (CoS Mandate + L7 Guardrails)
    const layer2 = await cosExecutionGate(
      actionId,
      agentType,
      agentType,
      actionTitle,
      actionDescription,
      expectedOutcome,
      revenueImpact
    );

    return {
      layer1,
      layer2,
      finalDecision: layer2.allowed ? 'APPROVED' : 'BLOCKED',
      blockReason: layer2.blockReason
    };
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
