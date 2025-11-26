import { l6Sandbox, L6Experiment } from './l6-sandbox';

export interface MicroCohort {
  cohortId: string;
  experimentId: string;
  audiencePercent: number;
  audienceSize: number;
  segmentCriteria: {
    archetypeFilter?: string[];
    engagementLevel?: 'high' | 'medium' | 'low';
    industryFocus?: string[];
    companySize?: 'enterprise' | 'mid-market' | 'smb';
  };
  createdAt: string;
  status: 'active' | 'completed' | 'paused';
  metrics: MicroCohortMetrics;
}

export interface MicroCohortMetrics {
  impressions: number;
  engagements: number;
  conversions: number;
  trustSignals: {
    positive: number;
    neutral: number;
    negative: number;
  };
  frictionEvents: number;
  skepticismIndicators: number;
  conversionRate: number;
  engagementRate: number;
  netTrustScore: number;
}

export interface CohortComparisonResult {
  cohortId: string;
  experimentId: string;
  vsControl: {
    conversionLift: number;
    engagementLift: number;
    trustDelta: number;
    frictionDelta: number;
  };
  statisticalSignificance: number;
  recommendation: 'expand' | 'maintain' | 'reduce' | 'abandon';
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface FrictionReport {
  reportId: string;
  experimentId: string;
  cohortId: string;
  frictionType: 'confusion' | 'resistance' | 'abandonment' | 'complaint' | 'objection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  resolved: boolean;
  resolvedAt: string | null;
  reportedToCoS: boolean;
}

class L6MicroCohortTestingService {
  private readonly MAX_COHORT_PERCENT = 5;
  private readonly TOTAL_AUDIENCE_SIZE = 13000;

  private cohorts: MicroCohort[] = [];
  private frictionReports: FrictionReport[] = [];
  private comparisonResults: CohortComparisonResult[] = [];

  public createCohort(
    experimentId: string,
    audiencePercent: number,
    segmentCriteria?: MicroCohort['segmentCriteria']
  ): { success: boolean; cohort?: MicroCohort; message: string } {
    const experiment = l6Sandbox.getExperiment(experimentId);
    
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    if (experiment.status !== 'active') {
      return { success: false, message: 'Experiment must be active to create cohort' };
    }

    if (audiencePercent > this.MAX_COHORT_PERCENT) {
      return { 
        success: false, 
        message: `Cohort size ${audiencePercent}% exceeds maximum ${this.MAX_COHORT_PERCENT}%` 
      };
    }

    const totalCohortPercent = this.cohorts
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + c.audiencePercent, 0);

    if (totalCohortPercent + audiencePercent > this.MAX_COHORT_PERCENT) {
      return { 
        success: false, 
        message: `Total active cohorts (${totalCohortPercent}%) + new (${audiencePercent}%) exceeds ${this.MAX_COHORT_PERCENT}%` 
      };
    }

    const cohort: MicroCohort = {
      cohortId: `cohort_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      experimentId,
      audiencePercent,
      audienceSize: Math.floor(this.TOTAL_AUDIENCE_SIZE * (audiencePercent / 100)),
      segmentCriteria: segmentCriteria || {},
      createdAt: new Date().toISOString(),
      status: 'active',
      metrics: this.initializeMetrics()
    };

    this.cohorts.push(cohort);

    console.log(`📊 MICRO-COHORT CREATED: ${cohort.cohortId}`);
    console.log(`   Experiment: ${experiment.name}`);
    console.log(`   Audience: ${audiencePercent}% (${cohort.audienceSize} members)`);
    console.log(`   Segment: ${JSON.stringify(segmentCriteria || 'All segments')}`);

    return { success: true, cohort, message: 'Micro-cohort created' };
  }

  private initializeMetrics(): MicroCohortMetrics {
    return {
      impressions: 0,
      engagements: 0,
      conversions: 0,
      trustSignals: { positive: 0, neutral: 0, negative: 0 },
      frictionEvents: 0,
      skepticismIndicators: 0,
      conversionRate: 0,
      engagementRate: 0,
      netTrustScore: 0
    };
  }

  public updateCohortMetrics(
    cohortId: string,
    metricsUpdate: Partial<MicroCohortMetrics>
  ): { success: boolean; message: string } {
    const cohort = this.cohorts.find(c => c.cohortId === cohortId);
    
    if (!cohort) {
      return { success: false, message: 'Cohort not found' };
    }

    if (cohort.status !== 'active') {
      return { success: false, message: 'Can only update metrics for active cohorts' };
    }

    cohort.metrics = { ...cohort.metrics, ...metricsUpdate };

    if (cohort.metrics.impressions > 0) {
      cohort.metrics.engagementRate = 
        (cohort.metrics.engagements / cohort.metrics.impressions) * 100;
    }
    if (cohort.metrics.engagements > 0) {
      cohort.metrics.conversionRate = 
        (cohort.metrics.conversions / cohort.metrics.engagements) * 100;
    }

    const { positive, neutral, negative } = cohort.metrics.trustSignals;
    const total = positive + neutral + negative;
    if (total > 0) {
      cohort.metrics.netTrustScore = ((positive - negative) / total) * 100;
    }

    return { success: true, message: 'Cohort metrics updated' };
  }

  public recordConversionPattern(
    cohortId: string,
    pattern: {
      type: 'engagement' | 'conversion' | 'trust_signal' | 'friction';
      value: number;
      details?: string;
    }
  ): { success: boolean; message: string } {
    const cohort = this.cohorts.find(c => c.cohortId === cohortId);
    
    if (!cohort) {
      return { success: false, message: 'Cohort not found' };
    }

    switch (pattern.type) {
      case 'engagement':
        cohort.metrics.engagements += pattern.value;
        break;
      case 'conversion':
        cohort.metrics.conversions += pattern.value;
        break;
      case 'trust_signal':
        if (pattern.value > 0) cohort.metrics.trustSignals.positive += 1;
        else if (pattern.value < 0) cohort.metrics.trustSignals.negative += 1;
        else cohort.metrics.trustSignals.neutral += 1;
        break;
      case 'friction':
        cohort.metrics.frictionEvents += pattern.value;
        break;
    }

    return { success: true, message: `Pattern recorded: ${pattern.type}` };
  }

  public reportFriction(
    experimentId: string,
    cohortId: string,
    frictionType: FrictionReport['frictionType'],
    severity: FrictionReport['severity'],
    description: string
  ): { success: boolean; report?: FrictionReport; message: string } {
    const cohort = this.cohorts.find(c => c.cohortId === cohortId);
    
    if (!cohort) {
      return { success: false, message: 'Cohort not found' };
    }

    const report: FrictionReport = {
      reportId: `friction_${Date.now()}`,
      experimentId,
      cohortId,
      frictionType,
      severity,
      description,
      detectedAt: new Date().toISOString(),
      resolved: false,
      resolvedAt: null,
      reportedToCoS: severity === 'critical' || severity === 'high'
    };

    this.frictionReports.push(report);
    cohort.metrics.frictionEvents += 1;

    if (report.reportedToCoS) {
      console.log(`⚠️ FRICTION REPORTED TO CoS: ${experimentId}`);
      console.log(`   Type: ${frictionType} | Severity: ${severity}`);
      console.log(`   Description: ${description}`);
    }

    return { success: true, report, message: 'Friction reported' };
  }

  public compareToControl(cohortId: string): CohortComparisonResult | null {
    const cohort = this.cohorts.find(c => c.cohortId === cohortId);
    
    if (!cohort) {
      return null;
    }

    const controlMetrics: MicroCohortMetrics = {
      impressions: 1000,
      engagements: 150,
      conversions: 12,
      trustSignals: { positive: 45, neutral: 35, negative: 20 },
      frictionEvents: 8,
      skepticismIndicators: 5,
      conversionRate: 8,
      engagementRate: 15,
      netTrustScore: 25
    };

    const conversionLift = cohort.metrics.conversionRate - controlMetrics.conversionRate;
    const engagementLift = cohort.metrics.engagementRate - controlMetrics.engagementRate;
    const trustDelta = cohort.metrics.netTrustScore - controlMetrics.netTrustScore;
    const frictionDelta = cohort.metrics.frictionEvents - controlMetrics.frictionEvents;

    let recommendation: CohortComparisonResult['recommendation'] = 'maintain';
    if (conversionLift > 5 && trustDelta >= 0) recommendation = 'expand';
    else if (conversionLift < -5 || trustDelta < -10) recommendation = 'abandon';
    else if (conversionLift < 0 && trustDelta < 0) recommendation = 'reduce';

    const sampleSize = cohort.metrics.impressions;
    let statisticalSignificance = 0;
    if (sampleSize >= 500) statisticalSignificance = 95;
    else if (sampleSize >= 200) statisticalSignificance = 85;
    else if (sampleSize >= 100) statisticalSignificance = 70;
    else statisticalSignificance = 50;

    const result: CohortComparisonResult = {
      cohortId,
      experimentId: cohort.experimentId,
      vsControl: {
        conversionLift,
        engagementLift,
        trustDelta,
        frictionDelta
      },
      statisticalSignificance,
      recommendation,
      confidenceLevel: statisticalSignificance >= 90 ? 'high' : 
                       statisticalSignificance >= 75 ? 'medium' : 'low'
    };

    this.comparisonResults.push(result);

    return result;
  }

  public pauseCohort(cohortId: string): { success: boolean; message: string } {
    const cohort = this.cohorts.find(c => c.cohortId === cohortId);
    
    if (!cohort) {
      return { success: false, message: 'Cohort not found' };
    }

    if (cohort.status !== 'active') {
      return { success: false, message: 'Can only pause active cohorts' };
    }

    cohort.status = 'paused';

    return { success: true, message: 'Cohort paused' };
  }

  public completeCohort(cohortId: string): { success: boolean; message: string } {
    const cohort = this.cohorts.find(c => c.cohortId === cohortId);
    
    if (!cohort) {
      return { success: false, message: 'Cohort not found' };
    }

    cohort.status = 'completed';

    return { success: true, message: 'Cohort completed' };
  }

  public getCohort(cohortId: string): MicroCohort | null {
    return this.cohorts.find(c => c.cohortId === cohortId) || null;
  }

  public getCohortsByExperiment(experimentId: string): MicroCohort[] {
    return this.cohorts.filter(c => c.experimentId === experimentId);
  }

  public getFrictionReports(experimentId?: string): FrictionReport[] {
    if (experimentId) {
      return this.frictionReports.filter(r => r.experimentId === experimentId);
    }
    return [...this.frictionReports];
  }

  public getUnresolvedFriction(): FrictionReport[] {
    return this.frictionReports.filter(r => !r.resolved);
  }

  public resolveFriction(reportId: string): { success: boolean; message: string } {
    const report = this.frictionReports.find(r => r.reportId === reportId);
    
    if (!report) {
      return { success: false, message: 'Friction report not found' };
    }

    report.resolved = true;
    report.resolvedAt = new Date().toISOString();

    return { success: true, message: 'Friction resolved' };
  }

  public getStatus(): {
    activeCohorts: number;
    totalCohorts: number;
    currentAudiencePercent: number;
    maxAudiencePercent: number;
    unresolvedFriction: number;
    comparisonResults: number;
  } {
    const activeCohorts = this.cohorts.filter(c => c.status === 'active');
    const currentPercent = activeCohorts.reduce((sum, c) => sum + c.audiencePercent, 0);

    return {
      activeCohorts: activeCohorts.length,
      totalCohorts: this.cohorts.length,
      currentAudiencePercent: currentPercent,
      maxAudiencePercent: this.MAX_COHORT_PERCENT,
      unresolvedFriction: this.frictionReports.filter(r => !r.resolved).length,
      comparisonResults: this.comparisonResults.length
    };
  }

  public getComparisonResults(experimentId?: string): CohortComparisonResult[] {
    if (experimentId) {
      return this.comparisonResults.filter(r => r.experimentId === experimentId);
    }
    return [...this.comparisonResults];
  }
}

export const l6MicroCohortTesting = new L6MicroCohortTestingService();
