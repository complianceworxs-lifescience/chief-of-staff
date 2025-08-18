// Tier 3 Coordination API Routes
import { Router } from "express";
import { AutonomyTier3, TIER3_CONFIG, coordinationSessions } from "../services/autonomy-tier3";

const router = Router();

// Tier 3 configuration and status
router.get("/config", (req, res) => {
  res.json({
    tier: 3,
    config: TIER3_CONFIG,
    features: [
      "Inter-agent coordination",
      "Conflict half-life optimization", 
      "Cooperation efficiency tracking",
      "Preventive coordination",
      "Cross-agent optimization",
      "Simulation harness"
    ],
    status: {
      enabled: TIER3_CONFIG.ENABLE_TIER_3,
      simulation_mode: TIER3_CONFIG.ENABLE_TIER_3_SIM,
      canary_agents: TIER3_CONFIG.CANARY_AGENTS
    }
  });
});

// Tier 3 KPIs with coordination metrics
router.get("/kpis", async (req, res) => {
  try {
    const kpis = AutonomyTier3.getTier3KPIMetrics();
    res.json(kpis);
  } catch (error) {
    console.error("Failed to get Tier 3 KPIs:", error);
    res.status(500).json({ error: "Failed to get Tier 3 KPIs" });
  }
});

// Active coordination sessions
router.get("/coordinations", (req, res) => {
  const sessions = Array.from(coordinationSessions.entries()).map(([id, session]) => ({
    id,
    ...session,
    duration: Date.now() - session.startTime
  }));
  
  res.json({
    total: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    sessions
  });
});

// Test coordination simulation
router.post("/test-coordination", async (req, res) => {
  try {
    const signal = req.body;
    const classification = AutonomyTier3.classifyIssue(signal);
    const playbook = AutonomyTier3.selectPlaybook({ classification, signal });
    
    res.json({
      tier: 3,
      classification,
      selected_playbook: playbook.name,
      coordination_required: classification === "COORDINATION",
      canary_eligible: TIER3_CONFIG.CANARY_AGENTS.includes(signal.agent),
      simulation_mode: TIER3_CONFIG.ENABLE_TIER_3_SIM,
      playbook_steps: playbook.steps.length,
      success_criteria: playbook.successCriteria
    });
  } catch (error) {
    console.error("Failed coordination test:", error);
    res.status(500).json({ error: "Failed coordination test" });
  }
});

// Manual coordination trigger
router.post("/coordinate", async (req, res) => {
  try {
    const { agents, conflictId, timeout = 30000 } = req.body;
    
    if (!agents || !Array.isArray(agents)) {
      return res.status(400).json({ error: "agents array required" });
    }
    
    // Start coordination session
    const sessionId = `manual_${Date.now()}`;
    coordinationSessions.set(sessionId, {
      agents,
      startTime: Date.now(),
      status: 'active',
      conflictId: conflictId || `manual_conflict_${Date.now()}`,
      metrics: {
        cooperationEfficiency: 0,
        coordinationTime: 0,
        resourcesSaved: 0
      }
    });
    
    res.json({
      success: true,
      sessionId,
      agents,
      message: `Coordination initiated between ${agents.join(', ')}`,
      timeout
    });
  } catch (error) {
    console.error("Failed to start coordination:", error);
    res.status(500).json({ error: "Failed to start coordination" });
  }
});

// Toggle Tier 3 modes
router.post("/toggle", async (req, res) => {
  try {
    const { mode, enabled } = req.body;
    
    switch (mode) {
      case 'simulation':
        process.env.ENABLE_TIER_3_SIM = enabled ? 'true' : 'false';
        TIER3_CONFIG.ENABLE_TIER_3_SIM = enabled;
        break;
      case 'canary':
        process.env.ENABLE_TIER_3 = enabled ? 'true' : 'false';
        TIER3_CONFIG.ENABLE_TIER_3 = enabled;
        break;
      default:
        return res.status(400).json({ error: "Invalid mode. Use 'simulation' or 'canary'" });
    }
    
    res.json({
      success: true,
      mode,
      enabled,
      current_config: {
        simulation: TIER3_CONFIG.ENABLE_TIER_3_SIM,
        canary: TIER3_CONFIG.ENABLE_TIER_3
      }
    });
  } catch (error) {
    console.error("Failed to toggle mode:", error);
    res.status(500).json({ error: "Failed to toggle mode" });
  }
});

export default router;