/**
 * L6 SHADOW MODE ADVISORS
 * 
 * DIRECTIVE: L6 capabilities that do NOT violate L5 protocols.
 * 
 * ROLE OF CoS:
 * - L5 CoS remains the sole execution engine
 * - L6 modules are READ-ONLY ADVISORS
 * - L6 may only emit scores, flags, rankings, or reports
 * - No direct API calls to Publishing, Billing, or Orchestration layers
 * 
 * INTEGRATION RULES:
 * - CoS ingests L6 outputs as: Priority adjustments, Advisory prompts, "Pause/Review" flags
 * - No change is applied unless initiated by an L5-approved action template
 * - L6 must act within the L5 framework, not above it
 */

import { storage } from '../storage';

// ============================================================================
// L6 SHADOW MODE TYPES
// ============================================================================

export interface L6AdvisoryOutput {
  type: 'SCORE' | 'FLAG' | 'RANKING' | 'REPORT' | 'ALERT';
  module: string;
  timestamp: string;
  payload: any;
  requiresL5Approval: boolean;
  confidence: number;
}

export interface PropensityScore {
  contactId: string;
  score: number; // 0-100
  signals: {
    emailEngagement: number;
    pageViewVelocity: number;
    linkedInActivity: number;
    checkoutIntent: number;
  };
  tier: 'HOT' | 'WARM' | 'COLD' | 'DORMANT';
  recommendation: string;
}

export interface SentimentHeatmapEntry {
  source: 'EMAIL' | 'LINKEDIN' | 'WEBSITE';
  content: string;
  emotionalTone: 'FEAR' | 'CURIOSITY' | 'SKEPTICISM' | 'ENTHUSIASM' | 'NEUTRAL';
  intensity: number; // 0-100
  suggestedToneShift?: string;
}

export interface ShadowSimulation {
  simulationId: string;
  hypothesis: string;
  variables: Record<string, any>;
  predictedRevenueLift: number; // percentage
  confidenceInterval: [number, number];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

export interface DriftWarning {
  contentId: string;
  driftScore: number; // 0-100, higher = more drift
  driftType: 'VOICE' | 'POSITIONING' | 'OFFER_LADDER' | 'VQS_DEVIATION';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  suggestedCorrection?: string;
  requiresPause: boolean;
}

// ============================================================================
// L6 CAPABILITY 1: PROPENSITY-TO-PAY SCORER
// ============================================================================

export class PropensityToPayScorer {
  private readonly MODULE_NAME = 'L6_PROPENSITY_SCORER';

  /**
   * Analyzes behavioral signals to predict who has budget and intent to buy.
   * READ-ONLY: Assigns a 0-100 Score to every contact.
   * L5 Constraint: Cannot send messages. Only passes score to L5 CoS.
   */
  async scoreContact(contactData: {
    emailOpens: number;
    emailClicks: number;
    pageViews: number;
    timeOnSite: number;
    linkedInEngagement: number;
    cartAbandonment: boolean;
    lastActivityDays: number;
  }): Promise<L6AdvisoryOutput> {
    
    // Calculate sub-scores
    const emailEngagement = Math.min(100, (contactData.emailOpens * 10) + (contactData.emailClicks * 25));
    const pageViewVelocity = Math.min(100, contactData.pageViews * 5 + (contactData.timeOnSite / 60) * 10);
    const linkedInActivity = Math.min(100, contactData.linkedInEngagement * 20);
    const checkoutIntent = contactData.cartAbandonment ? 75 : (contactData.pageViews > 5 ? 50 : 25);
    
    // Recency decay
    const recencyMultiplier = Math.max(0.1, 1 - (contactData.lastActivityDays / 30));
    
    // Composite score
    const rawScore = (emailEngagement * 0.3) + (pageViewVelocity * 0.25) + 
                     (linkedInActivity * 0.25) + (checkoutIntent * 0.2);
    const finalScore = Math.round(rawScore * recencyMultiplier);
    
    // Tier assignment
    let tier: 'HOT' | 'WARM' | 'COLD' | 'DORMANT';
    let recommendation: string;
    
    if (finalScore >= 80) {
      tier = 'HOT';
      recommendation = 'PRIORITY: Immediate outreach. High purchase intent detected.';
    } else if (finalScore >= 50) {
      tier = 'WARM';
      recommendation = 'Nurture with value content. Ready for soft conversion ask.';
    } else if (finalScore >= 25) {
      tier = 'COLD';
      recommendation = 'Long-term nurture. Not ready for sales conversation.';
    } else {
      tier = 'DORMANT';
      recommendation = 'Re-engagement campaign needed or remove from active pipeline.';
    }

    const propensityScore: PropensityScore = {
      contactId: `contact_${Date.now()}`,
      score: finalScore,
      signals: { emailEngagement, pageViewVelocity, linkedInActivity, checkoutIntent },
      tier,
      recommendation
    };

    return {
      type: 'SCORE',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: propensityScore,
      requiresL5Approval: false, // Scores are informational only
      confidence: 0.85
    };
  }

  /**
   * Batch score all contacts and return ranked list.
   * L5 Execution: CoS uses this to re-order its "To-Do" list.
   */
  async rankAllContacts(contacts: any[]): Promise<L6AdvisoryOutput> {
    const scores = await Promise.all(
      contacts.map(c => this.scoreContact(c))
    );

    const ranked = scores
      .map(s => s.payload as PropensityScore)
      .sort((a, b) => b.score - a.score);

    return {
      type: 'RANKING',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        totalContacts: ranked.length,
        hotLeads: ranked.filter(r => r.tier === 'HOT').length,
        warmLeads: ranked.filter(r => r.tier === 'WARM').length,
        coldLeads: ranked.filter(r => r.tier === 'COLD').length,
        dormantLeads: ranked.filter(r => r.tier === 'DORMANT').length,
        priorityQueue: ranked.slice(0, 10) // Top 10 for immediate action
      },
      requiresL5Approval: false,
      confidence: 0.85
    };
  }
}

// ============================================================================
// L6 CAPABILITY 2: SENTIMENT HEATMAP
// ============================================================================

export class SentimentHeatmap {
  private readonly MODULE_NAME = 'L6_SENTIMENT_HEATMAP';

  /**
   * Monitors LinkedIn Group posts and Email replies for emotional tone.
   * READ-ONLY: Aggregates data to visualize market sentiment.
   * L5 Constraint: Cannot change content.
   */
  async analyzeSentiment(content: string, source: 'EMAIL' | 'LINKEDIN' | 'WEBSITE'): Promise<L6AdvisoryOutput> {
    
    // Keyword-based sentiment detection (simplified for demo)
    const fearIndicators = ['worried', 'concerned', 'risk', 'audit', 'failing', 'warning', 'problem'];
    const curiosityIndicators = ['interesting', 'tell me more', 'how', 'what if', 'curious', 'learn'];
    const skepticismIndicators = ['doubt', 'not sure', 'skeptical', 'prove', 'evidence', 'really?'];
    const enthusiasmIndicators = ['love', 'great', 'perfect', 'exactly', 'amazing', 'need this'];
    
    const lowerContent = content.toLowerCase();
    
    const fearScore = fearIndicators.filter(w => lowerContent.includes(w)).length * 20;
    const curiosityScore = curiosityIndicators.filter(w => lowerContent.includes(w)).length * 20;
    const skepticismScore = skepticismIndicators.filter(w => lowerContent.includes(w)).length * 20;
    const enthusiasmScore = enthusiasmIndicators.filter(w => lowerContent.includes(w)).length * 20;
    
    // Determine dominant tone
    const scores = { FEAR: fearScore, CURIOSITY: curiosityScore, SKEPTICISM: skepticismScore, ENTHUSIASM: enthusiasmScore };
    const maxTone = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
    const emotionalTone = maxTone[1] > 0 ? maxTone[0] as any : 'NEUTRAL';
    const intensity = Math.min(100, maxTone[1]);

    let suggestedToneShift: string | undefined;
    if (emotionalTone === 'FEAR') {
      suggestedToneShift = 'Consider adding reassurance and success stories to next content.';
    } else if (emotionalTone === 'SKEPTICISM') {
      suggestedToneShift = 'Provide more concrete evidence and case studies.';
    }

    const entry: SentimentHeatmapEntry = {
      source,
      content: content.substring(0, 200),
      emotionalTone,
      intensity,
      suggestedToneShift
    };

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: entry,
      requiresL5Approval: false,
      confidence: 0.7
    };
  }

  /**
   * Generate aggregate sentiment report across all channels.
   */
  async generateHeatmapReport(entries: SentimentHeatmapEntry[]): Promise<L6AdvisoryOutput> {
    const toneCounts = entries.reduce((acc, e) => {
      acc[e.emotionalTone] = (acc[e.emotionalTone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgIntensity = entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length || 0;

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        totalResponses: entries.length,
        toneDistribution: toneCounts,
        averageIntensity: Math.round(avgIntensity),
        dominantSentiment: Object.entries(toneCounts).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'NEUTRAL',
        advisory: 'L5 Marketing Agent: Review tone shift recommendations before next campaign.'
      },
      requiresL5Approval: false,
      confidence: 0.75
    };
  }
}

// ============================================================================
// L6 CAPABILITY 3: SHADOW CHALLENGER (Simulation Engine)
// ============================================================================

export class ShadowChallenger {
  private readonly MODULE_NAME = 'L6_SHADOW_CHALLENGER';

  /**
   * Runs simulations in the background to find better strategies.
   * READ-ONLY: Creates "Hypothesis Report" but changes nothing.
   * L5 Execution: You (or L5 CoS) review the report and authorize adoption.
   */
  async runSimulation(params: {
    hypothesis: string;
    variable: string;
    currentValue: any;
    proposedValue: any;
    historicalData?: any;
  }): Promise<L6AdvisoryOutput> {
    
    // Simplified simulation logic
    const varianceMultiplier = Math.random() * 0.4 + 0.8; // 0.8x to 1.2x variance
    
    let baseLift = 0;
    
    // Price sensitivity simulation
    if (params.variable === 'price') {
      const priceDelta = (params.proposedValue - params.currentValue) / params.currentValue;
      baseLift = priceDelta > 0 ? -15 + (priceDelta * -50) : 10 + (Math.abs(priceDelta) * 20);
    }
    // Timing simulation
    else if (params.variable === 'sendTime') {
      baseLift = Math.random() * 15 - 5; // -5% to +10%
    }
    // Subject line simulation
    else if (params.variable === 'subjectLine') {
      baseLift = Math.random() * 25 - 5; // -5% to +20%
    }
    // Default
    else {
      baseLift = Math.random() * 20 - 10;
    }

    const predictedLift = Math.round(baseLift * varianceMultiplier * 10) / 10;
    const confidence = Math.round((0.6 + Math.random() * 0.3) * 100) / 100;
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    let recommendation: string;
    
    if (predictedLift > 15 && confidence > 0.7) {
      riskLevel = 'LOW';
      recommendation = `STRONG SIGNAL: Adopt proposed change. Expected +${predictedLift}% revenue lift.`;
    } else if (predictedLift > 5) {
      riskLevel = 'MEDIUM';
      recommendation = `MODERATE SIGNAL: Consider A/B test before full adoption.`;
    } else if (predictedLift < -5) {
      riskLevel = 'HIGH';
      recommendation = `WARNING: Proposed change may reduce revenue. Do not adopt.`;
    } else {
      riskLevel = 'LOW';
      recommendation = `NEUTRAL: Minimal impact expected. Optional change.`;
    }

    const simulation: ShadowSimulation = {
      simulationId: `sim_${Date.now()}`,
      hypothesis: params.hypothesis,
      variables: { 
        variable: params.variable,
        current: params.currentValue,
        proposed: params.proposedValue
      },
      predictedRevenueLift: predictedLift,
      confidenceInterval: [predictedLift - 5, predictedLift + 5],
      riskLevel,
      recommendation
    };

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: simulation,
      requiresL5Approval: true, // Requires approval before any action
      confidence
    };
  }

  /**
   * Run batch simulations for strategy optimization.
   */
  async runStrategyOptimization(scenarios: any[]): Promise<L6AdvisoryOutput> {
    const results = await Promise.all(
      scenarios.map(s => this.runSimulation(s))
    );

    const rankedByLift = results
      .map(r => r.payload as ShadowSimulation)
      .sort((a, b) => b.predictedRevenueLift - a.predictedRevenueLift);

    return {
      type: 'RANKING',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        totalSimulations: rankedByLift.length,
        topOpportunity: rankedByLift[0],
        lowRiskOpportunities: rankedByLift.filter(r => r.riskLevel === 'LOW' && r.predictedRevenueLift > 5),
        advisory: 'Review top opportunities. L5 approval required before implementation.'
      },
      requiresL5Approval: true,
      confidence: 0.7
    };
  }
}

// ============================================================================
// L6 CAPABILITY 4: DRIFT DETECTIVE
// ============================================================================

export class DriftDetective {
  private readonly MODULE_NAME = 'L6_DRIFT_DETECTIVE';
  private readonly DRIFT_THRESHOLD_WARNING = 30;
  private readonly DRIFT_THRESHOLD_CRITICAL = 60;

  /**
   * Scores outgoing drafts against "Golden Archetype" (best performing content).
   * READ-ONLY: Flags "Drift Warning" on dashboard.
   * L5 Constraint: Cannot delete or rewrite content.
   * L5 Execution: CoS can pause publishing if Drift Score exceeds threshold.
   */
  async detectDrift(content: string, goldenArchetype: {
    voice: string[];
    positioning: string[];
    forbiddenTerms: string[];
    requiredElements: string[];
  }): Promise<L6AdvisoryOutput> {
    
    const lowerContent = content.toLowerCase();
    
    // Voice alignment check
    const voiceMatches = goldenArchetype.voice.filter(v => lowerContent.includes(v.toLowerCase())).length;
    const voiceScore = Math.min(100, (voiceMatches / goldenArchetype.voice.length) * 100);
    
    // Positioning alignment check
    const positioningMatches = goldenArchetype.positioning.filter(p => lowerContent.includes(p.toLowerCase())).length;
    const positioningScore = Math.min(100, (positioningMatches / goldenArchetype.positioning.length) * 100);
    
    // Forbidden terms check (inverse - more matches = worse)
    const forbiddenMatches = goldenArchetype.forbiddenTerms.filter(f => lowerContent.includes(f.toLowerCase())).length;
    const forbiddenPenalty = forbiddenMatches * 20;
    
    // Required elements check
    const requiredMatches = goldenArchetype.requiredElements.filter(r => lowerContent.includes(r.toLowerCase())).length;
    const requiredScore = Math.min(100, (requiredMatches / goldenArchetype.requiredElements.length) * 100);
    
    // Calculate drift score (higher = more drift = BAD)
    const alignmentScore = (voiceScore + positioningScore + requiredScore) / 3;
    const driftScore = Math.max(0, Math.min(100, 100 - alignmentScore + forbiddenPenalty));
    
    // Determine drift type and severity
    let driftType: 'VOICE' | 'POSITIONING' | 'OFFER_LADDER' | 'VQS_DEVIATION' = 'VOICE';
    if (positioningScore < voiceScore) driftType = 'POSITIONING';
    if (forbiddenMatches > 0) driftType = 'VQS_DEVIATION';
    
    let severity: 'INFO' | 'WARNING' | 'CRITICAL';
    let requiresPause = false;
    let suggestedCorrection: string | undefined;
    
    if (driftScore >= this.DRIFT_THRESHOLD_CRITICAL) {
      severity = 'CRITICAL';
      requiresPause = true;
      suggestedCorrection = 'PAUSE PUBLISHING. Content has deviated significantly from brand voice. Manual review required.';
    } else if (driftScore >= this.DRIFT_THRESHOLD_WARNING) {
      severity = 'WARNING';
      suggestedCorrection = 'Review content before publishing. Some drift detected.';
    } else {
      severity = 'INFO';
    }

    const warning: DriftWarning = {
      contentId: `content_${Date.now()}`,
      driftScore: Math.round(driftScore),
      driftType,
      severity,
      suggestedCorrection,
      requiresPause
    };

    return {
      type: requiresPause ? 'FLAG' : 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: warning,
      requiresL5Approval: requiresPause,
      confidence: 0.8
    };
  }
}

// ============================================================================
// L6 CAPABILITY 5: REVENUE EARLY-WARNING SYSTEM
// ============================================================================

export class RevenueEarlyWarning {
  private readonly MODULE_NAME = 'L6_REVENUE_EARLY_WARNING';

  /**
   * Monitors revenue signals for anomalies and alerts L5.
   * READ-ONLY: No autonomous correction.
   */
  async analyzeRevenueSignals(data: {
    dailyRevenue: number[];
    conversionRate: number;
    avgOrderValue: number;
    churnRate: number;
    pipelineVelocity: number;
  }): Promise<L6AdvisoryOutput> {
    
    // Calculate trends
    const recentRevenue = data.dailyRevenue.slice(-7);
    const priorRevenue = data.dailyRevenue.slice(-14, -7);
    
    const recentAvg = recentRevenue.reduce((a, b) => a + b, 0) / recentRevenue.length || 0;
    const priorAvg = priorRevenue.reduce((a, b) => a + b, 0) / priorRevenue.length || 1;
    
    const revenueTrajectory = ((recentAvg - priorAvg) / priorAvg) * 100;
    
    // Warning thresholds
    const warnings: string[] = [];
    let riskLevel: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    
    if (revenueTrajectory < -20) {
      warnings.push(`CRITICAL: Revenue down ${Math.abs(Math.round(revenueTrajectory))}% week-over-week`);
      riskLevel = 'RED';
    } else if (revenueTrajectory < -10) {
      warnings.push(`WARNING: Revenue declining ${Math.abs(Math.round(revenueTrajectory))}%`);
      riskLevel = 'YELLOW';
    }
    
    if (data.conversionRate < 0.02) {
      warnings.push('WARNING: Conversion rate below 2% threshold');
      riskLevel = riskLevel === 'RED' ? 'RED' : 'YELLOW';
    }
    
    if (data.churnRate > 0.05) {
      warnings.push('WARNING: Churn rate exceeds 5% threshold');
      riskLevel = riskLevel === 'RED' ? 'RED' : 'YELLOW';
    }
    
    if (data.pipelineVelocity < 0.5) {
      warnings.push('ALERT: Pipeline velocity critically low');
      riskLevel = 'RED';
    }

    return {
      type: riskLevel === 'RED' ? 'ALERT' : 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        riskLevel,
        revenueTrajectory: Math.round(revenueTrajectory * 10) / 10,
        warnings,
        metrics: {
          conversionRate: data.conversionRate,
          avgOrderValue: data.avgOrderValue,
          churnRate: data.churnRate,
          pipelineVelocity: data.pipelineVelocity
        },
        recommendation: riskLevel === 'RED' 
          ? 'IMMEDIATE ACTION REQUIRED: Escalate to L5 CoS for intervention.'
          : 'Continue monitoring. No immediate action required.'
      },
      requiresL5Approval: riskLevel === 'RED',
      confidence: 0.85
    };
  }
}

// ============================================================================
// L6 CAPABILITY 6: OFFER SENSITIVITY SCANNER
// ============================================================================

export class OfferSensitivityScanner {
  private readonly MODULE_NAME = 'L6_OFFER_SENSITIVITY';

  /**
   * Price-Elasticity Predictor - predicts how offer changes affect conversion.
   * READ-ONLY: Only recommendations.
   */
  async scanOfferSensitivity(offer: {
    currentPrice: number;
    historicalConversions: number[];
    competitorPricing: number[];
    targetMargin: number;
  }): Promise<L6AdvisoryOutput> {
    
    const avgCompetitor = offer.competitorPricing.reduce((a, b) => a + b, 0) / offer.competitorPricing.length || offer.currentPrice;
    const pricePosition = ((offer.currentPrice - avgCompetitor) / avgCompetitor) * 100;
    
    let elasticityRating: 'INELASTIC' | 'MODERATE' | 'ELASTIC';
    let priceRecommendation: string;
    
    if (pricePosition > 20) {
      elasticityRating = 'ELASTIC';
      priceRecommendation = 'Price significantly above market. Consider value justification or price reduction.';
    } else if (pricePosition < -20) {
      elasticityRating = 'INELASTIC';
      priceRecommendation = 'Room for price increase. Market is less price-sensitive at this level.';
    } else {
      elasticityRating = 'MODERATE';
      priceRecommendation = 'Pricing aligned with market. Focus on differentiation.';
    }

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        currentPrice: offer.currentPrice,
        marketAverage: Math.round(avgCompetitor),
        pricePosition: `${pricePosition > 0 ? '+' : ''}${Math.round(pricePosition)}% vs market`,
        elasticityRating,
        recommendation: priceRecommendation,
        simulatedOptimalPrice: Math.round(avgCompetitor * (1 + (offer.targetMargin / 100)))
      },
      requiresL5Approval: false,
      confidence: 0.7
    };
  }
}

// ============================================================================
// L6 CAPABILITY 7: PATH FRICTION ANALYZER
// ============================================================================

export class PathFrictionAnalyzer {
  private readonly MODULE_NAME = 'L6_PATH_FRICTION';

  /**
   * Checkout Resistance Mapping - identifies friction points in conversion path.
   * READ-ONLY: Only diagnostic reports.
   */
  async analyzeFriction(pathData: {
    steps: { name: string; entryCount: number; exitCount: number }[];
  }): Promise<L6AdvisoryOutput> {
    
    const frictionPoints = pathData.steps.map((step, idx) => {
      const dropoffRate = step.entryCount > 0 
        ? ((step.entryCount - step.exitCount) / step.entryCount) * 100 
        : 0;
      
      return {
        step: step.name,
        position: idx + 1,
        entryCount: step.entryCount,
        completedCount: step.exitCount,
        dropoffRate: Math.round(dropoffRate * 10) / 10,
        severity: dropoffRate > 50 ? 'CRITICAL' : dropoffRate > 30 ? 'HIGH' : dropoffRate > 15 ? 'MODERATE' : 'LOW'
      };
    });

    const criticalFriction = frictionPoints.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
    const totalDropoff = frictionPoints.reduce((sum, f) => sum + f.dropoffRate, 0) / frictionPoints.length;

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        totalSteps: frictionPoints.length,
        averageDropoff: Math.round(totalDropoff * 10) / 10,
        frictionPoints,
        criticalPoints: criticalFriction,
        recommendation: criticalFriction.length > 0
          ? `PRIORITY: Address ${criticalFriction.length} high-friction steps. Focus on: ${criticalFriction.map(f => f.step).join(', ')}`
          : 'Conversion path is healthy. No critical friction detected.'
      },
      requiresL5Approval: false,
      confidence: 0.9
    };
  }
}

// ============================================================================
// L6 CAPABILITY 8: SIGNAL-TO-NOISE GATEKEEPER
// ============================================================================

export class SignalToNoiseGatekeeper {
  private readonly MODULE_NAME = 'L6_SIGNAL_NOISE_GATEKEEPER';

  /**
   * Clarity/ROI Alignment - filters noise from actionable signals.
   * READ-ONLY: Prioritization only.
   */
  async filterSignals(signals: {
    id: string;
    source: string;
    content: string;
    potentialRevenue: number;
    effortEstimate: number;
    timeToAction: number;
  }[]): Promise<L6AdvisoryOutput> {
    
    // Calculate ROI score for each signal
    const scoredSignals = signals.map(signal => {
      const roiScore = signal.potentialRevenue / (signal.effortEstimate * signal.timeToAction);
      const clarity = signal.content.length > 10 ? Math.min(1, 100 / signal.content.length) : 0.5;
      
      return {
        ...signal,
        roiScore: Math.round(roiScore * 100) / 100,
        clarityScore: Math.round(clarity * 100),
        priorityRank: 0,
        classification: roiScore > 10 ? 'SIGNAL' : roiScore > 2 ? 'WEAK_SIGNAL' : 'NOISE'
      };
    });

    // Rank by ROI
    scoredSignals.sort((a, b) => b.roiScore - a.roiScore);
    scoredSignals.forEach((s, idx) => s.priorityRank = idx + 1);

    const actionableSignals = scoredSignals.filter(s => s.classification === 'SIGNAL');
    const noiseFiltered = scoredSignals.filter(s => s.classification === 'NOISE');

    return {
      type: 'RANKING',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        totalSignals: signals.length,
        actionableSignals: actionableSignals.length,
        noiseFiltered: noiseFiltered.length,
        signalToNoiseRatio: signals.length > 0 ? Math.round((actionableSignals.length / signals.length) * 100) : 0,
        priorityQueue: actionableSignals.slice(0, 5),
        recommendation: `Focus on top ${Math.min(5, actionableSignals.length)} signals. ${noiseFiltered.length} items classified as noise.`
      },
      requiresL5Approval: false,
      confidence: 0.8
    };
  }
}

// ============================================================================
// L6 MASTER ORCHESTRATOR (Read-Only Coordinator)
// ============================================================================

export class L6ShadowModeOrchestrator {
  private propensityScorer = new PropensityToPayScorer();
  private sentimentHeatmap = new SentimentHeatmap();
  private shadowChallenger = new ShadowChallenger();
  private driftDetective = new DriftDetective();
  private revenueWarning = new RevenueEarlyWarning();
  private offerScanner = new OfferSensitivityScanner();
  private frictionAnalyzer = new PathFrictionAnalyzer();
  private signalGatekeeper = new SignalToNoiseGatekeeper();

  private advisoryQueue: L6AdvisoryOutput[] = [];

  /**
   * Process all L6 outputs and compile advisory report for L5 CoS.
   * READ-ONLY: No execution authority.
   */
  async generateAdvisoryReport(): Promise<{
    timestamp: string;
    l6Status: 'SHADOW_MODE_ACTIVE';
    totalAdvisories: number;
    criticalFlags: L6AdvisoryOutput[];
    priorityAdjustments: L6AdvisoryOutput[];
    pauseReviewFlags: L6AdvisoryOutput[];
    informationalReports: L6AdvisoryOutput[];
    l5ActionRequired: boolean;
  }> {
    const criticalFlags = this.advisoryQueue.filter(a => a.type === 'FLAG' || a.type === 'ALERT');
    const priorityAdjustments = this.advisoryQueue.filter(a => a.type === 'RANKING' || a.type === 'SCORE');
    const pauseReviewFlags = this.advisoryQueue.filter(a => a.requiresL5Approval);
    const informationalReports = this.advisoryQueue.filter(a => a.type === 'REPORT' && !a.requiresL5Approval);

    return {
      timestamp: new Date().toISOString(),
      l6Status: 'SHADOW_MODE_ACTIVE',
      totalAdvisories: this.advisoryQueue.length,
      criticalFlags,
      priorityAdjustments,
      pauseReviewFlags,
      informationalReports,
      l5ActionRequired: pauseReviewFlags.length > 0 || criticalFlags.length > 0
    };
  }

  /**
   * Add advisory to queue for L5 CoS consumption.
   */
  queueAdvisory(advisory: L6AdvisoryOutput): void {
    this.advisoryQueue.push(advisory);
  }

  /**
   * Clear advisory queue after L5 CoS has processed.
   */
  clearProcessedAdvisories(): void {
    this.advisoryQueue = [];
  }

  // Expose capability instances for direct use
  get scorer() { return this.propensityScorer; }
  get sentiment() { return this.sentimentHeatmap; }
  get simulator() { return this.shadowChallenger; }
  get driftDetector() { return this.driftDetective; }
  get revenueMonitor() { return this.revenueWarning; }
  get offerAnalyzer() { return this.offerScanner; }
  get friction() { return this.frictionAnalyzer; }
  get signalFilter() { return this.signalGatekeeper; }
}

// Export singleton instance
export const l6ShadowMode = new L6ShadowModeOrchestrator();
