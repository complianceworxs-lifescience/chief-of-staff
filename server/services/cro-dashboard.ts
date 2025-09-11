// CRO Dashboard Pack - Revenue Synergy Dashboard and Funnel Metrics
// Complete revenue tracking system for ComplianceWorxs funnel

import { storage } from '../storage.js';

// Revenue Synergy Dashboard Configuration
export const REVENUE_SYNERGY_CONFIG = {
  "funnel_stages": {
    "awareness_tofu": {
      "stage": "Awareness (TOFU)",
      "assets": ["Free ELSA Playbooks", "Diagnostic Quiz"],
      "primary_cta": "Take the Diagnostic Quiz",
      "tracking_events": ["PageView", "QuizStarted", "QuizCompleted"],
      "conversion_metric": "quiz_completion_rate"
    },
    "quantify_mofu": {
      "stage": "Quantify & Justify (MOFU)", 
      "assets": ["ROI Calculator", "Persona-tailored outputs"],
      "primary_cta": "Use the ROI Calculator",
      "tracking_events": ["ROICalculatorStarted", "ROICalculated", "ROIShareAction"],
      "conversion_metric": "roi_calculation_rate"
    },
    "convert_bofu": {
      "stage": "Convert & Ascend (BOFU)",
      "assets": ["Membership Calculator", "Tier Landing Pages (RL/VS/CA)"],
      "primary_cta": "See your Membership fit",
      "tracking_events": ["MembershipCalculatorStarted", "MembershipRecommended", "TierPageVisit"],
      "conversion_metric": "membership_recommendation_rate"
    },
    "purchase_conversion": {
      "stage": "Purchase Conversion",
      "assets": ["Tier Landing Pages", "Checkout Flow"],
      "primary_cta": "Join your recommended tier",
      "tracking_events": ["CheckoutStarted", "MembershipPurchased", "PaymentCompleted"],
      "conversion_metric": "purchase_conversion_rate"
    },
    "expansion_ltv": {
      "stage": "Expansion (LTV)",
      "assets": ["Post-Purchase Journeys", "AI Agent Upsells"],
      "primary_cta": "Unlock AI Agent automation",
      "tracking_events": ["UpsellPresented", "UpsellPurchased", "FeatureActivated"],
      "conversion_metric": "upsell_conversion_rate"
    }
  },
  "revenue_kpis": {
    "funnel_velocity": {
      "quiz_to_roi": { "target_hours": 24, "threshold_hours": 72 },
      "roi_to_membership": { "target_hours": 48, "threshold_hours": 120 },
      "membership_to_purchase": { "target_hours": 168, "threshold_hours": 336 }, // 1 week target, 2 week threshold
      "purchase_to_upsell": { "target_hours": 120, "threshold_hours": 240 } // 5 day target, 10 day threshold
    },
    "conversion_thresholds": {
      "quiz_completion": { "target": 0.65, "red_line": 0.50 },
      "roi_calculation": { "target": 0.80, "red_line": 0.65 },
      "membership_recommendation": { "target": 0.75, "red_line": 0.60 },
      "purchase_conversion": { "target": 0.25, "red_line": 0.15 },
      "upsell_conversion": { "target": 0.35, "red_line": 0.20 }
    },
    "revenue_targets": {
      "monthly_recurring_revenue": { "target": 50000, "red_line": 35000 },
      "average_revenue_per_user": { "target": 300, "red_line": 200 },
      "customer_lifetime_value": { "target": 2400, "red_line": 1500 },
      "customer_acquisition_cost": { "target": 150, "threshold": 250 }
    }
  },
  "persona_breakdowns": {
    "rising_leader": {
      "tier": "RL",
      "monthly_price": 197,
      "target_conversion": 0.30,
      "red_line_conversion": 0.20,
      "primary_objections": ["time", "recognition", "budget"],
      "high_intent_signals": ["roi_value > 30000", "title contains 'manager|lead|director'"]
    },
    "validation_strategist": {
      "tier": "VS", 
      "monthly_price": 297,
      "target_conversion": 0.25,
      "red_line_conversion": 0.17,
      "primary_objections": ["efficiency", "time_savings", "team_adoption"],
      "high_intent_signals": ["roi_value > 50000", "industry in ['pharma', 'biotech', 'medical_device']"]
    },
    "compliance_architect": {
      "tier": "CA",
      "monthly_price": 497,
      "target_conversion": 0.20,
      "red_line_conversion": 0.12,
      "primary_objections": ["enterprise_readiness", "audit_requirements", "board_approval"],
      "high_intent_signals": ["roi_value > 100000", "company_size > 500", "title contains 'vp|director|chief'"]
    }
  }
};

// CTA Matrix - Asset × Persona → Forward Action
export const CTA_MATRIX = {
  "elsa_playbooks": {
    "rising_leader": {
      "primary_cta": "Calculate your recognition ROI",
      "secondary_cta": "Take the diagnostic quiz",
      "messaging": "Turn compliance wins into career advancement",
      "utm_campaign": "elsa_to_quiz_rl"
    },
    "validation_strategist": {
      "primary_cta": "Quantify your time savings",
      "secondary_cta": "Take the diagnostic quiz", 
      "messaging": "Compress validation cycles, reduce rework",
      "utm_campaign": "elsa_to_quiz_vs"
    },
    "compliance_architect": {
      "primary_cta": "Model your enterprise ROI",
      "secondary_cta": "Take the diagnostic quiz",
      "messaging": "Build the board-level business case",
      "utm_campaign": "elsa_to_quiz_ca"
    }
  },
  "diagnostic_quiz": {
    "rising_leader": {
      "primary_cta": "Calculate your career ROI",
      "secondary_cta": "See recognition opportunities",
      "messaging": "Your compliance impact in dollars and visibility",
      "utm_campaign": "quiz_to_roi_rl"
    },
    "validation_strategist": {
      "primary_cta": "Calculate your efficiency ROI", 
      "secondary_cta": "Model time savings",
      "messaging": "Your validation optimization potential",
      "utm_campaign": "quiz_to_roi_vs"
    },
    "compliance_architect": {
      "primary_cta": "Calculate your strategic ROI",
      "secondary_cta": "Build enterprise case",
      "messaging": "Your compliance architecture value",
      "utm_campaign": "quiz_to_roi_ca"
    }
  },
  "roi_calculator": {
    "rising_leader": {
      "primary_cta": "Get your Recognition Plan",
      "secondary_cta": "See membership options",
      "messaging": "Turn ${{ROI_VAL}} into career growth",
      "utm_campaign": "roi_to_membership_rl"
    },
    "validation_strategist": {
      "primary_cta": "Get your Efficiency Plan",
      "secondary_cta": "See membership options",
      "messaging": "Capture ${{ROI_VAL}} in time savings",
      "utm_campaign": "roi_to_membership_vs"
    },
    "compliance_architect": {
      "primary_cta": "Get your Enterprise Plan",
      "secondary_cta": "See membership options", 
      "messaging": "Architect ${{ROI_VAL}} in strategic value",
      "utm_campaign": "roi_to_membership_ca"
    }
  }
};

// Funnel Velocity Tracking
export const FUNNEL_VELOCITY_TRACKER = {
  "stage_transitions": [
    { "from": "quiz_completed", "to": "roi_started", "target_hours": 24, "threshold_hours": 72 },
    { "from": "roi_calculated", "to": "membership_recommended", "target_hours": 1, "threshold_hours": 24 },
    { "from": "membership_recommended", "to": "tier_page_visit", "target_hours": 48, "threshold_hours": 120 },
    { "from": "tier_page_visit", "to": "checkout_started", "target_hours": 72, "threshold_hours": 168 },
    { "from": "checkout_started", "to": "membership_purchased", "target_hours": 1, "threshold_hours": 24 },
    { "from": "membership_purchased", "to": "upsell_presented", "target_hours": 120, "threshold_hours": 240 }
  ],
  "velocity_alerts": {
    "slow_progression": "User stalled at {{stage}} for {{hours}}h (threshold: {{threshold}}h)",
    "fast_track_eligible": "High-intent user ({{signals}}) ready for acceleration",
    "conversion_risk": "{{stage}} conversion below red-line: {{current}}% vs {{threshold}}%"
  }
};

// Weekly Synergy Report Template
export const WEEKLY_SYNERGY_REPORT_TEMPLATE = {
  "report_structure": {
    "executive_summary": {
      "revenue_performance": "MRR: ${{mrr}} ({{mrr_change}}% vs last week)",
      "funnel_health": "Overall conversion: {{overall_conversion}}% ({{conversion_change}}% vs last week)",
      "velocity_summary": "Avg time to purchase: {{avg_time_to_purchase}} days",
      "red_line_alerts": "{{red_line_count}} metrics below threshold"
    },
    "funnel_performance": {
      "quiz_to_roi": "{{quiz_to_roi}}% ({{quiz_to_roi_change}}%)",
      "roi_to_membership": "{{roi_to_membership}}% ({{roi_to_membership_change}}%)", 
      "membership_to_purchase": "{{membership_to_purchase}}% ({{membership_to_purchase_change}}%)",
      "purchase_to_upsell": "{{purchase_to_upsell}}% ({{purchase_to_upsell_change}}%)"
    },
    "persona_breakdown": {
      "rising_leader": {
        "conversion": "{{rl_conversion}}%",
        "revenue": "${{rl_revenue}}",
        "velocity": "{{rl_velocity}} days"
      },
      "validation_strategist": {
        "conversion": "{{vs_conversion}}%", 
        "revenue": "${{vs_revenue}}",
        "velocity": "{{vs_velocity}} days"
      },
      "compliance_architect": {
        "conversion": "{{ca_conversion}}%",
        "revenue": "${{ca_revenue}}",
        "velocity": "{{ca_velocity}} days"
      }
    },
    "agent_health": {
      "coo_automation": {
        "event_fire_rate": "{{event_fire_rate}}%",
        "journey_entry_success": "{{journey_entry_success}}%",
        "email_trigger_latency": "{{email_trigger_latency}}s"
      },
      "cmo_messaging": {
        "cta_click_rates": "{{cta_click_rates}}%",
        "message_consistency": "{{message_consistency}}%",
        "landing_page_performance": "{{landing_page_performance}}%"
      },
      "cro_tracking": {
        "attribution_accuracy": "{{attribution_accuracy}}%",
        "data_completeness": "{{data_completeness}}%",
        "dashboard_uptime": "{{dashboard_uptime}}%"
      }
    },
    "experiment_status": {
      "active_tests": [
        "ROI CTA microcopy: {{roi_cta_test_status}}",
        "Membership tier page headlines: {{tier_headline_test_status}}",
        "Chart-first vs text-first landing: {{landing_format_test_status}}",
        "24h vs 72h ROI journey delay: {{journey_delay_test_status}}",
        "Sticky mobile CTA vs standard: {{mobile_cta_test_status}}"
      ],
      "completed_tests": "{{completed_tests_count}} tests completed this week",
      "test_backlog": "{{test_backlog_count}} tests in backlog"
    },
    "escalations": {
      "red_line_breaches": "{{red_line_breaches}}",
      "ceo_action_items": "{{ceo_action_items}}",
      "incident_count": "{{incident_count}}"
    }
  }
};

// Guardrails and Alert System
export const GUARDRAILS_SYSTEM = {
  "red_line_thresholds": {
    "funnel_conversion": {
      "quiz_completion_rate": 0.50,
      "roi_calculation_rate": 0.65, 
      "membership_recommendation_rate": 0.60,
      "purchase_conversion_rate": 0.15,
      "upsell_conversion_rate": 0.20
    },
    "velocity_thresholds": {
      "quiz_to_roi_hours": 72,
      "roi_to_membership_hours": 120,
      "membership_to_purchase_hours": 336,
      "purchase_to_upsell_hours": 240
    },
    "revenue_thresholds": {
      "weekly_mrr_decline": 0.15, // 15% decline triggers alert
      "daily_revenue_decline": 0.25, // 25% day-over-day decline
      "persona_revenue_imbalance": 0.40 // One persona >40% below others
    }
  },
  "alert_protocols": {
    "immediate_escalation": {
      "trigger": "Any red-line breach",
      "recipient": "CEO Agent",
      "action_required": "One-page fix plan within 24 hours",
      "escalation_path": "CEO Agent → Founder if not resolved in 48h"
    },
    "weekly_review": {
      "trigger": "Weekly synergy report generation",
      "recipients": ["CEO Agent", "CRO Agent", "CMO Agent", "COO Agent", "CCO Agent"],
      "action_required": "Review and acknowledge weekly performance"
    },
    "experiment_alerts": {
      "trigger": "A/B test significance reached or performance degradation",
      "recipient": "CMO Agent",
      "action_required": "Implement winning variant or pause losing test"
    }
  }
};

// High-Intent Fast Lane Configuration
export const HIGH_INTENT_FAST_LANE = {
  "qualification_criteria": {
    "roi_value_threshold": 100000,
    "persona_priority": ["CA", "VS", "RL"],
    "company_size_threshold": 500,
    "title_indicators": ["VP", "Director", "Chief", "Head of", "Manager"],
    "industry_priority": ["Pharmaceutical", "Biotechnology", "Medical Device", "CRO", "CMO"]
  },
  "accelerated_flow": {
    "reduced_delays": {
      "roi_to_membership": "2 hours instead of 48 hours",
      "membership_to_offer": "12 hours instead of 72 hours",
      "offer_to_objection": "24 hours instead of 96 hours"
    },
    "enhanced_proof": {
      "social_proof": "Enterprise testimonials",
      "roi_validation": "Third-party audit results",
      "urgency_messaging": "Limited enterprise slots available"
    },
    "white_glove_treatment": {
      "personal_outreach": "Direct CEO introduction within 48h",
      "custom_demo": "Personalized ROI demonstration",
      "dedicated_support": "Enterprise onboarding specialist"
    }
  }
};

export class CRODashboardService {
  
  async generateRevenueSynergReport(): Promise<any> {
    // Simulate funnel metrics - in production would query actual analytics
    const funnelMetrics = {
      quiz_completion_rate: 58.2, // Below red-line of 50%
      roi_calculation_rate: 72.1,
      membership_recommendation_rate: 68.4,
      purchase_conversion_rate: 18.7,
      upsell_conversion_rate: 24.3
    };
    
    const velocityMetrics = {
      avg_quiz_to_roi_hours: 31.2,
      avg_roi_to_membership_hours: 18.4,
      avg_membership_to_purchase_hours: 156.8,
      avg_purchase_to_upsell_hours: 128.6
    };
    
    const revenueMetrics = {
      weekly_mrr: 42650,
      mrr_change: -8.2, // Red-line breach
      avg_revenue_per_user: 287,
      customer_acquisition_cost: 178
    };
    
    const personaBreakdown = {
      rising_leader: { conversion: 22.1, revenue: 12840, velocity: 6.2 },
      validation_strategist: { conversion: 19.8, revenue: 15730, velocity: 5.8 },
      compliance_architect: { conversion: 14.2, revenue: 14080, velocity: 8.1 }
    };
    
    // Check for red-line breaches
    const redLineBreaches = this.checkRedLineBreaches(funnelMetrics, revenueMetrics);
    
    return {
      generated_at: new Date().toISOString(),
      executive_summary: {
        overall_health: "⚠️ ATTENTION REQUIRED",
        red_line_breaches: redLineBreaches.length,
        primary_concerns: redLineBreaches
      },
      funnel_performance: funnelMetrics,
      velocity_metrics: velocityMetrics,
      revenue_metrics: revenueMetrics,
      persona_breakdown: personaBreakdown,
      recommendations: this.generateRecommendations(redLineBreaches),
      next_actions: this.generateActionItems(redLineBreaches)
    };
  }
  
  private checkRedLineBreaches(funnelMetrics: any, revenueMetrics: any): string[] {
    const breaches: string[] = [];
    const thresholds = GUARDRAILS_SYSTEM.red_line_thresholds;
    
    if (funnelMetrics.quiz_completion_rate < thresholds.funnel_conversion.quiz_completion_rate * 100) {
      breaches.push(`Quiz completion rate: ${funnelMetrics.quiz_completion_rate}% (threshold: ${thresholds.funnel_conversion.quiz_completion_rate * 100}%)`);
    }
    
    if (revenueMetrics.mrr_change < -thresholds.revenue_thresholds.weekly_mrr_decline * 100) {
      breaches.push(`MRR decline: ${revenueMetrics.mrr_change}% (threshold: -${thresholds.revenue_thresholds.weekly_mrr_decline * 100}%)`);
    }
    
    return breaches;
  }
  
  private generateRecommendations(breaches: string[]): string[] {
    const recommendations: string[] = [];
    
    breaches.forEach(breach => {
      if (breach.includes('Quiz completion')) {
        recommendations.push("Optimize quiz introduction copy and reduce perceived time commitment");
        recommendations.push("A/B test quiz CTA positioning and messaging");
      }
      if (breach.includes('MRR decline')) {
        recommendations.push("Accelerate high-intent prospects through fast lane");
        recommendations.push("Increase proof elements on tier landing pages");
      }
    });
    
    return recommendations;
  }
  
  private generateActionItems(breaches: string[]): string[] {
    const actions: string[] = [];
    
    if (breaches.length > 0) {
      actions.push("CEO Agent: Create one-page fix plan within 24 hours");
      actions.push("CMO Agent: Review messaging consistency across funnel");
      actions.push("COO Agent: Verify automation health and email delivery");
    }
    
    return actions;
  }
  
  async trackFunnelEvent(event: string, properties: any): Promise<void> {
    // In production: send to analytics platform
    console.log(`📊 CRO: Tracking funnel event - ${event}`, properties);
    
    // Store for funnel analysis
    await storage.createAgentCommunication({
      fromAgent: 'CRO',
      toAgent: 'SYSTEM',
      content: `Funnel event: ${event}`,
      type: 'tracking',
      action: 'track'
    });
  }
  
  async getPersonaPerformance(persona: string): Promise<any> {
    const config = REVENUE_SYNERGY_CONFIG.persona_breakdowns[persona as keyof typeof REVENUE_SYNERGY_CONFIG.persona_breakdowns];
    
    if (!config) {
      throw new Error(`Unknown persona: ${persona}`);
    }
    
    // Simulate persona-specific metrics
    return {
      persona,
      monthly_price: config.monthly_price,
      current_conversion: config.target_conversion * 0.85, // 85% of target
      target_conversion: config.target_conversion,
      red_line_conversion: config.red_line_conversion,
      primary_objections: config.primary_objections,
      high_intent_signals: config.high_intent_signals,
      recommendations: this.getPersonaRecommendations(persona, config)
    };
  }
  
  private getPersonaRecommendations(persona: string, config: any): string[] {
    const recommendations: string[] = [];
    
    if (persona === 'rising_leader') {
      recommendations.push("Emphasize recognition and visibility messaging");
      recommendations.push("Add career advancement testimonials");
    } else if (persona === 'validation_strategist') {
      recommendations.push("Focus on time savings and efficiency metrics");
      recommendations.push("Include cycle time reduction case studies");
    } else if (persona === 'compliance_architect') {
      recommendations.push("Highlight enterprise features and board-level reporting");
      recommendations.push("Add audit readiness and regulatory compliance proof");
    }
    
    return recommendations;
  }
}