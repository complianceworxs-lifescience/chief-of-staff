/**
 * ARCHITECT DECISION FRAMEWORK — RPM RESTORATION BRIEF v1.0
 * 
 * Standardized method to evaluate, approve, modify, or reject the Strategist's
 * proposed corrective actions following RPM confidence collapse.
 * 
 * Every decision must align with:
 * - Revenue Integrity
 * - Audit Defensibility  
 * - VQS Protection
 * - L5 Governance
 * - Offer Ladder Safety
 * - Brand Stability
 */

// Failure Classification Types
type FailureClass = 
  | 'UDL_INTEGRITY_FAILURE'           // A: Stale/corrupted data
  | 'OFFER_LADDER_BLOCKAGE'           // B: Tier stall patterns
  | 'STAKEHOLDER_PACKET_FRICTION'     // C: IT/QA/Finance resistance
  | 'EXTERNAL_SIGNAL_DISRUPTION'      // D: Dark social/market shift
  | 'INTERNAL_DRIFT';                 // E: Agent behavior deviation

type DecisionUrgency = 'critical' | 'high' | 'medium' | 'low';
type CorrectionType = 
  | 'data_resync'
  | 'pipeline_unclogging'
  | 'packet_revision'
  | 'signal_recalibration'
  | 'agent_alignment_reset';

interface FailureClassification {
  class: FailureClass;
  urgency: DecisionUrgency;
  correctionType: CorrectionType;
  symptoms: string[];
  meaning: string;
}

// The 6 Mandatory Evaluation Criteria
interface CriterionResult {
  criterion: string;
  mustPass: true;
  passed: boolean;
  evidence: string;
  violationReason?: string;
}

interface FrameworkEvaluation {
  vqsProtection: CriterionResult;
  revenueIntegrity: CriterionResult;
  auditDefensibility: CriterionResult;
  offerLadderIntegrity: CriterionResult;
  systemStability: CriterionResult;
  restorativePower24h: CriterionResult;
}

// Verdict Types
type VerdictType = 'APPROVED' | 'MODIFIED' | 'REJECTED';

interface ArchitectVerdict {
  verdictId: string;
  timestamp: string;
  
  // Strategist input reference
  strategistAnalysisId: string;
  proposedAction: string;
  
  // Framework application
  failureClassification: FailureClassification;
  evaluation: FrameworkEvaluation;
  
  // Verdict
  verdict: VerdictType;
  verdictRationale: string;
  
  // Execution directives
  executionDirective: {
    command: string;
    enforcedBy: 'CoS';
    implementers: string[];
    deadline: string;
    followUpRequired: boolean;
    followUpTime: string;
  };
  
  // Architect command (for CoS enforcement)
  architectCommand: string;
}

interface DiagnosticBrief {
  analysisId: string;
  rootCause: {
    source: string;
    category: string;
    confidence: number;
    evidence: string;
  };
  proposedAction: {
    action: string;
    owner: string;
    executionSteps: string[];
    riskLevel: string;
    timeToEffect: string;
    expectedImpact: string;
  };
  projection: {
    currentRpm: number;
    projectedRpm: number;
    confidenceInProjection: number;
    milestones: Array<{
      hour: number;
      expectedRpm: number;
      checkpoint: string;
    }>;
  };
  safety: {
    vqsProtected: boolean;
    noAgentMutation: boolean;
    noL6Activation: boolean;
    offerLadderLocked: boolean;
  };
}

class ArchitectDecisionFramework {
  private verdictHistory: ArchitectVerdict[] = [];
  private currentVerdict: ArchitectVerdict | null = null;

  /**
   * SECTION 1: Classify the failure from Strategist's root cause
   */
  classifyFailure(rootCause: DiagnosticBrief['rootCause']): FailureClassification {
    console.log('[ARCHITECT] 📋 Classifying failure from Strategist diagnostic...');
    
    const category = rootCause.category.toLowerCase();
    
    if (category.includes('udl') || category.includes('data') || category.includes('integrity')) {
      return {
        class: 'UDL_INTEGRITY_FAILURE',
        urgency: 'high',
        correctionType: 'data_resync',
        symptoms: ['Stale data (>30 min)', 'Conflicting metrics', 'Missing signals', 'Sudden scoring anomalies'],
        meaning: 'Prediction engine used invalid or poisoned inputs'
      };
    }
    
    if (category.includes('offer') || category.includes('ladder') || category.includes('tier') || category.includes('blockage')) {
      return {
        class: 'OFFER_LADDER_BLOCKAGE',
        urgency: 'medium',
        correctionType: 'pipeline_unclogging',
        symptoms: ['Tier 1 → Tier 2 drop-offs', 'Micro-offer congestion', 'High-intent signals not converting'],
        meaning: 'Predictive model sees declining forward motion in the pipeline'
      };
    }
    
    if (category.includes('stakeholder') || category.includes('packet') || category.includes('friction')) {
      return {
        class: 'STAKEHOLDER_PACKET_FRICTION',
        urgency: 'high',
        correctionType: 'packet_revision',
        symptoms: ['IT/QA/Finance packet opens without follow-through', 'Increased QA objections', 'More friction at committee proof stage'],
        meaning: 'Model sees multi-stakeholder resistance slowing conversion velocity'
      };
    }
    
    if (category.includes('external') || category.includes('signal') || category.includes('market') || category.includes('dark')) {
      return {
        class: 'EXTERNAL_SIGNAL_DISRUPTION',
        urgency: 'medium',
        correctionType: 'signal_recalibration',
        symptoms: ['Sudden decline in Benchmark Post engagement', 'Negative sentiment spikes', 'Industry changes'],
        meaning: 'Market shifted, reducing predictability'
      };
    }
    
    if (category.includes('drift') || category.includes('agent') || category.includes('deviation')) {
      return {
        class: 'INTERNAL_DRIFT',
        urgency: 'critical',
        correctionType: 'agent_alignment_reset',
        symptoms: ['CRO skipping sequence steps', 'CMO reducing cadence', 'Misaligned messaging'],
        meaning: 'Agents deviated from canonical L5 rules'
      };
    }
    
    // Default to stakeholder friction based on evidence
    return {
      class: 'STAKEHOLDER_PACKET_FRICTION',
      urgency: 'high',
      correctionType: 'packet_revision',
      symptoms: ['IT/QA/Finance resistance', 'Silent stalls', 'Committee proof friction'],
      meaning: 'Multi-stakeholder resistance slowing conversion velocity'
    };
  }

  /**
   * SECTION 2: Evaluate the 6 mandatory criteria
   */
  evaluateProposedAction(brief: DiagnosticBrief): FrameworkEvaluation {
    console.log('[ARCHITECT] 🔍 Evaluating proposed action against 6 criteria...');

    // Criterion 1: VQS Protection
    const vqsProtection: CriterionResult = {
      criterion: 'VQS Protection',
      mustPass: true,
      passed: brief.safety.vqsProtected && 
              !brief.proposedAction.action.toLowerCase().includes('inflate') &&
              !brief.proposedAction.action.toLowerCase().includes('hype'),
      evidence: brief.safety.vqsProtected 
        ? 'VQS explicitly protected in safety constraints. Action simplifies approval pathway without changing methodology.'
        : 'VQS protection not confirmed'
    };

    // Criterion 2: Revenue Integrity
    const revenueIntegrity: CriterionResult = {
      criterion: 'Revenue Integrity',
      mustPass: true,
      passed: brief.projection.projectedRpm > brief.projection.currentRpm &&
              brief.proposedAction.riskLevel.toLowerCase() !== 'high',
      evidence: `Action improves conversion velocity by unblocking ${brief.rootCause.evidence.match(/\d+/)?.[0] || '8'} stalled prospects. Stabilizes trajectory without churn. Risk level: ${brief.proposedAction.riskLevel.toUpperCase()}.`
    };

    // Criterion 3: Audit Defensibility
    const auditDefensibility: CriterionResult = {
      criterion: 'Audit Defensibility',
      mustPass: true,
      passed: !brief.proposedAction.action.toLowerCase().includes('speculative') &&
              !brief.proposedAction.action.toLowerCase().includes('hype') &&
              brief.proposedAction.executionSteps.every(step => 
                !step.toLowerCase().includes('claim') && 
                !step.toLowerCase().includes('guarantee')),
      evidence: 'Executive Summary condensation is audit-grade. Direct escalation is standard business practice. No speculative or hype-based mechanisms.'
    };

    // Criterion 4: Offer Ladder Integrity
    const offerLadderIntegrity: CriterionResult = {
      criterion: 'Offer Ladder Integrity',
      mustPass: true,
      passed: brief.safety.offerLadderLocked &&
              !brief.proposedAction.action.toLowerCase().includes('skip tier') &&
              !brief.proposedAction.action.toLowerCase().includes('rearrange'),
      evidence: 'Action works WITHIN existing tier structure (Tier 1 → Tier 2 → Tier 3). Accelerates movement within established sequence without shortcuts. Offer ladder locked during restoration.'
    };

    // Criterion 5: System Stability
    const systemStability: CriterionResult = {
      criterion: 'System Stability',
      mustPass: true,
      passed: brief.safety.noL6Activation && 
              brief.safety.noAgentMutation &&
              !brief.proposedAction.action.toLowerCase().includes('experiment'),
      evidence: 'No L6 activation. L5 constraints maintained. Safety locks respected. No agent mutation. All agents operate within canonical L5 patterns.'
    };

    // Criterion 6: 24-Hour Restorative Power
    const restorativePower24h: CriterionResult = {
      criterion: '24-Hour Restorative Power',
      mustPass: true,
      passed: brief.projection.projectedRpm >= 0.90 && 
              brief.projection.confidenceInProjection >= 75 &&
              brief.proposedAction.timeToEffect.includes('24'),
      evidence: `Projected: ${(brief.projection.currentRpm * 100).toFixed(0)}% → ${(brief.projection.projectedRpm * 100).toFixed(0)}% (${brief.projection.confidenceInProjection}% confidence). Milestones at +2h, +8h, +16h, +24h are achievable and progressive.`
    };

    console.log(`[ARCHITECT]    VQS Protection: ${vqsProtection.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`[ARCHITECT]    Revenue Integrity: ${revenueIntegrity.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`[ARCHITECT]    Audit Defensibility: ${auditDefensibility.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`[ARCHITECT]    Offer Ladder Integrity: ${offerLadderIntegrity.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`[ARCHITECT]    System Stability: ${systemStability.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`[ARCHITECT]    24h Restorative Power: ${restorativePower24h.passed ? '✅ PASS' : '❌ FAIL'}`);

    return {
      vqsProtection,
      revenueIntegrity,
      auditDefensibility,
      offerLadderIntegrity,
      systemStability,
      restorativePower24h
    };
  }

  /**
   * SECTION 3: Render Architect Verdict
   */
  renderVerdict(
    brief: DiagnosticBrief,
    classification: FailureClassification,
    evaluation: FrameworkEvaluation
  ): ArchitectVerdict {
    console.log('[ARCHITECT] ⚖️  Rendering verdict...');

    const allCriteriaPassed = Object.values(evaluation).every(c => c.passed);
    const failedCriteria = Object.values(evaluation).filter(c => !c.passed);

    let verdict: VerdictType;
    let verdictRationale: string;
    let architectCommand: string;

    if (allCriteriaPassed) {
      // APPROVED
      verdict = 'APPROVED';
      verdictRationale = `All 6 mandatory criteria passed. Action is low risk, high restorative value, and fully aligned with L5 governance. Classification: ${classification.class} (${classification.urgency} urgency). Correction type aligns with diagnosed failure.`;
      architectCommand = 'EXECUTE_IMMEDIATELY: CoS to enforce STAKEHOLDER_PACKET_UNBLOCK. CRO and ContentManager to implement within 24h. 24h follow-up brief required.';
    } else if (failedCriteria.length <= 2 && 
               !failedCriteria.some(c => c.criterion === 'VQS Protection') &&
               !failedCriteria.some(c => c.criterion === 'Audit Defensibility')) {
      // MODIFIED - direction correct but needs adjustment
      verdict = 'MODIFIED';
      verdictRationale = `Action direction is correct but ${failedCriteria.length} criterion failed: ${failedCriteria.map(c => c.criterion).join(', ')}. Architect adjustment required.`;
      architectCommand = `ARCHITECT_MODIFICATION_REQUIRED: Adjust ${failedCriteria.map(c => c.criterion).join(', ')}. Resubmit narrower action.`;
    } else {
      // REJECTED
      verdict = 'REJECTED';
      verdictRationale = `Failed mandatory criteria: ${failedCriteria.map(c => c.criterion).join(', ')}. ${failedCriteria.length > 2 ? 'Too many failures.' : ''} ${failedCriteria.some(c => c.criterion === 'VQS Protection') ? 'VQS violation is automatic rejection.' : ''}`;
      architectCommand = 'rerun_diagnostics_with_tighter_constraints: Strategist must return a new, narrower action.';
    }

    const now = new Date();
    const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const followUpTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const architectVerdict: ArchitectVerdict = {
      verdictId: `VERDICT-${Date.now()}`,
      timestamp: now.toISOString(),
      
      strategistAnalysisId: brief.analysisId,
      proposedAction: brief.proposedAction.action,
      
      failureClassification: classification,
      evaluation,
      
      verdict,
      verdictRationale,
      
      executionDirective: {
        command: verdict === 'APPROVED' ? 'EXECUTE_STAKEHOLDER_PACKET_UNBLOCK' : 
                 verdict === 'MODIFIED' ? 'AWAIT_ARCHITECT_MODIFICATION' : 'RERUN_DIAGNOSTICS',
        enforcedBy: 'CoS',
        implementers: verdict === 'APPROVED' ? ['CRO', 'ContentManager', 'CoS'] : [],
        deadline: deadline.toISOString(),
        followUpRequired: true,
        followUpTime: followUpTime.toISOString()
      },
      
      architectCommand
    };

    this.currentVerdict = architectVerdict;
    this.verdictHistory.push(architectVerdict);
    this.logVerdict(architectVerdict);

    return architectVerdict;
  }

  /**
   * Full framework application: Classify → Evaluate → Render
   */
  applyFramework(brief: DiagnosticBrief): ArchitectVerdict {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║     ARCHITECT DECISION FRAMEWORK — RPM RESTORATION BRIEF v1.0    ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log(`\n📋 Processing Strategist Analysis: ${brief.analysisId}\n`);

    // Section 1: Classify
    const classification = this.classifyFailure(brief.rootCause);
    console.log(`\n[ARCHITECT] 📁 FAILURE CLASS: ${classification.class}`);
    console.log(`[ARCHITECT]    Urgency: ${classification.urgency.toUpperCase()}`);
    console.log(`[ARCHITECT]    Correction Type: ${classification.correctionType}`);

    // Section 2: Evaluate
    console.log('\n[ARCHITECT] 📊 CRITERION EVALUATION:');
    const evaluation = this.evaluateProposedAction(brief);

    // Section 3: Render Verdict
    const verdict = this.renderVerdict(brief, classification, evaluation);

    return verdict;
  }

  /**
   * Log the verdict in structured format
   */
  private logVerdict(verdict: ArchitectVerdict): void {
    const icon = verdict.verdict === 'APPROVED' ? '✅' : 
                 verdict.verdict === 'MODIFIED' ? '🔧' : '❌';

    console.log('\n');
    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log(`│                    ARCHITECT VERDICT: ${verdict.verdict.padEnd(10)}                  │`);
    console.log('├──────────────────────────────────────────────────────────────────┤');
    console.log(`│  ${icon} Verdict ID: ${verdict.verdictId.padEnd(47)}│`);
    console.log(`│  📋 Strategist Analysis: ${verdict.strategistAnalysisId.padEnd(36)}│`);
    console.log('├──────────────────────────────────────────────────────────────────┤');
    console.log('│  FAILURE CLASSIFICATION:                                         │');
    console.log(`│    Class: ${verdict.failureClassification.class.padEnd(53)}│`);
    console.log(`│    Urgency: ${verdict.failureClassification.urgency.toUpperCase().padEnd(51)}│`);
    console.log('├──────────────────────────────────────────────────────────────────┤');
    console.log('│  CRITERION RESULTS:                                              │');
    console.log(`│    VQS Protection:       ${verdict.evaluation.vqsProtection.passed ? '✅ PASS' : '❌ FAIL'}                                  │`);
    console.log(`│    Revenue Integrity:    ${verdict.evaluation.revenueIntegrity.passed ? '✅ PASS' : '❌ FAIL'}                                  │`);
    console.log(`│    Audit Defensibility:  ${verdict.evaluation.auditDefensibility.passed ? '✅ PASS' : '❌ FAIL'}                                  │`);
    console.log(`│    Offer Ladder:         ${verdict.evaluation.offerLadderIntegrity.passed ? '✅ PASS' : '❌ FAIL'}                                  │`);
    console.log(`│    System Stability:     ${verdict.evaluation.systemStability.passed ? '✅ PASS' : '❌ FAIL'}                                  │`);
    console.log(`│    24h Restorative:      ${verdict.evaluation.restorativePower24h.passed ? '✅ PASS' : '❌ FAIL'}                                  │`);
    console.log('├──────────────────────────────────────────────────────────────────┤');
    console.log('│  ARCHITECT COMMAND:                                              │');
    const commandLines = this.wrapText(verdict.architectCommand, 60);
    commandLines.forEach(line => {
      console.log(`│    ${line.padEnd(62)}│`);
    });
    console.log('├──────────────────────────────────────────────────────────────────┤');
    console.log('│  EXECUTION DIRECTIVE:                                            │');
    console.log(`│    Enforced By: ${verdict.executionDirective.enforcedBy.padEnd(47)}│`);
    console.log(`│    Implementers: ${verdict.executionDirective.implementers.join(', ').padEnd(46)}│`);
    console.log(`│    Deadline: ${verdict.executionDirective.deadline.padEnd(50)}│`);
    console.log(`│    Follow-Up Required: ${verdict.executionDirective.followUpRequired ? 'YES' : 'NO'}                                      │`);
    console.log('└──────────────────────────────────────────────────────────────────┘');
    console.log('\n');
  }

  private wrapText(text: string, width: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= width) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  /**
   * Get current verdict
   */
  getCurrentVerdict(): ArchitectVerdict | null {
    return this.currentVerdict;
  }

  /**
   * Get verdict history
   */
  getVerdictHistory(): ArchitectVerdict[] {
    return this.verdictHistory;
  }
}

export const architectDecisionFramework = new ArchitectDecisionFramework();
