// Active Intervention API Routes
import { Router } from "express";
import { activeInterventionEngine } from "../services/active-intervention";

const router = Router();

// Get intervention dashboard data
router.get("/dashboard", (req, res) => {
  const stats = activeInterventionEngine.getInterventionStats();
  const history = Array.from(activeInterventionEngine.getInterventionHistory().entries()).map(([predictionId, actions]) => ({
    predictionId,
    actions: actions.map(action => ({
      id: action.id,
      action: action.action,
      status: action.status,
      executedAt: action.executedAt,
      impact: action.impact,
      result: action.result
    }))
  }));

  res.json({
    stats,
    recentInterventions: history.slice(-10), // Last 10 interventions
    systemStatus: {
      isActive: true,
      mode: "autonomous_intervention",
      lastScan: new Date().toISOString()
    }
  });
});

// Get real-time intervention stats
router.get("/stats", (req, res) => {
  const stats = activeInterventionEngine.getInterventionStats();
  res.json(stats);
});

// Get intervention history
router.get("/history", (req, res) => {
  const history = Array.from(activeInterventionEngine.getInterventionHistory().entries()).map(([predictionId, actions]) => ({
    predictionId,
    actions,
    totalActions: actions.length,
    completedActions: actions.filter(a => a.status === "completed").length,
    successRate: actions.length > 0 ? (actions.filter(a => a.status === "completed").length / actions.length) : 0
  }));

  res.json(history);
});

// Trigger manual intervention (for testing)
router.post("/trigger", async (req, res) => {
  const { predictionId, agents, actions } = req.body;
  
  try {
    // Simulate triggering an intervention
    console.log(`MANUAL_INTERVENTION: Triggered for prediction ${predictionId} with agents ${agents.join(", ")}`);
    
    res.json({
      success: true,
      message: "Manual intervention triggered",
      predictionId,
      agents,
      triggeredAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;