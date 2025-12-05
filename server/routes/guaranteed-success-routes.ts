/**
 * GUARANTEED SUCCESS ENGINE API ROUTES
 * 
 * Endpoints for the 8 closed-loop processes
 */

import { Router, Request, Response } from "express";
import {
  runGuaranteedSuccessCycle,
  getGSEState,
  getDecisionLineage,
  getAgentDailyLogs
} from "../services/guaranteed-success-engine";

const router = Router();

/**
 * GET /api/gse/status
 * Get current Guaranteed Success Engine status
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const state = getGSEState();
    res.json({
      success: true,
      data: {
        successScore: state.successScore,
        cycleCount: state.cycleCount,
        lastRun: state.lastRun,
        autoCorrections: state.autoCorrections,
        summary: {
          demandSignals: state.demandSignals.length,
          demandSignalsRequiringAction: state.demandSignals.filter(s => s.actionRequired).length,
          activeAssets: state.assetPerformance.filter(a => a.status === "active").length,
          sunsetAssets: state.assetPerformance.filter(a => a.status === "sunset").length,
          revenueForecasts: state.revenueForecasts.length,
          offerOptimizations: state.offerOptimizations.filter(o => o.recommendedAction !== "maintain").length,
          failureModes: {
            critical: state.failureModes.filter(f => f.severity === "critical").length,
            warning: state.failureModes.filter(f => f.severity === "warning").length,
            watch: state.failureModes.filter(f => f.severity === "watch").length
          },
          retentionSignals: {
            highRisk: state.retentionSignals.filter(r => r.riskScore > 70).length,
            mediumRisk: state.retentionSignals.filter(r => r.riskScore > 40 && r.riskScore <= 70).length,
            healthy: state.retentionSignals.filter(r => r.riskScore <= 40).length
          }
        }
      }
    });
  } catch (error) {
    console.error("[GSE API] Error getting status:", error);
    res.status(500).json({ success: false, error: "Failed to get GSE status" });
  }
});

/**
 * GET /api/gse/demand-signals
 * Get demand signal monitoring data (Process 1)
 */
router.get("/demand-signals", async (req: Request, res: Response) => {
  try {
    const state = getGSEState();
    res.json({
      success: true,
      process: "1. Daily Demand Signal Monitoring",
      purpose: "Ensure a predictable pipeline of awareness and high-intent traffic",
      guarantee: "You never run 'dead' campaigns; demand recalibrates daily",
      data: state.demandSignals
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get demand signals" });
  }
});

/**
 * GET /api/gse/asset-performance
 * Get asset-to-sales loop data (Process 2)
 */
router.get("/asset-performance", async (req: Request, res: Response) => {
  try {
    const state = getGSEState();
    res.json({
      success: true,
      process: "2. Asset-to-Sales Loop",
      purpose: "Convert readers into evaluators",
      guarantee: "Every asset becomes part of a measurable revenue pathway",
      data: state.assetPerformance,
      summary: {
        active: state.assetPerformance.filter(a => a.status === "active").length,
        optimizing: state.assetPerformance.filter(a => a.status === "optimizing").length,
        sunset: state.assetPerformance.filter(a => a.status === "sunset").length,
        totalRevenueAttribution: state.assetPerformance.reduce((sum, a) => sum + a.revenueAttribution, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get asset performance" });
  }
});

/**
 * GET /api/gse/revenue-forecasts
 * Get predictive revenue modeling data (Process 3)
 */
router.get("/revenue-forecasts", async (req: Request, res: Response) => {
  try {
    const state = getGSEState();
    res.json({
      success: true,
      process: "3. Predictive Revenue Modeling",
      purpose: "Prevent revenue surprises",
      guarantee: "Predictability → valuation → stability",
      data: state.revenueForecasts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get revenue forecasts" });
  }
});

/**
 * GET /api/gse/offer-optimizations
 * Get continuous offer optimization data (Process 4)
 */
router.get("/offer-optimizations", async (req: Request, res: Response) => {
  try {
    const state = getGSEState();
    res.json({
      success: true,
      process: "4. Continuous Offer Optimization",
      purpose: "Ensure the product is irresistible",
      guarantee: "The offer always matches what the market is already proving it wants",
      data: state.offerOptimizations,
      summary: {
        highlight: state.offerOptimizations.filter(o => o.recommendedAction === "highlight").length,
        suppress: state.offerOptimizations.filter(o => o.recommendedAction === "suppress").length,
        maintain: state.offerOptimizations.filter(o => o.recommendedAction === "maintain").length,
        projectedImpact: state.offerOptimizations.reduce((sum, o) => sum + o.impact, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get offer optimizations" });
  }
});

/**
 * GET /api/gse/failure-modes
 * Get failure mode detection data (Process 6)
 */
router.get("/failure-modes", async (req: Request, res: Response) => {
  try {
    const state = getGSEState();
    res.json({
      success: true,
      process: "6. Failure-Mode Detection",
      purpose: "Stop revenue loss before it happens",
      guarantee: "Problems are corrected before they impact revenue",
      data: state.failureModes,
      summary: {
        critical: state.failureModes.filter(f => f.severity === "critical").length,
        warning: state.failureModes.filter(f => f.severity === "warning").length,
        watch: state.failureModes.filter(f => f.severity === "watch").length,
        correctionsApplied: state.failureModes.filter(f => f.correctionApplied).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get failure modes" });
  }
});

/**
 * GET /api/gse/retention-signals
 * Get closed-loop retention engine data (Process 7)
 */
router.get("/retention-signals", async (req: Request, res: Response) => {
  try {
    const state = getGSEState();
    res.json({
      success: true,
      process: "7. Closed-Loop Retention Engine",
      purpose: "Maximize lifetime value and valuation",
      guarantee: "Retention, not acquisition, becomes the foundation of valuation",
      data: state.retentionSignals,
      summary: {
        highRisk: state.retentionSignals.filter(r => r.riskScore > 70).length,
        mediumRisk: state.retentionSignals.filter(r => r.riskScore > 40 && r.riskScore <= 70).length,
        healthy: state.retentionSignals.filter(r => r.riskScore <= 40).length,
        interventionsTriggered: state.retentionSignals.filter(r => r.reEngagementTriggered).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get retention signals" });
  }
});

/**
 * GET /api/gse/decision-lineage
 * Get decision lineage (Process 8 component)
 */
router.get("/decision-lineage", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const lineage = getDecisionLineage(limit);
    res.json({
      success: true,
      process: "8. Executive Oversight Feedback Loop",
      purpose: "Turn the system into a self-improving asset",
      guarantee: "The system improves itself faster than the market changes",
      data: lineage,
      count: lineage.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get decision lineage" });
  }
});

/**
 * GET /api/gse/agent-logs
 * Get agent daily logs (Process 8 component)
 */
router.get("/agent-logs", async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;
    const logs = getAgentDailyLogs(date);
    res.json({
      success: true,
      process: "8. Executive Oversight Feedback Loop",
      component: "What Happened / What's Next Agent Logs",
      date: date || new Date().toISOString().split("T")[0],
      data: logs,
      count: logs.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get agent logs" });
  }
});

/**
 * POST /api/gse/run-cycle
 * Manually trigger a GSE cycle
 */
router.post("/run-cycle", async (req: Request, res: Response) => {
  try {
    console.log("[GSE API] Manual cycle triggered");
    const state = await runGuaranteedSuccessCycle();
    res.json({
      success: true,
      message: "Guaranteed Success Engine cycle completed",
      data: {
        successScore: state.successScore,
        cycleCount: state.cycleCount,
        autoCorrections: state.autoCorrections,
        lastRun: state.lastRun
      }
    });
  } catch (error) {
    console.error("[GSE API] Error running cycle:", error);
    res.status(500).json({ success: false, error: "Failed to run GSE cycle" });
  }
});

/**
 * GET /api/gse/guarantees
 * Get all 8 guarantees summary
 */
router.get("/guarantees", async (req: Request, res: Response) => {
  try {
    const state = getGSEState();
    res.json({
      success: true,
      title: "8 Closed-Loop Guarantees for Success",
      principle: "Success becomes a byproduct of system design, not effort",
      guarantees: [
        {
          process: 1,
          name: "Daily Demand Signal Monitoring",
          guarantee: "You never run 'dead' campaigns; demand recalibrates daily",
          status: state.demandSignals.filter(s => !s.actionRequired).length === state.demandSignals.length ? "✅ Healthy" : "⚠️ Action Required"
        },
        {
          process: 2,
          name: "Asset-to-Sales Loop",
          guarantee: "Every asset becomes part of a measurable revenue pathway",
          status: state.assetPerformance.filter(a => a.status === "active").length > 0 ? "✅ Active" : "⚠️ Needs Assets"
        },
        {
          process: 3,
          name: "Predictive Revenue Modeling",
          guarantee: "Predictability → valuation → stability",
          status: state.revenueForecasts.length > 0 ? "✅ Forecasting" : "⚠️ No Forecasts"
        },
        {
          process: 4,
          name: "Continuous Offer Optimization",
          guarantee: "The offer always matches what the market is already proving it wants",
          status: state.offerOptimizations.filter(o => o.recommendedAction !== "maintain").length > 0 ? "🔄 Optimizing" : "✅ Optimal"
        },
        {
          process: 5,
          name: "Audit-Readiness Narrative Enforcement",
          guarantee: "Messaging never drifts; demand compounds instead of fragments",
          status: "✅ Editorial Firewall Active"
        },
        {
          process: 6,
          name: "Failure-Mode Detection",
          guarantee: "Problems are corrected before they impact revenue",
          status: state.failureModes.filter(f => f.severity === "critical").length === 0 ? "✅ No Critical Issues" : "🔴 Critical Issues"
        },
        {
          process: 7,
          name: "Closed-Loop Retention Engine",
          guarantee: "Retention, not acquisition, becomes the foundation of valuation",
          status: state.retentionSignals.filter(r => r.riskScore > 70).length === 0 ? "✅ Retention Healthy" : "⚠️ High-Risk Users"
        },
        {
          process: 8,
          name: "Executive Oversight Feedback Loop",
          guarantee: "The system improves itself faster than the market changes",
          status: "✅ Self-Improving"
        }
      ],
      overallSuccess: {
        score: state.successScore,
        interpretation: state.successScore >= 80 ? "🎯 Success is Mechanical" :
                       state.successScore >= 60 ? "📈 On Track" :
                       state.successScore >= 40 ? "⚠️ Needs Attention" : "🔴 Critical Review Needed"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get guarantees" });
  }
});

export default router;
