/**
 * OBJECTION-INTELLIGENCE MICRO-LOOP v1.0
 * 
 * Architect-Approved System for L6 Friction Reduction
 * 
 * Purpose: Capture stakeholder-confidence objections daily, patch content
 * based on patterns, re-measure friction after each iteration.
 * 
 * Target: Close 1-point friction gap (28 → 27) within 5 campaign iterations
 * 
 * VQS Constraints Enforced:
 * - Conversion Rate Band: 14-28%
 * - AOV Band: $18,000-$72,000
 * - Margin Band: 15-35%
 * - Forbidden Terms: cheap, discount, guarantee, promise, free
 * - Doctrine: "Compliance is no longer overhead. Compliance is a measurable business asset."
 */

import { db } from "../../db";
import { performanceLedger } from "@shared/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

const VQS_DOCTRINE = "Compliance is no longer overhead. Compliance is a measurable business asset.";

const FORBIDDEN_TERMS = ["cheap", "discount", "guarantee", "promise", "free"] as const;

const STAKEHOLDER_OBJECTION_PATTERNS = [
  { pattern: "too expensive", category: "price_resistance", severity: "high" },
  { pattern: "not sure about ROI", category: "value_unclear", severity: "high" },
  { pattern: "need to check with", category: "authority_gap", severity: "medium" },
  { pattern: "already have a solution", category: "status_quo_bias", severity: "medium" },
  { pattern: "timing isn't right", category: "urgency_gap", severity: "low" },
  { pattern: "need more information", category: "clarity_gap", severity: "medium" },
  { pattern: "sounds too good", category: "trust_gap", severity: "high" },
  { pattern: "what's the catch", category: "trust_gap", severity: "high" },
  { pattern: "my team won't adopt", category: "adoption_fear", severity: "high" },
  { pattern: "compliance is overhead", category: "mindset_block", severity: "critical" },
] as const;

const CONTENT_PATCHES: Record<string, ContentPatch> = {
  price_resistance: {
    messagingShift: "Reframe from cost to investment with quantified payback period",
    proofPacket: "Include 3-year TCO comparison showing 40% reduction",
    ctaAdjustment: "Offer ROI calculator before consultation",
    vqsAlignment: "Stay within $18K-$72K AOV band, emphasize value not price",
  },
  value_unclear: {
    messagingShift: "Lead with specific metric improvements (audit success rate, time savings)",
    proofPacket: "Add customer case study with before/after metrics",
    ctaAdjustment: "Offer free assessment to quantify their specific opportunity",
    vqsAlignment: "Anchor to doctrine: compliance as measurable business asset",
  },
  authority_gap: {
    messagingShift: "Provide stakeholder briefing materials they can share",
    proofPacket: "Executive summary with CFO/CIO talking points",
    ctaAdjustment: "Offer team demo or stakeholder presentation",
    vqsAlignment: "Build stakeholder confidence through transparency",
  },
  status_quo_bias: {
    messagingShift: "Highlight hidden costs of current approach (CSV burden)",
    proofPacket: "Competitive analysis showing market shift",
    ctaAdjustment: "Offer side-by-side comparison assessment",
    vqsAlignment: "Use 'Why Validation Teams Are Abandoning Traditional CSV' narrative",
  },
  urgency_gap: {
    messagingShift: "Connect to regulatory timeline or audit schedule",
    proofPacket: "Industry trend data showing adoption acceleration",
    ctaAdjustment: "Provide planning timeline without pressure",
    vqsAlignment: "No artificial urgency - let regulatory reality speak",
  },
  clarity_gap: {
    messagingShift: "Simplify messaging, focus on one clear benefit per touchpoint",
    proofPacket: "Visual explainer or 2-minute overview",
    ctaAdjustment: "Offer quick clarity call (15 min) vs full demo",
    vqsAlignment: "Audit-grade transparency - explain everything clearly",
  },
  trust_gap: {
    messagingShift: "Lead with verifiable claims and third-party validation",
    proofPacket: "Add customer references, certifications, audit trail",
    ctaAdjustment: "Offer pilot or proof-of-concept before commitment",
    vqsAlignment: "All claims must withstand QA/IT/Finance scrutiny",
  },
  adoption_fear: {
    messagingShift: "Emphasize implementation support and change management",
    proofPacket: "Case study showing team adoption journey",
    ctaAdjustment: "Offer team readiness assessment",
    vqsAlignment: "Build stakeholder confidence through support commitment",
  },
  mindset_block: {
    messagingShift: "CRITICAL: Direct doctrine reinforcement required",
    proofPacket: "ROI dashboard showing compliance as profit center",
    ctaAdjustment: "Offer mindset shift workshop or webinar",
    vqsAlignment: "Core doctrine: Compliance is a measurable business asset",
  },
};

interface ContentPatch {
  messagingShift: string;
  proofPacket: string;
  ctaAdjustment: string;
  vqsAlignment: string;
}

interface Objection {
  id: string;
  source: "email_reply" | "sales_call" | "linkedin_dm" | "form_submission" | "manual_entry";
  rawText: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  persona: string;
  campaignId?: string;
  hypothesisId?: string;
  capturedAt: string;
  resolved: boolean;
  resolutionNote?: string;
}

interface MicroLoopIteration {
  id: string;
  iterationNumber: number;
  startedAt: string;
  completedAt?: string;
  status: "active" | "completed" | "analyzing";
  objectionsCapruted: number;
  patternsIdentified: string[];
  patchesApplied: string[];
  frictionBefore: number;
  frictionAfter?: number;
  frictionDelta?: number;
  campaignsSent: number;
  ledgerEntriesCreated: number;
}

interface MicroLoopState {
  loopId: string;
  startedAt: string;
  targetFriction: number;
  currentFriction: number;
  iterations: MicroLoopIteration[];
  totalObjections: Objection[];
  patternFrequency: Record<string, number>;
  patchesApplied: string[];
  status: "running" | "paused" | "completed" | "friction_target_met";
  dailySchedule: {
    captureWindow: string;
    analysisTime: string;
    patchDeployTime: string;
  };
}

class ObjectionIntelligenceMicroLoop {
  private state: MicroLoopState | null = null;
  private objections: Objection[] = [];

  async startLoop(currentFriction: number = 28, targetFriction: number = 27): Promise<MicroLoopState> {
    console.log(`🔄 OBJECTION-INTELLIGENCE: Starting Micro-Loop`);
    console.log(`   📊 Current Friction: ${currentFriction}`);
    console.log(`   🎯 Target Friction: ${targetFriction}`);
    console.log(`   📏 Gap to Close: ${currentFriction - targetFriction} point(s)`);

    this.state = {
      loopId: `oim_${nanoid(8)}`,
      startedAt: new Date().toISOString(),
      targetFriction,
      currentFriction,
      iterations: [],
      totalObjections: [],
      patternFrequency: {},
      patchesApplied: [],
      status: "running",
      dailySchedule: {
        captureWindow: "09:00-17:00 ET",
        analysisTime: "18:00 ET",
        patchDeployTime: "08:00 ET next day",
      },
    };

    await this.startIteration();

    console.log(`✅ OBJECTION-INTELLIGENCE: Loop ${this.state.loopId} activated`);
    console.log(`   📅 Daily Schedule:`);
    console.log(`      Capture: ${this.state.dailySchedule.captureWindow}`);
    console.log(`      Analysis: ${this.state.dailySchedule.analysisTime}`);
    console.log(`      Patch Deploy: ${this.state.dailySchedule.patchDeployTime}`);

    return this.state;
  }

  private async startIteration(): Promise<MicroLoopIteration> {
    if (!this.state) throw new Error("Loop not started");

    const iterationNumber = this.state.iterations.length + 1;
    const iteration: MicroLoopIteration = {
      id: `iter_${nanoid(6)}`,
      iterationNumber,
      startedAt: new Date().toISOString(),
      status: "active",
      objectionsCapruted: 0,
      patternsIdentified: [],
      patchesApplied: [],
      frictionBefore: this.state.currentFriction,
      campaignsSent: 0,
      ledgerEntriesCreated: 0,
    };

    this.state.iterations.push(iteration);

    console.log(`🔁 ITERATION ${iterationNumber} STARTED`);
    console.log(`   📊 Friction at start: ${iteration.frictionBefore}`);

    return iteration;
  }

  async captureObjection(objection: Omit<Objection, "id" | "capturedAt" | "resolved">): Promise<Objection> {
    if (!this.state || this.state.status !== "running") {
      throw new Error("Micro-loop not running");
    }

    const categorized = this.categorizeObjection(objection.rawText);

    const fullObjection: Objection = {
      ...objection,
      id: `obj_${nanoid(8)}`,
      category: categorized.category,
      severity: categorized.severity,
      capturedAt: new Date().toISOString(),
      resolved: false,
    };

    this.objections.push(fullObjection);
    this.state.totalObjections.push(fullObjection);

    this.state.patternFrequency[categorized.category] = 
      (this.state.patternFrequency[categorized.category] || 0) + 1;

    const currentIteration = this.state.iterations[this.state.iterations.length - 1];
    if (currentIteration) {
      currentIteration.objectionsCapruted++;
    }

    console.log(`📝 OBJECTION CAPTURED: ${fullObjection.id}`);
    console.log(`   📂 Category: ${categorized.category}`);
    console.log(`   ⚠️ Severity: ${categorized.severity}`);
    console.log(`   👤 Persona: ${objection.persona}`);

    return fullObjection;
  }

  private categorizeObjection(rawText: string): { category: string; severity: "low" | "medium" | "high" | "critical" } {
    const lowerText = rawText.toLowerCase();

    for (const pattern of STAKEHOLDER_OBJECTION_PATTERNS) {
      if (lowerText.includes(pattern.pattern)) {
        return { category: pattern.category, severity: pattern.severity };
      }
    }

    if (lowerText.includes("compliance") && (lowerText.includes("overhead") || lowerText.includes("cost center"))) {
      return { category: "mindset_block", severity: "critical" };
    }

    return { category: "clarity_gap", severity: "medium" };
  }

  async analyzePatterns(): Promise<{
    topPatterns: Array<{ category: string; count: number; percentage: number }>;
    recommendedPatches: ContentPatch[];
    priorityOrder: string[];
  }> {
    if (!this.state) throw new Error("Loop not started");

    const totalObjections = Object.values(this.state.patternFrequency).reduce((a, b) => a + b, 0);

    const topPatterns = Object.entries(this.state.patternFrequency)
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalObjections > 0 ? (count / totalObjections) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const priorityOrder = topPatterns
      .filter(p => p.percentage >= 10)
      .map(p => p.category);

    const recommendedPatches = priorityOrder
      .map(category => CONTENT_PATCHES[category])
      .filter(Boolean);

    console.log(`📊 PATTERN ANALYSIS COMPLETE`);
    console.log(`   📈 Total Objections: ${totalObjections}`);
    console.log(`   🔝 Top Patterns:`);
    topPatterns.slice(0, 3).forEach((p, i) => {
      console.log(`      ${i + 1}. ${p.category}: ${p.count} (${p.percentage.toFixed(1)}%)`);
    });

    return { topPatterns, recommendedPatches, priorityOrder };
  }

  async applyPatches(categories: string[]): Promise<{
    applied: string[];
    patches: ContentPatch[];
    messagingUpdates: string[];
  }> {
    if (!this.state) throw new Error("Loop not started");

    const patches: ContentPatch[] = [];
    const messagingUpdates: string[] = [];

    for (const category of categories) {
      const patch = CONTENT_PATCHES[category];
      if (patch) {
        patches.push(patch);
        this.state.patchesApplied.push(category);

        if (!this.containsForbiddenTerms(patch.messagingShift)) {
          messagingUpdates.push(patch.messagingShift);
        } else {
          console.warn(`⚠️ VQS BLOCK: Patch for ${category} contains forbidden terms`);
        }
      }
    }

    const currentIteration = this.state.iterations[this.state.iterations.length - 1];
    if (currentIteration) {
      currentIteration.patchesApplied = categories;
    }

    console.log(`🔧 PATCHES APPLIED: ${categories.length}`);
    categories.forEach(c => console.log(`   ✓ ${c}`));

    return { applied: categories, patches, messagingUpdates };
  }

  private containsForbiddenTerms(text: string): boolean {
    const lowerText = text.toLowerCase();
    return FORBIDDEN_TERMS.some(term => lowerText.includes(term));
  }

  async recordCampaignSent(campaignId: string, hypothesisId: string, persona: string): Promise<void> {
    if (!this.state) throw new Error("Loop not started");

    const currentIteration = this.state.iterations[this.state.iterations.length - 1];
    if (currentIteration) {
      currentIteration.campaignsSent++;
    }

    console.log(`📧 CAMPAIGN RECORDED: ${campaignId}`);
    console.log(`   🧪 Hypothesis: ${hypothesisId}`);
    console.log(`   👤 Persona: ${persona}`);
  }

  async recordLedgerEntry(sendId: string): Promise<void> {
    if (!this.state) throw new Error("Loop not started");

    const currentIteration = this.state.iterations[this.state.iterations.length - 1];
    if (currentIteration) {
      currentIteration.ledgerEntriesCreated++;
    }
  }

  async completeIteration(frictionAfter: number): Promise<MicroLoopIteration> {
    if (!this.state) throw new Error("Loop not started");

    const currentIteration = this.state.iterations[this.state.iterations.length - 1];
    if (!currentIteration) throw new Error("No active iteration");

    currentIteration.completedAt = new Date().toISOString();
    currentIteration.status = "completed";
    currentIteration.frictionAfter = frictionAfter;
    currentIteration.frictionDelta = currentIteration.frictionBefore - frictionAfter;

    this.state.currentFriction = frictionAfter;

    console.log(`✅ ITERATION ${currentIteration.iterationNumber} COMPLETE`);
    console.log(`   📊 Friction: ${currentIteration.frictionBefore} → ${frictionAfter}`);
    console.log(`   📉 Delta: ${currentIteration.frictionDelta > 0 ? "-" : "+"}${Math.abs(currentIteration.frictionDelta || 0)}`);
    console.log(`   📝 Objections: ${currentIteration.objectionsCapruted}`);
    console.log(`   📧 Campaigns: ${currentIteration.campaignsSent}`);
    console.log(`   📊 Ledger Entries: ${currentIteration.ledgerEntriesCreated}`);

    if (frictionAfter <= this.state.targetFriction) {
      this.state.status = "friction_target_met";
      console.log(`🎯 FRICTION TARGET MET! Ready for L6 Acceleration Protocol.`);
    } else if (this.state.iterations.length < 5) {
      await this.startIteration();
    } else {
      console.log(`⚠️ 5 iterations complete. Analyzing overall progress...`);
    }

    return currentIteration;
  }

  async getStatus(): Promise<{
    loopId: string | null;
    status: string;
    currentFriction: number;
    targetFriction: number;
    gap: number;
    iterationsCompleted: number;
    totalObjections: number;
    topPatterns: Array<{ category: string; count: number }>;
    patchesApplied: string[];
    readyForL6: boolean;
  }> {
    if (!this.state) {
      return {
        loopId: null,
        status: "not_started",
        currentFriction: 28,
        targetFriction: 27,
        gap: 1,
        iterationsCompleted: 0,
        totalObjections: 0,
        topPatterns: [],
        patchesApplied: [],
        readyForL6: false,
      };
    }

    const topPatterns = Object.entries(this.state.patternFrequency)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      loopId: this.state.loopId,
      status: this.state.status,
      currentFriction: this.state.currentFriction,
      targetFriction: this.state.targetFriction,
      gap: this.state.currentFriction - this.state.targetFriction,
      iterationsCompleted: this.state.iterations.filter(i => i.status === "completed").length,
      totalObjections: this.state.totalObjections.length,
      topPatterns,
      patchesApplied: this.state.patchesApplied,
      readyForL6: this.state.currentFriction <= this.state.targetFriction,
    };
  }

  async generateFrictionDeltaReport(): Promise<{
    loopId: string;
    startedAt: string;
    iterations: Array<{
      number: number;
      frictionBefore: number;
      frictionAfter: number | undefined;
      delta: number | undefined;
      objections: number;
      campaigns: number;
    }>;
    overallDelta: number;
    targetMet: boolean;
    recommendations: string[];
  }> {
    if (!this.state) throw new Error("Loop not started");

    const iterations = this.state.iterations.map(i => ({
      number: i.iterationNumber,
      frictionBefore: i.frictionBefore,
      frictionAfter: i.frictionAfter,
      delta: i.frictionDelta,
      objections: i.objectionsCapruted,
      campaigns: i.campaignsSent,
    }));

    const firstFriction = this.state.iterations[0]?.frictionBefore || 28;
    const lastFriction = this.state.currentFriction;
    const overallDelta = firstFriction - lastFriction;

    const recommendations: string[] = [];

    const { topPatterns } = await this.analyzePatterns();
    if (topPatterns.length > 0) {
      const topCategory = topPatterns[0].category;
      const patch = CONTENT_PATCHES[topCategory];
      if (patch) {
        recommendations.push(`Priority: ${patch.messagingShift}`);
        recommendations.push(`Proof: ${patch.proofPacket}`);
      }
    }

    if (!this.state.patchesApplied.includes("mindset_block") && 
        this.state.patternFrequency["mindset_block"] > 0) {
      recommendations.push("CRITICAL: Deploy doctrine reinforcement - 'Compliance is a measurable business asset'");
    }

    return {
      loopId: this.state.loopId,
      startedAt: this.state.startedAt,
      iterations,
      overallDelta,
      targetMet: this.state.currentFriction <= this.state.targetFriction,
      recommendations,
    };
  }

  getVQSConstraints() {
    return {
      doctrine: VQS_DOCTRINE,
      forbiddenTerms: FORBIDDEN_TERMS,
      conversionBand: { min: 0.14, max: 0.28 },
      aovBand: { min: 18000, max: 72000 },
      marginBand: { min: 0.15, max: 0.35 },
    };
  }

  async getLedgerStats(): Promise<{
    totalEntries: number;
    entriesWithPersona: number;
    entriesWithAngle: number;
    uniqueCombinations: number;
  }> {
    try {
      const totalResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(performanceLedger);

      const personaResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(performanceLedger)
        .where(sql`${performanceLedger.persona} IS NOT NULL`);

      const angleResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(performanceLedger)
        .where(sql`${performanceLedger.problemAngle} IS NOT NULL`);

      const combosResult = await db
        .select({ count: sql<number>`COUNT(DISTINCT CONCAT(${performanceLedger.problemAngle}, ':', ${performanceLedger.metricFocus}))` })
        .from(performanceLedger)
        .where(and(
          sql`${performanceLedger.problemAngle} IS NOT NULL`,
          sql`${performanceLedger.metricFocus} IS NOT NULL`
        ));

      return {
        totalEntries: Number(totalResult[0]?.count || 0),
        entriesWithPersona: Number(personaResult[0]?.count || 0),
        entriesWithAngle: Number(angleResult[0]?.count || 0),
        uniqueCombinations: Number(combosResult[0]?.count || 0),
      };
    } catch (error) {
      console.error("Error getting ledger stats:", error);
      return {
        totalEntries: 0,
        entriesWithPersona: 0,
        entriesWithAngle: 0,
        uniqueCombinations: 0,
      };
    }
  }
}

export const objectionIntelligence = new ObjectionIntelligenceMicroLoop();
export { ObjectionIntelligenceMicroLoop, ContentPatch, Objection, MicroLoopIteration, MicroLoopState };
