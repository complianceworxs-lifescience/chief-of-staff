import type { AgentId, AgentState, AgentMetrics } from "../models/AgentState";

type Listener = (state: AgentState) => void;
type MetricsListener = (metrics: AgentMetrics) => void;

const _db = new Map<AgentId, AgentState>();
const _listeners = new Set<Listener>();
const _metricsListeners = new Set<MetricsListener>();

export function getAgent(id: AgentId): AgentState | null {
  return _db.get(id) ?? null;
}

export function setAgent(next: AgentState) {
  const updated = { 
    ...next, 
    updatedAt: Date.now(), 
    version: (next.version ?? 0) + 1 
  };
  _db.set(next.id, updated);
  
  // Notify individual agent listeners
  _listeners.forEach(fn => fn(updated));
  
  // Notify metrics listeners
  const metrics = calculateMetrics();
  _metricsListeners.forEach(fn => fn(metrics));
}

export function listAgents(): AgentState[] {
  return Array.from(_db.values());
}

export function calculateMetrics(): AgentMetrics {
  const agents = listAgents();
  const healthyAgents = agents.filter(a => a.status === "healthy" || a.status === "idle" || a.status === "resolved").length;
  const degradedAgents = agents.filter(a => a.status === "degraded" || a.status === "blocked" || a.status === "error").length;
  const avgRiskScore = agents.length > 0 ? agents.reduce((sum, a) => sum + a.riskScore, 0) / agents.length : 0;
  const totalBlockedTasks = agents.reduce((sum, a) => sum + a.blockedTasks.length, 0);

  return {
    totalAgents: agents.length,
    healthyAgents,
    degradedAgents,
    avgRiskScore,
    totalBlockedTasks
  };
}

export function onChange(fn: Listener) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function onMetricsChange(fn: MetricsListener) {
  _metricsListeners.add(fn);
  return () => _metricsListeners.delete(fn);
}

// Seed initial agent states
const initialAgents: { id: AgentId; displayName: string }[] = [
  { id: "ceo", displayName: "CEO Agent" },
  { id: "coo", displayName: "COO Agent" },
  { id: "cmo", displayName: "CMO Agent" },
  { id: "cro", displayName: "CRO Agent" },
  { id: "cco", displayName: "CCO Agent" },
  { id: "content-manager", displayName: "Content Manager" },
  { id: "chief-of-staff", displayName: "Chief of Staff" },
  { id: "market-intelligence", displayName: "Market Intelligence Agent" }
];

initialAgents.forEach(({ id, displayName }) => {
  if (!_db.has(id)) {
    setAgent({
      id,
      status: "healthy",
      riskScore: Math.floor(Math.random() * 20), // Low initial risk
      blockedTasks: [],
      dependencies: [],
      delayedOutputs: [],
      displayName,
      updatedAt: Date.now(),
      version: 0,
      performance: {
        success_rate: 0.95,
        avg_response_time: 150,
        tasks_completed: 0
      }
    });
  }
});