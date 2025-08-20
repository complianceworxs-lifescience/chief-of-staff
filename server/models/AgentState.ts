export type AgentId =
  | "ceo" | "coo" | "cmo" | "cro" | "cco" | "content-manager" | "chief-of-staff" | "market-intelligence";

export type AgentStatus = "idle" | "running" | "blocked" | "resolved" | "error" | "healthy" | "degraded";

export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  riskScore: number;              // 0–100
  blockedTasks: string[];
  dependencies: string[];
  delayedOutputs: string[];
  meta?: Record<string, any>;     // freeform (forecasts, KPIs, etc.)
  updatedAt: number;              // Date.now()
  version: number;                // increments on write
  displayName?: string;           // Human-readable name
  lastAction?: string;            // Last action performed
  performance?: {
    success_rate: number;
    avg_response_time: number;
    tasks_completed: number;
  };
}

export interface AgentMetrics {
  totalAgents: number;
  healthyAgents: number;
  degradedAgents: number;
  avgRiskScore: number;
  totalBlockedTasks: number;
}