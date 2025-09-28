import { Router } from "express";
import { odarGovernance } from "../services/odar-governance";

const router = Router();

// ODAR Governance System Status
router.get("/status", (req, res) => {
  res.json({
    orchestrator: {
      is_running: false,
      config: {
        mode: "scheduled",
        runAt: "09:30",
        timezone: "UTC",
        enableEmailNotifications: true,
        dryRun: false
      },
      next_scheduled_run: "none",
      status: "idle"
    },
    policy: odarGovernance.getPolicy(),
    governance: "ODAR v1.0"
  });
});

// ODAR Observe Phase - Data Collection
router.get("/observe", async (req, res) => {
  try {
    const observation = await odarGovernance.observe();
    res.json(observation);
  } catch (error) {
    console.error("ODAR observe error:", error);
    res.status(500).json({ error: "Failed to perform ODAR observation" });
  }
});

// ODAR Diagnose Phase - AI Analysis
router.post("/diagnose", async (req, res) => {
  try {
    const { observation } = req.body;
    const diagnosis = await odarGovernance.diagnose(observation);
    res.json(diagnosis);
  } catch (error) {
    console.error("ODAR diagnose error:", error);
    res.status(500).json({ error: "Failed to perform ODAR diagnosis" });
  }
});

// ODAR Act Phase - Execute Directives
router.post("/act", async (req, res) => {
  try {
    const { diagnosis } = req.body;
    const action = await odarGovernance.act(diagnosis);
    res.json(action);
  } catch (error) {
    console.error("ODAR act error:", error);
    res.status(500).json({ error: "Failed to perform ODAR action" });
  }
});

// ODAR Review Phase - Performance Analysis
router.post("/review", async (req, res) => {
  try {
    const { actions } = req.body;
    const review = await odarGovernance.review(actions);
    res.json(review);
  } catch (error) {
    console.error("ODAR review error:", error);
    res.status(500).json({ error: "Failed to perform ODAR review" });
  }
});

// Get ODAR Policy Configuration
router.get("/policy", (req, res) => {
  res.json(odarGovernance.getPolicy());
});

export default router;