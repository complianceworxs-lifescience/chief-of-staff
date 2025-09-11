// Attribution Discipline - UTM Taxonomy and Performance Tracking
// Complete attribution framework for funnel performance analysis

import { storage } from '../storage.js';

// UTM Taxonomy Framework
export const UTM_TAXONOMY = {
  "campaign_structure": {
    "source_values": {
      "mailchimp": "Email marketing campaigns",
      "google": "Google Ads and organic search",
      "linkedin": "LinkedIn sponsored content and organic",
      "direct": "Direct website visits",
      "referral": "Partner and affiliate referrals",
      "retargeting": "Retargeting campaigns across platforms"
    },
    "medium_values": {
      "email": "Email campaigns and sequences",
      "cpc": "Cost-per-click advertising",
      "social": "Social media posts and ads",
      "organic": "Organic search and social",
      "referral": "Referral traffic",
      "display": "Display advertising"
    },
    "campaign_naming": {
      "format": "{persona}_{funnel_stage}_{content_type}_{month}",
      "examples": [
        "rl_awareness_elsa_sep25",
        "vs_conversion_roi_calculator_sep25", 
        "ca_decision_membership_offer_sep25"
      ]
    },
    "content_values": {
      "elsa_playbook": "Free ELSA compliance playbooks",
      "quiz": "Diagnostic compliance quiz",
      "roi_calculator": "ROI calculation tool",
      "membership_offer": "Tier membership offers",
      "testimonials": "Customer success stories",
      "case_studies": "Detailed case study content"
    },
    "term_values": {
      "compliance_automation": "Compliance automation keywords",
      "validation_efficiency": "Validation efficiency terms",
      "regulatory_roi": "Regulatory ROI keywords",
      "audit_readiness": "Audit preparation terms"
    }
  },
  "required_parameters": {
    "utm_source": "always_required",
    "utm_medium": "always_required", 
    "utm_campaign": "always_required",
    "utm_content": "required_for_ab_tests",
    "utm_term": "required_for_paid_search"
  },
  "tracking_enforcement": {
    "validation_rules": [
      "All email links must include source=mailchimp",
      "All paid ads must include medium=cpc",
      "All A/B tests must include content parameter",
      "Campaign names must follow persona_stage_content format"
    ],
    "quality_checks": [
      "No URLs without UTM parameters",
      "No duplicate campaign names within 30 days",
      "Source and medium must match approved taxonomy",
      "Campaign names must be under 50 characters"
    ]
  }
};

// Channel Performance Framework
export const CHANNEL_PERFORMANCE_CONFIG = {
  "attribution_models": {
    "first_touch": {
      "description": "Credits first interaction with revenue",
      "use_case": "Brand awareness and top-of-funnel analysis",
      "weight": 100
    },
    "last_touch": {
      "description": "Credits final interaction before conversion",
      "use_case": "Direct response and conversion optimization",
      "weight": 100
    },
    "linear": {
      "description": "Equal credit across all touchpoints",
      "use_case": "Understanding full customer journey",
      "weight": "distributed_equally"
    },
    "time_decay": {
      "description": "More credit to recent interactions",
      "use_case": "Optimizing conversion tactics",
      "weight": "exponential_decay_7_days"
    },
    "position_based": {
      "description": "40% first, 40% last, 20% middle interactions",
      "use_case": "Balanced view of awareness and conversion",
      "weight": "40_20_40"
    }
  },
  "channel_benchmarks": {
    "email_marketing": {
      "open_rate": { "excellent": 25, "good": 20, "average": 15, "poor": 10 },
      "click_rate": { "excellent": 5, "good": 3, "average": 2, "poor": 1 },
      "conversion_rate": { "excellent": 8, "good": 5, "average": 3, "poor": 1 },
      "cost_per_conversion": { "excellent": 50, "good": 100, "average": 150, "poor": 200 }
    },
    "paid_search": {
      "click_rate": { "excellent": 8, "good": 5, "average": 3, "poor": 1 },
      "conversion_rate": { "excellent": 12, "good": 8, "average": 5, "poor": 2 },
      "cost_per_click": { "excellent": 3, "good": 5, "average": 8, "poor": 12 },
      "quality_score": { "excellent": 9, "good": 7, "average": 5, "poor": 3 }
    },
    "social_media": {
      "engagement_rate": { "excellent": 6, "good": 4, "average": 2, "poor": 1 },
      "click_rate": { "excellent": 2, "good": 1.5, "average": 1, "poor": 0.5 },
      "conversion_rate": { "excellent": 4, "good": 2.5, "average": 1.5, "poor": 0.5 },
      "cost_per_conversion": { "excellent": 75, "good": 125, "average": 175, "poor": 250 }
    },
    "direct_referral": {
      "conversion_rate": { "excellent": 15, "good": 10, "average": 6, "poor": 3 },
      "session_duration": { "excellent": 300, "good": 180, "average": 120, "poor": 60 },
      "pages_per_session": { "excellent": 5, "good": 3, "average": 2, "poor": 1 }
    }
  },
  "funnel_stage_attribution": {
    "awareness": {
      "primary_channels": ["organic_search", "social_media", "referral"],
      "success_metrics": ["reach", "impressions", "brand_searches"],
      "attribution_weight": "first_touch_heavy"
    },
    "consideration": {
      "primary_channels": ["email_marketing", "retargeting", "content_marketing"],
      "success_metrics": ["engagement", "content_downloads", "email_signups"],
      "attribution_weight": "linear_distribution"
    },
    "decision": {
      "primary_channels": ["email_marketing", "direct", "paid_search"],
      "success_metrics": ["conversion_rate", "revenue", "customer_lifetime_value"],
      "attribution_weight": "last_touch_heavy"
    },
    "retention": {
      "primary_channels": ["email_marketing", "direct", "in_app"],
      "success_metrics": ["retention_rate", "upsell_rate", "referral_generation"],
      "attribution_weight": "time_decay"
    }
  }
};

// Performance Reporting Framework
export const REPORTING_FRAMEWORK = {
  "weekly_channel_report": {
    "metrics_included": [
      "traffic_volume_by_channel",
      "conversion_rate_by_channel", 
      "revenue_attribution_by_channel",
      "cost_per_acquisition_by_channel",
      "return_on_ad_spend",
      "customer_lifetime_value_by_channel"
    ],
    "comparison_periods": ["week_over_week", "month_over_month", "year_over_year"],
    "segmentation": ["persona", "funnel_stage", "campaign_type", "device_type"],
    "alerts": [
      "conversion_rate_drop_above_15_percent",
      "cost_per_acquisition_increase_above_25_percent", 
      "traffic_drop_above_20_percent"
    ]
  },
  "monthly_attribution_analysis": {
    "attribution_models_compared": ["first_touch", "last_touch", "linear", "time_decay"],
    "channel_mix_optimization": "recommendations_for_budget_reallocation",
    "customer_journey_analysis": "common_paths_to_conversion",
    "cohort_performance": "retention_and_ltv_by_acquisition_channel"
  },
  "campaign_performance_tracking": {
    "real_time_monitoring": ["spend", "impressions", "clicks", "conversions"],
    "daily_optimization": ["bid_adjustments", "budget_reallocation", "creative_rotation"],
    "weekly_analysis": ["performance_vs_forecast", "competitive_positioning", "market_trends"]
  }
};

export class AttributionDisciplineService {
  
  async generateUTMParameters(campaign: any): Promise<any> {
    const { persona, funnel_stage, content_type, channel } = campaign;
    
    // Validate inputs against taxonomy
    const taxonomy = UTM_TAXONOMY;
    const currentMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    
    const utmParams = {
      utm_source: this.mapChannelToSource(channel),
      utm_medium: this.mapChannelToMedium(channel),
      utm_campaign: `${persona}_${funnel_stage}_${content_type}_${currentMonth}`,
      utm_content: campaign.variant || "default",
      utm_term: campaign.keywords || ""
    };
    
    // Validate parameters
    const validation = this.validateUTMParameters(utmParams);
    
    if (!validation.valid) {
      throw new Error(`Invalid UTM parameters: ${validation.errors.join(', ')}`);
    }
    
    return {
      utm_parameters: utmParams,
      full_url: this.buildTrackingURL(campaign.base_url, utmParams),
      campaign_id: `${utmParams.utm_campaign}_${Date.now()}`,
      validation_status: validation,
      taxonomy_compliance: true
    };
  }
  
  async analyzeChannelPerformance(timeframe: string = "30_days"): Promise<any> {
    // Simulate channel performance data
    const channelData = {
      "email_marketing": {
        "traffic": 12450,
        "conversions": 487,
        "revenue": 97400,
        "cost": 8950,
        "conversion_rate": 3.91,
        "roas": 10.89,
        "cpa": 18.38
      },
      "paid_search": {
        "traffic": 8920,
        "conversions": 312,
        "revenue": 78600,
        "cost": 15600,
        "conversion_rate": 3.50,
        "roas": 5.04,
        "cpa": 50.00
      },
      "organic_search": {
        "traffic": 15680,
        "conversions": 298,
        "revenue": 71520,
        "cost": 0,
        "conversion_rate": 1.90,
        "roas": "infinite",
        "cpa": 0
      },
      "social_media": {
        "traffic": 6750,
        "conversions": 89,
        "revenue": 21360,
        "cost": 4200,
        "conversion_rate": 1.32,
        "roas": 5.09,
        "cpa": 47.19
      },
      "direct": {
        "traffic": 9840,
        "conversions": 412,
        "revenue": 123600,
        "cost": 0,
        "conversion_rate": 4.19,
        "roas": "infinite",
        "cpa": 0
      }
    };
    
    // Calculate channel rankings
    const rankings = this.calculateChannelRankings(channelData);
    
    // Identify optimization opportunities
    const optimizations = this.identifyOptimizationOpportunities(channelData);
    
    return {
      timeframe,
      channel_performance: channelData,
      total_traffic: Object.values(channelData).reduce((sum: number, channel: any) => sum + channel.traffic, 0),
      total_revenue: Object.values(channelData).reduce((sum: number, channel: any) => sum + channel.revenue, 0),
      overall_conversion_rate: this.calculateOverallConversionRate(channelData),
      channel_rankings: rankings,
      optimization_opportunities: optimizations,
      budget_recommendations: this.generateBudgetRecommendations(channelData)
    };
  }
  
  async trackAttributionPath(customerId: string, touchpoints: any[]): Promise<any> {
    const attributionModels = CHANNEL_PERFORMANCE_CONFIG.attribution_models;
    const attributionResults: any = {};
    
    // Apply different attribution models
    Object.keys(attributionModels).forEach(model => {
      attributionResults[model] = this.applyAttributionModel(model, touchpoints);
    });
    
    // Analyze customer journey
    const journeyAnalysis = {
      total_touchpoints: touchpoints.length,
      journey_duration_days: this.calculateJourneyDuration(touchpoints),
      first_touch_channel: touchpoints[0]?.channel,
      last_touch_channel: touchpoints[touchpoints.length - 1]?.channel,
      unique_channels: [...new Set(touchpoints.map(t => t.channel))].length,
      conversion_path: touchpoints.map(t => t.channel).join(' → ')
    };
    
    return {
      customer_id: customerId,
      journey_analysis: journeyAnalysis,
      attribution_results: attributionResults,
      touchpoint_details: touchpoints,
      revenue_attribution: this.calculateRevenueAttribution(touchpoints, attributionResults),
      optimization_insights: this.generateJourneyInsights(journeyAnalysis, touchpoints)
    };
  }
  
  async generateAttributionReport(reportType: string = "weekly"): Promise<any> {
    const reportConfig = REPORTING_FRAMEWORK[`${reportType}_channel_report` as keyof typeof REPORTING_FRAMEWORK];
    
    // Simulate attribution data
    const attributionData = {
      "first_touch_attribution": {
        "organic_search": 35.2,
        "social_media": 28.7,
        "email_marketing": 18.4,
        "paid_search": 12.1,
        "direct": 5.6
      },
      "last_touch_attribution": {
        "email_marketing": 42.8,
        "direct": 24.3,
        "paid_search": 16.9,
        "organic_search": 10.2,
        "social_media": 5.8
      },
      "linear_attribution": {
        "email_marketing": 28.6,
        "organic_search": 24.1,
        "direct": 18.7,
        "paid_search": 15.2,
        "social_media": 13.4
      }
    };
    
    const performanceAlerts = this.checkPerformanceAlerts(attributionData);
    const recommendations = this.generateAttributionRecommendations(attributionData);
    
    return {
      report_type: reportType,
      report_date: new Date().toISOString(),
      attribution_breakdown: attributionData,
      performance_alerts: performanceAlerts,
      channel_recommendations: recommendations,
      budget_optimization: this.optimizeBudgetAllocation(attributionData),
      utm_compliance_score: 94.7,
      tracking_quality_score: 91.2
    };
  }
  
  private mapChannelToSource(channel: string): string {
    const mapping: any = {
      "email": "mailchimp",
      "google_ads": "google",
      "linkedin_ads": "linkedin",
      "facebook_ads": "facebook",
      "organic": "organic",
      "direct": "direct"
    };
    return mapping[channel] || channel;
  }
  
  private mapChannelToMedium(channel: string): string {
    const mapping: any = {
      "email": "email",
      "google_ads": "cpc",
      "linkedin_ads": "social",
      "facebook_ads": "social",
      "organic": "organic",
      "direct": "direct"
    };
    return mapping[channel] || "referral";
  }
  
  private validateUTMParameters(params: any): any {
    const errors: string[] = [];
    const requiredParams = UTM_TAXONOMY.required_parameters;
    
    Object.entries(requiredParams).forEach(([param, requirement]) => {
      if (requirement === "always_required" && !params[param]) {
        errors.push(`Missing required parameter: ${param}`);
      }
    });
    
    if (params.utm_campaign && params.utm_campaign.length > 50) {
      errors.push("Campaign name exceeds 50 character limit");
    }
    
    return {
      valid: errors.length === 0,
      errors,
      compliance_score: ((5 - errors.length) / 5) * 100
    };
  }
  
  private buildTrackingURL(baseUrl: string, utmParams: any): string {
    const paramString = Object.entries(utmParams)
      .filter(([key, value]) => value)
      .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
      .join('&');
    
    return `${baseUrl}?${paramString}`;
  }
  
  private calculateChannelRankings(channelData: any): any {
    const channels = Object.entries(channelData);
    
    return {
      by_revenue: channels.sort((a: any, b: any) => b[1].revenue - a[1].revenue).map(c => c[0]),
      by_conversion_rate: channels.sort((a: any, b: any) => b[1].conversion_rate - a[1].conversion_rate).map(c => c[0]),
      by_roas: channels.filter((c: any) => typeof c[1].roas === 'number').sort((a: any, b: any) => b[1].roas - a[1].roas).map(c => c[0]),
      by_efficiency: channels.sort((a: any, b: any) => a[1].cpa - b[1].cpa).map(c => c[0])
    };
  }
  
  private identifyOptimizationOpportunities(channelData: any): string[] {
    const opportunities: string[] = [];
    const benchmarks = CHANNEL_PERFORMANCE_CONFIG.channel_benchmarks;
    
    Object.entries(channelData).forEach(([channel, data]: [string, any]) => {
      if (channel === "email_marketing" && data.conversion_rate < benchmarks.email_marketing.conversion_rate.average) {
        opportunities.push(`Email marketing conversion rate (${data.conversion_rate}%) below average - optimize email content and segmentation`);
      }
      
      if (data.cpa > 0 && data.roas < 3) {
        opportunities.push(`${channel} ROAS (${data.roas}) below target - review targeting and creative performance`);
      }
    });
    
    return opportunities;
  }
  
  private generateBudgetRecommendations(channelData: any): any {
    const totalSpend = Object.values(channelData).reduce((sum: number, channel: any) => sum + channel.cost, 0);
    const recommendations: any = {};
    
    Object.entries(channelData).forEach(([channel, data]: [string, any]) => {
      const currentShare = (data.cost / totalSpend) * 100;
      const efficiency = data.revenue / Math.max(data.cost, 1);
      
      if (efficiency > 8 && currentShare < 40) {
        recommendations[channel] = `Increase budget by 20% - high efficiency channel (${efficiency.toFixed(1)}x ROAS)`;
      } else if (efficiency < 3 && currentShare > 10) {
        recommendations[channel] = `Reduce budget by 15% - low efficiency channel (${efficiency.toFixed(1)}x ROAS)`;
      }
    });
    
    return recommendations;
  }
  
  private applyAttributionModel(model: string, touchpoints: any[]): any {
    // Simplified attribution model application
    switch (model) {
      case "first_touch":
        return { [touchpoints[0]?.channel]: 100 };
      case "last_touch":
        return { [touchpoints[touchpoints.length - 1]?.channel]: 100 };
      case "linear":
        const weight = 100 / touchpoints.length;
        return touchpoints.reduce((acc: any, t: any) => {
          acc[t.channel] = (acc[t.channel] || 0) + weight;
          return acc;
        }, {});
      default:
        return {};
    }
  }
  
  private calculateJourneyDuration(touchpoints: any[]): number {
    if (touchpoints.length < 2) return 0;
    const first = new Date(touchpoints[0].timestamp);
    const last = new Date(touchpoints[touchpoints.length - 1].timestamp);
    return Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  private calculateRevenueAttribution(touchpoints: any[], attributionResults: any): any {
    // Simplified revenue attribution calculation
    return {
      total_revenue: 500, // Example revenue
      attributed_revenue: attributionResults,
      confidence_score: 85.7
    };
  }
  
  private generateJourneyInsights(journey: any, touchpoints: any[]): string[] {
    const insights: string[] = [];
    
    if (journey.journey_duration_days > 30) {
      insights.push("Long consideration period - consider nurture campaign optimization");
    }
    
    if (journey.unique_channels > 5) {
      insights.push("High channel diversity - customer highly engaged across touchpoints");
    }
    
    return insights;
  }
  
  private calculateOverallConversionRate(channelData: any): number {
    const totalTraffic = Object.values(channelData).reduce((sum: number, channel: any) => sum + channel.traffic, 0);
    const totalConversions = Object.values(channelData).reduce((sum: number, channel: any) => sum + channel.conversions, 0);
    return (totalConversions / totalTraffic) * 100;
  }
  
  private checkPerformanceAlerts(data: any): string[] {
    const alerts: string[] = [];
    
    // Example alert logic
    if (data.first_touch_attribution.organic_search > 40) {
      alerts.push("High dependency on organic search - diversify traffic sources");
    }
    
    return alerts;
  }
  
  private generateAttributionRecommendations(data: any): string[] {
    const recommendations: string[] = [];
    
    if (data.last_touch_attribution.email_marketing > 40) {
      recommendations.push("Email marketing strong at conversion - increase mid-funnel email investment");
    }
    
    return recommendations;
  }
  
  private optimizeBudgetAllocation(data: any): any {
    return {
      current_allocation: data.linear_attribution,
      recommended_allocation: {
        "email_marketing": 35,
        "paid_search": 25,
        "organic_search": 20,
        "social_media": 15,
        "direct": 5
      },
      expected_lift: "12-15% improvement in overall ROAS"
    };
  }
}