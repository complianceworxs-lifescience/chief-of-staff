export const qk = {
  // Agent-specific queries
  agent: (id: string) => ["agent", id] as const,
  agents: ["agents", "list"] as const,
  agentMetrics: ["agents", "metrics"] as const,
  
  // Existing conflict queries
  conflicts: ["conflicts", "predictions"] as const,
  conflictsActive: ["conflicts", "active"] as const,
  conflictsResolved: ["conflicts", "resolved"] as const,
  conflictSystemHealth: ["conflicts", "system-health"] as const,
  
  // Remediation queries  
  remediation: (agentId: string) => ["remediation", "state", agentId] as const,
  
  // Autonomy queries
  autonomyKPIs: ["autonomy", "kpis"] as const,
  autonomyTrafficLights: ["autonomy", "traffic-lights"] as const,
  
  // Recommendations
  recommendations: ["/api/recommendations"] as const,
  
  // Market Intelligence
  marketIntelligence: ["market-intelligence"] as const,
  marketIntelligenceSignals: ["market-intelligence", "signals"] as const,
} as const;

export type QueryKeys = typeof qk;