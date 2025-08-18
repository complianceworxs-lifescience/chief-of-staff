import { Router } from "express";
import { AutonomyTier2, TIER2_CONFIG } from "../services/autonomy-tier2";

const router = Router();

// Tier 2 specific routes

// Global concurrency rebalancer endpoint
router.post("/rebalance", async (req, res) => {
  try {
    const { slaMin = TIER2_CONFIG.QUEUE_SLA_MIN, roiFloor = TIER2_CONFIG.ROI_FLOOR } = req.body;
    
    await AutonomyTier2.rebalanceConcurrency({ slaMin, roiFloor });
    
    res.json({ 
      success: true, 
      message: "Concurrency rebalanced",
      slaMin,
      roiFloor
    });
  } catch (error) {
    console.error("Failed to rebalance concurrency:", error);
    res.status(500).json({ error: "Failed to rebalance" });
  }
});

// Get Tier 2 configuration
router.get("/config", (req, res) => {
  res.json({
    tier: 2,
    config: TIER2_CONFIG,
    features: [
      "Cost-aware playbook selection",
      "Dynamic resource orchestration", 
      "Data freshness contracts",
      "Bandit learning for playbook optimization",
      "Risk-gated HITL escalation"
    ]
  });
});

// Tier 2 KPIs with advanced metrics
router.get("/kpis", async (req, res) => {
  try {
    const kpis = AutonomyTier2.getTier2KPIMetrics();
    res.json(kpis);
  } catch (error) {
    console.error("Failed to get Tier 2 KPIs:", error);
    res.status(500).json({ error: "Failed to get Tier 2 KPIs" });
  }
});

// Test cost-aware playbook selection
router.post("/test-cost-aware", async (req, res) => {
  try {
    const signal = req.body;
    const classification = AutonomyTier2.classifyIssue(signal);
    const playbook = AutonomyTier2.selectPlaybook({ classification, signal });
    
    res.json({
      tier: 2,
      classification,
      selected_playbook: playbook.name,
      selection_method: "Expected Utility (Cost-Aware)",
      playbook_steps: playbook.steps.length,
      success_criteria: playbook.successCriteria
    });
  } catch (error) {
    console.error("Failed cost-aware test:", error);
    res.status(500).json({ error: "Failed cost-aware test" });
  }
});

export default router;