/**
 * L6 STRATEGIST BRAIN - Performance-Driven Hypothesis Selection
 * 
 * Uses performance_ledger data to bias future content generation.
 * Implements epsilon-greedy algorithm for exploration vs exploitation.
 * Enforces VQS governance constraints on all outputs.
 */

import { db } from "../../db";
import { performanceLedger } from "@shared/schema";
import { eq, sql, desc, and, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";

// VQS Governance Constraints (Read-Only)
const VQS_CONSTRAINTS = {
  conversionRateBand: { min: 0.14, max: 0.28 },  // 14-28%
  aovBand: { min: 18000, max: 72000 },           // $18k-$72k
  marginBand: { min: 0.15, max: 0.35 },          // 15-35%
  doctrine: "Compliance is no longer overhead. Compliance is a measurable business asset.",
  forbiddenTerms: ["cheap", "discount", "guarantee", "promise", "free"],
} as const;

// Approved content dimensions
const APPROVED_PROBLEM_ANGLES = [
  "audit_readiness_gap",
  "validation_burden",
  "regulatory_uncertainty",
  "compliance_visibility",
  "career_equity_erosion",
  "roi_invisibility",
  "process_fragmentation",
  "risk_blind_spots",
] as const;

const APPROVED_METRIC_FOCUSES = [
  "time_savings",
  "cost_reduction",
  "risk_mitigation",
  "revenue_protection",
  "career_advancement",
  "stakeholder_confidence",
  "audit_success_rate",
  "compliance_velocity",
] as const;

const APPROVED_TONE_STYLES = [
  "authoritative_expert",
  "collaborative_advisor",
  "urgent_catalyst",
  "empathetic_guide",
  "data_driven_analyst",
] as const;

const APPROVED_CTA_TYPES = [
  "schedule_consultation",
  "download_assessment",
  "calculate_roi",
  "join_webinar",
  "request_demo",
  "start_trial",
] as const;

export interface ContentHypothesis {
  id: string;
  persona: string;
  problemAngle: string;
  metricFocus: string;
  toneStyle: string;
  ctaType: string;
  score: number;
  confidence: number;
  explorationMode: "exploit" | "explore";
  vqsCompliant: boolean;
  doctrine: string;
  rationale: string;
}

interface PerformanceScore {
  problemAngle: string;
  metricFocus: string;
  toneStyle: string | null;
  ctaType: string | null;
  score: number;
  sampleSize: number;
  opens: number;
  clicks: number;
  replies: number;
  positiveReplies: number;
  bookedCalls: number;
}

// Epsilon value for exploration (20% explore, 80% exploit)
const EPSILON = 0.20;

export class StrategistBrain {
  private explorationLog: Array<{ timestamp: string; mode: string; hypothesis: string }> = [];

  async getNextHypothesis(persona: string): Promise<ContentHypothesis> {
    console.log(`🧠 STRATEGIST BRAIN: Generating hypothesis for persona "${persona}"`);

    // Query the ledger for this persona's performance data
    const performanceData = await this.queryLedgerPerformance(persona);

    // Calculate scores for each combination
    const scoredCombinations = this.calculateScores(performanceData);

    // Apply epsilon-greedy selection
    const selectedHypothesis = this.epsilonGreedySelect(persona, scoredCombinations);

    // Validate VQS compliance
    const validatedHypothesis = this.enforceVQSConstraints(selectedHypothesis);

    // Log the selection
    this.logSelection(validatedHypothesis);

    return validatedHypothesis;
  }

  private async queryLedgerPerformance(persona: string): Promise<PerformanceScore[]> {
    try {
      const results = await db
        .select({
          problemAngle: performanceLedger.problemAngle,
          metricFocus: performanceLedger.metricFocus,
          toneStyle: performanceLedger.toneStyle,
          ctaType: performanceLedger.ctaType,
          totalOpens: sql<number>`COALESCE(SUM(${performanceLedger.opens}), 0)`,
          totalClicks: sql<number>`COALESCE(SUM(${performanceLedger.clicks}), 0)`,
          totalReplies: sql<number>`COALESCE(SUM(${performanceLedger.replies}), 0)`,
          totalPositiveReplies: sql<number>`COALESCE(SUM(${performanceLedger.positiveReplies}), 0)`,
          totalBookedCalls: sql<number>`COALESCE(SUM(${performanceLedger.bookedCalls}), 0)`,
          sampleSize: sql<number>`COUNT(*)`,
        })
        .from(performanceLedger)
        .where(
          and(
            eq(performanceLedger.persona, persona),
            isNotNull(performanceLedger.problemAngle),
            isNotNull(performanceLedger.metricFocus)
          )
        )
        .groupBy(
          performanceLedger.problemAngle,
          performanceLedger.metricFocus,
          performanceLedger.toneStyle,
          performanceLedger.ctaType
        )
        .orderBy(desc(sql`COUNT(*)`));

      return results.map(r => ({
        problemAngle: r.problemAngle || "unknown",
        metricFocus: r.metricFocus || "unknown",
        toneStyle: r.toneStyle,
        ctaType: r.ctaType,
        score: this.computeScore(
          Number(r.totalOpens),
          Number(r.totalClicks),
          Number(r.totalReplies),
          Number(r.totalPositiveReplies),
          Number(r.totalBookedCalls)
        ),
        sampleSize: Number(r.sampleSize),
        opens: Number(r.totalOpens),
        clicks: Number(r.totalClicks),
        replies: Number(r.totalReplies),
        positiveReplies: Number(r.totalPositiveReplies),
        bookedCalls: Number(r.totalBookedCalls),
      }));
    } catch (error) {
      console.error("🧠 STRATEGIST BRAIN: Error querying ledger:", error);
      return [];
    }
  }

  private computeScore(
    opens: number,
    clicks: number,
    replies: number,
    positiveReplies: number,
    bookedCalls: number
  ): number {
    // Score formula: weighted by business impact
    return (
      (bookedCalls * 10) +
      (positiveReplies * 5) +
      (clicks * 1) +
      (opens * 0.1)
    );
  }

  private calculateScores(performanceData: PerformanceScore[]): PerformanceScore[] {
    // If we have performance data, return it sorted by score
    if (performanceData.length > 0) {
      return performanceData.sort((a, b) => b.score - a.score);
    }

    // No historical data - return empty (will trigger pure exploration)
    return [];
  }

  private epsilonGreedySelect(
    persona: string,
    scoredCombinations: PerformanceScore[]
  ): ContentHypothesis {
    const random = Math.random();
    const shouldExplore = random < EPSILON || scoredCombinations.length === 0;

    if (shouldExplore) {
      // EXPLORE: Random selection from approved dimensions
      console.log(`   🔬 Mode: EXPLORE (random=${random.toFixed(3)} < ε=${EPSILON})`);
      return this.generateExplorationHypothesis(persona);
    } else {
      // EXPLOIT: Use best-performing combination
      console.log(`   📈 Mode: EXPLOIT (random=${random.toFixed(3)} >= ε=${EPSILON})`);
      return this.generateExploitationHypothesis(persona, scoredCombinations[0]);
    }
  }

  private generateExplorationHypothesis(persona: string): ContentHypothesis {
    const problemAngle = this.randomChoice(APPROVED_PROBLEM_ANGLES);
    const metricFocus = this.randomChoice(APPROVED_METRIC_FOCUSES);
    const toneStyle = this.randomChoice(APPROVED_TONE_STYLES);
    const ctaType = this.randomChoice(APPROVED_CTA_TYPES);

    return {
      id: `hyp_${nanoid(8)}`,
      persona,
      problemAngle,
      metricFocus,
      toneStyle,
      ctaType,
      score: 0,
      confidence: 0.5, // Lower confidence for exploration
      explorationMode: "explore",
      vqsCompliant: true,
      doctrine: VQS_CONSTRAINTS.doctrine,
      rationale: `EXPLORATION: Testing new combination [${problemAngle} + ${metricFocus}] to discover potential winning patterns.`,
    };
  }

  private generateExploitationHypothesis(
    persona: string,
    bestPerformer: PerformanceScore
  ): ContentHypothesis {
    // Use the best-performing combination, fill in missing values with approved defaults
    const toneStyle = bestPerformer.toneStyle || this.randomChoice(APPROVED_TONE_STYLES);
    const ctaType = bestPerformer.ctaType || this.randomChoice(APPROVED_CTA_TYPES);

    // Calculate confidence based on sample size
    const confidence = Math.min(0.95, 0.6 + (bestPerformer.sampleSize * 0.05));

    return {
      id: `hyp_${nanoid(8)}`,
      persona,
      problemAngle: bestPerformer.problemAngle,
      metricFocus: bestPerformer.metricFocus,
      toneStyle,
      ctaType,
      score: bestPerformer.score,
      confidence,
      explorationMode: "exploit",
      vqsCompliant: true,
      doctrine: VQS_CONSTRAINTS.doctrine,
      rationale: `EXPLOITATION: Using proven winner [${bestPerformer.problemAngle} + ${bestPerformer.metricFocus}] with score ${bestPerformer.score.toFixed(1)} from ${bestPerformer.sampleSize} samples. Opens: ${bestPerformer.opens}, Clicks: ${bestPerformer.clicks}, Booked: ${bestPerformer.bookedCalls}.`,
    };
  }

  private enforceVQSConstraints(hypothesis: ContentHypothesis): ContentHypothesis {
    // Validate problem angle is approved
    if (!APPROVED_PROBLEM_ANGLES.includes(hypothesis.problemAngle as any)) {
      console.warn(`   ⚠️ VQS: Replacing unapproved problem angle "${hypothesis.problemAngle}"`);
      hypothesis.problemAngle = APPROVED_PROBLEM_ANGLES[0];
    }

    // Validate metric focus is approved
    if (!APPROVED_METRIC_FOCUSES.includes(hypothesis.metricFocus as any)) {
      console.warn(`   ⚠️ VQS: Replacing unapproved metric focus "${hypothesis.metricFocus}"`);
      hypothesis.metricFocus = APPROVED_METRIC_FOCUSES[0];
    }

    // Validate tone style is approved
    if (!APPROVED_TONE_STYLES.includes(hypothesis.toneStyle as any)) {
      console.warn(`   ⚠️ VQS: Replacing unapproved tone style "${hypothesis.toneStyle}"`);
      hypothesis.toneStyle = APPROVED_TONE_STYLES[0];
    }

    // Validate CTA type is approved
    if (!APPROVED_CTA_TYPES.includes(hypothesis.ctaType as any)) {
      console.warn(`   ⚠️ VQS: Replacing unapproved CTA type "${hypothesis.ctaType}"`);
      hypothesis.ctaType = APPROVED_CTA_TYPES[0];
    }

    // Always inject doctrine
    hypothesis.doctrine = VQS_CONSTRAINTS.doctrine;
    hypothesis.vqsCompliant = true;

    return hypothesis;
  }

  private randomChoice<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private logSelection(hypothesis: ContentHypothesis): void {
    this.explorationLog.push({
      timestamp: new Date().toISOString(),
      mode: hypothesis.explorationMode,
      hypothesis: hypothesis.id,
    });

    console.log(`🧠 STRATEGIST BRAIN: Selected hypothesis ${hypothesis.id}`);
    console.log(`   📋 Problem Angle: ${hypothesis.problemAngle}`);
    console.log(`   📊 Metric Focus: ${hypothesis.metricFocus}`);
    console.log(`   🎭 Tone Style: ${hypothesis.toneStyle}`);
    console.log(`   🎯 CTA Type: ${hypothesis.ctaType}`);
    console.log(`   📈 Score: ${hypothesis.score.toFixed(1)} | Confidence: ${(hypothesis.confidence * 100).toFixed(0)}%`);
    console.log(`   🔄 Mode: ${hypothesis.explorationMode.toUpperCase()}`);
  }

  async getPerformanceInsights(persona: string): Promise<{
    topPerformers: PerformanceScore[];
    underperformers: PerformanceScore[];
    explorationOpportunities: string[];
    totalSamples: number;
  }> {
    const performanceData = await this.queryLedgerPerformance(persona);
    const sorted = performanceData.sort((a, b) => b.score - a.score);

    const totalSamples = sorted.reduce((sum, p) => sum + p.sampleSize, 0);

    // Find combinations we haven't tested much
    const testedAngles = new Set(sorted.map(p => p.problemAngle));
    const explorationOpportunities = APPROVED_PROBLEM_ANGLES.filter(
      angle => !testedAngles.has(angle)
    );

    return {
      topPerformers: sorted.slice(0, 3),
      underperformers: sorted.slice(-3).filter(p => p.score < 1),
      explorationOpportunities,
      totalSamples,
    };
  }

  getVQSConstraints() {
    return VQS_CONSTRAINTS;
  }

  getExplorationLog(): Array<{ timestamp: string; mode: string; hypothesis: string }> {
    return this.explorationLog.slice(-50); // Last 50 selections
  }

  getApprovedDimensions() {
    return {
      problemAngles: [...APPROVED_PROBLEM_ANGLES],
      metricFocuses: [...APPROVED_METRIC_FOCUSES],
      toneStyles: [...APPROVED_TONE_STYLES],
      ctaTypes: [...APPROVED_CTA_TYPES],
    };
  }
}

export const strategistBrain = new StrategistBrain();
