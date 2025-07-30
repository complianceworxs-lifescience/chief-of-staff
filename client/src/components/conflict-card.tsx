import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Gavel, ArrowUp, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Conflict } from "@shared/schema";

interface ConflictCardProps {
  conflict: Conflict;
}

export function ConflictCard({ conflict }: ConflictCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resolveConflictMutation = useMutation({
    mutationFn: async ({ resolution, manualResolution }: { resolution: string; manualResolution?: string }) => {
      const response = await apiRequest("PUT", `/api/conflicts/${conflict.id}/resolve`, {
        resolution,
        manualResolution
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conflicts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conflicts/active"] });
      toast({
        title: "Conflict Resolved",
        description: "The conflict has been successfully resolved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve conflict. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleResolve = (resolution: "auto" | "escalate") => {
    resolveConflictMutation.mutate({ resolution });
  };

  const getAgentPositions = () => {
    return Object.entries(conflict.positions).map(([agentId, position]) => ({
      agentId,
      position,
      agentName: agentId.toUpperCase() + " Agent"
    }));
  };

  const positions = getAgentPositions();

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">{conflict.title}</h4>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(conflict.createdAt), { addSuffix: true })}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {positions.map((pos, index) => (
                <div 
                  key={pos.agentId}
                  className={`p-3 rounded-lg ${index === 0 ? 'bg-red-50' : 'bg-blue-50'}`}
                >
                  <p className={`text-sm font-medium ${index === 0 ? 'text-red-800' : 'text-blue-800'}`}>
                    {pos.agentName} Recommendation
                  </p>
                  <p className={`text-sm mt-1 ${index === 0 ? 'text-red-700' : 'text-blue-700'}`}>
                    "{pos.position}"
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                onClick={() => handleResolve("auto")}
                disabled={resolveConflictMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                <Gavel className="h-4 w-4 mr-2" />
                Auto-Resolve
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResolve("escalate")}
                disabled={resolveConflictMutation.isPending}
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Escalate to CEO
              </Button>
              
              <Button
                size="sm"
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
