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
// L6 CAPABILITY 9: LEAD QUALIFICATION AI
// ============================================================================

export interface LeadQualificationScore {
  leadId: string;
  companyName: string;
  overallScore: number; // 0-100
  icpMatchScore: number;
  firmographicScore: number;
  behavioralScore: number;
  tier: 'A' | 'B' | 'C' | 'D';
  qualificationReason: string;
  recommendedAction: string;
  disqualificationFlags: string[];
}

export class LeadQualificationAI {
  private readonly MODULE_NAME = 'L6_LEAD_QUALIFICATION_AI';

  /**
   * AUTO-QUALIFIES leads using firmographic + behavioral signals.
   * READ-ONLY: Scoring only. Cannot reject or route leads automatically.
   * L5 Constraint: Sales team focuses on highest-probability leads based on this score.
   */
  async qualifyLead(leadData: {
    leadId?: string;
    companyName?: string;
    company?: string;
    industry?: string;
    companySize?: number;
    jobTitle?: string;
    department?: string;
    emailDomain?: string;
    email?: string;
    linkedInEngagement?: number;
    websiteVisits?: number;
    contentDownloads?: number;
    emailOpens?: number;
    emailClicks?: number;
    daysInPipeline?: number;
  }): Promise<L6AdvisoryOutput> {
    
    // Normalize input with defaults
    const companyName = leadData.companyName || leadData.company || 'Unknown';
    const industry = leadData.industry || 'Unknown';
    const companySize = leadData.companySize || 100;
    const jobTitle = leadData.jobTitle || '';
    const department = leadData.department || '';
    const emailDomain = leadData.emailDomain || (leadData.email?.split('@')[1]) || '';
    const linkedInEngagement = leadData.linkedInEngagement || 0;
    const websiteVisits = leadData.websiteVisits || 0;
    const contentDownloads = leadData.contentDownloads || 0;
    const emailOpens = leadData.emailOpens || 0;
    const emailClicks = leadData.emailClicks || 0;
    const daysInPipeline = leadData.daysInPipeline || 0;
    
    // ICP Match Scoring for Life Sciences
    let icpMatchScore = 0;
    const lifeSciencesKeywords = ['pharma', 'biotech', 'medical device', 'life sciences', 'cro', 'cmo', 'diagnostics', 'clinical', 'regulatory', 'quality', 'validation', 'compliance', 'pharmaceutical', 'biotechnology'];
    const industryLower = industry.toLowerCase();
    
    if (lifeSciencesKeywords.some(kw => industryLower.includes(kw))) {
      icpMatchScore += 40;
    }
    
    // Job title scoring
    const decisionMakerTitles = ['vp', 'director', 'head of', 'chief', 'cto', 'cio', 'cqo', 'senior'];
    const qualityTitles = ['quality', 'validation', 'compliance', 'regulatory', 'qa', 'qc', 'audit'];
    const titleLower = jobTitle.toLowerCase();
    
    if (decisionMakerTitles.some(t => titleLower.includes(t))) icpMatchScore += 20;
    if (qualityTitles.some(t => titleLower.includes(t))) icpMatchScore += 20;
    
    // Department alignment
    const targetDepts = ['quality', 'validation', 'regulatory', 'compliance', 'it', 'operations'];
    if (targetDepts.some(d => department.toLowerCase().includes(d))) icpMatchScore += 20;
    
    icpMatchScore = Math.min(100, icpMatchScore);

    // Firmographic Scoring
    let firmographicScore = 0;
    
    // Company size (sweet spot: 100-5000 employees)
    if (companySize >= 100 && companySize <= 5000) {
      firmographicScore += 40;
    } else if (companySize > 5000) {
      firmographicScore += 30; // Enterprise, slower but bigger deals
    } else if (companySize >= 50) {
      firmographicScore += 20;
    }
    
    // Email domain scoring (corporate vs. generic)
    const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (emailDomain && !genericDomains.includes(emailDomain.toLowerCase())) {
      firmographicScore += 30;
    }
    
    // Recency penalty
    if (daysInPipeline > 90) {
      firmographicScore -= 20;
    } else if (daysInPipeline > 30) {
      firmographicScore -= 10;
    }
    
    firmographicScore = Math.max(0, Math.min(100, firmographicScore + 30)); // Base 30

    // Behavioral Scoring
    const behavioralScore = Math.min(100, 
      (linkedInEngagement * 15) +
      (websiteVisits * 5) +
      (contentDownloads * 20) +
      (emailOpens * 3) +
      (emailClicks * 10)
    );

    // Calculate overall score (weighted)
    const overallScore = Math.round(
      (icpMatchScore * 0.4) + 
      (firmographicScore * 0.3) + 
      (behavioralScore * 0.3)
    );

    // Tier assignment
    let tier: 'A' | 'B' | 'C' | 'D';
    let qualificationReason: string;
    let recommendedAction: string;
    const disqualificationFlags: string[] = [];

    if (overallScore >= 80) {
      tier = 'A';
      qualificationReason = 'HIGH-VALUE: Strong ICP match, engaged buyer, decision-maker.';
      recommendedAction = 'PRIORITY OUTREACH: Schedule call within 24 hours.';
    } else if (overallScore >= 60) {
      tier = 'B';
      qualificationReason = 'QUALIFIED: Good ICP alignment, moderate engagement.';
      recommendedAction = 'NURTURE: Send personalized follow-up, track engagement.';
    } else if (overallScore >= 40) {
      tier = 'C';
      qualificationReason = 'MARGINAL: Partial ICP match, limited engagement.';
      recommendedAction = 'AUTO-NURTURE: Add to drip campaign, monitor for signals.';
    } else {
      tier = 'D';
      qualificationReason = 'LOW-PRIORITY: Poor ICP match or disengaged.';
      recommendedAction = 'DEPRIORITIZE: Park in long-term nurture or disqualify.';
    }

    // Add disqualification flags
    if (!lifeSciencesKeywords.some(kw => industryLower.includes(kw))) {
      disqualificationFlags.push('NON_LIFE_SCIENCES_INDUSTRY');
    }
    if (daysInPipeline > 90) {
      disqualificationFlags.push('STALE_LEAD_90_DAYS');
    }
    if (emailDomain && genericDomains.includes(emailDomain.toLowerCase())) {
      disqualificationFlags.push('PERSONAL_EMAIL_DOMAIN');
    }

    const qualificationResult: LeadQualificationScore = {
      leadId: leadData.leadId || `lead_${Date.now()}`,
      companyName: companyName,
      overallScore,
      icpMatchScore,
      firmographicScore,
      behavioralScore,
      tier,
      qualificationReason,
      recommendedAction,
      disqualificationFlags
    };

    return {
      type: 'SCORE',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: qualificationResult,
      requiresL5Approval: false,
      confidence: 0.88
    };
  }

  /**
   * Batch qualify all leads and return prioritized list.
   */
  async qualifyBatch(leads: any[]): Promise<L6AdvisoryOutput> {
    const results = await Promise.all(leads.map(l => this.qualifyLead(l)));
    const scored = results.map(r => r.payload as LeadQualificationScore);
    
    // Sort by score descending
    scored.sort((a, b) => b.overallScore - a.overallScore);

    return {
      type: 'RANKING',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        totalLeads: scored.length,
        tierA: scored.filter(s => s.tier === 'A').length,
        tierB: scored.filter(s => s.tier === 'B').length,
        tierC: scored.filter(s => s.tier === 'C').length,
        tierD: scored.filter(s => s.tier === 'D').length,
        priorityQueue: scored.filter(s => s.tier === 'A' || s.tier === 'B'),
        disqualifiedCount: scored.filter(s => s.disqualificationFlags.length > 0).length,
        recommendation: `Focus on ${scored.filter(s => s.tier === 'A').length} Tier-A leads first. ${scored.filter(s => s.tier === 'D').length} leads deprioritized.`
      },
      requiresL5Approval: false,
      confidence: 0.88
    };
  }
}

// ============================================================================
// L6 CAPABILITY 10: OPTIMAL TIMING ENGINE
// ============================================================================

export interface TimingRecommendation {
  contactId: string;
  optimalSendTime: string;
  optimalDayOfWeek: string;
  timezone: string;
  confidenceScore: number;
  rationale: string;
  alternativeTimes: string[];
  avoidTimes: string[];
}

export class OptimalTimingEngine {
  private readonly MODULE_NAME = 'L6_OPTIMAL_TIMING_ENGINE';

  /**
   * Predicts best day/time to reach each contact based on patterns.
   * READ-ONLY: Advisory only. Cannot schedule or send outreach.
   * L5 Constraint: +20-40% open/response rates by hitting optimal windows.
   */
  async predictOptimalTiming(contactData: {
    contactId?: string;
    email?: string;
    timezone?: string;
    pastEmailOpens?: { timestamp: string }[];
    pastClicks?: { timestamp: string }[];
    linkedInActivityTimes?: { timestamp: string }[];
    emailOpenHistory?: { hour: number; dayOfWeek: number; opened: boolean }[];
    linkedinActiveHours?: number[];
    industry?: string;
    jobTitle?: string;
  }): Promise<L6AdvisoryOutput> {
    
    // Normalize input
    const contactId = contactData.contactId || contactData.email || `contact_${Date.now()}`;
    const pastEmailOpens = contactData.pastEmailOpens || [];
    const pastClicks = contactData.pastClicks || [];
    const linkedInActivityTimes = contactData.linkedInActivityTimes || [];
    const industry = contactData.industry || 'Life Sciences';
    const jobTitle = contactData.jobTitle || '';
    
    // Aggregate engagement times
    const allEngagements = [
      ...pastEmailOpens,
      ...pastClicks,
      ...linkedInActivityTimes
    ];

    // Default timezone
    const timezone = contactData.timezone || 'America/New_York';

    // Analyze engagement patterns by hour
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    
    allEngagements.forEach(e => {
      try {
        const date = new Date(e.timestamp);
        const hour = date.getHours();
        const day = date.getDay();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      } catch {}
    });

    // Find optimal hour
    let optimalHour = 9; // Default: 9 AM
    let maxHourCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        optimalHour = parseInt(hour);
      }
    });

    // Find optimal day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let optimalDay = 2; // Default: Tuesday
    let maxDayCount = 0;
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        optimalDay = parseInt(day);
      }
    });

    // Apply industry-specific heuristics
    const titleLower = jobTitle.toLowerCase();
    const isExecutive = ['vp', 'director', 'chief', 'head of'].some(t => titleLower.includes(t));
    
    // Executives: Earlier mornings, avoid Mondays
    if (isExecutive && optimalHour > 10) {
      optimalHour = 8;
    }
    if (isExecutive && optimalDay === 1) {
      optimalDay = 2; // Shift to Tuesday
    }

    // Format optimal time
    const optimalTimeStr = `${optimalHour.toString().padStart(2, '0')}:00`;
    
    // Calculate confidence based on data volume
    const confidenceScore = Math.min(0.95, 0.5 + (allEngagements.length * 0.05));

    // Generate alternative times
    const alternativeTimes = [
      `${(optimalHour + 2).toString().padStart(2, '0')}:00`,
      `${(optimalHour - 1 + 24) % 24}:00`.padStart(5, '0'),
    ].filter(t => t !== optimalTimeStr);

    // Avoid times (low engagement or meeting-heavy)
    const avoidTimes = ['12:00', '17:00', '18:00']; // Lunch, end of day

    const recommendation: TimingRecommendation = {
      contactId: contactId,
      optimalSendTime: optimalTimeStr,
      optimalDayOfWeek: dayNames[optimalDay],
      timezone,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      rationale: allEngagements.length > 5 
        ? `Based on ${allEngagements.length} historical engagement signals.`
        : `Limited data. Using industry best practices for ${industry}.`,
      alternativeTimes,
      avoidTimes
    };

    return {
      type: 'SCORE',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: recommendation,
      requiresL5Approval: false,
      confidence: confidenceScore
    };
  }

  /**
   * Predict optimal send time for batch email campaign.
   */
  async predictCampaignTiming(params: {
    audienceType: 'EXECUTIVES' | 'PRACTITIONERS' | 'MIXED';
    targetTimezone: string;
    campaignType: 'EMAIL_BLAST' | 'LINKEDIN_POST' | 'FOLLOW_UP';
  }): Promise<L6AdvisoryOutput> {
    
    // Industry best practices for Life Sciences
    const recommendations: Record<string, { time: string; day: string; rationale: string }> = {
      EXECUTIVES: {
        time: '07:30',
        day: 'Tuesday',
        rationale: 'Executives check email early before meetings. Tuesday avoids Monday backlog.'
      },
      PRACTITIONERS: {
        time: '10:00',
        day: 'Wednesday',
        rationale: 'Mid-week, mid-morning when lab/quality staff review emails between tasks.'
      },
      MIXED: {
        time: '09:00',
        day: 'Tuesday',
        rationale: 'Balanced timing for mixed audience. Early enough for executives, reasonable for practitioners.'
      }
    };

    const rec = recommendations[params.audienceType];

    // Adjust for LinkedIn
    if (params.campaignType === 'LINKEDIN_POST') {
      rec.time = '08:00';
      rec.rationale = 'LinkedIn engagement peaks during morning commute and early work hours.';
    }

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        audienceType: params.audienceType,
        campaignType: params.campaignType,
        recommendedSendTime: rec.time,
        recommendedDay: rec.day,
        timezone: params.targetTimezone,
        rationale: rec.rationale,
        alternatives: [
          { time: '14:00', day: 'Thursday', note: 'Afternoon alternative for follow-ups' }
        ],
        avoidWindows: [
          { time: 'Friday afternoon', reason: 'Low engagement, weekend mindset' },
          { time: 'Monday morning', reason: 'Email backlog overwhelm' }
        ]
      },
      requiresL5Approval: false,
      confidence: 0.85
    };
  }
}

// ============================================================================
// L6 CAPABILITY 11: OBJECTION PREDICTOR
// ============================================================================

export interface ObjectionPrediction {
  leadId: string;
  predictedObjections: {
    objection: string;
    probability: number;
    category: 'BUDGET' | 'TIMING' | 'AUTHORITY' | 'NEED' | 'TRUST' | 'COMPETITOR';
    counterArgument: string;
    supportingEvidence: string;
  }[];
  overallResistanceScore: number;
  briefingNotes: string;
}

export class ObjectionPredictor {
  private readonly MODULE_NAME = 'L6_OBJECTION_PREDICTOR';

  /**
   * Predicts likely objections before sales calls based on persona + behavior.
   * READ-ONLY: Briefing only. Cannot modify scripts or send prep emails.
   * L5 Constraint: Higher close rates by preparing counter-arguments.
   */
  async predictObjections(leadData: {
    leadId?: string;
    persona?: string;
    company?: string;
    companySize?: number;
    industry?: string;
    jobTitle?: string;
    currentSolution?: string;
    pricingTierViewed?: string;
    timeOnPricingPage?: number;
    competitorMentions?: string[];
    stageInPipeline?: string;
    dealStage?: string;
    previousObjections?: string[];
    companyRecentNews?: string;
  }): Promise<L6AdvisoryOutput> {
    
    // Normalize inputs with defaults
    const leadId = leadData.leadId || `lead_${Date.now()}`;
    const jobTitle = leadData.jobTitle || leadData.persona || '';
    const industry = leadData.industry || 'Life Sciences';
    const companySize = leadData.companySize || 100;
    const currentSolution = leadData.currentSolution || '';
    const timeOnPricingPage = leadData.timeOnPricingPage || 0;
    const competitorMentions = leadData.competitorMentions || [];
    const stageInPipeline = leadData.stageInPipeline || leadData.dealStage || 'DISCOVERY';
    const previousObjections = leadData.previousObjections || [];
    const companyRecentNews = leadData.companyRecentNews || '';
    
    const predictedObjections: ObjectionPrediction['predictedObjections'] = [];
    const titleLower = jobTitle.toLowerCase();
    const industryLower = industry.toLowerCase();

    // BUDGET objections
    if (timeOnPricingPage > 120 || companySize < 100) {
      predictedObjections.push({
        objection: "It's too expensive for our budget right now",
        probability: 0.75,
        category: 'BUDGET',
        counterArgument: "Let's look at the cost of manual validation errors vs. our solution. One FDA warning letter costs $500K+ in remediation. Our annual cost is a fraction of that risk.",
        supportingEvidence: "Case study: [Client X] saved $1.2M in audit prep costs in Year 1."
      });
    }

    // TIMING objections
    if (stageInPipeline === 'EARLY' || previousObjections.includes('timing')) {
      predictedObjections.push({
        objection: "We're not ready to implement this right now",
        probability: 0.65,
        category: 'TIMING',
        counterArgument: "I understand timing is crucial. Many clients start with our Audit Readiness Assessment to identify gaps before a major audit. When is your next inspection?",
        supportingEvidence: "Average implementation time: 4-6 weeks. Start now to be ready for Q1 audits."
      });
    }

    // AUTHORITY objections
    if (!['vp', 'director', 'chief', 'head of', 'senior'].some(t => titleLower.includes(t))) {
      predictedObjections.push({
        objection: "I need to run this by my manager/VP",
        probability: 0.80,
        category: 'AUTHORITY',
        counterArgument: "Absolutely. Would it help if I prepared a brief executive summary highlighting the compliance risk reduction and ROI? I can also join a call with your VP if useful.",
        supportingEvidence: "Provide ROI calculator and risk assessment one-pager for escalation."
      });
    }

    // NEED objections
    if (currentSolution && currentSolution !== 'none') {
      predictedObjections.push({
        objection: "We already have a system that works fine",
        probability: 0.60,
        category: 'NEED',
        counterArgument: "Many of our clients came from [competitor]. The key difference is our audit-first approach—we're built specifically for FDA/EMA inspection readiness, not just documentation.",
        supportingEvidence: "Gap analysis showing 5 common audit failures with legacy systems."
      });
    }

    // COMPETITOR objections
    if (competitorMentions.length > 0) {
      const topCompetitor = competitorMentions[0];
      predictedObjections.push({
        objection: `We're also looking at ${topCompetitor}`,
        probability: 0.70,
        category: 'COMPETITOR',
        counterArgument: `Good to hear you're doing your research. The key question is: can ${topCompetitor} demonstrate audit-ready evidence in under 5 minutes? We can. Want me to show you?`,
        supportingEvidence: `Competitive battlecard: ${topCompetitor} comparison available.`
      });
    }

    // TRUST objections (new vendor hesitation)
    if (companyRecentNews.toLowerCase().includes('acquisition') || 
        companyRecentNews.toLowerCase().includes('layoff')) {
      predictedObjections.push({
        objection: "We're hesitant to bring on new vendors during this transition",
        probability: 0.55,
        category: 'TRUST',
        counterArgument: "I completely understand. Actually, transitions are often when compliance gaps appear. A quick assessment now could prevent issues during the integration.",
        supportingEvidence: "Reference: [Client Y] implemented during M&A and avoided 3 FDA observations."
      });
    }

    // Calculate overall resistance
    const overallResistanceScore = predictedObjections.length > 0
      ? Math.round(predictedObjections.reduce((sum, o) => sum + o.probability, 0) / predictedObjections.length * 100)
      : 20;

    // Generate briefing notes
    const topObjections = predictedObjections.sort((a, b) => b.probability - a.probability).slice(0, 3);
    const briefingNotes = topObjections.length > 0
      ? `CALL PREP: Expect ${topObjections.map(o => o.category).join(', ')} objections. Lead has ${competitorMentions.length > 0 ? 'competitor exposure' : 'no known competitor exposure'}. ${timeOnPricingPage > 60 ? 'Spent significant time on pricing—be ready to discuss value.' : ''}`
      : 'LOW RESISTANCE: Lead shows strong buying signals. Focus on closing.';

    const prediction: ObjectionPrediction = {
      leadId: leadId,
      predictedObjections,
      overallResistanceScore,
      briefingNotes
    };

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: prediction,
      requiresL5Approval: false,
      confidence: 0.82
    };
  }

  /**
   * Generate call prep briefing for sales team.
   */
  async generateCallBriefing(leads: any[]): Promise<L6AdvisoryOutput> {
    const predictions = await Promise.all(leads.map(l => this.predictObjections(l)));
    const briefings = predictions.map(p => ({
      leadId: (p.payload as ObjectionPrediction).leadId,
      resistanceScore: (p.payload as ObjectionPrediction).overallResistanceScore,
      topObjection: (p.payload as ObjectionPrediction).predictedObjections[0]?.objection || 'None predicted',
      briefing: (p.payload as ObjectionPrediction).briefingNotes
    }));

    // Sort by resistance (hardest calls first for prep)
    briefings.sort((a, b) => b.resistanceScore - a.resistanceScore);

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        totalLeads: briefings.length,
        highResistance: briefings.filter(b => b.resistanceScore > 60).length,
        lowResistance: briefings.filter(b => b.resistanceScore <= 40).length,
        briefings,
        recommendation: `${briefings.filter(b => b.resistanceScore > 60).length} leads require extra prep. Review counter-arguments before calls.`
      },
      requiresL5Approval: false,
      confidence: 0.82
    };
  }
}

// ============================================================================
// L6 CAPABILITY 12: INBOUND RESPONSE ROUTER
// ============================================================================

export interface RoutedResponse {
  responseId: string;
  source: 'EMAIL' | 'LINKEDIN' | 'WEBSITE_CHAT' | 'FORM';
  leadId: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityScore: number;
  responseType: 'HOT_LEAD' | 'QUESTION' | 'OBJECTION' | 'MEETING_REQUEST' | 'UNSUBSCRIBE' | 'SPAM' | 'OTHER';
  suggestedAction: string;
  suggestedResponseTime: string;
  assignedQueue: string;
}

export class InboundResponseRouter {
  private readonly MODULE_NAME = 'L6_INBOUND_RESPONSE_ROUTER';

  /**
   * Prioritizes replies across email/LinkedIn once response volume grows.
   * READ-ONLY: Routing recommendations only. Cannot send responses.
   * L5 Constraint: Prevents hot leads from getting buried in noise.
   */
  async routeResponse(response: {
    responseId: string;
    source: 'EMAIL' | 'LINKEDIN' | 'WEBSITE_CHAT' | 'FORM';
    leadId: string;
    senderName: string;
    senderTitle: string;
    senderCompany: string;
    content: string;
    timestamp: string;
    leadScore?: number;
    inReplyTo?: string;
  }): Promise<L6AdvisoryOutput> {
    
    const contentLower = response.content.toLowerCase();
    
    // Detect response type
    let responseType: RoutedResponse['responseType'] = 'OTHER';
    let priorityScore = 50;
    
    // HOT LEAD signals
    const hotSignals = ['interested', 'demo', 'pricing', 'call', 'meet', 'schedule', 'quote', 'proposal', 'budget', 'timeline'];
    if (hotSignals.some(s => contentLower.includes(s))) {
      responseType = 'HOT_LEAD';
      priorityScore = 95;
    }
    
    // MEETING REQUEST
    const meetingSignals = ['schedule', 'calendar', 'available', 'meet', 'call me', 'set up a time'];
    if (meetingSignals.some(s => contentLower.includes(s))) {
      responseType = 'MEETING_REQUEST';
      priorityScore = Math.max(priorityScore, 90);
    }
    
    // QUESTION
    const questionSignals = ['?', 'how does', 'what is', 'can you explain', 'tell me more', 'curious'];
    if (questionSignals.some(s => contentLower.includes(s))) {
      responseType = responseType === 'OTHER' ? 'QUESTION' : responseType;
      priorityScore = Math.max(priorityScore, 70);
    }
    
    // OBJECTION
    const objectionSignals = ['not interested', 'too expensive', 'not right now', 'maybe later', 'already have', 'no budget'];
    if (objectionSignals.some(s => contentLower.includes(s))) {
      responseType = 'OBJECTION';
      priorityScore = 60; // Important but not urgent
    }
    
    // UNSUBSCRIBE
    const unsubSignals = ['unsubscribe', 'remove me', 'stop emailing', 'opt out'];
    if (unsubSignals.some(s => contentLower.includes(s))) {
      responseType = 'UNSUBSCRIBE';
      priorityScore = 80; // Process quickly for compliance
    }
    
    // SPAM indicators
    const spamSignals = ['free offer', 'click here', 'act now', 'limited time', 'congratulations'];
    if (spamSignals.some(s => contentLower.includes(s)) && !response.inReplyTo) {
      responseType = 'SPAM';
      priorityScore = 10;
    }

    // Boost score based on sender title
    const titleLower = response.senderTitle.toLowerCase();
    if (['vp', 'director', 'chief', 'head of'].some(t => titleLower.includes(t))) {
      priorityScore = Math.min(100, priorityScore + 15);
    }

    // Boost based on existing lead score
    if (response.leadScore && response.leadScore > 70) {
      priorityScore = Math.min(100, priorityScore + 10);
    }

    // Determine priority tier
    let priority: RoutedResponse['priority'];
    if (priorityScore >= 85) priority = 'URGENT';
    else if (priorityScore >= 65) priority = 'HIGH';
    else if (priorityScore >= 40) priority = 'MEDIUM';
    else priority = 'LOW';

    // Generate suggested action
    let suggestedAction: string;
    let suggestedResponseTime: string;
    let assignedQueue: string;

    switch (responseType) {
      case 'HOT_LEAD':
        suggestedAction = 'IMMEDIATE: Respond with personalized message. Offer calendar link for demo.';
        suggestedResponseTime = '< 1 hour';
        assignedQueue = 'SALES_URGENT';
        break;
      case 'MEETING_REQUEST':
        suggestedAction = 'RESPOND NOW: Send calendar availability. Confirm meeting within 24h.';
        suggestedResponseTime = '< 30 minutes';
        assignedQueue = 'SALES_URGENT';
        break;
      case 'QUESTION':
        suggestedAction = 'ANSWER: Provide helpful response. Include relevant resource link.';
        suggestedResponseTime = '< 4 hours';
        assignedQueue = 'SALES_STANDARD';
        break;
      case 'OBJECTION':
        suggestedAction = 'NURTURE: Acknowledge concern. Provide counter-argument with proof point.';
        suggestedResponseTime = '< 24 hours';
        assignedQueue = 'SALES_NURTURE';
        break;
      case 'UNSUBSCRIBE':
        suggestedAction = 'PROCESS: Honor request immediately. Required for CAN-SPAM compliance.';
        suggestedResponseTime = '< 1 hour';
        assignedQueue = 'OPERATIONS';
        break;
      case 'SPAM':
        suggestedAction = 'IGNORE: Mark as spam. Do not respond.';
        suggestedResponseTime = 'N/A';
        assignedQueue = 'SPAM_FILTER';
        break;
      default:
        suggestedAction = 'REVIEW: Manual triage needed. Unclear intent.';
        suggestedResponseTime = '< 24 hours';
        assignedQueue = 'SALES_STANDARD';
    }

    const routed: RoutedResponse = {
      responseId: response.responseId,
      source: response.source,
      leadId: response.leadId,
      priority,
      priorityScore,
      responseType,
      suggestedAction,
      suggestedResponseTime,
      assignedQueue
    };

    return {
      type: priority === 'URGENT' ? 'ALERT' : 'SCORE',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: routed,
      requiresL5Approval: false,
      confidence: 0.85
    };
  }

  /**
   * Process and prioritize batch of inbound responses.
   */
  async routeBatch(responses: any[]): Promise<L6AdvisoryOutput> {
    const results = await Promise.all(responses.map(r => this.routeResponse(r)));
    const routed = results.map(r => r.payload as RoutedResponse);
    
    // Sort by priority score descending
    routed.sort((a, b) => b.priorityScore - a.priorityScore);

    const urgent = routed.filter(r => r.priority === 'URGENT');
    const high = routed.filter(r => r.priority === 'HIGH');

    return {
      type: urgent.length > 0 ? 'ALERT' : 'RANKING',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        totalResponses: routed.length,
        urgentCount: urgent.length,
        highCount: high.length,
        mediumCount: routed.filter(r => r.priority === 'MEDIUM').length,
        lowCount: routed.filter(r => r.priority === 'LOW').length,
        spamFiltered: routed.filter(r => r.responseType === 'SPAM').length,
        hotLeads: routed.filter(r => r.responseType === 'HOT_LEAD').length,
        priorityQueue: routed.filter(r => r.priority === 'URGENT' || r.priority === 'HIGH'),
        recommendation: urgent.length > 0 
          ? `URGENT: ${urgent.length} responses require immediate attention! ${high.length} more are high priority.`
          : `${high.length} high-priority responses in queue. ${routed.filter(r => r.responseType === 'SPAM').length} filtered as spam.`
      },
      requiresL5Approval: false,
      confidence: 0.85
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
// L6 CAPABILITY 13: DARK SOCIAL INTENT MINER
// ============================================================================

interface DarkSocialSignal {
  signalId: string;
  platform: 'LINKEDIN' | 'TWITTER' | 'SLACK' | 'DISCORD' | 'COMMUNITY';
  signalType: 'REACTION' | 'COMMENT' | 'SHARE' | 'PROFILE_VIEW' | 'GROUP_ACTIVITY' | 'MENTION' | 'DM_OPEN';
  personaTag: string;
  companyName?: string;
  jobTitle?: string;
  industry?: string;
  engagementDepth: number; // 1-10 scale
  timestamp: string;
  content?: string;
  sourcePost?: string;
  groupName?: string;
}

interface DarkSocialIntentScore {
  prospectId: string;
  name?: string;
  company?: string;
  title?: string;
  intentScore: number; // 0-100
  signalCount: number;
  signals: DarkSocialSignal[];
  buyingStage: 'AWARENESS' | 'CONSIDERATION' | 'DECISION' | 'DORMANT';
  icpMatch: number; // 0-100
  recommendedAction: string;
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export class DarkSocialIntentMiner {
  private readonly MODULE_NAME = 'L6_DARK_SOCIAL_INTENT_MINER';

  /**
   * Mines LinkedIn and other dark social signals to identify high-intent prospects.
   * READ-ONLY: Scores signals but cannot reach out automatically.
   * L5 Constraint: Prioritizes prospects for CoS/CRO to action.
   * 
   * KEY INSIGHT: Most B2B buyers research in "dark social" (private channels,
   * LinkedIn groups, DMs) before ever filling out a form. This capability
   * surfaces those hidden signals.
   */
  async mineSignal(signal: Omit<DarkSocialSignal, 'signalId'>): Promise<L6AdvisoryOutput> {
    const signalId = `dss_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const fullSignal: DarkSocialSignal = {
      signalId,
      ...signal
    };

    // Calculate engagement depth score
    let depthMultiplier = 1;
    
    // Higher value signals
    const highValueSignals = ['COMMENT', 'SHARE', 'DM_OPEN', 'GROUP_ACTIVITY'];
    if (highValueSignals.includes(signal.signalType)) {
      depthMultiplier = 1.5;
    }
    
    // LinkedIn is highest priority for B2B Life Sciences
    if (signal.platform === 'LINKEDIN') {
      depthMultiplier *= 1.3;
    }

    // ICP matching for Life Sciences
    let icpScore = 50; // Base score
    const lifeSciencesKeywords = ['pharma', 'biotech', 'medical device', 'life sciences', 'cro', 'cmo', 
                                   'diagnostics', 'clinical', 'regulatory', 'quality', 'validation', 
                                   'compliance', 'fda', 'ema', 'gxp', 'gmp', 'csv'];
    
    const industryLower = (signal.industry || '').toLowerCase();
    const titleLower = (signal.jobTitle || '').toLowerCase();
    const contentLower = (signal.content || '').toLowerCase();
    
    const industryMatches = lifeSciencesKeywords.filter(kw => industryLower.includes(kw)).length;
    const titleMatches = lifeSciencesKeywords.filter(kw => titleLower.includes(kw)).length;
    const contentMatches = lifeSciencesKeywords.filter(kw => contentLower.includes(kw)).length;
    
    icpScore += industryMatches * 15;
    icpScore += titleMatches * 10;
    icpScore += contentMatches * 5;
    icpScore = Math.min(100, icpScore);

    // Decision-maker title boost
    const decisionMakerTitles = ['director', 'vp', 'vice president', 'head', 'chief', 'senior', 'manager', 'lead'];
    if (decisionMakerTitles.some(t => titleLower.includes(t))) {
      icpScore = Math.min(100, icpScore + 15);
    }

    // Calculate overall intent score
    const baseIntent = signal.engagementDepth * 10;
    const intentScore = Math.min(100, Math.round(baseIntent * depthMultiplier * (icpScore / 50)));

    // Determine urgency
    let urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
    if (intentScore >= 80 && icpScore >= 70) {
      urgency = 'IMMEDIATE';
    } else if (intentScore >= 60 || icpScore >= 80) {
      urgency = 'HIGH';
    } else if (intentScore >= 40) {
      urgency = 'MEDIUM';
    } else {
      urgency = 'LOW';
    }

    // Generate recommended action
    let recommendedAction: string;
    if (urgency === 'IMMEDIATE') {
      recommendedAction = `HOT PROSPECT: ${signal.personaTag} showed high intent. Connect on LinkedIn within 24h with personalized message referencing their ${signal.signalType.toLowerCase()}.`;
    } else if (urgency === 'HIGH') {
      recommendedAction = `WARM PROSPECT: Add to priority nurture sequence. Monitor for additional signals before direct outreach.`;
    } else if (urgency === 'MEDIUM') {
      recommendedAction = `NURTURE: Include in content distribution for Audit Readiness topic. Build relationship over 2-4 weeks.`;
    } else {
      recommendedAction = `MONITOR: Log signal but no immediate action. May not be ICP fit.`;
    }

    return {
      type: 'ALERT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        signalId,
        platform: signal.platform,
        signalType: signal.signalType,
        personaTag: signal.personaTag,
        company: signal.companyName,
        title: signal.jobTitle,
        intentScore,
        icpScore,
        urgency,
        recommendedAction,
        sourcePost: signal.sourcePost,
        groupName: signal.groupName,
        rawSignal: fullSignal
      },
      requiresL5Approval: false,
      confidence: 0.78
    };
  }

  /**
   * Batch analyze all dark social signals for a time period.
   * Returns ranked list of high-intent prospects.
   */
  async analyzeSignalBatch(signals: Omit<DarkSocialSignal, 'signalId'>[]): Promise<L6AdvisoryOutput> {
    const processedSignals = await Promise.all(
      signals.map(s => this.mineSignal(s))
    );

    // Group by prospect/persona
    const prospectMap = new Map<string, {
      signals: any[];
      totalIntent: number;
      maxIcp: number;
    }>();

    for (const result of processedSignals) {
      const key = result.payload.personaTag;
      const existing = prospectMap.get(key) || { signals: [], totalIntent: 0, maxIcp: 0 };
      existing.signals.push(result.payload);
      existing.totalIntent += result.payload.intentScore;
      existing.maxIcp = Math.max(existing.maxIcp, result.payload.icpScore);
      prospectMap.set(key, existing);
    }

    // Convert to ranked list
    const rankedProspects = Array.from(prospectMap.entries())
      .map(([persona, data]) => ({
        personaTag: persona,
        signalCount: data.signals.length,
        combinedIntentScore: Math.min(100, Math.round(data.totalIntent / data.signals.length * (1 + data.signals.length * 0.1))),
        icpScore: data.maxIcp,
        company: data.signals[0]?.company,
        title: data.signals[0]?.title,
        topSignals: data.signals.slice(0, 3)
      }))
      .sort((a, b) => b.combinedIntentScore - a.combinedIntentScore);

    const hotProspects = rankedProspects.filter(p => p.combinedIntentScore >= 70);
    const warmProspects = rankedProspects.filter(p => p.combinedIntentScore >= 40 && p.combinedIntentScore < 70);

    return {
      type: 'RANKING',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        totalSignals: signals.length,
        uniqueProspects: rankedProspects.length,
        hotProspects: hotProspects.length,
        warmProspects: warmProspects.length,
        priorityQueue: rankedProspects.slice(0, 10),
        insight: hotProspects.length > 0 
          ? `${hotProspects.length} HIGH-INTENT prospects detected. Top prospect: ${hotProspects[0]?.personaTag} (${hotProspects[0]?.company || 'Unknown Company'})`
          : 'No hot prospects in this batch. Consider expanding dark social monitoring.',
        recommendation: `Focus outreach on top ${Math.min(5, hotProspects.length)} prospects. ${warmProspects.length} prospects in nurture stage.`
      },
      requiresL5Approval: false,
      confidence: 0.82
    };
  }

  /**
   * Real-time LinkedIn group monitoring summary.
   * Identifies which LinkedIn groups are generating the most ICP signals.
   */
  async analyzeGroupActivity(groupSignals: {
    groupName: string;
    groupId?: string;
    memberCount?: number;
    signals: Omit<DarkSocialSignal, 'signalId'>[];
  }[]): Promise<L6AdvisoryOutput> {
    const groupAnalysis = await Promise.all(
      groupSignals.map(async (group) => {
        const signalResults = await Promise.all(
          group.signals.map(s => this.mineSignal({ ...s, groupName: group.groupName }))
        );
        
        const avgIntent = signalResults.reduce((sum, r) => sum + r.payload.intentScore, 0) / signalResults.length || 0;
        const avgIcp = signalResults.reduce((sum, r) => sum + r.payload.icpScore, 0) / signalResults.length || 0;
        const hotSignals = signalResults.filter(r => r.payload.urgency === 'IMMEDIATE' || r.payload.urgency === 'HIGH');
        
        return {
          groupName: group.groupName,
          memberCount: group.memberCount,
          signalCount: group.signals.length,
          avgIntentScore: Math.round(avgIntent),
          avgIcpScore: Math.round(avgIcp),
          hotProspectCount: hotSignals.length,
          roi: Math.round((avgIntent * avgIcp * group.signals.length) / 1000),
          priority: avgIcp >= 70 && avgIntent >= 50 ? 'HIGH' : avgIcp >= 50 ? 'MEDIUM' : 'LOW'
        };
      })
    );

    // Rank groups by ROI
    groupAnalysis.sort((a, b) => b.roi - a.roi);

    const priorityGroups = groupAnalysis.filter(g => g.priority === 'HIGH');

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        totalGroups: groupSignals.length,
        priorityGroups: priorityGroups.length,
        groupRankings: groupAnalysis,
        topGroup: groupAnalysis[0],
        recommendation: priorityGroups.length > 0
          ? `Focus engagement on ${priorityGroups.length} high-priority groups. Top: "${priorityGroups[0]?.groupName}" (${priorityGroups[0]?.hotProspectCount} hot prospects)`
          : 'No high-priority groups identified. Consider joining more Life Sciences focused groups.',
        darkSocialStrategy: 'Post value-first content in top 3 groups 2-3x/week. Engage thoughtfully on comments. Avoid direct pitching.'
      },
      requiresL5Approval: false,
      confidence: 0.75
    };
  }
}

// ============================================================================
// L6 CAPABILITY 14: LEAD MAGNET ACTIVATION TRACKER
// ============================================================================

interface LeadMagnetDownload {
  downloadId: string;
  leadMagnetType: 'AUDIT_READINESS_CHECKLIST' | 'WHITEPAPER' | 'CASE_STUDY' | 'TEMPLATE' | 'GUIDE' | 'WEBINAR';
  leadMagnetName: string;
  downloadTimestamp: string;
  
  // Source tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
  linkedinPostId?: string;
  linkedinGroupId?: string;
  linkedinGroupName?: string;
  
  // Lead info
  email?: string;
  name?: string;
  company?: string;
  jobTitle?: string;
  
  // Engagement
  timeOnPage?: number; // seconds
  scrollDepth?: number; // 0-100%
  completedForm?: boolean;
  formFields?: Record<string, any>;
}

interface LeadMagnetConversionReport {
  leadMagnetName: string;
  totalDownloads: number;
  conversionRate: number;
  topSources: { source: string; count: number; conversionRate: number }[];
  avgTimeToDownload: number;
  qualityScore: number; // Based on ICP match of downloaders
}

export class LeadMagnetActivationTracker {
  private readonly MODULE_NAME = 'L6_LEAD_MAGNET_ACTIVATION_TRACKER';

  /**
   * Tracks lead magnet downloads and correlates them to dark social sources.
   * READ-ONLY: Provides attribution and conversion insights.
   * L5 Constraint: CoS/CMO uses insights to optimize distribution strategy.
   * 
   * KEY INSIGHT: Connects the "Audit Readiness Checklist" downloads back to
   * which LinkedIn posts/groups drove them, proving dark social ROI.
   */
  async trackDownload(download: Omit<LeadMagnetDownload, 'downloadId'>): Promise<L6AdvisoryOutput> {
    const downloadId = `lmd_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Determine source category
    let sourceCategory: 'LINKEDIN_POST' | 'LINKEDIN_GROUP' | 'EMAIL' | 'DIRECT' | 'ORGANIC_SEARCH' | 'PAID' | 'REFERRAL' | 'UNKNOWN';
    let sourceName = 'Unknown';
    
    if (download.linkedinPostId || download.utm_source?.toLowerCase().includes('linkedin')) {
      sourceCategory = download.linkedinGroupId ? 'LINKEDIN_GROUP' : 'LINKEDIN_POST';
      sourceName = download.linkedinGroupName || download.utm_campaign || 'LinkedIn';
    } else if (download.utm_source?.toLowerCase().includes('email') || download.utm_medium?.toLowerCase() === 'email') {
      sourceCategory = 'EMAIL';
      sourceName = download.utm_campaign || 'Email Campaign';
    } else if (download.utm_medium?.toLowerCase() === 'cpc' || download.utm_medium?.toLowerCase() === 'paid') {
      sourceCategory = 'PAID';
      sourceName = download.utm_source || 'Paid Campaign';
    } else if (download.referrer && !download.referrer.includes(process.env.REPLIT_DEV_DOMAIN || 'complianceworxs')) {
      sourceCategory = 'REFERRAL';
      sourceName = new URL(download.referrer).hostname;
    } else if (download.referrer?.includes('google') || download.referrer?.includes('bing')) {
      sourceCategory = 'ORGANIC_SEARCH';
      sourceName = 'Organic Search';
    } else if (!download.referrer || download.referrer === '') {
      sourceCategory = 'DIRECT';
      sourceName = 'Direct Traffic';
    } else {
      sourceCategory = 'UNKNOWN';
    }

    // Calculate lead quality score based on ICP signals
    let qualityScore = 50; // Base score
    const lifeSciencesKeywords = ['pharma', 'biotech', 'medical device', 'life sciences', 'cro', 'cmo',
                                   'diagnostics', 'clinical', 'regulatory', 'quality', 'validation',
                                   'compliance', 'fda', 'ema', 'gxp', 'gmp'];
    
    const companyLower = (download.company || '').toLowerCase();
    const titleLower = (download.jobTitle || '').toLowerCase();
    
    if (lifeSciencesKeywords.some(kw => companyLower.includes(kw) || titleLower.includes(kw))) {
      qualityScore += 25;
    }
    
    // Decision-maker boost
    const decisionMakerTitles = ['director', 'vp', 'vice president', 'head', 'chief', 'senior manager'];
    if (decisionMakerTitles.some(t => titleLower.includes(t))) {
      qualityScore += 20;
    }
    
    // Corporate email boost (not gmail, yahoo, etc.)
    const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    if (download.email && !genericDomains.some(d => download.email?.toLowerCase().includes(d))) {
      qualityScore += 10;
    }
    
    // Engagement boost
    if ((download.timeOnPage || 0) > 120) qualityScore += 5; // 2+ minutes
    if ((download.scrollDepth || 0) > 75) qualityScore += 5; // Read most of page
    
    qualityScore = Math.min(100, qualityScore);

    // Calculate conversion stage
    let conversionStage: 'AWARENESS' | 'INTEREST' | 'CONSIDERATION' | 'INTENT';
    if (qualityScore >= 80 && (download.timeOnPage || 0) > 180) {
      conversionStage = 'INTENT';
    } else if (qualityScore >= 60) {
      conversionStage = 'CONSIDERATION';
    } else if (qualityScore >= 40) {
      conversionStage = 'INTEREST';
    } else {
      conversionStage = 'AWARENESS';
    }

    // Generate recommendation
    let recommendation: string;
    if (conversionStage === 'INTENT') {
      recommendation = `HIGH-VALUE LEAD: ${download.name || 'Unknown'} from ${download.company || 'Unknown Company'}. Trigger immediate sales follow-up sequence.`;
    } else if (conversionStage === 'CONSIDERATION') {
      recommendation = `QUALIFIED LEAD: Add to nurture sequence. Send case study within 48h.`;
    } else if (conversionStage === 'INTEREST') {
      recommendation = `EARLY STAGE: Add to email newsletter. Monitor for additional engagement.`;
    } else {
      recommendation = `AWARENESS: Track but no immediate action. May not be ICP fit.`;
    }

    return {
      type: 'ALERT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        downloadId,
        leadMagnetType: download.leadMagnetType,
        leadMagnetName: download.leadMagnetName,
        sourceCategory,
        sourceName,
        linkedinGroupName: download.linkedinGroupName,
        linkedinPostId: download.linkedinPostId,
        lead: {
          email: download.email,
          name: download.name,
          company: download.company,
          jobTitle: download.jobTitle
        },
        qualityScore,
        conversionStage,
        engagement: {
          timeOnPage: download.timeOnPage,
          scrollDepth: download.scrollDepth,
          completedForm: download.completedForm
        },
        recommendation,
        attribution: {
          utm_source: download.utm_source,
          utm_medium: download.utm_medium,
          utm_campaign: download.utm_campaign,
          utm_content: download.utm_content
        }
      },
      requiresL5Approval: false,
      confidence: 0.85
    };
  }

  /**
   * Generate conversion funnel report for a lead magnet.
   * Shows which dark social sources are actually converting.
   */
  async generateConversionReport(downloads: Omit<LeadMagnetDownload, 'downloadId'>[], leadMagnetName: string): Promise<L6AdvisoryOutput> {
    const processedDownloads = await Promise.all(
      downloads.map(d => this.trackDownload(d))
    );

    // Group by source
    const sourceMap = new Map<string, {
      count: number;
      qualitySum: number;
      highQualityCount: number;
      intentCount: number;
    }>();

    for (const result of processedDownloads) {
      const source = result.payload.sourceName;
      const existing = sourceMap.get(source) || { count: 0, qualitySum: 0, highQualityCount: 0, intentCount: 0 };
      existing.count++;
      existing.qualitySum += result.payload.qualityScore;
      if (result.payload.qualityScore >= 70) existing.highQualityCount++;
      if (result.payload.conversionStage === 'INTENT') existing.intentCount++;
      sourceMap.set(source, existing);
    }

    // Convert to ranked list
    const topSources = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        count: data.count,
        avgQuality: Math.round(data.qualitySum / data.count),
        highQualityRate: Math.round((data.highQualityCount / data.count) * 100),
        intentRate: Math.round((data.intentCount / data.count) * 100),
        roi: Math.round((data.qualitySum / data.count) * data.count / 10) // Simplified ROI
      }))
      .sort((a, b) => b.roi - a.roi);

    const overallQuality = processedDownloads.reduce((sum, r) => sum + r.payload.qualityScore, 0) / processedDownloads.length || 0;
    const intentLeads = processedDownloads.filter(r => r.payload.conversionStage === 'INTENT');
    const linkedinSources = topSources.filter(s => s.source.toLowerCase().includes('linkedin') || s.source.includes('Group'));

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        leadMagnetName,
        totalDownloads: downloads.length,
        uniqueSources: topSources.length,
        avgQualityScore: Math.round(overallQuality),
        intentLeadCount: intentLeads.length,
        intentConversionRate: Math.round((intentLeads.length / downloads.length) * 100),
        topSources: topSources.slice(0, 10),
        linkedinAttribution: {
          totalFromLinkedIn: linkedinSources.reduce((sum, s) => sum + s.count, 0),
          percentFromLinkedIn: Math.round((linkedinSources.reduce((sum, s) => sum + s.count, 0) / downloads.length) * 100),
          topLinkedInSource: linkedinSources[0],
          darkSocialROI: linkedinSources.length > 0 ? 'POSITIVE' : 'NEEDS_TRACKING'
        },
        insights: {
          bestPerformingSource: topSources[0]?.source || 'N/A',
          bestROISource: topSources.sort((a, b) => b.roi - a.roi)[0]?.source || 'N/A',
          recommendation: topSources[0] 
            ? `Double down on ${topSources[0].source} - generating ${topSources[0].highQualityRate}% high-quality leads.`
            : 'Need more data to identify best source.'
        },
        funnelReport: {
          awareness: processedDownloads.filter(r => r.payload.conversionStage === 'AWARENESS').length,
          interest: processedDownloads.filter(r => r.payload.conversionStage === 'INTEREST').length,
          consideration: processedDownloads.filter(r => r.payload.conversionStage === 'CONSIDERATION').length,
          intent: intentLeads.length
        }
      },
      requiresL5Approval: false,
      confidence: 0.88
    };
  }

  /**
   * Real-time ROI tracking for dark social campaign.
   * Answers: "Is LinkedIn dark social actually working?"
   */
  async generateDarkSocialROI(downloads: Omit<LeadMagnetDownload, 'downloadId'>[], campaignCost: number = 0): Promise<L6AdvisoryOutput> {
    const processedDownloads = await Promise.all(
      downloads.map(d => this.trackDownload(d))
    );

    // Calculate dark social (LinkedIn) specific metrics
    const darkSocialDownloads = processedDownloads.filter(r => 
      r.payload.sourceCategory === 'LINKEDIN_POST' || 
      r.payload.sourceCategory === 'LINKEDIN_GROUP'
    );

    const intentFromDarkSocial = darkSocialDownloads.filter(r => r.payload.conversionStage === 'INTENT');
    const avgQuality = darkSocialDownloads.reduce((sum, r) => sum + r.payload.qualityScore, 0) / darkSocialDownloads.length || 0;

    // Estimate pipeline value (conservative: $5K per intent lead)
    const estimatedPipelineValue = intentFromDarkSocial.length * 5000;
    const roi = campaignCost > 0 ? Math.round(((estimatedPipelineValue - campaignCost) / campaignCost) * 100) : 0;

    // Group by LinkedIn group
    const groupBreakdown = new Map<string, number>();
    for (const result of darkSocialDownloads) {
      if (result.payload.linkedinGroupName) {
        const current = groupBreakdown.get(result.payload.linkedinGroupName) || 0;
        groupBreakdown.set(result.payload.linkedinGroupName, current + 1);
      }
    }

    const topGroups = Array.from(groupBreakdown.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([group, count]) => ({ group, downloads: count }));

    return {
      type: 'REPORT',
      module: this.MODULE_NAME,
      timestamp: new Date().toISOString(),
      payload: {
        reportType: 'DARK_SOCIAL_ROI',
        period: 'CAMPAIGN_TO_DATE',
        metrics: {
          totalDownloads: downloads.length,
          darkSocialDownloads: darkSocialDownloads.length,
          darkSocialPercentage: Math.round((darkSocialDownloads.length / downloads.length) * 100),
          intentLeadsFromDarkSocial: intentFromDarkSocial.length,
          avgQualityScore: Math.round(avgQuality),
          estimatedPipelineValue: `$${estimatedPipelineValue.toLocaleString()}`,
          campaignCost: `$${campaignCost.toLocaleString()}`,
          roi: campaignCost > 0 ? `${roi}%` : 'N/A (no cost data)'
        },
        topPerformingGroups: topGroups,
        verdict: darkSocialDownloads.length > downloads.length * 0.3 
          ? 'DARK_SOCIAL_WORKING' 
          : darkSocialDownloads.length > 0 
            ? 'DARK_SOCIAL_EMERGING' 
            : 'NEEDS_DARK_SOCIAL_ACTIVATION',
        recommendation: intentFromDarkSocial.length > 0
          ? `Dark social is generating ${intentFromDarkSocial.length} high-intent leads. Continue current strategy and scale top-performing groups.`
          : 'Dark social signals detected but no intent leads yet. Increase post frequency and engagement in top groups.'
      },
      requiresL5Approval: false,
      confidence: 0.82
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
  
  // Phase 1 Capabilities (Architect-Approved for Monday)
  private leadQualifier = new LeadQualificationAI();
  private timingEngine = new OptimalTimingEngine();
  private objectionPredictor = new ObjectionPredictor();
  private responseRouter = new InboundResponseRouter();
  
  // Phase 1.5 Capabilities (Dark Social Force Multipliers)
  private darkSocialMiner = new DarkSocialIntentMiner();
  private leadMagnetTracker = new LeadMagnetActivationTracker();

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
  
  // Phase 1 Capabilities (Architect-Approved)
  get leadQualificationAI() { return this.leadQualifier; }
  get optimalTiming() { return this.timingEngine; }
  get objections() { return this.objectionPredictor; }
  get inboundRouter() { return this.responseRouter; }
  
  // Phase 1.5 Capabilities (Dark Social Force Multipliers)
  get darkSocial() { return this.darkSocialMiner; }
  get leadMagnet() { return this.leadMagnetTracker; }
}

// Export singleton instance
export const l6ShadowMode = new L6ShadowModeOrchestrator();
