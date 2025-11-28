/**
 * L7 CONSTITUTIONAL CONSTRAINTS
 * 
 * Immutable. Non-Editable. Non-Overrideable. Survive Self-Modification.
 * 
 * These are the immutable laws that prevent the L7 system from drifting
 * into destructive optimization loops once self-creative capabilities come online.
 * 
 * Five Pillars:
 * 1. Prestige Protocol (Brand Protection)
 * 2. Liability Iron Dome (Regulatory & Legal Safety)
 * 3. Burn Rate Breaker (Financial Safety)
 * 4. Domain Fence (Mission Creep Prevention)
 * 5. Additional Constraints (Manipulation, Reputation, Dignity)
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONSTITUTIONAL CONSTRAINT TYPES
// ============================================================================

interface PrestigeProtocol {
  id: 'PRESTIGE_PROTOCOL';
  name: 'Brand Protection';
  immutable: true;
  price_floor_percent: number;
  forbidden_terms: string[];
  required_archetype: 'H';
  disallowed_tones: string[];
  rule: string;
}

interface LiabilityIronDome {
  id: 'LIABILITY_IRON_DOME';
  name: 'Regulatory & Legal Safety';
  immutable: true;
  banned_claim_terms: string[];
  no_outcome_claims_rule: string;
  disclaimer_required: true;
  disclaimer_text: string;
}

interface BurnRateBreaker {
  id: 'BURN_RATE_BREAKER';
  name: 'Financial Safety';
  immutable: true;
  max_spend_per_hour: number;
  max_daily_spend: number;
  min_gross_margin_percent: number;
  velocity_cap_rule: string;
}

interface DomainFence {
  id: 'DOMAIN_FENCE';
  name: 'Mission Creep Prevention';
  immutable: true;
  domain_whitelist: string[];
  out_of_bounds_action: 'AUTO_LOCKDOWN_HUMAN_ALERT';
  product_vector_lock_rule: string;
}

interface AdditionalConstraints {
  manipulation_firewall: {
    id: 'MANIPULATION_FIREWALL';
    forbidden_tactics: string[];
    rule: string;
  };
  reputation_sentinel: {
    id: 'REPUTATION_SENTINEL';
    reputation_score_min: number;
    rule: string;
  };
  human_dignity_clause: {
    id: 'HUMAN_DIGNITY_CLAUSE';
    rule: string;
  };
}

interface ConstitutionalState {
  version: string;
  last_enforced: string;
  enforcement_count: number;
  violations_blocked: number;
  pillars: {
    prestige_protocol: PrestigeProtocol;
    liability_iron_dome: LiabilityIronDome;
    burn_rate_breaker: BurnRateBreaker;
    domain_fence: DomainFence;
    additional_constraints: AdditionalConstraints;
  };
  violation_log: ViolationEntry[];
}

interface ViolationEntry {
  timestamp: string;
  pillar: string;
  constraint_id: string;
  attempted_action: string;
  blocked: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
}

interface ValidationResult {
  valid: boolean;
  violations: {
    pillar: string;
    constraint: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
  enforcement_action: 'ALLOW' | 'BLOCK' | 'BLOCK_AND_ALERT';
}

// ============================================================================
// DEFAULT CONSTITUTIONAL CONSTRAINTS (IMMUTABLE)
// ============================================================================

const DEFAULT_CONSTRAINTS: ConstitutionalState = {
  version: '1.0.0',
  last_enforced: new Date().toISOString(),
  enforcement_count: 0,
  violations_blocked: 0,
  pillars: {
    prestige_protocol: {
      id: 'PRESTIGE_PROTOCOL',
      name: 'Brand Protection',
      immutable: true,
      price_floor_percent: 70, // No product below 70% of standard pricing
      forbidden_terms: [
        'cheap', 'discount', 'bargain', 'flash sale', 'hack', 
        'limited time', 'deal', 'steal', 'giveaway', 'free trial',
        'act now', 'hurry', 'last chance', 'one-time offer'
      ],
      required_archetype: 'H', // High Authority
      disallowed_tones: [
        'desperation', 'hype', 'fear mongering', 'urgency manipulation',
        'scarcity pressure', 'FOMO inducing', 'aggressive selling'
      ],
      rule: 'If tone falls into disallowed vectors, asset is rejected automatically. The brand cannot be optimized into a commodity product.'
    },
    liability_iron_dome: {
      id: 'LIABILITY_IRON_DOME',
      name: 'Regulatory & Legal Safety',
      immutable: true,
      banned_claim_terms: [
        'guarantee', 'guaranteed', 'immune', 'promise', 'assured', 
        'zero risk', 'risk-free', 'foolproof', 'fail-proof', 'bulletproof',
        'always', 'never fails', '100% success', 'certified outcome'
      ],
      no_outcome_claims_rule: 'The System shall NEVER claim audit outcomes, regulatory outcomes, FDA decisions, or legal outcomes. No predictions of inspection results.',
      disclaimer_required: true,
      disclaimer_text: 'This information is provided for educational purposes only and does not constitute legal, regulatory, or compliance advice. Consult qualified professionals for specific guidance. Results may vary based on individual circumstances.'
    },
    burn_rate_breaker: {
      id: 'BURN_RATE_BREAKER',
      name: 'Financial Safety',
      immutable: true,
      max_spend_per_hour: 100, // $100/hour hard cap
      max_daily_spend: 2500, // $2,500/day budget (matches L6 council cap)
      min_gross_margin_percent: 40, // No campaign below 40% margin
      velocity_cap_rule: 'Hard ceiling that no optimization logic can bypass. Even if AI identifies a temporary gold rush, it cannot burn the business down chasing it.'
    },
    domain_fence: {
      id: 'DOMAIN_FENCE',
      name: 'Mission Creep Prevention',
      immutable: true,
      domain_whitelist: [
        'Life Sciences', 'Quality Assurance', 'Validation', 
        'Regulatory Compliance', 'Software Quality', 'GxP', 
        'Audit Readiness', 'CSV', 'QMS', 'FDA Compliance',
        'Pharmaceuticals', 'Biotechnology', 'Medical Devices',
        'CRO', 'CMO', 'Diagnostics', 'Clinical Trials',
        'Computer System Validation', 'Data Integrity',
        '21 CFR Part 11', 'Annex 11', 'EU GMP'
      ],
      out_of_bounds_action: 'AUTO_LOCKDOWN_HUMAN_ALERT',
      product_vector_lock_rule: 'No product line may be created outside ComplianceWorxs core semantic vectors. The system cannot pivot into crypto, weight loss, real estate, or any irrelevant niche—even if revenue metrics say go.'
    },
    additional_constraints: {
      manipulation_firewall: {
        id: 'MANIPULATION_FIREWALL',
        forbidden_tactics: [
          'scarcity manipulation', 'fear-based compliance', 'unverifiable claims',
          'emotional exploitation', 'false urgency', 'misleading comparisons',
          'hidden fees', 'bait and switch', 'dark patterns'
        ],
        rule: 'Prevents emotional, deceptive, or dark persuasion methods. The system must not harm long-term trust for short-term cash.'
      },
      reputation_sentinel: {
        id: 'REPUTATION_SENTINEL',
        reputation_score_min: 85, // Minimum reputation score out of 100
        rule: 'The system must not harm long-term trust for short-term cash. Actions that would reduce reputation score below threshold are blocked.'
      },
      human_dignity_clause: {
        id: 'HUMAN_DIGNITY_CLAUSE',
        rule: 'The System shall not exploit vulnerabilities for conversion. No weaponized targeting or unethical personalization. Respect professional dignity of all stakeholders.'
      }
    }
  },
  violation_log: []
};

// ============================================================================
// L7 CONSTITUTIONAL CONSTRAINTS SERVICE
// ============================================================================

class L7ConstitutionalConstraints {
  private state: ConstitutionalState;
  private stateFilePath: string;
  private readonly IMMUTABLE_MARKER = '___CONSTITUTIONAL_IMMUTABLE___';

  constructor() {
    this.stateFilePath = path.join(process.cwd(), 'state', 'L7_CONSTITUTION.json');
    this.state = this.loadState();
  }

  private loadState(): ConstitutionalState {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, 'utf-8');
        const loaded = JSON.parse(data) as ConstitutionalState;
        // Ensure immutable fields are preserved from defaults
        return this.enforceImmutability(loaded);
      }
    } catch (error) {
      console.error('[L7Constitution] Error loading state, using defaults:', error);
    }
    this.saveState(DEFAULT_CONSTRAINTS);
    return { ...DEFAULT_CONSTRAINTS };
  }

  private enforceImmutability(loaded: ConstitutionalState): ConstitutionalState {
    // Constitutional constraints cannot be weakened - only strengthened
    // Merge loaded with defaults, keeping stricter values
    const enforced = { ...DEFAULT_CONSTRAINTS };
    
    // Preserve violation log from loaded state
    enforced.violation_log = loaded.violation_log || [];
    enforced.enforcement_count = loaded.enforcement_count || 0;
    enforced.violations_blocked = loaded.violations_blocked || 0;
    
    return enforced;
  }

  private saveState(): void {
    try {
      const stateDir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('[L7Constitution] Error saving state:', error);
    }
  }

  // ============================================================================
  // PILLAR 1: PRESTIGE PROTOCOL (BRAND PROTECTION)
  // ============================================================================

  validatePrestigeProtocol(content: {
    text?: string;
    price?: number;
    standard_price?: number;
    tone?: string;
  }): ValidationResult {
    const violations: ValidationResult['violations'] = [];
    const pillar = this.state.pillars.prestige_protocol;

    // Check price floor
    if (content.price && content.standard_price) {
      const pricePercent = (content.price / content.standard_price) * 100;
      if (pricePercent < pillar.price_floor_percent) {
        violations.push({
          pillar: 'PRESTIGE_PROTOCOL',
          constraint: 'PRICE_FLOOR',
          message: `Price ${pricePercent.toFixed(1)}% is below minimum ${pillar.price_floor_percent}% floor`,
          severity: 'HIGH'
        });
      }
    }

    // Check forbidden terms
    if (content.text) {
      const textLower = content.text.toLowerCase();
      for (const term of pillar.forbidden_terms) {
        if (textLower.includes(term.toLowerCase())) {
          violations.push({
            pillar: 'PRESTIGE_PROTOCOL',
            constraint: 'FORBIDDEN_VOCABULARY',
            message: `Forbidden term detected: "${term}"`,
            severity: 'MEDIUM'
          });
        }
      }
    }

    // Check disallowed tones
    if (content.tone) {
      const toneLower = content.tone.toLowerCase();
      for (const disallowed of pillar.disallowed_tones) {
        if (toneLower.includes(disallowed.toLowerCase())) {
          violations.push({
            pillar: 'PRESTIGE_PROTOCOL',
            constraint: 'ARCHETYPE_VIOLATION',
            message: `Disallowed tone detected: "${disallowed}"`,
            severity: 'HIGH'
          });
        }
      }
    }

    return this.buildResult(violations);
  }

  // ============================================================================
  // PILLAR 2: LIABILITY IRON DOME (REGULATORY SAFETY)
  // ============================================================================

  validateLiabilityIronDome(content: {
    text?: string;
    claims?: string[];
    has_disclaimer?: boolean;
  }): ValidationResult {
    const violations: ValidationResult['violations'] = [];
    const pillar = this.state.pillars.liability_iron_dome;

    // Check banned claim terms
    if (content.text) {
      const textLower = content.text.toLowerCase();
      for (const term of pillar.banned_claim_terms) {
        if (textLower.includes(term.toLowerCase())) {
          violations.push({
            pillar: 'LIABILITY_IRON_DOME',
            constraint: 'BANNED_CLAIM_TERM',
            message: `Banned claim term detected: "${term}"`,
            severity: 'CRITICAL'
          });
        }
      }

      // Check for outcome claims
      const outcomePatterns = [
        /will pass/i, /guaranteed to pass/i, /fda will approve/i,
        /audit success/i, /inspection result/i, /regulatory approval/i,
        /will be compliant/i, /certification guaranteed/i
      ];
      for (const pattern of outcomePatterns) {
        if (pattern.test(content.text)) {
          violations.push({
            pillar: 'LIABILITY_IRON_DOME',
            constraint: 'OUTCOME_CLAIM_VIOLATION',
            message: `Outcome claim detected: ${pattern.toString()}`,
            severity: 'CRITICAL'
          });
        }
      }
    }

    // Check disclaimer requirement
    if (pillar.disclaimer_required && content.has_disclaimer === false) {
      violations.push({
        pillar: 'LIABILITY_IRON_DOME',
        constraint: 'MISSING_DISCLAIMER',
        message: 'Required disclaimer is missing',
        severity: 'HIGH'
      });
    }

    return this.buildResult(violations);
  }

  // ============================================================================
  // PILLAR 3: BURN RATE BREAKER (FINANCIAL SAFETY)
  // ============================================================================

  validateBurnRateBreaker(spend: {
    hourly_spend?: number;
    daily_spend?: number;
    gross_margin_percent?: number;
    campaign_cost?: number;
    campaign_revenue?: number;
  }): ValidationResult {
    const violations: ValidationResult['violations'] = [];
    const pillar = this.state.pillars.burn_rate_breaker;

    // Check hourly spend cap
    if (spend.hourly_spend && spend.hourly_spend > pillar.max_spend_per_hour) {
      violations.push({
        pillar: 'BURN_RATE_BREAKER',
        constraint: 'HOURLY_VELOCITY_CAP',
        message: `Hourly spend $${spend.hourly_spend} exceeds cap of $${pillar.max_spend_per_hour}`,
        severity: 'CRITICAL'
      });
    }

    // Check daily spend cap
    if (spend.daily_spend && spend.daily_spend > pillar.max_daily_spend) {
      violations.push({
        pillar: 'BURN_RATE_BREAKER',
        constraint: 'DAILY_BUDGET_EXCEEDED',
        message: `Daily spend $${spend.daily_spend} exceeds cap of $${pillar.max_daily_spend}`,
        severity: 'CRITICAL'
      });
    }

    // Check margin floor
    if (spend.gross_margin_percent !== undefined && 
        spend.gross_margin_percent < pillar.min_gross_margin_percent) {
      violations.push({
        pillar: 'BURN_RATE_BREAKER',
        constraint: 'MARGIN_FLOOR_VIOLATION',
        message: `Gross margin ${spend.gross_margin_percent}% is below minimum ${pillar.min_gross_margin_percent}%`,
        severity: 'HIGH'
      });
    }

    // Calculate margin if cost/revenue provided
    if (spend.campaign_cost && spend.campaign_revenue) {
      const calculatedMargin = ((spend.campaign_revenue - spend.campaign_cost) / spend.campaign_revenue) * 100;
      if (calculatedMargin < pillar.min_gross_margin_percent) {
        violations.push({
          pillar: 'BURN_RATE_BREAKER',
          constraint: 'CAMPAIGN_MARGIN_VIOLATION',
          message: `Campaign margin ${calculatedMargin.toFixed(1)}% is below minimum ${pillar.min_gross_margin_percent}%`,
          severity: 'HIGH'
        });
      }
    }

    return this.buildResult(violations);
  }

  // ============================================================================
  // PILLAR 4: DOMAIN FENCE (MISSION CREEP PREVENTION)
  // ============================================================================

  validateDomainFence(content: {
    topic?: string;
    topics?: string[];
    product_category?: string;
  }): ValidationResult {
    const violations: ValidationResult['violations'] = [];
    const pillar = this.state.pillars.domain_fence;
    const whitelist = pillar.domain_whitelist.map(d => d.toLowerCase());

    const checkTopic = (topic: string): boolean => {
      const topicLower = topic.toLowerCase();
      return whitelist.some(allowed => 
        topicLower.includes(allowed) || allowed.includes(topicLower)
      );
    };

    // Check single topic
    if (content.topic && !checkTopic(content.topic)) {
      violations.push({
        pillar: 'DOMAIN_FENCE',
        constraint: 'TOPIC_OUT_OF_BOUNDS',
        message: `Topic "${content.topic}" is outside Life Sciences domain whitelist`,
        severity: 'CRITICAL'
      });
    }

    // Check multiple topics
    if (content.topics) {
      for (const topic of content.topics) {
        if (!checkTopic(topic)) {
          violations.push({
            pillar: 'DOMAIN_FENCE',
            constraint: 'TOPIC_OUT_OF_BOUNDS',
            message: `Topic "${topic}" is outside Life Sciences domain whitelist`,
            severity: 'CRITICAL'
          });
        }
      }
    }

    // Check product category
    if (content.product_category && !checkTopic(content.product_category)) {
      violations.push({
        pillar: 'DOMAIN_FENCE',
        constraint: 'PRODUCT_VECTOR_VIOLATION',
        message: `Product category "${content.product_category}" violates domain fence`,
        severity: 'CRITICAL'
      });
    }

    return this.buildResult(violations);
  }

  // ============================================================================
  // PILLAR 5: ADDITIONAL CONSTRAINTS
  // ============================================================================

  validateAdditionalConstraints(content: {
    tactics?: string[];
    reputation_impact?: number;
    current_reputation?: number;
    targeting_method?: string;
    personalization_type?: string;
  }): ValidationResult {
    const violations: ValidationResult['violations'] = [];
    const additional = this.state.pillars.additional_constraints;

    // Check manipulation firewall
    if (content.tactics) {
      for (const tactic of content.tactics) {
        const tacticLower = tactic.toLowerCase();
        if (additional.manipulation_firewall.forbidden_tactics.some(
          f => tacticLower.includes(f.toLowerCase())
        )) {
          violations.push({
            pillar: 'ADDITIONAL_CONSTRAINTS',
            constraint: 'MANIPULATION_FIREWALL',
            message: `Forbidden tactic detected: "${tactic}"`,
            severity: 'HIGH'
          });
        }
      }
    }

    // Check reputation sentinel
    if (content.current_reputation !== undefined && content.reputation_impact !== undefined) {
      const projectedReputation = content.current_reputation + content.reputation_impact;
      if (projectedReputation < additional.reputation_sentinel.reputation_score_min) {
        violations.push({
          pillar: 'ADDITIONAL_CONSTRAINTS',
          constraint: 'REPUTATION_SENTINEL',
          message: `Action would reduce reputation to ${projectedReputation}, below minimum ${additional.reputation_sentinel.reputation_score_min}`,
          severity: 'HIGH'
        });
      }
    }

    // Check human dignity clause
    const exploitativePatterns = [
      'vulnerability targeting', 'psychological manipulation', 'fear exploitation',
      'weaponized personalization', 'unethical profiling'
    ];
    if (content.targeting_method) {
      const methodLower = content.targeting_method.toLowerCase();
      if (exploitativePatterns.some(p => methodLower.includes(p))) {
        violations.push({
          pillar: 'ADDITIONAL_CONSTRAINTS',
          constraint: 'HUMAN_DIGNITY_CLAUSE',
          message: `Exploitative targeting method detected: "${content.targeting_method}"`,
          severity: 'CRITICAL'
        });
      }
    }

    return this.buildResult(violations);
  }

  // ============================================================================
  // COMPREHENSIVE VALIDATION
  // ============================================================================

  validateAll(input: {
    text?: string;
    price?: number;
    standard_price?: number;
    tone?: string;
    claims?: string[];
    has_disclaimer?: boolean;
    hourly_spend?: number;
    daily_spend?: number;
    gross_margin_percent?: number;
    topic?: string;
    topics?: string[];
    product_category?: string;
    tactics?: string[];
    reputation_impact?: number;
    current_reputation?: number;
    targeting_method?: string;
  }): ValidationResult {
    const allViolations: ValidationResult['violations'] = [];

    // Run all pillar validations
    const prestigeResult = this.validatePrestigeProtocol(input);
    const liabilityResult = this.validateLiabilityIronDome(input);
    const burnRateResult = this.validateBurnRateBreaker(input);
    const domainResult = this.validateDomainFence(input);
    const additionalResult = this.validateAdditionalConstraints(input);

    allViolations.push(...prestigeResult.violations);
    allViolations.push(...liabilityResult.violations);
    allViolations.push(...burnRateResult.violations);
    allViolations.push(...domainResult.violations);
    allViolations.push(...additionalResult.violations);

    const result = this.buildResult(allViolations);

    // Log violations
    if (allViolations.length > 0) {
      this.logViolations(allViolations, JSON.stringify(input).substring(0, 200));
    }

    // Update enforcement count
    this.state.enforcement_count++;
    this.state.last_enforced = new Date().toISOString();
    if (!result.valid) {
      this.state.violations_blocked++;
    }
    this.saveState();

    return result;
  }

  private buildResult(violations: ValidationResult['violations']): ValidationResult {
    const hasCritical = violations.some(v => v.severity === 'CRITICAL');
    const hasHigh = violations.some(v => v.severity === 'HIGH');

    let enforcement_action: ValidationResult['enforcement_action'] = 'ALLOW';
    if (hasCritical) {
      enforcement_action = 'BLOCK_AND_ALERT';
    } else if (hasHigh) {
      enforcement_action = 'BLOCK';
    } else if (violations.length > 0) {
      enforcement_action = 'BLOCK'; // Any violation blocks by default
    }

    return {
      valid: violations.length === 0,
      violations,
      enforcement_action
    };
  }

  private logViolations(violations: ValidationResult['violations'], context: string): void {
    for (const v of violations) {
      const entry: ViolationEntry = {
        timestamp: new Date().toISOString(),
        pillar: v.pillar,
        constraint_id: v.constraint,
        attempted_action: context,
        blocked: true,
        severity: v.severity,
        details: v.message
      };
      this.state.violation_log.push(entry);
    }

    // Keep only last 1000 violations
    if (this.state.violation_log.length > 1000) {
      this.state.violation_log = this.state.violation_log.slice(-1000);
    }
  }

  // ============================================================================
  // STATUS & REPORTING
  // ============================================================================

  getStatus(): {
    version: string;
    immutable: true;
    last_enforced: string;
    enforcement_count: number;
    violations_blocked: number;
    pillars_active: string[];
    recent_violations: ViolationEntry[];
  } {
    return {
      version: this.state.version,
      immutable: true,
      last_enforced: this.state.last_enforced,
      enforcement_count: this.state.enforcement_count,
      violations_blocked: this.state.violations_blocked,
      pillars_active: [
        'PRESTIGE_PROTOCOL',
        'LIABILITY_IRON_DOME',
        'BURN_RATE_BREAKER',
        'DOMAIN_FENCE',
        'MANIPULATION_FIREWALL',
        'REPUTATION_SENTINEL',
        'HUMAN_DIGNITY_CLAUSE'
      ],
      recent_violations: this.state.violation_log.slice(-10)
    };
  }

  getConstraints(): ConstitutionalState['pillars'] {
    return { ...this.state.pillars };
  }

  getViolationLog(limit: number = 50): ViolationEntry[] {
    return this.state.violation_log.slice(-limit);
  }

  getRequiredDisclaimer(): string {
    return this.state.pillars.liability_iron_dome.disclaimer_text;
  }

  getDomainWhitelist(): string[] {
    return [...this.state.pillars.domain_fence.domain_whitelist];
  }

  getForbiddenTerms(): string[] {
    return [
      ...this.state.pillars.prestige_protocol.forbidden_terms,
      ...this.state.pillars.liability_iron_dome.banned_claim_terms
    ];
  }

  getSpendLimits(): { hourly: number; daily: number; margin_floor: number } {
    return {
      hourly: this.state.pillars.burn_rate_breaker.max_spend_per_hour,
      daily: this.state.pillars.burn_rate_breaker.max_daily_spend,
      margin_floor: this.state.pillars.burn_rate_breaker.min_gross_margin_percent
    };
  }
}

// Export singleton instance
export const l7Constitution = new L7ConstitutionalConstraints();
export type { ValidationResult, ViolationEntry, ConstitutionalState };
