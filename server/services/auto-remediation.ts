import { db } from "../db";
import { agents, agentDirectives, conflicts } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Configuration with fallbacks
const CONFIG = {
  AUTO_REMEDIATE: process.env.AUTO_REMEDIATE === 'true' || true, // Default enabled for demo
  AUTOREM_MAX_ATTEMPTS: parseInt(process.env.AUTOREM_MAX_ATTEMPTS || '2'),
  AUTOREM_SLO_THRESHOLDS: {
    success_rate: parseFloat(process.env.REMEDIATION_THRESHOLD_PERFORMANCE || '0.9') / 100,
    alignment: parseFloat(process.env.REMEDIATION_THRESHOLD_PERFORMANCE || '0.9') / 100
  },
  AUTOREM_PRIORITY: (process.env.AUTOREM_PRIORITY || 'Revenue,Marketing,Content').split(',')
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

// Decision logging
async function logDecision(params: {
  agent: string;
  classification: Classification;
  playbook: string;
  success: boolean;
  context: Record<string, any>;
  attempt: number;
}): Promise<void> {
  const logEntry = {
    ts: new Date().toISOString(),
    actor: "ChiefOfStaff",
    event: "auto_remediation",
    agent: params.agent,
    classification: params.classification,
    playbook: params.playbook,
    attempt: params.attempt,
    result: params.success ? "success" : "failure",
    context: params.context
  };

  console.log('AUTO-REMEDIATION: Decision logged', logEntry);
  
  // In production, this would append to a persistent log file or database
  // For now, we'll just log to console and could store in database table
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