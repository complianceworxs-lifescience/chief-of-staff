import type { AgentId, AgentState, AgentMetrics } from "../models/AgentState";

type Listener = (state: AgentState) => void;
type MetricsListener = (metrics: AgentMetrics) => void;
type EventListener = (evt: { type: string; payload: any }) => void;

const _db = new Map<AgentId, AgentState>();
const _listeners = new Set<Listener>();
const _metricsListeners = new Set<MetricsListener>();
const _eventListeners = new Set<EventListener>();

export function getAgent(id: AgentId): AgentState | null {
  return _db.get(id) ?? null;
}

export function setAgent(next: AgentState) {
  const prev = _db.get(next.id);
  const was = prev?.status;
  const now = next.status;

  const stamped: AgentState = {
    ...prev,
    ...next,
    // set resolvedAt only on the transition -> "resolved"
    ...(was !== "resolved" && now === "resolved"
      ? { resolvedAt: Date.now(), riskScore: 0 }
      : {}),
    updatedAt: Date.now(),
    version: (prev?.version ?? 0) + 1,
  };

  _db.set(next.id, stamped);
  
  // Notify individual agent listeners
  _listeners.forEach(fn => fn(stamped));
  
  // Notify metrics listeners
  const metrics = calculateMetrics();
  _metricsListeners.forEach(fn => fn(metrics));
  
  // Emit events for resolution tracking
  emitEvent("agent:update", stamped);

  if (was !== "resolved" && stamped.status === "resolved") {
    emitEvent("agent:resolved", { id: stamped.id, resolvedAt: stamped.resolvedAt });
  }
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

export function onEvent(fn: EventListener) {
  _eventListeners.add(fn);
  return () => _eventListeners.delete(fn);
}

function emitEvent(type: string, payload: any) {
  _eventListeners.forEach(fn => fn({ type, payload }));
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