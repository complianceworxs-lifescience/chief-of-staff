import { Router } from "express";
import { learningIntegration } from "../services/learning-integration";

const router = Router();

// Learning Service Status
router.get("/status", (req, res) => {
  const analytics = learningIntegration.getAnalytics();
  res.json({
    service: "learning",
    version: "1.0.0",
    status: "active",
    features: [
      "Bandit Learning for Playbook Optimization",
      "Decision Lineage Tracking", 
      "Performance Feedback Loops",
      "Strategy Adaptation",
      "Cross-Agent Learning"
    ],
    bandit: {
      enabled: true,
      exploration_rate: 0.15,
      total_decisions: analytics.total_outcomes
    },
    learning_modes: {
      tier1: "Basic reinforcement",
      tier2: "Cost-aware bandit optimization", 
      tier3: "Multi-agent coordination learning"
    }
  });
});

// Get learning metrics and performance data
router.get("/metrics", (req, res) => {
  try {
    const { agent } = req.query;
    
    const analytics = learningIntegration.getAnalytics();
    const metrics = {
      decision_count: analytics.total_outcomes,
      success_rate: analytics.global_success_rate,
      agent_performance: analytics.agent_performance,
      strategy_effectiveness: analytics.strategy_effectiveness,
      learning_trends: analytics.learning_trends
    };
    
    if (agent && typeof agent === 'string') {
      const agentStatus = learningIntegration.getAgentLearningStatus(agent);
      metrics.agent_specific = agentStatus;
    }
    
    res.json(metrics);
  } catch (error) {
    console.error("Learning metrics error:", error);
    res.status(500).json({ error: "Failed to get learning metrics" });
  }
});

// Record learning outcome for strategy adaptation
router.post("/feedback", (req, res) => {
  try {
    const { agent, action, outcome, cost, impact } = req.body;
    
    if (!agent || !action || !outcome) {
      return res.status(400).json({ 
        error: "Missing required fields: agent, action, outcome" 
      });
    }
    
    // Record learning outcome using integration service
    const learningOutcome = {
      agent,
      strategy: action,
      outcome: outcome as 'success' | 'failure' | 'partial',
      cost: cost || 0,
      impact: impact || 0,
      confidence: impact || 50,
      timestamp: new Date().toISOString()
    };
    
    learningIntegration.recordOutcome(learningOutcome);
    
    console.log(`📚 Learning feedback recorded: ${agent} → ${action} → ${outcome}`);
    
    res.json({
      status: "recorded",
      agent,
      action,
      outcome,
      learning_update: outcome === 'success' ? "positive reinforcement" : "strategy adjustment",
      timestamp: learningOutcome.timestamp
    });
  } catch (error) {
    console.error("Learning feedback error:", error);
    res.status(500).json({ error: "Failed to record learning feedback" });
  }
});

// Get strategy recommendations based on learning
router.get("/recommendations", (req, res) => {
  try {
    const { agent } = req.query;
    
    if (!agent || typeof agent !== 'string') {
      return res.status(400).json({ error: "Agent parameter required" });
    }
    
    const strategyRecommendations = learningIntegration.getStrategyRecommendations(agent);
    const adaptation = learningIntegration.adaptAgentStrategies(agent, 'current_strategy');
    const analytics = learningIntegration.getAnalytics();
    
    const recommendations = {
      agent,
      optimal_strategies: strategyRecommendations,
      strategy_adaptation: adaptation,
      learning_insights: {
        total_decisions: analytics.total_outcomes,
        global_success_rate: analytics.global_success_rate,
        strategy_performance: analytics.strategy_effectiveness,
        learning_trends: analytics.learning_trends
      }
    };
    
    res.json(recommendations);
  } catch (error) {
    console.error("Learning recommendations error:", error);
    res.status(500).json({ error: "Failed to get learning recommendations" });
  }
});

// Reset learning state (for testing/debugging)
router.post("/reset", (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== true) {
      return res.status(400).json({ 
        error: "Must provide confirm: true to reset learning state" 
      });
    }
    
    // Reset bandit learning state
    AutonomyTier2.resetBanditState();
    
    res.json({ 
      success: true, 
      message: "Learning state reset successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Learning reset error:", error);
    res.status(500).json({ error: "Failed to reset learning state" });
  }
});

export default router;