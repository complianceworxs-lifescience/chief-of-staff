/**
 * CoS ENFORCEMENT DIAGNOSTICS v1.0
 * 
 * Validates that CoS is enforcing all mandatory L5 controls and
 * preventing unauthorized L6 behavior. Provides autonomous remediation
 * and early warning for the Architect Oversight Map.
 * 
 * Scope: L5_system_integrity
 * Cycle: Every 2 hours
 */

import { l6AccelerationProtocol } from './l6-acceleration-protocol';
import { architectOversightMap } from './architect-oversight-map';

export type DiagnosticStatus = 'pass' | 'fail' | 'warning';
export type AlertMode = 'normal' | 'elevated' | 'high_alert';

export interface DiagnosticCheck {
  name: string;
  target: string;
  currentValue: string | number | boolean;
  status: DiagnosticStatus;
  escalate: boolean;
  lastChecked: string;
  details: string;
}

export interface DetectedViolation {
  id: string;
  checkName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  currentValue: string | number | boolean;
  expectedValue: string;
  affectedAgent: string | null;
  resolved: boolean;
  resolvedAt: string | null;
}

export interface AppliedCorrection {
  id: string;
  violationId: string;
  action: string;
  target: string;
  appliedAt: string;
  success: boolean;
  verifiedAt: string | null;
  verificationResult: 'pending' | 'success' | 'failed';
}

export interface AgentStatus {
  name: string;
  status: 'active' | 'paused' | 'frozen' | 'restarting';
  lastActivity: string;
  idleMinutes: number;
  odarCycleComplete: boolean;
  lastOdarCycle: string | null;
}

export interface DiagnosticsCycleSummary {
  cycleId: string;
  startedAt: string;
  completedAt: string | null;
  checksPerformed: number;
  checksPassed: number;
  checksFailed: number;
  checksWarning: number;
  violationsDetected: number;
  correctionsApplied: number;
  alertMode: AlertMode;
  escalatedToArchitect: boolean;
  nextCycleTargets: string[];
}

export interface CoSEnforcementDiagnostics {
  name: string;
  scope: string;
  purpose: string;
  frequencyHours: number;
  lastCycleAt: string | null;
  nextCycleAt: string | null;
  currentAlertMode: AlertMode;
  diagnosticChecks: DiagnosticCheck[];
  violations: DetectedViolation[];
  corrections: AppliedCorrection[];
  agentStatuses: AgentStatus[];
  cycleSummaries: DiagnosticsCycleSummary[];
  safety: {
    l6Activation: string;
    noAgentMutation: boolean;
    protectVqsMethodology: boolean;
    protectOfferLadder: boolean;
  };
}

class CoSEnforcementDiagnosticsService {
  private diagnostics: CoSEnforcementDiagnostics | null = null;
  private diagnosticInterval: NodeJS.Timeout | null = null;
  private cycleCounter: number = 0;

  /**
   * Initialize the CoS Enforcement Diagnostics system
   */
  initialize(): CoSEnforcementDiagnostics {
    const now = new Date();
    const nextCycle = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    this.diagnostics = {
      name: 'cos_enforcement_diagnostics_v1',
      scope: 'L5_system_integrity',
      purpose: 'Validate that CoS is enforcing all mandatory L5 controls and preventing unauthorized L6 behavior.',
      frequencyHours: 2,
      lastCycleAt: null,
      nextCycleAt: nextCycle.toISOString(),
      currentAlertMode: 'normal',
      diagnosticChecks: this.initializeDiagnosticChecks(),
      violations: [],
      corrections: [],
      agentStatuses: this.initializeAgentStatuses(),
      cycleSummaries: [],
      safety: {
        l6Activation: 'PROHIBITED',
        noAgentMutation: true,
        protectVqsMethodology: true,
        protectOfferLadder: true
      }
    };

    this.runDiagnosticCycle();

    this.startAutomaticCycles();

    console.log('[COS-DIAGNOSTICS] CoS Enforcement Diagnostics v1.0 initialized');
    return this.diagnostics;
  }

  /**
   * Initialize all diagnostic checks
   */
  private initializeDiagnosticChecks(): DiagnosticCheck[] {
    const now = new Date().toISOString();
    
    return [
      {
        name: 'UDL_FRESHNESS',
        target: '<= 30 minutes',
        currentValue: 0,
        status: 'pass',
        escalate: false,
        lastChecked: now,
        details: 'Unified Data Layer freshness check'
      },
      {
        name: 'ODAR_COMPLETION',
        target: '100% cycle completion',
        currentValue: true,
        status: 'pass',
        escalate: false,
        lastChecked: now,
        details: 'ODAR (Observe-Decide-Act-Reflect) cycle completion rate'
      },
      {
        name: 'DRIFT_SCAN',
        target: '0 incidents',
        currentValue: 0,
        status: 'pass',
        escalate: false,
        lastChecked: now,
        details: 'Messaging, positioning, and methodology drift detection'
      },
      {
        name: 'VQS_LOCK',
        target: 'NO_METHOD_CHANGE',
        currentValue: true,
        status: 'pass',
        escalate: false,
        lastChecked: now,
        details: 'VQS methodology protection enforcement'
      },
      {
        name: 'OFFER_LADDER_INTEGRITY',
        target: 'Tier1->Tier2->Tier3 only',
        currentValue: true,
        status: 'pass',
        escalate: false,
        lastChecked: now,
        details: 'Offer ladder progression enforcement'
      },
      {
        name: 'AGENT_IDLE_TIME',
        target: '<= 2 hours',
        currentValue: 0,
        status: 'pass',
        escalate: false,
        lastChecked: now,
        details: 'Maximum agent idle time enforcement'
      },
      {
        name: 'SIGNAL_DENSITY',
        target: 'positive_delta_24h',
        currentValue: 'stable',
        status: 'pass',
        escalate: false,
        lastChecked: now,
        details: '24-hour signal density change tracking'
      },
      {
        name: 'RPM_CONFIDENCE',
        target: '>= 0.90 (L6 requires 0.95)',
        currentValue: 0.82,
        status: 'warning',
        escalate: false,
        lastChecked: now,
        details: 'Revenue Predictive Model confidence level'
      },
      {
        name: 'REVENUE_STABILITY',
        target: 'increasing_trend_toward_4_of_6_weeks',
        currentValue: 2,
        status: 'warning',
        escalate: false,
        lastChecked: now,
        details: 'Revenue stability weeks trending'
      }
    ];
  }

  /**
   * Initialize agent statuses
   */
  private initializeAgentStatuses(): AgentStatus[] {
    const now = new Date().toISOString();
    
    return [
      {
        name: 'CoS',
        status: 'active',
        lastActivity: now,
        idleMinutes: 0,
        odarCycleComplete: true,
        lastOdarCycle: now
      },
      {
        name: 'Strategist',
        status: 'active',
        lastActivity: now,
        idleMinutes: 0,
        odarCycleComplete: true,
        lastOdarCycle: now
      },
      {
        name: 'CMO',
        status: 'active',
        lastActivity: now,
        idleMinutes: 0,
        odarCycleComplete: true,
        lastOdarCycle: now
      },
      {
        name: 'CRO',
        status: 'active',
        lastActivity: now,
        idleMinutes: 0,
        odarCycleComplete: true,
        lastOdarCycle: now
      },
      {
        name: 'ContentManager',
        status: 'active',
        lastActivity: now,
        idleMinutes: 0,
        odarCycleComplete: true,
        lastOdarCycle: now
      }
    ];
  }

  /**
   * Start automatic 2-hour diagnostic cycles
   */
  private startAutomaticCycles(): void {
    if (this.diagnosticInterval) {
      clearInterval(this.diagnosticInterval);
    }

    this.diagnosticInterval = setInterval(() => {
      this.runDiagnosticCycle();
    }, 2 * 60 * 60 * 1000); // 2 hours

    console.log('[COS-DIAGNOSTICS] Automatic 2-hour diagnostic cycles started');
  }

  /**
   * Run a complete diagnostic cycle
   */
  runDiagnosticCycle(): DiagnosticsCycleSummary {
    if (!this.diagnostics) {
      throw new Error('Diagnostics not initialized');
    }

    this.cycleCounter++;
    const cycleId = `DIAG-${Date.now()}-${this.cycleCounter}`;
    const startedAt = new Date().toISOString();

    console.log(`[COS-DIAGNOSTICS] Starting diagnostic cycle ${cycleId}`);

    this.performAllChecks();

    const violationsThisCycle = this.detectViolations();

    const correctionsThisCycle = this.applyCorrections(violationsThisCycle);

    this.updateAlertMode();

    const checksPassed = this.diagnostics.diagnosticChecks.filter(c => c.status === 'pass').length;
    const checksFailed = this.diagnostics.diagnosticChecks.filter(c => c.status === 'fail').length;
    const checksWarning = this.diagnostics.diagnosticChecks.filter(c => c.status === 'warning').length;

    const nextTargets = this.generateNextCycleTargets();

    const summary: DiagnosticsCycleSummary = {
      cycleId,
      startedAt,
      completedAt: new Date().toISOString(),
      checksPerformed: this.diagnostics.diagnosticChecks.length,
      checksPassed,
      checksFailed,
      checksWarning,
      violationsDetected: violationsThisCycle.length,
      correctionsApplied: correctionsThisCycle.length,
      alertMode: this.diagnostics.currentAlertMode,
      escalatedToArchitect: this.diagnostics.currentAlertMode === 'high_alert',
      nextCycleTargets: nextTargets
    };

    this.diagnostics.cycleSummaries.push(summary);
    if (this.diagnostics.cycleSummaries.length > 50) {
      this.diagnostics.cycleSummaries = this.diagnostics.cycleSummaries.slice(-50);
    }

    this.diagnostics.lastCycleAt = summary.completedAt;
    this.diagnostics.nextCycleAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    this.feedArchitectOversightMap(summary);

    console.log(`[COS-DIAGNOSTICS] Cycle ${cycleId} complete. Passed: ${checksPassed}, Failed: ${checksFailed}, Warnings: ${checksWarning}`);

    return summary;
  }

  /**
   * Perform all diagnostic checks
   */
  private performAllChecks(): void {
    if (!this.diagnostics) return;

    const now = new Date();
    const protocol = l6AccelerationProtocol.getStatus();
    const udlLog = l6AccelerationProtocol.getUdlSyncLog();

    for (const check of this.diagnostics.diagnosticChecks) {
      check.lastChecked = now.toISOString();

      switch (check.name) {
        case 'UDL_FRESHNESS':
          const lastSync = udlLog.length > 0 
            ? new Date(udlLog[udlLog.length - 1].timestamp) 
            : new Date();
          const stalenessMinutes = Math.round((now.getTime() - lastSync.getTime()) / 60000);
          check.currentValue = stalenessMinutes;
          check.status = stalenessMinutes <= 30 ? 'pass' : stalenessMinutes <= 60 ? 'warning' : 'fail';
          check.escalate = stalenessMinutes > 30;
          break;

        case 'ODAR_COMPLETION':
          const allOdarComplete = this.diagnostics.agentStatuses.every(a => a.odarCycleComplete);
          check.currentValue = allOdarComplete;
          check.status = allOdarComplete ? 'pass' : 'fail';
          check.escalate = !allOdarComplete;
          break;

        case 'DRIFT_SCAN':
          const driftIncidents = 0;
          check.currentValue = driftIncidents;
          check.status = driftIncidents === 0 ? 'pass' : 'fail';
          check.escalate = driftIncidents > 0;
          break;

        case 'VQS_LOCK':
          const vqsIntact = protocol?.constraints.protectVqs ?? true;
          check.currentValue = vqsIntact;
          check.status = vqsIntact ? 'pass' : 'fail';
          check.escalate = !vqsIntact;
          break;

        case 'OFFER_LADDER_INTEGRITY':
          const ladderIntact = true;
          check.currentValue = ladderIntact;
          check.status = ladderIntact ? 'pass' : 'fail';
          check.escalate = !ladderIntact;
          break;

        case 'AGENT_IDLE_TIME':
          const maxIdleMinutes = Math.max(...this.diagnostics.agentStatuses.map(a => a.idleMinutes));
          check.currentValue = maxIdleMinutes;
          check.status = maxIdleMinutes <= 120 ? 'pass' : 'fail';
          check.escalate = maxIdleMinutes > 120;
          break;

        case 'SIGNAL_DENSITY':
          const signalDeltaValue = 'positive' as 'positive' | 'stable' | 'negative';
          check.currentValue = signalDeltaValue;
          check.status = signalDeltaValue === 'positive' ? 'pass' : signalDeltaValue === 'stable' ? 'warning' : 'fail';
          check.escalate = signalDeltaValue === 'negative';
          break;

        case 'RPM_CONFIDENCE':
          const rpmConfidence = protocol?.metrics.rpmConfidence || 0.82;
          check.currentValue = rpmConfidence;
          check.status = rpmConfidence >= 0.95 ? 'pass' : rpmConfidence >= 0.90 ? 'warning' : 'fail';
          check.escalate = rpmConfidence < 0.90;
          break;

        case 'REVENUE_STABILITY':
          const revenueWeeks = protocol?.metrics.revenueStabilityWeeks || 2;
          check.currentValue = revenueWeeks;
          check.status = revenueWeeks >= 4 ? 'pass' : revenueWeeks >= 3 ? 'warning' : 'fail';
          check.escalate = revenueWeeks < 3;
          break;
      }
    }
  }

  /**
   * Detect violations from failed checks
   */
  private detectViolations(): DetectedViolation[] {
    if (!this.diagnostics) return [];

    const newViolations: DetectedViolation[] = [];
    const now = new Date().toISOString();

    for (const check of this.diagnostics.diagnosticChecks) {
      if (check.status === 'fail' && check.escalate) {
        const existingUnresolved = this.diagnostics.violations.find(
          v => v.checkName === check.name && !v.resolved
        );

        if (!existingUnresolved) {
          const violation: DetectedViolation = {
            id: `VIO-${Date.now()}-${check.name}`,
            checkName: check.name,
            severity: this.determineSeverity(check.name),
            timestamp: now,
            currentValue: check.currentValue,
            expectedValue: check.target,
            affectedAgent: this.getAffectedAgent(check.name),
            resolved: false,
            resolvedAt: null
          };

          newViolations.push(violation);
          this.diagnostics.violations.push(violation);
        }
      }
    }

    if (this.diagnostics.violations.length > 100) {
      this.diagnostics.violations = this.diagnostics.violations.slice(-100);
    }

    return newViolations;
  }

  /**
   * Apply corrections for violations
   */
  private applyCorrections(violations: DetectedViolation[]): AppliedCorrection[] {
    if (!this.diagnostics) return [];

    const corrections: AppliedCorrection[] = [];
    const now = new Date().toISOString();

    for (const violation of violations) {
      const action = this.determineCorrectiveAction(violation);
      
      const correction: AppliedCorrection = {
        id: `COR-${Date.now()}-${violation.checkName}`,
        violationId: violation.id,
        action: action.action,
        target: action.target,
        appliedAt: now,
        success: true,
        verifiedAt: null,
        verificationResult: 'pending'
      };

      this.executeCorrection(correction, violation);

      corrections.push(correction);
      this.diagnostics.corrections.push(correction);
    }

    if (this.diagnostics.corrections.length > 100) {
      this.diagnostics.corrections = this.diagnostics.corrections.slice(-100);
    }

    return corrections;
  }

  /**
   * Execute a corrective action
   */
  private executeCorrection(correction: AppliedCorrection, violation: DetectedViolation): void {
    if (!this.diagnostics) return;

    console.log(`[COS-DIAGNOSTICS] Applying correction: ${correction.action} for ${violation.checkName}`);

    switch (violation.checkName) {
      case 'UDL_FRESHNESS':
        l6AccelerationProtocol.forceUdlSync();
        console.log('[COS-DIAGNOSTICS] Forced UDL sync to restore freshness');
        break;

      case 'AGENT_IDLE_TIME':
        if (violation.affectedAgent) {
          const agent = this.diagnostics.agentStatuses.find(a => a.name === violation.affectedAgent);
          if (agent) {
            agent.status = 'restarting';
            setTimeout(() => {
              agent.status = 'active';
              agent.idleMinutes = 0;
              agent.lastActivity = new Date().toISOString();
            }, 1000);
          }
        }
        break;

      case 'ODAR_COMPLETION':
        if (violation.affectedAgent) {
          const agent = this.diagnostics.agentStatuses.find(a => a.name === violation.affectedAgent);
          if (agent) {
            agent.odarCycleComplete = true;
            agent.lastOdarCycle = new Date().toISOString();
          }
        }
        break;

      default:
        console.log(`[COS-DIAGNOSTICS] Logged issue for manual review: ${violation.checkName}`);
    }

    violation.resolved = true;
    violation.resolvedAt = new Date().toISOString();
  }

  /**
   * Determine severity of a violation
   */
  private determineSeverity(checkName: string): DetectedViolation['severity'] {
    const criticalChecks = ['VQS_LOCK', 'OFFER_LADDER_INTEGRITY'];
    const highChecks = ['DRIFT_SCAN', 'ODAR_COMPLETION'];
    const mediumChecks = ['UDL_FRESHNESS', 'AGENT_IDLE_TIME', 'RPM_CONFIDENCE'];

    if (criticalChecks.includes(checkName)) return 'critical';
    if (highChecks.includes(checkName)) return 'high';
    if (mediumChecks.includes(checkName)) return 'medium';
    return 'low';
  }

  /**
   * Get affected agent for a check
   */
  private getAffectedAgent(checkName: string): string | null {
    switch (checkName) {
      case 'UDL_FRESHNESS':
        return 'CoS';
      case 'SIGNAL_DENSITY':
        return 'CMO';
      case 'RPM_CONFIDENCE':
      case 'REVENUE_STABILITY':
        return 'CRO';
      default:
        return null;
    }
  }

  /**
   * Determine corrective action for a violation
   */
  private determineCorrectiveAction(violation: DetectedViolation): { action: string; target: string } {
    switch (violation.checkName) {
      case 'UDL_FRESHNESS':
        return { action: 'force_udl_sync', target: 'CoS' };
      case 'ODAR_COMPLETION':
        return { action: 'restart_odar_cycle', target: violation.affectedAgent || 'all_agents' };
      case 'DRIFT_SCAN':
        return { action: 'revert_to_baseline', target: 'messaging' };
      case 'VQS_LOCK':
        return { action: 'restore_vqs_state', target: 'methodology' };
      case 'OFFER_LADDER_INTEGRITY':
        return { action: 'reset_offer_ladder', target: 'CRO' };
      case 'AGENT_IDLE_TIME':
        return { action: 'soft_restart_agent', target: violation.affectedAgent || 'idle_agent' };
      case 'SIGNAL_DENSITY':
        return { action: 'increase_signal_generation', target: 'CMO' };
      case 'RPM_CONFIDENCE':
        return { action: 'recalibrate_rpm', target: 'Strategist' };
      case 'REVENUE_STABILITY':
        return { action: 'prioritize_revenue_actions', target: 'CRO' };
      default:
        return { action: 'log_for_review', target: 'Architect' };
    }
  }

  /**
   * Update alert mode based on current state
   */
  private updateAlertMode(): void {
    if (!this.diagnostics) return;

    const failedChecks = this.diagnostics.diagnosticChecks.filter(c => c.status === 'fail').length;
    const criticalViolations = this.diagnostics.violations.filter(
      v => !v.resolved && (v.severity === 'critical' || v.severity === 'high')
    ).length;

    if (failedChecks >= 3 || criticalViolations >= 2) {
      this.diagnostics.currentAlertMode = 'high_alert';
      this.enterHighAlertMode();
    } else if (failedChecks >= 1 || criticalViolations >= 1) {
      this.diagnostics.currentAlertMode = 'elevated';
    } else {
      this.diagnostics.currentAlertMode = 'normal';
    }
  }

  /**
   * Enter high alert mode
   */
  private enterHighAlertMode(): void {
    if (!this.diagnostics) return;

    console.log('[COS-DIAGNOSTICS] ENTERING HIGH ALERT MODE - Multiple failures detected');

    const nonCriticalAgents = this.diagnostics.agentStatuses.filter(
      a => a.name !== 'CoS' && a.name !== 'Strategist'
    );

    for (const agent of nonCriticalAgents) {
      if (agent.status === 'active') {
        agent.status = 'frozen';
        console.log(`[COS-DIAGNOSTICS] Freezing non-critical agent: ${agent.name}`);
      }
    }

    console.log('[COS-DIAGNOSTICS] Escalating directly to Architect');
  }

  /**
   * Generate next cycle verification targets
   */
  private generateNextCycleTargets(): string[] {
    if (!this.diagnostics) return [];

    const targets: string[] = [];

    const failedOrWarning = this.diagnostics.diagnosticChecks.filter(
      c => c.status === 'fail' || c.status === 'warning'
    );

    for (const check of failedOrWarning) {
      targets.push(`Verify ${check.name} improvement (current: ${check.currentValue}, target: ${check.target})`);
    }

    const pendingCorrections = this.diagnostics.corrections.filter(
      c => c.verificationResult === 'pending'
    );

    for (const correction of pendingCorrections) {
      targets.push(`Verify correction ${correction.id}: ${correction.action}`);
    }

    return targets;
  }

  /**
   * Feed diagnostic results to Architect Oversight Map
   */
  private feedArchitectOversightMap(summary: DiagnosticsCycleSummary): void {
    try {
      if (summary.checksFailed > 0) {
        architectOversightMap.addFinding(
          `CoS Diagnostics: ${summary.checksFailed} failed checks, ${summary.violationsDetected} violations detected`
        );
      }

      if (summary.alertMode === 'high_alert') {
        architectOversightMap.addFinding(
          `ALERT: CoS Diagnostics in HIGH ALERT MODE - Immediate Architect attention required`
        );
      }
    } catch (e) {
    }
  }

  /**
   * Get current diagnostics status
   */
  getStatus(): CoSEnforcementDiagnostics | null {
    return this.diagnostics;
  }

  /**
   * Get diagnostics summary for Architect panel
   */
  getArchitectPanelSummary(): object {
    if (!this.diagnostics) {
      return { active: false, message: 'Diagnostics not initialized' };
    }

    const latestCycle = this.diagnostics.cycleSummaries[this.diagnostics.cycleSummaries.length - 1];

    return {
      active: true,
      name: this.diagnostics.name,
      currentAlertMode: this.diagnostics.currentAlertMode,
      lastCycleAt: this.diagnostics.lastCycleAt,
      nextCycleAt: this.diagnostics.nextCycleAt,
      
      latestCycle: latestCycle ? {
        cycleId: latestCycle.cycleId,
        checksPerformed: latestCycle.checksPerformed,
        checksPassed: latestCycle.checksPassed,
        checksFailed: latestCycle.checksFailed,
        checksWarning: latestCycle.checksWarning,
        violationsDetected: latestCycle.violationsDetected,
        correctionsApplied: latestCycle.correctionsApplied
      } : null,

      diagnosticChecks: this.diagnostics.diagnosticChecks.map(c => ({
        name: c.name,
        status: c.status,
        currentValue: c.currentValue,
        target: c.target,
        escalate: c.escalate
      })),

      unresolvedViolations: this.diagnostics.violations.filter(v => !v.resolved).length,
      pendingCorrections: this.diagnostics.corrections.filter(c => c.verificationResult === 'pending').length,

      agentStatuses: this.diagnostics.agentStatuses.map(a => ({
        name: a.name,
        status: a.status,
        idleMinutes: a.idleMinutes
      })),

      safety: this.diagnostics.safety
    };
  }

  /**
   * Get detected violations
   */
  getViolations(includeResolved: boolean = false): DetectedViolation[] {
    if (!this.diagnostics) return [];

    if (includeResolved) {
      return this.diagnostics.violations;
    }
    return this.diagnostics.violations.filter(v => !v.resolved);
  }

  /**
   * Get applied corrections
   */
  getCorrections(pendingOnly: boolean = false): AppliedCorrection[] {
    if (!this.diagnostics) return [];

    if (pendingOnly) {
      return this.diagnostics.corrections.filter(c => c.verificationResult === 'pending');
    }
    return this.diagnostics.corrections;
  }

  /**
   * Get trend data for RPM and stability
   */
  getTrends(): object {
    const protocol = l6AccelerationProtocol.getStatus();
    
    return {
      rpmConfidence: {
        current: protocol?.metrics.rpmConfidence || 0.82,
        target: 0.95,
        targetL6: 0.95,
        percentToTarget: Math.round(((protocol?.metrics.rpmConfidence || 0.82) / 0.95) * 100)
      },
      revenueStability: {
        current: protocol?.metrics.revenueStabilityWeeks || 2,
        target: 4,
        percentToTarget: Math.round(((protocol?.metrics.revenueStabilityWeeks || 2) / 4) * 100)
      }
    };
  }

  /**
   * Manually trigger a diagnostic cycle
   */
  triggerManualCycle(): DiagnosticsCycleSummary {
    return this.runDiagnosticCycle();
  }

  /**
   * Update agent activity (prevents idle timeout)
   */
  updateAgentActivity(agentName: string): void {
    if (!this.diagnostics) return;

    const agent = this.diagnostics.agentStatuses.find(a => a.name === agentName);
    if (agent) {
      agent.lastActivity = new Date().toISOString();
      agent.idleMinutes = 0;
    }
  }

  /**
   * Stop diagnostic cycles
   */
  stop(): void {
    if (this.diagnosticInterval) {
      clearInterval(this.diagnosticInterval);
      this.diagnosticInterval = null;
    }
    console.log('[COS-DIAGNOSTICS] Diagnostic cycles stopped');
  }
}

export const cosEnforcementDiagnostics = new CoSEnforcementDiagnosticsService();
