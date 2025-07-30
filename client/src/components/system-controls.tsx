import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Gavel, 
  Square, 
  RefreshCw, 
  ClipboardList, 
  Download 
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function SystemControls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const triggerAgentsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/system/trigger-agents");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/metrics"] });
      toast({
        title: "Agents Triggered",
        description: data.message,
      });
    }
  });

  const forceResolutionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/system/force-resolution");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conflicts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conflicts/active"] });
      toast({
        title: "Conflicts Resolved",
        description: data.message,
      });
    }
  });

  const syncStrategyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/system/sync-strategy");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Strategy Synced",
        description: data.message,
      });
    }
  });

  const refreshSystemMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/system/refresh");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "System Refreshed",
        description: "All system metrics have been updated.",
      });
    }
  });

  const controls = [
    {
      icon: Play,
      title: "Trigger All Agents",
      description: "Force sync across all agents",
      onClick: () => triggerAgentsMutation.mutate(),
      isPending: triggerAgentsMutation.isPending,
      variant: "default" as const
    },
    {
      icon: Gavel,
      title: "Force Resolution",
      description: "Apply default conflict rules",
      onClick: () => forceResolutionMutation.mutate(),
      isPending: forceResolutionMutation.isPending,
      variant: "default" as const
    },
    {
      icon: Square,
      title: "Emergency Stop",
      description: "Pause all agent operations",
      onClick: () => toast({
        title: "Emergency Stop",
        description: "All agent operations have been paused.",
        variant: "destructive"
      }),
      isPending: false,
      variant: "destructive" as const
    },
    {
      icon: RefreshCw,
      title: "Sync Strategy",
      description: "Push latest objectives",
      onClick: () => syncStrategyMutation.mutate(),
      isPending: syncStrategyMutation.isPending,
      variant: "default" as const
    },
    {
      icon: ClipboardList,
      title: "Audit Logs",
      description: "Review system activity",
      onClick: () => toast({
        title: "Audit Logs",
        description: "Opening system audit logs interface.",
      }),
      isPending: false,
      variant: "outline" as const
    },
    {
      icon: Download,
      title: "Export Data",
      description: "Download system data",
      onClick: () => toast({
        title: "Export Started",
        description: "System data export has been initiated.",
      }),
      isPending: false,
      variant: "outline" as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          System Controls & Manual Interventions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {controls.map((control, index) => (
            <Button
              key={index}
              variant={control.variant}
              className="flex flex-col items-center p-4 h-auto space-y-2 hover:scale-105 transition-transform"
              onClick={control.onClick}
              disabled={control.isPending}
            >
              <control.icon className="h-6 w-6" />
              <span className="font-medium">{control.title}</span>
              <span className="text-xs text-center opacity-75">
                {control.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
