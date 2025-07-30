export interface AgentStatusProps {
  id: string;
  name: string;
  status: "healthy" | "conflict" | "delayed" | "error";
  lastActive: Date;
  lastReport: string;
  successRate: number;
  strategicAlignment: number;
  icon: string;
  color: string;
}

export interface ConflictProps {
  id: string;
  title: string;
  area: string;
  agents: string[];
  positions: Record<string, string>;
  status: "active" | "resolved" | "escalated";
  createdAt: Date;
}

export interface SystemMetricsProps {
  systemHealth: number;
  activeAgents: number;
  totalAgents: number;
  activeConflicts: number;
  strategicAlignmentScore: number;
}
