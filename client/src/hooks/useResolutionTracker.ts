import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/state/queries";
import type { ResolutionStatus } from "@/components/resolution-tracker";

export function useResolutionTracker() {
  const [resolutions, setResolutions] = useState<ResolutionStatus[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startResolution = useCallback(async (
    predictionId: string,
    conflictDetails: { agents: string[]; description: string }
  ) => {
    const resolutionId = `resolution_${Date.now()}`;
    const startedAt = new Date();

    const newResolution: ResolutionStatus = {
      id: resolutionId,
      predictionId,
      status: 'initiating',
      startedAt,
      conflictDetails,
      actions: [
        { description: 'Initiating Chief of Staff intervention', status: 'in-progress' },
        { description: 'Analyzing conflict between agents', status: 'pending' },
        { description: 'Executing autonomous resolution strategy', status: 'pending' },
        { description: 'Validating resolution success', status: 'pending' },
      ]
    };

    setResolutions(prev => [...prev, newResolution]);

    try {
      // Call the resolution API
      const response = await fetch('/api/conflicts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto-resolve',
          predictionId,
          priorityWeights: { revenue: 50, marketing: 30, content: 20 }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate resolution');
      }

      // Update first action as completed
      setResolutions(prev => prev.map(res => 
        res.id === resolutionId 
          ? {
              ...res,
              status: 'analyzing',
              actions: res.actions.map((action, idx) => 
                idx === 0 
                  ? { ...action, status: 'completed' as const, completedAt: new Date() }
                  : idx === 1
                  ? { ...action, status: 'in-progress' as const }
                  : action
              )
            }
          : res
      ));

      // Start monitoring resolution progress
      monitorResolutionProgress(resolutionId, predictionId);

      toast({
        title: "Resolution Initiated",
        description: "Chief of Staff is analyzing the conflict and will execute autonomous resolution.",
        duration: 4000,
      });

    } catch (error) {
      // Mark resolution as failed
      setResolutions(prev => prev.map(res => 
        res.id === resolutionId 
          ? {
              ...res,
              status: 'failed',
              actions: res.actions.map((action, idx) => 
                idx === 0 
                  ? { ...action, status: 'failed' as const, completedAt: new Date() }
                  : { ...action, status: 'failed' as const }
              )
            }
          : res
      ));

      toast({
        title: "Resolution Failed",
        description: error instanceof Error ? error.message : "Failed to initiate conflict resolution",
        variant: "destructive"
      });
    }

    return resolutionId;
  }, [toast]);

  const monitorResolutionProgress = useCallback(async (
    resolutionId: string,
    predictionId: string
  ) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds monitoring
    
    const poll = async () => {
      try {
        // Check if conflicts are resolved
        const conflictsResponse = await fetch('/api/conflicts/active');
        const activeConflicts = await conflictsResponse.json();
        
        // Extract agent names from prediction ID (e.g., "pred_cro_cmo_content_conflict")
        const agentNames = predictionId.split('_').slice(1, -1); // Remove 'pred' and 'conflict'
        
        const isStillActive = activeConflicts.some((conflict: any) => 
          agentNames.some((agent: string) => conflict.agents?.includes(agent))
        );

        if (!isStillActive) {
          // Resolution successful!
          const resolvedAt = new Date();
          setResolutions(prev => prev.map(res => 
            res.id === resolutionId 
              ? {
                  ...res,
                  status: 'resolved',
                  resolvedAt,
                  actions: res.actions.map((action, idx) => ({
                    ...action,
                    status: 'completed' as const,
                    completedAt: resolvedAt
                  }))
                }
              : res
          ));

          toast({
            title: "✅ Conflict Successfully Resolved",
            description: `Chief of Staff autonomous action completed at ${resolvedAt.toLocaleTimeString()}. All affected agents restored to healthy status.`,
            duration: 6000,
          });

          // Also add to notifications for the bell
          const notificationList = (queryClient.getQueryData<Array<{ id: string; title: string; ts: number }>>(qk.notifications) ?? []);
          const notification = {
            id: `resolution-${resolutionId}-${resolvedAt.getTime()}`,
            title: `Conflict resolved at ${resolvedAt.toLocaleTimeString()}`,
            ts: resolvedAt.getTime(),
          };
          queryClient.setQueryData(qk.notifications, [notification, ...notificationList].slice(0, 50));

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: qk.agents });
          queryClient.invalidateQueries({ queryKey: qk.conflictsActive });
          queryClient.invalidateQueries({ queryKey: qk.conflicts });
          
          return;
        }

        attempts++;
        
        // Update progress through different stages
        if (attempts === 5) {
          setResolutions(prev => prev.map(res => 
            res.id === resolutionId 
              ? {
                  ...res,
                  status: 'executing',
                  actions: res.actions.map((action, idx) => 
                    idx === 1 
                      ? { ...action, status: 'completed' as const, completedAt: new Date() }
                      : idx === 2
                      ? { ...action, status: 'in-progress' as const }
                      : action
                  )
                }
              : res
          ));
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          // Timeout - mark as failed
          setResolutions(prev => prev.map(res => 
            res.id === resolutionId 
              ? {
                  ...res,
                  status: 'failed',
                  actions: res.actions.map(action => 
                    action.status === 'in-progress' 
                      ? { ...action, status: 'failed' as const }
                      : action
                  )
                }
              : res
          ));

          toast({
            title: "Resolution Timeout",
            description: "Unable to confirm resolution completion. Please check system status.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error monitoring resolution:', error);
        setResolutions(prev => prev.map(res => 
          res.id === resolutionId 
            ? { ...res, status: 'failed' }
            : res
        ));
      }
    };

    poll();
  }, [toast, queryClient]);

  const dismissResolution = useCallback((resolutionId: string) => {
    setResolutions(prev => prev.filter(res => res.id !== resolutionId));
  }, []);

  const clearAllResolutions = useCallback(() => {
    setResolutions([]);
  }, []);

  return {
    resolutions,
    startResolution,
    dismissResolution,
    clearAllResolutions
  };
}