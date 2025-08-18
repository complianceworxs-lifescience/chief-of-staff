import { Router } from "express";
import { Autonomy } from "../services/autonomy";
import { AutonomyTier2 } from "../services/autonomy-tier2";
import type { Signal } from "../services/autonomy";

const router = Router();

// Standard signal processing endpoint - all agents use this
router.post("/execute", async (req, res) => {
  try {
    const signal: Signal = req.body;
    
    // Validate signal format
    if (!signal.agent || !signal.status || !signal.metrics) {
      return res.status(400).json({ 
        error: "Invalid signal format", 
        required: ["agent", "status", "metrics"]
      });
    }

    // Execute Tier 2 enhanced autonomy pipeline
    await AutonomyTier2.execute(signal);
    
    res.json({ 
      success: true, 
      message: `Signal processed for ${signal.agent}`,
      classification: Autonomy.classifyIssue(signal)
    });
  } catch (error) {
    console.error("Failed to execute autonomy signal:", error);
    res.status(500).json({ error: "Failed to process signal" });
  }
});

// Get KPI metrics for autonomy dashboard
router.get("/kpis", async (req, res) => {
  try {
    const { tier } = req.query;
    const kpis = tier === '1' ? 
      Autonomy.getKPIMetrics() : 
      AutonomyTier2.getTier2KPIMetrics();
    res.json(kpis);
  } catch (error) {
    console.error("Failed to get autonomy KPIs:", error);
    res.status(500).json({ error: "Failed to get KPIs" });
  }
});

// Get decision lineage log
router.get("/lineage", async (req, res) => {
  try {
    const { agent, limit } = req.query;
    let lineage = Autonomy.getDecisionLineage();
    
    // Filter by agent if specified
    if (agent && typeof agent === 'string') {
      lineage = lineage.filter(entry => entry.agent === agent);
    }
    
    // Limit results if specified
    if (limit && typeof limit === 'string') {
      const limitNum = parseInt(limit);
      lineage = lineage.slice(-limitNum); // Get most recent entries
    }
    
    res.json(lineage);
  } catch (error) {
    console.error("Failed to get decision lineage:", error);
    res.status(500).json({ error: "Failed to get lineage" });
  }
});

// Test signal classification without execution
router.post("/classify", async (req, res) => {
  try {
    const signal: Signal = req.body;
    const { tier } = req.query;
    const classification = Autonomy.classifyIssue(signal);
    const playbook = tier === '1' ?
      Autonomy.selectPlaybook({ classification }) :
      AutonomyTier2.selectPlaybook({ classification, signal });
    
    res.json({ 
      classification,
      playbook: playbook.name,
      steps: playbook.steps.length,
      successCriteria: playbook.successCriteria,
      tier: tier === '1' ? 1 : 2
    });
  } catch (error) {
    console.error("Failed to classify signal:", error);
    res.status(500).json({ error: "Failed to classify" });
  }
});

// Get autonomy configuration
router.get("/config", async (req, res) => {
  try {
    res.json({
      auto_remediate: process.env.AUTO_REMEDIATE === 'true',
      max_attempts: parseInt(process.env.AUTOREM_MAX_ATTEMPTS || '2'),
      slo_thresholds: {
        success: parseFloat(process.env.AUTOREM_SLO_SUCCESS || '0.94'),
        alignment: parseFloat(process.env.AUTOREM_SLO_ALIGN || '0.95'),
        backlog_minutes: parseInt(process.env.AUTOREM_SLO_BACKLOG_MIN || '15')
      },
      priority_order: (process.env.AUTOREM_PRIORITY || 'Revenue,Marketing,Content').split(','),
      budget_cap_daily_usd: parseInt(process.env.AUTOREM_BUDGET_CAP_DAILY_USD || '25')
    });
  } catch (error) {
    console.error("Failed to get autonomy config:", error);
    res.status(500).json({ error: "Failed to get config" });
  }
});

export { router as autonomyRouter };