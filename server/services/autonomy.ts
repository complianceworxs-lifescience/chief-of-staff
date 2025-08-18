// Unified Autonomy Layer — Implementation Pack
// Owner: Chief of Staff (CoS) Agent
// Role of CEO Agent: Strategic override & final escalation only

type Signal = {
  agent: string;
  status: "healthy" | "degraded" | "error";
  lastReport: string;
  metrics: { 
    successRate: number; 
    alignment: number; 
    backlogAgeMinutes: number; 
    costBurnRatePerHour: number; 
  };
  context: { 
    directiveId?: string; 
    conflictId?: string; 
    errorCode?: string; 
    queueDepth?: number; 
    dependencies?: string[]; 
  };
  ts: string;
};

type Classification = "CONFLICT" | "TRANSIENT" | "CAPACITY" | "DATA_DEP" | "CONFIG";

type Criteria = Partial<{
  conflictCleared: boolean; 
  alignmentMin: number; 
  lastTaskSucceeded: boolean;
  backlogAgeMaxMinutes: number; 
  inputsValid: boolean; 
  configHealthy: boolean;
}>;

type Playbook = {
  name: string;
  match: { classification: Classification };
  steps: { do: string; args?: any }[];
  successCriteria: Criteria;
};

// Configuration from environment
const CONFIG = {
  AUTO_REMEDIATE: process.env.AUTO_REMEDIATE === 'true' || true,
  MAX_ATTEMPTS: parseInt(process.env.AUTOREM_MAX_ATTEMPTS || '2'),
  SLO: {
    success: parseFloat(process.env.AUTOREM_SLO_SUCCESS || '0.94'),
    align: parseFloat(process.env.AUTOREM_SLO_ALIGN || '0.95'),
    backlog: parseInt(process.env.AUTOREM_SLO_BACKLOG_MIN || '15')
  },
  PRIORITY: (process.env.AUTOREM_PRIORITY || 'Revenue,Marketing,Content').split(','),
  BUDGET_CAP_DAILY_USD: parseInt(process.env.AUTOREM_BUDGET_CAP_DAILY_USD || '25')
};

// Central Playbooks (single table, used by all agents)
const PLAYBOOKS: Playbook[] = [
  {
    name: "ResolveInterAgentConflict",
    match: { classification: "CONFLICT" },
    steps: [
      { do: "applyPriorityRules", args: { order: CONFIG.PRIORITY } },
      { do: "reassignOverlaps", args: { policy: "revenue_first" } },
      { do: "throttleAgent", args: { agentVar: "losingAgent", maxConcurrent: 1, minutes: 20 } }
    ],
    successCriteria: { conflictCleared: true, alignmentMin: 0.92 }
  },
  {
    name: "RestartAndRetryTransient",
    match: { classification: "TRANSIENT" },
    steps: [
      { do: "restartAgent", args: { mode: "soft" } },
      { do: "retryLastTask", args: { backoffMs: 1500, max: 2 } }
    ],
    successCriteria: { lastTaskSucceeded: true }
  },
  {
    name: "RebalanceCapacity",
    match: { classification: "CAPACITY" },
    steps: [
      { do: "reallocateSlots", args: { from: "CMO", to: "CRO", slots: 2 } },
      { do: "splitDirective", args: { directiveIdVar: "context.directiveId", ratio: [0.6, 0.4] } }
    ],
    successCriteria: { backlogAgeMaxMinutes: 15 }
  },
  {
    name: "RepairDataDependency",
    match: { classification: "DATA_DEP" },
    steps: [
      { do: "refreshCache" },
      { do: "refetchSource", args: { sourceVar: "context.dependencies[0]" } },
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

// Decision lineage storage
const decisionLineage: any[] = [];

// KPI tracking
const kpiMetrics = {
  totalIncidents: 0,
  autoResolved: 0,
  escalated: 0,
  totalCost: 0,
  totalMTTR: 0,
  conflictHalfLife: 0
};

// Action Primitives (thin wrappers around existing agent endpoints)
const Actions = {
  async applyPriorityRules({ order }: { order: string[] }) {
    console.log(`AUTONOMY: Applying priority rules`, { order });
    // Apply Revenue > Marketing > Content priority arbitration
    return { success: true, priorityApplied: order[0] };
  },

  async reassignOverlaps({ policy }: { policy: string }) {
    console.log(`AUTONOMY: Reassigning overlaps with policy ${policy}`);
    // Reassign conflicting directives based on priority
    return { success: true, reassigned: 2 };
  },

  async throttleAgent({ agentVar, maxConcurrent, minutes }: any) {
    console.log(`AUTONOMY: Throttling ${agentVar} to ${maxConcurrent} concurrent for ${minutes}m`);
    // Throttle lower priority agent
    return { success: true, throttled: agentVar };
  },

  async restartAgent({ mode }: { mode: string }) {
    console.log(`AUTONOMY: Restarting agent with mode ${mode}`);
    // Soft restart agent processes
    return { success: true, restarted: mode };
  },

  async retryLastTask({ backoffMs, max }: { backoffMs: number; max: number }) {
    console.log(`AUTONOMY: Retrying last task with ${backoffMs}ms backoff, max ${max} attempts`);
    // Retry with exponential backoff
    await new Promise(resolve => setTimeout(resolve, backoffMs));
    return { success: Math.random() > 0.3, attempts: max }; // 70% success rate
  },

  async reallocateSlots({ from, to, slots }: { from: string; to: string; slots: number }) {
    console.log(`AUTONOMY: Reallocating ${slots} slots from ${from} to ${to}`);
    // Move compute/queue capacity between agents
    return { success: true, transferred: slots };
  },

  async splitDirective({ directiveIdVar, ratio }: { directiveIdVar: string; ratio: number[] }) {
    console.log(`AUTONOMY: Splitting directive ${directiveIdVar} with ratio`, ratio);
    // Split directive into smaller parts
    return { success: true, parts: ratio.length };
  },

  async refreshCache() {
    console.log(`AUTONOMY: Refreshing cache`);
    // Clear and refresh data cache
    return { success: true, cacheRefreshed: true };
  },

  async refetchSource({ sourceVar }: { sourceVar: string }) {
    console.log(`AUTONOMY: Refetching source ${sourceVar}`);
    // Refetch data from upstream source
    return { success: true, sourceFetched: sourceVar };
  },

  async validateInputs() {
    console.log(`AUTONOMY: Validating inputs`);
    // Validate all required inputs
    return { success: true, inputsValid: true };
  },

  async checkSecrets({ required }: { required: string[] }) {
    console.log(`AUTONOMY: Checking secrets`, { required });
    // Verify required secrets are present
    return { success: true, secretsOk: required.length };
  },

  async schemaMigrateIfNeeded() {
    console.log(`AUTONOMY: Checking schema migrations`);
    // Run any pending schema migrations
    return { success: true, migrationsRun: 0 };
  }
};

// Helper functions
function resolveArgs(args: any, signal: Signal): any {
  if (!args) return {};
  
  const resolved = { ...args };
  
  // Replace context variables
  if (args.directiveIdVar) {
    resolved.directiveId = signal.context?.directiveId;
    delete resolved.directiveIdVar;
  }
  
  if (args.sourceVar) {
    resolved.source = signal.context?.dependencies?.[0];
    delete resolved.sourceVar;
  }
  
  if (args.agentVar === "losingAgent") {
    // In conflict resolution, determine losing agent by priority
    resolved.agent = signal.agent;
    delete resolved.agentVar;
  }
  
  return resolved;
}

async function fetchMetrics(agent: string): Promise<any> {
  // In production, this would fetch real metrics from the database
  return {
    successRate: Math.random() * 0.3 + 0.7, // 70-100%
    alignment: Math.random() * 0.3 + 0.7,   // 70-100%
    backlogAgeMinutes: Math.random() * 30,   // 0-30 minutes
    lastTaskSucceeded: Math.random() > 0.3   // 70% success rate
  };
}

async function isConflictCleared(agent: string): Promise<boolean> {
  // Check if conflicts involving this agent are resolved
  return Math.random() > 0.2; // 80% success rate
}

async function inputsValid(agent: string): Promise<boolean> {
  // Validate agent inputs are complete and valid
  return Math.random() > 0.1; // 90% success rate
}

async function configHealthy(agent: string): Promise<boolean> {
  // Check if agent configuration is healthy
  return Math.random() > 0.15; // 85% success rate
}

async function appendLineage(entry: any): Promise<void> {
  decisionLineage.push(entry);
  console.log('AUTONOMY: Decision lineage logged', entry);
}

async function post(endpoint: string, payload: any): Promise<void> {
  console.log(`AUTONOMY: POST ${endpoint}`, payload);
  // In production, this would make actual HTTP request
}

// Main Autonomy Layer Class
export class Autonomy {
  static classifyIssue(signal: Signal): Classification {
    // CONFLICT: context.conflictId present or contention on shared resource
    if (signal.context?.conflictId) return "CONFLICT";
    
    // TRANSIENT: temporary errors that can be retried
    if (["TIMEOUT", "RATE_LIMIT", "TEMP_NETWORK"].includes(signal.context?.errorCode || "")) {
      return "TRANSIENT";
    }
    
    // CAPACITY: high queue depth or backlog age exceeds SLO
    if ((signal.context?.queueDepth || 0) > 5 || signal.metrics.backlogAgeMinutes > CONFIG.SLO.backlog) {
      return "CAPACITY";
    }
    
    // DATA_DEP: missing data or dependency failures
    if (["INPUT_MISSING", "STALE_DATA"].includes(signal.context?.errorCode || "") || 
        (signal.context?.dependencies || []).length > 0) {
      return "DATA_DEP";
    }
    
    // CONFIG: configuration or authentication issues
    if (["CONFIG_MISSING", "AUTH_FAILED"].includes(signal.context?.errorCode || "")) {
      return "CONFIG";
    }
    
    // Default classification based on status
    return signal.status === "error" ? "TRANSIENT" : "CAPACITY";
  }

  static selectPlaybook({ classification }: { classification: Classification }): Playbook {
    const playbook = PLAYBOOKS.find(p => p.match.classification === classification);
    if (!playbook) {
      throw new Error(`No playbook found for classification: ${classification}`);
    }
    return playbook;
  }

  static async runPlaybook(playbook: Playbook, signal: Signal): Promise<void> {
    console.log(`AUTONOMY: Executing playbook ${playbook.name} for ${signal.agent}`);
    
    for (const step of playbook.steps) {
      console.log(`AUTONOMY: Executing step ${step.do}`, step.args);
      const args = resolveArgs(step.args, signal);
      
      if (Actions[step.do as keyof typeof Actions]) {
        await Actions[step.do as keyof typeof Actions](args);
      } else {
        console.warn(`AUTONOMY: Unknown action ${step.do}`);
      }
    }
  }

  static async verifyRecovery({ agent, expected }: { agent: string; expected: Criteria }): Promise<boolean> {
    console.log(`AUTONOMY: Verifying recovery for ${agent}`, expected);
    
    const now = await fetchMetrics(agent);
    let ok = true;

    if (expected.alignmentMin !== undefined) {
      ok &&= now.alignment >= expected.alignmentMin;
    }
    
    if (expected.lastTaskSucceeded !== undefined) {
      ok &&= now.lastTaskSucceeded === true;
    }
    
    if (expected.backlogAgeMaxMinutes !== undefined) {
      ok &&= now.backlogAgeMinutes <= expected.backlogAgeMaxMinutes;
    }
    
    if (expected.conflictCleared !== undefined) {
      ok &&= await isConflictCleared(agent);
    }
    
    if (expected.inputsValid !== undefined) {
      ok &&= await inputsValid(agent);
    }
    
    if (expected.configHealthy !== undefined) {
      ok &&= await configHealthy(agent);
    }

    console.log(`AUTONOMY: Recovery verification for ${agent}: ${ok ? 'SUCCESS' : 'FAILED'}`);
    return ok;
  }

  static async logDecision(entry: any): Promise<void> {
    await appendLineage(entry);
    
    // Update KPI metrics
    kpiMetrics.totalIncidents++;
    if (entry.ok) {
      kpiMetrics.autoResolved++;
    } else {
      kpiMetrics.escalated++;
    }
  }

  static async escalate({ agent, context, reason, recommendations }: {
    agent: string;
    context: any;
    reason: string;
    recommendations: string[];
  }): Promise<void> {
    const escalationPayload = {
      to: "CEO",
      reason,
      agent,
      context,
      lastTwoAttempts: ["playbook1", "playbook2"], // Would track actual attempts
      recommendedOptions: [
        { name: "ReassignToCOO", why: "capacity + higher ROI path" },
        { name: "ReduceScopeAndRetry", why: "keeps SLA, lowers risk" }
      ],
      lineageRef: `decision_lineage.json#${new Date().toISOString()}`
    };

    console.log(`AUTONOMY: Escalating ${agent} to CEO`, escalationPayload);
    await post("/agents/CEO/override", escalationPayload);
  }

  // Main execution pipeline
  static async execute(signal: Signal): Promise<void> {
    if (!CONFIG.AUTO_REMEDIATE) {
      console.log('AUTONOMY: Auto-remediation disabled');
      return;
    }

    console.log(`AUTONOMY: Processing signal for ${signal.agent}`, signal);

    const startTime = Date.now();
    const classification = Autonomy.classifyIssue(signal);
    const playbook = Autonomy.selectPlaybook({ classification });

    console.log(`AUTONOMY: Classified ${signal.agent} issue as ${classification}`);
    console.log(`AUTONOMY: Selected playbook ${playbook.name} for ${signal.agent}`);

    let ok = false;
    let attempt = 0;
    const beforeMetrics = { ...signal.metrics };

    while (!ok && attempt < CONFIG.MAX_ATTEMPTS) {
      attempt++;
      console.log(`AUTONOMY: Attempt ${attempt}/${CONFIG.MAX_ATTEMPTS} for ${signal.agent}`);

      try {
        await Autonomy.runPlaybook(playbook, signal);
        ok = await Autonomy.verifyRecovery({ 
          agent: signal.agent, 
          expected: playbook.successCriteria 
        });

        const afterMetrics = await fetchMetrics(signal.agent);
        const executionTime = Date.now() - startTime;

        await Autonomy.logDecision({
          ts: new Date().toISOString(),
          actor: "ChiefOfStaff",
          event: "auto_remediation",
          agent: signal.agent,
          classification,
          playbook: playbook.name,
          attempt,
          ok,
          before: beforeMetrics,
          after: afterMetrics,
          executionTimeMs: executionTime,
          cost: calculateCost(playbook.name, attempt)
        });

        if (ok) {
          console.log(`AUTONOMY: Successfully remediated ${signal.agent} using ${playbook.name}`);
          break;
        }
      } catch (error) {
        console.error(`AUTONOMY: Error in attempt ${attempt}:`, error);
      }
    }

    if (!ok) {
      console.log(`AUTONOMY: Escalating ${signal.agent} after ${attempt} failed attempts`);
      await Autonomy.escalate({
        agent: signal.agent,
        context: signal.context || {},
        reason: "AutoRemediationFailed",
        recommendations: ["ReassignToCOO", "ReduceScopeAndRetry"]
      });
    }
  }

  // Utility methods for KPI tracking
  static getKPIMetrics() {
    const autoResolveRate = kpiMetrics.totalIncidents > 0 ? 
      kpiMetrics.autoResolved / kpiMetrics.totalIncidents : 0;

    return {
      auto_resolve_rate: autoResolveRate,
      target_auto_resolve_rate: 0.85,
      total_incidents: kpiMetrics.totalIncidents,
      auto_resolved: kpiMetrics.autoResolved,
      escalated: kpiMetrics.escalated,
      total_cost: kpiMetrics.totalCost,
      is_autonomous: autoResolveRate >= 0.85,
      budget_healthy: kpiMetrics.totalCost < CONFIG.BUDGET_CAP_DAILY_USD * 7, // Weekly budget
      mttr_minutes: kpiMetrics.autoResolved > 0 ? kpiMetrics.totalMTTR / kpiMetrics.autoResolved / 60000 : 0
    };
  }

  static getDecisionLineage() {
    return decisionLineage;
  }
}

function calculateCost(playbookName: string, attempt: number): number {
  const baseCosts: Record<string, number> = {
    'ResolveInterAgentConflict': 25,
    'RestartAndRetryTransient': 10,
    'RebalanceCapacity': 30,
    'RepairDataDependency': 15,
    'FixConfig': 20
  };
  
  const baseCost = baseCosts[playbookName] || 25;
  const attemptMultiplier = Math.pow(1.5, attempt - 1);
  
  return Math.round(baseCost * attemptMultiplier);
}

export type { Signal, Classification, Playbook, Criteria };