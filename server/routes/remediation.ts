import { Router } from "express";
import { handleAgentSignal, getAgentState, getAllAgentStates, autoRemediate } from "../services/auto-remediation";
import type { AgentSignal } from "../services/auto-remediation";

const router = Router();

// Handle agent signals for auto-remediation
router.post("/signal", async (req, res) => {
  try {
    const signal: AgentSignal = req.body;
    
    if (!signal.agent || !signal.status) {
      return res.status(400).json({ error: "Missing required fields: agent, status" });
    }

    await handleAgentSignal(signal);
    
    res.json({ 
      success: true, 
      message: `Signal processed for ${signal.agent}`,
      agentState: getAgentState(signal.agent)
    });
  } catch (error) {
    console.error("Failed to handle agent signal:", error);
    res.status(500).json({ error: "Failed to process agent signal" });
  }
});

// Get agent remediation state
router.get("/state/:agent", async (req, res) => {
  try {
    const { agent } = req.params;
    const state = getAgentState(agent);
    
    res.json(state);
  } catch (error) {
    console.error("Failed to get agent state:", error);
    res.status(500).json({ error: "Failed to get agent state" });
  }
});

// Get all agent states
router.get("/states", async (req, res) => {
  try {
    const states = getAllAgentStates();
    res.json(states);
  } catch (error) {
    console.error("Failed to get all agent states:", error);
    res.status(500).json({ error: "Failed to get agent states" });
  }
});

// Trigger manual remediation
router.post("/trigger", async (req, res) => {
  try {
    const signal: AgentSignal = req.body;
    
    if (!signal.agent) {
      return res.status(400).json({ error: "Missing required field: agent" });
    }

    console.log(`MANUAL TRIGGER: Auto-remediation for ${signal.agent}`);
    const remediated = await autoRemediate(signal);
    
    res.json({ 
      success: remediated,
      message: remediated 
        ? `Successfully triggered remediation for ${signal.agent}` 
        : `Remediation not triggered for ${signal.agent}`,
      agentState: getAgentState(signal.agent)
    });
  } catch (error) {
    console.error("Failed to trigger remediation:", error);
    res.status(500).json({ error: "Failed to trigger remediation" });
  }
});

// Get remediation configuration
router.get("/config", async (req, res) => {
  try {
    const config = {
      AUTO_REMEDIATE: process.env.AUTO_REMEDIATE === 'true' || true,
      AUTOREM_MAX_ATTEMPTS: parseInt(process.env.AUTOREM_MAX_ATTEMPTS || '2'),
      AUTOREM_SLO_THRESHOLDS: {
        success_rate: parseFloat(process.env.REMEDIATION_THRESHOLD_PERFORMANCE || '90') / 100,
        alignment: parseFloat(process.env.REMEDIATION_THRESHOLD_PERFORMANCE || '90') / 100
      },
      AUTOREM_PRIORITY: (process.env.AUTOREM_PRIORITY || 'Revenue,Marketing,Content').split(',')
    };
    
    res.json(config);
  } catch (error) {
    console.error("Failed to get remediation config:", error);
    res.status(500).json({ error: "Failed to get config" });
  }
});

export { router as remediationRouter };