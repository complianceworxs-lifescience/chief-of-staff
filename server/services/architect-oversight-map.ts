/**
 * 7-DAY ARCHITECT OVERSIGHT MAP SERVICE
 * 
 * Implements structured daily monitoring and decision-making for the
 * L6 Acceleration Protocol. This is the Architect's command view for
 * tracking system health and making targeted corrections.
 * 
 * Scope: L5_system, L6_acceleration
 * Horizon: 7 days
 */

import { l6AccelerationProtocol } from './l6-acceleration-protocol';

export interface MetricTracked {
  name: string;
  source: string;
  target: string;
  currentValue: number | string;
  targetMet: boolean;
  alertActive: boolean;
  alertType: 'below' | 'exceeds' | 'not_improving' | 'above_zero' | null;
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  history: { timestamp: string; value: number | string }[];
}

export interface DayFocus {
  day: number;
  focus: string[];
  status: 'pending' | 'current' | 'completed';
  completedAt: string | null;
  findings: string[];
  corrections: string[];
}

export interface ArchitectDailyView {
  systemHealthIndex: number;
  revenueStabilityStatus: { weeksHit: number; target: number; display: string };
  rpmConfidence: { current: number; trend7d: 'up' | 'down' | 'flat'; history: number[] };
  udlFreshness: { maxStalenessMinutes: number; targetMet: boolean };
  benchmarkPostImpact: { deltaSignalDensity: number; volumeMultiplier: number };
  microOfferBacklogDelta: { change24h: number; remaining: number; percentCleared: number };
  escalationsFromCoS: { id: string; description: string; severity: string; timestamp: string }[];
  l6ReadinessScore: { score: number; note: string };
}

export interface ArchitectDecision {
  id: string;
  day: number;
  timestamp: string;
  decision: 'no_action_required' | 'minor_correction_to_cos' | 'major_correction_request_to_strategist' | 'freeze_specific_agent' | 'reset_specific_metric_window';
  target?: string;
  reasoning: string;
  implemented: boolean;
}

export interface DailyCycleReport {
  day: number;
  date: string;
  generatedAt: string;
  inputs: {
    cosStatusReport: object | null;
    strategistRpmReport: object | null;
    cmoSignalReport: object | null;
    croPipelineReport: object | null;
    contentObjectionReport: object | null;
  };
  outputs: {
    readinessDecision: 'improving' | 'stalled' | 'at_risk' | 'on_track';
    targetedCorrections: string[];
  };
  architectView: ArchitectDailyView;
  focusAreas: string[];
  metricsSnapshot: MetricTracked[];
  alertsTriggered: string[];
}

export interface ArchitectOversightMap {
  name: string;
  scope: string;
  horizonDays: number;
  activatedAt: string;
  currentDay: number;
  objectives: string[];
  metricsTracked: MetricTracked[];
  dailyFocus: DayFocus[];
  dailyReports: DailyCycleReport[];
  decisions: ArchitectDecision[];
  safetyGuards: {
    l6Activation: string;
    methodologyLock: string;
    offerLadderChanges: string;
    positioningChanges: string;
    experimentAudienceCapPercent: number;
  };
  verdict: 'pending' | 'improving' | 'stalled' | null;
}

class ArchitectOversightMapService {
  private oversightMap: ArchitectOversightMap | null = null;
  private dailyCycleInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the 7-Day Architect Oversight Map
   */
  initialize(): ArchitectOversightMap {
    const now = new Date();

    this.oversightMap = {
      name: 'architect_oversight_map_7d',
      scope: 'L5_system, L6_acceleration',
      horizonDays: 7,
      activatedAt: now.toISOString(),
      currentDay: 1,
      objectives: [
        'Stabilize Revenue Stability toward 4/6 weeks',
        'Increase RPM Confidence toward >= 0.95',
        'Maintain strict L5 safety and L6 lock'
      ],
      metricsTracked: this.initializeMetrics(),
      dailyFocus: this.initializeDayByDayFocus(),
      dailyReports: [],
      decisions: [],
      safetyGuards: {
        l6Activation: 'PROHIBITED',
        methodologyLock: 'ENFORCED',
        offerLadderChanges: 'PROHIBITED',
        positioningChanges: 'PROHIBITED',
        experimentAudienceCapPercent: 5
      },
      verdict: 'pending'
    };

    this.oversightMap.dailyFocus[0].status = 'current';

    this.generateDailyCycleReport();

    console.log('[ARCHITECT-OVERSIGHT] 7-Day Oversight Map initialized');
    return this.oversightMap;
  }

  /**
   * Initialize tracked metrics with current values
   */
  private initializeMetrics(): MetricTracked[] {
    const protocol = l6AccelerationProtocol.getStatus();
    const now = new Date().toISOString();

    return [
      {
        name: 'revenue_stability_weeks',
        source: 'CRO + CoS',
        target: '>= 4/6',
        currentValue: protocol?.metrics.revenueStabilityWeeks || 2,
        targetMet: (protocol?.metrics.revenueStabilityWeeks || 0) >= 4,
        alertActive: (protocol?.metrics.revenueStabilityWeeks || 0) < 4,
        alertType: 'below',
        trend: 'unknown',
        history: [{ timestamp: now, value: protocol?.metrics.revenueStabilityWeeks || 2 }]
      },
      {
        name: 'rpm_confidence',
        source: 'Strategist',
        target: '>= 0.95',
        currentValue: protocol?.metrics.rpmConfidence || 0.82,
        targetMet: (protocol?.metrics.rpmConfidence || 0) >= 0.95,
        alertActive: (protocol?.metrics.rpmConfidence || 0) < 0.95,
        alertType: 'below',
        trend: 'unknown',
        history: [{ timestamp: now, value: protocol?.metrics.rpmConfidence || 0.82 }]
      },
      {
        name: 'udl_freshness_minutes',
        source: 'CoS',
        target: '<= 30',
        currentValue: 0,
        targetMet: true,
        alertActive: false,
        alertType: 'exceeds',
        trend: 'stable',
        history: [{ timestamp: now, value: 0 }]
      },
      {
        name: 'benchmark_post_volume',
        source: 'CMO',
        target: '3x_baseline',
        currentValue: protocol?.metrics.benchmarkPostsDelivered || 0,
        targetMet: (protocol?.metrics.benchmarkPostsDelivered || 0) >= 6,
        alertActive: (protocol?.metrics.benchmarkPostsDelivered || 0) < 6,
        alertType: 'below',
        trend: 'unknown',
        history: [{ timestamp: now, value: protocol?.metrics.benchmarkPostsDelivered || 0 }]
      },
      {
        name: 'micro_offer_backlog',
        source: 'CRO',
        target: 'cleared_or_trending_down',
        currentValue: 15 - (protocol?.metrics.microOffersCleared || 0),
        targetMet: (protocol?.metrics.microOffersCleared || 0) >= 15,
        alertActive: false,
        alertType: 'not_improving',
        trend: 'unknown',
        history: [{ timestamp: now, value: 15 - (protocol?.metrics.microOffersCleared || 0) }]
      },
      {
        name: 'drift_incidents_24h',
        source: 'CoS',
        target: '0',
        currentValue: 0,
        targetMet: true,
        alertActive: false,
        alertType: 'above_zero',
        trend: 'stable',
        history: [{ timestamp: now, value: 0 }]
      }
    ];
  }

  /**
   * Initialize day-by-day focus areas
   */
  private initializeDayByDayFocus(): DayFocus[] {
    return [
      {
        day: 1,
        focus: [
          'Confirm L6 Acceleration Protocol applied correctly',
          'Verify UDL sync interval is truly <= 30 minutes',
          'Baseline RPM Confidence and Revenue Stability'
        ],
        status: 'pending',
        completedAt: null,
        findings: [],
        corrections: []
      },
      {
        day: 2,
        focus: [
          'Check RPM Confidence delta vs Day 1',
          'Check initial effect of 3x Benchmark Posts',
          'Confirm CRO has begun clearing Tier 1 backlog'
        ],
        status: 'pending',
        completedAt: null,
        findings: [],
        corrections: []
      },
      {
        day: 3,
        focus: [
          'Identify persistent friction in pipeline stages',
          'Verify no new objection clusters',
          'Adjust CoS priorities if any metric is flat or negative'
        ],
        status: 'pending',
        completedAt: null,
        findings: [],
        corrections: []
      },
      {
        day: 4,
        focus: [
          'Evaluate trend toward 4/6 revenue stability',
          'Check RPM Confidence trajectory against 0.95 target',
          'Ensure no drift in Offer Ladder or positioning'
        ],
        status: 'pending',
        completedAt: null,
        findings: [],
        corrections: []
      },
      {
        day: 5,
        focus: [
          'Confirm backlog is substantially reduced or cleared',
          'Confirm Benchmark Posts are impacting high-intent signals',
          'Ensure CoS escalations have been addressed'
        ],
        status: 'pending',
        completedAt: null,
        findings: [],
        corrections: []
      },
      {
        day: 6,
        focus: [
          'Assess whether metrics are converging or plateauing',
          'Decide if additional micro-corrections are needed',
          'Confirm no L6 behavior has been activated'
        ],
        status: 'pending',
        completedAt: null,
        findings: [],
        corrections: []
      },
      {
        day: 7,
        focus: [
          'Render an Architect verdict: IMPROVING / STALLED',
          'If IMPROVING: define next 7-day refinement cycle',
          'If STALLED: instruct Strategist + CoS to generate a root-cause plan'
        ],
        status: 'pending',
        completedAt: null,
        findings: [],
        corrections: []
      }
    ];
  }

  /**
   * Generate Architect Daily View
   */
  getArchitectDailyView(): ArchitectDailyView {
    const protocol = l6AccelerationProtocol.getStatus();
    
    const revenueStabilityWeeks = protocol?.metrics.revenueStabilityWeeks || 2;
    const rpmConfidence = protocol?.metrics.rpmConfidence || 0.82;
    const rpmMetric = this.oversightMap?.metricsTracked.find(m => m.name === 'rpm_confidence');
    const rpmHistory = rpmMetric?.history.slice(-7).map(h => h.value as number) || [rpmConfidence];
    
    const rpmTrend = rpmHistory.length >= 2 
      ? (rpmHistory[rpmHistory.length - 1] > rpmHistory[0] ? 'up' : rpmHistory[rpmHistory.length - 1] < rpmHistory[0] ? 'down' : 'flat')
      : 'flat';

    const udlLog = l6AccelerationProtocol.getUdlSyncLog();
    const lastSync = udlLog.length > 0 ? new Date(udlLog[udlLog.length - 1].timestamp) : new Date();
    const staleness = Math.round((new Date().getTime() - lastSync.getTime()) / 60000);

    const backlogRemaining = 15 - (protocol?.metrics.microOffersCleared || 0);
    const previousBacklog = this.oversightMap?.metricsTracked.find(m => m.name === 'micro_offer_backlog')?.history.slice(-2)[0]?.value as number || 15;
    const backlogDelta = backlogRemaining - previousBacklog;

    const systemHealth = this.calculateSystemHealthIndex();

    return {
      systemHealthIndex: systemHealth,
      revenueStabilityStatus: {
        weeksHit: Math.round(revenueStabilityWeeks),
        target: 6,
        display: `${Math.round(revenueStabilityWeeks)}/6 weeks`
      },
      rpmConfidence: {
        current: rpmConfidence,
        trend7d: rpmTrend,
        history: rpmHistory
      },
      udlFreshness: {
        maxStalenessMinutes: staleness,
        targetMet: staleness <= 30
      },
      benchmarkPostImpact: {
        deltaSignalDensity: (protocol?.metrics.benchmarkPostsDelivered || 0) * 0.05,
        volumeMultiplier: 3
      },
      microOfferBacklogDelta: {
        change24h: backlogDelta,
        remaining: backlogRemaining,
        percentCleared: Math.round((protocol?.metrics.microOffersCleared || 0) / 15 * 100)
      },
      escalationsFromCoS: [],
      l6ReadinessScore: {
        score: protocol?.metrics.l6ReadinessScore || 0,
        note: 'L6 LOCKED - informational only'
      }
    };
  }

  /**
   * Calculate System Health Index (0-100)
   */
  private calculateSystemHealthIndex(): number {
    const protocol = l6AccelerationProtocol.getStatus();
    if (!protocol) return 50;

    let score = 0;
    
    const rpmProgress = Math.min(100, (protocol.metrics.rpmConfidence / 0.95) * 100);
    score += rpmProgress * 0.3;

    const revenueProgress = Math.min(100, (protocol.metrics.revenueStabilityWeeks / 4) * 100);
    score += revenueProgress * 0.3;

    const backlogProgress = Math.min(100, (protocol.metrics.microOffersCleared / 15) * 100);
    score += backlogProgress * 0.2;

    const udlLog = l6AccelerationProtocol.getUdlSyncLog();
    const udlHealth = udlLog.length > 0 ? 100 : 50;
    score += udlHealth * 0.1;

    const benchmarkProgress = Math.min(100, (protocol.metrics.benchmarkPostsDelivered / 18) * 100);
    score += benchmarkProgress * 0.1;

    return Math.round(score);
  }

  /**
   * Generate Daily Cycle Report
   */
  generateDailyCycleReport(): DailyCycleReport {
    if (!this.oversightMap) {
      throw new Error('Oversight map not initialized');
    }

    const day = this.oversightMap.currentDay;
    const now = new Date();
    const view = this.getArchitectDailyView();
    const protocol = l6AccelerationProtocol.getStatus();

    this.updateMetrics();

    const alerts: string[] = [];
    for (const metric of this.oversightMap.metricsTracked) {
      if (metric.alertActive) {
        alerts.push(`${metric.name}: ${metric.currentValue} (target: ${metric.target})`);
      }
    }

    const focusAreas = this.oversightMap.dailyFocus[day - 1]?.focus || [];

    let readinessDecision: 'improving' | 'stalled' | 'at_risk' | 'on_track' = 'on_track';
    if (view.systemHealthIndex >= 80) {
      readinessDecision = 'improving';
    } else if (view.systemHealthIndex >= 60) {
      readinessDecision = 'on_track';
    } else if (view.systemHealthIndex >= 40) {
      readinessDecision = 'at_risk';
    } else {
      readinessDecision = 'stalled';
    }

    const targetedCorrections: string[] = [];
    if (view.rpmConfidence.current < 0.90) {
      targetedCorrections.push('CoS: Increase UDL sync frequency monitoring');
    }
    if (view.revenueStabilityStatus.weeksHit < 3) {
      targetedCorrections.push('CRO: Prioritize high-impact micro-offers');
    }
    if (!view.udlFreshness.targetMet) {
      targetedCorrections.push('CoS: Investigate UDL sync delays');
    }

    const report: DailyCycleReport = {
      day,
      date: now.toISOString().split('T')[0],
      generatedAt: now.toISOString(),
      inputs: {
        cosStatusReport: { syncs: protocol?.metrics.udlSyncCount || 0, status: 'active' },
        strategistRpmReport: { confidence: protocol?.metrics.rpmConfidence || 0 },
        cmoSignalReport: { posts: protocol?.metrics.benchmarkPostsDelivered || 0 },
        croPipelineReport: { cleared: protocol?.metrics.microOffersCleared || 0 },
        contentObjectionReport: { newClusters: 0 }
      },
      outputs: {
        readinessDecision,
        targetedCorrections
      },
      architectView: view,
      focusAreas,
      metricsSnapshot: JSON.parse(JSON.stringify(this.oversightMap.metricsTracked)),
      alertsTriggered: alerts
    };

    this.oversightMap.dailyReports.push(report);

    return report;
  }

  /**
   * Update all tracked metrics
   */
  private updateMetrics(): void {
    if (!this.oversightMap) return;

    const protocol = l6AccelerationProtocol.getStatus();
    const now = new Date().toISOString();

    for (const metric of this.oversightMap.metricsTracked) {
      const previousValue = metric.currentValue;

      switch (metric.name) {
        case 'revenue_stability_weeks':
          metric.currentValue = protocol?.metrics.revenueStabilityWeeks || 2;
          metric.targetMet = (metric.currentValue as number) >= 4;
          metric.alertActive = !metric.targetMet;
          break;
        case 'rpm_confidence':
          metric.currentValue = protocol?.metrics.rpmConfidence || 0.82;
          metric.targetMet = (metric.currentValue as number) >= 0.95;
          metric.alertActive = !metric.targetMet;
          break;
        case 'benchmark_post_volume':
          metric.currentValue = protocol?.metrics.benchmarkPostsDelivered || 0;
          metric.targetMet = (metric.currentValue as number) >= 6;
          metric.alertActive = !metric.targetMet;
          break;
        case 'micro_offer_backlog':
          metric.currentValue = 15 - (protocol?.metrics.microOffersCleared || 0);
          metric.targetMet = (metric.currentValue as number) === 0;
          const prevBacklog = metric.history.length > 0 ? metric.history[metric.history.length - 1].value as number : 15;
          metric.alertActive = (metric.currentValue as number) >= prevBacklog;
          break;
      }

      if (typeof metric.currentValue === 'number' && typeof previousValue === 'number') {
        if (metric.currentValue > previousValue) {
          metric.trend = metric.name === 'micro_offer_backlog' ? 'declining' : 'improving';
        } else if (metric.currentValue < previousValue) {
          metric.trend = metric.name === 'micro_offer_backlog' ? 'improving' : 'declining';
        } else {
          metric.trend = 'stable';
        }
      }

      metric.history.push({ timestamp: now, value: metric.currentValue });
      if (metric.history.length > 7) {
        metric.history = metric.history.slice(-7);
      }
    }
  }

  /**
   * Record an Architect decision
   */
  recordDecision(
    decision: ArchitectDecision['decision'],
    reasoning: string,
    target?: string
  ): ArchitectDecision {
    if (!this.oversightMap) {
      throw new Error('Oversight map not initialized');
    }

    const decisionRecord: ArchitectDecision = {
      id: `AD-${Date.now()}`,
      day: this.oversightMap.currentDay,
      timestamp: new Date().toISOString(),
      decision,
      target,
      reasoning,
      implemented: false
    };

    this.oversightMap.decisions.push(decisionRecord);

    if (decision === 'minor_correction_to_cos' || decision === 'major_correction_request_to_strategist') {
      const currentFocus = this.oversightMap.dailyFocus[this.oversightMap.currentDay - 1];
      if (currentFocus) {
        currentFocus.corrections.push(`${decision}: ${reasoning}`);
      }
    }

    return decisionRecord;
  }

  /**
   * Complete current day and advance to next
   */
  advanceDay(): { previousDay: number; newDay: number; verdict?: string } {
    if (!this.oversightMap) {
      throw new Error('Oversight map not initialized');
    }

    const previousDay = this.oversightMap.currentDay;
    
    const currentFocus = this.oversightMap.dailyFocus[previousDay - 1];
    if (currentFocus) {
      currentFocus.status = 'completed';
      currentFocus.completedAt = new Date().toISOString();
    }

    if (previousDay < 7) {
      this.oversightMap.currentDay = previousDay + 1;
      const nextFocus = this.oversightMap.dailyFocus[this.oversightMap.currentDay - 1];
      if (nextFocus) {
        nextFocus.status = 'current';
      }
      
      this.generateDailyCycleReport();

      return { previousDay, newDay: this.oversightMap.currentDay };
    } else {
      const verdict = this.renderVerdict();
      return { previousDay, newDay: 7, verdict };
    }
  }

  /**
   * Render final Architect verdict on Day 7
   */
  renderVerdict(): 'improving' | 'stalled' {
    if (!this.oversightMap) {
      throw new Error('Oversight map not initialized');
    }

    const view = this.getArchitectDailyView();
    
    const improving = 
      view.systemHealthIndex >= 70 &&
      view.rpmConfidence.trend7d !== 'down' &&
      view.revenueStabilityStatus.weeksHit >= 3;

    this.oversightMap.verdict = improving ? 'improving' : 'stalled';

    const verdict = this.oversightMap.verdict;
    const currentFocus = this.oversightMap.dailyFocus[6];
    
    if (currentFocus) {
      if (verdict === 'improving') {
        currentFocus.findings.push('System metrics trending positively');
        currentFocus.findings.push('Recommend: Define next 7-day refinement cycle');
      } else {
        currentFocus.findings.push('System metrics stalled or declining');
        currentFocus.findings.push('Recommend: Strategist + CoS to generate root-cause plan');
      }
    }

    console.log(`[ARCHITECT-OVERSIGHT] Day 7 Verdict: ${verdict.toUpperCase()}`);
    return verdict;
  }

  /**
   * Add finding to current day
   */
  addFinding(finding: string): void {
    if (!this.oversightMap) return;

    const currentFocus = this.oversightMap.dailyFocus[this.oversightMap.currentDay - 1];
    if (currentFocus) {
      currentFocus.findings.push(finding);
    }
  }

  /**
   * Get current oversight map status
   */
  getStatus(): ArchitectOversightMap | null {
    return this.oversightMap;
  }

  /**
   * Get alerts currently triggered
   */
  getActiveAlerts(): { metric: string; value: number | string; target: string; type: string }[] {
    if (!this.oversightMap) return [];

    return this.oversightMap.metricsTracked
      .filter(m => m.alertActive)
      .map(m => ({
        metric: m.name,
        value: m.currentValue,
        target: m.target,
        type: m.alertType || 'unknown'
      }));
  }

  /**
   * Get decision options for current day
   */
  getDecisionSpace(): string[] {
    return [
      'no_action_required',
      'minor_correction_to_cos',
      'major_correction_request_to_strategist',
      'freeze_specific_agent',
      'reset_specific_metric_window'
    ];
  }

  /**
   * Get safety guard status
   */
  getSafetyGuards(): ArchitectOversightMap['safetyGuards'] | null {
    return this.oversightMap?.safetyGuards || null;
  }
}

export const architectOversightMap = new ArchitectOversightMapService();
