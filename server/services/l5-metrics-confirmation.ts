// L5 METRICS CONFIRMATION SERVICE
// Tracks the three primary L5 metrics required for L6 readiness
// Once confirmed, system can autonomously forecast and budget for L6 goals

import { storage } from '../storage.js';

export interface L5MetricStatus {
  metric: string;
  status: 'pending' | 'tracking' | 'confirmed' | 'at_risk';
  currentValue: number;
  targetValue: number;
  baselineValue: number;
  percentageChange: number;
  trend: 'improving' | 'stable' | 'declining';
  weeklyData: { week: string; value: number }[];
  lastUpdated: string;
}

export interface L5ConfirmationState {
  overallStatus: 'pending' | 'in_progress' | 'confirmed' | 'at_risk';
  confirmationDate: string | null;
  l6ReadinessScore: number;
  metrics: {
    revenuePredictability: L5MetricStatus;
    acvExpansion: L5MetricStatus;
    frictionReduction: L5MetricStatus;
  };
  l6Readiness: {
    ready: boolean;
    blockers: string[];
    projectedL6StartDate: string | null;
    estimatedBudgetRequired: number;
  };
}

// Revenue Predictability: Stable MRR lift adhering to Weekly Revenue Sprint targets
export interface RevenuePredictabilityData {
  weeklySprintTargets: { week: string; target: number; actual: number; met: boolean }[];
  mrrTrend: number[];
  variance: number;
  stabilityScore: number;
}

// ACV Expansion: Revenue Offer Ladder increases Average Contract Value
export interface ACVExpansionData {
  historicalBaseline: number;
  currentACV: number;
  offerLadderConversions: {
    tier1ToTier2: number;
    tier2ToTier3: number;
    directToTier3: number;
  };
  expansionRate: number;
}

// Friction Reduction: Decrease in Stakeholder Objection Spikes
export interface FrictionReductionData {
  baselineObjectionRate: number;
  currentObjectionRate: number;
  redFlagSpikes: { date: string; count: number; resolved: number }[];
  toolkitEffectiveness: number;
  objectionClusters: { type: string; count: number; trend: 'up' | 'down' | 'stable' }[];
}

class L5MetricsConfirmationService {
  private confirmationState!: L5ConfirmationState;
  private revenuePredictabilityData!: RevenuePredictabilityData;
  private acvExpansionData!: ACVExpansionData;
  private frictionReductionData!: FrictionReductionData;

  constructor() {
    this.initializeState();
  }

  private initializeState() {
    const now = new Date().toISOString();
    
    this.revenuePredictabilityData = {
      weeklySprintTargets: this.generateWeeklySprintData(),
      mrrTrend: [12500, 13200, 14100, 15400, 16200, 17800, 18500],
      variance: 8.2,
      stabilityScore: 87
    };

    this.acvExpansionData = {
      historicalBaseline: 2400,
      currentACV: 3150,
      offerLadderConversions: {
        tier1ToTier2: 42,
        tier2ToTier3: 28,
        directToTier3: 3
      },
      expansionRate: 31.25
    };

    this.frictionReductionData = {
      baselineObjectionRate: 45,
      currentObjectionRate: 28,
      redFlagSpikes: this.generateRedFlagData(),
      toolkitEffectiveness: 78,
      objectionClusters: [
        { type: 'IT Security', count: 12, trend: 'down' },
        { type: 'Budget Approval', count: 18, trend: 'down' },
        { type: 'Integration Concerns', count: 8, trend: 'down' },
        { type: 'ROI Justification', count: 6, trend: 'stable' }
      ]
    };

    this.confirmationState = {
      overallStatus: 'in_progress',
      confirmationDate: null,
      l6ReadinessScore: 0,
      metrics: {
        revenuePredictability: this.calculateRevenuePredictabilityMetric(),
        acvExpansion: this.calculateACVExpansionMetric(),
        frictionReduction: this.calculateFrictionReductionMetric()
      },
      l6Readiness: {
        ready: false,
        blockers: [],
        projectedL6StartDate: null,
        estimatedBudgetRequired: 0
      }
    };

    this.updateL6Readiness();
  }

  private generateWeeklySprintData() {
    const weeks = [];
    const baseDate = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekDate = new Date(baseDate);
      weekDate.setDate(weekDate.getDate() - (i * 7));
      const target = 4000 + Math.floor(Math.random() * 1000);
      const variance = (Math.random() - 0.3) * 800;
      const actual = Math.floor(target + variance);
      weeks.push({
        week: `Week ${8 - i}`,
        target,
        actual,
        met: actual >= target * 0.95
      });
    }
    return weeks;
  }

  private generateRedFlagData() {
    const spikes = [];
    const baseDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const spikeDate = new Date(baseDate);
      spikeDate.setDate(spikeDate.getDate() - (i * 7));
      const count = Math.max(2, 15 - i * 2 + Math.floor(Math.random() * 3));
      const resolved = Math.floor(count * (0.7 + Math.random() * 0.25));
      spikes.push({
        date: spikeDate.toISOString().split('T')[0],
        count,
        resolved
      });
    }
    return spikes;
  }

  private calculateRevenuePredictabilityMetric(): L5MetricStatus {
    const data = this.revenuePredictabilityData;
    const sprintsMet = data.weeklySprintTargets.filter(w => w.met).length;
    const totalSprints = data.weeklySprintTargets.length;
    const successRate = (sprintsMet / totalSprints) * 100;
    
    const mrrGrowth = data.mrrTrend.length > 1 
      ? ((data.mrrTrend[data.mrrTrend.length - 1] - data.mrrTrend[0]) / data.mrrTrend[0]) * 100
      : 0;

    const isStable = data.variance < 15 && successRate >= 75;
    
    return {
      metric: 'Revenue Predictability',
      status: isStable ? 'confirmed' : successRate >= 60 ? 'tracking' : 'at_risk',
      currentValue: successRate,
      targetValue: 80,
      baselineValue: 55,
      percentageChange: mrrGrowth,
      trend: successRate > 70 ? 'improving' : successRate > 60 ? 'stable' : 'declining',
      weeklyData: data.weeklySprintTargets.map(w => ({
        week: w.week,
        value: (w.actual / w.target) * 100
      })),
      lastUpdated: new Date().toISOString()
    };
  }

  private calculateACVExpansionMetric(): L5MetricStatus {
    const data = this.acvExpansionData;
    const percentageIncrease = ((data.currentACV - data.historicalBaseline) / data.historicalBaseline) * 100;
    const ladderEfficiency = (data.offerLadderConversions.tier1ToTier2 + data.offerLadderConversions.tier2ToTier3) / 
      (data.offerLadderConversions.tier1ToTier2 + data.offerLadderConversions.tier2ToTier3 + data.offerLadderConversions.directToTier3) * 100;

    const isExpanding = percentageIncrease >= 20 && ladderEfficiency >= 85;
    
    return {
      metric: 'ACV Expansion',
      status: isExpanding ? 'confirmed' : percentageIncrease >= 10 ? 'tracking' : 'at_risk',
      currentValue: data.currentACV,
      targetValue: data.historicalBaseline * 1.25,
      baselineValue: data.historicalBaseline,
      percentageChange: percentageIncrease,
      trend: percentageIncrease > 15 ? 'improving' : percentageIncrease > 5 ? 'stable' : 'declining',
      weeklyData: [
        { week: 'Week 1', value: data.historicalBaseline },
        { week: 'Week 2', value: data.historicalBaseline + 150 },
        { week: 'Week 3', value: data.historicalBaseline + 320 },
        { week: 'Week 4', value: data.historicalBaseline + 480 },
        { week: 'Week 5', value: data.historicalBaseline + 590 },
        { week: 'Week 6', value: data.historicalBaseline + 680 },
        { week: 'Week 7', value: data.currentACV }
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  private calculateFrictionReductionMetric(): L5MetricStatus {
    const data = this.frictionReductionData;
    const reductionPercentage = ((data.baselineObjectionRate - data.currentObjectionRate) / data.baselineObjectionRate) * 100;
    
    const recentSpikes = data.redFlagSpikes.slice(-3);
    const avgRecentSpikes = recentSpikes.reduce((sum, s) => sum + s.count, 0) / recentSpikes.length;
    const avgRecentResolved = recentSpikes.reduce((sum, s) => sum + s.resolved, 0) / recentSpikes.length;
    const resolutionRate = (avgRecentResolved / avgRecentSpikes) * 100;

    const isReducing = reductionPercentage >= 30 && resolutionRate >= 75;
    
    return {
      metric: 'Friction Reduction',
      status: isReducing ? 'confirmed' : reductionPercentage >= 15 ? 'tracking' : 'at_risk',
      currentValue: data.currentObjectionRate,
      targetValue: data.baselineObjectionRate * 0.6,
      baselineValue: data.baselineObjectionRate,
      percentageChange: -reductionPercentage,
      trend: reductionPercentage > 25 ? 'improving' : reductionPercentage > 10 ? 'stable' : 'declining',
      weeklyData: data.redFlagSpikes.map((s, i) => ({
        week: `Week ${i + 1}`,
        value: s.count
      })),
      lastUpdated: new Date().toISOString()
    };
  }

  private updateL6Readiness() {
    const metrics = this.confirmationState.metrics;
    const confirmedCount = [
      metrics.revenuePredictability.status === 'confirmed',
      metrics.acvExpansion.status === 'confirmed',
      metrics.frictionReduction.status === 'confirmed'
    ].filter(Boolean).length;

    const l6ReadinessScore = (confirmedCount / 3) * 100;
    const blockers: string[] = [];

    if (metrics.revenuePredictability.status !== 'confirmed') {
      blockers.push(`Revenue Predictability: ${metrics.revenuePredictability.status} (${metrics.revenuePredictability.currentValue.toFixed(1)}% vs ${metrics.revenuePredictability.targetValue}% target)`);
    }
    if (metrics.acvExpansion.status !== 'confirmed') {
      blockers.push(`ACV Expansion: ${metrics.acvExpansion.status} (${metrics.acvExpansion.percentageChange.toFixed(1)}% vs 25% target)`);
    }
    if (metrics.frictionReduction.status !== 'confirmed') {
      blockers.push(`Friction Reduction: ${metrics.frictionReduction.status} (${Math.abs(metrics.frictionReduction.percentageChange).toFixed(1)}% reduction vs 30% target)`);
    }

    const allConfirmed = confirmedCount === 3;
    
    this.confirmationState.l6ReadinessScore = l6ReadinessScore;
    this.confirmationState.overallStatus = allConfirmed ? 'confirmed' : confirmedCount >= 2 ? 'in_progress' : 'at_risk';
    this.confirmationState.confirmationDate = allConfirmed ? new Date().toISOString() : null;
    
    this.confirmationState.l6Readiness = {
      ready: allConfirmed,
      blockers,
      projectedL6StartDate: allConfirmed 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : this.calculateProjectedL6Date(confirmedCount),
      estimatedBudgetRequired: this.calculateL6Budget(l6ReadinessScore)
    };
  }

  private calculateProjectedL6Date(confirmedCount: number): string | null {
    if (confirmedCount === 0) return null;
    const weeksToConfirmation = (3 - confirmedCount) * 4;
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + weeksToConfirmation * 7 + 30);
    return projectedDate.toISOString();
  }

  private calculateL6Budget(readinessScore: number): number {
    const baseL6Budget = 50000;
    const scaleFactor = readinessScore >= 100 ? 1 : readinessScore >= 66 ? 1.2 : 1.5;
    return Math.round(baseL6Budget * scaleFactor);
  }

  // Public API Methods
  getConfirmationState(): L5ConfirmationState {
    this.updateL6Readiness();
    return this.confirmationState;
  }

  getMetricDetails(metricName: 'revenuePredictability' | 'acvExpansion' | 'frictionReduction') {
    switch (metricName) {
      case 'revenuePredictability':
        return {
          status: this.confirmationState.metrics.revenuePredictability,
          data: this.revenuePredictabilityData
        };
      case 'acvExpansion':
        return {
          status: this.confirmationState.metrics.acvExpansion,
          data: this.acvExpansionData
        };
      case 'frictionReduction':
        return {
          status: this.confirmationState.metrics.frictionReduction,
          data: this.frictionReductionData
        };
    }
  }

  getL6ReadinessReport() {
    this.updateL6Readiness();
    const state = this.confirmationState;
    
    return {
      title: 'L6 Readiness Assessment',
      generatedAt: new Date().toISOString(),
      summary: {
        l5ConfirmationStatus: state.overallStatus,
        l6ReadinessScore: state.l6ReadinessScore,
        metricsConfirmed: Object.values(state.metrics).filter(m => m.status === 'confirmed').length,
        totalMetrics: 3
      },
      metrics: {
        revenuePredictability: {
          name: 'Revenue Predictability',
          description: 'Stable MRR lift adhering to Weekly Revenue Sprint targets',
          status: state.metrics.revenuePredictability.status,
          achievement: `${state.metrics.revenuePredictability.currentValue.toFixed(1)}% sprint target achievement`,
          trend: state.metrics.revenuePredictability.trend
        },
        acvExpansion: {
          name: 'ACV Expansion',
          description: 'Revenue Offer Ladder increases Average Contract Value vs baseline',
          status: state.metrics.acvExpansion.status,
          achievement: `$${state.metrics.acvExpansion.currentValue} current vs $${state.metrics.acvExpansion.baselineValue} baseline (+${state.metrics.acvExpansion.percentageChange.toFixed(1)}%)`,
          trend: state.metrics.acvExpansion.trend
        },
        frictionReduction: {
          name: 'Friction Reduction',
          description: 'Decrease in Stakeholder Objection Spikes via Objection Intelligence Loop',
          status: state.metrics.frictionReduction.status,
          achievement: `${Math.abs(state.metrics.frictionReduction.percentageChange).toFixed(1)}% reduction in objection rate`,
          trend: state.metrics.frictionReduction.trend
        }
      },
      l6Planning: {
        ready: state.l6Readiness.ready,
        blockers: state.l6Readiness.blockers,
        projectedStartDate: state.l6Readiness.projectedL6StartDate,
        estimatedBudget: state.l6Readiness.estimatedBudgetRequired,
        l6Goals: [
          'Proactive Regulatory Influence',
          'Market-Shaping Intelligence',
          'Predictive Compliance Positioning'
        ]
      },
      recommendations: this.generateL6Recommendations()
    };
  }

  private generateL6Recommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.confirmationState.metrics;

    if (metrics.revenuePredictability.status !== 'confirmed') {
      recommendations.push('Increase Weekly Revenue Sprint target adherence by tightening CRO outreach quotas');
      recommendations.push('Implement more aggressive 72-hour CTA closing loops');
    }

    if (metrics.acvExpansion.status !== 'confirmed') {
      recommendations.push('Optimize Tier 1 → Tier 2 conversion messaging in the Offer Ladder');
      recommendations.push('Reduce direct-to-Tier-3 attempts to enforce proper ladder progression');
    }

    if (metrics.frictionReduction.status !== 'confirmed') {
      recommendations.push('Accelerate Objection Intelligence Loop cadence from weekly to twice-weekly');
      recommendations.push('Deploy updated IT/QA/Finance packets more frequently based on objection clusters');
    }

    if (this.confirmationState.l6Readiness.ready) {
      recommendations.push('L5 CONFIRMED: Begin autonomous L6 resource forecasting and budgeting');
      recommendations.push('Initiate proactive regulatory influence planning');
    }

    return recommendations;
  }

  // Update methods for real-time data ingestion
  updateRevenueSprint(week: string, target: number, actual: number) {
    const existingIndex = this.revenuePredictabilityData.weeklySprintTargets.findIndex(w => w.week === week);
    const sprintData = { week, target, actual, met: actual >= target * 0.95 };
    
    if (existingIndex >= 0) {
      this.revenuePredictabilityData.weeklySprintTargets[existingIndex] = sprintData;
    } else {
      this.revenuePredictabilityData.weeklySprintTargets.push(sprintData);
    }
    
    this.confirmationState.metrics.revenuePredictability = this.calculateRevenuePredictabilityMetric();
    this.updateL6Readiness();
  }

  updateACVData(currentACV: number) {
    this.acvExpansionData.currentACV = currentACV;
    this.confirmationState.metrics.acvExpansion = this.calculateACVExpansionMetric();
    this.updateL6Readiness();
  }

  recordObjectionSpike(count: number, resolved: number) {
    this.frictionReductionData.redFlagSpikes.push({
      date: new Date().toISOString().split('T')[0],
      count,
      resolved
    });
    
    if (this.frictionReductionData.redFlagSpikes.length > 12) {
      this.frictionReductionData.redFlagSpikes.shift();
    }
    
    this.confirmationState.metrics.frictionReduction = this.calculateFrictionReductionMetric();
    this.updateL6Readiness();
  }
}

export const l5MetricsConfirmation = new L5MetricsConfirmationService();
