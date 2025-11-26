// CFO Agent Monitoring Service
// Mandate: Monitor burn, runway, unit costs. Enforce CAC guardrails. Project 30/90-day forecasts.

import { getGovernanceThresholds } from '../governance.js';
import { setAgent, getAgent } from '../state/store.js';

export interface FinancialMetrics {
  // Burn and Runway
  monthlyBurn: number;          // Monthly burn rate in dollars
  cashOnHand: number;           // Current cash position
  runwayMonths: number;         // Calculated runway
  
  // Unit Costs
  apiTokenCost: number;         // API/LLM token costs
  emailServiceCost: number;     // Email service (MailChimp) costs
  opsOverhead: number;          // Operational overhead
  totalUnitCost: number;        // Sum of all unit costs
  
  // CAC and ROAS
  cac: number;                  // Customer Acquisition Cost
  ltv: number;                  // Lifetime Value
  ltvCacRatio: number;          // LTV:CAC ratio (target: 3:1+)
  roas: number;                 // Return on Ad Spend
  
  // Revenue Metrics
  mrr: number;                  // Monthly Recurring Revenue
  arr: number;                  // Annual Recurring Revenue
  mrrGrowth: number;            // MoM growth percentage
  
  // Margin Health
  grossMargin: number;          // Gross margin percentage
  netMargin: number;            // Net margin percentage
}

export interface FinancialForecast {
  period: '30-day' | '90-day';
  projectedRevenue: number;
  projectedCosts: number;
  projectedCashPosition: number;
  projectedRunway: number;
  variance: {
    revenue: number;            // Variance from budget
    costs: number;
  };
  risks: string[];
  recommendations: string[];
}

export interface CFOEscalation {
  id: string;
  timestamp: string;
  category: 'runway' | 'cac' | 'roas' | 'burn' | 'margin';
  severity: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  recommendedAction: string;
}

// In-memory storage for CFO metrics
let currentMetrics: FinancialMetrics = {
  monthlyBurn: 0,
  cashOnHand: 0,
  runwayMonths: 24,
  apiTokenCost: 0,
  emailServiceCost: 0,
  opsOverhead: 0,
  totalUnitCost: 0,
  cac: 0,
  ltv: 0,
  ltvCacRatio: 3,
  roas: 2.5,
  mrr: 0,
  arr: 0,
  mrrGrowth: 0,
  grossMargin: 70,
  netMargin: 20
};

let escalations: CFOEscalation[] = [];

export function updateFinancialMetrics(metrics: Partial<FinancialMetrics>): FinancialMetrics {
  currentMetrics = { ...currentMetrics, ...metrics };
  
  // Auto-calculate derived metrics
  if (metrics.monthlyBurn && metrics.cashOnHand) {
    currentMetrics.runwayMonths = Math.floor(currentMetrics.cashOnHand / currentMetrics.monthlyBurn);
  }
  
  if (metrics.apiTokenCost !== undefined || metrics.emailServiceCost !== undefined || metrics.opsOverhead !== undefined) {
    currentMetrics.totalUnitCost = 
      (currentMetrics.apiTokenCost || 0) + 
      (currentMetrics.emailServiceCost || 0) + 
      (currentMetrics.opsOverhead || 0);
  }
  
  if (metrics.ltv && metrics.cac) {
    currentMetrics.ltvCacRatio = currentMetrics.ltv / currentMetrics.cac;
  }
  
  if (metrics.mrr) {
    currentMetrics.arr = currentMetrics.mrr * 12;
  }
  
  // Check for threshold breaches
  checkThresholds();
  
  // Update CFO agent state
  updateCFOAgentState();
  
  return currentMetrics;
}

export function getFinancialMetrics(): FinancialMetrics {
  return { ...currentMetrics };
}

function checkThresholds(): void {
  const thresholds = getGovernanceThresholds();
  
  // Check runway
  if (currentMetrics.runwayMonths < thresholds.runway_min_months) {
    addEscalation({
      category: 'runway',
      severity: currentMetrics.runwayMonths < 6 ? 'critical' : 'warning',
      metric: 'Runway Months',
      value: currentMetrics.runwayMonths,
      threshold: thresholds.runway_min_months,
      message: `Runway at ${currentMetrics.runwayMonths} months, below ${thresholds.runway_min_months} month minimum`,
      recommendedAction: 'Review burn rate and accelerate revenue initiatives'
    });
  }
  
  // Check CAC
  if (currentMetrics.cac > thresholds.cac_max) {
    addEscalation({
      category: 'cac',
      severity: currentMetrics.cac > thresholds.cac_max * 1.5 ? 'critical' : 'warning',
      metric: 'Customer Acquisition Cost',
      value: currentMetrics.cac,
      threshold: thresholds.cac_max,
      message: `CAC at $${currentMetrics.cac}, exceeds $${thresholds.cac_max} maximum`,
      recommendedAction: 'Optimize marketing spend and improve conversion rates'
    });
  }
  
  // Check ROAS
  if (currentMetrics.roas < thresholds.roas_min) {
    addEscalation({
      category: 'roas',
      severity: currentMetrics.roas < 1.0 ? 'critical' : 'warning',
      metric: 'Return on Ad Spend',
      value: currentMetrics.roas,
      threshold: thresholds.roas_min,
      message: `ROAS at ${currentMetrics.roas}x, below ${thresholds.roas_min}x minimum`,
      recommendedAction: 'Shift budget to higher-performing channels'
    });
  }
  
  // Check LTV:CAC ratio (should be 3:1 or better)
  if (currentMetrics.ltvCacRatio < 3) {
    addEscalation({
      category: 'margin',
      severity: currentMetrics.ltvCacRatio < 2 ? 'critical' : 'warning',
      metric: 'LTV:CAC Ratio',
      value: currentMetrics.ltvCacRatio,
      threshold: 3,
      message: `LTV:CAC ratio at ${currentMetrics.ltvCacRatio.toFixed(1)}:1, below 3:1 target`,
      recommendedAction: 'Focus on customer retention and upsells to improve LTV'
    });
  }
}

function addEscalation(data: Omit<CFOEscalation, 'id' | 'timestamp'>): void {
  const escalation: CFOEscalation = {
    id: `cfo_esc_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  // Only add if not duplicate in last hour
  const recentDuplicate = escalations.find(e => 
    e.category === data.category && 
    e.metric === data.metric &&
    new Date(e.timestamp).getTime() > Date.now() - 3600000
  );
  
  if (!recentDuplicate) {
    escalations.push(escalation);
    console.log(`💰 CFO ESCALATION [${data.severity.toUpperCase()}]: ${data.message}`);
  }
}

function updateCFOAgentState(): void {
  const agent = getAgent('cfo');
  if (agent) {
    const hasEscalations = escalations.some(e => 
      new Date(e.timestamp).getTime() > Date.now() - 86400000
    );
    
    setAgent({
      ...agent,
      status: hasEscalations ? 'degraded' : 'healthy',
      riskScore: hasEscalations ? 50 : 10,
      meta: {
        ...agent.meta,
        lastMetricsUpdate: new Date().toISOString(),
        currentMetrics: {
          runway: currentMetrics.runwayMonths,
          cac: currentMetrics.cac,
          roas: currentMetrics.roas,
          arr: currentMetrics.arr
        }
      },
      updatedAt: Date.now()
    });
  }
}

export function generate30DayForecast(): FinancialForecast {
  const projectedRevenue = currentMetrics.mrr * (1 + currentMetrics.mrrGrowth / 100);
  const projectedCosts = currentMetrics.monthlyBurn;
  const netChange = projectedRevenue - projectedCosts;
  
  const risks: string[] = [];
  const recommendations: string[] = [];
  
  if (currentMetrics.runwayMonths < 12) {
    risks.push('Runway below 12 months - funding consideration needed');
    recommendations.push('Initiate runway extension planning');
  }
  
  if (currentMetrics.mrrGrowth < 10) {
    risks.push('MRR growth below 10% target');
    recommendations.push('Accelerate sales initiatives and marketing spend');
  }
  
  if (currentMetrics.cac > 50) {
    risks.push('CAC exceeding $50 threshold');
    recommendations.push('Audit marketing channels and optimize spend');
  }
  
  return {
    period: '30-day',
    projectedRevenue,
    projectedCosts,
    projectedCashPosition: currentMetrics.cashOnHand + netChange,
    projectedRunway: Math.floor((currentMetrics.cashOnHand + netChange) / currentMetrics.monthlyBurn),
    variance: {
      revenue: 0, // Would compare to budget
      costs: 0
    },
    risks,
    recommendations
  };
}

export function generate90DayForecast(): FinancialForecast {
  const growthRate = 1 + currentMetrics.mrrGrowth / 100;
  const projectedRevenue = currentMetrics.mrr * Math.pow(growthRate, 3); // 3 months
  const projectedCosts = currentMetrics.monthlyBurn * 3;
  const netChange = (projectedRevenue * 3) - projectedCosts;
  
  const risks: string[] = [];
  const recommendations: string[] = [];
  
  if (currentMetrics.runwayMonths < 12) {
    risks.push('Runway below 12 months - strategic action required');
    recommendations.push('Consider fundraising or cost reduction');
  }
  
  if (currentMetrics.arr < 500000) {
    risks.push('ARR not on track for $5M valuation target');
    recommendations.push('Review growth strategy and pricing optimization');
  }
  
  return {
    period: '90-day',
    projectedRevenue: projectedRevenue * 3,
    projectedCosts,
    projectedCashPosition: currentMetrics.cashOnHand + netChange,
    projectedRunway: Math.floor((currentMetrics.cashOnHand + netChange) / currentMetrics.monthlyBurn),
    variance: {
      revenue: 0,
      costs: 0
    },
    risks,
    recommendations
  };
}

export function getCFOEscalations(hours: number = 24): CFOEscalation[] {
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  return escalations.filter(e => new Date(e.timestamp).getTime() > cutoff);
}

export function generateCFOBrief(): {
  date: string;
  summary: string;
  metrics: FinancialMetrics;
  escalations: CFOEscalation[];
  forecast30: FinancialForecast;
  forecast90: FinancialForecast;
  status: 'green' | 'yellow' | 'red';
} {
  const recentEscalations = getCFOEscalations(24);
  const criticalCount = recentEscalations.filter(e => e.severity === 'critical').length;
  const warningCount = recentEscalations.filter(e => e.severity === 'warning').length;
  
  let status: 'green' | 'yellow' | 'red' = 'green';
  if (criticalCount > 0) status = 'red';
  else if (warningCount > 0) status = 'yellow';
  
  const summary = criticalCount > 0 
    ? `⚠️ ESCALATE: ${criticalCount} critical financial alerts requiring immediate attention`
    : warningCount > 0
      ? `📊 ${warningCount} financial metrics requiring monitoring`
      : `✅ All financial metrics within acceptable ranges`;
  
  return {
    date: new Date().toISOString().split('T')[0],
    summary,
    metrics: currentMetrics,
    escalations: recentEscalations,
    forecast30: generate30DayForecast(),
    forecast90: generate90DayForecast(),
    status
  };
}

// Initialize CFO agent on module load
updateCFOAgentState();

export default {
  updateFinancialMetrics,
  getFinancialMetrics,
  generate30DayForecast,
  generate90DayForecast,
  getCFOEscalations,
  generateCFOBrief
};
