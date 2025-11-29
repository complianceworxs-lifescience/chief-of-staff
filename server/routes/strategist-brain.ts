/**
 * L6 STRATEGIST BRAIN API
 * 
 * Exposes the performance-driven hypothesis selection engine.
 * Enables data-driven content generation based on performance_ledger insights.
 */

import { Router } from "express";
import { strategistBrain } from "../services/optimization/strategist-brain";
import { llmAgentReasoning } from "../services/llm-agent-reasoning";

const router = Router();

/**
 * GET /api/strategist-brain/hypothesis/:persona
 * Get next content hypothesis for a persona using epsilon-greedy selection
 */
router.get("/hypothesis/:persona", async (req, res) => {
  try {
    const { persona } = req.params;
    
    if (!persona) {
      return res.status(400).json({ 
        success: false, 
        error: "Persona is required" 
      });
    }

    const hypothesis = await strategistBrain.getNextHypothesis(persona);
    
    return res.json({
      success: true,
      data: hypothesis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting hypothesis:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/strategist-brain/insights/:persona
 * Get performance insights and optimization opportunities
 */
router.get("/insights/:persona", async (req, res) => {
  try {
    const { persona } = req.params;
    
    if (!persona) {
      return res.status(400).json({ 
        success: false, 
        error: "Persona is required" 
      });
    }

    const insights = await strategistBrain.getPerformanceInsights(persona);
    
    return res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting insights:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/strategist-brain/vqs-constraints
 * Get current VQS governance constraints (read-only)
 */
router.get("/vqs-constraints", async (_req, res) => {
  try {
    const constraints = strategistBrain.getVQSConstraints();
    
    return res.json({
      success: true,
      data: constraints,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting VQS constraints:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/strategist-brain/approved-dimensions
 * Get all approved content dimensions (problem angles, metric focuses, etc.)
 */
router.get("/approved-dimensions", async (_req, res) => {
  try {
    const dimensions = strategistBrain.getApprovedDimensions();
    
    return res.json({
      success: true,
      data: dimensions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting approved dimensions:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/strategist-brain/exploration-log
 * Get recent exploration/exploitation decisions
 */
router.get("/exploration-log", async (_req, res) => {
  try {
    const log = strategistBrain.getExplorationLog();
    
    return res.json({
      success: true,
      data: log,
      count: log.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting exploration log:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/strategist-brain/generate-email/:persona
 * Complete flow: Get hypothesis → Generate optimized email → Return ready-to-send content
 * This is the key integration that closes the feedback loop.
 */
router.post("/generate-email/:persona", async (req, res) => {
  try {
    const { persona } = req.params;
    
    if (!persona) {
      return res.status(400).json({ 
        success: false, 
        error: "Persona is required" 
      });
    }

    console.log(`🧠 L6 BRAIN: Starting hypothesis-driven email generation for "${persona}"`);

    // Step 1: Get data-driven hypothesis from performance ledger
    const hypothesis = await strategistBrain.getNextHypothesis(persona);
    console.log(`   ✓ Hypothesis selected: ${hypothesis.id} (${hypothesis.explorationMode})`);

    // SAFETY CHECK: If governance-blocked, halt content generation
    if (!hypothesis.vqsCompliant || hypothesis.problemAngle === "GOVERNANCE_BLOCKED") {
      console.error(`   🚨 GOVERNANCE HALT: All content combinations frozen`);
      return res.status(503).json({
        success: false,
        error: "GOVERNANCE_BLOCKED",
        message: hypothesis.rationale,
        escalation: {
          frozenAngles: strategistBrain.getFrozenAngles().length,
          action: "Use /api/strategist-brain/unfreeze/:angleKey to restore combinations",
          status: "/api/strategist-brain/status for full system state",
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Step 2: Generate email using LLM with hypothesis directives
    const email = await llmAgentReasoning.generateHypothesisEmail({
      persona: hypothesis.persona,
      problemAngle: hypothesis.problemAngle,
      metricFocus: hypothesis.metricFocus,
      toneStyle: hypothesis.toneStyle,
      ctaType: hypothesis.ctaType,
      doctrine: hypothesis.doctrine,
      rationale: hypothesis.rationale,
    });
    console.log(`   ✓ Email generated: ${email.subject}`);

    return res.json({
      success: true,
      data: {
        hypothesis: {
          id: hypothesis.id,
          mode: hypothesis.explorationMode,
          score: hypothesis.score,
          confidence: hypothesis.confidence,
          problemAngle: hypothesis.problemAngle,
          metricFocus: hypothesis.metricFocus,
          toneStyle: hypothesis.toneStyle,
          ctaType: hypothesis.ctaType,
        },
        email: {
          subject: email.subject,
          preview: email.preview,
          body: email.body,
          cta: email.cta,
          ctaUrl: email.ctaUrl,
          hypothesisId: email.hypothesisId,
        },
        metadata: {
          persona,
          doctrine: hypothesis.doctrine,
          tokensUsed: email.tokensUsed,
          generatedAt: new Date().toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error generating hypothesis email:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/strategist-brain/frozen-angles
 * Get all frozen angles for human review (safety escalation)
 */
router.get("/frozen-angles", async (_req, res) => {
  try {
    const frozenAngles = strategistBrain.getFrozenAngles();
    const thresholds = strategistBrain.getSafetyThresholds();
    
    return res.json({
      success: true,
      data: {
        frozenAngles,
        count: frozenAngles.length,
        thresholds,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting frozen angles:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/strategist-brain/unfreeze/:angleKey
 * Manually unfreeze an angle (human intervention)
 */
router.post("/unfreeze/:angleKey", async (req, res) => {
  try {
    const { angleKey } = req.params;
    
    if (!angleKey) {
      return res.status(400).json({ 
        success: false, 
        error: "Angle key is required" 
      });
    }

    const unfrozen = strategistBrain.unfreezeAngle(angleKey);
    
    return res.json({
      success: unfrozen,
      message: unfrozen 
        ? `Angle "${angleKey}" has been unfrozen and is available for testing again.`
        : `Angle "${angleKey}" was not found in frozen list.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error unfreezing angle:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/strategist-brain/status
 * Get current brain status and summary
 */
router.get("/status", async (_req, res) => {
  try {
    const constraints = strategistBrain.getVQSConstraints();
    const dimensions = strategistBrain.getApprovedDimensions();
    const explorationLog = strategistBrain.getExplorationLog();
    const frozenAngles = strategistBrain.getFrozenAngles();
    
    const exploitCount = explorationLog.filter(l => l.mode === "exploit").length;
    const exploreCount = explorationLog.filter(l => l.mode === "explore").length;
    
    return res.json({
      success: true,
      data: {
        status: "OPERATIONAL",
        level: "L6",
        epsilon: 0.20,
        exploitExploreRatio: {
          exploit: exploitCount,
          explore: exploreCount,
          total: explorationLog.length,
        },
        safetyStatus: {
          frozenAngles: frozenAngles.length,
          status: frozenAngles.length === 0 ? "ALL_CLEAR" : "FROZEN_ANGLES_PRESENT",
        },
        vqsDoctrine: constraints.doctrine,
        approvedDimensions: {
          problemAngles: dimensions.problemAngles.length,
          metricFocuses: dimensions.metricFocuses.length,
          toneStyles: dimensions.toneStyles.length,
          ctaTypes: dimensions.ctaTypes.length,
        },
        lastActivity: explorationLog[explorationLog.length - 1]?.timestamp || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting brain status:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
