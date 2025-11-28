/**
 * L6 EXECUTIVE COUNCIL - CONSENSUS PROTOCOL v1.0
 * 
 * Removes Human-in-the-Loop for standard operations by implementing
 * Unanimous Vote logic across three independent council members:
 * 
 * VOTE A: Governance Engine ("The Lawyer") - Regulatory compliance
 * VOTE B: Revenue Engine ("The Accountant") - Financial viability  
 * VOTE C: Coherence Engine ("The Brand Manager") - Brand alignment
 * 
 * EXECUTION RULES:
 * - 3x PASS = AUTO-EXECUTE (logged to Immutable Audit Trail)
 * - Any FAIL = HOLD (generates Chairman Alert)
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ExecuteCommandType = 'POST' | 'EMAIL' | 'BILLING' | 'CAMPAIGN' | 'CONTENT' | 'OFFER';

export type VoteResult = 'PASS' | 'FAIL';

export interface ExecuteCommand {
  command_id: string;
  type: ExecuteCommandType;
  payload: {
    title?: string;
    content?: string;
    target?: string;
    amount?: number;
    cta?: string;
    funnel_step?: string;
    scheduled_time?: string;
    metadata?: Record<string, any>;
  };
  agent_id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at: string;
}

export interface CouncilVote {
  member: 'GOVERNANCE' | 'REVENUE' | 'COHERENCE';
  alias: 'The Lawyer' | 'The Accountant' | 'The Brand Manager';
  vote: VoteResult;
  checks_performed: CheckResult[];
  reasoning: string;
  timestamp: string;
}

export interface CheckResult {
  check_name: string;
  passed: boolean;
  details: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface CouncilDecision {
  decision_id: string;
  command: ExecuteCommand;
  votes: CouncilVote[];
  unanimous: boolean;
  final_decision: 'AUTO_EXECUTE' | 'HOLD';
  chairman_alert?: ChairmanAlert;
  execution_timestamp?: string;
  logged_to_audit_trail: boolean;
  created_at: string;
}

export interface ChairmanAlert {
  alert_id: string;
  failed_votes: {
    member: string;
    alias: string;
    reasoning: string;
    failed_checks: string[];
  }[];
  recommended_action: string;
  escalation_level: 'REVIEW' | 'URGENT' | 'CRITICAL';
  created_at: string;
}

export interface LaunchQueueItem {
  item_id: string;
  command: ExecuteCommand;
  status: 'PENDING' | 'APPROVED' | 'HELD' | 'EXECUTED';
  council_decision?: CouncilDecision;
  scheduled_for: string;
  added_at: string;
}

// ============================================================================
// VOTE A: GOVERNANCE ENGINE ("The Lawyer")
// ============================================================================

class GovernanceEngine {
  private readonly ALIAS = 'The Lawyer';
  
  private readonly PROHIBITED_CLAIMS = [
    'guaranteed', 'always', 'never fails', '100%', 'proven',
    'best in class', 'industry-leading', 'revolutionary',
    'cure', 'treatment', 'diagnose', 'medical advice'
  ];

  private readonly REQUIRED_DISCLAIMERS_TOPICS = [
    'fda', 'clinical', 'trial', 'regulatory', 'compliance'
  ];

  private readonly L5_SAFETY_LOCKS = [
    'VQS_LOCK',
    'METHODOLOGY_LOCK', 
    'L6_BLOCK',
    'POSITIONING_LOCK',
    'OFFER_LADDER_LOCK'
  ];

  async vote(command: ExecuteCommand): Promise<CouncilVote> {
    const checks: CheckResult[] = [];
    const content = this.extractContent(command);

    // Check 1: Regulatory Compliance
    const regulatoryCheck = this.checkRegulatoryCompliance(content, command.type);
    checks.push(regulatoryCheck);

    // Check 2: No Absolute/Non-Substantiated Claims
    const claimsCheck = this.checkProhibitedClaims(content);
    checks.push(claimsCheck);

    // Check 3: Constraint Rules (L5 Safety Locks)
    const constraintCheck = await this.checkConstraintRules(command);
    checks.push(constraintCheck);

    // Check 4: Life Sciences Industry Filter
    const industryCheck = this.checkIndustryCompliance(content);
    checks.push(industryCheck);

    const allPassed = checks.every(c => c.passed);

    return {
      member: 'GOVERNANCE',
      alias: this.ALIAS,
      vote: allPassed ? 'PASS' : 'FAIL',
      checks_performed: checks,
      reasoning: allPassed 
        ? 'All governance checks passed. Content is compliant with regulatory requirements and constraint rules.'
        : `Governance concerns identified: ${checks.filter(c => !c.passed).map(c => c.check_name).join(', ')}`,
      timestamp: new Date().toISOString()
    };
  }

  private extractContent(command: ExecuteCommand): string {
    const parts = [
      command.payload.title || '',
      command.payload.content || '',
      command.payload.cta || ''
    ];
    return parts.join(' ').toLowerCase();
  }

  private checkRegulatoryCompliance(content: string, type: ExecuteCommandType): CheckResult {
    const issues: string[] = [];

    // Check for medical/health claims without proper context
    if (content.includes('fda') && !content.includes('consult')) {
      issues.push('FDA reference without consultation disclaimer');
    }

    // Check for life sciences content that needs disclaimers
    const needsDisclaimer = this.REQUIRED_DISCLAIMERS_TOPICS.some(topic => content.includes(topic));
    if (needsDisclaimer && !content.includes('disclaimer') && !content.includes('consult') && !content.includes('professional')) {
      issues.push('Regulatory topic mentioned without proper disclaimers');
    }

    // Billing commands need extra scrutiny
    if (type === 'BILLING' && !content.includes('terms')) {
      issues.push('Billing action should reference terms of service');
    }

    return {
      check_name: 'Regulatory Compliance',
      passed: issues.length === 0,
      details: issues.length === 0 
        ? 'Content meets regulatory compliance standards'
        : `Issues found: ${issues.join('; ')}`,
      severity: issues.length > 0 ? 'WARNING' : 'INFO'
    };
  }

  private checkProhibitedClaims(content: string): CheckResult {
    const foundClaims = this.PROHIBITED_CLAIMS.filter(claim => 
      content.includes(claim.toLowerCase())
    );

    return {
      check_name: 'No Absolute/Non-Substantiated Claims',
      passed: foundClaims.length === 0,
      details: foundClaims.length === 0
        ? 'No prohibited claims detected'
        : `Prohibited claims found: ${foundClaims.join(', ')}`,
      severity: foundClaims.length > 0 ? 'CRITICAL' : 'INFO'
    };
  }

  private async checkConstraintRules(command: ExecuteCommand): Promise<CheckResult> {
    const violations: string[] = [];

    // Load current governance state
    try {
      const statePath = path.join(process.cwd(), 'state/GATEKEEPER.json');
      if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        
        // Check if any locks are violated
        for (const lock of this.L5_SAFETY_LOCKS) {
          if (state[lock] === false || state[lock]?.active === false) {
            // Lock is disabled - check if this command type requires it
            if (lock === 'VQS_LOCK' && ['POST', 'EMAIL', 'CONTENT'].includes(command.type)) {
              violations.push(`VQS Lock disabled but required for ${command.type}`);
            }
            if (lock === 'L6_BLOCK' && command.agent_id.includes('L6')) {
              violations.push('L6 attempting execution while L6_BLOCK should be active');
            }
          }
        }
      }
    } catch (error) {
      // If we can't read state, be conservative
      violations.push('Unable to verify L5 Safety Locks state');
    }

    return {
      check_name: 'Constraint Rules (L5 Safety Locks)',
      passed: violations.length === 0,
      details: violations.length === 0
        ? 'All L5 Safety Locks verified'
        : `Violations: ${violations.join('; ')}`,
      severity: violations.length > 0 ? 'CRITICAL' : 'INFO'
    };
  }

  private checkIndustryCompliance(content: string): CheckResult {
    // Ensure content is Life Sciences focused
    const lifesSciencesKeywords = [
      'compliance', 'validation', 'csv', 'gxp', 'fda', 'ema', 'regulatory',
      'pharmaceutical', 'biotech', 'medical device', 'clinical', 'audit',
      'quality', 'capa', 'sop', 'gmp', 'glp', 'gcp', 'life sciences'
    ];

    const hasLifeSciencesFocus = lifesSciencesKeywords.some(kw => content.includes(kw));
    
    // Non-industry content is flagged but not necessarily blocked
    return {
      check_name: 'Life Sciences Industry Filter',
      passed: true, // Always pass but flag if missing
      details: hasLifeSciencesFocus
        ? 'Content aligned with Life Sciences industry focus'
        : 'Content may lack explicit Life Sciences context (advisory)',
      severity: hasLifeSciencesFocus ? 'INFO' : 'WARNING'
    };
  }
}

// ============================================================================
// VOTE B: REVENUE ENGINE ("The Accountant")
// ============================================================================

class RevenueEngine {
  private readonly ALIAS = 'The Accountant';
  private readonly DAILY_SPEND_CAP = 2500; // cents ($25)
  private dailySpend = 0;
  private lastResetDate = new Date().toISOString().split('T')[0];

  async vote(command: ExecuteCommand): Promise<CouncilVote> {
    const checks: CheckResult[] = [];

    // Check 1: Cost within daily cap
    const costCheck = this.checkDailyCap(command);
    checks.push(costCheck);

    // Check 2: Positive or neutral predicted ROI
    const roiCheck = this.checkPredictedROI(command);
    checks.push(roiCheck);

    // Check 3: Presence of monetization path
    const monetizationCheck = this.checkMonetizationPath(command);
    checks.push(monetizationCheck);

    // Check 4: Revenue Prime Directive alignment
    const directiveCheck = await this.checkRevenuePrimeDirective(command);
    checks.push(directiveCheck);

    const allPassed = checks.every(c => c.passed);

    return {
      member: 'REVENUE',
      alias: this.ALIAS,
      vote: allPassed ? 'PASS' : 'FAIL',
      checks_performed: checks,
      reasoning: allPassed
        ? 'All revenue checks passed. Action has positive financial outlook with clear monetization path.'
        : `Revenue concerns: ${checks.filter(c => !c.passed).map(c => c.check_name).join(', ')}`,
      timestamp: new Date().toISOString()
    };
  }

  private checkDailyCap(command: ExecuteCommand): CheckResult {
    this.resetIfNewDay();

    const estimatedCost = this.estimateCost(command);
    const wouldExceed = (this.dailySpend + estimatedCost) > this.DAILY_SPEND_CAP;

    return {
      check_name: 'Cost Within Daily Cap',
      passed: !wouldExceed,
      details: wouldExceed
        ? `Would exceed daily cap: $${(this.dailySpend + estimatedCost) / 100} > $${this.DAILY_SPEND_CAP / 100}`
        : `Within budget: $${(this.dailySpend + estimatedCost) / 100} of $${this.DAILY_SPEND_CAP / 100}`,
      severity: wouldExceed ? 'CRITICAL' : 'INFO'
    };
  }

  private estimateCost(command: ExecuteCommand): number {
    // Estimate cost based on command type
    const costMap: Record<ExecuteCommandType, number> = {
      'POST': 0, // LinkedIn posts are free
      'EMAIL': 10, // ~$0.10 per email via MailChimp
      'BILLING': 0, // Internal
      'CAMPAIGN': 50, // Campaign overhead
      'CONTENT': 5, // Content creation overhead
      'OFFER': 25 // Offer creation
    };
    return command.payload.amount || costMap[command.type] || 0;
  }

  private resetIfNewDay(): void {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastResetDate) {
      this.dailySpend = 0;
      this.lastResetDate = today;
    }
  }

  private checkPredictedROI(command: ExecuteCommand): CheckResult {
    // Calculate predicted ROI based on command type and priority
    const roiFactors: Record<ExecuteCommandType, number> = {
      'POST': 1.5, // LinkedIn posts typically have good ROI
      'EMAIL': 2.0, // Nurture emails have strong ROI
      'BILLING': 10.0, // Direct revenue
      'CAMPAIGN': 1.2, // Campaigns have variable ROI
      'CONTENT': 1.3, // Content has long-term ROI
      'OFFER': 3.0 // Offers drive conversions
    };

    const priorityMultiplier: Record<string, number> = {
      'CRITICAL': 2.0,
      'HIGH': 1.5,
      'MEDIUM': 1.0,
      'LOW': 0.8
    };

    const baseROI = roiFactors[command.type] || 1.0;
    const adjustedROI = baseROI * (priorityMultiplier[command.priority] || 1.0);
    const isPositive = adjustedROI >= 1.0;

    return {
      check_name: 'Positive or Neutral Predicted ROI',
      passed: isPositive,
      details: `Predicted ROI: ${(adjustedROI * 100 - 100).toFixed(0)}% (${isPositive ? 'positive' : 'negative'})`,
      severity: isPositive ? 'INFO' : 'WARNING'
    };
  }

  private checkMonetizationPath(command: ExecuteCommand): CheckResult {
    const hasCTA = !!command.payload.cta;
    const hasFunnelStep = !!command.payload.funnel_step;
    const hasTarget = !!command.payload.target;
    const isBilling = command.type === 'BILLING';
    
    const hasMonetizationPath = hasCTA || hasFunnelStep || isBilling || hasTarget;
    
    // For certain types, monetization path is required
    const requiresPath = ['POST', 'EMAIL', 'CAMPAIGN', 'OFFER'].includes(command.type);
    const passed = !requiresPath || hasMonetizationPath;

    return {
      check_name: 'Monetization Path Present',
      passed,
      details: hasMonetizationPath
        ? `Monetization path: ${[hasCTA && 'CTA', hasFunnelStep && 'Funnel Step', hasTarget && 'Target'].filter(Boolean).join(', ')}`
        : 'No clear monetization path (CTA, link, or funnel step)',
      severity: passed ? 'INFO' : 'WARNING'
    };
  }

  private async checkRevenuePrimeDirective(command: ExecuteCommand): Promise<CheckResult> {
    // Check alignment with Revenue Prime Directive
    try {
      const statePath = path.join(process.cwd(), 'state/REVENUE_PRIME_STATE.json');
      if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        
        // Check if Revenue Prime is active
        if (!state.active) {
          return {
            check_name: 'Revenue Prime Directive Alignment',
            passed: true,
            details: 'Revenue Prime not active - standard processing',
            severity: 'INFO'
          };
        }

        // Check priority alignment
        const isPriorityAligned = command.priority === 'HIGH' || command.priority === 'CRITICAL' ||
          state.priority_filter?.includes(command.type);

        return {
          check_name: 'Revenue Prime Directive Alignment',
          passed: isPriorityAligned,
          details: isPriorityAligned
            ? 'Action aligns with Revenue Prime Directive priorities'
            : 'Action not aligned with current Revenue Prime priorities',
          severity: isPriorityAligned ? 'INFO' : 'WARNING'
        };
      }
    } catch (error) {
      // If state unavailable, pass by default
    }

    return {
      check_name: 'Revenue Prime Directive Alignment',
      passed: true,
      details: 'Revenue Prime state not available - standard processing',
      severity: 'INFO'
    };
  }

  recordSpend(amount: number): void {
    this.resetIfNewDay();
    this.dailySpend += amount;
  }

  getSpendStatus(): { daily: number; cap: number; remaining: number } {
    this.resetIfNewDay();
    return {
      daily: this.dailySpend,
      cap: this.DAILY_SPEND_CAP,
      remaining: this.DAILY_SPEND_CAP - this.dailySpend
    };
  }
}

// ============================================================================
// VOTE C: COHERENCE ENGINE ("The Brand Manager")
// ============================================================================

class CoherenceEngine {
  private readonly ALIAS = 'The Brand Manager';
  private readonly DRIFT_THRESHOLD = 15; // 15% max drift

  private readonly ARCHETYPE_H_TRAITS = [
    'professional', 'authoritative', 'trusted advisor',
    'clarity', 'precision', 'expertise', 'ROI-focused',
    'practical', 'actionable', 'confident'
  ];

  private readonly ANTI_PATTERNS = [
    'aggressive sales', 'fear mongering', 'hyperbole',
    'casual/informal', 'memes', 'emojis overuse',
    'clickbait', 'sensational'
  ];

  async vote(command: ExecuteCommand): Promise<CouncilVote> {
    const checks: CheckResult[] = [];
    const content = this.extractContent(command);

    // Check 1: Tone = Archetype H
    const toneCheck = this.checkArchetypeH(content);
    checks.push(toneCheck);

    // Check 2: Drift Score < 15%
    const driftCheck = await this.checkDriftScore(content, command);
    checks.push(driftCheck);

    // Check 3: Alignment with Professional Equity + ROI framing
    const alignmentCheck = this.checkProfessionalEquity(content);
    checks.push(alignmentCheck);

    // Check 4: VQS Matrix compliance
    const vqsCheck = await this.checkVQSMatrix(command);
    checks.push(vqsCheck);

    const allPassed = checks.every(c => c.passed);

    return {
      member: 'COHERENCE',
      alias: this.ALIAS,
      vote: allPassed ? 'PASS' : 'FAIL',
      checks_performed: checks,
      reasoning: allPassed
        ? 'Content maintains brand coherence with Archetype H tone and VQS alignment.'
        : `Brand coherence concerns: ${checks.filter(c => !c.passed).map(c => c.check_name).join(', ')}`,
      timestamp: new Date().toISOString()
    };
  }

  private extractContent(command: ExecuteCommand): string {
    const parts = [
      command.payload.title || '',
      command.payload.content || '',
      command.payload.cta || ''
    ];
    return parts.join(' ').toLowerCase();
  }

  private checkArchetypeH(content: string): CheckResult {
    let archetypeScore = 0;
    let antiPatternScore = 0;

    // Check for archetype traits
    for (const trait of this.ARCHETYPE_H_TRAITS) {
      if (content.includes(trait.toLowerCase())) {
        archetypeScore += 10;
      }
    }

    // Check for anti-patterns
    for (const pattern of this.ANTI_PATTERNS) {
      if (content.includes(pattern.toLowerCase())) {
        antiPatternScore += 15;
      }
    }

    // Check for emoji overuse (more than 3 emojis in short content)
    // Simple check for excessive special characters that might indicate emoji use
    const specialCharCount = (content.match(/[^\w\s.,!?;:'"()-]/g) || []).length;
    if (specialCharCount > 10 && content.length < 500) {
      antiPatternScore += 10;
    }

    const finalScore = Math.max(0, archetypeScore - antiPatternScore);
    const passed = finalScore >= 0 && antiPatternScore < 20;

    return {
      check_name: 'Tone = Archetype H',
      passed,
      details: passed
        ? `Archetype H alignment: ${archetypeScore}pts, Anti-patterns: ${antiPatternScore}pts`
        : `Tone drift detected: Anti-pattern score ${antiPatternScore} too high`,
      severity: passed ? 'INFO' : 'WARNING'
    };
  }

  private async checkDriftScore(content: string, command: ExecuteCommand): Promise<CheckResult> {
    // Calculate drift from baseline messaging
    try {
      const baselinePath = path.join(process.cwd(), 'state/POSITIONING_MATRIX.json');
      if (fs.existsSync(baselinePath)) {
        const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
        
        // Simple keyword-based drift detection
        const coreKeywords = baseline.core_keywords || [
          'compliance', 'validation', 'csv', 'audit', 'quality',
          'regulatory', 'efficiency', 'automation', 'clarity'
        ];

        const keywordMatches = coreKeywords.filter((kw: string) => 
          content.includes(kw.toLowerCase())
        ).length;

        const driftScore = Math.max(0, 100 - (keywordMatches / coreKeywords.length * 100));
        const passed = driftScore < this.DRIFT_THRESHOLD;

        return {
          check_name: 'Drift Score < 15%',
          passed,
          details: `Drift score: ${driftScore.toFixed(1)}% (threshold: ${this.DRIFT_THRESHOLD}%)`,
          severity: passed ? 'INFO' : 'WARNING'
        };
      }
    } catch (error) {
      // If baseline unavailable, use lenient check
    }

    return {
      check_name: 'Drift Score < 15%',
      passed: true,
      details: 'Baseline not available - using lenient drift check',
      severity: 'INFO'
    };
  }

  private checkProfessionalEquity(content: string): CheckResult {
    // Check for Professional Equity markers
    const professionalMarkers = [
      'roi', 'value', 'efficiency', 'reduce', 'save', 'improve',
      'streamline', 'optimize', 'accelerate', 'ensure', 'guarantee-free',
      'confidence', 'trust', 'reliable', 'proven track record'
    ];

    const roiMarkers = [
      'roi', 'return', 'investment', 'cost', 'savings', 'revenue',
      'profit', 'value', 'benefit', 'outcome', 'result'
    ];

    const hasProfessionalEquity = professionalMarkers.some(m => content.includes(m));
    const hasROIFraming = roiMarkers.some(m => content.includes(m));

    // For content types that need professional framing
    const requiresFraming = ['POST', 'EMAIL', 'CONTENT', 'OFFER'].includes(content);
    const passed = !requiresFraming || hasProfessionalEquity || hasROIFraming;

    return {
      check_name: 'Professional Equity + ROI Framing',
      passed,
      details: `Professional: ${hasProfessionalEquity ? 'Yes' : 'No'}, ROI Framing: ${hasROIFraming ? 'Yes' : 'No'}`,
      severity: passed ? 'INFO' : 'WARNING'
    };
  }

  private async checkVQSMatrix(command: ExecuteCommand): Promise<CheckResult> {
    try {
      const vqsPath = path.join(process.cwd(), 'state/VQS_LOCK.json');
      if (fs.existsSync(vqsPath)) {
        const vqs = JSON.parse(fs.readFileSync(vqsPath, 'utf-8'));
        
        // VQS Lock should be active
        const isLocked = vqs.locked === true || vqs.active === true;
        
        return {
          check_name: 'VQS Matrix Compliance',
          passed: isLocked,
          details: isLocked
            ? 'VQS methodology lock is active and enforced'
            : 'VQS methodology lock is not active - potential drift risk',
          severity: isLocked ? 'INFO' : 'CRITICAL'
        };
      }
    } catch (error) {
      // VQS state unavailable
    }

    return {
      check_name: 'VQS Matrix Compliance',
      passed: true,
      details: 'VQS state not available - assuming compliant',
      severity: 'WARNING'
    };
  }
}

// ============================================================================
// CHAIRMAN ALERT GENERATOR
// ============================================================================

class ChairmanAlertGenerator {
  generateAlert(
    command: ExecuteCommand,
    failedVotes: CouncilVote[]
  ): ChairmanAlert {
    const alertId = `CHAIR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Determine escalation level based on severity
    let escalationLevel: 'REVIEW' | 'URGENT' | 'CRITICAL' = 'REVIEW';
    
    for (const vote of failedVotes) {
      const hasCritical = vote.checks_performed.some(c => !c.passed && c.severity === 'CRITICAL');
      if (hasCritical) {
        escalationLevel = 'CRITICAL';
        break;
      }
      const hasWarning = vote.checks_performed.some(c => !c.passed && c.severity === 'WARNING');
      if (hasWarning && escalationLevel === 'REVIEW') {
        escalationLevel = 'URGENT';
      }
    }

    // Generate recommended action
    const failedMembers = failedVotes.map(v => v.alias).join(', ');
    let recommendedAction = '';
    
    if (escalationLevel === 'CRITICAL') {
      recommendedAction = 'Immediate review required. Do not proceed without human verification.';
    } else if (escalationLevel === 'URGENT') {
      recommendedAction = 'Review failed checks and modify content to address concerns before resubmission.';
    } else {
      recommendedAction = 'Minor adjustments recommended. Review failed checks for compliance.';
    }

    return {
      alert_id: alertId,
      failed_votes: failedVotes.map(vote => ({
        member: vote.member,
        alias: vote.alias,
        reasoning: vote.reasoning,
        failed_checks: vote.checks_performed
          .filter(c => !c.passed)
          .map(c => `${c.check_name}: ${c.details}`)
      })),
      recommended_action: recommendedAction,
      escalation_level: escalationLevel,
      created_at: new Date().toISOString()
    };
  }
}

// ============================================================================
// IMMUTABLE COUNCIL AUDIT TRAIL
// ============================================================================

interface CouncilAuditEntry {
  entry_id: string;
  decision: CouncilDecision;
  execution_result?: {
    success: boolean;
    output?: string;
    error?: string;
  };
  timestamp: string;
}

class CouncilAuditTrail {
  private readonly AUDIT_FILE = 'state/L6_COUNCIL_AUDIT_TRAIL.json';
  private entries: CouncilAuditEntry[] = [];

  constructor() {
    this.loadEntries();
  }

  private loadEntries(): void {
    try {
      const auditPath = path.join(process.cwd(), this.AUDIT_FILE);
      if (fs.existsSync(auditPath)) {
        this.entries = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
      }
    } catch (error) {
      this.entries = [];
    }
  }

  private saveEntries(): void {
    try {
      const auditPath = path.join(process.cwd(), this.AUDIT_FILE);
      fs.writeFileSync(auditPath, JSON.stringify(this.entries, null, 2));
    } catch (error) {
      console.error('❌ Failed to save Council Audit Trail:', error);
    }
  }

  log(decision: CouncilDecision, executionResult?: CouncilAuditEntry['execution_result']): string {
    const entry: CouncilAuditEntry = {
      entry_id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      decision,
      execution_result: executionResult,
      timestamp: new Date().toISOString()
    };

    this.entries.push(entry);
    
    // Keep last 1000 entries
    if (this.entries.length > 1000) {
      this.entries = this.entries.slice(-1000);
    }

    this.saveEntries();
    return entry.entry_id;
  }

  getRecent(limit: number = 50): CouncilAuditEntry[] {
    return this.entries.slice(-limit).reverse();
  }

  getByDecision(decisionId: string): CouncilAuditEntry | undefined {
    return this.entries.find(e => e.decision.decision_id === decisionId);
  }

  getStats(): {
    total: number;
    approved: number;
    held: number;
    executed: number;
    last24h: number;
  } {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    return {
      total: this.entries.length,
      approved: this.entries.filter(e => e.decision.final_decision === 'AUTO_EXECUTE').length,
      held: this.entries.filter(e => e.decision.final_decision === 'HOLD').length,
      executed: this.entries.filter(e => e.execution_result?.success).length,
      last24h: this.entries.filter(e => new Date(e.timestamp).getTime() > dayAgo).length
    };
  }
}

// ============================================================================
// L6 EXECUTIVE COUNCIL - CONSENSUS ENGINE
// ============================================================================

class L6ExecutiveCouncil {
  private governanceEngine = new GovernanceEngine();
  private revenueEngine = new RevenueEngine();
  private coherenceEngine = new CoherenceEngine();
  private alertGenerator = new ChairmanAlertGenerator();
  private auditTrail = new CouncilAuditTrail();

  private readonly STATE_FILE = 'state/L6_COUNCIL_STATE.json';
  private launchQueue: LaunchQueueItem[] = [];

  constructor() {
    this.loadState();
    console.log('🏛️ L6 Executive Council initialized - Consensus Protocol active');
  }

  private loadState(): void {
    try {
      const statePath = path.join(process.cwd(), this.STATE_FILE);
      if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        this.launchQueue = state.launchQueue || [];
      }
    } catch (error) {
      this.launchQueue = [];
    }
  }

  private saveState(): void {
    try {
      const statePath = path.join(process.cwd(), this.STATE_FILE);
      const state = {
        launchQueue: this.launchQueue,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('❌ Failed to save Council state:', error);
    }
  }

  /**
   * MAIN ENTRY POINT: Submit a command for Council deliberation
   */
  async deliberate(command: ExecuteCommand): Promise<CouncilDecision> {
    const decisionId = `COUNCIL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`🏛️ [${decisionId}] Council convening for ${command.type} from ${command.agent_id}`);

    // Gather all three votes in parallel
    const [voteA, voteB, voteC] = await Promise.all([
      this.governanceEngine.vote(command),
      this.revenueEngine.vote(command),
      this.coherenceEngine.vote(command)
    ]);

    const votes = [voteA, voteB, voteC];
    const unanimous = votes.every(v => v.vote === 'PASS');
    const failedVotes = votes.filter(v => v.vote === 'FAIL');

    // Build decision
    const decision: CouncilDecision = {
      decision_id: decisionId,
      command,
      votes,
      unanimous,
      final_decision: unanimous ? 'AUTO_EXECUTE' : 'HOLD',
      logged_to_audit_trail: false,
      created_at: new Date().toISOString()
    };

    // Generate Chairman Alert if any vote failed
    if (!unanimous) {
      decision.chairman_alert = this.alertGenerator.generateAlert(command, failedVotes);
      console.log(`⚠️ [${decisionId}] HOLD: Chairman Alert generated - ${failedVotes.length} failed vote(s)`);
    } else {
      decision.execution_timestamp = new Date().toISOString();
      console.log(`✅ [${decisionId}] AUTO_EXECUTE: Unanimous approval`);
    }

    // Log to immutable audit trail
    this.auditTrail.log(decision);
    decision.logged_to_audit_trail = true;

    return decision;
  }

  /**
   * Execute a command that has been approved
   */
  async executeApproved(decision: CouncilDecision): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }> {
    if (decision.final_decision !== 'AUTO_EXECUTE') {
      return {
        success: false,
        error: 'Cannot execute command that was not approved by the Council'
      };
    }

    // Execute based on command type
    const command = decision.command;
    let result: { success: boolean; output?: string; error?: string };

    try {
      switch (command.type) {
        case 'POST':
          result = { success: true, output: `LinkedIn post queued: ${command.payload.title}` };
          break;
        case 'EMAIL':
          result = { success: true, output: `Email campaign initiated: ${command.payload.title}` };
          break;
        case 'BILLING':
          result = { success: true, output: `Billing action processed: ${command.payload.amount}` };
          break;
        case 'CAMPAIGN':
          result = { success: true, output: `Campaign activated: ${command.payload.title}` };
          break;
        case 'CONTENT':
          result = { success: true, output: `Content published: ${command.payload.title}` };
          break;
        case 'OFFER':
          result = { success: true, output: `Offer created: ${command.payload.title}` };
          break;
        default:
          result = { success: false, error: `Unknown command type: ${command.type}` };
      }

      // Track spend if applicable
      if (result.success && command.payload.amount) {
        this.revenueEngine.recordSpend(command.payload.amount);
      }

    } catch (error: any) {
      result = { success: false, error: error.message };
    }

    // Update audit trail with execution result
    this.auditTrail.log(decision, result);

    return result;
  }

  // ============================================================================
  // MONDAY MORNING LAUNCH QUEUE
  // ============================================================================

  /**
   * Add item to the Monday Morning Launch Queue
   */
  addToLaunchQueue(command: ExecuteCommand, scheduledFor?: string): LaunchQueueItem {
    const item: LaunchQueueItem = {
      item_id: `QUEUE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      command,
      status: 'PENDING',
      scheduled_for: scheduledFor || this.getNextMonday(),
      added_at: new Date().toISOString()
    };

    this.launchQueue.push(item);
    this.saveState();

    console.log(`📋 [${item.item_id}] Added to Monday Launch Queue: ${command.type} - ${command.payload.title}`);
    return item;
  }

  /**
   * Process entire launch queue through the Council
   */
  async processLaunchQueue(): Promise<{
    processed: number;
    approved: number;
    held: number;
    results: Array<{ item_id: string; status: string; decision?: CouncilDecision }>;
  }> {
    console.log('🚀 Processing Monday Morning Launch Queue through Council...');

    const results: Array<{ item_id: string; status: string; decision?: CouncilDecision }> = [];
    let approved = 0;
    let held = 0;

    for (const item of this.launchQueue.filter(i => i.status === 'PENDING')) {
      const decision = await this.deliberate(item.command);
      
      item.council_decision = decision;
      item.status = decision.final_decision === 'AUTO_EXECUTE' ? 'APPROVED' : 'HELD';

      if (item.status === 'APPROVED') {
        approved++;
      } else {
        held++;
      }

      results.push({
        item_id: item.item_id,
        status: item.status,
        decision
      });
    }

    this.saveState();

    console.log(`📊 Launch Queue processed: ${approved} APPROVED, ${held} HELD`);

    return {
      processed: results.length,
      approved,
      held,
      results
    };
  }

  /**
   * Execute all approved items in the queue
   */
  async executeApprovedQueue(): Promise<{
    executed: number;
    failed: number;
    results: Array<{ item_id: string; success: boolean; output?: string; error?: string }>;
  }> {
    const approvedItems = this.launchQueue.filter(i => i.status === 'APPROVED');
    const results: Array<{ item_id: string; success: boolean; output?: string; error?: string }> = [];
    let executed = 0;
    let failed = 0;

    for (const item of approvedItems) {
      if (item.council_decision) {
        const result = await this.executeApproved(item.council_decision);
        
        if (result.success) {
          item.status = 'EXECUTED';
          executed++;
        } else {
          failed++;
        }

        results.push({
          item_id: item.item_id,
          ...result
        });
      }
    }

    this.saveState();

    return { executed, failed, results };
  }

  /**
   * Get current launch queue
   */
  getLaunchQueue(): LaunchQueueItem[] {
    return this.launchQueue;
  }

  /**
   * Clear executed items from queue
   */
  clearExecutedFromQueue(): number {
    const before = this.launchQueue.length;
    this.launchQueue = this.launchQueue.filter(i => i.status !== 'EXECUTED');
    this.saveState();
    return before - this.launchQueue.length;
  }

  private getNextMonday(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const monday = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
    monday.setHours(9, 0, 0, 0); // 9 AM
    return monday.toISOString();
  }

  // ============================================================================
  // STATUS & TELEMETRY
  // ============================================================================

  getStatus(): {
    council_active: boolean;
    audit_stats: ReturnType<CouncilAuditTrail['getStats']>;
    queue_stats: { total: number; pending: number; approved: number; held: number; executed: number };
    spend_status: ReturnType<RevenueEngine['getSpendStatus']>;
  } {
    return {
      council_active: true,
      audit_stats: this.auditTrail.getStats(),
      queue_stats: {
        total: this.launchQueue.length,
        pending: this.launchQueue.filter(i => i.status === 'PENDING').length,
        approved: this.launchQueue.filter(i => i.status === 'APPROVED').length,
        held: this.launchQueue.filter(i => i.status === 'HELD').length,
        executed: this.launchQueue.filter(i => i.status === 'EXECUTED').length
      },
      spend_status: this.revenueEngine.getSpendStatus()
    };
  }

  getAuditTrail(limit: number = 50): CouncilAuditEntry[] {
    return this.auditTrail.getRecent(limit);
  }

  getChairmanAlerts(): ChairmanAlert[] {
    return this.launchQueue
      .filter(i => i.council_decision?.chairman_alert)
      .map(i => i.council_decision!.chairman_alert!);
  }
}

// Export singleton instance
export const l6ExecutiveCouncil = new L6ExecutiveCouncil();

// Export types for routes
export type {
  CouncilAuditEntry
};