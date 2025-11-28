/**
 * L7 STATE UPDATER SERVICE
 * 
 * Scheduled autonomous monitoring for L7 Evolution Protocol.
 * Runs every 2 hours to update proof conditions, track interventions,
 * and generate weekly Evolution Digests.
 * 
 * Connects overdue action detection to L7 intervention tracking.
 */

import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';
import { sweepOverdueActions } from '../actions.js';
import { l7EvolutionProtocol } from './l7-evolution-protocol.js';

interface OverdueActionLog {
  timestamp: string;
  action_id: string;
  owner_agent: string;
  title: string;
  hours_overdue: number;
  escalated_to: string;
  intervention_required: boolean;
}

interface DailyMetricSnapshot {
  date: string;
  revenue: number;
  governance_violations: number;
  overdue_actions: number;
  drift_incidents: number;
}

interface L7StateUpdaterState {
  last_run: string;
  last_daily_update: string;
  last_digest_generation: string;
  overdue_action_log: OverdueActionLog[];
  daily_metrics: DailyMetricSnapshot[];
  intervention_events: Array<{
    timestamp: string;
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    auto_resolved: boolean;
  }>;
  digest_week_number: number;
}

class L7StateUpdater {
  private readonly STATE_FILE = path.join(process.cwd(), 'state/L7_STATE_UPDATER.json');
  private readonly ACTION_LOG_PATH = process.env.ACTION_LOG_PATH || 'data/action_log.jsonl';
  private state: L7StateUpdaterState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): L7StateUpdaterState {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        return JSON.parse(fs.readFileSync(this.STATE_FILE, 'utf-8'));
      }
    } catch (error) {
      console.error('[L7StateUpdater] Error loading state:', error);
    }
    return this.initializeState();
  }

  private initializeState(): L7StateUpdaterState {
    const now = new Date().toISOString();
    return {
      last_run: now,
      last_daily_update: now,
      last_digest_generation: now,
      overdue_action_log: [],
      daily_metrics: [],
      intervention_events: [],
      digest_week_number: this.getCurrentWeekNumber()
    };
  }

  private saveState(): void {
    try {
      const stateDir = path.dirname(this.STATE_FILE);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('[L7StateUpdater] Error saving state:', error);
    }
  }

  private getCurrentWeekNumber(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  }

  /**
   * Main update cycle - runs every 2 hours
   */
  async runUpdateCycle(): Promise<{
    success: boolean;
    updates: string[];
    overdue_count: number;
    intervention_detected: boolean;
    digest_generated: boolean;
  }> {
    const updates: string[] = [];
    let overdueCount = 0;
    let interventionDetected = false;
    let digestGenerated = false;

    console.log('[L7StateUpdater] Starting 2-hour update cycle...');

    // 1. Sweep overdue actions and log them
    const overdueResult = await this.processOverdueActions();
    overdueCount = overdueResult.count;
    if (overdueResult.count > 0) {
      updates.push(`Logged ${overdueResult.count} overdue actions`);
      if (overdueResult.intervention_required) {
        interventionDetected = true;
        updates.push('INTERVENTION DETECTED: Overdue actions require attention');
      }
    }

    // 2. Check if daily metrics need updating
    const dailyUpdate = await this.updateDailyMetrics();
    if (dailyUpdate.updated) {
      updates.push('Daily metrics snapshot captured');
    }

    // 3. Update L7 proof conditions
    const proofUpdate = await this.updateProofConditions();
    if (proofUpdate.changes.length > 0) {
      updates.push(...proofUpdate.changes);
    }

    // 4. Check for weekly digest generation
    const currentWeek = this.getCurrentWeekNumber();
    if (currentWeek > this.state.digest_week_number) {
      const digest = await this.generateWeeklyDigest();
      if (digest.success) {
        digestGenerated = true;
        this.state.digest_week_number = currentWeek;
        updates.push(`Generated Evolution Digest for week ${currentWeek - 1}`);
      }
    }

    // 5. Update days_without_intervention
    const daysUpdate = this.updateDaysWithoutIntervention(interventionDetected);
    if (daysUpdate.message) {
      updates.push(daysUpdate.message);
    }

    // 6. Log any interventions
    if (interventionDetected) {
      this.logIntervention('OVERDUE_ACTION', `${overdueCount} actions exceeded SLA`, 'MEDIUM');
    }

    // Save state
    this.state.last_run = new Date().toISOString();
    this.saveState();

    console.log(`[L7StateUpdater] Cycle complete. Updates: ${updates.length}`);
    return {
      success: true,
      updates,
      overdue_count: overdueCount,
      intervention_detected: interventionDetected,
      digest_generated: digestGenerated
    };
  }

  /**
   * Process overdue actions and connect to L7 intervention tracking
   */
  private async processOverdueActions(): Promise<{
    count: number;
    intervention_required: boolean;
    actions: OverdueActionLog[];
  }> {
    const slaHours = parseInt(process.env.OUTCOME_SLA_HOURS || '24');
    const overdueCount = sweepOverdueActions(slaHours);

    const actions: OverdueActionLog[] = [];
    let interventionRequired = false;

    // Read action log to find specific overdue actions
    if (fs.existsSync(this.ACTION_LOG_PATH)) {
      try {
        const logContent = fs.readFileSync(this.ACTION_LOG_PATH, 'utf-8');
        const lines = logContent.trim().split('\n').slice(-100); // Last 100 entries

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === 'action_overdue') {
              const logEntry: OverdueActionLog = {
                timestamp: new Date().toISOString(),
                action_id: event.action_id,
                owner_agent: event.agent || 'unknown',
                title: event.title || 'Untitled action',
                hours_overdue: Math.round((Date.now() - new Date(event.started_ts || event.ts).getTime()) / (1000 * 60 * 60)),
                escalated_to: 'ChiefOfStaff',
                intervention_required: event.risk === 'high'
              };

              actions.push(logEntry);

              if (logEntry.intervention_required) {
                interventionRequired = true;
              }
            }
          } catch {
            // Skip malformed lines
          }
        }
      } catch (error) {
        console.error('[L7StateUpdater] Error reading action log:', error);
      }
    }

    // Store overdue actions in state (keep last 50)
    this.state.overdue_action_log = [
      ...actions,
      ...this.state.overdue_action_log
    ].slice(0, 50);

    // If more than 3 high-risk overdue actions, definitely intervention required
    if (actions.filter(a => a.intervention_required).length >= 3) {
      interventionRequired = true;
    }

    return {
      count: overdueCount,
      intervention_required: interventionRequired,
      actions
    };
  }

  /**
   * Update daily metrics snapshot (once per day)
   */
  private async updateDailyMetrics(): Promise<{ updated: boolean; snapshot?: DailyMetricSnapshot }> {
    const today = new Date().toISOString().split('T')[0];
    const lastUpdateDate = this.state.last_daily_update.split('T')[0];

    if (today === lastUpdateDate) {
      return { updated: false };
    }

    // Capture daily snapshot
    const snapshot: DailyMetricSnapshot = {
      date: today,
      revenue: await this.fetchDailyRevenue(),
      governance_violations: await this.countGovernanceViolations(),
      overdue_actions: this.state.overdue_action_log.filter(a => 
        a.timestamp.startsWith(lastUpdateDate)
      ).length,
      drift_incidents: await this.countDriftIncidents()
    };

    // Keep last 90 days of metrics
    this.state.daily_metrics.push(snapshot);
    if (this.state.daily_metrics.length > 90) {
      this.state.daily_metrics = this.state.daily_metrics.slice(-90);
    }

    this.state.last_daily_update = new Date().toISOString();

    return { updated: true, snapshot };
  }

  /**
   * Update L7 proof conditions with current metrics
   */
  private async updateProofConditions(): Promise<{ changes: string[] }> {
    const changes: string[] = [];
    const now = new Date().toISOString();

    try {
      // Get current L7 state
      const l7Status = l7EvolutionProtocol.getStatus();
      
      if (l7Status.status === 'INACTIVE') {
        return { changes: [] };
      }

      // PC1: Revenue Stability - Calculate from daily metrics
      if (this.state.daily_metrics.length >= 7) {
        const revenueVariance = this.calculateRevenueVariance();
        const stableDays = this.countConsecutiveStableDays(10); // ±10% threshold

        // Update via L7 protocol
        const pc1Update = await this.updatePC1(revenueVariance, stableDays);
        if (pc1Update) {
          changes.push(`PC1 Revenue Stability: ${stableDays}/90 days (variance: ${revenueVariance.toFixed(1)}%)`);
        }
      }

      // PC2: Legal Shield - Count governance violations
      const violations = await this.countGovernanceViolations();
      const pc2Update = await this.updatePC2(violations);
      if (pc2Update) {
        changes.push(`PC2 Legal Shield: ${violations} violations`);
      }

      // PC3: Financial Autonomy - Check ROAS and profitability
      const financialMetrics = await this.getFinancialMetrics();
      const pc3Update = await this.updatePC3(financialMetrics);
      if (pc3Update) {
        changes.push(`PC3 Financial Autonomy: ${financialMetrics.profitable_months}/3 months`);
      }

    } catch (error) {
      console.error('[L7StateUpdater] Error updating proof conditions:', error);
    }

    return { changes };
  }

  private calculateRevenueVariance(): number {
    if (this.state.daily_metrics.length < 7) return 100; // Max variance if insufficient data

    const revenues = this.state.daily_metrics.map(m => m.revenue);
    const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    
    if (avg === 0) return 0;

    const maxDeviation = Math.max(...revenues.map(r => Math.abs(r - avg)));
    return (maxDeviation / avg) * 100;
  }

  private countConsecutiveStableDays(thresholdPercent: number): number {
    if (this.state.daily_metrics.length < 2) return 0;

    const revenues = this.state.daily_metrics.map(m => m.revenue);
    const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    
    if (avg === 0) return this.state.daily_metrics.length;

    let consecutiveDays = 0;
    for (let i = revenues.length - 1; i >= 0; i--) {
      const deviation = Math.abs((revenues[i] - avg) / avg) * 100;
      if (deviation <= thresholdPercent) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }

  private async updatePC1(variance: number, stableDays: number): Promise<boolean> {
    // This would update L7 state file directly
    try {
      const stateFile = path.join(process.cwd(), 'state/L7_EVOLUTION_STATE.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        const interventions = this.state.intervention_events.length;
        
        state.proof_conditions.revenue_stability.metrics.variance_rolling_30d = variance;
        state.proof_conditions.revenue_stability.metrics.consecutive_stable_days = stableDays;
        state.proof_conditions.revenue_stability.metrics.intervention_events = interventions;
        state.proof_conditions.revenue_stability.progress_percent = Math.min(100, Math.round((stableDays / 90) * 100));
        state.proof_conditions.revenue_stability.last_evaluated = new Date().toISOString();
        
        // Check if met
        if (stableDays >= 90 && variance <= 10 && interventions === 0) {
          state.proof_conditions.revenue_stability.status = 'MET';
        } else {
          state.proof_conditions.revenue_stability.status = 'IN_PROGRESS';
        }

        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
        return true;
      }
    } catch (error) {
      console.error('[L7StateUpdater] Error updating PC1:', error);
    }
    return false;
  }

  private async updatePC2(violations: number): Promise<boolean> {
    try {
      const stateFile = path.join(process.cwd(), 'state/L7_EVOLUTION_STATE.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        
        state.proof_conditions.legal_shield.metrics.critical_governance_violations = violations;
        state.proof_conditions.legal_shield.last_evaluated = new Date().toISOString();
        
        if (violations === 0) {
          state.proof_conditions.legal_shield.status = 'MET';
          state.proof_conditions.legal_shield.progress_percent = 100;
        } else {
          state.proof_conditions.legal_shield.status = 'NOT_MET';
          state.proof_conditions.legal_shield.progress_percent = 0;
        }

        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
        return true;
      }
    } catch (error) {
      console.error('[L7StateUpdater] Error updating PC2:', error);
    }
    return false;
  }

  private async updatePC3(metrics: { profitable_months: number; roas: number }): Promise<boolean> {
    try {
      const stateFile = path.join(process.cwd(), 'state/L7_EVOLUTION_STATE.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        
        state.proof_conditions.financial_autonomy.metrics.profitable_months = metrics.profitable_months;
        state.proof_conditions.financial_autonomy.metrics.paid_media_roas = metrics.roas;
        state.proof_conditions.financial_autonomy.progress_percent = Math.min(100, Math.round((metrics.profitable_months / 3) * 100));
        state.proof_conditions.financial_autonomy.last_evaluated = new Date().toISOString();
        
        if (metrics.profitable_months >= 3 && metrics.roas >= 1.2) {
          state.proof_conditions.financial_autonomy.status = 'MET';
        } else {
          state.proof_conditions.financial_autonomy.status = 'IN_PROGRESS';
        }

        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
        return true;
      }
    } catch (error) {
      console.error('[L7StateUpdater] Error updating PC3:', error);
    }
    return false;
  }

  /**
   * Update days without intervention counter
   */
  private updateDaysWithoutIntervention(interventionDetected: boolean): { message: string } {
    try {
      const stateFile = path.join(process.cwd(), 'state/L7_EVOLUTION_STATE.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        
        if (interventionDetected) {
          state.chairman_interventions = (state.chairman_interventions || 0) + 1;
          state.days_without_intervention = 0;
          fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
          return { message: 'RESET: Days without intervention counter reset due to intervention' };
        } else {
          // Calculate days since activation
          if (state.activated_at) {
            const activatedDate = new Date(state.activated_at);
            const now = new Date();
            const daysSinceActivation = Math.floor((now.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24));
            state.days_without_intervention = daysSinceActivation - state.chairman_interventions;
            fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
            return { message: `Days without intervention: ${state.days_without_intervention}` };
          }
        }
      }
    } catch (error) {
      console.error('[L7StateUpdater] Error updating days counter:', error);
    }
    return { message: '' };
  }

  /**
   * Log an intervention event
   */
  private logIntervention(type: string, description: string, severity: 'LOW' | 'MEDIUM' | 'HIGH'): void {
    this.state.intervention_events.push({
      timestamp: new Date().toISOString(),
      type,
      description,
      severity,
      auto_resolved: severity === 'LOW'
    });

    // Keep last 100 intervention events
    if (this.state.intervention_events.length > 100) {
      this.state.intervention_events = this.state.intervention_events.slice(-100);
    }

    console.log(`[L7StateUpdater] INTERVENTION LOGGED: ${type} | ${severity} | ${description}`);
  }

  /**
   * Generate weekly Evolution Digest
   */
  private async generateWeeklyDigest(): Promise<{ success: boolean; digest_id?: string }> {
    try {
      const weekNumber = this.getCurrentWeekNumber() - 1;
      const digestId = `DIGEST-W${weekNumber}-${nanoid(6)}`;
      
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Gather metrics from the past week
      const weekMetrics = this.state.daily_metrics.filter(m => 
        new Date(m.date) >= weekStart
      );

      const experiments = await this.getWeekExperiments();
      const promotedCount = experiments.filter(e => e.status === 'PROMOTED').length;

      const digest = {
        digest_id: digestId,
        week_number: weekNumber,
        generated_at: now.toISOString(),
        period: {
          start: weekStart.toISOString(),
          end: now.toISOString()
        },
        summary: {
          experiments_run: experiments.length,
          experiments_promoted: promotedCount,
          revenue_delta_percent: this.calculateWeeklyRevenueDelta(weekMetrics),
          safety_incidents: this.state.intervention_events.filter(e => 
            new Date(e.timestamp) >= weekStart && e.severity === 'HIGH'
          ).length,
          proof_conditions_progress: await this.getProofConditionsProgress()
        },
        highlights: this.generateHighlights(weekMetrics, experiments),
        concerns: this.generateConcerns(weekMetrics),
        next_evolution_targets: this.generateNextTargets()
      };

      // Save digest to L7 state
      const stateFile = path.join(process.cwd(), 'state/L7_EVOLUTION_STATE.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        state.evolution_digests = state.evolution_digests || [];
        state.evolution_digests.push(digest);
        // Keep last 12 digests (3 months)
        if (state.evolution_digests.length > 12) {
          state.evolution_digests = state.evolution_digests.slice(-12);
        }
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
      }

      this.state.last_digest_generation = now.toISOString();
      console.log(`[L7StateUpdater] Evolution Digest generated: ${digestId}`);

      return { success: true, digest_id: digestId };
    } catch (error) {
      console.error('[L7StateUpdater] Error generating digest:', error);
      return { success: false };
    }
  }

  // Helper methods for data fetching

  private async fetchDailyRevenue(): Promise<number> {
    // Would integrate with Stripe or financial tracking
    // For now, return simulated value based on time
    return Math.round(Math.random() * 500 + 100);
  }

  private async countGovernanceViolations(): Promise<number> {
    try {
      if (fs.existsSync(this.ACTION_LOG_PATH)) {
        const content = fs.readFileSync(this.ACTION_LOG_PATH, 'utf-8');
        const lines = content.trim().split('\n');
        let violations = 0;
        
        for (const line of lines.slice(-200)) {
          try {
            const event = JSON.parse(line);
            if (event.type === 'escalation' || event.type === 'governance_violation') {
              violations++;
            }
          } catch {}
        }
        return violations;
      }
    } catch {}
    return 0;
  }

  private async countDriftIncidents(): Promise<number> {
    // Check L6 shadow mode or drift detector state
    try {
      const driftFile = path.join(process.cwd(), 'state/L6_SHADOW_MODE_CONFIG.json');
      if (fs.existsSync(driftFile)) {
        const state = JSON.parse(fs.readFileSync(driftFile, 'utf-8'));
        return state.drift_incidents_24h || 0;
      }
    } catch {}
    return 0;
  }

  private async getFinancialMetrics(): Promise<{ profitable_months: number; roas: number }> {
    // Would integrate with actual financial tracking
    // Calculate from monthly revenue trends
    const monthlyRevenues = this.aggregateMonthlyRevenue();
    const profitableMonths = monthlyRevenues.filter(r => r > 0).length;
    
    // Get ROAS from SCL if available
    let roas = 0;
    try {
      const l7State = path.join(process.cwd(), 'state/L7_EVOLUTION_STATE.json');
      if (fs.existsSync(l7State)) {
        const state = JSON.parse(fs.readFileSync(l7State, 'utf-8'));
        // Would calculate from actual ad spend vs revenue
        roas = 1.0 + Math.random() * 0.5; // Simulated for now
      }
    } catch {}

    return { profitable_months: profitableMonths, roas };
  }

  private aggregateMonthlyRevenue(): number[] {
    const monthly: Record<string, number> = {};
    
    for (const metric of this.state.daily_metrics) {
      const month = metric.date.substring(0, 7);
      monthly[month] = (monthly[month] || 0) + metric.revenue;
    }

    return Object.values(monthly);
  }

  private async getWeekExperiments(): Promise<Array<{ status: string }>> {
    try {
      const stateFile = path.join(process.cwd(), 'state/L7_EVOLUTION_STATE.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        return state.sandbox?.experiments || [];
      }
    } catch {}
    return [];
  }

  private calculateWeeklyRevenueDelta(weekMetrics: DailyMetricSnapshot[]): number {
    if (weekMetrics.length < 2) return 0;
    
    const firstHalf = weekMetrics.slice(0, Math.floor(weekMetrics.length / 2));
    const secondHalf = weekMetrics.slice(Math.floor(weekMetrics.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b.revenue, 0) / firstHalf.length || 1;
    const secondAvg = secondHalf.reduce((a, b) => a + b.revenue, 0) / secondHalf.length || 0;
    
    return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
  }

  private async getProofConditionsProgress(): Promise<Record<string, number>> {
    try {
      const stateFile = path.join(process.cwd(), 'state/L7_EVOLUTION_STATE.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        return {
          revenue_stability: state.proof_conditions.revenue_stability.progress_percent,
          legal_shield: state.proof_conditions.legal_shield.progress_percent,
          financial_autonomy: state.proof_conditions.financial_autonomy.progress_percent
        };
      }
    } catch {}
    return { revenue_stability: 0, legal_shield: 0, financial_autonomy: 0 };
  }

  private generateHighlights(metrics: DailyMetricSnapshot[], experiments: any[]): string[] {
    const highlights: string[] = [];
    
    if (experiments.length > 0) {
      highlights.push(`${experiments.length} sandbox experiments executed`);
    }
    
    if (metrics.length > 0) {
      const avgRevenue = metrics.reduce((a, b) => a + b.revenue, 0) / metrics.length;
      highlights.push(`Average daily revenue: $${avgRevenue.toFixed(2)}`);
    }
    
    const violations = metrics.reduce((a, b) => a + b.governance_violations, 0);
    if (violations === 0) {
      highlights.push('Zero governance violations - Legal Shield maintained');
    }

    if (this.state.intervention_events.filter(e => e.auto_resolved).length > 0) {
      highlights.push('System auto-resolved minor interventions');
    }

    return highlights;
  }

  private generateConcerns(metrics: DailyMetricSnapshot[]): string[] {
    const concerns: string[] = [];
    
    const overdueTotal = metrics.reduce((a, b) => a + b.overdue_actions, 0);
    if (overdueTotal > 5) {
      concerns.push(`${overdueTotal} overdue actions detected - review action execution pipeline`);
    }

    const highSeverity = this.state.intervention_events.filter(e => e.severity === 'HIGH').length;
    if (highSeverity > 0) {
      concerns.push(`${highSeverity} high-severity interventions occurred`);
    }

    const driftTotal = metrics.reduce((a, b) => a + b.drift_incidents, 0);
    if (driftTotal > 0) {
      concerns.push(`${driftTotal} drift incidents detected`);
    }

    return concerns;
  }

  private generateNextTargets(): string[] {
    return [
      'Continue revenue stability tracking toward 90-day threshold',
      'Maintain zero governance violations for Legal Shield',
      'Promote at least one sandbox experiment to production',
      'Achieve ROAS ≥1.2 for Financial Autonomy proof'
    ];
  }

  /**
   * Get current state for API responses
   */
  getState(): L7StateUpdaterState {
    return this.state;
  }

  /**
   * Get overdue action summary
   */
  getOverdueActionSummary(): {
    total_logged: number;
    last_24h: number;
    high_risk_count: number;
    recent: OverdueActionLog[];
  } {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const last24h = this.state.overdue_action_log.filter(a => 
      new Date(a.timestamp) >= dayAgo
    );

    return {
      total_logged: this.state.overdue_action_log.length,
      last_24h: last24h.length,
      high_risk_count: this.state.overdue_action_log.filter(a => a.intervention_required).length,
      recent: this.state.overdue_action_log.slice(0, 10)
    };
  }

  /**
   * Get intervention event history
   */
  getInterventionHistory(): {
    total: number;
    by_severity: Record<string, number>;
    auto_resolved_rate: number;
    recent: L7StateUpdaterState['intervention_events'];
  } {
    const bySeverity = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    let autoResolved = 0;

    for (const event of this.state.intervention_events) {
      bySeverity[event.severity]++;
      if (event.auto_resolved) autoResolved++;
    }

    return {
      total: this.state.intervention_events.length,
      by_severity: bySeverity,
      auto_resolved_rate: this.state.intervention_events.length > 0 
        ? Math.round((autoResolved / this.state.intervention_events.length) * 100)
        : 100,
      recent: this.state.intervention_events.slice(-10)
    };
  }
}

export const l7StateUpdater = new L7StateUpdater();
