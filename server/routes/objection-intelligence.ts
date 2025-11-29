/**
 * OBJECTION-INTELLIGENCE MICRO-LOOP API v1.0
 * 
 * Endpoints for the Architect-approved friction reduction system
 */

import { Router } from "express";
import { objectionIntelligence, microLoopScheduler } from "../services/optimization/objection-intelligence";

const router = Router();

/**
 * POST /api/objection-intelligence/start
 * Start the micro-loop with current friction level
 */
router.post("/start", async (req, res) => {
  try {
    const { currentFriction = 28, targetFriction = 27 } = req.body;

    console.log(`🔄 API: Starting Objection-Intelligence Micro-Loop`);

    const state = await objectionIntelligence.startLoop(currentFriction, targetFriction);

    return res.json({
      success: true,
      data: {
        loopId: state.loopId,
        status: state.status,
        currentFriction: state.currentFriction,
        targetFriction: state.targetFriction,
        gap: state.currentFriction - state.targetFriction,
        schedule: state.dailySchedule,
        message: "Micro-loop activated. Capture objections to begin pattern analysis.",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error starting micro-loop:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/objection-intelligence/status
 * Get current loop status
 */
router.get("/status", async (_req, res) => {
  try {
    const status = await objectionIntelligence.getStatus();

    return res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting status:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/objection-intelligence/capture
 * Capture a new objection
 */
router.post("/capture", async (req, res) => {
  try {
    const { source, rawText, persona, campaignId, hypothesisId } = req.body;

    if (!rawText || !persona) {
      return res.status(400).json({
        success: false,
        error: "Required fields: rawText, persona",
      });
    }

    const objection = await objectionIntelligence.captureObjection({
      source: source || "manual_entry",
      rawText,
      persona,
      campaignId,
      hypothesisId,
      category: "", // Will be auto-categorized
      severity: "medium", // Will be auto-assigned
    });

    return res.json({
      success: true,
      data: objection,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error capturing objection:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/objection-intelligence/analyze
 * Analyze current objection patterns
 */
router.get("/analyze", async (_req, res) => {
  try {
    const analysis = await objectionIntelligence.analyzePatterns();

    return res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error analyzing patterns:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/objection-intelligence/apply-patches
 * Apply content patches for specific objection categories
 */
router.post("/apply-patches", async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        error: "Required: categories (array of objection categories)",
      });
    }

    const result = await objectionIntelligence.applyPatches(categories);

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error applying patches:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/objection-intelligence/record-campaign
 * Record a campaign sent as part of the micro-loop
 */
router.post("/record-campaign", async (req, res) => {
  try {
    const { campaignId, hypothesisId, persona } = req.body;

    if (!campaignId || !hypothesisId || !persona) {
      return res.status(400).json({
        success: false,
        error: "Required fields: campaignId, hypothesisId, persona",
      });
    }

    await objectionIntelligence.recordCampaignSent(campaignId, hypothesisId, persona);

    return res.json({
      success: true,
      message: "Campaign recorded",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error recording campaign:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/objection-intelligence/record-ledger-entry
 * Record a ledger entry for L6 tracking
 */
router.post("/record-ledger-entry", async (req, res) => {
  try {
    const { sendId, campaignId, persona, problemAngle, metricFocus, toneStyle, ctaType } = req.body;

    if (!sendId || !campaignId || !persona || !problemAngle || !metricFocus) {
      return res.status(400).json({
        success: false,
        error: "Required fields: sendId, campaignId, persona, problemAngle, metricFocus",
      });
    }

    const result = await objectionIntelligence.recordLedgerEntry(
      sendId,
      campaignId,
      persona,
      problemAngle,
      metricFocus,
      toneStyle,
      ctaType
    );

    if (result.success) {
      return res.json({
        success: true,
        data: { entryId: result.entryId },
        message: "Ledger entry created",
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error("Error recording ledger entry:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/objection-intelligence/complete-iteration
 * Complete the current iteration with friction measurement
 */
router.post("/complete-iteration", async (req, res) => {
  try {
    const { frictionAfter } = req.body;

    if (typeof frictionAfter !== "number") {
      return res.status(400).json({
        success: false,
        error: "Required: frictionAfter (number)",
      });
    }

    const iteration = await objectionIntelligence.completeIteration(frictionAfter);
    const status = await objectionIntelligence.getStatus();

    return res.json({
      success: true,
      data: {
        iteration: {
          number: iteration.iterationNumber,
          frictionBefore: iteration.frictionBefore,
          frictionAfter: iteration.frictionAfter,
          delta: iteration.frictionDelta,
          objections: iteration.objectionsCapruted,
          campaigns: iteration.campaignsSent,
        },
        loopStatus: status.status,
        readyForL6: status.readyForL6,
        nextAction: status.readyForL6 
          ? "Friction target met! Request L6 Acceleration Protocol activation from Architect."
          : `Continue to iteration ${iteration.iterationNumber + 1}. Gap remaining: ${status.gap} point(s).`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error completing iteration:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/objection-intelligence/report
 * Get the friction delta report (Strategist deliverable)
 */
router.get("/report", async (_req, res) => {
  try {
    const report = await objectionIntelligence.generateFrictionDeltaReport();

    return res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/objection-intelligence/ledger-stats
 * Get performance ledger statistics for L6 readiness
 */
router.get("/ledger-stats", async (_req, res) => {
  try {
    const stats = await objectionIntelligence.getLedgerStats();

    const l6Threshold = 30;
    const readyForL6 = stats.uniqueCombinations >= l6Threshold;

    return res.json({
      success: true,
      data: {
        ...stats,
        l6Threshold,
        readyForL6,
        message: readyForL6
          ? `Ledger has ${stats.uniqueCombinations} combinations. Ready for L6.`
          : `Need ${l6Threshold - stats.uniqueCombinations} more combinations for L6 readiness.`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting ledger stats:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/objection-intelligence/vqs-constraints
 * Get VQS constraints (read-only)
 */
router.get("/vqs-constraints", async (_req, res) => {
  try {
    const constraints = objectionIntelligence.getVQSConstraints();

    return res.json({
      success: true,
      data: constraints,
      immutable: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting VQS constraints:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/objection-intelligence/scheduler/start
 * Start the automated daily micro-loop scheduler
 */
router.post("/scheduler/start", async (_req, res) => {
  try {
    console.log("📅 API: Starting Micro-Loop Scheduler");
    
    await microLoopScheduler.start();
    const status = microLoopScheduler.getStatus();
    
    return res.json({
      success: true,
      data: {
        ...status,
        message: "Daily micro-loop scheduler activated. Will run 5 iterations over 5 days.",
        schedule: {
          interval: "24 hours",
          targetIterations: 5,
          purpose: "Close friction gap (28 → 27) for L6 readiness",
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error starting scheduler:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/objection-intelligence/scheduler/stop
 * Stop the automated daily micro-loop scheduler
 */
router.post("/scheduler/stop", async (_req, res) => {
  try {
    console.log("⏹️ API: Stopping Micro-Loop Scheduler");
    
    microLoopScheduler.stop();
    const status = microLoopScheduler.getStatus();
    
    return res.json({
      success: true,
      data: {
        ...status,
        message: "Micro-loop scheduler stopped.",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error stopping scheduler:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/objection-intelligence/scheduler/status
 * Get scheduler status
 */
router.get("/scheduler/status", async (_req, res) => {
  try {
    const schedulerStatus = microLoopScheduler.getStatus();
    const loopStatus = await objectionIntelligence.getStatus();
    
    return res.json({
      success: true,
      data: {
        scheduler: schedulerStatus,
        loop: loopStatus,
        l6Ready: loopStatus.readyForL6,
        nextAction: loopStatus.readyForL6
          ? "Friction target met! Request L6 Acceleration Protocol activation."
          : `Continue capturing objections. Gap: ${loopStatus.gap} point(s).`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting scheduler status:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
