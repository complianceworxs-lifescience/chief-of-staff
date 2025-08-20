import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { qk } from "../state/queries";
import type { AgentState, AgentId } from "../../../server/models/AgentState";
import { toast } from "@/hooks/use-toast";

interface AgentUpdatePayload {
  status?: AgentState['status'];
  riskScore?: number;
  blockedTasks?: string[];
  dependencies?: string[];
  delayedOutputs?: string[];
  lastAction?: string;
  meta?: Record<string, any>;
  performance?: AgentState['performance'];
}

export function useAgent(id: AgentId) {
  const query = useQuery({
    queryKey: qk.agent(id),
    queryFn: async (): Promise<AgentState> => {
      const response = await fetch(`/api/agents/${id}`, { 
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch agent ${id}`);
      }
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const update = useMutation({
    mutationFn: async (partial: AgentUpdatePayload) => {
      const response = await fetch(`/api/agents/${id}`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Update failed" }));
        throw new Error(errorData.error || "Update failed");
      }
      return response.json();
    },
    
    // Optimistic update
    onMutate: async (partial) => {
      await queryClient.cancelQueries({ queryKey: qk.agent(id) });
      const previousState = queryClient.getQueryData(qk.agent(id));
      
      // Apply optimistic update
      queryClient.setQueryData(qk.agent(id), (current: AgentState | undefined) => {
        if (!current) return current;
        return { 
          ...current, 
          ...partial, 
          updatedAt: Date.now(),
          version: current.version + 1
        };
      });
      
      return { previousState };
    },
    
    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousState) {
        queryClient.setQueryData(qk.agent(id), context.previousState);
      }
      toast({
        title: "Update Failed",
        description: `Failed to update ${id} agent: ${error.message}`,
        variant: "destructive"
      });
    },
    
    // Confirm success and trigger related updates
    onSuccess: (data) => {
      // Update the agent cache with server response
      queryClient.setQueryData(qk.agent(id), data.state);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: qk.agents });
      queryClient.invalidateQueries({ queryKey: qk.conflicts });
      queryClient.invalidateQueries({ queryKey: qk.agentMetrics });
      
      toast({
        title: "Agent Updated",
        description: `${id} agent state updated successfully`
      });
    }
  });

  return { 
    ...query, 
    update,
    // Convenience methods for common operations
    resolve: () => update.mutate({ 
      status: "resolved", 
      riskScore: 0, 
      blockedTasks: [], 
      delayedOutputs: [],
      lastAction: "Auto-resolved via dashboard"
    }),
    
    block: (tasks: string[]) => update.mutate({ 
      status: "blocked", 
      blockedTasks: tasks,
      lastAction: "Blocked due to dependencies"
    }),
    
    setHealthy: () => update.mutate({ 
      status: "healthy", 
      riskScore: Math.min(query.data?.riskScore ?? 0, 25),
      lastAction: "Status restored to healthy"
    }),
    
    updateRisk: (riskScore: number) => update.mutate({ 
      riskScore,
      lastAction: `Risk score updated to ${riskScore}`
    })
  };
}

// Hook for managing multiple agents
export function useAgents() {
  return useQuery({
    queryKey: qk.agents,
    queryFn: async () => {
      const response = await fetch("/api/agents", { 
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!response.ok) throw new Error("Failed to fetch agents");
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

// Hook for system metrics
export function useAgentMetrics() {
  return useQuery({
    queryKey: qk.agentMetrics,
    queryFn: async () => {
      const response = await fetch("/api/agents/system/metrics", { 
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}