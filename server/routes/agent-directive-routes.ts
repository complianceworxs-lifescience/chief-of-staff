/**
 * AGENT INSTALLATION DIRECTIVE API ROUTES
 * 
 * Endpoints for the 4 CoS-issued sub-directives:
 * 1. CMO - Marketing Execution Enforcement
 * 2. CRO - Revenue Predictability Enforcement
 * 3. Strategist - Positioning & Intelligence Enforcement
 * 4. Content Agent - Asset Production Enforcement
 */

import { Router, Request, Response } from "express";
import {
  runCMODirectiveCycle,
  runCRODirectiveCycle,
  runStrategistDirectiveCycle,
  runContentDirectiveCycle,
  runAllDirectiveCycles,
  getCMOState,
  getCROState,
  getStrategistState,
  getContentState,
  getCoSDirectiveLogs
} from "../services/agent-installation-directives";

const router = Router();

// ============================================================================
// OVERVIEW ENDPOINTS
// ============================================================================

/**
 * GET /api/directives/status
 * Get status of all 4 agent directives
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const cmo = getCMOState();
    const cro = getCROState();
    const strategist = getStrategistState();
    const content = getContentState();
    
    res.json({
      success: true,
      title: "Agent Installation Directives Status",
      description: "CoS-issued sub-directives for Guaranteed Success",
      directives: {
        cmo: {
          name: "CMO Installation Directive",
          mandate: "Drive predictable demand creation via spear-tip",
          lastRun: cmo.lastRun,
          demandStabilityIndex: cmo.demandStabilityIndex,
          topHook: cmo.topPerformingHook,
          activeVariants: cmo.messageVariants.filter(v => v.status !== "suppressed").length,
          assetsRouted: cmo.assets.filter(a => a.routing !== "none").length
        },
        cro: {
          name: "CRO Installation Directive",
          mandate: "Guarantee predictable revenue & conversion stability",
          lastRun: cro.lastRun,
          conversionStabilityIndex: cro.conversionStabilityIndex,
          revenuePredictabilityIndex: cro.revenuePredictabilityIndex,
          retentionRiskScore: cro.retentionRiskScore,
          weeklyLtvForecast: cro.weeklyLtvForecast
        },
        strategist: {
          name: "Strategist (Gemini) Installation Directive",
          mandate: "Refine positioning & spear-tip calibration",
          lastRun: strategist.lastRun,
          spearTipAngles: strategist.spearTipAngles.length,
          competitiveSignals: strategist.competitiveSignals.length,
          overrideActive: strategist.overrideActive,
          positioningViolations: strategist.positioningViolations.length
        },
        content: {
          name: "Content Agent Installation Directive",
          mandate: "Produce only assets that drive measurable movement",
          lastRun: content.lastRun,
          totalAssets: content.contentAssets.length,
          eligibleAssets: content.eligibilityChecks.filter(e => e.passed).length,
          replacementQueue: content.replacementQueue.length
        }
      }
    });
  } catch (error) {
    console.error("[DIRECTIVES API] Error getting status:", error);
    res.status(500).json({ success: false, error: "Failed to get directives status" });
  }
});

/**
 * POST /api/directives/run-all
 * Run all 4 directive cycles
 */
router.post("/run-all", async (req: Request, res: Response) => {
  try {
    console.log("[DIRECTIVES API] Running all directive cycles");
    const result = runAllDirectiveCycles();
    
    res.json({
      success: true,
      message: "All agent directive cycles completed",
      timestamp: result.timestamp,
      summary: {
        cmo: {
          demandStabilityIndex: result.cmo.demandStabilityIndex,
          activeVariants: result.cmo.messageVariants.filter(v => v.status !== "suppressed").length
        },
        cro: {
          conversionStabilityIndex: result.cro.conversionStabilityIndex,
          revenuePredictabilityIndex: result.cro.revenuePredictabilityIndex
        },
        strategist: {
          overrideActive: result.strategist.overrideActive,
          spearTipAngles: result.strategist.spearTipAngles.filter(a => a.action === "strengthen").length
        },
        content: {
          eligibleAssets: result.content.eligibilityChecks.filter(e => e.passed).length,
          replacementQueue: result.content.replacementQueue.length
        }
      }
    });
  } catch (error) {
    console.error("[DIRECTIVES API] Error running cycles:", error);
    res.status(500).json({ success: false, error: "Failed to run directive cycles" });
  }
});

/**
 * GET /api/directives/logs
 * Get CoS directive logs
 */
router.get("/logs", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = getCoSDirectiveLogs(limit);
    
    res.json({
      success: true,
      description: "All agent outputs delivered to CoS",
      data: logs,
      count: logs.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get directive logs" });
  }
});

// ============================================================================
// CMO DIRECTIVE ENDPOINTS
// ============================================================================

/**
 * GET /api/directives/cmo
 * Get full CMO directive state
 */
router.get("/cmo", async (req: Request, res: Response) => {
  try {
    const state = getCMOState();
    res.json({
      success: true,
      directive: "CMO Installation Directive",
      mandate: "Drive predictable demand creation by enforcing the Audit Readiness → Economic Impact → System spear-tip across all top-of-funnel activities",
      processes: [
        "1. Daily Demand Signal Monitoring",
        "2. Message Reinforcement Loop",
        "3. Asset Routing Enforcement",
        "4. 14-Day Spear-Tip Optimization",
        "5. Demand Stability Reporting"
      ],
      data: state
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get CMO state" });
  }
});

/**
 * POST /api/directives/cmo/run
 * Run CMO directive cycle
 */
router.post("/cmo/run", async (req: Request, res: Response) => {
  try {
    const state = runCMODirectiveCycle();
    res.json({
      success: true,
      message: "CMO directive cycle completed",
      data: {
        demandStabilityIndex: state.demandStabilityIndex,
        topHook: state.topPerformingHook,
        decliningAlerts: state.decliningAlerts,
        spearTipWindow: state.spearTipWindow
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to run CMO cycle" });
  }
});

/**
 * GET /api/directives/cmo/demand-signals
 * Get CMO demand signals
 */
router.get("/cmo/demand-signals", async (req: Request, res: Response) => {
  try {
    const state = getCMOState();
    res.json({
      success: true,
      process: "1. Daily Demand Signal Monitoring",
      data: state.demandSignals,
      summary: {
        total: state.demandSignals.length,
        actionRequired: state.demandSignals.filter(s => s.actionRequired).length,
        demandStabilityIndex: state.demandStabilityIndex
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get demand signals" });
  }
});

/**
 * GET /api/directives/cmo/message-variants
 * Get CMO message variants
 */
router.get("/cmo/message-variants", async (req: Request, res: Response) => {
  try {
    const state = getCMOState();
    res.json({
      success: true,
      process: "1. Daily Demand Signal Monitoring - Variant Ranking",
      data: state.messageVariants,
      summary: {
        total: state.messageVariants.length,
        winning: state.messageVariants.filter(v => v.status === "winning").length,
        active: state.messageVariants.filter(v => v.status === "active").length,
        suppressed: state.messageVariants.filter(v => v.status === "suppressed").length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get message variants" });
  }
});

/**
 * GET /api/directives/cmo/spear-tip
 * Get CMO spear-tip optimization window
 */
router.get("/cmo/spear-tip", async (req: Request, res: Response) => {
  try {
    const state = getCMOState();
    res.json({
      success: true,
      process: "4. 14-Day Spear-Tip Optimization",
      data: state.spearTipWindow,
      topHook: state.topPerformingHook
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get spear-tip data" });
  }
});

// ============================================================================
// CRO DIRECTIVE ENDPOINTS
// ============================================================================

/**
 * GET /api/directives/cro
 * Get full CRO directive state
 */
router.get("/cro", async (req: Request, res: Response) => {
  try {
    const state = getCROState();
    res.json({
      success: true,
      directive: "CRO Installation Directive",
      mandate: "Guarantee predictable revenue, conversion stability, and retention through forecasting, optimization, and corrective action",
      processes: [
        "1. Predictive Revenue Modeling",
        "2. Conversion Optimization Loop",
        "3. Retention Engine Activation",
        "4. Offer Clarity Enforcement",
        "5. Revenue Stability Reporting"
      ],
      data: state
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get CRO state" });
  }
});

/**
 * POST /api/directives/cro/run
 * Run CRO directive cycle
 */
router.post("/cro/run", async (req: Request, res: Response) => {
  try {
    const state = runCRODirectiveCycle();
    res.json({
      success: true,
      message: "CRO directive cycle completed",
      data: {
        conversionStabilityIndex: state.conversionStabilityIndex,
        revenuePredictabilityIndex: state.revenuePredictabilityIndex,
        retentionRiskScore: state.retentionRiskScore,
        weeklyLtvForecast: state.weeklyLtvForecast
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to run CRO cycle" });
  }
});

/**
 * GET /api/directives/cro/forecasts
 * Get CRO revenue forecasts
 */
router.get("/cro/forecasts", async (req: Request, res: Response) => {
  try {
    const state = getCROState();
    res.json({
      success: true,
      process: "1. Predictive Revenue Modeling",
      data: state.revenueForecasts,
      indices: {
        conversionStability: state.conversionStabilityIndex,
        revenuePredictability: state.revenuePredictabilityIndex
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get forecasts" });
  }
});

/**
 * GET /api/directives/cro/conversion-actions
 * Get CRO conversion optimization actions
 */
router.get("/cro/conversion-actions", async (req: Request, res: Response) => {
  try {
    const state = getCROState();
    res.json({
      success: true,
      process: "2. Conversion Optimization Loop",
      data: state.conversionActions,
      summary: {
        elevate: state.conversionActions.filter(a => a.status === "elevate").length,
        deprioritize: state.conversionActions.filter(a => a.status === "deprioritize").length,
        maintain: state.conversionActions.filter(a => a.status === "maintain").length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get conversion actions" });
  }
});

/**
 * GET /api/directives/cro/retention
 * Get CRO retention engine data
 */
router.get("/cro/retention", async (req: Request, res: Response) => {
  try {
    const state = getCROState();
    res.json({
      success: true,
      process: "3. Retention Engine Activation",
      data: state.churnRiskUsers,
      summary: {
        highRisk: state.churnRiskUsers.filter(u => u.riskScore > 70).length,
        interventionsTriggered: state.churnRiskUsers.filter(u => u.interventionTriggered).length,
        weeklyLtvForecast: state.weeklyLtvForecast,
        retentionRiskScore: state.retentionRiskScore
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get retention data" });
  }
});

/**
 * GET /api/directives/cro/offers
 * Get CRO offer clarity enforcement
 */
router.get("/cro/offers", async (req: Request, res: Response) => {
  try {
    const state = getCROState();
    res.json({
      success: true,
      process: "4. Offer Clarity Enforcement",
      data: state.offerUpdates,
      summary: {
        approved: state.offerUpdates.filter(o => o.approved).length,
        rejected: state.offerUpdates.filter(o => !o.approved).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get offer data" });
  }
});

// ============================================================================
// STRATEGIST DIRECTIVE ENDPOINTS
// ============================================================================

/**
 * GET /api/directives/strategist
 * Get full Strategist directive state
 */
router.get("/strategist", async (req: Request, res: Response) => {
  try {
    const state = getStrategistState();
    res.json({
      success: true,
      directive: "Strategist (Gemini) Installation Directive",
      mandate: "Continuously refine market positioning, spear-tip calibration, and narrative direction using live data from all agents",
      processes: [
        "1. Spear-Tip Calibration",
        "2. Competitive Intelligence Loop",
        "3. Positioning Enforcement",
        "4. Strategy Override Protocol",
        "5. Weekly Strategic Summary"
      ],
      data: state
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get Strategist state" });
  }
});

/**
 * POST /api/directives/strategist/run
 * Run Strategist directive cycle
 */
router.post("/strategist/run", async (req: Request, res: Response) => {
  try {
    const state = runStrategistDirectiveCycle();
    res.json({
      success: true,
      message: "Strategist directive cycle completed",
      data: {
        spearTipAngles: state.spearTipAngles.length,
        strengthening: state.spearTipAngles.filter(a => a.action === "strengthen").length,
        overrideActive: state.overrideActive,
        overrideReason: state.overrideReason,
        violations: state.positioningViolations.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to run Strategist cycle" });
  }
});

/**
 * GET /api/directives/strategist/spear-tip
 * Get Strategist spear-tip calibration
 */
router.get("/strategist/spear-tip", async (req: Request, res: Response) => {
  try {
    const state = getStrategistState();
    res.json({
      success: true,
      process: "1. Spear-Tip Calibration",
      data: state.spearTipAngles,
      summary: {
        strengthen: state.spearTipAngles.filter(a => a.action === "strengthen").length,
        maintain: state.spearTipAngles.filter(a => a.action === "maintain").length,
        remove: state.spearTipAngles.filter(a => a.action === "remove").length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get spear-tip data" });
  }
});

/**
 * GET /api/directives/strategist/competitive
 * Get Strategist competitive intelligence
 */
router.get("/strategist/competitive", async (req: Request, res: Response) => {
  try {
    const state = getStrategistState();
    res.json({
      success: true,
      process: "2. Competitive Intelligence Loop",
      data: state.competitiveSignals,
      summary: {
        total: state.competitiveSignals.length,
        highImpact: state.competitiveSignals.filter(s => s.impact === "high").length,
        byType: {
          messaging: state.competitiveSignals.filter(s => s.type === "messaging").length,
          painPoint: state.competitiveSignals.filter(s => s.type === "pain_point").length,
          funding: state.competitiveSignals.filter(s => s.type === "funding").length,
          terminology: state.competitiveSignals.filter(s => s.type === "terminology").length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get competitive data" });
  }
});

/**
 * GET /api/directives/strategist/override
 * Get Strategist override protocol status
 */
router.get("/strategist/override", async (req: Request, res: Response) => {
  try {
    const state = getStrategistState();
    res.json({
      success: true,
      process: "4. Strategy Override Protocol",
      active: state.overrideActive,
      reason: state.overrideReason,
      triggers: [
        "Demand collapse detected",
        "Conversion instability",
        "Revenue disruption",
        "Multiple high-impact competitive signals"
      ],
      correctionDeadline: state.overrideActive ? "24 hours" : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get override status" });
  }
});

/**
 * GET /api/directives/strategist/weekly-summary
 * Get Strategist weekly summary
 */
router.get("/strategist/weekly-summary", async (req: Request, res: Response) => {
  try {
    const state = getStrategistState();
    res.json({
      success: true,
      process: "5. Weekly Strategic Summary",
      data: state.weeklyStrategicSummary,
      generatedOnSunday: true
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get weekly summary" });
  }
});

// ============================================================================
// CONTENT AGENT DIRECTIVE ENDPOINTS
// ============================================================================

/**
 * GET /api/directives/content
 * Get full Content Agent directive state
 */
router.get("/content", async (req: Request, res: Response) => {
  try {
    const state = getContentState();
    res.json({
      success: true,
      directive: "Content Agent Installation Directive",
      mandate: "Produce only the assets that drive measurable movement in demand, conversion, or retention",
      processes: [
        "1. Asset Eligibility Rule",
        "2. Content-to-Sales Loop",
        "3. High-Precision Style Enforcement",
        "4. Asset Replacement Protocol",
        "5. Daily Output Summary"
      ],
      data: state
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get Content state" });
  }
});

/**
 * POST /api/directives/content/run
 * Run Content Agent directive cycle
 */
router.post("/content/run", async (req: Request, res: Response) => {
  try {
    const state = runContentDirectiveCycle();
    res.json({
      success: true,
      message: "Content Agent directive cycle completed",
      data: {
        eligibleAssets: state.eligibilityChecks.filter(e => e.passed).length,
        rejectedAssets: state.eligibilityChecks.filter(e => !e.passed).length,
        replacementQueue: state.replacementQueue.length,
        dailySummary: state.dailySummary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to run Content cycle" });
  }
});

/**
 * GET /api/directives/content/assets
 * Get Content Agent assets
 */
router.get("/content/assets", async (req: Request, res: Response) => {
  try {
    const state = getContentState();
    res.json({
      success: true,
      data: state.contentAssets,
      eligibilityChecks: state.eligibilityChecks,
      summary: {
        total: state.contentAssets.length,
        eligible: state.eligibilityChecks.filter(e => e.passed).length,
        rejected: state.eligibilityChecks.filter(e => !e.passed).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get assets" });
  }
});

/**
 * GET /api/directives/content/performance
 * Get Content Agent performance reviews
 */
router.get("/content/performance", async (req: Request, res: Response) => {
  try {
    const state = getContentState();
    res.json({
      success: true,
      process: "2. Content-to-Sales Loop",
      data: state.performanceReviews,
      summary: {
        active: state.performanceReviews.filter(r => r.outcome === "active").length,
        sunset: state.performanceReviews.filter(r => r.outcome === "sunset").length,
        revise: state.performanceReviews.filter(r => r.outcome === "revise").length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get performance data" });
  }
});

/**
 * GET /api/directives/content/replacement-queue
 * Get Content Agent replacement queue
 */
router.get("/content/replacement-queue", async (req: Request, res: Response) => {
  try {
    const state = getContentState();
    res.json({
      success: true,
      process: "4. Asset Replacement Protocol",
      data: state.replacementQueue,
      deadline: "24 hours from detection",
      requirements: [
        "Rewrite in alignment with winning patterns",
        "Redeploy within 24 hours",
        "Log all changes"
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get replacement queue" });
  }
});

/**
 * GET /api/directives/content/daily-summary
 * Get Content Agent daily summary
 */
router.get("/content/daily-summary", async (req: Request, res: Response) => {
  try {
    const state = getContentState();
    res.json({
      success: true,
      process: "5. Daily Output Summary",
      data: state.dailySummary
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get daily summary" });
  }
});

export default router;
