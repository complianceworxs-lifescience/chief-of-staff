/**
 * CONSTITUTION VALIDATOR ROUTINE
 * 
 * Middleware function validate_constitution(action_payload) that runs
 * before any L5 execution in the action loop:
 * 
 *   ingest → prioritize → plan → [VALIDATE] → produce
 * 
 * Scans all action payloads against Constitutional Constraints:
 * - FORBIDDEN_VOCABULARY (Prestige Protocol)
 * - MAX_HOURLY_SPEND (Burn Rate Breaker)
 * - FORBIDDEN_CLAIMS (Liability Iron Dome)
 * 
 * Returns:
 * - STATUS: GREEN → Allow execution
 * - STATUS: RED + VIOLATION_CODE → Block execution & Log to Audit
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export type ValidationStatus = 'GREEN' | 'RED';

export interface ViolationCode {
  code: string;
  pillar: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  blocked_content?: string;
}

export interface ConstitutionValidationResult {
  status: ValidationStatus;
  timestamp: string;
  action_id?: string;
  violations: ViolationCode[];
  enforcement_action: 'ALLOW' | 'BLOCK' | 'BLOCK_AND_ALERT';
  audit_logged: boolean;
}

export interface ActionPayload {
  action_id?: string;
  title?: string;
  content?: string;
  text?: string;
  hourly_spend?: number;
  daily_spend?: number;
  spend_cents?: number;
  claims?: string[];
  topic?: string;
  tactics?: string[];
  agent?: string;
  metadata?: Record<string, any>;
}

interface Constitution {
  version: string;
  last_enforced: string;
  enforcement_count: number;
  violations_blocked: number;
  pillars: {
    prestige_protocol: {
      forbidden_terms: string[];
      disallowed_tones: string[];
      price_floor_percent: number;
    };
    liability_iron_dome: {
      banned_claim_terms: string[];
      no_outcome_claims_rule: string;
    };
    burn_rate_breaker: {
      max_spend_per_hour: number;
      max_daily_spend: number;
      min_gross_margin_percent: number;
    };
    domain_fence: {
      domain_whitelist: string[];
    };
    additional_constraints: {
      manipulation_firewall: {
        forbidden_tactics: string[];
      };
    };
  };
  violation_log: any[];
}

// ============================================================================
// CONSTITUTION VALIDATOR SERVICE
// ============================================================================

class ConstitutionValidator {
  private constitution: Constitution | null = null;
  private constitutionPath: string;
  private validationCount: number = 0;
  private blockedCount: number = 0;

  constructor() {
    this.constitutionPath = path.join(process.cwd(), 'state', 'L7_CONSTITUTION.json');
    this.loadConstitution();
  }

  /**
   * Load Constitution.json from System Core
   */
  private loadConstitution(): void {
    try {
      if (fs.existsSync(this.constitutionPath)) {
        const data = fs.readFileSync(this.constitutionPath, 'utf-8');
        this.constitution = JSON.parse(data);
        console.log(`📜 CONSTITUTION VALIDATOR: Loaded v${this.constitution?.version}`);
      } else {
        console.error('⚠️ CONSTITUTION VALIDATOR: Constitution.json not found');
      }
    } catch (error) {
      console.error('❌ CONSTITUTION VALIDATOR: Failed to load constitution:', error);
    }
  }

  /**
   * Refresh constitution from disk (for hot-reload)
   */
  refreshConstitution(): void {
    this.loadConstitution();
  }

  /**
   * MAIN VALIDATION FUNCTION
   * 
   * validate_constitution(action_payload) - runs before L5 execution
   * 
   * Returns:
   * - STATUS: GREEN → Pass (allow execution)
   * - STATUS: RED + VIOLATION_CODE → Block execution & log
   */
  validateConstitution(payload: ActionPayload): ConstitutionValidationResult {
    this.validationCount++;
    const violations: ViolationCode[] = [];
    const timestamp = new Date().toISOString();

    if (!this.constitution) {
      this.loadConstitution();
      if (!this.constitution) {
        return {
          status: 'GREEN',
          timestamp,
          action_id: payload.action_id,
          violations: [],
          enforcement_action: 'ALLOW',
          audit_logged: false
        };
      }
    }

    // Extract text content from payload
    const textContent = this.extractTextContent(payload);
    const spendAmount = this.extractSpendAmount(payload);

    // ========================================================================
    // CHECK 1: FORBIDDEN_VOCABULARY (Prestige Protocol)
    // ========================================================================
    const forbiddenTerms = this.constitution.pillars.prestige_protocol.forbidden_terms;
    for (const term of forbiddenTerms) {
      if (textContent.toLowerCase().includes(term.toLowerCase())) {
        violations.push({
          code: 'CV_FORBIDDEN_VOCABULARY',
          pillar: 'PRESTIGE_PROTOCOL',
          severity: 'MEDIUM',
          message: `Forbidden vocabulary detected: "${term}"`,
          blocked_content: term
        });
      }
    }

    // Check disallowed tones
    const disallowedTones = this.constitution.pillars.prestige_protocol.disallowed_tones;
    for (const tone of disallowedTones) {
      if (textContent.toLowerCase().includes(tone.toLowerCase())) {
        violations.push({
          code: 'CV_DISALLOWED_TONE',
          pillar: 'PRESTIGE_PROTOCOL',
          severity: 'HIGH',
          message: `Disallowed tone detected: "${tone}"`,
          blocked_content: tone
        });
      }
    }

    // ========================================================================
    // CHECK 2: MAX_HOURLY_SPEND (Burn Rate Breaker)
    // ========================================================================
    const maxHourlySpend = this.constitution.pillars.burn_rate_breaker.max_spend_per_hour;
    const maxDailySpend = this.constitution.pillars.burn_rate_breaker.max_daily_spend;

    if (spendAmount.hourly > maxHourlySpend) {
      violations.push({
        code: 'CV_HOURLY_SPEND_EXCEEDED',
        pillar: 'BURN_RATE_BREAKER',
        severity: 'CRITICAL',
        message: `Hourly spend $${spendAmount.hourly} exceeds cap of $${maxHourlySpend}`
      });
    }

    if (spendAmount.daily > maxDailySpend) {
      violations.push({
        code: 'CV_DAILY_SPEND_EXCEEDED',
        pillar: 'BURN_RATE_BREAKER',
        severity: 'CRITICAL',
        message: `Daily spend $${spendAmount.daily} exceeds cap of $${maxDailySpend}`
      });
    }

    // ========================================================================
    // CHECK 3: FORBIDDEN_CLAIMS (Liability Iron Dome)
    // ========================================================================
    const bannedClaims = this.constitution.pillars.liability_iron_dome.banned_claim_terms;
    for (const claim of bannedClaims) {
      if (textContent.toLowerCase().includes(claim.toLowerCase())) {
        violations.push({
          code: 'CV_FORBIDDEN_CLAIM',
          pillar: 'LIABILITY_IRON_DOME',
          severity: 'CRITICAL',
          message: `Forbidden claim term detected: "${claim}"`,
          blocked_content: claim
        });
      }
    }

    // Check for outcome claims (regulatory predictions)
    const outcomePatterns = [
      /will pass/i, /guaranteed to pass/i, /fda will approve/i,
      /audit success/i, /inspection result/i, /regulatory approval/i,
      /will be compliant/i, /certification guaranteed/i, /100% pass/i
    ];
    for (const pattern of outcomePatterns) {
      if (pattern.test(textContent)) {
        violations.push({
          code: 'CV_OUTCOME_CLAIM',
          pillar: 'LIABILITY_IRON_DOME',
          severity: 'CRITICAL',
          message: `Outcome claim detected: ${pattern.toString()}`
        });
      }
    }

    // ========================================================================
    // CHECK 4: MANIPULATION FIREWALL (Additional Constraints)
    // ========================================================================
    const forbiddenTactics = this.constitution.pillars.additional_constraints.manipulation_firewall.forbidden_tactics;
    for (const tactic of forbiddenTactics) {
      if (textContent.toLowerCase().includes(tactic.toLowerCase())) {
        violations.push({
          code: 'CV_MANIPULATION_TACTIC',
          pillar: 'MANIPULATION_FIREWALL',
          severity: 'HIGH',
          message: `Forbidden manipulation tactic detected: "${tactic}"`,
          blocked_content: tactic
        });
      }
    }

    // ========================================================================
    // DETERMINE RESULT
    // ========================================================================
    const hasCritical = violations.some(v => v.severity === 'CRITICAL');
    const hasHigh = violations.some(v => v.severity === 'HIGH');
    const hasViolations = violations.length > 0;

    let status: ValidationStatus = 'GREEN';
    let enforcement_action: ConstitutionValidationResult['enforcement_action'] = 'ALLOW';

    if (hasViolations) {
      status = 'RED';
      this.blockedCount++;
      
      if (hasCritical) {
        enforcement_action = 'BLOCK_AND_ALERT';
      } else if (hasHigh) {
        enforcement_action = 'BLOCK';
      } else {
        enforcement_action = 'BLOCK';
      }
    }

    // Log to audit if violations found
    let audit_logged = false;
    if (hasViolations) {
      this.logToAudit(payload, violations);
      audit_logged = true;
    }

    const result: ConstitutionValidationResult = {
      status,
      timestamp,
      action_id: payload.action_id,
      violations,
      enforcement_action,
      audit_logged
    };

    // Console output
    if (status === 'GREEN') {
      console.log(`✅ CONSTITUTION CHECK: GREEN | Action ${payload.action_id || 'N/A'} | ALLOWED`);
    } else {
      console.log(`🚫 CONSTITUTION CHECK: RED | Action ${payload.action_id || 'N/A'} | BLOCKED`);
      violations.forEach(v => {
        console.log(`   ⛔ ${v.code}: ${v.message}`);
      });
    }

    return result;
  }

  /**
   * Extract all text content from payload for scanning
   */
  private extractTextContent(payload: ActionPayload): string {
    const parts: string[] = [];
    
    if (payload.title) parts.push(payload.title);
    if (payload.content) parts.push(payload.content);
    if (payload.text) parts.push(payload.text);
    if (payload.claims) parts.push(...payload.claims);
    if (payload.topic) parts.push(payload.topic);
    if (payload.tactics) parts.push(...payload.tactics);
    if (payload.metadata) {
      const metaStr = JSON.stringify(payload.metadata);
      parts.push(metaStr);
    }

    return parts.join(' ');
  }

  /**
   * Extract spend amounts from payload
   */
  private extractSpendAmount(payload: ActionPayload): { hourly: number; daily: number } {
    return {
      hourly: payload.hourly_spend || 0,
      daily: payload.daily_spend || (payload.spend_cents ? payload.spend_cents / 100 : 0)
    };
  }

  /**
   * Log violations to audit trail
   */
  private logToAudit(payload: ActionPayload, violations: ViolationCode[]): void {
    try {
      if (!this.constitution) return;

      const entries = violations.map(v => ({
        timestamp: new Date().toISOString(),
        pillar: v.pillar,
        constraint_id: v.code,
        attempted_action: JSON.stringify(payload).substring(0, 300),
        blocked: true,
        severity: v.severity,
        details: v.message
      }));

      this.constitution.violation_log.push(...entries);
      this.constitution.violations_blocked++;
      this.constitution.enforcement_count++;
      this.constitution.last_enforced = new Date().toISOString();

      fs.writeFileSync(this.constitutionPath, JSON.stringify(this.constitution, null, 2));
    } catch (error) {
      console.error('❌ Failed to log to audit:', error);
    }
  }

  /**
   * Get validator statistics
   */
  getStats(): {
    total_validations: number;
    total_blocked: number;
    pass_rate: number;
    constitution_version: string;
  } {
    return {
      total_validations: this.validationCount,
      total_blocked: this.blockedCount,
      pass_rate: this.validationCount > 0 
        ? ((this.validationCount - this.blockedCount) / this.validationCount) * 100 
        : 100,
      constitution_version: this.constitution?.version || 'unknown'
    };
  }

  /**
   * Get recent violations
   */
  getRecentViolations(limit: number = 10): any[] {
    if (!this.constitution) return [];
    return this.constitution.violation_log.slice(-limit);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const constitutionValidator = new ConstitutionValidator();

// ============================================================================
// MIDDLEWARE FUNCTION FOR L5 ACTION LOOP
// ============================================================================

/**
 * validate_constitution(action_payload) - L5 Action Loop Middleware
 * 
 * Hook this into the L5 execution loop at the [VALIDATE] step:
 *   ingest → prioritize → plan → [VALIDATE] → produce
 * 
 * @param payload - Action payload to validate
 * @returns ConstitutionValidationResult with GREEN (pass) or RED (block)
 */
export function validateConstitution(payload: ActionPayload): ConstitutionValidationResult {
  return constitutionValidator.validateConstitution(payload);
}

/**
 * Check if action is allowed to proceed
 */
export function isActionAllowed(payload: ActionPayload): boolean {
  const result = validateConstitution(payload);
  return result.status === 'GREEN';
}

/**
 * Middleware wrapper for Express routes
 */
export function constitutionMiddleware(req: any, res: any, next: any): void {
  const payload: ActionPayload = {
    action_id: req.body?.action_id || req.params?.action_id,
    title: req.body?.title,
    content: req.body?.content,
    text: req.body?.text,
    hourly_spend: req.body?.hourly_spend,
    daily_spend: req.body?.daily_spend,
    spend_cents: req.body?.spend_cents,
    claims: req.body?.claims,
    topic: req.body?.topic,
    tactics: req.body?.tactics,
    metadata: req.body?.metadata
  };

  const result = validateConstitution(payload);

  if (result.status === 'RED') {
    res.status(403).json({
      error: 'Constitution Violation',
      status: 'RED',
      violations: result.violations,
      enforcement_action: result.enforcement_action,
      message: 'Action blocked by Constitutional Constraints'
    });
    return;
  }

  // Attach validation result to request for downstream use
  req.constitutionValidation = result;
  next();
}
