import { db } from "../db";
import { agents, agentDirectives, conflicts } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Configuration with fallbacks - Tier 1 Must-haves for Real Autonomy
const CONFIG = {
  AUTO_REMEDIATE: process.env.AUTO_REMEDIATE === 'true' || true, // Default enabled for demo
  AUTOREM_MAX_ATTEMPTS: parseInt(process.env.AUTOREM_MAX_ATTEMPTS || '2'),
  
  // SLOs per agent: success ≥ 94%, alignment ≥ 95%, backlog age ≤ 15m
  AUTOREM_SLO_THRESHOLDS: {
    success_rate: 0.94,  // Must be ≥ 94% or triggers remediation
    alignment: 0.95,     // Must be ≥ 95% or triggers remediation
    backlog_age_minutes: 15 // Must be ≤ 15m or triggers remediation
  },
  
  // Clear priorities & arbitration: Revenue > Marketing > Content
  AUTOREM_PRIORITY: ['Revenue', 'Marketing', 'Content'],
  
  // Budget caps per agent + per directive
  BUDGET_CAPS: {
    per_agent_daily: 1000,    // $1000/day per agent max
    per_directive: 100,       // $100 per directive max
    emergency_reserve: 5000   // $5000 emergency budget
  },
  
  // KPI tracking for autonomy measurement
  KPI_TARGETS: {
    auto_resolve_rate: 0.85,  // Aim >85% auto-resolved vs escalated
    mttd_minutes: 5,          // Mean Time To Detect ≤ 5 minutes
    mttr_minutes: 15,         // Mean Time To Recover ≤ 15 minutes
    cost_per_incident: 50     // Target cost per resolved incident
  }
};

export type AgentStatus = 'healthy' | 'degraded' | 'error' | 'recovering';
export type Classification = 'CONFLICT' | 'TRANSIENT' | 'CAPACITY' | 'DATA_DEP' | 'CONFIG';

export interface AgentSignal {
  agent: string;
  status: AgentStatus;
  lastReport: string;
  metrics: {
    successRate: number;
    alignment: number;
  };
  context?: {
    directiveId?: string;
    conflictId?: string;
    errorCode?: string;
  };
}

export interface Playbook {
  name: string;
  match: { classification: Classification };
  steps: Array<{
    do: string;
    args?: Record<string, any>;
  }>;
  successCriteria: Record<string, any>;
}

// Auto-remediation playbooks
export const PLAYBOOKS: Playbook[] = [
  {
    name: "ResolveInterAgentConflict",
    match: { classification: "CONFLICT" },
    steps: [
      { do: "applyPriorityRules", args: { order: CONFIG.AUTOREM_PRIORITY } },
      { do: "reassignOverlappingDirectives", args: { from: "CMO", to: "CRO", policy: "revenue_first" } },
      { do: "throttleAgent", args: { agent: "Content", maxConcurrent: 1, forMinutes: 30 } }
    ],
    successCriteria: { conflictCleared: true, alignmentMin: 0.92 }
  },
  {
    name: "RestartAndRetryTransient",
    match: { classification: "TRANSIENT" },
    steps: [
      { do: "restartAgent", args: { soft: true } },
      { do: "retryLastJob", args: { backoffMs: 2000, max: 2 } }
    ],
    successCriteria: { lastJobSucceeded: true }
  },
  {
    name: "RebalanceCapacity",
    match: { classification: "CAPACITY" },
    steps: [
      { do: "reallocateCapacity", args: { from: "CMO", to: "CRO", slots: 2 } },
      { do: "splitDirective", args: { directiveIdVar: "context.directiveId", ratio: [0.6, 0.4] } }
    ],
    successCriteria: { backlogAgeMaxMinutes: 15 }
  },
  {
    name: "RepairDataDependency",
    match: { classification: "DATA_DEP" },
    steps: [
      { do: "refreshCache" },
      { do: "refetchSource", args: { source: "MarketIntel" } },
      { do: "validateInputs" }
    ],
    successCriteria: { inputsValid: true }
  },
  {
    name: "FixConfig",
    match: { classification: "CONFIG" },
    steps: [
      { do: "checkSecrets", args: { required: ["GOOGLE_PROJECT_ID", "SERVICE_ACCOUNT", "API_BASE"] } },
      { do: "schemaMigrateIfNeeded" }
    ],
    successCriteria: { configHealthy: true }
  }
];

// Agent state tracking
const agentStates = new Map<string, {
  status: AgentStatus;
  degradedCount: number;
  remediationAttempts: number;
  lastRemediation?: Date;
  activePlaybook?: string;
}>();

// Main auto-remediation function
export async function autoRemediate(signal: AgentSignal): Promise<boolean> {
  if (!CONFIG.AUTO_REMEDIATE) {
    console.log('Auto-remediation disabled');
    return false;
  }

  const { agent, status, context } = signal;
  console.log(`AUTO-REMEDIATION: Processing signal for ${agent} with status ${status}`);

  // Update agent state
  updateAgentState(agent, status);

  // Skip if already at max attempts
  const state = agentStates.get(agent);
  if (state && state.remediationAttempts >= CONFIG.AUTOREM_MAX_ATTEMPTS) {
    console.log(`AUTO-REMEDIATION: Max attempts reached for ${agent}, escalating`);
    await escalate({ to: "CEO", agent, context: context || {}, reason: "MaxAttemptsExceeded" });
    return false;
  }

  try {
    // 1) Classify the issue
    const classification = classifyIssue(signal);
    console.log(`AUTO-REMEDIATION: Classified ${agent} issue as ${classification}`);

    // 2) Select playbook
    const playbook = selectPlaybook({ agent, classification, context: context || {} });
    if (!playbook) {
      console.log(`AUTO-REMEDIATION: No playbook found for ${agent} classification ${classification}`);
      return false;
    }

    // Mark as recovering
    setAgentStatus(agent, 'recovering', playbook.name);

    // 3) Execute playbook
    console.log(`AUTO-REMEDIATION: Executing playbook ${playbook.name} for ${agent}`);
    const result = await runPlaybook(playbook, signal);

    // 4) Verify recovery
    const verified = await verifyRecovery({ agent, expected: playbook.successCriteria });

    // 5) Log decision
    await logDecision({
      agent,
      classification,
      playbook: playbook.name,
      success: verified,
      context: context || {},
      attempt: (state?.remediationAttempts || 0) + 1
    });

    if (verified) {
      console.log(`AUTO-REMEDIATION: Successfully remediated ${agent} using ${playbook.name}`);
      setAgentStatus(agent, 'healthy');
      return true;
    } else {
      console.log(`AUTO-REMEDIATION: Remediation failed for ${agent}, incrementing attempts`);
      incrementRemediationAttempts(agent);
      
      // Check if we've exhausted attempts
      const updatedState = agentStates.get(agent);
      if (updatedState && updatedState.remediationAttempts >= CONFIG.AUTOREM_MAX_ATTEMPTS) {
        await escalate({ to: "CEO", agent, context: context || {}, reason: "RemediationFailed" });
      }
      return false;
    }

  } catch (error) {
    console.error(`AUTO-REMEDIATION: Error processing ${agent}:`, error);
    await escalate({ to: "CEO", agent, context: context || {}, reason: "SystemError" });
    return false;
  }
}

// Classification logic
function classifyIssue(signal: AgentSignal): Classification {
  const { context, metrics } = signal;

  // Conflict classification
  if (context?.conflictId) {
    return "CONFLICT";
  }

  // Transient error codes
  if (context?.errorCode && ['TIMEOUT', 'RATE_LIMIT', 'TEMP_NETWORK'].includes(context.errorCode)) {
    return "TRANSIENT";
  }

  // Performance-based classification
  if (metrics.successRate < 0.7) {
    return "CAPACITY";
  }

  if (metrics.alignment < 0.7) {
    return "DATA_DEP";
  }

  // Default to config issue
  return "CONFIG";
}

// Playbook selection
function selectPlaybook(params: { agent: string; classification: Classification; context: Record<string, any> }): Playbook | null {
  return PLAYBOOKS.find(pb => pb.match.classification === params.classification) || null;
}

// Playbook execution
async function runPlaybook(playbook: Playbook, signal: AgentSignal): Promise<boolean> {
  try {
    for (const step of playbook.steps) {
      console.log(`AUTO-REMEDIATION: Executing step ${step.do} with args`, step.args);
      await executeAction(step.do, step.args || {}, signal);
    }
    return true;
  } catch (error) {
    console.error(`AUTO-REMEDIATION: Playbook ${playbook.name} execution failed:`, error);
    return false;
  }
}

// Action primitives (thin wrappers around existing endpoints)
async function executeAction(action: string, args: Record<string, any>, signal: AgentSignal): Promise<void> {
  switch (action) {
    case 'applyPriorityRules':
      await applyPriorityRules(args.order || []);
      break;
    case 'reassignOverlappingDirectives':
      await reassignOverlappingDirectives(args);
      break;
    case 'throttleAgent':
      await throttleAgent(args);
      break;
    case 'restartAgent':
      await restartAgent(signal.agent, args);
      break;
    case 'retryLastJob':
      await retryLastJob(signal.agent, args);
      break;
    case 'reallocateCapacity':
      await reallocateCapacity(args);
      break;
    case 'splitDirective':
      await splitDirective(args, signal);
      break;
    case 'refreshCache':
      await refreshCache();
      break;
    case 'refetchSource':
      await refetchSource(args);
      break;
    case 'validateInputs':
      await validateInputs(signal.agent);
      break;
    case 'checkSecrets':
      await checkSecrets(args);
      break;
    case 'schemaMigrateIfNeeded':
      await schemaMigrateIfNeeded();
      break;
    default:
      console.warn(`AUTO-REMEDIATION: Unknown action ${action}`);
  }
}

// Action implementations (simplified for MVP)
async function applyPriorityRules(order: string[]): Promise<void> {
  console.log('AUTO-REMEDIATION: Applying priority rules', order);
  // Implementation: reorder directives by priority
}

async function reassignOverlappingDirectives(args: any): Promise<void> {
  console.log('AUTO-REMEDIATION: Reassigning overlapping directives', args);
  // Implementation: move directives from one agent to another
}

async function throttleAgent(args: any): Promise<void> {
  console.log('AUTO-REMEDIATION: Throttling agent', args);
  // Implementation: limit concurrent tasks for agent
}

async function restartAgent(agent: string, args: any): Promise<void> {
  console.log(`AUTO-REMEDIATION: Restarting agent ${agent}`, args);
  // Implementation: soft restart agent process
}

async function retryLastJob(agent: string, args: any): Promise<void> {
  console.log(`AUTO-REMEDIATION: Retrying last job for ${agent}`, args);
  // Implementation: retry the last failed directive
}

async function reallocateCapacity(args: any): Promise<void> {
  console.log('AUTO-REMEDIATION: Reallocating capacity', args);
  // Implementation: move resources between agents
}

async function splitDirective(args: any, signal: AgentSignal): Promise<void> {
  console.log('AUTO-REMEDIATION: Splitting directive', args);
  // Implementation: break large directive into smaller ones
}

async function refreshCache(): Promise<void> {
  console.log('AUTO-REMEDIATION: Refreshing cache');
  // Implementation: clear and refresh data cache
}

async function refetchSource(args: any): Promise<void> {
  console.log('AUTO-REMEDIATION: Refetching from source', args);
  // Implementation: re-fetch data from external source
}

async function validateInputs(agent: string): Promise<void> {
  console.log(`AUTO-REMEDIATION: Validating inputs for ${agent}`);
  // Implementation: check input data validity
}

async function checkSecrets(args: any): Promise<void> {
  console.log('AUTO-REMEDIATION: Checking secrets', args);
  // Implementation: verify required secrets exist
}

async function schemaMigrateIfNeeded(): Promise<void> {
  console.log('AUTO-REMEDIATION: Checking schema migrations');
  // Implementation: run database migrations if needed
}

// Recovery verification
async function verifyRecovery(params: { agent: string; expected: Record<string, any> }): Promise<boolean> {
  console.log(`AUTO-REMEDIATION: Verifying recovery for ${params.agent}`, params.expected);
  
  // Simplified verification - in production, this would check actual metrics
  return Math.random() > 0.3; // 70% success rate for demo
}

// Decision logging with complete lineage tracking
async function logDecision(params: {
  agent: string;
  classification: Classification;
  playbook: string;
  success: boolean;
  context: Record<string, any>;
  attempt: number;
}): Promise<void> {
  const startTime = Date.now();
  
  // Get before metrics
  const beforeMetrics = await getAgentMetrics(params.agent);
  
  const logEntry = {
    ts: new Date().toISOString(),
    actor: "ChiefOfStaff",
    event: "auto_remediation",
    agent: params.agent,
    classification: params.classification,
    playbook: params.playbook,
    attempt: params.attempt,
    result: params.success ? "success" : "failure",
    context: params.context,
    
    // Lineage tracking: problem → playbook → result → metric delta
    lineage: {
      problem: `${params.classification} detected for ${params.agent}`,
      playbook: params.playbook,
      result: params.success ? "resolved" : "failed",
      metrics_before: beforeMetrics,
      metrics_after: params.success ? await getAgentMetrics(params.agent) : beforeMetrics,
      execution_time_ms: Date.now() - startTime
    },
    
    // KPI tracking
    kpis: {
      mttd: params.context.detection_time_ms || 0,
      mttr: params.success ? Date.now() - startTime : null,
      estimated_cost: calculateRemediationCost(params.playbook, params.attempt),
      auto_resolved: params.success
    }
  };

  console.log('AUTO-REMEDIATION: Complete decision lineage logged', logEntry);
  
  // Update running KPI metrics
  await updateKPIMetrics(logEntry);
  
  // Store in remediation log table (in production)
  remediationLog.push(logEntry);
}

// Escalation
async function escalate(params: { to: string; agent: string; context: Record<string, any>; reason: string }): Promise<void> {
  console.log(`AUTO-REMEDIATION: Escalating ${params.agent} to ${params.to}`, params);
  
  // Create escalation directive for CEO
  await db.insert(agentDirectives).values({
    targetAgent: 'ceo',
    action: `ESCALATION: Manual intervention required for ${params.agent}`,
    goal: `Resolve ${params.reason} for ${params.agent} - auto-remediation exhausted`,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    priority: 'p1',
    status: 'assigned'
  });
}

// State management helpers
function updateAgentState(agent: string, status: AgentStatus): void {
  const current = agentStates.get(agent) || {
    status: 'healthy',
    degradedCount: 0,
    remediationAttempts: 0
  };

  if (status === 'degraded') {
    current.degradedCount++;
  } else if (status === 'healthy') {
    current.degradedCount = 0;
    current.remediationAttempts = 0;
  }

  current.status = status;
  agentStates.set(agent, current);
}

function setAgentStatus(agent: string, status: AgentStatus, activePlaybook?: string): void {
  const current = agentStates.get(agent) || {
    status: 'healthy',
    degradedCount: 0,
    remediationAttempts: 0
  };

  current.status = status;
  current.activePlaybook = activePlaybook;
  agentStates.set(agent, current);
}

function incrementRemediationAttempts(agent: string): void {
  const current = agentStates.get(agent) || {
    status: 'healthy',
    degradedCount: 0,
    remediationAttempts: 0
  };

  current.remediationAttempts++;
  agentStates.set(agent, current);
}

// Main event handler
export async function handleAgentSignal(signal: AgentSignal): Promise<void> {
  console.log(`AUTO-REMEDIATION: Handling signal for ${signal.agent}: ${signal.status}`);

  // Update state tracking
  updateAgentState(signal.agent, signal.status);

  // Trigger auto-remediation for error or degraded states
  if (signal.status === 'error' || signal.status === 'degraded') {
    const remediated = await autoRemediate(signal);
    if (remediated) {
      console.log(`AUTO-REMEDIATION: Successfully auto-remediated ${signal.agent}`);
    }
  }
}

// Export agent state for UI
export function getAgentState(agent: string) {
  return agentStates.get(agent) || {
    status: 'healthy' as AgentStatus,
    degradedCount: 0,
    remediationAttempts: 0
  };
}

export function getAllAgentStates() {
  return Object.fromEntries(agentStates);
}

// KPI tracking and autonomy measurement
const remediationLog: any[] = [];
const kpiMetrics = {
  total_incidents: 0,
  auto_resolved: 0,
  escalated: 0,
  total_cost: 0,
  total_detection_time: 0,
  total_recovery_time: 0,
  conflict_half_life_minutes: 0
};

// Helper functions for enhanced autonomy features
async function getAgentMetrics(agent: string): Promise<{ successRate: number; alignment: number; backlogAge: number }> {
  // In production, this would query real metrics from the database
  return {
    successRate: Math.random() * 0.3 + 0.7, // 70-100%
    alignment: Math.random() * 0.3 + 0.7,   // 70-100%
    backlogAge: Math.random() * 30          // 0-30 minutes
  };
}

function calculateRemediationCost(playbook: string, attempt: number): number {
  const baseCosts: Record<string, number> = {
    'ResolveInterAgentConflict': 25,
    'RestartAndRetryTransient': 10,
    'RebalanceCapacity': 30,
    'RepairDataDependency': 15,
    'FixConfig': 20
  };
  
  const baseCost = baseCosts[playbook] || 25;
  const attemptMultiplier = Math.pow(1.5, attempt - 1); // Escalating cost per attempt
  
  return Math.round(baseCost * attemptMultiplier);
}

async function updateKPIMetrics(logEntry: any): Promise<void> {
  kpiMetrics.total_incidents++;
  
  if (logEntry.result === 'success') {
    kpiMetrics.auto_resolved++;
  } else {
    kpiMetrics.escalated++;
  }
  
  kpiMetrics.total_cost += logEntry.kpis.estimated_cost || 0;
  
  if (logEntry.kpis.mttd) {
    kpiMetrics.total_detection_time += logEntry.kpis.mttd;
  }
  
  if (logEntry.kpis.mttr) {
    kpiMetrics.total_recovery_time += logEntry.kpis.mttr;
  }
  
  // Calculate conflict half-life (exponential decay rate)
  const totalConflicts = kpiMetrics.total_incidents;
  const resolvedConflicts = kpiMetrics.auto_resolved;
  kpiMetrics.conflict_half_life_minutes = totalConflicts > 0 ? 
    (kpiMetrics.total_recovery_time / resolvedConflicts) / (1000 * 60) : 0;
}

// Budget enforcement and cost awareness
function checkBudgetConstraints(agent: string, playbook: string, attempt: number): boolean {
  const estimatedCost = calculateRemediationCost(playbook, attempt);
  const dailySpend = getDailySpendForAgent(agent);
  
  // Check per-directive limit
  if (estimatedCost > CONFIG.BUDGET_CAPS.per_directive) {
    console.log(`AUTO-REMEDIATION: Playbook ${playbook} exceeds per-directive budget (${estimatedCost} > ${CONFIG.BUDGET_CAPS.per_directive})`);
    return false;
  }
  
  // Check daily agent limit
  if (dailySpend + estimatedCost > CONFIG.BUDGET_CAPS.per_agent_daily) {
    console.log(`AUTO-REMEDIATION: Agent ${agent} would exceed daily budget (${dailySpend + estimatedCost} > ${CONFIG.BUDGET_CAPS.per_agent_daily})`);
    return false;
  }
  
  return true;
}

function getDailySpendForAgent(agent: string): number {
  const today = new Date().toDateString();
  return remediationLog
    .filter(log => log.agent === agent && new Date(log.ts).toDateString() === today)
    .reduce((sum, log) => sum + (log.kpis.estimated_cost || 0), 0);
}

// Enhanced SLO monitoring and triggers
function checkSLOViolations(metrics: { successRate: number; alignment: number; backlogAge: number }): boolean {
  return (
    metrics.successRate < CONFIG.AUTOREM_SLO_THRESHOLDS.success_rate ||
    metrics.alignment < CONFIG.AUTOREM_SLO_THRESHOLDS.alignment ||
    metrics.backlogAge > CONFIG.AUTOREM_SLO_THRESHOLDS.backlog_age_minutes
  );
}

// Priority arbitration and preemption rules
function applyPriorityArbitration(conflictingAgents: string[]): string {
  // Sort agents by priority order (Revenue > Marketing > Content)
  const priorityOrder = CONFIG.AUTOREM_PRIORITY;
  
  const sortedAgents = conflictingAgents.sort((a, b) => {
    const aPriority = priorityOrder.findIndex(p => a.toLowerCase().includes(p.toLowerCase()));
    const bPriority = priorityOrder.findIndex(p => b.toLowerCase().includes(p.toLowerCase()));
    
    if (aPriority === -1) return 1;   // Unknown agents get lowest priority
    if (bPriority === -1) return -1;
    
    return aPriority - bPriority;     // Lower index = higher priority
  });
  
  return sortedAgents[0]; // Return highest priority agent
}

// Export KPI metrics and autonomy health
export function getAutonomyKPIs() {
  const autoResolveRate = kpiMetrics.total_incidents > 0 ? 
    kpiMetrics.auto_resolved / kpiMetrics.total_incidents : 0;
  
  const avgMTTD = kpiMetrics.auto_resolved > 0 ? 
    kpiMetrics.total_detection_time / kpiMetrics.auto_resolved / 1000 / 60 : 0; // minutes
  
  const avgMTTR = kpiMetrics.auto_resolved > 0 ? 
    kpiMetrics.total_recovery_time / kpiMetrics.auto_resolved / 1000 / 60 : 0; // minutes
  
  const avgCostPerIncident = kpiMetrics.total_incidents > 0 ? 
    kpiMetrics.total_cost / kpiMetrics.total_incidents : 0;
  
  return {
    // Core KPIs to prove autonomy
    auto_resolve_rate: autoResolveRate,
    target_auto_resolve_rate: CONFIG.KPI_TARGETS.auto_resolve_rate,
    
    mttd_minutes: avgMTTD,
    target_mttd_minutes: CONFIG.KPI_TARGETS.mttd_minutes,
    
    mttr_minutes: avgMTTR,
    target_mttr_minutes: CONFIG.KPI_TARGETS.mttr_minutes,
    
    cost_per_incident: avgCostPerIncident,
    target_cost_per_incident: CONFIG.KPI_TARGETS.cost_per_incident,
    
    conflict_half_life_minutes: kpiMetrics.conflict_half_life_minutes,
    
    // Raw counts
    total_incidents: kpiMetrics.total_incidents,
    auto_resolved: kpiMetrics.auto_resolved,
    escalated: kpiMetrics.escalated,
    total_cost: kpiMetrics.total_cost,
    
    // Health indicators
    is_autonomous: autoResolveRate >= CONFIG.KPI_TARGETS.auto_resolve_rate,
    performance_grade: calculateAutonomyGrade(autoResolveRate, avgMTTR, avgCostPerIncident),
    
    // Trend indicators (simplified)
    trending_up: kpiMetrics.auto_resolved > kpiMetrics.escalated,
    budget_healthy: kpiMetrics.total_cost < CONFIG.BUDGET_CAPS.emergency_reserve
  };
}

function calculateAutonomyGrade(autoResolveRate: number, mttr: number, costPerIncident: number): string {
  let score = 0;
  
  // Auto-resolve rate (40% of grade)
  if (autoResolveRate >= 0.95) score += 40;
  else if (autoResolveRate >= 0.85) score += 35;
  else if (autoResolveRate >= 0.75) score += 25;
  else if (autoResolveRate >= 0.60) score += 15;
  
  // Recovery time (35% of grade)
  if (mttr <= 10) score += 35;
  else if (mttr <= 15) score += 30;
  else if (mttr <= 25) score += 20;
  else if (mttr <= 45) score += 10;
  
  // Cost efficiency (25% of grade)
  if (costPerIncident <= 30) score += 25;
  else if (costPerIncident <= 50) score += 20;
  else if (costPerIncident <= 75) score += 15;
  else if (costPerIncident <= 100) score += 10;
  
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function getRemediationLog() {
  return remediationLog;
}