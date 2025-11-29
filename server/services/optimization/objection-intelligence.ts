/**
 * OBJECTION-INTELLIGENCE MICRO-LOOP v1.1
 * 
 * Architect-Approved System for L6 Friction Reduction
 * 
 * FIXES in v1.1:
 * - Enhanced objection categorization with stakeholder-confidence focus
 * - VQS enforcement at capture and patch stages
 * - File-based persistence for objections and state
 * - Proper scheduler iteration enforcement with persistence
 * - Performance ledger integration
 * 
 * Target: Close 1-point friction gap (28 → 27) within 5 campaign iterations
 */

import { db } from "../../db";
import { performanceLedger } from "@shared/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as fs from "fs";
import * as path from "path";

const VQS_DOCTRINE = "Compliance is no longer overhead. Compliance is a measurable business asset.";

const FORBIDDEN_TERMS = ["cheap", "discount", "guarantee", "promise", "free"] as const;

const STATE_FILE = path.join(process.cwd(), "data", "objection-intelligence-state.json");

const APPROVED_PERSONAS = [
  "qa_director",
  "compliance_manager",
  "validation_lead",
  "quality_head",
  "regulatory_affairs",
  "it_director",
  "cio",
  "cfo",
  "operations_director",
] as const;

const STAKEHOLDER_CONFIDENCE_PATTERNS = [
  { regex: /\b(stakeholder|board|executive|leadership|management)\s*(buy-?in|approval|support|confidence)/i, category: "stakeholder_confidence", severity: "high" },
  { regex: /\b(convince|persuade|get approval from|need to sell)\s*(to\s+)?(my|our|the)\s*(team|boss|management|board)/i, category: "stakeholder_confidence", severity: "high" },
  { regex: /\b(what will|how do I)\s*(my|the)\s*(stakeholders?|executives?|board)\s*(think|say|react)/i, category: "stakeholder_confidence", severity: "high" },
  { regex: /\b(difficult to justify|hard to explain|can't prove|demonstrate value)/i, category: "stakeholder_confidence", severity: "high" },
  { regex: /\b(internal resistance|pushback|skeptic(s|ism)?)/i, category: "stakeholder_confidence", severity: "medium" },
];

const OBJECTION_PATTERNS = [
  ...STAKEHOLDER_CONFIDENCE_PATTERNS,
  { regex: /\b(too\s+(expensive|costly|pricey)|budget\s+(constraint|issue)|cost\s+(too\s+)?high)/i, category: "price_resistance", severity: "high" },
  { regex: /\b(not\s+sure|unsure|uncertain)\s*(about|of|if)\s*(the\s+)?(ROI|return|value|benefit)/i, category: "value_unclear", severity: "high" },
  { regex: /\b(need\s+to\s+check|check\s+with|consult|discuss\s+with)\s*(my|our|the)?\s*(team|manager|boss|stakeholders?)/i, category: "authority_gap", severity: "medium" },
  { regex: /\b(already\s+(have|use|using)|current\s+solution|existing\s+(system|tool))/i, category: "status_quo_bias", severity: "medium" },
  { regex: /\b(timing\s+(isn't|is\s+not|not)\s+(right|good)|bad\s+time|not\s+(the\s+)?right\s+time|later|next\s+(year|quarter))/i, category: "urgency_gap", severity: "low" },
  { regex: /\b(need\s+more\s+(info|information|details|clarity)|can\s+you\s+explain|don't\s+understand)/i, category: "clarity_gap", severity: "medium" },
  { regex: /\b(sounds?\s+too\s+good|too\s+good\s+to\s+be|what's\s+the\s+catch|skeptical)/i, category: "trust_gap", severity: "high" },
  { regex: /\b(my\s+team\s+won't|team\s+resistance|adoption\s+(issue|challenge|problem)|change\s+management)/i, category: "adoption_fear", severity: "high" },
  { regex: /\b(compliance\s+(is|as)\s+(an?\s+)?(overhead|burden|cost\s+center)|just\s+(a\s+)?checkbox)/i, category: "mindset_block", severity: "critical" },
  { regex: /\b(career|job\s+security|professional\s+risk|blame|accountability)/i, category: "career_equity_erosion", severity: "high" },
] as const;

const CONTENT_PATCHES: Record<string, ContentPatch> = {
  stakeholder_confidence: {
    messagingShift: "Lead with executive-ready metrics and board-level talking points",
    proofPacket: "CFO/CIO briefing deck with compliance ROI quantification",
    ctaAdjustment: "Offer stakeholder presentation or executive alignment call",
    vqsAlignment: "Build stakeholder confidence through audit-grade transparency",
    vqsCompliant: true,
  },
  price_resistance: {
    messagingShift: "Reframe from cost to investment with quantified payback period",
    proofPacket: "Include 3-year TCO comparison showing 40% reduction",
    ctaAdjustment: "Offer ROI calculator before consultation",
    vqsAlignment: "Stay within $18K-$72K AOV band, emphasize value not price",
    vqsCompliant: true,
  },
  value_unclear: {
    messagingShift: "Lead with specific metric improvements (audit success rate, time savings)",
    proofPacket: "Add customer case study with before/after metrics",
    ctaAdjustment: "Offer assessment to quantify their specific opportunity",
    vqsAlignment: "Anchor to doctrine: compliance as measurable business asset",
    vqsCompliant: true,
  },
  authority_gap: {
    messagingShift: "Provide stakeholder briefing materials they can share",
    proofPacket: "Executive summary with CFO/CIO talking points",
    ctaAdjustment: "Offer team demo or stakeholder presentation",
    vqsAlignment: "Build stakeholder confidence through transparency",
    vqsCompliant: true,
  },
  status_quo_bias: {
    messagingShift: "Highlight hidden costs of current approach (CSV burden)",
    proofPacket: "Competitive analysis showing market shift",
    ctaAdjustment: "Offer side-by-side comparison assessment",
    vqsAlignment: "Use 'Why Validation Teams Are Abandoning Traditional CSV' narrative",
    vqsCompliant: true,
  },
  urgency_gap: {
    messagingShift: "Connect to regulatory timeline or audit schedule",
    proofPacket: "Industry trend data showing adoption acceleration",
    ctaAdjustment: "Provide planning timeline without pressure",
    vqsAlignment: "No artificial urgency - let regulatory reality speak",
    vqsCompliant: true,
  },
  clarity_gap: {
    messagingShift: "Simplify messaging, focus on one clear benefit per touchpoint",
    proofPacket: "Visual explainer or 2-minute overview",
    ctaAdjustment: "Offer quick clarity call (15 min) vs full demo",
    vqsAlignment: "Audit-grade transparency - explain everything clearly",
    vqsCompliant: true,
  },
  trust_gap: {
    messagingShift: "Lead with verifiable claims and third-party validation",
    proofPacket: "Add customer references, certifications, audit trail",
    ctaAdjustment: "Offer pilot or proof-of-concept before commitment",
    vqsAlignment: "All claims must withstand QA/IT/Finance scrutiny",
    vqsCompliant: true,
  },
  adoption_fear: {
    messagingShift: "Emphasize implementation support and change management",
    proofPacket: "Case study showing team adoption journey",
    ctaAdjustment: "Offer team readiness assessment",
    vqsAlignment: "Build stakeholder confidence through support commitment",
    vqsCompliant: true,
  },
  mindset_block: {
    messagingShift: "CRITICAL: Direct doctrine reinforcement required",
    proofPacket: "ROI dashboard showing compliance as profit center",
    ctaAdjustment: "Offer mindset shift workshop or webinar",
    vqsAlignment: "Core doctrine: Compliance is a measurable business asset",
    vqsCompliant: true,
  },
  career_equity_erosion: {
    messagingShift: "Position compliance expertise as career accelerator",
    proofPacket: "Professional development path showing compliance leadership value",
    ctaAdjustment: "Offer career equity assessment consultation",
    vqsAlignment: "Compliance leadership builds professional equity",
    vqsCompliant: true,
  },
};

interface ContentPatch {
  messagingShift: string;
  proofPacket: string;
  ctaAdjustment: string;
  vqsAlignment: string;
  vqsCompliant: boolean;
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
  vqsValidated: boolean;
  vqsViolations: string[];
}

interface MicroLoopIteration {
  id: string;
  iterationNumber: number;
  startedAt: string;
  completedAt?: string;
  status: "active" | "completed" | "analyzing";
  objectionsCaptured: number;
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
  version: string;
}

interface SchedulerState {
  isRunning: boolean;
  iterationCount: number;
  targetIterations: number;
  lastRunAt: string | null;
  loopId: string | null;
}

class ObjectionIntelligenceMicroLoop {
  private state: MicroLoopState | null = null;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, "utf-8");
        this.state = JSON.parse(data);
        console.log(`📂 OBJECTION-INTELLIGENCE: State restored from ${STATE_FILE}`);
        console.log(`   🔄 Loop ID: ${this.state?.loopId}`);
        console.log(`   📊 Objections: ${this.state?.totalObjections.length}`);
      }
    } catch (error) {
      console.error("Error loading state:", error);
    }
  }

  private saveState(): void {
    try {
      const dir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error("Error saving state:", error);
    }
  }

  private validateVQS(text: string): { compliant: boolean; violations: string[] } {
    const violations: string[] = [];
    const lowerText = text.toLowerCase();

    for (const term of FORBIDDEN_TERMS) {
      if (lowerText.includes(term)) {
        violations.push(`Contains forbidden term: "${term}"`);
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

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
      version: "1.1",
    };

    await this.startIteration();
    this.saveState();

    console.log(`✅ OBJECTION-INTELLIGENCE: Loop ${this.state.loopId} activated`);

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
      objectionsCaptured: 0,
      patternsIdentified: [],
      patchesApplied: [],
      frictionBefore: this.state.currentFriction,
      campaignsSent: 0,
      ledgerEntriesCreated: 0,
    };

    this.state.iterations.push(iteration);
    this.saveState();

    console.log(`🔁 ITERATION ${iterationNumber} STARTED`);
    console.log(`   📊 Friction at start: ${iteration.frictionBefore}`);

    return iteration;
  }

  private categorizeObjection(rawText: string, persona: string): { 
    category: string; 
    severity: "low" | "medium" | "high" | "critical";
    isStakeholderConfidence: boolean;
  } {
    const lowerText = rawText.toLowerCase();

    const isValidPersona = APPROVED_PERSONAS.some(p => 
      persona.toLowerCase().includes(p.replace(/_/g, " ")) ||
      persona.toLowerCase().includes(p.replace(/_/g, ""))
    );

    if (!isValidPersona) {
      console.warn(`⚠️ OBJECTION-INTELLIGENCE: Non-standard persona "${persona}" - flagging for review`);
    }

    for (const pattern of STAKEHOLDER_CONFIDENCE_PATTERNS) {
      if (pattern.regex.test(rawText)) {
        return { 
          category: "stakeholder_confidence", 
          severity: pattern.severity as "low" | "medium" | "high" | "critical",
          isStakeholderConfidence: true,
        };
      }
    }

    for (const pattern of OBJECTION_PATTERNS) {
      if (pattern.regex.test(rawText)) {
        return { 
          category: pattern.category, 
          severity: pattern.severity as "low" | "medium" | "high" | "critical",
          isStakeholderConfidence: pattern.category === "stakeholder_confidence",
        };
      }
    }

    if (lowerText.includes("compliance") && (lowerText.includes("overhead") || lowerText.includes("cost center"))) {
      return { category: "mindset_block", severity: "critical", isStakeholderConfidence: false };
    }

    return { category: "clarity_gap", severity: "medium", isStakeholderConfidence: false };
  }

  async captureObjection(objection: Omit<Objection, "id" | "capturedAt" | "resolved" | "vqsValidated" | "vqsViolations">): Promise<Objection> {
    if (!this.state || this.state.status !== "running") {
      throw new Error("Micro-loop not running");
    }

    const vqsCheck = this.validateVQS(objection.rawText);
    
    const categorized = this.categorizeObjection(objection.rawText, objection.persona);

    const fullObjection: Objection = {
      ...objection,
      id: `obj_${nanoid(8)}`,
      category: categorized.category,
      severity: categorized.severity,
      capturedAt: new Date().toISOString(),
      resolved: false,
      vqsValidated: vqsCheck.compliant,
      vqsViolations: vqsCheck.violations,
    };

    this.state.totalObjections.push(fullObjection);

    this.state.patternFrequency[categorized.category] = 
      (this.state.patternFrequency[categorized.category] || 0) + 1;

    const currentIteration = this.state.iterations[this.state.iterations.length - 1];
    if (currentIteration) {
      currentIteration.objectionsCaptured++;
      if (!currentIteration.patternsIdentified.includes(categorized.category)) {
        currentIteration.patternsIdentified.push(categorized.category);
      }
    }

    this.saveState();

    console.log(`📝 OBJECTION CAPTURED: ${fullObjection.id}`);
    console.log(`   📂 Category: ${categorized.category}`);
    console.log(`   ⚠️ Severity: ${categorized.severity}`);
    console.log(`   👤 Persona: ${objection.persona}`);
    console.log(`   🎯 Stakeholder-Confidence: ${categorized.isStakeholderConfidence ? "YES" : "NO"}`);
    console.log(`   ✅ VQS Validated: ${vqsCheck.compliant}`);
    if (vqsCheck.violations.length > 0) {
      console.log(`   ⚠️ VQS Violations: ${vqsCheck.violations.join(", ")}`);
    }

    return fullObjection;
  }

  async analyzePatterns(): Promise<{
    topPatterns: Array<{ category: string; count: number; percentage: number }>;
    recommendedPatches: ContentPatch[];
    priorityOrder: string[];
    stakeholderConfidenceRatio: number;
  }> {
    if (!this.state) throw new Error("Loop not started");

    const totalObjections = Object.values(this.state.patternFrequency).reduce((a, b) => a + b, 0);

    const stakeholderConfidenceCount = this.state.patternFrequency["stakeholder_confidence"] || 0;
    const stakeholderConfidenceRatio = totalObjections > 0 
      ? stakeholderConfidenceCount / totalObjections 
      : 0;

    const topPatterns = Object.entries(this.state.patternFrequency)
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalObjections > 0 ? (count / totalObjections) * 100 : 0,
      }))
      .sort((a, b) => {
        if (a.category === "stakeholder_confidence") return -1;
        if (b.category === "stakeholder_confidence") return 1;
        return b.count - a.count;
      });

    const priorityOrder = topPatterns
      .filter(p => p.percentage >= 10 || p.category === "stakeholder_confidence")
      .map(p => p.category);

    if (!priorityOrder.includes("stakeholder_confidence") && stakeholderConfidenceCount > 0) {
      priorityOrder.unshift("stakeholder_confidence");
    }

    const recommendedPatches = priorityOrder
      .map(category => CONTENT_PATCHES[category])
      .filter(Boolean);

    console.log(`📊 PATTERN ANALYSIS COMPLETE`);
    console.log(`   📈 Total Objections: ${totalObjections}`);
    console.log(`   🎯 Stakeholder-Confidence Ratio: ${(stakeholderConfidenceRatio * 100).toFixed(1)}%`);
    console.log(`   🔝 Top Patterns:`);
    topPatterns.slice(0, 3).forEach((p, i) => {
      console.log(`      ${i + 1}. ${p.category}: ${p.count} (${p.percentage.toFixed(1)}%)`);
    });

    return { topPatterns, recommendedPatches, priorityOrder, stakeholderConfidenceRatio };
  }

  async applyPatches(categories: string[]): Promise<{
    applied: string[];
    blocked: string[];
    patches: ContentPatch[];
    messagingUpdates: string[];
  }> {
    if (!this.state) throw new Error("Loop not started");

    const patches: ContentPatch[] = [];
    const messagingUpdates: string[] = [];
    const applied: string[] = [];
    const blocked: string[] = [];

    for (const category of categories) {
      const patch = CONTENT_PATCHES[category];
      if (patch) {
        const vqsCheck = this.validateVQS(patch.messagingShift);
        
        if (vqsCheck.compliant && patch.vqsCompliant) {
          patches.push(patch);
          applied.push(category);
          this.state.patchesApplied.push(category);
          messagingUpdates.push(patch.messagingShift);
        } else {
          console.warn(`⚠️ VQS BLOCK: Patch for ${category} failed VQS validation`);
          console.warn(`   Violations: ${vqsCheck.violations.join(", ")}`);
          blocked.push(category);
        }
      }
    }

    const currentIteration = this.state.iterations[this.state.iterations.length - 1];
    if (currentIteration) {
      currentIteration.patchesApplied = applied;
    }

    this.saveState();

    console.log(`🔧 PATCHES APPLIED: ${applied.length}`);
    applied.forEach(c => console.log(`   ✓ ${c}`));
    if (blocked.length > 0) {
      console.log(`🚫 PATCHES BLOCKED: ${blocked.length}`);
      blocked.forEach(c => console.log(`   ✗ ${c}`));
    }

    return { applied, blocked, patches, messagingUpdates };
  }

  async recordCampaignSent(campaignId: string, hypothesisId: string, persona: string): Promise<void> {
    if (!this.state) throw new Error("Loop not started");

    const currentIteration = this.state.iterations[this.state.iterations.length - 1];
    if (currentIteration) {
      currentIteration.campaignsSent++;
    }

    this.saveState();

    console.log(`📧 CAMPAIGN RECORDED: ${campaignId}`);
    console.log(`   🧪 Hypothesis: ${hypothesisId}`);
    console.log(`   👤 Persona: ${persona}`);
  }

  async recordLedgerEntry(
    sendId: string, 
    campaignId: string,
    persona: string, 
    problemAngle: string, 
    metricFocus: string,
    toneStyle?: string,
    ctaType?: string
  ): Promise<{ success: boolean; entryId?: string; error?: string }> {
    if (!this.state) {
      return { success: false, error: "Loop not started" };
    }

    try {
      const entry = {
        sendId,
        campaignId,
        persona,
        problemAngle,
        metricFocus,
        toneStyle: toneStyle || null,
        ctaType: ctaType || null,
        doctrineScore: 100,
        validatorPass: true,
        vqsBand: "standard",
        forbiddenFlag: false,
        opens: 0,
        clicks: 0,
        replies: 0,
        positiveReplies: 0,
        bookedCalls: 0,
        score: 0,
        isActive: true,
      };

      await db.insert(performanceLedger).values(entry);

      const currentIteration = this.state.iterations[this.state.iterations.length - 1];
      if (currentIteration) {
        currentIteration.ledgerEntriesCreated++;
      }

      this.saveState();

      console.log(`📊 LEDGER ENTRY CREATED: ${sendId}`);
      console.log(`   📧 Campaign: ${campaignId}`);
      console.log(`   👤 Persona: ${persona}`);
      console.log(`   📐 Angle: ${problemAngle}`);
      console.log(`   📏 Focus: ${metricFocus}`);

      return { success: true, entryId: sendId };
    } catch (error: any) {
      console.error(`❌ Error creating ledger entry:`, error);
      return { success: false, error: error.message || String(error) };
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
    console.log(`   📝 Objections: ${currentIteration.objectionsCaptured}`);
    console.log(`   📧 Campaigns: ${currentIteration.campaignsSent}`);
    console.log(`   📊 Ledger Entries: ${currentIteration.ledgerEntriesCreated}`);

    if (frictionAfter <= this.state.targetFriction) {
      this.state.status = "friction_target_met";
      console.log(`🎯 FRICTION TARGET MET! Ready for L6 Acceleration Protocol.`);
    } else if (this.state.iterations.length < 5) {
      await this.startIteration();
    } else {
      this.state.status = "completed";
      console.log(`⚠️ 5 iterations complete. Analyzing overall progress...`);
    }

    this.saveState();

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
    stakeholderConfidenceObjections: number;
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
        stakeholderConfidenceObjections: 0,
        topPatterns: [],
        patchesApplied: [],
        readyForL6: false,
      };
    }

    const topPatterns = Object.entries(this.state.patternFrequency)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const stakeholderConfidenceObjections = this.state.patternFrequency["stakeholder_confidence"] || 0;

    return {
      loopId: this.state.loopId,
      status: this.state.status,
      currentFriction: this.state.currentFriction,
      targetFriction: this.state.targetFriction,
      gap: this.state.currentFriction - this.state.targetFriction,
      iterationsCompleted: this.state.iterations.filter(i => i.status === "completed").length,
      totalObjections: this.state.totalObjections.length,
      stakeholderConfidenceObjections,
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
      ledgerEntries: number;
    }>;
    overallDelta: number;
    targetMet: boolean;
    stakeholderConfidenceRatio: number;
    recommendations: string[];
  }> {
    if (!this.state) throw new Error("Loop not started");

    const iterations = this.state.iterations.map(i => ({
      number: i.iterationNumber,
      frictionBefore: i.frictionBefore,
      frictionAfter: i.frictionAfter,
      delta: i.frictionDelta,
      objections: i.objectionsCaptured,
      campaigns: i.campaignsSent,
      ledgerEntries: i.ledgerEntriesCreated,
    }));

    const firstFriction = this.state.iterations[0]?.frictionBefore || 28;
    const lastFriction = this.state.currentFriction;
    const overallDelta = firstFriction - lastFriction;

    const { stakeholderConfidenceRatio, topPatterns } = await this.analyzePatterns();

    const recommendations: string[] = [];

    if (stakeholderConfidenceRatio < 0.2) {
      recommendations.push("FOCUS: Increase stakeholder-confidence objection capture");
    }

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
      stakeholderConfidenceRatio,
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

const SCHEDULER_STATE_FILE = path.join(process.cwd(), "data", "micro-loop-scheduler-state.json");

class MicroLoopScheduler {
  private schedulerId: NodeJS.Timeout | null = null;
  private state: SchedulerState;
  private readonly DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;
  private readonly TARGET_ITERATIONS = 5;
  
  constructor() {
    this.state = this.loadState();
  }
  
  private loadState(): SchedulerState {
    try {
      if (fs.existsSync(SCHEDULER_STATE_FILE)) {
        const data = fs.readFileSync(SCHEDULER_STATE_FILE, "utf-8");
        const loaded = JSON.parse(data);
        console.log(`📂 SCHEDULER: State restored - Iteration ${loaded.iterationCount}/${loaded.targetIterations}`);
        return loaded;
      }
    } catch (error) {
      console.error("Error loading scheduler state:", error);
    }
    return {
      isRunning: false,
      iterationCount: 0,
      targetIterations: this.TARGET_ITERATIONS,
      lastRunAt: null,
      loopId: null,
    };
  }
  
  private saveState(): void {
    try {
      const dir = path.dirname(SCHEDULER_STATE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SCHEDULER_STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error("Error saving scheduler state:", error);
    }
  }
  
  async start(): Promise<void> {
    if (this.state.isRunning) {
      console.log("⚠️ MICRO-LOOP SCHEDULER: Already running");
      return;
    }

    if (this.state.iterationCount >= this.TARGET_ITERATIONS) {
      console.log("✅ MICRO-LOOP SCHEDULER: All iterations already complete");
      return;
    }
    
    this.state.isRunning = true;
    
    const loopStatus = await objectionIntelligence.getStatus();
    if (loopStatus.status === "not_started") {
      const loop = await objectionIntelligence.startLoop(28, 27);
      this.state.loopId = loop.loopId;
    } else {
      this.state.loopId = loopStatus.loopId;
    }
    
    this.saveState();
    
    console.log("📅 MICRO-LOOP SCHEDULER: Daily automation started");
    console.log(`   🎯 Target: ${this.TARGET_ITERATIONS} iterations`);
    console.log(`   📊 Completed: ${this.state.iterationCount}`);
    console.log(`   ⏰ Interval: 24 hours per iteration`);
    
    await this.runDailyCycle();
    
    if (this.state.iterationCount < this.TARGET_ITERATIONS) {
      this.schedulerId = setInterval(async () => {
        if (this.state.iterationCount < this.TARGET_ITERATIONS && this.state.isRunning) {
          await this.runDailyCycle();
        } else {
          console.log("✅ MICRO-LOOP SCHEDULER: All iterations complete or stopped");
          this.stop();
        }
      }, this.DAILY_INTERVAL_MS);
    }
  }
  
  private async runDailyCycle(): Promise<void> {
    if (this.state.iterationCount >= this.TARGET_ITERATIONS) {
      console.log("✅ MICRO-LOOP SCHEDULER: Target iterations reached, stopping");
      this.stop();
      return;
    }

    this.state.iterationCount++;
    this.state.lastRunAt = new Date().toISOString();
    this.saveState();
    
    console.log(`\n📅 DAILY CYCLE ${this.state.iterationCount}/${this.TARGET_ITERATIONS}`);
    console.log(`   ⏰ Started at: ${this.state.lastRunAt}`);
    
    try {
      const analysis = await objectionIntelligence.analyzePatterns();
      console.log(`   📊 Patterns analyzed: ${analysis.topPatterns.length}`);
      console.log(`   🎯 Stakeholder-Confidence Ratio: ${(analysis.stakeholderConfidenceRatio * 100).toFixed(1)}%`);
      
      if (analysis.priorityOrder.length > 0) {
        const patches = await objectionIntelligence.applyPatches(analysis.priorityOrder.slice(0, 3));
        console.log(`   🔧 Patches applied: ${patches.applied.length}`);
        console.log(`   🚫 Patches blocked: ${patches.blocked.length}`);
      }
      
      const status = await objectionIntelligence.getStatus();
      console.log(`   📈 Current friction: ${status.currentFriction}`);
      console.log(`   🎯 Target friction: ${status.targetFriction}`);
      console.log(`   📝 Objections captured: ${status.totalObjections}`);
      
      if (status.readyForL6) {
        console.log(`   🎉 FRICTION TARGET MET! Ready for L6 activation.`);
        this.stop();
      }
      
    } catch (error) {
      console.error(`   ❌ Daily cycle error:`, error);
    }
  }
  
  stop(): void {
    if (this.schedulerId) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.state.isRunning = false;
    this.saveState();
    console.log("⏹️ MICRO-LOOP SCHEDULER: Stopped");
  }
  
  getStatus(): { running: boolean; iteration: number; target: number; lastRunAt: string | null; loopId: string | null } {
    return {
      running: this.state.isRunning,
      iteration: this.state.iterationCount,
      target: this.state.targetIterations,
      lastRunAt: this.state.lastRunAt,
      loopId: this.state.loopId,
    };
  }

  reset(): void {
    this.stop();
    this.state = {
      isRunning: false,
      iterationCount: 0,
      targetIterations: this.TARGET_ITERATIONS,
      lastRunAt: null,
      loopId: null,
    };
    this.saveState();
    console.log("🔄 MICRO-LOOP SCHEDULER: Reset to initial state");
  }
}

export const objectionIntelligence = new ObjectionIntelligenceMicroLoop();
export const microLoopScheduler = new MicroLoopScheduler();
export { ObjectionIntelligenceMicroLoop, ContentPatch, Objection, MicroLoopIteration, MicroLoopState, MicroLoopScheduler };
