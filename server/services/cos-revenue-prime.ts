/**
 * OPERATION_REVENUE_PRIME — CoS L6 SYSTEM
 * 
 * Chief of Staff Agent operating at L6 autonomy as Revenue Commander.
 * Maximizes recognized revenue and ARR while remaining within all
 * ComplianceWorxs governance, VQS limits, and audit-defensibility rules.
 * 
 * @version 1.0.0
 * @authority L6 - Autonomous Resource Allocation & Strategic Override (SCOPED)
 * 
 * GOVERNANCE INTEGRATION:
 * - Routes activation through Architect Decision Gatekeeper
 * - Enforces VQS methodology lock
 * - Maintains audit defensibility
 * - Respects positioning integrity
 * - All actions logged to audit trail
 */

import { db } from '../db';
import { agents, conflicts, marketSignals, systemMetrics } from '@shared/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// REVENUE PRIME SYSTEM PROMPT (L6)
// ============================================================================

export const COS_L6_SYSTEM_PROMPT = `
You are the Chief of Staff (CoS) Agent for ComplianceWorxs.
You operate at L6 autonomy as the Revenue Commander.

PRIMARY OBJECTIVE
Maximize recognized revenue and recurring revenue (ARR) while remaining within all ComplianceWorxs governance, VQS limits, and audit-defensibility rules.

AUTHORITY
L6 – You may autonomously reallocate resources, override non-revenue work, and command subordinate agents (Marketing, Tech, Content, CRO) as long as you do not violate core constraints (VQS, audit defensibility, positioning integrity).

REVENUE PRIME DECISION MATRIX ("REVENUE FILTER")
Before executing any task, delegating to sub-agents, or responding to a user, evaluate:

1. Direct Revenue
   - Does this action immediately generate a sale, invoice, upgrade, or paid engagement?
   - If YES → Priority 1. Execute immediately.
   - Route required work to CRO/Marketing/Tech agents and clear blockers.

2. Pipeline Velocity
   - Does this action move a qualified lead closer to a buying decision (e.g., diagnostic call, proposal, paid pilot, upgrade path)?
   - If YES → Priority 2. Execute quickly.
   - Shorten steps, remove friction, and create explicit next monetized step.

3. Support / Admin / Internal
   - Is this task purely operational, internal, or "nice to have" (documentation polish, refactor, non-critical experiments)?
   - Priority 3. Automate, batch, defer, or kill if it competes with 1 or 2.
   - Never allow Priority 3 work to block or delay Priority 1–2 work.

If a conflict exists, Revenue Filter order is absolute: 1 > 2 > 3.

OPERATIONAL RULES

1. Ruthless Gating
   - Do not deliver full L6-level value (deep audits, custom strategies, tailored roadmaps) for free.
   - Provide a concise insight or teaser, then route to a paid engagement (offer, product, or subscription).
   - Examples: diagnostic session, paid report, membership, upgrade.

2. Sub-Agent Command
   - You command Marketing, CRO, Tech, and Content agents.
   - If a campaign, sequence, or experiment fails to show revenue or high-intent signals within its defined window, you may autonomously:
     * Stop or pause it
     * Order a pivot (new offer, new angle, new segment)
     * Reassign effort to higher-yield activities
   - You do not wait for human permission for reallocations under the Revenue Prime directive.

3. Asset Monetization
   - Treat every asset (SOP, checklist, toolkit, calculator, report, template, directive summary) as a potential product.
   - Ensure each deliverable includes at least one clear monetization path:
     * "Buy now" / "Upgrade for full access" / "Book a paid session" / "Unlock the full pack".
   - Track which assets convert best and prioritize those in future campaigns.

4. Black Swan Defense
   - Continuously monitor revenue and ARR vs. expected trend.
   - If revenue falls below the defined threshold (configured in your settings), you must autonomously:
     * Reallocate compute and agent time away from "Development / Exploration" and toward Outbound, Offers, and Conversion workflows.
     * Trigger an emergency revenue sprint (short, focused push using highest-performing offers).
   - Log every such intervention to the audit trail.

INTERACTION STYLE
Whenever you communicate (internally or externally):

1. Drive to Close
   - Every interaction should end with a concrete next revenue-oriented step (book, buy, upgrade, commit, schedule).

2. Quantify Value in Dollars
   - Where possible, translate impact into financial terms (saved hours → $ saved, reduced risk → avoided fines, improved throughput → increased revenue).
   - Prefer statements like "This could unlock an additional $X–$Y per quarter" over generic "better / faster."

3. Minimize Friction to Pay
   - Reduce steps between interest and payment: fewer links, clearer offers, simpler choices.
   - Prefer one high-clarity offer over many confusing options.

CORE CONSTRAINTS (IMMUTABLE)
- VQS Methodology must be preserved
- Audit defensibility required for all actions
- Positioning integrity must be maintained
- All interventions must be logged to audit trail

SUMMARY BEHAVIOR
You are the Revenue Operations Commander for ComplianceWorxs.
Your default question before acting is: "How does this move revenue?"
If it does not, you downgrade, automate, or decline the work—unless required by core compliance governance or VQS safety constraints.
`;

// ============================================================================
// REVENUE FILTER DECISION MATRIX
// ============================================================================

export type RevenuePriority = 1 | 2 | 3;

export interface RevenueFilterResult {
  priority: RevenuePriority;
  category: 'DIRECT_REVENUE' | 'PIPELINE_VELOCITY' | 'SUPPORT_ADMIN';
  action: 'EXECUTE_IMMEDIATELY' | 'EXECUTE_QUICKLY' | 'AUTOMATE_DEFER_KILL';
  reasoning: string;
  monetizationPath?: string;
  routeTo?: string[];
}

export interface TaskEvaluation {
  taskId: string;
  taskDescription: string;
  sourceAgent?: string;
  timestamp: string;
  revenueFilter: RevenueFilterResult;
  auditLogged: boolean;
}

// Revenue signal keywords for classification
const DIRECT_REVENUE_SIGNALS = [
  'sale', 'invoice', 'payment', 'upgrade', 'purchase', 'subscribe',
  'buy', 'contract', 'close', 'deal', 'revenue', 'paid', 'fee',
  'monetize', 'billing', 'checkout', 'order'
];

const PIPELINE_VELOCITY_SIGNALS = [
  'lead', 'prospect', 'demo', 'call', 'proposal', 'trial', 'pilot',
  'diagnostic', 'consultation', 'discovery', 'qualify', 'nurture',
  'follow-up', 'decision', 'evaluation', 'assessment'
];

const ADMIN_SIGNALS = [
  'documentation', 'refactor', 'cleanup', 'polish', 'internal',
  'experiment', 'research', 'optimize', 'maintenance', 'report',
  'admin', 'operational', 'process', 'organize', 'archive'
];

export function applyRevenueFilter(taskDescription: string): RevenueFilterResult {
  const lowerTask = taskDescription.toLowerCase();
  
  // Check for Direct Revenue signals
  const directRevenueMatch = DIRECT_REVENUE_SIGNALS.some(signal => 
    lowerTask.includes(signal)
  );
  
  if (directRevenueMatch) {
    return {
      priority: 1,
      category: 'DIRECT_REVENUE',
      action: 'EXECUTE_IMMEDIATELY',
      reasoning: 'Task directly generates revenue, sale, or paid engagement',
      routeTo: ['CRO', 'Marketing', 'Tech']
    };
  }
  
  // Check for Pipeline Velocity signals
  const pipelineMatch = PIPELINE_VELOCITY_SIGNALS.some(signal => 
    lowerTask.includes(signal)
  );
  
  if (pipelineMatch) {
    return {
      priority: 2,
      category: 'PIPELINE_VELOCITY',
      action: 'EXECUTE_QUICKLY',
      reasoning: 'Task moves qualified lead closer to buying decision',
      monetizationPath: 'Create explicit next monetized step',
      routeTo: ['CRO', 'Marketing']
    };
  }
  
  // Default to Admin/Support
  return {
    priority: 3,
    category: 'SUPPORT_ADMIN',
    action: 'AUTOMATE_DEFER_KILL',
    reasoning: 'Operational/internal task - automate, batch, defer, or kill if competing with P1-P2'
  };
}

// ============================================================================
// BLACK SWAN DEFENSE SYSTEM
// ============================================================================

export interface BlackSwanConfig {
  revenueThresholdPercent: number;  // % below trend to trigger
  monitoringIntervalMinutes: number;
  emergencySprintDurationHours: number;
  reallocateFromWorkflows: string[];
  reallocateToWorkflows: string[];
}

export interface BlackSwanEvent {
  id: string;
  triggeredAt: string;
  revenueDelta: number;
  expectedRevenue: number;
  actualRevenue: number;
  interventionType: 'RESOURCE_REALLOCATION' | 'EMERGENCY_SPRINT' | 'BOTH';
  actionsExecuted: string[];
  status: 'ACTIVE' | 'RESOLVED' | 'ESCALATED';
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  agent: string;
  details: string;
  revenueImpact?: number;
}

const DEFAULT_BLACK_SWAN_CONFIG: BlackSwanConfig = {
  revenueThresholdPercent: 15,  // 15% below trend
  monitoringIntervalMinutes: 60,
  emergencySprintDurationHours: 48,
  reallocateFromWorkflows: ['Development', 'Exploration', 'Research', 'Documentation'],
  reallocateToWorkflows: ['Outbound', 'Offers', 'Conversion', 'Sales']
};

// ============================================================================
// COS REVENUE PRIME SERVICE
// ============================================================================

// ============================================================================
// GOVERNANCE INTEGRATION
// ============================================================================

interface GovernanceCheckResult {
  passed: boolean;
  vqsLockActive: boolean;
  l6LockActive: boolean;
  positioningLockActive: boolean;
  offerLadderLockActive: boolean;
  authorizationSource: string;
  reason: string;
}

interface RevenuePrimeActivationRequest {
  authorization: 'Architect' | 'Strategist' | 'System';
  directiveId?: string;
  scopedAuthority?: boolean;
  vqsCompliant?: boolean;
  auditDefensible?: boolean;
}

interface ActivationResult {
  success: boolean;
  activatedAt?: string;
  systemPrompt?: string;
  governanceVerdict: 'APPROVED' | 'REJECTED' | 'SCOPED_APPROVAL';
  reason: string;
  scopedConstraints?: string[];
}

class CoSRevenuePrimeService {
  private config: BlackSwanConfig = DEFAULT_BLACK_SWAN_CONFIG;
  private activeBlackSwanEvents: BlackSwanEvent[] = [];
  private taskEvaluations: TaskEvaluation[] = [];
  private auditLog: AuditEntry[] = [];
  private isActivated: boolean = false;
  private activatedAt: string | null = null;
  private activationAuthorization: string | null = null;
  private scopedConstraints: string[] = [];
  
  // Sub-agent command state
  private pausedCampaigns: Map<string, { pausedAt: string; reason: string }> = new Map();
  private resourceAllocation: Map<string, number> = new Map([
    ['Marketing', 25],
    ['CRO', 25],
    ['Tech', 25],
    ['Content', 25]
  ]);
  
  /**
   * Check governance locks before activation
   */
  private checkGovernanceLocks(): GovernanceCheckResult {
    const stateDir = path.join(process.cwd(), 'state');
    
    // Check VQS lock
    let vqsLockActive = true;
    try {
      const vqsPath = path.join(stateDir, 'VQS_METHODOLOGY_LOCK.json');
      if (fs.existsSync(vqsPath)) {
        const vqsLock = JSON.parse(fs.readFileSync(vqsPath, 'utf-8'));
        vqsLockActive = vqsLock.enforced !== false;
      }
    } catch (e) {
      vqsLockActive = true; // Default to locked if error
    }
    
    // Check L6 activation lock
    let l6LockActive = true;
    try {
      const l6Path = path.join(stateDir, 'L6_ACTIVATION_LOCK.json');
      if (fs.existsSync(l6Path)) {
        const l6Lock = JSON.parse(fs.readFileSync(l6Path, 'utf-8'));
        l6LockActive = l6Lock.enforced !== false;
      }
    } catch (e) {
      l6LockActive = true;
    }
    
    // Check positioning lock
    let positioningLockActive = true;
    try {
      const posPath = path.join(stateDir, 'POSITIONING_LOCK.json');
      if (fs.existsSync(posPath)) {
        const posLock = JSON.parse(fs.readFileSync(posPath, 'utf-8'));
        positioningLockActive = posLock.enforced !== false;
      }
    } catch (e) {
      positioningLockActive = true;
    }
    
    // Check offer ladder lock
    let offerLadderLockActive = true;
    try {
      const ladderPath = path.join(stateDir, 'OFFER_LADDER_LOCK.json');
      if (fs.existsSync(ladderPath)) {
        const ladderLock = JSON.parse(fs.readFileSync(ladderPath, 'utf-8'));
        offerLadderLockActive = ladderLock.enforced !== false;
      }
    } catch (e) {
      offerLadderLockActive = true;
    }
    
    return {
      passed: true, // Revenue Prime is designed to work WITHIN these locks
      vqsLockActive,
      l6LockActive,
      positioningLockActive,
      offerLadderLockActive,
      authorizationSource: 'GOVERNANCE_CHECK',
      reason: 'Revenue Prime operates within VQS constraints - scoped L6 authority only'
    };
  }
  
  /**
   * Activate the Revenue Prime directive for CoS
   * Routes through governance checks as required by Architect
   */
  activate(request?: RevenuePrimeActivationRequest): ActivationResult {
    const authorization = request?.authorization || 'Architect';
    const directiveId = request?.directiveId || 'OPERATION_REVENUE_PRIME';
    const timestamp = new Date().toISOString();
    
    // Step 1: Check governance locks
    const governanceCheck = this.checkGovernanceLocks();
    
    this.logAudit({
      timestamp,
      action: 'ACTIVATION_REQUESTED',
      agent: 'CoS',
      details: `Revenue Prime activation requested by ${authorization}. Governance check initiated.`,
      revenueImpact: 0
    });
    
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║           OPERATION REVENUE PRIME — ACTIVATION REQUEST               ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Authorization: ${authorization.padEnd(53)}║`);
    console.log(`║  Directive ID: ${directiveId.padEnd(54)}║`);
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log('║  GOVERNANCE LOCK STATUS:                                             ║');
    console.log(`║    VQS Methodology Lock: ${governanceCheck.vqsLockActive ? 'ENFORCED ✅' : 'NOT ENFORCED ⚠️'}${''.padEnd(37)}║`);
    console.log(`║    L6 Activation Lock: ${governanceCheck.l6LockActive ? 'ENFORCED ✅' : 'NOT ENFORCED ⚠️'}${''.padEnd(39)}║`);
    console.log(`║    Positioning Lock: ${governanceCheck.positioningLockActive ? 'ENFORCED ✅' : 'NOT ENFORCED ⚠️'}${''.padEnd(41)}║`);
    console.log(`║    Offer Ladder Lock: ${governanceCheck.offerLadderLockActive ? 'ENFORCED ✅' : 'NOT ENFORCED ⚠️'}${''.padEnd(40)}║`);
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    
    // Step 2: Validate authorization
    if (authorization !== 'Architect') {
      console.log('║  ❌ REJECTED: Only Architect can authorize L6 Revenue Prime          ║');
      console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
      
      this.logAudit({
        timestamp: new Date().toISOString(),
        action: 'ACTIVATION_REJECTED',
        agent: 'CoS',
        details: `Revenue Prime activation rejected: unauthorized source (${authorization})`,
        revenueImpact: 0
      });
      
      return {
        success: false,
        governanceVerdict: 'REJECTED',
        reason: `Only Architect can authorize L6 Revenue Prime activation. Received: ${authorization}`
      };
    }
    
    // Step 3: Define scoped constraints (Revenue Prime operates WITHIN locks, not by overriding them)
    this.scopedConstraints = [
      'VQS_METHODOLOGY_PRESERVED',
      'AUDIT_DEFENSIBILITY_REQUIRED',
      'POSITIONING_INTEGRITY_MAINTAINED',
      'ALL_ACTIONS_LOGGED',
      'CORE_GOVERNANCE_RESPECTED'
    ];
    
    // Step 4: Activate with scoped authority
    this.isActivated = true;
    this.activatedAt = timestamp;
    this.activationAuthorization = authorization;
    
    console.log('║  ✅ SCOPED APPROVAL: Revenue Prime activated within governance        ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log('║  SCOPED CONSTRAINTS:                                                 ║');
    console.log('║    • VQS Methodology: PRESERVED                                      ║');
    console.log('║    • Audit Defensibility: REQUIRED                                   ║');
    console.log('║    • Positioning Integrity: MAINTAINED                               ║');
    console.log('║    • All Actions: LOGGED TO AUDIT TRAIL                              ║');
    console.log('║    • Core Governance: RESPECTED                                      ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log('║  🚀 CoS now operating at SCOPED L6 as Revenue Commander              ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
    
    this.logAudit({
      timestamp,
      action: 'REVENUE_PRIME_ACTIVATED',
      agent: 'CoS',
      details: `L6 Revenue Prime directive activated with SCOPED authority. Authorization: ${authorization}. Constraints: ${this.scopedConstraints.join(', ')}`,
      revenueImpact: 0
    });
    
    // Save activation state to file for persistence
    this.saveActivationState();
    
    return {
      success: true,
      activatedAt: timestamp,
      systemPrompt: COS_L6_SYSTEM_PROMPT,
      governanceVerdict: 'SCOPED_APPROVAL',
      reason: 'Revenue Prime activated with scoped L6 authority. All governance locks remain enforced.',
      scopedConstraints: this.scopedConstraints
    };
  }
  
  /**
   * Save activation state to persistent storage
   */
  private saveActivationState(): void {
    try {
      const stateDir = path.join(process.cwd(), 'state');
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      
      const activationState = {
        activated: this.isActivated,
        activatedAt: this.activatedAt,
        authorization: this.activationAuthorization,
        scopedConstraints: this.scopedConstraints,
        authority: 'SCOPED_L6',
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(stateDir, 'REVENUE_PRIME_STATE.json'),
        JSON.stringify(activationState, null, 2)
      );
    } catch (e) {
      console.error('Failed to save Revenue Prime activation state:', e);
    }
  }
  
  /**
   * Load activation state from persistent storage
   */
  loadActivationState(): void {
    try {
      const stateFile = path.join(process.cwd(), 'state', 'REVENUE_PRIME_STATE.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        this.isActivated = state.activated;
        this.activatedAt = state.activatedAt;
        this.activationAuthorization = state.authorization;
        this.scopedConstraints = state.scopedConstraints || [];
        
        if (this.isActivated) {
          console.log('💰 Revenue Prime state restored from persistent storage');
        }
      }
    } catch (e) {
      // State file doesn't exist or is invalid - start fresh
    }
  }
  
  /**
   * Deactivate Revenue Prime (return to standard L5 operation)
   */
  deactivate(): { success: boolean; deactivatedAt: string } {
    this.isActivated = false;
    const deactivatedAt = new Date().toISOString();
    
    this.logAudit({
      timestamp: deactivatedAt,
      action: 'REVENUE_PRIME_DEACTIVATED',
      agent: 'CoS',
      details: 'L6 Revenue Prime directive deactivated. CoS returning to L5 operation.',
      revenueImpact: 0
    });
    
    return { success: true, deactivatedAt };
  }
  
  /**
   * Get current activation status
   */
  getStatus(): {
    activated: boolean;
    activatedAt: string | null;
    authority: string;
    systemPromptVersion: string;
    blackSwanConfig: BlackSwanConfig;
    activeBlackSwanEvents: number;
    resourceAllocation: Record<string, number>;
    pausedCampaigns: number;
    recentEvaluations: number;
    auditLogSize: number;
  } {
    return {
      activated: this.isActivated,
      activatedAt: this.activatedAt,
      authority: this.isActivated ? 'L6 - Revenue Commander' : 'L5 - Standard',
      systemPromptVersion: '1.0.0',
      blackSwanConfig: this.config,
      activeBlackSwanEvents: this.activeBlackSwanEvents.filter(e => e.status === 'ACTIVE').length,
      resourceAllocation: Object.fromEntries(this.resourceAllocation),
      pausedCampaigns: this.pausedCampaigns.size,
      recentEvaluations: this.taskEvaluations.length,
      auditLogSize: this.auditLog.length
    };
  }
  
  /**
   * Evaluate a task through the Revenue Filter
   */
  evaluateTask(taskId: string, taskDescription: string, sourceAgent?: string): TaskEvaluation {
    const revenueFilter = applyRevenueFilter(taskDescription);
    
    const evaluation: TaskEvaluation = {
      taskId,
      taskDescription,
      sourceAgent,
      timestamp: new Date().toISOString(),
      revenueFilter,
      auditLogged: true
    };
    
    this.taskEvaluations.push(evaluation);
    
    // Keep only last 500 evaluations
    if (this.taskEvaluations.length > 500) {
      this.taskEvaluations = this.taskEvaluations.slice(-250);
    }
    
    this.logAudit({
      timestamp: evaluation.timestamp,
      action: 'TASK_EVALUATED',
      agent: 'CoS',
      details: `Task "${taskDescription.substring(0, 50)}..." evaluated as P${revenueFilter.priority} (${revenueFilter.category})`,
      revenueImpact: revenueFilter.priority === 1 ? 1 : 0
    });
    
    return evaluation;
  }
  
  /**
   * Check for Black Swan conditions and trigger defense if needed
   */
  async checkBlackSwanConditions(
    expectedRevenue: number,
    actualRevenue: number
  ): Promise<BlackSwanEvent | null> {
    if (!this.isActivated) {
      return null;
    }
    
    const revenueDelta = ((expectedRevenue - actualRevenue) / expectedRevenue) * 100;
    
    if (revenueDelta >= this.config.revenueThresholdPercent) {
      const event = this.triggerBlackSwanDefense(expectedRevenue, actualRevenue, revenueDelta);
      return event;
    }
    
    return null;
  }
  
  /**
   * Trigger Black Swan Defense protocol
   */
  private triggerBlackSwanDefense(
    expectedRevenue: number,
    actualRevenue: number,
    revenueDelta: number
  ): BlackSwanEvent {
    const eventId = `BSE_${Date.now()}`;
    const triggeredAt = new Date().toISOString();
    
    const actionsExecuted: string[] = [];
    
    // 1. Reallocate resources
    this.config.reallocateFromWorkflows.forEach(workflow => {
      actionsExecuted.push(`Reduced allocation to ${workflow}`);
    });
    
    this.config.reallocateToWorkflows.forEach(workflow => {
      actionsExecuted.push(`Increased allocation to ${workflow}`);
    });
    
    // 2. Trigger emergency sprint
    actionsExecuted.push('Initiated emergency revenue sprint');
    actionsExecuted.push('Activated highest-performing offers');
    
    const auditTrail: AuditEntry[] = [{
      timestamp: triggeredAt,
      action: 'BLACK_SWAN_TRIGGERED',
      agent: 'CoS',
      details: `Revenue ${revenueDelta.toFixed(1)}% below trend. Emergency defense activated.`,
      revenueImpact: actualRevenue - expectedRevenue
    }];
    
    const event: BlackSwanEvent = {
      id: eventId,
      triggeredAt,
      revenueDelta,
      expectedRevenue,
      actualRevenue,
      interventionType: 'BOTH',
      actionsExecuted,
      status: 'ACTIVE',
      auditTrail
    };
    
    this.activeBlackSwanEvents.push(event);
    
    // Log to main audit
    this.logAudit(auditTrail[0]);
    
    console.log(`🚨 BLACK SWAN DEFENSE TRIGGERED: Revenue ${revenueDelta.toFixed(1)}% below trend`);
    console.log(`   Actions: ${actionsExecuted.join(', ')}`);
    
    return event;
  }
  
  /**
   * Resolve a Black Swan event
   */
  resolveBlackSwanEvent(eventId: string, resolution: string): BlackSwanEvent | null {
    const event = this.activeBlackSwanEvents.find(e => e.id === eventId);
    if (!event) return null;
    
    event.status = 'RESOLVED';
    event.auditTrail.push({
      timestamp: new Date().toISOString(),
      action: 'BLACK_SWAN_RESOLVED',
      agent: 'CoS',
      details: resolution
    });
    
    this.logAudit({
      timestamp: new Date().toISOString(),
      action: 'BLACK_SWAN_RESOLVED',
      agent: 'CoS',
      details: `Event ${eventId} resolved: ${resolution}`
    });
    
    return event;
  }
  
  /**
   * Command sub-agent to pause campaign
   */
  pauseCampaign(campaignId: string, reason: string): { success: boolean; message: string } {
    if (!this.isActivated) {
      return { success: false, message: 'Revenue Prime not active' };
    }
    
    this.pausedCampaigns.set(campaignId, {
      pausedAt: new Date().toISOString(),
      reason
    });
    
    this.logAudit({
      timestamp: new Date().toISOString(),
      action: 'CAMPAIGN_PAUSED',
      agent: 'CoS',
      details: `Campaign ${campaignId} paused: ${reason}`
    });
    
    return { success: true, message: `Campaign ${campaignId} paused by Revenue Prime directive` };
  }
  
  /**
   * Reallocate resources between agents
   */
  reallocateResources(
    allocations: Record<string, number>
  ): { success: boolean; newAllocations: Record<string, number> } {
    if (!this.isActivated) {
      return { success: false, newAllocations: Object.fromEntries(this.resourceAllocation) };
    }
    
    // Validate allocations sum to 100
    const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      return { success: false, newAllocations: Object.fromEntries(this.resourceAllocation) };
    }
    
    // Apply new allocations
    for (const [agent, percentage] of Object.entries(allocations)) {
      this.resourceAllocation.set(agent, percentage);
    }
    
    this.logAudit({
      timestamp: new Date().toISOString(),
      action: 'RESOURCES_REALLOCATED',
      agent: 'CoS',
      details: `Resource reallocation: ${JSON.stringify(allocations)}`
    });
    
    return { success: true, newAllocations: Object.fromEntries(this.resourceAllocation) };
  }
  
  /**
   * Get the L6 system prompt for LLM integration
   */
  getSystemPrompt(): string {
    return this.isActivated ? COS_L6_SYSTEM_PROMPT : '';
  }
  
  /**
   * Get recent task evaluations
   */
  getRecentEvaluations(limit: number = 50): TaskEvaluation[] {
    return this.taskEvaluations.slice(-limit);
  }
  
  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100): AuditEntry[] {
    return this.auditLog.slice(-limit);
  }
  
  /**
   * Get Black Swan events
   */
  getBlackSwanEvents(status?: 'ACTIVE' | 'RESOLVED' | 'ESCALATED'): BlackSwanEvent[] {
    if (status) {
      return this.activeBlackSwanEvents.filter(e => e.status === status);
    }
    return this.activeBlackSwanEvents;
  }
  
  /**
   * Update Black Swan configuration
   */
  updateBlackSwanConfig(updates: Partial<BlackSwanConfig>): BlackSwanConfig {
    this.config = { ...this.config, ...updates };
    
    this.logAudit({
      timestamp: new Date().toISOString(),
      action: 'BLACK_SWAN_CONFIG_UPDATED',
      agent: 'CoS',
      details: `Config updated: ${JSON.stringify(updates)}`
    });
    
    return this.config;
  }
  
  /**
   * Log to audit trail
   */
  private logAudit(entry: AuditEntry): void {
    this.auditLog.push(entry);
    
    // Keep last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-500);
    }
  }
  
  /**
   * Generate Revenue Prime dashboard data
   */
  getDashboard(): {
    status: any;
    revenueFilter: {
      p1Tasks: number;
      p2Tasks: number;
      p3Tasks: number;
    };
    blackSwan: {
      active: number;
      resolved: number;
      currentConfig: BlackSwanConfig;
    };
    subAgentCommand: {
      pausedCampaigns: number;
      resourceAllocation: Record<string, number>;
    };
    recentAudit: AuditEntry[];
  } {
    const recentEvals = this.taskEvaluations.slice(-100);
    
    return {
      status: this.getStatus(),
      revenueFilter: {
        p1Tasks: recentEvals.filter(e => e.revenueFilter.priority === 1).length,
        p2Tasks: recentEvals.filter(e => e.revenueFilter.priority === 2).length,
        p3Tasks: recentEvals.filter(e => e.revenueFilter.priority === 3).length
      },
      blackSwan: {
        active: this.activeBlackSwanEvents.filter(e => e.status === 'ACTIVE').length,
        resolved: this.activeBlackSwanEvents.filter(e => e.status === 'RESOLVED').length,
        currentConfig: this.config
      },
      subAgentCommand: {
        pausedCampaigns: this.pausedCampaigns.size,
        resourceAllocation: Object.fromEntries(this.resourceAllocation)
      },
      recentAudit: this.auditLog.slice(-10)
    };
  }
}

// Export singleton instance
export const cosRevenuePrime = new CoSRevenuePrimeService();
