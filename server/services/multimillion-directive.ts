// Multimillion-Dollar Operating Directive Pack
// Title: Multimillion-Dollar Company Mindset & Operating Roadmap
// Objective: Reorient ComplianceWorxs around multimillion-dollar scale

export const MULTIMILLION_DIRECTIVE = {
  version: "1.0.0",
  effectiveDate: "2025-11-26",
  objective: "Scale ComplianceWorxs to $5M+ valuation as a system-driven, compounding asset",
  
  guidingPrinciples: {
    systemDriven: "Agents and automation become the 'middle management'. Replace manual oversight with reporting thresholds and escalation rules.",
    compoundingAssets: "Prioritize building Intellectual Property (IP), frameworks, and data models that grow in value.",
    valuationOriented: "Focus on Annual Recurring Revenue (ARR), churn, Lifetime Value (LTV), partnerships, and network effects."
  },

  // $5M Growth Line Tracking
  growthLine: {
    targetValuation: 5_000_000,
    arrMultiple: 5, // 5x ARR = Valuation
    targetARR: 1_000_000,
    monthlyGrowthTarget: 0.10, // 10% MoM
    ltv: {
      starter: 99 * 12, // $99/mo annual
      professional: 149 * 12, // $149/mo annual  
      enterprise: 499 * 12 // $499/mo annual
    }
  },

  // Agent-Level Responsibilities
  agentResponsibilities: {
    ceo: {
      displayName: "CEO Agent",
      mandate: "Maintain the $5M growth line. Translate system outputs into strategy. Ensure ODAR discipline across all briefs.",
      kpis: ["ARR trajectory", "Strategic alignment score", "ODAR compliance rate"],
      escalationOwns: ["KPI swings >10% vs plan", "Cross-agent conflicts", "Prioritization decisions"]
    },
    
    "chief-of-staff": {
      displayName: "Chief of Staff Agent",
      mandate: "Drive execution velocity and cross-agent communication. Enforce operational thresholds. Consolidate daily/weekly briefs for CEO. Manage quarterly strategic review.",
      kpis: ["Delivery rate ≥98%", "MTTR <5min", "Auto-resolve ≥85%", "Escalations ≤5/day"],
      escalationOwns: ["Governance enforcement", "Escalation management", "Overdue/outcome gaps", "Weekly rollups"]
    },
    
    cro: {
      displayName: "CRO Agent",
      mandate: "Grow subscription ARR and upsells. Monitor persona monetization funnel ($99 → $149 → $499). Highlight pipeline gaps and conversion choke points.",
      kpis: ["MRR growth", "Churn rate <5%", "Upsell conversion", "Pipeline velocity"],
      escalationOwns: ["MRR flat/down", "Churn risk", "Expansion/upsell plays"],
      funnel: {
        starter: { price: 99, target: "SMB regulatory teams" },
        professional: { price: 149, target: "Growing compliance orgs" },
        enterprise: { price: 499, target: "Enterprise life sciences" }
      }
    },
    
    cmo: {
      displayName: "CMO Agent",
      mandate: "Ensure content velocity, CTR, conversion rate, and CAC/ROAS meet thresholds. Drive persona-specific campaigns. Run experiments (weekly A/B, monthly cohort shifts).",
      kpis: ["CTR ≥1%", "Conversion ≥1%", "CTA yield ≥5%", "CAC <$50"],
      escalationOwns: ["Activation", "CTR decline", "Conversion leaks", "Content underperformance"],
      experimentCadence: {
        weekly: "A/B tests on headlines, CTAs, landing pages",
        monthly: "Cohort analysis and segment shifts"
      }
    },
    
    "content-manager": {
      displayName: "Content Manager",
      mandate: "Execute content calendar with high quality. Maintain content inventory and asset linkage. Ensure Feynman Technique simplicity. Track production velocity.",
      kpis: ["Content production velocity", "Quality score", "Asset utilization", "Calendar adherence"],
      escalationOwns: ["Content velocity", "Quality standards", "Asset management"]
    },
    
    cco: {
      displayName: "CCO Agent",
      mandate: "AI Governance: Ensure agents operate within ethical/regulatory boundaries. Track agent drift. Product Integrity: Ensure paid assets comply with ISO, FDA standards.",
      kpis: ["Agent drift score", "Compliance posture", "Audit readiness", "Deviation backlog"],
      escalationOwns: ["Validation deadlines", "Deviation risk scores", "Audit readiness"],
      governance: {
        aiGovernance: "Ensure all AI agents operate within defined ethical and regulatory boundaries",
        productIntegrity: "Ensure ComplianceWorxs paid assets remain compliant with ISO, FDA",
        trustMetric: "Tie compliance posture directly to partner trust and brand credibility"
      }
    },
    
    cfo: {
      displayName: "CFO Agent",
      mandate: "Monitor burn, runway, and unit costs (API tokens, email, ops). Enforce CAC guardrails and margin thresholds. Project 30/90-day revenue versus spend forecasts.",
      kpis: ["Burn rate", "Runway ≥12mo", "ROAS ≥2x", "Margin health"],
      escalationOwns: ["Burn/runway alerts", "ROAS performance", "Budget variance"],
      metrics: {
        unitCosts: ["API tokens", "Email sends", "Ops overhead"],
        guardrails: { cacMax: 50, roasMin: 2, runwayMinMonths: 12 }
      }
    },
    
    coo: {
      displayName: "COO Agent",
      mandate: "Operational engine room. Manage internal operations execution, workflow efficiency, productivity metrics, cost management, sprint execution.",
      kpis: ["Job success rate", "Uptime ≥99.5%", "Data freshness", "MTTR <5min"],
      escalationOwns: ["Job failures", "Uptime issues", "Data freshness", "MTTR breaches", "Incident handling"]
    },
    
    "market-intelligence": {
      displayName: "Market Intelligence Agent",
      mandate: "Monitor regulatory, competitive, and market signals. Provide actionable intelligence for strategic decisions.",
      kpis: ["Signal quality", "Intelligence freshness", "Actionable insights"],
      escalationOwns: ["Market disruptions", "Competitive threats", "Regulatory changes"]
    }
  },

  // Execution Framework
  executionFramework: {
    daily: {
      agents: "All Agents",
      action: "Produce brief commentary flagging ESCALATE when thresholds breached",
      format: "Brief with status, blockers, and threshold alerts"
    },
    weekly: {
      agents: ["CEO", "CMO", "CoS", "CRO"],
      action: "Summarize trajectory against the $5M line",
      format: "Progress report with growth metrics and velocity"
    },
    monthly: {
      agents: ["CFO", "CoS"],
      action: "Produce forecasts, variance versus budget, compliance audit readiness trends",
      format: "Financial report with projections and variance analysis"
    },
    quarterly: {
      agents: ["CEO", "CoS"],
      action: "Strategic review, threshold adjustments, and roadmap recalibration",
      format: "Strategic review deck with updated roadmap"
    }
  },

  // Threshold Escalation Rules (from directive)
  escalationThresholds: {
    ops: {
      autoResolveMin: 85,      // Auto-resolve ≥ 85%
      mttrMaxMinutes: 5,       // MTTR ≤ 5 minutes
      maxEscalationsPerDay: 5, // ≤ 5 escalations/day
      deliveryRateMin: 98      // Delivery rate ≥ 98%
    },
    marketing: {
      ctrMin: 1.0,             // CTR ≥ 1%
      conversionMin: 1.0,      // Conversion ≥ 1%
      ctaYieldMin: 5.0,        // CTA yield ≥ 5%
      cacMax: 50               // CAC ≤ $50
    },
    revenue: {
      churnMax: 5.0,           // Subscription churn ≤ 5%
      arrGrowthMin: 10.0       // ARR growth ≥ 10% MoM
    },
    finance: {
      runwayMinMonths: 12,     // Burn/runway ≥ 12 months
      roasMin: 2.0             // ROAS ≥ 2x
    },
    compliance: {
      sopOverdueMaxDays: 7,    // Overdue SOP ≤ 7 days
      validationMaxDays: 3,    // Missed validation ≤ 3 days
      deviationBacklogMax: 5   // Deviation backlog ≤ 5
    }
  }
};

// CEO Agent Context Block for November 26th
export const CEO_CONTEXT_BLOCK = {
  directive: "Multimillion-Dollar Operating Model",
  mindsetShift: "Stop thinking 'What can I do today?' and start thinking 'What systems must I install so ComplianceWorxs compounds into a $5M+ asset — without me in the weeds?'",
  
  dailyFocus: [
    "Monitor $5M growth line trajectory",
    "Review ODAR compliance across all agent briefs",
    "Address threshold breaches with strategic decisions",
    "Ensure system-driven execution vs founder-driven"
  ],
  
  odarDiscipline: {
    objective: "Clear goal aligned with $5M valuation",
    data: "Metrics and evidence supporting decisions",
    action: "Specific steps with owners and deadlines",
    result: "Measured outcomes within 24h SLA"
  },
  
  escalationPriority: [
    "KPI swings >10% vs plan",
    "Cross-agent conflicts requiring arbitration",
    "Strategic prioritization decisions",
    "Threshold breaches requiring intervention"
  ]
};

// Chief of Staff Briefing Consolidation
export interface DailyBrief {
  agent: string;
  status: "green" | "yellow" | "red";
  kpis: { metric: string; value: number; threshold: number; status: "ok" | "warning" | "breach" }[];
  blockers: string[];
  escalations: string[];
  commentary: string;
}

export interface WeeklyRollup {
  period: string;
  growthLineStatus: {
    arrCurrent: number;
    arrTarget: number;
    velocity: number;
    trajectory: "on-track" | "at-risk" | "behind";
  };
  agentSummaries: {
    agent: string;
    deliveryRate: number;
    issuesResolved: number;
    escalations: number;
  }[];
  strategicAlerts: string[];
  recommendations: string[];
}

// Generate threshold check for any metric
export function checkThreshold(
  category: keyof typeof MULTIMILLION_DIRECTIVE.escalationThresholds,
  metric: string,
  value: number
): { breached: boolean; message: string; severity: "warning" | "critical" } {
  const thresholds = MULTIMILLION_DIRECTIVE.escalationThresholds[category];
  const threshold = (thresholds as any)[metric];
  
  if (threshold === undefined) {
    return { breached: false, message: "Unknown metric", severity: "warning" };
  }
  
  // Determine if this is a min or max threshold
  const isMin = metric.includes("Min") || metric.includes("min");
  const breached = isMin ? value < threshold : value > threshold;
  
  const severity = breached && (
    category === "revenue" || 
    metric.includes("runway") || 
    metric.includes("churn")
  ) ? "critical" : "warning";
  
  return {
    breached,
    message: breached 
      ? `${metric}: ${value} ${isMin ? '<' : '>'} ${threshold} (ESCALATE)` 
      : `${metric}: ${value} OK`,
    severity
  };
}

// Generate daily brief for an agent
export function generateAgentBrief(
  agentId: string,
  metrics: Record<string, number>
): DailyBrief {
  const agent = MULTIMILLION_DIRECTIVE.agentResponsibilities[agentId as keyof typeof MULTIMILLION_DIRECTIVE.agentResponsibilities];
  
  if (!agent) {
    return {
      agent: agentId,
      status: "yellow",
      kpis: [],
      blockers: [],
      escalations: [],
      commentary: "Agent not found in directive"
    };
  }
  
  const kpis: DailyBrief["kpis"] = [];
  const escalations: string[] = [];
  
  // Check relevant thresholds based on agent
  for (const [metric, value] of Object.entries(metrics)) {
    const threshold = getThresholdForMetric(agentId, metric);
    if (threshold !== null) {
      const status = checkMetricStatus(metric, value, threshold);
      kpis.push({ metric, value, threshold, status });
      if (status === "breach") {
        escalations.push(`ESCALATE: ${metric} at ${value} (threshold: ${threshold})`);
      }
    }
  }
  
  const hasBreaches = kpis.some(k => k.status === "breach");
  const hasWarnings = kpis.some(k => k.status === "warning");
  
  return {
    agent: agent.displayName,
    status: hasBreaches ? "red" : hasWarnings ? "yellow" : "green",
    kpis,
    blockers: [],
    escalations,
    commentary: hasBreaches 
      ? "Threshold breaches detected - immediate attention required"
      : hasWarnings 
        ? "Some metrics trending toward thresholds"
        : "All metrics within acceptable ranges"
  };
}

function getThresholdForMetric(agentId: string, metric: string): number | null {
  const thresholds = MULTIMILLION_DIRECTIVE.escalationThresholds;
  
  // Map agent to threshold category
  const categoryMap: Record<string, keyof typeof thresholds> = {
    coo: "ops",
    "chief-of-staff": "ops",
    cmo: "marketing",
    cro: "revenue",
    cfo: "finance",
    cco: "compliance"
  };
  
  const category = categoryMap[agentId];
  if (!category) return null;
  
  return (thresholds[category] as any)[metric] ?? null;
}

function checkMetricStatus(
  metric: string, 
  value: number, 
  threshold: number
): "ok" | "warning" | "breach" {
  const isMin = metric.toLowerCase().includes("min") || 
                ["autoResolve", "ctr", "conversion", "ctaYield", "arrGrowth", "roas", "deliveryRate"].some(m => metric.toLowerCase().includes(m.toLowerCase()));
  
  if (isMin) {
    if (value < threshold * 0.9) return "breach";
    if (value < threshold) return "warning";
    return "ok";
  } else {
    if (value > threshold * 1.1) return "breach";
    if (value > threshold) return "warning";
    return "ok";
  }
}

// Generate weekly rollup for CEO
export function generateWeeklyRollup(
  agentBriefs: DailyBrief[],
  financialMetrics: { arrCurrent: number; arrTarget: number; velocity: number }
): WeeklyRollup {
  const trajectory = financialMetrics.arrCurrent >= financialMetrics.arrTarget 
    ? "on-track" 
    : financialMetrics.velocity >= 0.08 
      ? "at-risk" 
      : "behind";
  
  const strategicAlerts: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze agent briefs
  for (const brief of agentBriefs) {
    if (brief.status === "red") {
      strategicAlerts.push(`${brief.agent}: Critical threshold breaches detected`);
    }
    for (const escalation of brief.escalations) {
      strategicAlerts.push(escalation);
    }
  }
  
  // Generate recommendations based on trajectory
  if (trajectory === "behind") {
    recommendations.push("Accelerate revenue initiatives - consider emergency pipeline review");
    recommendations.push("Evaluate marketing spend allocation for highest-converting channels");
  }
  if (trajectory === "at-risk") {
    recommendations.push("Increase monitoring frequency on key conversion metrics");
    recommendations.push("Review upsell opportunities in existing customer base");
  }
  
  return {
    period: new Date().toISOString().split('T')[0],
    growthLineStatus: {
      ...financialMetrics,
      trajectory
    },
    agentSummaries: agentBriefs.map(b => ({
      agent: b.agent,
      deliveryRate: 0, // Would be populated from actual data
      issuesResolved: 0,
      escalations: b.escalations.length
    })),
    strategicAlerts,
    recommendations
  };
}

// Export for use in other services
export default MULTIMILLION_DIRECTIVE;
