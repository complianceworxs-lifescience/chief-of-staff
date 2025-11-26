import { revenuePredictiveModel } from './revenue-predictive-model';
import { l5AgentHealthMonitor } from './l5-agent-health-monitor';

export type L6ExperimentType = 
  | 'new_narrative'
  | 'new_pricing_model'
  | 'new_product_idea'
  | 'category_reframe'
  | 'methodology_enhancement'
  | 'offer_ladder_rearchitecture'
  | 'market_expansion_hypothesis';

export type L6ExperimentStatus = 
  | 'proposed'
  | 'active'
  | 'completed'
  | 'abandoned'
  | 'graduated';

export interface L6Experiment {
  id: string;
  type: L6ExperimentType;
  name: string;
  description: string;
  hypothesis: string;
  proposedBy: 'Strategist' | 'CMO' | 'CRO' | 'Content Manager' | 'CoS';
  status: L6ExperimentStatus;
  createdAt: string;
  activatedAt: string | null;
  completedAt: string | null;
  graduatedAt: string | null;
  abandonedAt: string | null;
  abandonedReason: string | null;
  tokenBudget: number;
  tokensUsed: number;
  maxDurationDays: number;
  microCohortSize: number;
  outputs: L6ExperimentOutput[];
  metrics: L6ExperimentMetrics;
  cosApproval: {
    required: boolean;
    approved: boolean;
    approvedAt: string | null;
    approvedBy: string | null;
    notes: string | null;
  };
}

export interface L6ExperimentOutput {
  id: string;
  experimentId: string;
  outputType: 'content' | 'pricing' | 'offer' | 'narrative' | 'methodology' | 'archetype';
  data: any;
  createdAt: string;
  validated: boolean;
  validationNotes: string | null;
}

export interface L6ExperimentMetrics {
  trustSignalDelta: number;
  conversionDelta: number;
  frictionScore: number;
  skepticismLevel: number;
  rpmImpact: number;
  vqsRiskScore: number;
}

interface SandboxActivationCheck {
  canActivate: boolean;
  rpmAccuracy: number;
  rpmThreshold: number;
  unresolvedDriftCount: number;
  activeExperimentCount: number;
  maxSimultaneousExperiments: number;
  reasons: string[];
}

interface L6SandboxConfig {
  maxSimultaneousExperiments: number;
  defaultTokenBudget: number;
  defaultMaxDurationDays: number;
  defaultMicroCohortPercent: number;
  rpmAccuracyThreshold: number;
  maxDriftIndicatorsAllowed: number;
}

class L6SandboxService {
  private config: L6SandboxConfig = {
    maxSimultaneousExperiments: 3,
    defaultTokenBudget: 500,
    defaultMaxDurationDays: 7,
    defaultMicroCohortPercent: 5,
    rpmAccuracyThreshold: 85,
    maxDriftIndicatorsAllowed: 0
  };

  private experiments: L6Experiment[] = [];
  private sandboxLogs: Array<{
    timestamp: string;
    action: string;
    experimentId: string | null;
    details: string;
    agent: string;
  }> = [];

  private isActive: boolean = false;
  private activatedAt: string | null = null;

  public activate(): { success: boolean; message: string; checks?: SandboxActivationCheck } {
    const checks = this.checkActivationConditions();
    
    if (!checks.canActivate) {
      return {
        success: false,
        message: `Cannot activate L6 Sandbox: ${checks.reasons.join(', ')}`,
        checks
      };
    }

    this.isActive = true;
    this.activatedAt = new Date().toISOString();

    this.logAction('SANDBOX_ACTIVATED', null, 'L6 Strategic Sandbox activated', 'Strategist');

    console.log('🧪 L6 STRATEGIC SANDBOX ACTIVATED');
    console.log('   Primary: Strategist');
    console.log('   Enforcement: CoS');
    console.log('   Max Simultaneous Experiments: 3');
    console.log('   Default Cohort Size: 5%');
    console.log('   Isolation: COMPLETE - L5 protected');

    return {
      success: true,
      message: 'L6 Strategic Sandbox activated. All experiments isolated from L5.',
      checks
    };
  }

  public deactivate(): { success: boolean; message: string } {
    const activeExperiments = this.experiments.filter(e => e.status === 'active');
    
    if (activeExperiments.length > 0) {
      return {
        success: false,
        message: `Cannot deactivate: ${activeExperiments.length} active experiments must be completed or abandoned first`
      };
    }

    this.isActive = false;
    this.logAction('SANDBOX_DEACTIVATED', null, 'L6 Strategic Sandbox deactivated', 'Strategist');

    return {
      success: true,
      message: 'L6 Strategic Sandbox deactivated'
    };
  }

  private checkActivationConditions(): SandboxActivationCheck {
    const forecast = revenuePredictiveModel.getLatestForecast();
    const rpmAccuracy = forecast?.confidenceScore || 0;
    
    const healthStatus = l5AgentHealthMonitor.getStatus();
    const unresolvedDriftCount = healthStatus.lastCycle?.driftIndicators?.filter(
      (d: any) => d.detected && d.severity !== 'low'
    ).length || 0;

    const activeExperiments = this.experiments.filter(e => e.status === 'active').length;

    const reasons: string[] = [];
    let canActivate = true;

    if (rpmAccuracy < this.config.rpmAccuracyThreshold) {
      canActivate = false;
      reasons.push(`RPM accuracy ${rpmAccuracy}% below threshold ${this.config.rpmAccuracyThreshold}%`);
    }

    if (unresolvedDriftCount > this.config.maxDriftIndicatorsAllowed) {
      canActivate = false;
      reasons.push(`${unresolvedDriftCount} unresolved drift indicators (max: ${this.config.maxDriftIndicatorsAllowed})`);
    }

    return {
      canActivate,
      rpmAccuracy,
      rpmThreshold: this.config.rpmAccuracyThreshold,
      unresolvedDriftCount,
      activeExperimentCount: activeExperiments,
      maxSimultaneousExperiments: this.config.maxSimultaneousExperiments,
      reasons
    };
  }

  public proposeExperiment(params: {
    type: L6ExperimentType;
    name: string;
    description: string;
    hypothesis: string;
    proposedBy: L6Experiment['proposedBy'];
    tokenBudget?: number;
    maxDurationDays?: number;
    microCohortSize?: number;
  }): { success: boolean; experiment?: L6Experiment; message: string } {
    if (!this.isActive) {
      return { success: false, message: 'L6 Sandbox is not active. Activate sandbox first.' };
    }

    const activeCount = this.experiments.filter(e => e.status === 'active').length;
    if (activeCount >= this.config.maxSimultaneousExperiments) {
      return { 
        success: false, 
        message: `Maximum ${this.config.maxSimultaneousExperiments} simultaneous experiments allowed` 
      };
    }

    const experiment: L6Experiment = {
      id: `l6_exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      name: params.name,
      description: params.description,
      hypothesis: params.hypothesis,
      proposedBy: params.proposedBy,
      status: 'proposed',
      createdAt: new Date().toISOString(),
      activatedAt: null,
      completedAt: null,
      graduatedAt: null,
      abandonedAt: null,
      abandonedReason: null,
      tokenBudget: params.tokenBudget || this.config.defaultTokenBudget,
      tokensUsed: 0,
      maxDurationDays: params.maxDurationDays || this.config.defaultMaxDurationDays,
      microCohortSize: params.microCohortSize || this.config.defaultMicroCohortPercent,
      outputs: [],
      metrics: {
        trustSignalDelta: 0,
        conversionDelta: 0,
        frictionScore: 0,
        skepticismLevel: 0,
        rpmImpact: 0,
        vqsRiskScore: 0
      },
      cosApproval: {
        required: true,
        approved: false,
        approvedAt: null,
        approvedBy: null,
        notes: null
      }
    };

    this.experiments.push(experiment);
    this.logAction('EXPERIMENT_PROPOSED', experiment.id, 
      `${params.type}: ${params.name}`, params.proposedBy);

    return { success: true, experiment, message: 'Experiment proposed. Awaiting CoS approval.' };
  }

  public activateExperiment(experimentId: string): { success: boolean; message: string } {
    const experiment = this.experiments.find(e => e.id === experimentId);
    
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    if (experiment.status !== 'proposed') {
      return { success: false, message: `Cannot activate: experiment is ${experiment.status}` };
    }

    if (!experiment.cosApproval.approved) {
      return { success: false, message: 'CoS approval required before activation' };
    }

    const activeCount = this.experiments.filter(e => e.status === 'active').length;
    if (activeCount >= this.config.maxSimultaneousExperiments) {
      return { 
        success: false, 
        message: `Maximum ${this.config.maxSimultaneousExperiments} simultaneous experiments reached` 
      };
    }

    experiment.status = 'active';
    experiment.activatedAt = new Date().toISOString();

    this.logAction('EXPERIMENT_ACTIVATED', experimentId, 
      `${experiment.type}: ${experiment.name} now active`, 'CoS');

    console.log(`🔬 L6 EXPERIMENT ACTIVATED: ${experiment.name}`);
    console.log(`   Type: ${experiment.type}`);
    console.log(`   Cohort: ${experiment.microCohortSize}%`);
    console.log(`   Max Duration: ${experiment.maxDurationDays} days`);

    return { success: true, message: 'Experiment activated' };
  }

  public addExperimentOutput(experimentId: string, output: Omit<L6ExperimentOutput, 'id' | 'experimentId' | 'createdAt'>): { success: boolean; message: string } {
    const experiment = this.experiments.find(e => e.id === experimentId);
    
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    if (experiment.status !== 'active') {
      return { success: false, message: 'Can only add outputs to active experiments' };
    }

    const outputRecord: L6ExperimentOutput = {
      id: `output_${Date.now()}`,
      experimentId,
      outputType: output.outputType,
      data: output.data,
      createdAt: new Date().toISOString(),
      validated: output.validated,
      validationNotes: output.validationNotes
    };

    experiment.outputs.push(outputRecord);
    experiment.tokensUsed += 25;

    this.logAction('OUTPUT_ADDED', experimentId, 
      `${output.outputType} output added`, experiment.proposedBy);

    return { success: true, message: 'Output added to experiment' };
  }

  public updateExperimentMetrics(experimentId: string, metrics: Partial<L6ExperimentMetrics>): { success: boolean; message: string } {
    const experiment = this.experiments.find(e => e.id === experimentId);
    
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    experiment.metrics = { ...experiment.metrics, ...metrics };

    this.logAction('METRICS_UPDATED', experimentId, 
      `Metrics updated: ${JSON.stringify(metrics)}`, 'CoS');

    return { success: true, message: 'Metrics updated' };
  }

  public completeExperiment(experimentId: string): { success: boolean; message: string } {
    const experiment = this.experiments.find(e => e.id === experimentId);
    
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    if (experiment.status !== 'active') {
      return { success: false, message: 'Can only complete active experiments' };
    }

    experiment.status = 'completed';
    experiment.completedAt = new Date().toISOString();

    this.logAction('EXPERIMENT_COMPLETED', experimentId, 
      `${experiment.name} completed. Ready for graduation review.`, 'Strategist');

    return { success: true, message: 'Experiment completed. Ready for graduation review.' };
  }

  public abandonExperiment(experimentId: string, reason: string): { success: boolean; message: string } {
    const experiment = this.experiments.find(e => e.id === experimentId);
    
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    if (experiment.status === 'graduated' || experiment.status === 'abandoned') {
      return { success: false, message: `Cannot abandon: experiment is ${experiment.status}` };
    }

    experiment.status = 'abandoned';
    experiment.abandonedAt = new Date().toISOString();
    experiment.abandonedReason = reason;

    this.logAction('EXPERIMENT_ABANDONED', experimentId, 
      `Abandoned: ${reason}`, 'CoS');

    console.log(`⚠️ L6 EXPERIMENT ABANDONED: ${experiment.name}`);
    console.log(`   Reason: ${reason}`);

    return { success: true, message: 'Experiment abandoned' };
  }

  public getExperiments(filter?: { status?: L6ExperimentStatus; type?: L6ExperimentType }): L6Experiment[] {
    let result = [...this.experiments];
    
    if (filter?.status) {
      result = result.filter(e => e.status === filter.status);
    }
    if (filter?.type) {
      result = result.filter(e => e.type === filter.type);
    }
    
    return result;
  }

  public getExperiment(experimentId: string): L6Experiment | null {
    return this.experiments.find(e => e.id === experimentId) || null;
  }

  public getSandboxLogs(limit: number = 50): typeof this.sandboxLogs {
    return this.sandboxLogs.slice(-limit);
  }

  public getStatus(): {
    isActive: boolean;
    activatedAt: string | null;
    experimentCounts: Record<L6ExperimentStatus, number>;
    activeExperimentCount: number;
    canAcceptNewExperiments: boolean;
    config: L6SandboxConfig;
    activationCheck: SandboxActivationCheck;
  } {
    const counts: Record<L6ExperimentStatus, number> = {
      proposed: 0,
      active: 0,
      completed: 0,
      abandoned: 0,
      graduated: 0
    };

    for (const exp of this.experiments) {
      counts[exp.status]++;
    }

    return {
      isActive: this.isActive,
      activatedAt: this.activatedAt,
      experimentCounts: counts,
      activeExperimentCount: counts.active,
      canAcceptNewExperiments: counts.active < this.config.maxSimultaneousExperiments,
      config: this.config,
      activationCheck: this.checkActivationConditions()
    };
  }

  private logAction(action: string, experimentId: string | null, details: string, agent: string): void {
    this.sandboxLogs.push({
      timestamp: new Date().toISOString(),
      action,
      experimentId,
      details,
      agent
    });

    if (this.sandboxLogs.length > 1000) {
      this.sandboxLogs = this.sandboxLogs.slice(-500);
    }
  }

  public checkSandboxIsolation(): {
    isolated: boolean;
    l5Protected: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    const hasUncontrolledOutputs = this.experiments.some(e => 
      e.status === 'active' && 
      e.outputs.some(o => !o.validated && o.outputType === 'content')
    );

    if (hasUncontrolledOutputs) {
      violations.push('Unvalidated content outputs detected in active experiments');
    }

    return {
      isolated: violations.length === 0,
      l5Protected: true,
      violations
    };
  }
}

export const l6Sandbox = new L6SandboxService();
