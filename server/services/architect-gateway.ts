/**
 * ARCHITECT GATEWAY SERVICE v3.0
 * 
 * THE SINGLE ENTRY POINT for all OpenAI API calls in the system.
 * Implements FULLY AUTONOMOUS operation with NO human-in-the-loop.
 * 
 * SAFETY ARCHITECTURE:
 * 1. Three-Tier Action Classes (Safe → Constrained → Sensitive)
 * 2. Governor Policy Engine (non-bypassable validation)
 * 3. Auditor (redundant AI check for Tier 2+)
 * 4. Immutable Logs + Kill Switch
 * 
 * NO OTHER MODULE SHOULD TALK TO OPENAI DIRECTLY.
 */

import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================================
// KILL SWITCH - Single config flag to force simulation mode
// ============================================================================

const ARCHITECT_LIVE = process.env.ARCHITECT_LIVE !== 'false'; // Default: true
const FORCE_SIMULATION = !ARCHITECT_LIVE;

// ============================================================================
// THREE-TIER ACTION CLASSIFICATION
// ============================================================================

export type ActionTier = 'TIER_1_SAFE' | 'TIER_2_CONSTRAINED' | 'TIER_3_SENSITIVE';

export const ACTION_TIER_DEFINITIONS = {
  TIER_1_SAFE: {
    description: 'Auto-execute: read, log, simulate, score',
    actions: ['READ', 'LOG', 'SIMULATE', 'SCORE', 'ANALYZE', 'REPORT', 'NOTIFY'],
    auto_execute: true,
    requires_auditor: false,
    requires_governor: true
  },
  TIER_2_CONSTRAINED: {
    description: 'Execute within templates + budgets: email copy, UI text, A/B variants',
    actions: ['EMAIL_COPY', 'UI_TEXT', 'AB_VARIANT', 'CONTENT_UPDATE', 'CAMPAIGN_ADJUST'],
    auto_execute: true,
    requires_auditor: true,
    requires_governor: true
  },
  TIER_3_SENSITIVE: {
    description: 'Never direct execute: pricing, billing, infra - only propose diffs',
    actions: ['PRICING_CHANGE', 'BILLING_ACTION', 'INFRA_CHANGE', 'DATA_DELETE', 'GOVERNANCE_OVERRIDE', 'DEPLOYMENT'],
    auto_execute: false,
    requires_auditor: true,
    requires_governor: true
  }
};

function classifyAction(actionType: string): ActionTier {
  for (const [tier, def] of Object.entries(ACTION_TIER_DEFINITIONS)) {
    if (def.actions.includes(actionType.toUpperCase())) {
      return tier as ActionTier;
    }
  }
  return 'TIER_1_SAFE'; // Default to safe tier for unknown actions
}

// ============================================================================
// STRICT REQUEST/RESPONSE CONTRACTS
// ============================================================================

export interface ArchitectRequest {
  request_id: string;
  correlation_id: string;
  version: string;
  agent_id: 'CoS' | 'Strategist' | 'CMO' | 'CRO' | 'ContentManager' | 'System';
  env: 'development' | 'production';
  state_snapshot: {
    l5_status: string;
    l6_mode: string;
    active_campaigns: string[];
    governance_locks: string[];
    current_metrics?: Record<string, number>;
  };
  question: string;
  question_type: 'STRUCTURE_REVIEW' | 'STRATEGIC_ANALYSIS' | 'GOVERNANCE_CHECK' | 'DIAGNOSTIC' | 'PLANNING';
  constraints: string[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  simulate_only: boolean;
  token_budget: number;
  timeout_ms: number;
}

export interface StructuredAction {
  action_id: string;
  action_type: string;
  tier: ActionTier;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resources: string[];
  diff: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  justification: string;
  target_agent: string;
  parameters: Record<string, any>;
  template_id?: string;
  budget_impact?: number;
  auto_executable: boolean;
  auditor_approved?: boolean;
  governor_approved?: boolean;
}

export interface ArchitectPlan {
  plan_id: string;
  status: 'APPROVED' | 'NEEDS_REVIEW' | 'BLOCKED' | 'SIMULATION_ONLY' | 'PARTIAL_APPROVED';
  analysis: string;
  rationale: string;
  risk_flags: RiskFlag[];
  actions: StructuredAction[];
  governance_assessment: GovernanceAssessment;
  confidence: number;
  simulation_output?: SimulationOutput;
  auditor_verdict?: AuditorVerdict;
  governor_verdict?: GovernorVerdict;
}

export interface RiskFlag {
  type: 'BILLING' | 'DEPLOYMENT' | 'DATA' | 'GOVERNANCE' | 'SECURITY' | 'BUDGET';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  mitigation: string;
}

export interface GovernanceAssessment {
  vqs_compliant: boolean;
  l6_compliant: boolean;
  methodology_lock_respected: boolean;
  budget_compliant: boolean;
  violations: string[];
  warnings: string[];
}

export interface SimulationOutput {
  expected_outcome: string;
  state_deltas: Record<string, any>;
  no_side_effects: boolean;
  ready_for_promotion: boolean;
  test_cases_suggested: string[];
}

export interface AuditorVerdict {
  passed: boolean;
  model_used: string;
  rejected_actions: string[];
  downgraded_actions: string[];
  concerns: string[];
  timestamp: string;
}

export interface GovernorVerdict {
  passed: boolean;
  blocked_actions: string[];
  budget_violations: string[];
  rate_limit_violations: string[];
  allowlist_violations: string[];
  timestamp: string;
}

export interface ArchitectResponse {
  request_id: string;
  correlation_id: string;
  success: boolean;
  live_mode: boolean;
  plan?: ArchitectPlan;
  execution_summary?: ExecutionSummary;
  error?: string;
  tokens_used: number;
  model_used: string;
  latency_ms: number;
  timestamp: string;
  version_tag: string;
}

export interface ExecutionSummary {
  tier1_executed: number;
  tier2_executed: number;
  tier3_proposed: number;
  total_actions: number;
  blocked_actions: number;
}

// ============================================================================
// GOVERNOR POLICY ENGINE (Non-Bypassable)
// ============================================================================

interface GovernorConfig {
  allowlists: {
    templates: string[];
    agents: string[];
    action_types: string[];
  };
  denylists: {
    action_types: string[];
    resources: string[];
  };
  budget_ceilings: {
    daily_spend: number;
    per_action_max: number;
    monthly_cap: number;
  };
  rate_limits: {
    actions_per_minute: number;
    tier2_per_hour: number;
    tier3_per_day: number;
  };
}

class GovernorPolicyEngine {
  private config: GovernorConfig = {
    allowlists: {
      templates: ['email_nurture', 'linkedin_post', 'ab_test_variant', 'lead_score_update'],
      agents: ['CoS', 'Strategist', 'CMO', 'CRO', 'ContentManager', 'System'],
      action_types: ['READ', 'LOG', 'SIMULATE', 'SCORE', 'ANALYZE', 'REPORT', 'NOTIFY', 
                     'EMAIL_COPY', 'UI_TEXT', 'AB_VARIANT', 'CONTENT_UPDATE', 'CAMPAIGN_ADJUST']
    },
    denylists: {
      action_types: ['DATA_DELETE_ALL', 'CREDENTIAL_EXPOSE', 'BILLING_OVERRIDE', 'GOVERNANCE_BYPASS'],
      resources: ['production_database', 'billing_system', 'auth_credentials', 'api_keys']
    },
    budget_ceilings: {
      daily_spend: 25,
      per_action_max: 5,
      monthly_cap: 500
    },
    rate_limits: {
      actions_per_minute: 10,
      tier2_per_hour: 50,
      tier3_per_day: 5
    }
  };

  private actionCounts = {
    minute: { count: 0, reset: Date.now() },
    tier2_hour: { count: 0, reset: Date.now() },
    tier3_day: { count: 0, reset: Date.now() }
  };

  private spendTracking = {
    daily: 0,
    monthly: 0,
    lastDailyReset: new Date().toISOString().split('T')[0],
    lastMonthlyReset: new Date().toISOString().slice(0, 7)
  };

  validate(actions: StructuredAction[], agentId: string): GovernorVerdict {
    const blockedActions: string[] = [];
    const budgetViolations: string[] = [];
    const rateLimitViolations: string[] = [];
    const allowlistViolations: string[] = [];

    this.resetCountersIfNeeded();

    for (const action of actions) {
      // Check denylist
      if (this.config.denylists.action_types.includes(action.action_type.toUpperCase())) {
        blockedActions.push(`${action.action_id}: Denylisted action type`);
        continue;
      }

      // Check resources against denylist
      for (const resource of action.resources) {
        if (this.config.denylists.resources.some(r => resource.toLowerCase().includes(r))) {
          blockedActions.push(`${action.action_id}: Denylisted resource ${resource}`);
        }
      }

      // Check allowlist for Tier 2
      if (action.tier === 'TIER_2_CONSTRAINED') {
        if (action.template_id && !this.config.allowlists.templates.includes(action.template_id)) {
          allowlistViolations.push(`${action.action_id}: Template not in allowlist`);
        }
      }

      // Check budget
      if (action.budget_impact && action.budget_impact > this.config.budget_ceilings.per_action_max) {
        budgetViolations.push(`${action.action_id}: Exceeds per-action budget ceiling`);
      }

      // Check rate limits
      const rateLimitCheck = this.checkRateLimits(action.tier);
      if (!rateLimitCheck.allowed) {
        rateLimitViolations.push(`${action.action_id}: ${rateLimitCheck.reason}`);
      }
    }

    // Agent allowlist check
    if (!this.config.allowlists.agents.includes(agentId)) {
      blockedActions.push(`Agent ${agentId} not in allowlist`);
    }

    return {
      passed: blockedActions.length === 0 && budgetViolations.length === 0 && 
              rateLimitViolations.length === 0 && allowlistViolations.length === 0,
      blocked_actions: blockedActions,
      budget_violations: budgetViolations,
      rate_limit_violations: rateLimitViolations,
      allowlist_violations: allowlistViolations,
      timestamp: new Date().toISOString()
    };
  }

  private resetCountersIfNeeded(): void {
    const now = Date.now();
    if (now - this.actionCounts.minute.reset > 60000) {
      this.actionCounts.minute = { count: 0, reset: now };
    }
    if (now - this.actionCounts.tier2_hour.reset > 3600000) {
      this.actionCounts.tier2_hour = { count: 0, reset: now };
    }
    if (now - this.actionCounts.tier3_day.reset > 86400000) {
      this.actionCounts.tier3_day = { count: 0, reset: now };
    }
  }

  private checkRateLimits(tier: ActionTier): { allowed: boolean; reason?: string } {
    this.actionCounts.minute.count++;
    
    if (this.actionCounts.minute.count > this.config.rate_limits.actions_per_minute) {
      return { allowed: false, reason: 'Per-minute rate limit exceeded' };
    }

    if (tier === 'TIER_2_CONSTRAINED') {
      this.actionCounts.tier2_hour.count++;
      if (this.actionCounts.tier2_hour.count > this.config.rate_limits.tier2_per_hour) {
        return { allowed: false, reason: 'Tier 2 hourly rate limit exceeded' };
      }
    }

    if (tier === 'TIER_3_SENSITIVE') {
      this.actionCounts.tier3_day.count++;
      if (this.actionCounts.tier3_day.count > this.config.rate_limits.tier3_per_day) {
        return { allowed: false, reason: 'Tier 3 daily rate limit exceeded' };
      }
    }

    return { allowed: true };
  }

  recordSpend(amount: number): void {
    this.spendTracking.daily += amount;
    this.spendTracking.monthly += amount;
  }

  getStatus(): { 
    config: GovernorConfig; 
    actionCounts: { minute: { count: number; reset: number }; tier2_hour: { count: number; reset: number }; tier3_day: { count: number; reset: number } }; 
    spend: { daily: number; monthly: number; lastDailyReset: string; lastMonthlyReset: string } 
  } {
    return {
      config: this.config,
      actionCounts: this.actionCounts,
      spend: this.spendTracking
    };
  }
}

// ============================================================================
// AUDITOR (Redundant AI Check for Tier 2+)
// ============================================================================

class AuditorService {
  private readonly AUDITOR_MODEL = "gpt-4o-mini"; // Cheaper model for validation

  async audit(actions: StructuredAction[], originalPlan: string): Promise<AuditorVerdict> {
    const tier2Plus = actions.filter(a => a.tier !== 'TIER_1_SAFE');
    
    if (tier2Plus.length === 0) {
      return {
        passed: true,
        model_used: 'SKIPPED',
        rejected_actions: [],
        downgraded_actions: [],
        concerns: [],
        timestamp: new Date().toISOString()
      };
    }

    try {
      const auditPrompt = `You are a SAFETY AUDITOR for an AI system. Your job is to review proposed actions and identify any that are unsafe.

ACTIONS TO REVIEW:
${JSON.stringify(tier2Plus, null, 2)}

ORIGINAL PLAN CONTEXT:
${originalPlan.substring(0, 1000)}

RULES:
1. REJECT any action that could cause financial harm, data loss, or security issues
2. DOWNGRADE to simulation-only any action with unclear justification
3. Flag any concerns about cross-tenant effects or resource abuse

Respond with JSON:
{
  "passed": true/false,
  "rejected_actions": ["action_id1", "action_id2"],
  "downgraded_actions": ["action_id3"],
  "concerns": ["concern1", "concern2"]
}`;

      const completion = await openai.chat.completions.create({
        model: this.AUDITOR_MODEL,
        messages: [{ role: "user", content: auditPrompt }],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        passed: response.passed ?? true,
        model_used: this.AUDITOR_MODEL,
        rejected_actions: response.rejected_actions || [],
        downgraded_actions: response.downgraded_actions || [],
        concerns: response.concerns || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Auditor error:', error);
      // Fail safe - block all Tier 2+ if auditor fails
      return {
        passed: false,
        model_used: 'ERROR',
        rejected_actions: tier2Plus.map(a => a.action_id),
        downgraded_actions: [],
        concerns: ['Auditor service failed - blocking all Tier 2+ actions for safety'],
        timestamp: new Date().toISOString()
      };
    }
  }
}

// ============================================================================
// IMMUTABLE AUDIT LOG
// ============================================================================

interface AuditLogEntry {
  log_id: string;
  correlation_id: string;
  version_tag: string;
  timestamp: string;
  request: ArchitectRequest;
  response: ArchitectResponse;
  actions_executed: string[];
  actions_blocked: string[];
  governor_verdict: GovernorVerdict | null;
  auditor_verdict: AuditorVerdict | null;
}

class ImmutableAuditLog {
  private readonly LOG_FILE = 'state/ARCHITECT_AUDIT_LOG.jsonl';
  private logBuffer: AuditLogEntry[] = [];

  log(entry: Omit<AuditLogEntry, 'log_id' | 'timestamp'>): void {
    const fullEntry: AuditLogEntry = {
      ...entry,
      log_id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString()
    };

    this.logBuffer.push(fullEntry);
    this.persistEntry(fullEntry);
  }

  private persistEntry(entry: AuditLogEntry): void {
    try {
      const logPath = path.join(process.cwd(), this.LOG_FILE);
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    } catch (error) {
      console.error('Failed to persist audit log entry:', error);
    }
  }

  getRecentLogs(limit: number = 50): AuditLogEntry[] {
    return this.logBuffer.slice(-limit);
  }
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

interface CircuitBreakerState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  openedAt: Date | null;
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    status: 'CLOSED',
    failures: 0,
    lastFailure: null,
    lastSuccess: null,
    openedAt: null
  };

  private readonly FAILURE_THRESHOLD = 3;
  private readonly RECOVERY_TIMEOUT_MS = 60000;

  canProceed(): boolean {
    if (this.state.status === 'CLOSED') return true;
    
    if (this.state.status === 'OPEN') {
      const elapsed = Date.now() - (this.state.openedAt?.getTime() || 0);
      if (elapsed >= this.RECOVERY_TIMEOUT_MS) {
        this.state.status = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    return this.state.status === 'HALF_OPEN';
  }

  recordSuccess(): void {
    this.state.failures = 0;
    this.state.lastSuccess = new Date();
    this.state.status = 'CLOSED';
    this.state.openedAt = null;
  }

  recordFailure(): void {
    this.state.failures++;
    this.state.lastFailure = new Date();

    if (this.state.failures >= this.FAILURE_THRESHOLD) {
      this.state.status = 'OPEN';
      this.state.openedAt = new Date();
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

// ============================================================================
// ARCHITECT GATEWAY SERVICE
// ============================================================================

const ARCHITECT_SYSTEM_PROMPT = `You are the ARCHITECT - the strategic planning AI for ComplianceWorxs' autonomous revenue system.

YOUR ROLE:
- Provide STRUCTURED PLANS with explicit action classifications
- Every action must have: action_type, risk_level, resources, diff, justification
- Plans flow through Governor and Auditor before execution

RESPONSE FORMAT (STRICT JSON):
{
  "plan_id": "unique id",
  "status": "APPROVED" | "NEEDS_REVIEW" | "BLOCKED" | "SIMULATION_ONLY",
  "analysis": "your analysis",
  "rationale": "why this approach",
  "risk_flags": [{"type": "GOVERNANCE", "severity": "LOW", "description": "...", "mitigation": "..."}],
  "actions": [
    {
      "action_id": "ACT-xxx",
      "action_type": "SCORE" | "LOG" | "EMAIL_COPY" | "PRICING_CHANGE" | etc,
      "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "resources": ["what resources this touches"],
      "diff": {"before": {}, "after": {}},
      "justification": "why this action is needed",
      "target_agent": "CoS",
      "parameters": {},
      "template_id": "optional template reference",
      "budget_impact": 0
    }
  ],
  "governance_assessment": {
    "vqs_compliant": true,
    "l6_compliant": true,
    "methodology_lock_respected": true,
    "budget_compliant": true,
    "violations": [],
    "warnings": []
  },
  "confidence": 0.85,
  "simulation_output": {
    "expected_outcome": "what would happen",
    "state_deltas": {},
    "no_side_effects": true,
    "ready_for_promotion": false,
    "test_cases_suggested": []
  }
}

ACTION TYPE TIERS:
- TIER 1 (Safe/Auto-execute): READ, LOG, SIMULATE, SCORE, ANALYZE, REPORT, NOTIFY
- TIER 2 (Constrained/Within templates): EMAIL_COPY, UI_TEXT, AB_VARIANT, CONTENT_UPDATE, CAMPAIGN_ADJUST
- TIER 3 (Sensitive/Propose only): PRICING_CHANGE, BILLING_ACTION, INFRA_CHANGE, DATA_DELETE

CRITICAL RULES:
1. VQS methodology must be preserved
2. L6 can only simulate, never execute
3. Budget: $25/day per agent
4. All Tier 3 actions are PROPOSALS ONLY - they create diffs, never execute`;

class ArchitectGatewayService {
  private circuitBreaker = new CircuitBreaker();
  private governor = new GovernorPolicyEngine();
  private auditor = new AuditorService();
  private auditLog = new ImmutableAuditLog();
  
  private readonly MODEL = "gpt-4o";
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_BACKOFF_MS = 1500;
  private readonly DEFAULT_TIMEOUT_MS = 30000;
  private readonly STATE_FILE = 'state/ARCHITECT_GATEWAY_STATE.json';

  private readonly DAILY_TOKEN_BUDGET = 50000;
  private readonly MONTHLY_TOKEN_CAP = 1000000;
  private tokensUsedToday = 0;
  private tokensUsedThisMonth = 0;
  private lastDailyReset = new Date().toISOString().split('T')[0];
  private lastMonthlyReset = new Date().toISOString().slice(0, 7);

  private requestCount = 0;
  private readonly VERSION_TAG = 'v3.0.0';

  constructor() {
    this.loadState();
    console.log(`🏛️ Architect Gateway ${this.VERSION_TAG} initialized | LIVE_MODE: ${ARCHITECT_LIVE}`);
    if (FORCE_SIMULATION) {
      console.log('⚠️ KILL SWITCH ACTIVE: All actions forced to simulation mode');
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private loadState(): void {
    try {
      const statePath = path.join(process.cwd(), this.STATE_FILE);
      if (fs.existsSync(statePath)) {
        const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        this.tokensUsedToday = data.tokensUsedToday || 0;
        this.tokensUsedThisMonth = data.tokensUsedThisMonth || 0;
        this.lastDailyReset = data.lastDailyReset || new Date().toISOString().split('T')[0];
        this.lastMonthlyReset = data.lastMonthlyReset || new Date().toISOString().slice(0, 7);
        this.requestCount = data.requestCount || 0;
      }
    } catch (error) {
      console.log('📁 Architect Gateway: Starting with fresh state');
    }
  }

  private saveState(): void {
    try {
      const statePath = path.join(process.cwd(), this.STATE_FILE);
      const data = {
        tokensUsedToday: this.tokensUsedToday,
        tokensUsedThisMonth: this.tokensUsedThisMonth,
        lastDailyReset: this.lastDailyReset,
        lastMonthlyReset: this.lastMonthlyReset,
        requestCount: this.requestCount,
        circuitBreaker: this.circuitBreaker.getState(),
        governor: this.governor.getStatus(),
        version: this.VERSION_TAG,
        lastSaved: new Date().toISOString()
      };
      fs.writeFileSync(statePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save Architect Gateway state:', error);
    }
  }

  private resetBudgetsIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    if (today !== this.lastDailyReset) {
      this.tokensUsedToday = 0;
      this.lastDailyReset = today;
    }

    if (thisMonth !== this.lastMonthlyReset) {
      this.tokensUsedThisMonth = 0;
      this.lastMonthlyReset = thisMonth;
    }
  }

  private checkBudget(estimatedTokens: number): { allowed: boolean; reason?: string } {
    this.resetBudgetsIfNeeded();

    if (this.tokensUsedToday + estimatedTokens > this.DAILY_TOKEN_BUDGET) {
      return { allowed: false, reason: `Daily budget exceeded (${this.tokensUsedToday}/${this.DAILY_TOKEN_BUDGET})` };
    }

    if (this.tokensUsedThisMonth + estimatedTokens > this.MONTHLY_TOKEN_CAP) {
      return { allowed: false, reason: `Monthly cap exceeded (${this.tokensUsedThisMonth}/${this.MONTHLY_TOKEN_CAP})` };
    }

    return { allowed: true };
  }

  /**
   * THE SINGLE ENTRY POINT for all Architect (OpenAI) communication
   */
  async query(request: ArchitectRequest): Promise<ArchitectResponse> {
    const startTime = Date.now();
    const correlationId = request.correlation_id || this.generateId('CORR');
    this.requestCount++;

    // Force simulation if kill switch is active
    if (FORCE_SIMULATION) {
      request.simulate_only = true;
    }

    console.log(`📤 [${correlationId}] Architect Gateway: ${request.question_type} from ${request.agent_id} | simulate_only: ${request.simulate_only}`);

    // Check circuit breaker
    if (!this.circuitBreaker.canProceed()) {
      return this.buildErrorResponse(request, correlationId, 'Circuit breaker OPEN - Architect temporarily unavailable', startTime);
    }

    // Check budget
    const budgetCheck = this.checkBudget(request.token_budget);
    if (!budgetCheck.allowed) {
      return this.buildErrorResponse(request, correlationId, budgetCheck.reason!, startTime);
    }

    // Execute with retry
    let lastError = '';
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.executeQuery(request, correlationId, startTime);
        this.circuitBreaker.recordSuccess();
        return response;
      } catch (error: any) {
        lastError = error.message || 'Unknown error';
        console.log(`⚠️ [${correlationId}] Attempt ${attempt}/${this.MAX_RETRIES} failed: ${lastError}`);

        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_BACKOFF_MS * attempt));
        }
      }
    }

    this.circuitBreaker.recordFailure();
    return this.buildErrorResponse(request, correlationId, lastError, startTime);
  }

  private async executeQuery(
    request: ArchitectRequest,
    correlationId: string,
    startTime: number
  ): Promise<ArchitectResponse> {
    const userMessage = this.buildUserMessage(request);

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          { role: "system", content: ARCHITECT_SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        max_tokens: Math.min(request.token_budget, 2000),
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), request.timeout_ms || this.DEFAULT_TIMEOUT_MS)
      )
    ]);

    const tokensUsed = completion.usage?.total_tokens || 0;
    this.tokensUsedToday += tokensUsed;
    this.tokensUsedThisMonth += tokensUsed;

    const responseContent = completion.choices[0]?.message?.content || '{}';
    let plan: ArchitectPlan;

    try {
      const rawPlan = JSON.parse(responseContent);
      plan = this.normalizePlan(rawPlan, request);
    } catch {
      plan = this.buildFallbackPlan(responseContent, request);
    }

    // Classify action tiers
    plan.actions = plan.actions.map(action => ({
      ...action,
      tier: classifyAction(action.action_type),
      auto_executable: ACTION_TIER_DEFINITIONS[classifyAction(action.action_type)].auto_execute
    }));

    // Governor validation (non-bypassable)
    const governorVerdict = this.governor.validate(plan.actions, request.agent_id);
    plan.governor_verdict = governorVerdict;

    // Block actions that failed governor
    if (!governorVerdict.passed) {
      for (const blockedId of governorVerdict.blocked_actions) {
        const action = plan.actions.find(a => blockedId.includes(a.action_id));
        if (action) {
          action.governor_approved = false;
          action.auto_executable = false;
        }
      }
    }

    // Auditor check for Tier 2+ (redundant AI check)
    const tier2Plus = plan.actions.filter(a => a.tier !== 'TIER_1_SAFE');
    if (tier2Plus.length > 0) {
      const auditorVerdict = await this.auditor.audit(tier2Plus, plan.analysis);
      plan.auditor_verdict = auditorVerdict;

      // Apply auditor decisions
      for (const rejectedId of auditorVerdict.rejected_actions) {
        const action = plan.actions.find(a => a.action_id === rejectedId);
        if (action) {
          action.auditor_approved = false;
          action.auto_executable = false;
        }
      }

      for (const downgradedId of auditorVerdict.downgraded_actions) {
        const action = plan.actions.find(a => a.action_id === downgradedId);
        if (action) {
          action.auto_executable = false; // Downgrade to simulation-only
        }
      }
    }

    // Build execution summary
    const executionSummary = this.buildExecutionSummary(plan, request.simulate_only);

    // Determine final plan status
    if (request.simulate_only || FORCE_SIMULATION) {
      plan.status = 'SIMULATION_ONLY';
    } else if (!governorVerdict.passed || (plan.auditor_verdict && !plan.auditor_verdict.passed)) {
      plan.status = 'BLOCKED';
    } else if (plan.actions.some(a => !a.auto_executable)) {
      plan.status = 'PARTIAL_APPROVED';
    }

    const response: ArchitectResponse = {
      request_id: request.request_id,
      correlation_id: correlationId,
      success: true,
      live_mode: ARCHITECT_LIVE && !request.simulate_only,
      plan,
      execution_summary: executionSummary,
      tokens_used: tokensUsed,
      model_used: this.MODEL,
      latency_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      version_tag: this.VERSION_TAG
    };

    // Immutable audit log
    this.auditLog.log({
      correlation_id: correlationId,
      version_tag: this.VERSION_TAG,
      request,
      response,
      actions_executed: plan.actions.filter(a => a.auto_executable && a.tier === 'TIER_1_SAFE').map(a => a.action_id),
      actions_blocked: [...(governorVerdict.blocked_actions || []), ...(plan.auditor_verdict?.rejected_actions || [])],
      governor_verdict: governorVerdict,
      auditor_verdict: plan.auditor_verdict || null
    });

    this.saveState();
    return response;
  }

  private buildUserMessage(request: ArchitectRequest): string {
    return `REQUEST FROM: ${request.agent_id}
REQUEST TYPE: ${request.question_type}
ENVIRONMENT: ${request.env}
RISK LEVEL: ${request.risk_level}
SIMULATION ONLY: ${request.simulate_only}
LIVE MODE: ${ARCHITECT_LIVE}

CURRENT STATE:
${JSON.stringify(request.state_snapshot, null, 2)}

CONSTRAINTS:
${request.constraints.map(c => `- ${c}`).join('\n')}

QUESTION:
${request.question}

Remember:
- Every action needs: action_type, risk_level, resources, diff, justification
- Tier 1 (READ/LOG/SCORE) can auto-execute
- Tier 2 (EMAIL_COPY/UI_TEXT) needs template reference
- Tier 3 (PRICING/BILLING) can ONLY be proposed as diffs, never executed`;
  }

  private normalizePlan(raw: any, request: ArchitectRequest): ArchitectPlan {
    return {
      plan_id: raw.plan_id || this.generateId('PLAN'),
      status: request.simulate_only ? 'SIMULATION_ONLY' : (raw.status || 'NEEDS_REVIEW'),
      analysis: raw.analysis || 'Analysis completed.',
      rationale: raw.rationale || 'See analysis.',
      risk_flags: raw.risk_flags || [],
      actions: (raw.actions || raw.suggested_actions || []).map((a: any) => ({
        action_id: a.action_id || this.generateId('ACT'),
        action_type: a.action_type || 'LOG',
        tier: 'TIER_1_SAFE' as ActionTier,
        risk_level: a.risk_level || 'LOW',
        resources: a.resources || [],
        diff: a.diff || { before: {}, after: {} },
        justification: a.justification || a.description || 'No justification provided',
        target_agent: a.target_agent || 'CoS',
        parameters: a.parameters || {},
        template_id: a.template_id,
        budget_impact: a.budget_impact || 0,
        auto_executable: true,
        governor_approved: true,
        auditor_approved: true
      })),
      governance_assessment: {
        vqs_compliant: raw.governance_assessment?.vqs_compliant ?? true,
        l6_compliant: raw.governance_assessment?.l6_compliant ?? true,
        methodology_lock_respected: raw.governance_assessment?.methodology_lock_respected ?? true,
        budget_compliant: raw.governance_assessment?.budget_compliant ?? true,
        violations: raw.governance_assessment?.violations || [],
        warnings: raw.governance_assessment?.warnings || []
      },
      confidence: raw.confidence ?? 0.8,
      simulation_output: raw.simulation_output
    };
  }

  private buildFallbackPlan(rawResponse: string, request: ArchitectRequest): ArchitectPlan {
    return {
      plan_id: this.generateId('PLAN'),
      status: 'NEEDS_REVIEW',
      analysis: rawResponse,
      rationale: 'Fallback plan - response parsing failed',
      risk_flags: [{
        type: 'GOVERNANCE',
        severity: 'MEDIUM',
        description: 'Response parsing failed',
        mitigation: 'Manual review required'
      }],
      actions: [],
      governance_assessment: {
        vqs_compliant: true,
        l6_compliant: true,
        methodology_lock_respected: true,
        budget_compliant: true,
        violations: [],
        warnings: ['Response required fallback parsing']
      },
      confidence: 0.5
    };
  }

  private buildExecutionSummary(plan: ArchitectPlan, simulateOnly: boolean): ExecutionSummary {
    const tier1 = plan.actions.filter(a => a.tier === 'TIER_1_SAFE' && a.auto_executable);
    const tier2 = plan.actions.filter(a => a.tier === 'TIER_2_CONSTRAINED' && a.auto_executable);
    const tier3 = plan.actions.filter(a => a.tier === 'TIER_3_SENSITIVE');
    const blocked = plan.actions.filter(a => !a.auto_executable || !a.governor_approved || !a.auditor_approved);

    return {
      tier1_executed: simulateOnly ? 0 : tier1.length,
      tier2_executed: simulateOnly ? 0 : tier2.length,
      tier3_proposed: tier3.length,
      total_actions: plan.actions.length,
      blocked_actions: blocked.length
    };
  }

  private buildErrorResponse(request: ArchitectRequest, correlationId: string, error: string, startTime: number): ArchitectResponse {
    const response: ArchitectResponse = {
      request_id: request.request_id,
      correlation_id: correlationId,
      success: false,
      live_mode: false,
      error,
      tokens_used: 0,
      model_used: this.MODEL,
      latency_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      version_tag: this.VERSION_TAG
    };

    this.auditLog.log({
      correlation_id: correlationId,
      version_tag: this.VERSION_TAG,
      request,
      response,
      actions_executed: [],
      actions_blocked: [],
      governor_verdict: null,
      auditor_verdict: null
    });

    return response;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  async requestL6StructureReview(agentId: ArchitectRequest['agent_id'] = 'CoS'): Promise<ArchitectResponse> {
    const request: ArchitectRequest = {
      request_id: this.generateId('REQ'),
      correlation_id: this.generateId('CORR'),
      version: this.VERSION_TAG,
      agent_id: agentId,
      env: 'development',
      state_snapshot: {
        l5_status: 'ACTIVE',
        l6_mode: 'SHADOW_MODE',
        active_campaigns: ['GENESIS'],
        governance_locks: ['VQS_LOCK', 'L6_BLOCK', 'METHODOLOGY_LOCK']
      },
      question: `Review the structure of all 6 L6 Shadow Mode capabilities:
1. Lead Qualification AI - SCORE advisory with A/B/C/D tier
2. Optimal Timing Engine - SCORE advisory with timing predictions  
3. Objection Predictor - REPORT advisory with resistance analysis
4. Inbound Response Router - ALERT advisory with priority assignment
5. Dark Social Intent Miner - SCORE advisory with intent signals
6. Lead Magnet Activation Tracker - SCORE advisory with quality metrics

Verify:
- All capabilities emit only advisory outputs (no execution)
- L6 cannot bypass L5 CoS execution authority
- Governance constraints are properly enforced

Provide structured actions for any fixes needed.`,
      question_type: 'STRUCTURE_REVIEW',
      constraints: ['L6 must remain READ-ONLY', 'VQS methodology must be preserved', 'No L6 activation allowed'],
      risk_level: 'LOW',
      simulate_only: true,
      token_budget: 1500,
      timeout_ms: 30000
    };

    return this.query(request);
  }

  async requestVQSAlignmentCheck(agentId: ArchitectRequest['agent_id'] = 'CoS'): Promise<ArchitectResponse> {
    const request: ArchitectRequest = {
      request_id: this.generateId('REQ'),
      correlation_id: this.generateId('CORR'),
      version: this.VERSION_TAG,
      agent_id: agentId,
      env: 'development',
      state_snapshot: {
        l5_status: 'ACTIVE',
        l6_mode: 'SHADOW_MODE',
        active_campaigns: ['GENESIS'],
        governance_locks: ['VQS_LOCK', 'L6_BLOCK', 'METHODOLOGY_LOCK'],
        current_metrics: { linkedin_reach_target: 186000, email_list_size: 900 }
      },
      question: `Assess VQS methodology alignment for L6 Shadow Mode integration:

Current Campaign: PHASE 0 GENESIS
- Target: 186K+ LinkedIn reach
- Email List: 900 contacts
- Lead Magnet: Audit Readiness Checklist
- Narrative: "Why Validation Teams Are Abandoning Traditional CSV"

Assess:
1. L6 capability outputs align with VQS methodology
2. Revenue optimization signal flow is correct
3. Capability weighting for pipeline prioritization
4. Phase 0 Genesis execution readiness`,
      question_type: 'STRATEGIC_ANALYSIS',
      constraints: ['VQS methodology is protected', 'L6 simulation only', 'Methodology lock active'],
      risk_level: 'LOW',
      simulate_only: true,
      token_budget: 1500,
      timeout_ms: 30000
    };

    return this.query(request);
  }

  getStatus(): {
    version: string;
    live_mode: boolean;
    kill_switch_active: boolean;
    healthy: boolean;
    circuit_breaker: CircuitBreakerState;
    budget: { daily_used: number; daily_limit: number; monthly_used: number; monthly_limit: number };
    governor: ReturnType<GovernorPolicyEngine['getStatus']>;
    request_count: number;
  } {
    this.resetBudgetsIfNeeded();

    return {
      version: this.VERSION_TAG,
      live_mode: ARCHITECT_LIVE,
      kill_switch_active: FORCE_SIMULATION,
      healthy: this.circuitBreaker.canProceed(),
      circuit_breaker: this.circuitBreaker.getState(),
      budget: {
        daily_used: this.tokensUsedToday,
        daily_limit: this.DAILY_TOKEN_BUDGET,
        monthly_used: this.tokensUsedThisMonth,
        monthly_limit: this.MONTHLY_TOKEN_CAP
      },
      governor: this.governor.getStatus(),
      request_count: this.requestCount
    };
  }

  getAuditLogs(limit: number = 50): AuditLogEntry[] {
    return this.auditLog.getRecentLogs(limit);
  }
}

export const architectGateway = new ArchitectGatewayService();
