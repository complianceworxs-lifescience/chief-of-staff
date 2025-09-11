// Experiment Backlog System - A/B Testing and Conversion Optimization
// Always-be-testing framework for continuous improvement

import { storage } from '../storage.js';

// Active A/B Tests Configuration
export const ACTIVE_EXPERIMENTS = {
  "roi_cta_microcopy": {
    "experiment_id": "EXP_001_ROI_CTA",
    "status": "running",
    "start_date": "2025-09-01",
    "end_date": "2025-09-30", 
    "traffic_split": 50,
    "variants": {
      "control": {
        "cta_text": "Calculate your ROI",
        "description": "Standard CTA text",
        "traffic_percentage": 50
      },
      "variant_a": {
        "cta_text": "See your ROI in 60 seconds",
        "description": "Time-bound urgency microcopy",
        "traffic_percentage": 50
      }
    },
    "success_metrics": {
      "primary": "cta_click_rate",
      "secondary": ["time_on_page", "calculator_completion_rate"],
      "target_lift": 15,
      "confidence_threshold": 95
    },
    "current_results": {
      "control_performance": { "click_rate": 8.2, "completion_rate": 67.3 },
      "variant_performance": { "click_rate": 9.8, "completion_rate": 71.2 },
      "statistical_significance": 87.4,
      "estimated_winner": "variant_a",
      "days_running": 11
    }
  },
  "membership_tier_headlines": {
    "experiment_id": "EXP_002_TIER_HEADLINES", 
    "status": "running",
    "start_date": "2025-09-05",
    "end_date": "2025-10-05",
    "traffic_split": 33.33,
    "variants": {
      "control": {
        "headline": "Choose Your Compliance Plan",
        "description": "Generic membership selection",
        "traffic_percentage": 33.33
      },
      "variant_a": {
        "headline": "Unlock Your Career Growth Plan",
        "description": "Career-focused positioning",
        "traffic_percentage": 33.33
      },
      "variant_b": {
        "headline": "Get Your Personalized Success Blueprint",
        "description": "Personalization and outcome focus",
        "traffic_percentage": 33.34
      }
    },
    "success_metrics": {
      "primary": "membership_conversion_rate",
      "secondary": ["page_engagement", "plan_comparison_clicks"],
      "target_lift": 20,
      "confidence_threshold": 95
    },
    "current_results": {
      "control_performance": { "conversion_rate": 18.7, "engagement": 45.2 },
      "variant_a_performance": { "conversion_rate": 21.3, "engagement": 52.1 },
      "variant_b_performance": { "conversion_rate": 22.8, "engagement": 48.9 },
      "statistical_significance": 79.1,
      "estimated_winner": "variant_b",
      "days_running": 7
    }
  },
  "landing_page_format": {
    "experiment_id": "EXP_003_LANDING_FORMAT",
    "status": "running", 
    "start_date": "2025-09-08",
    "end_date": "2025-10-08",
    "traffic_split": 50,
    "variants": {
      "control": {
        "format": "text_first_layout",
        "description": "Traditional text-heavy landing page",
        "traffic_percentage": 50
      },
      "variant_a": {
        "format": "chart_first_layout",
        "description": "Visual ROI charts above the fold",
        "traffic_percentage": 50
      }
    },
    "success_metrics": {
      "primary": "overall_conversion_rate",
      "secondary": ["scroll_depth", "time_to_cta_click"],
      "target_lift": 12,
      "confidence_threshold": 95
    },
    "current_results": {
      "control_performance": { "conversion_rate": 16.2, "scroll_depth": 78.4 },
      "variant_performance": { "conversion_rate": 18.9, "scroll_depth": 83.7 },
      "statistical_significance": 71.8,
      "estimated_winner": "variant_a",
      "days_running": 4
    }
  },
  "roi_journey_timing": {
    "experiment_id": "EXP_004_JOURNEY_DELAY",
    "status": "running",
    "start_date": "2025-09-10", 
    "end_date": "2025-10-10",
    "traffic_split": 50,
    "variants": {
      "control": {
        "email_delay": "72_hours",
        "description": "Standard 3-day follow-up sequence",
        "traffic_percentage": 50
      },
      "variant_a": {
        "email_delay": "24_hours",
        "description": "Accelerated 1-day follow-up",
        "traffic_percentage": 50
      }
    },
    "success_metrics": {
      "primary": "email_to_membership_conversion",
      "secondary": ["email_open_rate", "unsubscribe_rate"],
      "target_lift": 8,
      "confidence_threshold": 95
    },
    "current_results": {
      "control_performance": { "conversion_rate": 12.4, "open_rate": 34.2 },
      "variant_performance": { "conversion_rate": 13.8, "open_rate": 37.1 },
      "statistical_significance": 23.7,
      "estimated_winner": "variant_a",
      "days_running": 2
    }
  },
  "mobile_cta_placement": {
    "experiment_id": "EXP_005_MOBILE_CTA",
    "status": "running",
    "start_date": "2025-09-11",
    "end_date": "2025-10-11", 
    "traffic_split": 50,
    "variants": {
      "control": {
        "cta_style": "standard_button",
        "description": "Regular mobile CTA button",
        "traffic_percentage": 50
      },
      "variant_a": {
        "cta_style": "sticky_bottom_bar",
        "description": "Persistent sticky CTA bar",
        "traffic_percentage": 50
      }
    },
    "success_metrics": {
      "primary": "mobile_conversion_rate",
      "secondary": ["cta_visibility_time", "user_scroll_behavior"],
      "target_lift": 25,
      "confidence_threshold": 95
    },
    "current_results": {
      "control_performance": { "conversion_rate": 9.3, "visibility": 67.2 },
      "variant_performance": { "conversion_rate": 10.1, "visibility": 89.4 },
      "statistical_significance": 12.1,
      "estimated_winner": "variant_a", 
      "days_running": 1
    }
  }
};

// Experiment Backlog Pipeline
export const EXPERIMENT_BACKLOG = {
  "next_quarter_tests": [
    {
      "test_name": "Persona Quiz Length Optimization",
      "hypothesis": "Shorter 5-question quiz will increase completion rate without reducing ROI calculation accuracy",
      "priority": "high",
      "expected_impact": "15-20% increase in quiz completion",
      "effort_estimate": "2 weeks",
      "success_metrics": ["quiz_completion_rate", "roi_accuracy_correlation"]
    },
    {
      "test_name": "Social Proof Placement Testing",
      "hypothesis": "Testimonials above ROI calculator will increase trust and calculation engagement",
      "priority": "medium",
      "expected_impact": "8-12% increase in calculator usage",
      "effort_estimate": "1 week",
      "success_metrics": ["calculator_start_rate", "calculation_completion_rate"]
    },
    {
      "test_name": "Pricing Display Optimization",
      "hypothesis": "Annual pricing option will increase customer lifetime value",
      "priority": "high",
      "expected_impact": "30% increase in annual subscriptions",
      "effort_estimate": "3 weeks",
      "success_metrics": ["annual_subscription_rate", "customer_lifetime_value"]
    },
    {
      "test_name": "Onboarding Sequence Optimization",
      "hypothesis": "Progressive feature introduction will improve activation rates",
      "priority": "medium",
      "expected_impact": "20% increase in 30-day retention",
      "effort_estimate": "4 weeks", 
      "success_metrics": ["feature_adoption_rate", "30_day_retention"]
    },
    {
      "test_name": "Exit Intent Popup Testing",
      "hypothesis": "ROI summary popup on exit intent will recover 10% of abandoning users",
      "priority": "low",
      "expected_impact": "5-10% reduction in abandonment",
      "effort_estimate": "1 week",
      "success_metrics": ["exit_conversion_rate", "session_extension_rate"]
    }
  ],
  "research_candidates": [
    "Persona-specific landing page designs",
    "Video testimonials vs written case studies",
    "Live chat vs automated help",
    "Multi-step vs single-page membership signup",
    "Freemium trial vs paid-only model"
  ]
};

// Experiment Management Framework
export const EXPERIMENT_MANAGEMENT = {
  "test_prioritization_matrix": {
    "scoring_criteria": {
      "potential_impact": { "weight": 40, "scale": "1-10" },
      "ease_of_implementation": { "weight": 25, "scale": "1-10" },
      "learning_value": { "weight": 20, "scale": "1-10" },
      "strategic_alignment": { "weight": 15, "scale": "1-10" }
    },
    "minimum_score_threshold": 6.5,
    "quarterly_test_capacity": 8
  },
  "test_lifecycle": {
    "ideation": {
      "requirements": ["hypothesis_statement", "success_metrics", "impact_estimate"],
      "approval_needed": "CMO"
    },
    "design": {
      "requirements": ["variant_specifications", "traffic_allocation", "duration_estimate"],
      "approval_needed": "CMO + CRO"
    },
    "implementation": {
      "requirements": ["technical_setup", "qa_testing", "analytics_configuration"],
      "approval_needed": "COO"
    },
    "monitoring": {
      "requirements": ["daily_performance_checks", "statistical_significance_tracking"],
      "escalation_threshold": "performance_degradation_above_5_percent"
    },
    "conclusion": {
      "requirements": ["results_analysis", "implementation_plan", "learning_documentation"],
      "approval_needed": "CEO"
    }
  },
  "success_criteria": {
    "minimum_sample_size": 1000,
    "minimum_test_duration": 7,
    "maximum_test_duration": 30,
    "confidence_threshold": 95,
    "practical_significance_threshold": 5
  }
};

export class ExperimentBacklogService {
  
  async getActiveExperiments(): Promise<any> {
    const experiments = Object.values(ACTIVE_EXPERIMENTS);
    
    // Calculate experiment health scores
    const experimentsWithHealth = experiments.map(exp => {
      const daysRunning = exp.current_results.days_running;
      const significance = exp.current_results.statistical_significance;
      
      let health_status = "healthy";
      if (daysRunning > 21 && significance < 80) {
        health_status = "needs_attention";
      } else if (daysRunning > 28) {
        health_status = "ready_to_conclude";
      }
      
      return {
        ...exp,
        health_status,
        days_remaining: Math.max(0, 30 - daysRunning),
        ready_for_decision: significance >= 95 && daysRunning >= 7
      };
    });
    
    return {
      active_count: experiments.length,
      experiments: experimentsWithHealth,
      requiring_attention: experimentsWithHealth.filter(e => e.health_status === "needs_attention").length,
      ready_for_conclusion: experimentsWithHealth.filter(e => e.ready_for_decision).length,
      average_significance: experiments.reduce((sum, exp) => sum + exp.current_results.statistical_significance, 0) / experiments.length
    };
  }
  
  async getExperimentBacklog(): Promise<any> {
    const backlog = EXPERIMENT_BACKLOG.next_quarter_tests;
    
    // Add priority scoring
    const scoredBacklog = backlog.map((test, index) => {
      const priorityScore = test.priority === "high" ? 9 : test.priority === "medium" ? 6 : 3;
      const impactScore = test.expected_impact.includes("20%") ? 8 : test.expected_impact.includes("15%") ? 7 : 5;
      const effortScore = test.effort_estimate.includes("1 week") ? 9 : test.effort_estimate.includes("2 weeks") ? 7 : 5;
      
      const totalScore = (priorityScore * 0.4) + (impactScore * 0.4) + (effortScore * 0.2);
      
      return {
        ...test,
        priority_score: totalScore,
        estimated_start_date: this.calculateStartDate(index),
        resource_requirements: test.effort_estimate
      };
    });
    
    // Sort by priority score
    scoredBacklog.sort((a, b) => b.priority_score - a.priority_score);
    
    return {
      total_tests: backlog.length,
      high_priority: backlog.filter(t => t.priority === "high").length,
      estimated_quarter_capacity: EXPERIMENT_MANAGEMENT.test_prioritization_matrix.quarterly_test_capacity,
      recommended_tests: scoredBacklog.slice(0, 3),
      full_backlog: scoredBacklog,
      research_candidates: EXPERIMENT_BACKLOG.research_candidates
    };
  }
  
  async createExperimentProposal(testDetails: any): Promise<any> {
    const proposalId = `PROP_${Date.now()}_${testDetails.name.replace(/\s+/g, '_').toUpperCase()}`;
    
    const proposal = {
      proposal_id: proposalId,
      created_at: new Date().toISOString(),
      test_name: testDetails.name,
      hypothesis: testDetails.hypothesis,
      variants: testDetails.variants,
      success_metrics: testDetails.success_metrics,
      estimated_impact: testDetails.estimated_impact,
      effort_estimate: testDetails.effort_estimate,
      priority: testDetails.priority,
      status: "awaiting_approval",
      approval_chain: ["CMO", "CRO"],
      technical_requirements: testDetails.technical_requirements || [],
      resource_needs: testDetails.resource_needs || []
    };
    
    // Store proposal
    await storage.createAgentCommunication({
      fromAgent: 'EXPERIMENT_SYSTEM',
      toAgent: 'CMO',
      content: `EXPERIMENT PROPOSAL: ${proposalId}`,
      type: 'experiment_proposal',
      action: 'review'
    });
    
    return proposal;
  }
  
  async updateExperimentResults(experimentId: string, newResults: any): Promise<any> {
    const experiment = ACTIVE_EXPERIMENTS[experimentId as keyof typeof ACTIVE_EXPERIMENTS];
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }
    
    // Update results
    const updatedExperiment = {
      ...experiment,
      current_results: {
        ...experiment.current_results,
        ...newResults,
        last_updated: new Date().toISOString()
      }
    };
    
    // Check if experiment is ready for conclusion
    const isSignificant = updatedExperiment.current_results.statistical_significance >= 95;
    const hasRunLongEnough = updatedExperiment.current_results.days_running >= 7;
    const readyForConclusion = isSignificant && hasRunLongEnough;
    
    if (readyForConclusion) {
      // Notify stakeholders
      await storage.createAgentCommunication({
        fromAgent: 'EXPERIMENT_SYSTEM',
        toAgent: 'CMO',
        content: `EXPERIMENT READY: ${experimentId} - Statistical significance reached`,
        type: 'experiment_conclusion',
        action: 'conclude'
      });
    }
    
    return {
      experiment_id: experimentId,
      updated_results: updatedExperiment.current_results,
      ready_for_conclusion: readyForConclusion,
      recommendations: this.generateExperimentRecommendations(updatedExperiment)
    };
  }
  
  private calculateStartDate(queuePosition: number): string {
    const today = new Date();
    const startDate = new Date(today.getTime() + (queuePosition * 14 * 24 * 60 * 60 * 1000)); // 2-week intervals
    return startDate.toISOString().split('T')[0];
  }
  
  private generateExperimentRecommendations(experiment: any): string[] {
    const recommendations: string[] = [];
    const results = experiment.current_results;
    
    if (results.statistical_significance >= 95) {
      recommendations.push(`Implement winning variant: ${results.estimated_winner}`);
    } else if (results.days_running > 21) {
      recommendations.push("Consider extending test duration or increasing traffic allocation");
    }
    
    if (results.statistical_significance < 50 && results.days_running > 14) {
      recommendations.push("Evaluate test setup - results may indicate no meaningful difference");
    }
    
    return recommendations;
  }
}