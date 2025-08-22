import fs from 'fs';
import path from 'path';

const RISK_ORDER = { "low": 0, "medium": 1, "high": 2 } as const;

interface Recommendation {
  risk?: string;
  canary_n?: number;
  spend_cents?: number;
  [key: string]: any;
}

interface PolicyDecision {
  auto_execute: boolean;
  requires_approval: boolean;
  violation: boolean;
  reasons: string[];
  notify_mode: string;
}

function envInt(name: string, defaultValue: number): number {
  try {
    return parseInt(process.env[name] || String(defaultValue));
  } catch {
    return defaultValue;
  }
}

function riskOk(risk: string, allow: string): boolean {
  return (RISK_ORDER[risk as keyof typeof RISK_ORDER] ?? 99) <= (RISK_ORDER[allow as keyof typeof RISK_ORDER] ?? 0);
}

function nowUtc(): Date {
  return new Date();
}

export function monthToDateSpendCents(logPath: string): number {
  try {
    if (!fs.existsSync(logPath)) return 0;
    
    const now = nowUtc();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    let total = 0;
    
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const evt = JSON.parse(line);
        if (evt.type !== "action_completed") continue;
        if (!evt.ts) continue;
        
        const eventTime = new Date(evt.ts);
        if (eventTime >= start) {
          total += parseInt(evt.spend_cents || 0);
        }
      } catch {
        continue;
      }
    }
    
    return total;
  } catch {
    return 0;
  }
}

export function policyDecision(reco: Recommendation, logPath: string): PolicyDecision {
  const risk = (reco.risk || "low").toLowerCase();
  const canaryN = reco.canary_n || envInt("CANARY_MIN", 10);
  const spendCents = reco.spend_cents || 0;
  const dry = (process.env.DRY_RUN || "true").toLowerCase() === "true";
  
  const allowAutoRisk = (process.env.ALLOW_AUTO_RISK || "low").toLowerCase();
  const budgetCap = envInt("BUDGET_CAP_CENTS", 10000); // $100 default
  const mtd = monthToDateSpendCents(logPath);
  const notifyMode = (process.env.STAKEHOLDER_NOTIFY || "exceptions_only").toLowerCase();
  
  const reasons: string[] = [];
  
  if (!riskOk(risk, allowAutoRisk)) {
    reasons.push(`risk>${allowAutoRisk}`);
  }
  if (spendCents > 0) {
    reasons.push("spend>0");
  }
  if (canaryN < envInt("CANARY_MIN", 10)) {
    reasons.push("canary_too_small");
  }
  if (mtd + spendCents > budgetCap) {
    reasons.push("budget_cap_exceeded");
  }
  
  const violation = reasons.length > 0;
  const autoExecute = !violation && (dry || risk === "low");
  const requiresApproval = violation && (spendCents > 0 || !riskOk(risk, "low"));
  
  return {
    auto_execute: autoExecute,
    requires_approval: requiresApproval,
    violation,
    reasons,
    notify_mode: notifyMode
  };
}

export function overdueCutoff(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// Governance KPI thresholds for escalation
export interface GovernanceThresholds {
  auto_resolve_min: number;
  mttr_max_minutes: number;
  max_escalations_per_day: number;
  missing_outcome_hours: number;
}

export function getGovernanceThresholds(): GovernanceThresholds {
  return {
    auto_resolve_min: envInt("AUTO_RESOLVE_MIN_PERCENT", 85),
    mttr_max_minutes: envInt("MTTR_MAX_MINUTES", 5),
    max_escalations_per_day: envInt("MAX_ESCALATIONS_PER_DAY", 5),
    missing_outcome_hours: envInt("MISSING_OUTCOME_HOURS", 24)
  };
}

export function shouldEscalateToFounder(metrics: {
  auto_resolve_rate: number;
  mttr_minutes: number;
  escalations_today: number;
  missing_outcomes_over_24h: number;
  canary_failures: number;
}): { escalate: boolean; reasons: string[] } {
  const thresholds = getGovernanceThresholds();
  const reasons: string[] = [];
  
  if (metrics.auto_resolve_rate < thresholds.auto_resolve_min) {
    reasons.push(`auto_resolve_rate_${metrics.auto_resolve_rate}%<${thresholds.auto_resolve_min}%`);
  }
  
  if (metrics.mttr_minutes > thresholds.mttr_max_minutes) {
    reasons.push(`mttr_${metrics.mttr_minutes}m>${thresholds.mttr_max_minutes}m`);
  }
  
  if (metrics.escalations_today > thresholds.max_escalations_per_day) {
    reasons.push(`escalations_${metrics.escalations_today}>${thresholds.max_escalations_per_day}/day`);
  }
  
  if (metrics.missing_outcomes_over_24h > 0) {
    reasons.push(`missing_outcomes_${metrics.missing_outcomes_over_24h}>24h`);
  }
  
  if (metrics.canary_failures > 0) {
    reasons.push(`canary_failures_${metrics.canary_failures}`);
  }
  
  return {
    escalate: reasons.length > 0,
    reasons
  };
}