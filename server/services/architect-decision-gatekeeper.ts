/**
 * ARCHITECT_DECISION_GATEKEEPER_v1.0
 * 
 * Scope: architect_only
 * Purpose: Evaluate Strategist corrective actions for RPM/L6-related changes under L5+ governance.
 * 
 * Decision Flow:
 * 1. Validate hard_filters
 * 2. Apply gate_by_root_cause constraints
 * 3. Evaluate soft_filters
 * 4. Select verdict
 * 
 * Verdicts:
 * - APPROVE: all hard_filters pass, gate constraints respected, soft_filters acceptable
 * - MODIFY: hard_filters pass, but one or more gate/soft_filters violated → narrow action
 * - REJECT: any hard_filter violated, or action structurally unsafe
 */

// Root cause classifications
type RootCauseClass = 
  | 'UDL'
  | 'REVENUE_STABILITY'
  | 'RPM_CONFIDENCE'
  | 'OBJECTION_DRIFT'
  | 'OFFER_LADDER_PREDICTABILITY';

type Verdict = 'APPROVE' | 'MODIFY' | 'REJECT';

interface ProjectedImpact {
  rpm_confidence_delta: number;
  revenue_delta: number;
  risk_notes: string;
}

interface StrategistProposal {
  source: 'Strategist';
  root_cause_class: RootCauseClass;
  proposed_action: string;
  projected_impact: ProjectedImpact;
}

interface FilterResult {
  passed: boolean;
  filter: string;
  reason: string;
}

interface GatekeeperDecision {
  decisionId: string;
  timestamp: string;
  
  input: StrategistProposal;
  
  evaluation: {
    hard_filters: FilterResult[];
    gate_constraints: FilterResult[];
    soft_filters: FilterResult[];
    all_hard_passed: boolean;
    all_gate_passed: boolean;
    soft_violations: number;
  };
  
  decision: Verdict;
  reason: string;
  instructions_to_strategist: 'execute' | 'resubmit_narrower' | 'rerun_diagnostics';
  notes_for_cos: string;
  
  safety: {
    l6_activation: 'PROHIBITED';
    vqs_methodology_lock: 'ENFORCED';
    offer_ladder_structure_lock: 'ENFORCED';
    positioning_lock: 'ENFORCED';
  };
}

// Classification rules for context
const CLASSIFICATION_RULES: Record<RootCauseClass, string> = {
  UDL: 'data integrity / freshness / consistency issue',
  REVENUE_STABILITY: 'pipeline / sprint / ladder execution issue',
  RPM_CONFIDENCE: 'predictive model stability issue',
  OBJECTION_DRIFT: 'stakeholder packet / objections issue',
  OFFER_LADDER_PREDICTABILITY: 'Tier1→Tier2→Tier3 flow issue'
};

// Gate constraints by root cause
const GATE_BY_ROOT_CAUSE: Record<RootCauseClass, { allowed: string[]; forbidden: string[] }> = {
  UDL: {
    allowed: ['data pipelines', 'freshness', 'weighting', 'de-duplication', 'sync', 'normalization'],
    forbidden: ['pricing', 'offers', 'positioning', 'VQS', 'methodology', 'brand']
  },
  REVENUE_STABILITY: {
    allowed: ['agent behavior', 'cadence', 'sprint discipline', 'backlog clearing', 'execution', 'velocity'],
    forbidden: ['new tiers', 'new products', 'pricing model changes', 'VQS', 'methodology']
  },
  RPM_CONFIDENCE: {
    allowed: ['feature weighting', 'data normalization', 'exclusion of bad signals', 'model refresh', 'confidence recalculation'],
    forbidden: ['VQS changes', 'ladder changes', 'positioning changes', 'methodology', 'brand']
  },
  OBJECTION_DRIFT: {
    allowed: ['packet content', 'objection handling language', 'sequence of packet delivery', 'stakeholder targeting'],
    forbidden: ['core product promise', 'pricing', 'VQS', 'methodology', 'positioning']
  },
  OFFER_LADDER_PREDICTABILITY: {
    allowed: ['enforcement of existing sequence', 'friction removal within tiers', 'tier clarity', 'conversion optimization'],
    forbidden: ['new tiers', 'removed tiers', 'direct Tier3 offers bypassing Tier1/2', 'ladder restructure']
  }
};

class ArchitectDecisionGatekeeperService {
  private decisionHistory: GatekeeperDecision[] = [];
  private lastDecision: GatekeeperDecision | null = null;

  /**
   * Evaluate a Strategist proposal through the gatekeeper
   */
  evaluate(proposal: StrategistProposal): GatekeeperDecision {
    const decisionId = `GATE-${Date.now()}`;
    const timestamp = new Date().toISOString();

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║        ARCHITECT DECISION GATEKEEPER v1.0                            ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Decision ID: ${decisionId.padEnd(53)}║`);
    console.log(`║  Source: Strategist                                                  ║`);
    console.log(`║  Root Cause: ${proposal.root_cause_class.padEnd(54)}║`);
    console.log('╚══════════════════════════════════════════════════════════════════════╝');

    console.log(`\n[GATEKEEPER] 📥 Proposal: "${proposal.proposed_action.substring(0, 60)}..."`);
    console.log(`[GATEKEEPER] 📊 Projected Impact: RPM Δ${proposal.projected_impact.rpm_confidence_delta > 0 ? '+' : ''}${(proposal.projected_impact.rpm_confidence_delta * 100).toFixed(1)}%, Revenue Δ$${proposal.projected_impact.revenue_delta}`);

    // Step 1: Validate hard filters
    console.log('\n[GATEKEEPER] 🔒 Step 1: Validating HARD FILTERS...');
    const hardFilters = this.evaluateHardFilters(proposal);
    const allHardPassed = hardFilters.every(f => f.passed);
    hardFilters.forEach(f => {
      console.log(`[GATEKEEPER]    ${f.passed ? '✅' : '❌'} ${f.filter}: ${f.reason}`);
    });

    // Step 2: Apply gate_by_root_cause constraints
    console.log('\n[GATEKEEPER] 🚧 Step 2: Applying GATE CONSTRAINTS for ' + proposal.root_cause_class + '...');
    const gateConstraints = this.evaluateGateConstraints(proposal);
    const allGatePassed = gateConstraints.every(f => f.passed);
    gateConstraints.forEach(f => {
      console.log(`[GATEKEEPER]    ${f.passed ? '✅' : '⚠️'} ${f.filter}: ${f.reason}`);
    });

    // Step 3: Evaluate soft filters
    console.log('\n[GATEKEEPER] 📋 Step 3: Evaluating SOFT FILTERS...');
    const softFilters = this.evaluateSoftFilters(proposal);
    const softViolations = softFilters.filter(f => !f.passed).length;
    softFilters.forEach(f => {
      console.log(`[GATEKEEPER]    ${f.passed ? '✅' : '⚠️'} ${f.filter}: ${f.reason}`);
    });

    // Step 4: Select verdict
    console.log('\n[GATEKEEPER] ⚖️  Step 4: Selecting VERDICT...');
    const { verdict, reason, instructions, cosNotes } = this.selectVerdict(
      allHardPassed, 
      allGatePassed, 
      softViolations,
      hardFilters,
      gateConstraints,
      softFilters
    );

    const decision: GatekeeperDecision = {
      decisionId,
      timestamp,
      input: proposal,
      evaluation: {
        hard_filters: hardFilters,
        gate_constraints: gateConstraints,
        soft_filters: softFilters,
        all_hard_passed: allHardPassed,
        all_gate_passed: allGatePassed,
        soft_violations: softViolations
      },
      decision: verdict,
      reason,
      instructions_to_strategist: instructions,
      notes_for_cos: cosNotes,
      safety: {
        l6_activation: 'PROHIBITED',
        vqs_methodology_lock: 'ENFORCED',
        offer_ladder_structure_lock: 'ENFORCED',
        positioning_lock: 'ENFORCED'
      }
    };

    this.lastDecision = decision;
    this.decisionHistory.push(decision);

    this.logDecision(decision);

    return decision;
  }

  /**
   * Evaluate hard filters (must all pass)
   */
  private evaluateHardFilters(proposal: StrategistProposal): FilterResult[] {
    const action = proposal.proposed_action.toLowerCase();
    const results: FilterResult[] = [];

    // VQS_PROTECTION
    const vqsKeywords = ['vqs', 'methodology', 'claimed range', 'value quantification'];
    const vqsViolation = vqsKeywords.some(k => action.includes(k) && 
      (action.includes('change') || action.includes('alter') || action.includes('modify') || action.includes('rewrite')));
    results.push({
      passed: !vqsViolation,
      filter: 'VQS_PROTECTION',
      reason: vqsViolation 
        ? 'Action attempts to alter VQS, methodology, or claimed ranges'
        : 'VQS, methodology, and claimed ranges remain untouched'
    });

    // REVENUE_INTEGRITY
    const volatilityKeywords = ['experimental', 'untested', 'radical', 'overhaul', 'restructure'];
    const volatilityRisk = volatilityKeywords.some(k => action.includes(k)) || 
                           Math.abs(proposal.projected_impact.revenue_delta) > 10000;
    results.push({
      passed: !volatilityRisk,
      filter: 'REVENUE_INTEGRITY',
      reason: volatilityRisk
        ? 'Action may materially increase revenue volatility'
        : 'Revenue predictability preserved within acceptable bounds'
    });

    // AUDIT_DEFENSIBILITY
    const auditRiskKeywords = ['aggressive', 'bypass', 'skip', 'override', 'force'];
    const auditRisk = auditRiskKeywords.some(k => action.includes(k)) &&
                      !action.includes('stakeholder') && !action.includes('packet');
    results.push({
      passed: !auditRisk,
      filter: 'AUDIT_DEFENSIBILITY',
      reason: auditRisk
        ? 'Action may not be conservative, reproducible, or regulator-defensible'
        : 'Action is conservative, reproducible, and audit-defensible'
    });

    return results;
  }

  /**
   * Evaluate gate constraints by root cause
   */
  private evaluateGateConstraints(proposal: StrategistProposal): FilterResult[] {
    const gate = GATE_BY_ROOT_CAUSE[proposal.root_cause_class];
    const action = proposal.proposed_action.toLowerCase();
    const results: FilterResult[] = [];

    // Check for allowed changes
    const hasAllowedChange = gate.allowed.some(a => action.includes(a.toLowerCase()));
    results.push({
      passed: hasAllowedChange,
      filter: 'ALLOWED_CHANGES',
      reason: hasAllowedChange
        ? `Action aligns with allowed changes for ${proposal.root_cause_class}`
        : `Action does not clearly match allowed changes: ${gate.allowed.join(', ')}`
    });

    // Check for forbidden changes
    const hasForbiddenChange = gate.forbidden.some(f => action.includes(f.toLowerCase()));
    results.push({
      passed: !hasForbiddenChange,
      filter: 'FORBIDDEN_CHANGES',
      reason: hasForbiddenChange
        ? `Action touches forbidden area for ${proposal.root_cause_class}: ${gate.forbidden.filter(f => action.includes(f.toLowerCase())).join(', ')}`
        : 'Action avoids all forbidden change areas'
    });

    return results;
  }

  /**
   * Evaluate soft filters (violations narrow the action)
   */
  private evaluateSoftFilters(proposal: StrategistProposal): FilterResult[] {
    const action = proposal.proposed_action.toLowerCase();
    const results: FilterResult[] = [];

    // OFFER_LADDER_INTEGRITY
    const ladderViolation = action.includes('bypass') && action.includes('tier') ||
                            action.includes('skip tier') ||
                            action.includes('direct tier3');
    results.push({
      passed: !ladderViolation,
      filter: 'OFFER_LADDER_INTEGRITY',
      reason: ladderViolation
        ? 'Action may bypass Tier1→Tier2→Tier3 sequence'
        : 'Tier sequence preserved'
    });

    // L5_STABILITY
    const l6Keywords = ['l6', 'experimental', 'mutation', 'autonomous', 'auto-pricing', 'auto-content'];
    const l6Risk = l6Keywords.some(k => action.includes(k)) && !action.includes('block') && !action.includes('disable');
    results.push({
      passed: !l6Risk,
      filter: 'L5_STABILITY',
      reason: l6Risk
        ? 'Action introduces L6-like experimental breadth'
        : 'L5 stability maintained'
    });

    // 24H_RESTORABILITY
    const canRestore24h = proposal.projected_impact.rpm_confidence_delta >= 0.05 || // 5%+ improvement
                          action.includes('stakeholder') ||
                          action.includes('unblock') ||
                          action.includes('restore') ||
                          action.includes('refresh');
    results.push({
      passed: canRestore24h,
      filter: '24H_RESTORABILITY',
      reason: canRestore24h
        ? 'Action plausibly restores RPM_CONFIDENCE ≥90% within 24h'
        : 'Action unlikely to restore RPM_CONFIDENCE within 24h window'
    });

    return results;
  }

  /**
   * Select verdict based on filter results
   */
  private selectVerdict(
    allHardPassed: boolean,
    allGatePassed: boolean,
    softViolations: number,
    hardFilters: FilterResult[],
    gateConstraints: FilterResult[],
    softFilters: FilterResult[]
  ): { verdict: Verdict; reason: string; instructions: 'execute' | 'resubmit_narrower' | 'rerun_diagnostics'; cosNotes: string } {
    
    // REJECT: any hard filter violated
    if (!allHardPassed) {
      const failedHard = hardFilters.find(f => !f.passed);
      return {
        verdict: 'REJECT',
        reason: `Hard filter violated: ${failedHard?.filter} - ${failedHard?.reason}`,
        instructions: 'rerun_diagnostics',
        cosNotes: `Block execution. ${failedHard?.filter} violation detected. Strategist must rerun diagnostics with safer parameters.`
      };
    }

    // MODIFY: hard passed but gate/soft violated
    if (!allGatePassed || softViolations > 1) {
      const failedGate = gateConstraints.find(f => !f.passed);
      const failedSoft = softFilters.filter(f => !f.passed);
      const primaryIssue = failedGate || failedSoft[0];
      return {
        verdict: 'MODIFY',
        reason: `Gate/soft filter violated: ${primaryIssue?.filter} - ${primaryIssue?.reason}`,
        instructions: 'resubmit_narrower',
        cosNotes: `Narrow action scope. Strategist must resubmit with: ${failedGate ? 'changes within allowed gate parameters' : 'reduced experimental scope'}. Monitor for compliance.`
      };
    }

    // APPROVE: all hard passed, gates respected, soft acceptable
    if (softViolations === 1) {
      const failedSoft = softFilters.find(f => !f.passed);
      return {
        verdict: 'APPROVE',
        reason: `Approved with advisory: ${failedSoft?.filter} - ${failedSoft?.reason}`,
        instructions: 'execute',
        cosNotes: `Approved for execution with monitoring. Advisory: ${failedSoft?.reason}. Track outcome within 24h.`
      };
    }

    return {
      verdict: 'APPROVE',
      reason: 'All filters passed. Action is safe, compliant, and aligned with L5 governance.',
      instructions: 'execute',
      cosNotes: 'Approved for immediate execution. Standard monitoring applies. Report outcome within 24h.'
    };
  }

  /**
   * Log the decision
   */
  private logDecision(decision: GatekeeperDecision): void {
    const verdictIcon = decision.decision === 'APPROVE' ? '✅' :
                        decision.decision === 'MODIFY' ? '⚠️' : '🚫';

    console.log('\n');
    console.log('┌──────────────────────────────────────────────────────────────────────┐');
    console.log('│         ARCHITECT DECISION GATEKEEPER — VERDICT                      │');
    console.log('├──────────────────────────────────────────────────────────────────────┤');
    console.log(`│  Decision ID: ${decision.decisionId.padEnd(53)}│`);
    console.log(`│  ${verdictIcon} Decision: ${decision.decision.padEnd(55)}│`);
    console.log('├──────────────────────────────────────────────────────────────────────┤');
    console.log(`│  Reason: ${decision.reason.substring(0, 58).padEnd(58)}│`);
    if (decision.reason.length > 58) {
      console.log(`│          ${decision.reason.substring(58, 116).padEnd(58)}│`);
    }
    console.log('├──────────────────────────────────────────────────────────────────────┤');
    console.log(`│  📋 Instructions to Strategist: ${decision.instructions_to_strategist.padEnd(35)}│`);
    console.log('├──────────────────────────────────────────────────────────────────────┤');
    console.log(`│  📝 Notes for CoS:                                                   │`);
    const cosLines = decision.notes_for_cos.match(/.{1,60}/g) || [decision.notes_for_cos];
    cosLines.slice(0, 3).forEach(line => {
      console.log(`│     ${line.padEnd(63)}│`);
    });
    console.log('├──────────────────────────────────────────────────────────────────────┤');
    console.log('│  🔒 SAFETY LOCKS:                                                    │');
    console.log('│     L6 Activation: PROHIBITED                                       │');
    console.log('│     VQS Methodology: ENFORCED                                       │');
    console.log('│     Offer Ladder Structure: ENFORCED                                │');
    console.log('│     Positioning: ENFORCED                                           │');
    console.log('└──────────────────────────────────────────────────────────────────────┘');
    console.log('\n');

    // Output summary
    console.log(`[GATEKEEPER] → Strategist: ${decision.instructions_to_strategist.toUpperCase()}`);
    console.log(`[GATEKEEPER] → CoS: ${decision.notes_for_cos.substring(0, 80)}`);
    console.log(`[GATEKEEPER] → Architect Log: Decision ${decision.decisionId} recorded.\n`);
  }

  /**
   * Get last decision
   */
  getLastDecision(): GatekeeperDecision | null {
    return this.lastDecision;
  }

  /**
   * Get decision history
   */
  getDecisionHistory(): GatekeeperDecision[] {
    return this.decisionHistory;
  }

  /**
   * Get classification rules reference
   */
  getClassificationRules(): Record<RootCauseClass, string> {
    return CLASSIFICATION_RULES;
  }

  /**
   * Get gate constraints reference
   */
  getGateConstraints(): Record<RootCauseClass, { allowed: string[]; forbidden: string[] }> {
    return GATE_BY_ROOT_CAUSE;
  }
}

export const architectDecisionGatekeeper = new ArchitectDecisionGatekeeperService();
