import { l6Sandbox, L6Experiment, L6ExperimentMetrics } from './l6-sandbox';
import { revenuePredictiveModel } from './revenue-predictive-model';

export interface L6GovernanceConfig {
  maxTokensPerExperiment: number;
  maxExperimentDuration: number;
  maxSimultaneousExperiments: number;
  trustSignalDeclineThreshold: number;
  skepticismRiseThreshold: number;
  conversionDropThreshold: number;
  frictionIncreaseThreshold: number;
  vqsRiskThreshold: number;
}

export interface GraduationCriteria {
  microCohortSignalsStrong: boolean;
  noTrustErosion: boolean;
  rpmStable: boolean;
  noFrictionSpikes: boolean;
  strategistSimulationApproved: boolean;
  cosSignedOff: boolean;
}

export interface RollbackTrigger {
  triggerId: string;
  experimentId: string;
  experimentName: string;
  reason: 'trust_decline' | 'skepticism_rise' | 'conversion_drop' | 'confusion' | 'vqs_risk';
  severity: 'warning' | 'critical';
  detectedAt: string;
  metrics: Partial<L6ExperimentMetrics>;
  actionTaken: string;
  rootCauseAssigned: boolean;
}

export interface L6GovernanceDecision {
  decisionId: string;
  experimentId: string;
  decisionType: 'approve_proposal' | 'approve_graduation' | 'deny_graduation' | 'rollback' | 'extend_duration';
  decision: 'approved' | 'denied' | 'pending';
  decidedBy: string;
  decidedAt: string;
  rationale: string;
  conditions?: string[];
}

class L6CoSGovernanceService {
  private config: L6GovernanceConfig = {
    maxTokensPerExperiment: 500,
    maxExperimentDuration: 7,
    maxSimultaneousExperiments: 3,
    trustSignalDeclineThreshold: -5,
    skepticismRiseThreshold: 10,
    conversionDropThreshold: -10,
    frictionIncreaseThreshold: 15,
    vqsRiskThreshold: 20
  };

  private decisions: L6GovernanceDecision[] = [];
  private rollbackTriggers: RollbackTrigger[] = [];
  private governanceLogs: Array<{
    timestamp: string;
    action: string;
    experimentId: string | null;
    details: string;
  }> = [];

  public approveExperimentProposal(
    experimentId: string,
    approvedBy: string,
    notes?: string
  ): { success: boolean; message: string } {
    const experiment = l6Sandbox.getExperiment(experimentId);
    
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    if (experiment.status !== 'proposed') {
      return { success: false, message: `Cannot approve: experiment is ${experiment.status}` };
    }

    if (experiment.tokenBudget > this.config.maxTokensPerExperiment) {
      return { 
        success: false, 
        message: `Token budget ${experiment.tokenBudget} exceeds max ${this.config.maxTokensPerExperiment}` 
      };
    }

    if (experiment.maxDurationDays > this.config.maxExperimentDuration) {
      return { 
        success: false, 
        message: `Duration ${experiment.maxDurationDays} days exceeds max ${this.config.maxExperimentDuration}` 
      };
    }

    const sandbox = l6Sandbox.getStatus();
    if (sandbox.activeExperimentCount >= this.config.maxSimultaneousExperiments) {
      return { 
        success: false, 
        message: `Maximum ${this.config.maxSimultaneousExperiments} simultaneous experiments reached` 
      };
    }

    experiment.cosApproval = {
      required: true,
      approved: true,
      approvedAt: new Date().toISOString(),
      approvedBy,
      notes: notes || null
    };

    const decision: L6GovernanceDecision = {
      decisionId: `gov_${Date.now()}`,
      experimentId,
      decisionType: 'approve_proposal',
      decision: 'approved',
      decidedBy: approvedBy,
      decidedAt: new Date().toISOString(),
      rationale: notes || 'Experiment meets all governance requirements'
    };

    this.decisions.push(decision);
    this.logAction('PROPOSAL_APPROVED', experimentId, 
      `Approved by ${approvedBy}: ${experiment.name}`);

    console.log(`✅ L6 EXPERIMENT APPROVED: ${experiment.name}`);
    console.log(`   Approved by: ${approvedBy}`);
    console.log(`   Token Budget: ${experiment.tokenBudget}`);
    console.log(`   Duration: ${experiment.maxDurationDays} days`);

    return { success: true, message: 'Experiment proposal approved. Ready for activation.' };
  }

  public denyExperimentProposal(
    experimentId: string,
    deniedBy: string,
    reason: string
  ): { success: boolean; message: string } {
    const experiment = l6Sandbox.getExperiment(experimentId);
    
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    l6Sandbox.abandonExperiment(experimentId, `Proposal denied: ${reason}`);

    const decision: L6GovernanceDecision = {
      decisionId: `gov_${Date.now()}`,
      experimentId,
      decisionType: 'approve_proposal',
      decision: 'denied',
      decidedBy: deniedBy,
      decidedAt: new Date().toISOString(),
      rationale: reason
    };

    this.decisions.push(decision);
    this.logAction('PROPOSAL_DENIED', experimentId, 
      `Denied by ${deniedBy}: ${reason}`);

    return { success: true, message: 'Experiment proposal denied' };
  }

  public checkRollbackConditions(experimentId: string): RollbackTrigger | null {
    const experiment = l6Sandbox.getExperiment(experimentId);
    
    if (!experiment || experiment.status !== 'active') {
      return null;
    }

    const metrics = experiment.metrics;
    let trigger: RollbackTrigger | null = null;

    if (metrics.trustSignalDelta < this.config.trustSignalDeclineThreshold) {
      trigger = this.createRollbackTrigger(experiment, 'trust_decline', 
        `Trust signal declined ${metrics.trustSignalDelta}%`, metrics);
    } else if (metrics.skepticismLevel > this.config.skepticismRiseThreshold) {
      trigger = this.createRollbackTrigger(experiment, 'skepticism_rise',
        `Skepticism level ${metrics.skepticismLevel}% exceeds threshold`, metrics);
    } else if (metrics.conversionDelta < this.config.conversionDropThreshold) {
      trigger = this.createRollbackTrigger(experiment, 'conversion_drop',
        `Conversion dropped ${metrics.conversionDelta}%`, metrics);
    } else if (metrics.frictionScore > this.config.frictionIncreaseThreshold) {
      trigger = this.createRollbackTrigger(experiment, 'confusion',
        `Friction score ${metrics.frictionScore} indicates confusion`, metrics);
    } else if (metrics.vqsRiskScore > this.config.vqsRiskThreshold) {
      trigger = this.createRollbackTrigger(experiment, 'vqs_risk',
        `VQS risk score ${metrics.vqsRiskScore} exceeds threshold`, metrics);
    }

    if (trigger) {
      this.rollbackTriggers.push(trigger);
      this.executeRollback(experimentId, trigger.reason);
    }

    return trigger;
  }

  private createRollbackTrigger(
    experiment: L6Experiment,
    reason: RollbackTrigger['reason'],
    details: string,
    metrics: Partial<L6ExperimentMetrics>
  ): RollbackTrigger {
    return {
      triggerId: `rollback_${Date.now()}`,
      experimentId: experiment.id,
      experimentName: experiment.name,
      reason,
      severity: reason === 'vqs_risk' || reason === 'trust_decline' ? 'critical' : 'warning',
      detectedAt: new Date().toISOString(),
      metrics,
      actionTaken: 'Automatic rollback initiated',
      rootCauseAssigned: false
    };
  }

  public executeRollback(experimentId: string, reason: string): { success: boolean; message: string } {
    const experiment = l6Sandbox.getExperiment(experimentId);
    
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    l6Sandbox.abandonExperiment(experimentId, `Rollback: ${reason}`);

    this.logAction('ROLLBACK_EXECUTED', experimentId, 
      `Rollback executed: ${reason}. Strategist flagged for root-cause analysis.`);

    console.log(`🔄 L6 ROLLBACK EXECUTED: ${experiment.name}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Action: Strategist flagged for root-cause analysis`);

    return { success: true, message: 'Rollback executed. Strategist notified.' };
  }

  public evaluateGraduation(experimentId: string): {
    eligible: boolean;
    criteria: GraduationCriteria;
    recommendation: string;
  } {
    const experiment = l6Sandbox.getExperiment(experimentId);
    
    if (!experiment) {
      return {
        eligible: false,
        criteria: this.getEmptyCriteria(),
        recommendation: 'Experiment not found'
      };
    }

    if (experiment.status !== 'completed') {
      return {
        eligible: false,
        criteria: this.getEmptyCriteria(),
        recommendation: 'Experiment must be completed before graduation evaluation'
      };
    }

    const metrics = experiment.metrics;
    const forecast = revenuePredictiveModel.getLatestForecast();
    const rpmStable = (forecast?.confidenceScore || 0) >= 85;

    const criteria: GraduationCriteria = {
      microCohortSignalsStrong: metrics.conversionDelta >= 0 && metrics.trustSignalDelta >= 0,
      noTrustErosion: metrics.trustSignalDelta >= -2,
      rpmStable,
      noFrictionSpikes: metrics.frictionScore <= 10,
      strategistSimulationApproved: metrics.vqsRiskScore < 15,
      cosSignedOff: false
    };

    const passCount = Object.values(criteria).filter(Boolean).length;
    const eligible = passCount >= 5;

    let recommendation: string;
    if (eligible) {
      recommendation = 'Experiment eligible for graduation. CoS sign-off required.';
    } else {
      const failedCriteria = Object.entries(criteria)
        .filter(([, passed]) => !passed)
        .map(([key]) => key);
      recommendation = `Not eligible. Failed criteria: ${failedCriteria.join(', ')}`;
    }

    return { eligible, criteria, recommendation };
  }

  private getEmptyCriteria(): GraduationCriteria {
    return {
      microCohortSignalsStrong: false,
      noTrustErosion: false,
      rpmStable: false,
      noFrictionSpikes: false,
      strategistSimulationApproved: false,
      cosSignedOff: false
    };
  }

  public approveGraduation(
    experimentId: string,
    approvedBy: string,
    notes?: string
  ): { success: boolean; message: string } {
    const evaluation = this.evaluateGraduation(experimentId);
    
    if (!evaluation.eligible) {
      return { success: false, message: evaluation.recommendation };
    }

    const experiment = l6Sandbox.getExperiment(experimentId);
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    experiment.status = 'graduated';
    experiment.graduatedAt = new Date().toISOString();

    const decision: L6GovernanceDecision = {
      decisionId: `gov_${Date.now()}`,
      experimentId,
      decisionType: 'approve_graduation',
      decision: 'approved',
      decidedBy: approvedBy,
      decidedAt: new Date().toISOString(),
      rationale: notes || 'All graduation criteria met'
    };

    this.decisions.push(decision);
    this.logAction('GRADUATION_APPROVED', experimentId, 
      `Graduated to L5 by ${approvedBy}: ${experiment.name}`);

    console.log(`🎓 L6 EXPERIMENT GRADUATED TO L5: ${experiment.name}`);
    console.log(`   Approved by: ${approvedBy}`);
    console.log(`   Type: ${experiment.type}`);

    return { success: true, message: 'Experiment graduated to L5 production.' };
  }

  public denyGraduation(
    experimentId: string,
    deniedBy: string,
    reason: string
  ): { success: boolean; message: string } {
    const experiment = l6Sandbox.getExperiment(experimentId);
    
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    const decision: L6GovernanceDecision = {
      decisionId: `gov_${Date.now()}`,
      experimentId,
      decisionType: 'deny_graduation',
      decision: 'denied',
      decidedBy: deniedBy,
      decidedAt: new Date().toISOString(),
      rationale: reason
    };

    this.decisions.push(decision);
    this.logAction('GRADUATION_DENIED', experimentId, 
      `Graduation denied by ${deniedBy}: ${reason}`);

    return { success: true, message: 'Graduation denied. Experiment remains in sandbox.' };
  }

  public getDecisions(experimentId?: string): L6GovernanceDecision[] {
    if (experimentId) {
      return this.decisions.filter(d => d.experimentId === experimentId);
    }
    return [...this.decisions];
  }

  public getRollbackTriggers(experimentId?: string): RollbackTrigger[] {
    if (experimentId) {
      return this.rollbackTriggers.filter(t => t.experimentId === experimentId);
    }
    return [...this.rollbackTriggers];
  }

  public getGovernanceLogs(limit: number = 50): typeof this.governanceLogs {
    return this.governanceLogs.slice(-limit);
  }

  public getExperimentReport(): {
    proposed: number;
    active: number;
    completed: number;
    abandoned: number;
    graduated: number;
    totalDecisions: number;
    totalRollbacks: number;
    config: L6GovernanceConfig;
  } {
    const sandbox = l6Sandbox.getStatus();
    
    return {
      proposed: sandbox.experimentCounts.proposed,
      active: sandbox.experimentCounts.active,
      completed: sandbox.experimentCounts.completed,
      abandoned: sandbox.experimentCounts.abandoned,
      graduated: sandbox.experimentCounts.graduated,
      totalDecisions: this.decisions.length,
      totalRollbacks: this.rollbackTriggers.length,
      config: this.config
    };
  }

  public getConfig(): L6GovernanceConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<L6GovernanceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logAction('CONFIG_UPDATED', null, `Governance config updated: ${JSON.stringify(updates)}`);
  }

  private logAction(action: string, experimentId: string | null, details: string): void {
    this.governanceLogs.push({
      timestamp: new Date().toISOString(),
      action,
      experimentId,
      details
    });

    if (this.governanceLogs.length > 500) {
      this.governanceLogs = this.governanceLogs.slice(-250);
    }
  }
}

export const l6CoSGovernance = new L6CoSGovernanceService();
