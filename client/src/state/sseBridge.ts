import { queryClient } from "@/lib/queryClient";
import { qk } from "./queries";
import type { AgentState, AgentMetrics } from "../../../server/models/AgentState";

let eventSource: EventSource | null = null;

export function attachSSE() {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource("/api/agents/events/stream");
  
  // Handle initial state
  eventSource.addEventListener("agents:init", (e: MessageEvent) => {
    const { items, metrics } = JSON.parse(e.data);
    
    // Update agents list cache
    queryClient.setQueryData(qk.agents, { items });
    queryClient.setQueryData(qk.agentMetrics, metrics);
    
    // Update individual agent caches
    items.forEach((agent: AgentState) => {
      queryClient.setQueryData(qk.agent(agent.id), agent);
    });
  });

  // Handle individual agent updates
  eventSource.addEventListener("agent:update", (e: MessageEvent) => {
    const agent: AgentState = JSON.parse(e.data);
    
    // Update individual agent cache
    queryClient.setQueryData(qk.agent(agent.id), agent);
    
    // Invalidate related queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: qk.agents });
    queryClient.invalidateQueries({ queryKey: qk.conflicts });
    queryClient.invalidateQueries({ queryKey: qk.remediation(agent.id) });
    queryClient.invalidateQueries({ queryKey: qk.conflictsActive });
    queryClient.invalidateQueries({ queryKey: qk.conflictSystemHealth });
  });

  // Handle system metrics updates
  eventSource.addEventListener("metrics:update", (e: MessageEvent) => {
    const metrics: AgentMetrics = JSON.parse(e.data);
    queryClient.setQueryData(qk.agentMetrics, metrics);
    
    // Also invalidate autonomy KPIs since they may derive from agent metrics
    queryClient.invalidateQueries({ queryKey: qk.autonomyKPIs });
    queryClient.invalidateQueries({ queryKey: qk.autonomyTrafficLights });
  });

  // Handle connection errors
  eventSource.onerror = (error) => {
    console.warn("SSE connection error:", error);
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      if (eventSource?.readyState === EventSource.CLOSED) {
        attachSSE();
      }
    }, 5000);
  };

  return () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

export function getSSEStatus(): "connecting" | "open" | "closed" | "error" {
  if (!eventSource) return "closed";
  
  switch (eventSource.readyState) {
    case EventSource.CONNECTING: return "connecting";
    case EventSource.OPEN: return "open";
    case EventSource.CLOSED: return "closed";
    default: return "error";
  }
}