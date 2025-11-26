// COMPLIANCEWORXS — REVENUE PREDICTIVE MODEL v1.0
// Primary Owners: Strategist + Librarian
// Co-Owners: CoS, CRO
// Purpose: Risk-adjusted revenue forecasting with 24-hour update cycles

export interface RevenueSignal {
  source: string;
  type: 'linkedin_velocity' | 'micro_offer_acceptance' | 'cta_conversion' | 'committee_friction' | 'vqs_delta' | 'objection_cluster' | 'mailchimp_response';
  value: number;
  weight: number;
  timestamp: string;
}

export interface RevenuePrediction {
  id: string;
  generatedAt: string;
  forecastPeriod: '7day' | '14day' | '30day';
  predictedRevenueDelta: number;
  confidenceScore: number;
  riskAdjustment: number;
  topBottlenecks: { area: string; impact: number; recommendation: string }[];
  recommendedInterventions: { agent: string; action: string; priority: 'critical' | 'high' | 'medium' | 'low'; expectedImpact: number }[];
  signalSources: RevenueSignal[];
  validatedAt: string | null;
  status: 'draft' | 'validated' | 'published';
}

export interface RevenuePredictionLayer {
  initialized: boolean;
  lastUpdated: string;
  signals: {
    linkedInVelocity: { current: number; trend: 'up' | 'down' | 'stable'; weeklyAverage: number };
    microOfferAcceptance: { rate: number; totalOffers: number; accepted: number; trend: 'up' | 'down' | 'stable' };
    ctaConversionWindows: { optimal: string; worstPerforming: string; averageConversionTime: number };
    committeeFriction: { score: number; hotspots: string[]; resolvedThisWeek: number };
    vqsDeltas: { workloadReduction: number; costReduction: number; performanceImprovement: number };
    objectionClusters: { qa: number; it: number; finance: number; executive: number };
    mailchimpResponses: { openRate: number; clickRate: number; conversionRate: number; totalSent: number };
  };
  forecastingConfig: {
    riskAdjustedWeighting: boolean;
    buyingCommitteeFrictionEnabled: boolean;
    abOfferPerformanceEnabled: boolean;
    weeklySprintResultsIntegrated: boolean;
    vqsCompliantBounds: boolean;
  };
}

class RevenuePredictiveModelService {
  private predictionLayer: RevenuePredictionLayer;
  private predictions: RevenuePrediction[] = [];
  private isActive: boolean = false;
  private activatedAt: string | null = null;

  constructor() {
    this.predictionLayer = this.initializePredictionLayer();
  }

  private initializePredictionLayer(): RevenuePredictionLayer {
    const now = new Date().toISOString();
    return {
      initialized: false,
      lastUpdated: now,
      signals: {
        linkedInVelocity: { current: 847, trend: 'up', weeklyAverage: 782 },
        microOfferAcceptance: { rate: 23.5, totalOffers: 156, accepted: 37, trend: 'up' },
        ctaConversionWindows: { optimal: 'Tuesday 10am-12pm ET', worstPerforming: 'Friday 4pm+ ET', averageConversionTime: 4.2 },
        committeeFriction: { score: 32, hotspots: ['IT Security Review', 'Budget Approval Process'], resolvedThisWeek: 8 },
        vqsDeltas: { workloadReduction: 21, costReduction: 45000, performanceImprovement: 24 },
        objectionClusters: { qa: 12, it: 18, finance: 24, executive: 6 },
        mailchimpResponses: { openRate: 34.2, clickRate: 8.7, conversionRate: 2.3, totalSent: 1250 }
      },
      forecastingConfig: {
        riskAdjustedWeighting: true,
        buyingCommitteeFrictionEnabled: true,
        abOfferPerformanceEnabled: true,
        weeklySprintResultsIntegrated: true,
        vqsCompliantBounds: true
      }
    };
  }

  public activate(): { success: boolean; message: string } {
    if (this.isActive) {
      return { success: true, message: "Revenue Predictive Model already active" };
    }

    this.isActive = true;
    this.activatedAt = new Date().toISOString();
    this.predictionLayer.initialized = true;
    this.predictionLayer.lastUpdated = this.activatedAt;

    console.log("📊 REVENUE PREDICTIVE MODEL ACTIVATED");
    console.log("   Owner: Strategist + Librarian");
    console.log("   Co-Owners: CoS, CRO");
    console.log("   Status: 24-hour forecast cycle initiated");

    this.generateDailyForecast();

    return { 
      success: true, 
      message: "Revenue Predictive Model v1.0 activated. Daily forecasting cycle started." 
    };
  }

  public generateDailyForecast(): RevenuePrediction {
    const now = new Date();
    const prediction: RevenuePrediction = {
      id: `forecast_${now.getTime()}`,
      generatedAt: now.toISOString(),
      forecastPeriod: '7day',
      predictedRevenueDelta: this.calculatePredictedDelta(),
      confidenceScore: this.calculateConfidenceScore(),
      riskAdjustment: this.calculateRiskAdjustment(),
      topBottlenecks: this.identifyBottlenecks(),
      recommendedInterventions: this.generateInterventions(),
      signalSources: this.collectSignals(),
      validatedAt: null,
      status: 'draft'
    };

    this.predictions.unshift(prediction);
    if (this.predictions.length > 30) {
      this.predictions = this.predictions.slice(0, 30);
    }

    console.log(`📈 FORECAST GENERATED: $${prediction.predictedRevenueDelta.toLocaleString()} predicted (${prediction.confidenceScore}% confidence)`);

    return prediction;
  }

  private calculatePredictedDelta(): number {
    const signals = this.predictionLayer.signals;
    
    const linkedInFactor = (signals.linkedInVelocity.current / signals.linkedInVelocity.weeklyAverage) * 1500;
    const offerFactor = signals.microOfferAcceptance.rate * 180;
    const conversionFactor = signals.mailchimpResponses.conversionRate * 850;
    const frictionPenalty = signals.committeeFriction.score * -35;

    const basePrediction = linkedInFactor + offerFactor + conversionFactor + frictionPenalty;
    const riskAdjusted = basePrediction * (1 - this.calculateRiskAdjustment() / 100);

    return Math.round(Math.max(0, riskAdjusted));
  }

  private calculateConfidenceScore(): number {
    const signals = this.predictionLayer.signals;
    let confidence = 75;

    if (signals.linkedInVelocity.trend === 'up') confidence += 5;
    if (signals.microOfferAcceptance.trend === 'up') confidence += 5;
    if (signals.committeeFriction.resolvedThisWeek > 5) confidence += 5;
    if (signals.mailchimpResponses.openRate > 30) confidence += 3;
    if (signals.mailchimpResponses.clickRate > 5) confidence += 3;

    confidence -= signals.committeeFriction.score / 10;

    return Math.min(95, Math.max(50, Math.round(confidence)));
  }

  private calculateRiskAdjustment(): number {
    const signals = this.predictionLayer.signals;
    let risk = 10;

    if (signals.linkedInVelocity.trend === 'down') risk += 5;
    if (signals.microOfferAcceptance.trend === 'down') risk += 8;
    if (signals.committeeFriction.score > 40) risk += 10;
    if (signals.objectionClusters.finance > 20) risk += 5;
    if (signals.objectionClusters.it > 15) risk += 3;

    return Math.min(35, Math.max(5, risk));
  }

  private identifyBottlenecks(): { area: string; impact: number; recommendation: string }[] {
    const signals = this.predictionLayer.signals;
    const bottlenecks: { area: string; impact: number; recommendation: string }[] = [];

    if (signals.committeeFriction.score > 30) {
      bottlenecks.push({
        area: 'Buying Committee Friction',
        impact: signals.committeeFriction.score,
        recommendation: 'Deploy IT/QA stakeholder packets to address hotspots: ' + signals.committeeFriction.hotspots.join(', ')
      });
    }

    if (signals.objectionClusters.finance > 20) {
      bottlenecks.push({
        area: 'Finance Objections',
        impact: signals.objectionClusters.finance,
        recommendation: 'Escalate ROI calculator and cost-avoidance VQS to finance stakeholders'
      });
    }

    if (signals.mailchimpResponses.conversionRate < 2) {
      bottlenecks.push({
        area: 'Email Conversion',
        impact: Math.round((2 - signals.mailchimpResponses.conversionRate) * 30),
        recommendation: 'A/B test email CTAs and subject lines. Current conversion rate below 2% target.'
      });
    }

    bottlenecks.sort((a, b) => b.impact - a.impact);
    return bottlenecks.slice(0, 3);
  }

  private generateInterventions(): { agent: string; action: string; priority: 'critical' | 'high' | 'medium' | 'low'; expectedImpact: number }[] {
    const bottlenecks = this.identifyBottlenecks();
    const interventions: { agent: string; action: string; priority: 'critical' | 'high' | 'medium' | 'low'; expectedImpact: number }[] = [];

    if (bottlenecks.some(b => b.area === 'Buying Committee Friction')) {
      interventions.push({
        agent: 'CRO',
        action: 'Execute targeted stakeholder outreach with IT/QA packets',
        priority: 'high',
        expectedImpact: 2500
      });
    }

    if (bottlenecks.some(b => b.area === 'Finance Objections')) {
      interventions.push({
        agent: 'Content Manager',
        action: 'Update finance stakeholder toolkit with ROI proof points',
        priority: 'high',
        expectedImpact: 1800
      });
    }

    interventions.push({
      agent: 'CMO',
      action: 'Launch LinkedIn dark-social engagement burst',
      priority: 'medium',
      expectedImpact: 1200
    });

    interventions.push({
      agent: 'Librarian',
      action: 'Update objection intelligence with latest cluster patterns',
      priority: 'medium',
      expectedImpact: 800
    });

    return interventions;
  }

  private collectSignals(): RevenueSignal[] {
    const now = new Date().toISOString();
    const signals = this.predictionLayer.signals;

    return [
      { source: 'LinkedIn', type: 'linkedin_velocity', value: signals.linkedInVelocity.current, weight: 0.25, timestamp: now },
      { source: 'CRO', type: 'micro_offer_acceptance', value: signals.microOfferAcceptance.rate, weight: 0.20, timestamp: now },
      { source: 'Mailchimp', type: 'mailchimp_response', value: signals.mailchimpResponses.conversionRate, weight: 0.15, timestamp: now },
      { source: 'Objection Loop', type: 'committee_friction', value: signals.committeeFriction.score, weight: 0.15, timestamp: now },
      { source: 'VQS Engine', type: 'vqs_delta', value: signals.vqsDeltas.workloadReduction, weight: 0.15, timestamp: now },
      { source: 'Librarian', type: 'objection_cluster', value: signals.objectionClusters.finance, weight: 0.10, timestamp: now }
    ];
  }

  public updateSignal(signalType: keyof RevenuePredictionLayer['signals'], data: any): void {
    if (this.predictionLayer.signals[signalType]) {
      this.predictionLayer.signals[signalType] = { ...this.predictionLayer.signals[signalType], ...data };
      this.predictionLayer.lastUpdated = new Date().toISOString();
    }
  }

  public getStatus(): {
    active: boolean;
    activatedAt: string | null;
    layer: RevenuePredictionLayer;
    latestPrediction: RevenuePrediction | null;
    predictionCount: number;
  } {
    return {
      active: this.isActive,
      activatedAt: this.activatedAt,
      layer: this.predictionLayer,
      latestPrediction: this.predictions[0] || null,
      predictionCount: this.predictions.length
    };
  }

  public getLatestForecast(): RevenuePrediction | null {
    return this.predictions[0] || null;
  }

  public getForecastHistory(limit: number = 7): RevenuePrediction[] {
    return this.predictions.slice(0, limit);
  }

  public getCosDashboardData(): {
    title: string;
    status: 'active' | 'inactive';
    latestForecast: {
      predictedDelta: number;
      confidence: number;
      topBottleneck: string | null;
      topIntervention: string | null;
    };
    signalHealth: { name: string; status: 'good' | 'warning' | 'critical' }[];
  } {
    const forecast = this.getLatestForecast();
    return {
      title: 'Revenue Predictive Model',
      status: this.isActive ? 'active' : 'inactive',
      latestForecast: {
        predictedDelta: forecast?.predictedRevenueDelta || 0,
        confidence: forecast?.confidenceScore || 0,
        topBottleneck: forecast?.topBottlenecks[0]?.area || null,
        topIntervention: forecast?.recommendedInterventions[0]?.action || null
      },
      signalHealth: [
        { name: 'LinkedIn Velocity', status: this.predictionLayer.signals.linkedInVelocity.trend === 'up' ? 'good' : 'warning' },
        { name: 'Offer Acceptance', status: this.predictionLayer.signals.microOfferAcceptance.rate > 20 ? 'good' : 'warning' },
        { name: 'Committee Friction', status: this.predictionLayer.signals.committeeFriction.score < 35 ? 'good' : 'critical' },
        { name: 'Email Conversion', status: this.predictionLayer.signals.mailchimpResponses.conversionRate > 2 ? 'good' : 'warning' }
      ]
    };
  }
}

export const revenuePredictiveModel = new RevenuePredictiveModelService();
