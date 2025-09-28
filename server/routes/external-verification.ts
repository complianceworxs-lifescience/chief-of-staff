// External System Verification Routes
// Provides endpoints that frontend can call to send learning events to GA4

import { Router } from "express";
import { learningIntegration } from "../services/learning-integration";

const router = Router();

// Endpoint for frontend to trigger GA4 tracking of learning events
router.post("/track-learning-event", (req, res) => {
  try {
    const { agent, strategy, outcome, confidence, timestamp } = req.body;
    
    if (!agent || !strategy || !outcome) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Log the external tracking request
    console.log(`🔍 EXTERNAL VERIFICATION REQUEST:`);
    console.log(`   Agent: ${agent}`);
    console.log(`   Strategy: ${strategy}`);
    console.log(`   Outcome: ${outcome}`);
    console.log(`   Confidence: ${confidence}%`);
    console.log(`   Ready for GA4 tracking: YES`);
    
    res.json({
      status: "ready_for_ga4_tracking",
      event_name: `ai_learning_${outcome}`,
      event_category: "ai_learning",
      event_label: strategy,
      custom_parameters: {
        agent,
        strategy,
        outcome,
        confidence,
        timestamp
      },
      ga4_ready: true
    });
  } catch (error) {
    console.error("External verification error:", error);
    res.status(500).json({ error: "Failed to prepare external tracking" });
  }
});

// Endpoint to get A/B test allocation data for GA4 traffic tracking
router.get("/ab-test-allocation/:testName", (req, res) => {
  try {
    const { testName } = req.params;
    const analytics = learningIntegration.getAnalytics();
    
    // Calculate current strategy allocation based on learning
    const strategies = Object.entries(analytics.strategy_effectiveness);
    const successRates = strategies.map(([name, data]) => ({
      strategy: name,
      success_rate: data.success_rate,
      usage: data.usage
    }));
    
    // Find the best and worst performing strategies for A/B comparison
    const bestStrategy = successRates.reduce((best, current) => 
      current.success_rate > best.success_rate ? current : best
    );
    const worstStrategy = successRates.reduce((worst, current) => 
      current.success_rate < worst.success_rate ? current : worst
    );
    
    // Calculate traffic allocation based on performance (exploitation)
    const totalSuccess = bestStrategy.success_rate + worstStrategy.success_rate;
    const bestAllocation = totalSuccess > 0 ? Math.round((bestStrategy.success_rate / totalSuccess) * 100) : 50;
    const worstAllocation = 100 - bestAllocation;
    
    console.log(`🔀 TRAFFIC ALLOCATION for GA4:`);
    console.log(`   Test: ${testName}`);
    console.log(`   ${bestStrategy.strategy}: ${bestAllocation}%`);
    console.log(`   ${worstStrategy.strategy}: ${worstAllocation}%`);
    console.log(`   Allocation shift: ${Math.abs(50 - bestAllocation)}% from equal split`);
    
    res.json({
      test_name: testName,
      variant_a: {
        strategy: bestStrategy.strategy,
        allocation: bestAllocation,
        success_rate: bestStrategy.success_rate
      },
      variant_b: {
        strategy: worstStrategy.strategy,
        allocation: worstAllocation,
        success_rate: worstStrategy.success_rate
      },
      learning_evidence: {
        traffic_shifted: Math.abs(50 - bestAllocation) > 10,
        shift_amount: Math.abs(50 - bestAllocation),
        reason: `Performance difference: ${bestStrategy.success_rate - worstStrategy.success_rate}`
      }
    });
  } catch (error) {
    console.error("A/B test allocation error:", error);
    res.status(500).json({ error: "Failed to get allocation data" });
  }
});

// Endpoint to get strategy evolution data for GA4 tracking
router.get("/strategy-evolution/:agent", (req, res) => {
  try {
    const { agent } = req.params;
    const recommendations = learningIntegration.getStrategyRecommendations(agent);
    
    // Show how strategy preferences evolved
    const topStrategy = recommendations[0];
    const worstStrategy = recommendations[recommendations.length - 1];
    
    console.log(`🎯 STRATEGY EVOLUTION for GA4:`);
    console.log(`   Agent: ${agent}`);
    console.log(`   Top Choice: ${topStrategy?.strategy} (${topStrategy?.expected_impact}% impact)`);
    console.log(`   Worst Choice: ${worstStrategy?.strategy} (${worstStrategy?.expected_impact}% impact)`);
    console.log(`   Performance Gap: ${(topStrategy?.expected_impact || 0) - (worstStrategy?.expected_impact || 0)}%`);
    
    res.json({
      agent,
      strategy_evolution: {
        preferred: topStrategy,
        avoided: worstStrategy,
        performance_gap: (topStrategy?.expected_impact || 0) - (worstStrategy?.expected_impact || 0),
        learning_confidence: topStrategy?.confidence || 'low'
      },
      ga4_tracking_data: {
        event_name: 'strategy_evolution',
        agent,
        preferred_strategy: topStrategy?.strategy,
        expected_impact: topStrategy?.expected_impact,
        confidence_level: topStrategy?.confidence
      }
    });
  } catch (error) {
    console.error("Strategy evolution error:", error);
    res.status(500).json({ error: "Failed to get evolution data" });
  }
});

export default router;