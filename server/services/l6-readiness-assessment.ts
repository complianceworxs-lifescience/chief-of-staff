/**
 * L6 TRANSITION READINESS FRAMEWORK
 * 
 * Critical Thresholds - ALL FIVE must be TRUE simultaneously:
 * 1. Revenue Stability: Weekly Revenue Sprints ≥85% target for 6 consecutive weeks
 * 2. RPM Stability: ≥92% accuracy for 30 consecutive days
 * 3. Objection Stability: No new objection categories for 30 days
 * 4. Blueprint Performance: CMO Archetype variance within ±15%
 * 5. System Coherence: Zero cross-agent contradictions for 48 hours (2 ODAR cycles)
 * 
 * L6 = Meta-autonomy (agents redesigning the business model itself)
 * Transition is ONLY triggered when ALL conditions are met.
 */

export interface RevenueSprintWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  targetRevenue: number;
  actualRevenue: number;
  percentageAchieved: number;
  meetsThreshold: boolean; // ≥85%
}

export interface RPMAccuracyDay {
  date: string;
  predictedRevenue: number;
  actualRevenue: number;
  accuracy: number;
  meetsThreshold: boolean; // ≥92%
}

export interface ObjectionCategory {
  category: string;
  firstDetected: string;
  lastSeen: string;
  occurrences: number;
  isNew: boolean; // Within last 30 days
}

export interface ArchetypePerformance {
  archetype: string;
  baselinePerformance: number;
  currentPerformance: number;
  variance: number;
  withinThreshold: boolean; // ±15%
}

export interface CoherenceIncident {
  id: string;
  timestamp: string;
  type: 'strategist_misalignment' | 'cro_deviation' | 'packet_friction' | 'udl_failure' | 'wis_anomaly' | 'vqs_tension';
  description: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface SafetySignal {
  name: string;
  status: 'positive' | 'neutral' | 'negative';
  daysStable: number;
  threshold: number;
  details: string;
}

export interface ReadinessMetric {
  name: string;
  description: string;
  threshold: string;
  currentValue: string;
  status: 'ready' | 'not_ready' | 'progressing';
  progressPercent: number;
  blockers: string[];
  lastUpdated: string;
}

export interface L6ReadinessAssessment {
  overallReady: boolean;
  readinessScore: number; // 0-100
  metricsReady: number;
  metricTotal: number;
  metrics: {
    revenueStability: ReadinessMetric;
    rpmStability: ReadinessMetric;
    objectionStability: ReadinessMetric;
    blueprintPerformance: ReadinessMetric;
    systemCoherence: ReadinessMetric;
  };
  safetySignals: SafetySignal[];
  estimatedTimeToReady: string;
  lastAssessment: string;
  nextAssessment: string;
}

class L6ReadinessAssessmentService {
  private revenueSprintHistory: RevenueSprintWeek[] = [];
  private rpmAccuracyHistory: RPMAccuracyDay[] = [];
  private objectionCategories: Map<string, ObjectionCategory> = new Map();
  private archetypePerformance: Map<string, ArchetypePerformance> = new Map();
  private coherenceIncidents: CoherenceIncident[] = [];
  private safetySignals: Map<string, SafetySignal> = new Map();
  
  // Thresholds from framework
  private readonly THRESHOLDS = {
    revenueSprintPercent: 85,
    revenueSprintWeeks: 6,
    rpmAccuracyPercent: 92,
    rpmAccuracyDays: 30,
    objectionStabilityDays: 30,
    archetypeVariancePercent: 15,
    coherenceHours: 48,
    trustMomentumDays: 30,
    conversionStabilityDays: 30,
    vqsTensionFreeDays: 30
  };

  constructor() {
    this.initializeWithCurrentData();
  }

  private initializeWithCurrentData(): void {
    // Initialize with baseline data representing current system state
    this.initializeRevenueSprintHistory();
    this.initializeRPMAccuracyHistory();
    this.initializeObjectionCategories();
    this.initializeArchetypePerformance();
    this.initializeSafetySignals();
  }

  private initializeRevenueSprintHistory(): void {
    // Simulate recent weeks - showing progress toward 6-week threshold
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7) - 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Simulate improving trend - weeks 4-6 meeting threshold
      const targetRevenue = 12500; // Weekly target
      const achievementPercent = 75 + (5 - i) * 3 + Math.random() * 5; // Improving trend
      const actualRevenue = targetRevenue * (achievementPercent / 100);
      
      this.revenueSprintHistory.push({
        weekNumber: 6 - i,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        targetRevenue,
        actualRevenue: Math.round(actualRevenue),
        percentageAchieved: Math.round(achievementPercent * 10) / 10,
        meetsThreshold: achievementPercent >= this.THRESHOLDS.revenueSprintPercent
      });
    }
  }

  private initializeRPMAccuracyHistory(): void {
    // Simulate 30-day RPM accuracy history
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Simulate improving accuracy - recent days higher
      const baseAccuracy = 88 + (29 - i) * 0.15; // Improving trend
      const accuracy = Math.min(baseAccuracy + Math.random() * 3, 98);
      
      this.rpmAccuracyHistory.push({
        date: date.toISOString().split('T')[0],
        predictedRevenue: 1800 + Math.random() * 200,
        actualRevenue: 1800 + Math.random() * 200,
        accuracy: Math.round(accuracy * 10) / 10,
        meetsThreshold: accuracy >= this.THRESHOLDS.rpmAccuracyPercent
      });
    }
  }

  private initializeObjectionCategories(): void {
    // Known stable objection categories
    const stableCategories = [
      { category: 'pricing_concern', daysAgo: 45 },
      { category: 'implementation_complexity', daysAgo: 60 },
      { category: 'regulatory_uncertainty', daysAgo: 55 },
      { category: 'resource_constraints', daysAgo: 50 },
      { category: 'timing_not_right', daysAgo: 40 }
    ];
    
    const now = new Date();
    stableCategories.forEach(cat => {
      const firstDetected = new Date(now);
      firstDetected.setDate(firstDetected.getDate() - cat.daysAgo);
      
      this.objectionCategories.set(cat.category, {
        category: cat.category,
        firstDetected: firstDetected.toISOString(),
        lastSeen: now.toISOString(),
        occurrences: Math.floor(Math.random() * 20) + 5,
        isNew: cat.daysAgo < this.THRESHOLDS.objectionStabilityDays
      });
    });
  }

  private initializeArchetypePerformance(): void {
    // CMO Archetype performance data
    const archetypes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    archetypes.forEach(arch => {
      const baseline = 70 + Math.random() * 15;
      const current = baseline * (0.9 + Math.random() * 0.2);
      const variance = ((current - baseline) / baseline) * 100;
      
      this.archetypePerformance.set(`Archetype_${arch}`, {
        archetype: `Archetype_${arch}`,
        baselinePerformance: Math.round(baseline * 10) / 10,
        currentPerformance: Math.round(current * 10) / 10,
        variance: Math.round(variance * 10) / 10,
        withinThreshold: Math.abs(variance) <= this.THRESHOLDS.archetypeVariancePercent
      });
    });
  }

  private initializeSafetySignals(): void {
    this.safetySignals.set('trust_momentum', {
      name: 'Trust Momentum',
      status: 'positive',
      daysStable: 22,
      threshold: 30,
      details: 'Saves increasing, silent lurker re-engagement up 15%, comment quality improving'
    });
    
    this.safetySignals.set('conversion_velocity', {
      name: 'Conversion Velocity',
      status: 'positive',
      daysStable: 18,
      threshold: 30,
      details: 'Tier 1→2 movement stable, Tier 2→3 uplift trending up, CTA response rates consistent'
    });
    
    this.safetySignals.set('vqs_tension', {
      name: 'VQS Tension',
      status: 'positive',
      daysStable: 25,
      threshold: 30,
      details: 'No boundary violations detected, Strategist authority maintained'
    });
  }

  // Record a new revenue sprint week
  recordRevenueSprintWeek(week: Omit<RevenueSprintWeek, 'meetsThreshold'>): void {
    const meetsThreshold = week.percentageAchieved >= this.THRESHOLDS.revenueSprintPercent;
    this.revenueSprintHistory.push({ ...week, meetsThreshold });
    
    // Keep only last 12 weeks
    if (this.revenueSprintHistory.length > 12) {
      this.revenueSprintHistory = this.revenueSprintHistory.slice(-12);
    }
  }

  // Record daily RPM accuracy
  recordRPMAccuracy(day: Omit<RPMAccuracyDay, 'meetsThreshold'>): void {
    const meetsThreshold = day.accuracy >= this.THRESHOLDS.rpmAccuracyPercent;
    this.rpmAccuracyHistory.push({ ...day, meetsThreshold });
    
    // Keep only last 60 days
    if (this.rpmAccuracyHistory.length > 60) {
      this.rpmAccuracyHistory = this.rpmAccuracyHistory.slice(-60);
    }
  }

  // Record a new objection category
  recordObjectionCategory(category: string): void {
    const existing = this.objectionCategories.get(category);
    const now = new Date().toISOString();
    
    if (existing) {
      existing.lastSeen = now;
      existing.occurrences++;
    } else {
      this.objectionCategories.set(category, {
        category,
        firstDetected: now,
        lastSeen: now,
        occurrences: 1,
        isNew: true
      });
    }
  }

  // Record a coherence incident
  recordCoherenceIncident(incident: Omit<CoherenceIncident, 'id' | 'timestamp' | 'resolved'>): void {
    this.coherenceIncidents.push({
      ...incident,
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false
    });
  }

  // Resolve a coherence incident
  resolveCoherenceIncident(incidentId: string): boolean {
    const incident = this.coherenceIncidents.find(i => i.id === incidentId);
    if (incident) {
      incident.resolved = true;
      incident.resolvedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Update safety signal status
  updateSafetySignal(name: string, status: 'positive' | 'neutral' | 'negative', details: string): void {
    const signal = this.safetySignals.get(name);
    if (signal) {
      if (status === signal.status) {
        signal.daysStable++;
      } else {
        signal.daysStable = 0;
        signal.status = status;
      }
      signal.details = details;
    }
  }

  // Calculate Revenue Stability metric
  private calculateRevenueStability(): ReadinessMetric {
    const last6Weeks = this.revenueSprintHistory.slice(-6);
    const consecutiveWeeksMeeting = last6Weeks.filter(w => w.meetsThreshold).length;
    
    // Check for consecutive weeks
    let maxConsecutive = 0;
    let currentStreak = 0;
    for (const week of last6Weeks) {
      if (week.meetsThreshold) {
        currentStreak++;
        maxConsecutive = Math.max(maxConsecutive, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const isReady = maxConsecutive >= this.THRESHOLDS.revenueSprintWeeks;
    const progress = (maxConsecutive / this.THRESHOLDS.revenueSprintWeeks) * 100;
    
    const blockers: string[] = [];
    if (!isReady) {
      const weeksNeeded = this.THRESHOLDS.revenueSprintWeeks - maxConsecutive;
      blockers.push(`Need ${weeksNeeded} more consecutive weeks at ≥85% target`);
      
      const underperformingWeeks = last6Weeks.filter(w => !w.meetsThreshold);
      if (underperformingWeeks.length > 0) {
        const avgShortfall = underperformingWeeks.reduce((sum, w) => 
          sum + (this.THRESHOLDS.revenueSprintPercent - w.percentageAchieved), 0) / underperformingWeeks.length;
        blockers.push(`Average shortfall: ${avgShortfall.toFixed(1)}% below threshold`);
      }
    }

    return {
      name: 'Revenue Stability',
      description: 'Weekly Revenue Sprints must hit ≥85% target for 6 consecutive weeks',
      threshold: `≥85% for 6 consecutive weeks`,
      currentValue: `${maxConsecutive}/6 consecutive weeks at ${consecutiveWeeksMeeting > 0 ? last6Weeks[last6Weeks.length - 1]?.percentageAchieved.toFixed(1) : 0}%`,
      status: isReady ? 'ready' : maxConsecutive >= 3 ? 'progressing' : 'not_ready',
      progressPercent: Math.min(progress, 100),
      blockers,
      lastUpdated: new Date().toISOString()
    };
  }

  // Calculate RPM Stability metric
  private calculateRPMStability(): ReadinessMetric {
    const last30Days = this.rpmAccuracyHistory.slice(-30);
    
    // Count consecutive days meeting threshold from most recent
    let consecutiveDays = 0;
    for (let i = last30Days.length - 1; i >= 0; i--) {
      if (last30Days[i].meetsThreshold) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    const avgAccuracy = last30Days.reduce((sum, d) => sum + d.accuracy, 0) / last30Days.length;
    const isReady = consecutiveDays >= this.THRESHOLDS.rpmAccuracyDays;
    const progress = (consecutiveDays / this.THRESHOLDS.rpmAccuracyDays) * 100;
    
    const blockers: string[] = [];
    if (!isReady) {
      const daysNeeded = this.THRESHOLDS.rpmAccuracyDays - consecutiveDays;
      blockers.push(`Need ${daysNeeded} more consecutive days at ≥92% accuracy`);
      
      const belowThreshold = last30Days.filter(d => !d.meetsThreshold);
      if (belowThreshold.length > 0) {
        blockers.push(`${belowThreshold.length} days in last 30 below 92% threshold`);
      }
    }

    return {
      name: 'RPM Stability',
      description: 'Revenue Predictive Model must achieve ≥92% accuracy for 30 consecutive days',
      threshold: `≥92% accuracy for 30 consecutive days`,
      currentValue: `${consecutiveDays}/30 days at ${avgAccuracy.toFixed(1)}% avg accuracy`,
      status: isReady ? 'ready' : consecutiveDays >= 15 ? 'progressing' : 'not_ready',
      progressPercent: Math.min(progress, 100),
      blockers,
      lastUpdated: new Date().toISOString()
    };
  }

  // Calculate Objection Stability metric
  private calculateObjectionStability(): ReadinessMetric {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.THRESHOLDS.objectionStabilityDays);
    
    const newCategories = Array.from(this.objectionCategories.values())
      .filter(cat => new Date(cat.firstDetected) > thirtyDaysAgo);
    
    const isReady = newCategories.length === 0;
    const oldestNewCategory = newCategories.length > 0 
      ? Math.min(...newCategories.map(c => new Date(c.firstDetected).getTime()))
      : 0;
    
    const daysSinceNewCategory = oldestNewCategory > 0 
      ? Math.floor((now.getTime() - oldestNewCategory) / (24 * 60 * 60 * 1000))
      : this.THRESHOLDS.objectionStabilityDays;
    
    const progress = (daysSinceNewCategory / this.THRESHOLDS.objectionStabilityDays) * 100;
    
    const blockers: string[] = [];
    if (!isReady) {
      blockers.push(`${newCategories.length} new objection categories in last 30 days`);
      newCategories.forEach(cat => {
        blockers.push(`New category "${cat.category}" detected ${Math.floor((now.getTime() - new Date(cat.firstDetected).getTime()) / (24 * 60 * 60 * 1000))} days ago`);
      });
    }

    return {
      name: 'Objection Stability',
      description: 'No new objection categories must emerge for 30 consecutive days',
      threshold: `No new categories for 30 days`,
      currentValue: `${daysSinceNewCategory} days since last new category`,
      status: isReady ? 'ready' : daysSinceNewCategory >= 15 ? 'progressing' : 'not_ready',
      progressPercent: Math.min(progress, 100),
      blockers,
      lastUpdated: new Date().toISOString()
    };
  }

  // Calculate Blueprint Performance metric
  private calculateBlueprintPerformance(): ReadinessMetric {
    const performances = Array.from(this.archetypePerformance.values());
    const withinThreshold = performances.filter(p => p.withinThreshold).length;
    const maxVariance = Math.max(...performances.map(p => Math.abs(p.variance)));
    const avgVariance = performances.reduce((sum, p) => sum + Math.abs(p.variance), 0) / performances.length;
    
    const isReady = withinThreshold === performances.length;
    const progress = (withinThreshold / performances.length) * 100;
    
    const blockers: string[] = [];
    if (!isReady) {
      const outliers = performances.filter(p => !p.withinThreshold);
      blockers.push(`${outliers.length} archetypes outside ±15% variance threshold`);
      outliers.forEach(p => {
        blockers.push(`${p.archetype}: ${p.variance > 0 ? '+' : ''}${p.variance.toFixed(1)}% variance`);
      });
    }

    return {
      name: 'Blueprint Performance',
      description: 'CMO Archetype performance variance must narrow to within ±15%',
      threshold: `All archetypes within ±15% variance`,
      currentValue: `${withinThreshold}/${performances.length} archetypes stable, max variance ${maxVariance.toFixed(1)}%`,
      status: isReady ? 'ready' : withinThreshold >= 6 ? 'progressing' : 'not_ready',
      progressPercent: progress,
      blockers,
      lastUpdated: new Date().toISOString()
    };
  }

  // Calculate System Coherence metric
  private calculateSystemCoherence(): ReadinessMetric {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now);
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - this.THRESHOLDS.coherenceHours);
    
    const recentIncidents = this.coherenceIncidents.filter(i => 
      new Date(i.timestamp) > fortyEightHoursAgo && !i.resolved
    );
    
    // Calculate hours since last unresolved incident
    const unresolvedIncidents = this.coherenceIncidents.filter(i => !i.resolved);
    const mostRecentUnresolved = unresolvedIncidents.length > 0
      ? Math.max(...unresolvedIncidents.map(i => new Date(i.timestamp).getTime()))
      : 0;
    
    const hoursSinceIncident = mostRecentUnresolved > 0
      ? (now.getTime() - mostRecentUnresolved) / (60 * 60 * 1000)
      : this.THRESHOLDS.coherenceHours;
    
    const isReady = recentIncidents.length === 0 && hoursSinceIncident >= this.THRESHOLDS.coherenceHours;
    const progress = Math.min((hoursSinceIncident / this.THRESHOLDS.coherenceHours) * 100, 100);
    
    const blockers: string[] = [];
    if (!isReady) {
      if (recentIncidents.length > 0) {
        blockers.push(`${recentIncidents.length} unresolved incidents in last 48 hours`);
        
        // Group by type
        const byType = new Map<string, number>();
        recentIncidents.forEach(i => {
          byType.set(i.type, (byType.get(i.type) || 0) + 1);
        });
        
        byType.forEach((count, type) => {
          blockers.push(`${count}x ${type.replace(/_/g, ' ')}`);
        });
      }
      
      if (hoursSinceIncident < this.THRESHOLDS.coherenceHours) {
        const hoursNeeded = Math.ceil(this.THRESHOLDS.coherenceHours - hoursSinceIncident);
        blockers.push(`Need ${hoursNeeded} more incident-free hours`);
      }
    }

    return {
      name: 'System Coherence',
      description: 'Zero cross-agent contradictions or drift incidents for 48 hours (2 ODAR cycles)',
      threshold: `Zero incidents for 48 hours`,
      currentValue: `${Math.floor(hoursSinceIncident)} hours incident-free, ${recentIncidents.length} active incidents`,
      status: isReady ? 'ready' : hoursSinceIncident >= 24 ? 'progressing' : 'not_ready',
      progressPercent: progress,
      blockers,
      lastUpdated: new Date().toISOString()
    };
  }

  // Get full readiness assessment
  getReadinessAssessment(): L6ReadinessAssessment {
    const metrics = {
      revenueStability: this.calculateRevenueStability(),
      rpmStability: this.calculateRPMStability(),
      objectionStability: this.calculateObjectionStability(),
      blueprintPerformance: this.calculateBlueprintPerformance(),
      systemCoherence: this.calculateSystemCoherence()
    };

    const metricsArray = Object.values(metrics);
    const readyCount = metricsArray.filter(m => m.status === 'ready').length;
    const avgProgress = metricsArray.reduce((sum, m) => sum + m.progressPercent, 0) / metricsArray.length;
    
    // ALL FIVE must be ready
    const overallReady = readyCount === 5;

    // Calculate estimated time to ready
    let estimatedDays = 0;
    metricsArray.forEach(m => {
      if (m.status !== 'ready') {
        // Rough estimate based on progress
        const remaining = 100 - m.progressPercent;
        const daysEstimate = Math.ceil(remaining / 3); // Assume ~3% progress per day
        estimatedDays = Math.max(estimatedDays, daysEstimate);
      }
    });

    const safetySignalArray = Array.from(this.safetySignals.values());

    return {
      overallReady,
      readinessScore: Math.round(avgProgress),
      metricsReady: readyCount,
      metricTotal: 5,
      metrics,
      safetySignals: safetySignalArray,
      estimatedTimeToReady: overallReady ? 'Ready now' : `~${estimatedDays} days`,
      lastAssessment: new Date().toISOString(),
      nextAssessment: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
    };
  }

  // Check if L6 transition is allowed
  canTransitionToL6(): { allowed: boolean; blockers: string[]; readinessScore: number } {
    const assessment = this.getReadinessAssessment();
    const blockers: string[] = [];

    if (!assessment.overallReady) {
      Object.values(assessment.metrics).forEach(m => {
        if (m.status !== 'ready') {
          blockers.push(`${m.name}: ${m.blockers[0] || 'Not ready'}`);
        }
      });
    }

    // Check safety signals too
    assessment.safetySignals.forEach(signal => {
      if (signal.status === 'negative') {
        blockers.push(`Safety Signal "${signal.name}" is negative`);
      }
    });

    return {
      allowed: assessment.overallReady && blockers.length === 0,
      blockers,
      readinessScore: assessment.readinessScore
    };
  }

  // Get historical data
  getRevenueSprintHistory(): RevenueSprintWeek[] {
    return [...this.revenueSprintHistory];
  }

  getRPMAccuracyHistory(): RPMAccuracyDay[] {
    return [...this.rpmAccuracyHistory];
  }

  getObjectionCategories(): ObjectionCategory[] {
    return Array.from(this.objectionCategories.values());
  }

  getArchetypePerformance(): ArchetypePerformance[] {
    return Array.from(this.archetypePerformance.values());
  }

  getCoherenceIncidents(unresolvedOnly: boolean = false): CoherenceIncident[] {
    if (unresolvedOnly) {
      return this.coherenceIncidents.filter(i => !i.resolved);
    }
    return [...this.coherenceIncidents];
  }
}

// Singleton instance
export const l6ReadinessAssessment = new L6ReadinessAssessmentService();
