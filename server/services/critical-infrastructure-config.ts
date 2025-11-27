/**
 * CRITICAL_INFRASTRUCTURE_CONFIG_v1.0
 * 
 * Enforces the critical runtime, state, and connectivity guarantees
 * for all ComplianceWorxs agents.
 * 
 * This module is the foundation for L5 autonomous system operation.
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AgentStatus {
  name: string;
  status: 'active' | 'idle' | 'error';
  lastActivity: Date;
  odarCyclesCompleted: number;
}

interface SecretStatus {
  key: string;
  configured: boolean;
  lastValidated: Date | null;
}

interface ScheduledTask {
  name: string;
  owner: string;
  description: string;
  lastRun: Date | null;
  nextRun: Date | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  consecutiveFailures: number;
}

interface StateFile {
  path: string;
  exists: boolean;
  lastModified: Date | null;
  size: number;
  valid: boolean;
}

interface LogEntry {
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR';
  category: string;
  message: string;
  metadata?: Record<string, any>;
}

interface ErrorClassification {
  type: 'TRANSIENT' | 'PERMANENT';
  retryable: boolean;
  attempts: number;
  maxAttempts: number;
  backoffMs: number;
  escalateTo: string | null;
}

interface InfrastructureStatus {
  module: string;
  version: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL';
  uptime: number;
  lastCheck: Date;
  components: {
    runtimePersistence: boolean;
    secretsManagement: boolean;
    scheduledLoops: boolean;
    persistentState: boolean;
    logging: boolean;
    networking: boolean;
  };
  agents: AgentStatus[];
  secrets: SecretStatus[];
  tasks: ScheduledTask[];
  stateFiles: StateFile[];
  recentLogs: LogEntry[];
  health: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AGENTS = ['CoS', 'Strategist', 'CRO', 'CMO', 'ContentMgr'] as const;

const REQUIRED_SECRETS = [
  'OPENAI_API_KEY',
  'MAILCHIMP_API_KEY'
] as const;

const STATE_FILES = [
  'state/VQS_LOCK.json',
  'state/POSITIONING_MATRIX_v1.5.json',
  'state/OFFER_LADDER_STRUCTURE.json',
  'state/OBJECTION_INTEL_ARCHIVE.json',
  'state/RPM_WEIGHTS_HISTORY.json',
  'state/ARCHITECT_COS_CONTRACT_v1.0.json',
  'state/DECISION_GATEKEEPER_v1.0.json'
] as const;

const SCHEDULED_TASKS: Omit<ScheduledTask, 'lastRun' | 'nextRun' | 'status' | 'consecutiveFailures'>[] = [
  {
    name: 'ODAR_VALIDATION_CYCLE',
    owner: 'CoS',
    description: 'Validate ODAR completion, agent idle time, and drift indicators.'
  },
  {
    name: 'UDL_SYNC_CHECK',
    owner: 'CoS',
    description: 'Ensure Unified Data Layer freshness and integrity.'
  },
  {
    name: 'RPM_RECALC_CHECK',
    owner: 'Strategist',
    description: 'Recompute RPM confidence and log deviations.'
  },
  {
    name: 'DRIFT_MONITOR',
    owner: 'CoS',
    description: 'Detect positioning drift, VQS violations, and Offer Ladder anomalies.'
  },
  {
    name: 'AUTO_SUMMARY_PREP',
    owner: 'CoS',
    description: 'Aggregate metrics for Architect daily Auto-Summary.'
  }
];

const OUTBOUND_TARGETS = [
  'https://api.openai.com',
  'https://generativelanguage.googleapis.com',
  'https://usX.api.mailchimp.com',
  'internal/UDL_ENDPOINTS',
  'future/linked_in_signals'
] as const;

const VALIDATION_INTERVAL_MS = 120 * 60 * 1000; // 2 hours

const RUNTIME_STATE_FILE = 'state/INFRA_RUNTIME_STATE.json';

// Schema definitions for each state file (required fields and constraints)
const STATE_FILE_SCHEMAS: Record<string, { requiredFields: string[]; requiredLocks?: string[] }> = {
  'state/VQS_LOCK.json': {
    requiredFields: ['module', 'version', 'status', 'enforcement'],
    requiredLocks: ['methodology', 'claimedRanges', 'positioning']
  },
  'state/POSITIONING_MATRIX_v1.5.json': {
    requiredFields: ['module', 'version', 'status', 'positioning', 'segments', 'locks'],
    requiredLocks: ['positioning', 'segments', 'valueProp']
  },
  'state/OFFER_LADDER_STRUCTURE.json': {
    requiredFields: ['module', 'version', 'status', 'tiers', 'rules', 'locks'],
    requiredLocks: ['structure', 'sequence', 'pricing']
  },
  'state/OBJECTION_INTEL_ARCHIVE.json': {
    requiredFields: ['module', 'version', 'status', 'objections', 'analytics']
  },
  'state/RPM_WEIGHTS_HISTORY.json': {
    requiredFields: ['module', 'version', 'status', 'currentWeights', 'metrics']
  },
  'state/ARCHITECT_COS_CONTRACT_v1.0.json': {
    requiredFields: ['module', 'version', 'status', 'contract', 'escalationTriggers', 'safetyLocks']
  },
  'state/DECISION_GATEKEEPER_v1.0.json': {
    requiredFields: ['module', 'version', 'status', 'filters', 'safetyLocks']
  }
};

// ============================================================================
// CRITICAL INFRASTRUCTURE CONFIG SERVICE
// ============================================================================

class CriticalInfrastructureConfig {
  private initialized = false;
  private startTime: Date;
  private persistedStartTime: Date | null = null;
  private agents: Map<string, AgentStatus> = new Map();
  private secrets: Map<string, SecretStatus> = new Map();
  private tasks: Map<string, ScheduledTask> = new Map();
  private stateFiles: Map<string, StateFile> = new Map();
  private logs: LogEntry[] = [];
  private validationCycleId: NodeJS.Timeout | null = null;
  private errorRetryState: Map<string, ErrorClassification> = new Map();
  private totalValidationCycles = 0;

  constructor() {
    this.startTime = new Date();
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.log('INFO', 'INIT', 'Critical Infrastructure already initialized');
      return;
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║       CRITICAL_INFRASTRUCTURE_CONFIG_v1.0 INITIALIZING               ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');

    // Load persisted runtime state (agents, tasks, errors)
    await this.loadRuntimeState();

    // Initialize agents (or restore from persisted state)
    this.initializeAgents();

    // Validate secrets
    this.validateSecrets();

    // Initialize scheduled tasks (or restore from persisted state)
    this.initializeScheduledTasks();

    // Validate state files with schema enforcement
    await this.validateStateFiles();

    // Start validation cycles
    this.startValidationCycles();

    this.initialized = true;

    const validStateFiles = Array.from(this.stateFiles.values()).filter(s => s.exists && s.valid).length;
    const configuredSecrets = Array.from(this.secrets.values()).filter(s => s.configured).length;

    console.log('✅ CRITICAL INFRASTRUCTURE CONFIG v1.0 OPERATIONAL');
    console.log(`   Agents: ${this.agents.size} configured`);
    console.log(`   Secrets: ${configuredSecrets}/${REQUIRED_SECRETS.length} configured`);
    console.log(`   State Files: ${validStateFiles}/${STATE_FILES.length} valid (schema-enforced)`);
    console.log(`   Scheduled Tasks: ${this.tasks.size} configured (120-min interval)`);
    console.log(`   Runtime Persistence: ${this.persistedStartTime ? 'RESTORED' : 'NEW SESSION'}`);
    console.log(`   Total Validation Cycles: ${this.totalValidationCycles}`);
    console.log('');

    this.log('INFO', 'INIT', 'Critical Infrastructure Config v1.0 initialized successfully');
    
    // Persist initial state
    await this.persistRuntimeState();
  }

  // --------------------------------------------------------------------------
  // RUNTIME STATE PERSISTENCE
  // --------------------------------------------------------------------------

  private async loadRuntimeState(): Promise<void> {
    try {
      const fullPath = path.resolve(process.cwd(), RUNTIME_STATE_FILE);
      if (!fs.existsSync(fullPath)) {
        console.log('   📝 No persisted runtime state found - starting fresh');
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const state = JSON.parse(content);

      // Restore persisted start time (for continuous uptime tracking)
      if (state.startTime) {
        this.persistedStartTime = new Date(state.startTime);
      }

      // Restore agents
      if (state.agents && Array.isArray(state.agents)) {
        for (const agent of state.agents) {
          this.agents.set(agent.name, {
            name: agent.name,
            status: agent.status || 'active',
            lastActivity: agent.lastActivity ? new Date(agent.lastActivity) : new Date(),
            odarCyclesCompleted: agent.odarCyclesCompleted || 0
          });
        }
      }

      // Restore tasks
      if (state.tasks && Array.isArray(state.tasks)) {
        for (const task of state.tasks) {
          this.tasks.set(task.name, {
            name: task.name,
            owner: task.owner,
            description: task.description,
            lastRun: task.lastRun ? new Date(task.lastRun) : null,
            nextRun: task.nextRun ? new Date(task.nextRun) : null,
            status: task.status || 'pending',
            consecutiveFailures: task.consecutiveFailures || 0
          });
        }
      }

      // Restore error retry state
      if (state.errorRetryState && typeof state.errorRetryState === 'object') {
        for (const [key, value] of Object.entries(state.errorRetryState)) {
          this.errorRetryState.set(key, value as ErrorClassification);
        }
      }

      // Restore validation cycle count
      this.totalValidationCycles = state.totalValidationCycles || 0;

      console.log('   ✅ Runtime state restored from persistence');
      console.log(`      Previous start time: ${this.persistedStartTime?.toISOString()}`);
      console.log(`      Agents restored: ${this.agents.size}`);
      console.log(`      Tasks restored: ${this.tasks.size}`);
      console.log(`      Validation cycles: ${this.totalValidationCycles}`);

      this.log('INFO', 'PERSISTENCE', 'Runtime state restored from file', {
        agents: this.agents.size,
        tasks: this.tasks.size,
        validationCycles: this.totalValidationCycles
      });

    } catch (error) {
      console.log('   ⚠️ Failed to load persisted runtime state - starting fresh');
      this.log('WARN', 'PERSISTENCE', 'Failed to load runtime state', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }
  }

  private async persistRuntimeState(): Promise<void> {
    try {
      const state = {
        module: 'INFRA_RUNTIME_STATE',
        version: '1.0',
        startTime: this.persistedStartTime?.toISOString() || this.startTime.toISOString(),
        lastPersisted: new Date().toISOString(),
        totalValidationCycles: this.totalValidationCycles,
        agents: Array.from(this.agents.values()).map(a => ({
          name: a.name,
          status: a.status,
          lastActivity: a.lastActivity.toISOString(),
          odarCyclesCompleted: a.odarCyclesCompleted
        })),
        tasks: Array.from(this.tasks.values()).map(t => ({
          name: t.name,
          owner: t.owner,
          description: t.description,
          lastRun: t.lastRun?.toISOString() || null,
          nextRun: t.nextRun?.toISOString() || null,
          status: t.status,
          consecutiveFailures: t.consecutiveFailures
        })),
        errorRetryState: Object.fromEntries(this.errorRetryState)
      };

      const fullPath = path.resolve(process.cwd(), RUNTIME_STATE_FILE);
      fs.writeFileSync(fullPath, JSON.stringify(state, null, 2));

    } catch (error) {
      this.log('ERROR', 'PERSISTENCE', 'Failed to persist runtime state', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }
  }

  private initializeAgents(): void {
    // Only initialize agents that weren't restored from persistence
    for (const agent of AGENTS) {
      if (!this.agents.has(agent)) {
        this.agents.set(agent, {
          name: agent,
          status: 'active',
          lastActivity: new Date(),
          odarCyclesCompleted: 0
        });
      }
    }
    console.log(`   ✅ Runtime Persistence: ${AGENTS.length} agents configured (always-on mode)`);
  }

  private validateSecrets(): void {
    for (const key of REQUIRED_SECRETS) {
      const configured = !!process.env[key];
      this.secrets.set(key, {
        key,
        configured,
        lastValidated: configured ? new Date() : null
      });
      if (!configured) {
        this.log('WARN', 'SECRETS', `Secret ${key} not configured`);
      }
    }
    const configuredCount = Array.from(this.secrets.values()).filter(s => s.configured).length;
    console.log(`   ✅ Secrets Management: ${configuredCount}/${REQUIRED_SECRETS.length} secrets configured (env_vars_only)`);
  }

  private initializeScheduledTasks(): void {
    const now = new Date();
    // Only initialize tasks that weren't restored from persistence
    for (const taskDef of SCHEDULED_TASKS) {
      if (!this.tasks.has(taskDef.name)) {
        this.tasks.set(taskDef.name, {
          ...taskDef,
          lastRun: null,
          nextRun: new Date(now.getTime() + VALIDATION_INTERVAL_MS),
          status: 'pending',
          consecutiveFailures: 0
        });
      }
    }
    console.log(`   ✅ Scheduled Loops: ${SCHEDULED_TASKS.length} tasks configured (120-min interval)`);
  }

  private async validateStateFiles(): Promise<void> {
    for (const filePath of STATE_FILES) {
      try {
        const fullPath = path.resolve(process.cwd(), filePath);
        const exists = fs.existsSync(fullPath);
        let stats = null;
        let valid = false;
        let schemaErrors: string[] = [];

        if (exists) {
          stats = fs.statSync(fullPath);
          // Validate JSON structure AND schema
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const data = JSON.parse(content);
            
            // Check if file is empty or minimal
            if (Object.keys(data).length === 0) {
              schemaErrors.push('File contains empty JSON object');
            } else {
              // Schema validation
              const schema = STATE_FILE_SCHEMAS[filePath];
              if (schema) {
                // Check required fields
                for (const field of schema.requiredFields) {
                  if (!(field in data)) {
                    schemaErrors.push(`Missing required field: ${field}`);
                  }
                }
                
                // Check required locks (if applicable)
                if (schema.requiredLocks) {
                  const locksField = data.locks || data.enforcement;
                  if (!locksField) {
                    schemaErrors.push('Missing locks/enforcement object');
                  } else {
                    for (const lock of schema.requiredLocks) {
                      if (!(lock in locksField)) {
                        schemaErrors.push(`Missing required lock: ${lock}`);
                      }
                    }
                  }
                }
              }
            }
            
            valid = schemaErrors.length === 0;
            
          } catch (parseError) {
            valid = false;
            schemaErrors.push('Invalid JSON syntax');
          }
        }

        this.stateFiles.set(filePath, {
          path: filePath,
          exists,
          lastModified: stats ? stats.mtime : null,
          size: stats ? stats.size : 0,
          valid
        });

        if (!exists) {
          this.log('ERROR', 'STATE', `State file missing: ${filePath}`);
          this.classifyAndHandleError(`state_${filePath}`, new Error('File missing'));
        } else if (!valid) {
          this.log('ERROR', 'STATE', `State file schema validation failed: ${filePath}`, {
            errors: schemaErrors
          });
          this.classifyAndHandleError(`state_${filePath}`, new Error(schemaErrors.join('; ')));
        }
      } catch (error) {
        this.stateFiles.set(filePath, {
          path: filePath,
          exists: false,
          lastModified: null,
          size: 0,
          valid: false
        });
        this.log('ERROR', 'STATE', `Error validating state file: ${filePath}`);
        this.classifyAndHandleError(`state_${filePath}`, error);
      }
    }
    const presentCount = Array.from(this.stateFiles.values()).filter(s => s.exists && s.valid).length;
    console.log(`   ✅ Persistent State: ${presentCount}/${STATE_FILES.length} state files valid (schema-enforced)`);
  }

  // --------------------------------------------------------------------------
  // SCHEDULED VALIDATION CYCLES
  // --------------------------------------------------------------------------

  private startValidationCycles(): void {
    console.log(`   ✅ Logging: Structured logging enabled (INFO+ERROR)`);
    console.log(`   ✅ Networking: ${OUTBOUND_TARGETS.length} outbound targets configured`);

    // Run initial validation cycle
    setTimeout(() => this.runValidationCycle(), 5000);

    // Schedule recurring cycles every 2 hours
    this.validationCycleId = setInterval(() => {
      this.runValidationCycle();
    }, VALIDATION_INTERVAL_MS);
  }

  async runValidationCycle(): Promise<{
    cycleId: string;
    timestamp: Date;
    tasksRun: number;
    tasksPassed: number;
    tasksFailed: number;
    issues: string[];
  }> {
    const cycleId = `VALIDATION-${Date.now()}`;
    const timestamp = new Date();
    const issues: string[] = [];
    let tasksPassed = 0;
    let tasksFailed = 0;

    console.log(`[INFRA] 🔄 Starting validation cycle: ${cycleId}`);

    // Run each scheduled task
    for (const [taskName, task] of Array.from(this.tasks.entries())) {
      try {
        task.status = 'running';
        
        switch (taskName) {
          case 'ODAR_VALIDATION_CYCLE':
            await this.runOdarValidation();
            break;
          case 'UDL_SYNC_CHECK':
            await this.runUdlSyncCheck();
            break;
          case 'RPM_RECALC_CHECK':
            await this.runRpmRecalcCheck();
            break;
          case 'DRIFT_MONITOR':
            await this.runDriftMonitor();
            break;
          case 'AUTO_SUMMARY_PREP':
            await this.runAutoSummaryPrep();
            break;
        }

        task.status = 'completed';
        task.lastRun = new Date();
        task.nextRun = new Date(Date.now() + VALIDATION_INTERVAL_MS);
        task.consecutiveFailures = 0;
        tasksPassed++;

        console.log(`[INFRA]    ✅ ${taskName}: PASSED`);

      } catch (error) {
        task.status = 'failed';
        task.consecutiveFailures++;
        tasksFailed++;
        issues.push(`${taskName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

        console.log(`[INFRA]    ❌ ${taskName}: FAILED (${task.consecutiveFailures} consecutive)`);

        this.log('ERROR', 'VALIDATION', `Task ${taskName} failed`, {
          error: error instanceof Error ? error.message : 'Unknown',
          consecutiveFailures: task.consecutiveFailures
        });

        // Handle transient vs permanent errors
        if (task.consecutiveFailures >= 3) {
          this.classifyAndHandleError(taskName, error);
        }
      }
    }

    // Validate state files
    await this.validateStateFiles();

    // Validate secrets
    this.validateSecrets();

    // Increment cycle count and persist state
    this.totalValidationCycles++;
    await this.persistRuntimeState();

    console.log(`[INFRA] ✅ Validation cycle ${this.totalValidationCycles} complete: ${tasksPassed}/${tasksPassed + tasksFailed} tasks passed`);

    return {
      cycleId,
      timestamp,
      tasksRun: tasksPassed + tasksFailed,
      tasksPassed,
      tasksFailed,
      issues
    };
  }

  // --------------------------------------------------------------------------
  // VALIDATION TASK IMPLEMENTATIONS
  // --------------------------------------------------------------------------

  private async runOdarValidation(): Promise<void> {
    // Check agent activity and ODAR completion
    const now = new Date();
    for (const [name, agent] of Array.from(this.agents.entries())) {
      const idleTime = now.getTime() - agent.lastActivity.getTime();
      const idleMinutes = Math.floor(idleTime / 60000);
      
      if (idleMinutes > 120 && name !== 'Strategist') {
        this.log('WARN', 'ODAR', `Agent ${name} idle for ${idleMinutes} minutes`);
      }
    }
  }

  private async runUdlSyncCheck(): Promise<void> {
    // Check UDL freshness
    const rpmWeightsFile = this.stateFiles.get('state/RPM_WEIGHTS_HISTORY.json');
    if (rpmWeightsFile?.exists && rpmWeightsFile.lastModified) {
      const freshnessMinutes = Math.floor((Date.now() - rpmWeightsFile.lastModified.getTime()) / 60000);
      if (freshnessMinutes > 30) {
        this.log('WARN', 'UDL', `UDL freshness degraded: ${freshnessMinutes} minutes since last update`);
      }
    }
  }

  private async runRpmRecalcCheck(): Promise<void> {
    // Check RPM confidence
    try {
      const rpmFilePath = path.resolve(process.cwd(), 'state/RPM_WEIGHTS_HISTORY.json');
      if (fs.existsSync(rpmFilePath)) {
        const content = fs.readFileSync(rpmFilePath, 'utf-8');
        const data = JSON.parse(content);
        const currentRpm = data.metrics?.currentRPM || 0;
        const targetRpm = data.metrics?.targetRPM || 0.90;
        
        if (currentRpm < targetRpm - 0.05) {
          this.log('WARN', 'RPM', `RPM confidence drop >5%: current ${(currentRpm * 100).toFixed(1)}% vs target ${(targetRpm * 100).toFixed(1)}%`);
        }
      }
    } catch (error) {
      this.log('ERROR', 'RPM', 'Failed to read RPM weights history');
    }
  }

  private async runDriftMonitor(): Promise<void> {
    // Check for positioning, VQS, and Offer Ladder violations
    const vqsFile = this.stateFiles.get('state/VQS_LOCK.json');
    const offerLadderFile = this.stateFiles.get('state/OFFER_LADDER_STRUCTURE.json');
    const positioningFile = this.stateFiles.get('state/POSITIONING_MATRIX_v1.5.json');

    if (!vqsFile?.valid) {
      this.log('ERROR', 'DRIFT', 'VQS_LOCK file invalid or missing');
    }
    if (!offerLadderFile?.valid) {
      this.log('ERROR', 'DRIFT', 'OFFER_LADDER_STRUCTURE file invalid or missing');
    }
    if (!positioningFile?.valid) {
      this.log('ERROR', 'DRIFT', 'POSITIONING_MATRIX file invalid or missing');
    }
  }

  private async runAutoSummaryPrep(): Promise<void> {
    // Aggregate metrics for Architect daily Auto-Summary
    const status = this.getStatus();
    this.log('INFO', 'AUTO_SUMMARY', 'Metrics aggregated for Architect daily summary', {
      healthScore: status.health.score,
      issues: status.health.issues.length,
      uptime: status.uptime
    });
  }

  // --------------------------------------------------------------------------
  // ERROR HANDLING
  // --------------------------------------------------------------------------

  private classifyAndHandleError(taskName: string, error: unknown): void {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    // Classify error
    const isTransient = 
      errorMsg.includes('timeout') ||
      errorMsg.includes('ECONNRESET') ||
      errorMsg.includes('429') ||
      errorMsg.includes('503') ||
      errorMsg.includes('network');

    const classification: ErrorClassification = {
      type: isTransient ? 'TRANSIENT' : 'PERMANENT',
      retryable: isTransient,
      attempts: this.errorRetryState.get(taskName)?.attempts || 0,
      maxAttempts: 2,
      backoffMs: 1500,
      escalateTo: isTransient ? null : 'CoS'
    };

    this.errorRetryState.set(taskName, classification);

    if (classification.type === 'TRANSIENT' && classification.attempts < classification.maxAttempts) {
      // Schedule retry with backoff
      classification.attempts++;
      this.log('INFO', 'ERROR_HANDLING', `Scheduling retry for ${taskName} (attempt ${classification.attempts}/${classification.maxAttempts})`, {
        backoffMs: classification.backoffMs * classification.attempts
      });
    } else if (classification.type === 'PERMANENT' || classification.attempts >= classification.maxAttempts) {
      // Escalate to CoS
      this.log('ERROR', 'ERROR_HANDLING', `Escalating ${taskName} to CoS for manual review`, {
        errorType: classification.type,
        attempts: classification.attempts
      });
    }
  }

  // --------------------------------------------------------------------------
  // AGENT MANAGEMENT
  // --------------------------------------------------------------------------

  updateAgentActivity(agentName: string): void {
    const agent = this.agents.get(agentName);
    if (agent) {
      agent.lastActivity = new Date();
      agent.status = 'active';
    }
  }

  incrementOdarCycle(agentName: string): void {
    const agent = this.agents.get(agentName);
    if (agent) {
      agent.odarCyclesCompleted++;
      agent.lastActivity = new Date();
    }
  }

  // --------------------------------------------------------------------------
  // STATE FILE OPERATIONS
  // --------------------------------------------------------------------------

  async readStateFile(filePath: string): Promise<Record<string, any> | null> {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        this.log('ERROR', 'STATE', `State file not found: ${filePath}`);
        return null;
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.log('ERROR', 'STATE', `Failed to read state file: ${filePath}`, {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      return null;
    }
  }

  async writeStateFile(filePath: string, data: Record<string, any>): Promise<boolean> {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      
      // Validate it's an allowed state file
      if (!STATE_FILES.includes(filePath as any)) {
        this.log('ERROR', 'STATE', `Attempted write to unauthorized state file: ${filePath}`);
        return false;
      }

      // Add metadata
      data.lastUpdated = new Date().toISOString();
      
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
      
      // Update tracking
      const stateFile = this.stateFiles.get(filePath);
      if (stateFile) {
        stateFile.lastModified = new Date();
        stateFile.valid = true;
      }

      this.log('INFO', 'STATE', `State file updated: ${filePath}`);
      return true;
    } catch (error) {
      this.log('ERROR', 'STATE', `Failed to write state file: ${filePath}`, {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // LOGGING
  // --------------------------------------------------------------------------

  log(level: 'INFO' | 'WARN' | 'ERROR', category: string, message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      metadata
    };

    this.logs.push(entry);

    // Keep only last 1000 log entries
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Write to file
    const logLine = `[${entry.timestamp.toISOString()}] [${level}] [${category}] ${message}${metadata ? ' ' + JSON.stringify(metadata) : ''}`;
    
    try {
      const logPath = path.resolve(process.cwd(), 'logs/system.log');
      fs.appendFileSync(logPath, logLine + '\n');
    } catch {
      // Console fallback
      console.log(logLine);
    }

    // Console output for errors
    if (level === 'ERROR') {
      console.error(`[INFRA] ❌ ${category}: ${message}`);
    }
  }

  // --------------------------------------------------------------------------
  // STATUS & HEALTH
  // --------------------------------------------------------------------------

  getStatus(): InfrastructureStatus {
    const now = new Date();
    // Use persisted start time for continuous uptime tracking across restarts
    const effectiveStartTime = this.persistedStartTime || this.startTime;
    const uptime = Math.floor((now.getTime() - effectiveStartTime.getTime()) / 1000);
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check components
    const components = {
      runtimePersistence: Array.from(this.agents.values()).every(a => a.status === 'active'),
      secretsManagement: Array.from(this.secrets.values()).every(s => s.configured),
      scheduledLoops: Array.from(this.tasks.values()).every(t => t.consecutiveFailures < 3),
      persistentState: Array.from(this.stateFiles.values()).every(s => s.exists && s.valid),
      logging: true,
      networking: true
    };

    // Calculate health score
    let healthScore = 100;
    
    if (!components.runtimePersistence) {
      healthScore -= 20;
      issues.push('One or more agents not active');
      recommendations.push('Check agent initialization and ODAR cycles');
    }
    
    if (!components.secretsManagement) {
      healthScore -= 15;
      issues.push('Missing required secrets');
      recommendations.push('Configure missing secrets in environment variables');
    }
    
    if (!components.scheduledLoops) {
      healthScore -= 25;
      issues.push('Scheduled task failures detected');
      recommendations.push('Review failed tasks and address root causes');
    }
    
    if (!components.persistentState) {
      healthScore -= 30;
      issues.push('State file integrity issues');
      recommendations.push('Verify state files exist and contain valid JSON');
    }

    return {
      module: 'CRITICAL_INFRASTRUCTURE_CONFIG',
      version: '1.0',
      status: healthScore >= 80 ? 'OPERATIONAL' : healthScore >= 50 ? 'DEGRADED' : 'CRITICAL',
      uptime,
      lastCheck: now,
      components,
      agents: Array.from(this.agents.values()),
      secrets: Array.from(this.secrets.values()),
      tasks: Array.from(this.tasks.values()),
      stateFiles: Array.from(this.stateFiles.values()),
      recentLogs: this.logs.slice(-50),
      health: {
        score: healthScore,
        issues,
        recommendations
      }
    };
  }

  // --------------------------------------------------------------------------
  // CLEANUP
  // --------------------------------------------------------------------------

  shutdown(): void {
    if (this.validationCycleId) {
      clearInterval(this.validationCycleId);
      this.validationCycleId = null;
    }
    this.log('INFO', 'SHUTDOWN', 'Critical Infrastructure Config shutting down');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const criticalInfrastructureConfig = new CriticalInfrastructureConfig();

export default criticalInfrastructureConfig;
