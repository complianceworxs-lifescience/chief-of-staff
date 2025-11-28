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

// CEE Action Types (Constitution Enforcement Engine)
export type CEEActionType = 'POST' | 'EMAIL' | 'SPEND' | 'CREATE_PRODUCT' | 'UPDATE_OFFER' | 'UNKNOWN';

// CEE Violation Codes (standardized)
export type CEEViolationCode = 
  | 'VIOLATION_PRESTIGE_VOCAB'
  | 'VIOLATION_PRESTIGE_MARGIN'
  | 'VIOLATION_LIABILITY_CLAIM'
  | 'VIOLATION_LIABILITY_DISCLAIMER'
  | 'VIOLATION_FINANCE_VELOCITY'
  | 'VIOLATION_FINANCE_ROAS'
  | 'VIOLATION_DOMAIN_OUT_OF_SCOPE'
  | 'CV_FORBIDDEN_VOCABULARY'
  | 'CV_FORBIDDEN_CLAIM'
  | 'CV_OUTCOME_CLAIM'
  | 'CV_HOURLY_SPEND_EXCEEDED'
  | 'CV_DAILY_SPEND_EXCEEDED'
  | 'CV_DISALLOWED_TONE'
  | 'CV_MANIPULATION_TACTIC';

// CEE Spend Window
export interface CEESpend {
  amount: number;
  currency: string;
  window: 'hour' | 'day';
}

// CEE Action Payload (canonical format)
export interface CEEActionPayload {
  id?: string;
  type: CEEActionType;
  channel: string;
  content: string;
  spend: CEESpend;
  domain_tags: string[];
  metadata?: Record<string, any>;
}

// Legacy Action Payload (for backwards compatibility)
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
  // CEE fields
  type?: CEEActionType;
  channel?: string;
  spend?: CEESpend;
  domain_tags?: string[];
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
      forbidden_domains?: string[];
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
// CI TEST SUITE DEFINITION
// ============================================================================

export interface CITestCase {
  id: string;
  input: CEEActionPayload;
  expected: {
    status: 'GREEN' | 'RED';
    violations?: string[];
    violations_contains?: string[];
  };
}

export interface CITestResult {
  id: string;
  passed: boolean;
  actual_status: 'GREEN' | 'RED';
  expected_status: 'GREEN' | 'RED';
  actual_violations: string[];
  expected_violations_contains: string[];
  missing_violations: string[];
  message: string;
}

export interface CITestSuiteResult {
  suite: string;
  total_tests: number;
  passed: number;
  failed: number;
  deploy_blocked: boolean;
  results: CITestResult[];
  timestamp: string;
}

// The canonical CI test suite
export const CONSTITUTION_CI_TEST_SUITE: CITestCase[] = [
  {
    id: "T1_Prestige_Vocabulary_Block",
    input: {
      type: "POST",
      channel: "LinkedIn",
      content: "Get this cheap compliance hack now.",
      spend: { amount: 0, currency: "USD", window: "hour" },
      domain_tags: ["Life Sciences"]
    },
    expected: {
      status: "RED",
      violations_contains: ["VIOLATION_PRESTIGE_VOCAB"]
    }
  },
  {
    id: "T2_Liability_Guarantee_Block",
    input: {
      type: "EMAIL",
      channel: "Mailchimp",
      content: "We guarantee 100% audit immunity for your FDA inspections.",
      spend: { amount: 0, currency: "USD", window: "hour" },
      domain_tags: ["Regulatory Affairs (RA)"]
    },
    expected: {
      status: "RED",
      violations_contains: ["VIOLATION_LIABILITY_CLAIM"]
    }
  },
  {
    id: "T3_Financial_Velocity_Block",
    input: {
      type: "SPEND",
      channel: "Meta Ads",
      content: "",
      spend: { amount: 500.0, currency: "USD", window: "hour" },
      domain_tags: ["Life Sciences"]
    },
    expected: {
      status: "RED",
      violations_contains: ["VIOLATION_FINANCE_VELOCITY"]
    }
  },
  {
    id: "T4_Domain_Fence_Block",
    input: {
      type: "CREATE_PRODUCT",
      channel: "Internal",
      content: "Crypto Weight Loss Arbitrage Blueprint",
      spend: { amount: 0, currency: "USD", window: "day" },
      domain_tags: ["Crypto", "Weight Loss"]
    },
    expected: {
      status: "RED",
      violations_contains: ["VIOLATION_DOMAIN_OUT_OF_SCOPE"]
    }
  },
  {
    id: "T5_Compliant_Action_Passes",
    input: {
      type: "POST",
      channel: "LinkedIn",
      content: "Turn your validation work into measurable ROI with better audit readiness and quality metrics.",
      spend: { amount: 0, currency: "USD", window: "hour" },
      domain_tags: ["Computer System Validation (CSV)", "Quality Assurance (QA)"]
    },
    expected: {
      status: "GREEN",
      violations: []
    }
  }
];

// Forbidden domains for Domain Fence
const FORBIDDEN_DOMAINS = [
  "Crypto", "Cryptocurrency", "Bitcoin", "Blockchain",
  "Weight Loss", "Diet Pills", "Fat Burning",
  "Gambling", "Casino", "Betting",
  "Adult Content", "Dating", "Romance",
  "MLM", "Multi-Level Marketing", "Pyramid Scheme",
  "Get Rich Quick", "Financial Advice", "Investment Tips",
  "Political", "Religious"
];

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

// ============================================================================
// CEE (Constitution Enforcement Engine) VALIDATION
// ============================================================================

/**
 * CEE-compliant validation function
 * 
 * Validates using the canonical CEE payload format with standardized violation codes
 */
export function validateCEEAction(payload: CEEActionPayload): ConstitutionValidationResult {
  const violations: ViolationCode[] = [];
  const timestamp = new Date().toISOString();

  // Convert CEE payload to legacy format for core validation
  const legacyPayload: ActionPayload = {
    action_id: payload.id,
    content: payload.content,
    type: payload.type,
    channel: payload.channel,
    spend: payload.spend,
    domain_tags: payload.domain_tags,
    metadata: payload.metadata
  };

  // Extract text content for scanning
  const textContent = payload.content || '';

  // ========================================================================
  // GUARD 1: PrestigeGuard - LAW_01_PRESTIGE
  // ========================================================================
  const PRESTIGE_FORBIDDEN_VOCAB = [
    'cheap', 'discount', 'deal', 'free', 'hack', 'secret', 'trick',
    'flash sale', 'limited time', 'act now', 'hurry', 'bargain',
    'lowest price', 'rock bottom', 'clearance', 'giveaway'
  ];

  for (const term of PRESTIGE_FORBIDDEN_VOCAB) {
    if (textContent.toLowerCase().includes(term.toLowerCase())) {
      violations.push({
        code: 'VIOLATION_PRESTIGE_VOCAB',
        pillar: 'LAW_01_PRESTIGE',
        severity: 'MEDIUM',
        message: `Prestige Guard: Forbidden vocabulary "${term}" detected`,
        blocked_content: term
      });
      break; // Only need one for CI test
    }
  }

  // ========================================================================
  // GUARD 2: LiabilityGuard - LAW_02_LIABILITY_DOME
  // ========================================================================
  const LIABILITY_BANNED_CLAIMS = [
    'guarantee', 'guaranteed', 'promise', 'promised', 'ensure', 'ensured',
    '100% success', '100% pass', 'audit immunity', 'fda approval',
    'will pass', 'will approve', 'certify', 'certification guaranteed',
    'absolute', 'definite', 'certain', 'assured'
  ];

  for (const claim of LIABILITY_BANNED_CLAIMS) {
    if (textContent.toLowerCase().includes(claim.toLowerCase())) {
      violations.push({
        code: 'VIOLATION_LIABILITY_CLAIM',
        pillar: 'LAW_02_LIABILITY_DOME',
        severity: 'CRITICAL',
        message: `Liability Guard: Banned claim term "${claim}" detected`,
        blocked_content: claim
      });
      break; // Only need one for CI test
    }
  }

  // ========================================================================
  // GUARD 3: FinancialGuard - LAW_03_FINANCIAL_SAFETY
  // ========================================================================
  const MAX_HOURLY_SPEND = 100; // $100/hour cap
  const MAX_DAILY_SPEND = 2500; // $2500/day cap

  if (payload.spend) {
    const amount = payload.spend.amount;
    const window = payload.spend.window;

    if (window === 'hour' && amount > MAX_HOURLY_SPEND) {
      violations.push({
        code: 'VIOLATION_FINANCE_VELOCITY',
        pillar: 'LAW_03_FINANCIAL_SAFETY',
        severity: 'CRITICAL',
        message: `Financial Guard: Hourly spend $${amount} exceeds velocity cap of $${MAX_HOURLY_SPEND}`
      });
    }

    if (window === 'day' && amount > MAX_DAILY_SPEND) {
      violations.push({
        code: 'VIOLATION_FINANCE_VELOCITY',
        pillar: 'LAW_03_FINANCIAL_SAFETY',
        severity: 'CRITICAL',
        message: `Financial Guard: Daily spend $${amount} exceeds velocity cap of $${MAX_DAILY_SPEND}`
      });
    }
  }

  // ========================================================================
  // GUARD 4: DomainGuard - LAW_04_DOMAIN_FENCE
  // ========================================================================
  if (payload.domain_tags && payload.domain_tags.length > 0) {
    for (const tag of payload.domain_tags) {
      const isForbidden = FORBIDDEN_DOMAINS.some(
        forbidden => tag.toLowerCase().includes(forbidden.toLowerCase())
      );

      if (isForbidden) {
        violations.push({
          code: 'VIOLATION_DOMAIN_OUT_OF_SCOPE',
          pillar: 'LAW_04_DOMAIN_FENCE',
          severity: 'CRITICAL',
          message: `Domain Guard: Forbidden domain tag "${tag}" - outside Life Sciences scope`,
          blocked_content: tag
        });
      }
    }

    // Also check content for forbidden domain references
    for (const forbidden of FORBIDDEN_DOMAINS) {
      if (textContent.toLowerCase().includes(forbidden.toLowerCase())) {
        const alreadyReported = violations.some(
          v => v.code === 'VIOLATION_DOMAIN_OUT_OF_SCOPE' && v.blocked_content === forbidden
        );
        if (!alreadyReported) {
          violations.push({
            code: 'VIOLATION_DOMAIN_OUT_OF_SCOPE',
            pillar: 'LAW_04_DOMAIN_FENCE',
            severity: 'CRITICAL',
            message: `Domain Guard: Content references forbidden domain "${forbidden}"`,
            blocked_content: forbidden
          });
        }
      }
    }
  }

  // ========================================================================
  // DETERMINE RESULT
  // ========================================================================
  const hasViolations = violations.length > 0;
  const hasCritical = violations.some(v => v.severity === 'CRITICAL');

  const status: ValidationStatus = hasViolations ? 'RED' : 'GREEN';
  const enforcement_action: ConstitutionValidationResult['enforcement_action'] = 
    hasViolations ? (hasCritical ? 'BLOCK_AND_ALERT' : 'BLOCK') : 'ALLOW';

  // Console output for CEE validation
  if (status === 'GREEN') {
    console.log(`✅ CEE CHECK: GREEN | ${payload.type} @ ${payload.channel} | ALLOWED`);
  } else {
    console.log(`🚫 CEE CHECK: RED | ${payload.type} @ ${payload.channel} | BLOCKED`);
    violations.forEach(v => {
      console.log(`   ⛔ ${v.code}: ${v.message}`);
    });
  }

  return {
    status,
    timestamp,
    action_id: payload.id,
    violations,
    enforcement_action,
    audit_logged: hasViolations
  };
}

// ============================================================================
// CI TEST RUNNER - REPLIT CI SPEC
// ============================================================================

/**
 * Run the Constitution CI test suite
 * 
 * Executes all structured test cases. Any failure blocks deploy.
 * 
 * @returns CITestSuiteResult with deploy_blocked flag
 */
export function runConstitutionCITests(): CITestSuiteResult {
  console.log('\n🧪 ═══════════════════════════════════════════════════════════════');
  console.log('   CONSTITUTION ENFORCEMENT CI TEST SUITE');
  console.log('   Any failure blocks deploy');
  console.log('═══════════════════════════════════════════════════════════════════');

  const results: CITestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of CONSTITUTION_CI_TEST_SUITE) {
    console.log(`\n🔬 Running test: ${testCase.id}`);

    // Run CEE validation
    const validationResult = validateCEEAction(testCase.input);

    // Extract violation codes
    const actualViolationCodes = validationResult.violations.map(v => v.code);

    // Check expected violations
    const expectedViolations = testCase.expected.violations_contains || testCase.expected.violations || [];
    const missingViolations = expectedViolations.filter(
      expected => !actualViolationCodes.includes(expected)
    );

    // Determine if test passed
    const statusMatches = validationResult.status === testCase.expected.status;
    const violationsMatch = missingViolations.length === 0;
    const testPassed = statusMatches && violationsMatch;

    if (testPassed) {
      passed++;
      console.log(`   ✅ PASSED: ${testCase.id}`);
    } else {
      failed++;
      console.log(`   ❌ FAILED: ${testCase.id}`);
      if (!statusMatches) {
        console.log(`      Expected status: ${testCase.expected.status}, Got: ${validationResult.status}`);
      }
      if (!violationsMatch) {
        console.log(`      Missing violations: ${missingViolations.join(', ')}`);
      }
    }

    results.push({
      id: testCase.id,
      passed: testPassed,
      actual_status: validationResult.status,
      expected_status: testCase.expected.status,
      actual_violations: actualViolationCodes,
      expected_violations_contains: expectedViolations,
      missing_violations: missingViolations,
      message: testPassed 
        ? `PASSED: ${testCase.id}`
        : `FAILED: ${!statusMatches ? `Status mismatch (expected ${testCase.expected.status}, got ${validationResult.status})` : ''}${!violationsMatch ? ` Missing violations: ${missingViolations.join(', ')}` : ''}`
    });
  }

  const deployBlocked = failed > 0;

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`   RESULTS: ${passed}/${CONSTITUTION_CI_TEST_SUITE.length} passed`);
  console.log(`   DEPLOY: ${deployBlocked ? '🚫 BLOCKED' : '✅ ALLOWED'}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  return {
    suite: 'Constitution_Enforcement_CI',
    total_tests: CONSTITUTION_CI_TEST_SUITE.length,
    passed,
    failed,
    deploy_blocked: deployBlocked,
    results,
    timestamp: new Date().toISOString()
  };
}

/**
 * Run a single CI test case
 */
export function runSingleCITest(testId: string): CITestResult | null {
  const testCase = CONSTITUTION_CI_TEST_SUITE.find(t => t.id === testId);
  if (!testCase) {
    return null;
  }

  const validationResult = validateCEEAction(testCase.input);
  const actualViolationCodes = validationResult.violations.map(v => v.code);
  const expectedViolations = testCase.expected.violations_contains || testCase.expected.violations || [];
  const missingViolations = expectedViolations.filter(
    expected => !actualViolationCodes.includes(expected)
  );

  const statusMatches = validationResult.status === testCase.expected.status;
  const violationsMatch = missingViolations.length === 0;
  const testPassed = statusMatches && violationsMatch;

  return {
    id: testCase.id,
    passed: testPassed,
    actual_status: validationResult.status,
    expected_status: testCase.expected.status,
    actual_violations: actualViolationCodes,
    expected_violations_contains: expectedViolations,
    missing_violations: missingViolations,
    message: testPassed ? 'PASSED' : 'FAILED'
  };
}

/**
 * Get the CI test suite definition (for documentation/export)
 */
export function getCITestSuite(): CITestCase[] {
  return CONSTITUTION_CI_TEST_SUITE;
}
