import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Gavel, ArrowUp, Eye, Clock, Users } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Conflict } from "@shared/schema";

interface ExtendedConflict extends Conflict {
  resolutionHistory?: Array<{ timestamp: string; action: string }>;
}

interface ConflictCardProps {
  conflict: ExtendedConflict;
}

export function ConflictCard({ conflict }: ConflictCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
              
              <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      {conflict.title}
                    </DialogTitle>
                    <DialogDescription>
                      Detailed conflict information and agent positions
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Conflict Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Created</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(conflict.createdAt), 'PPpp')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Agents Involved</p>
                          <p className="text-sm text-gray-600">
                            {Object.keys(conflict.positions).length} agents
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={conflict.status === 'active' ? 'destructive' : 'secondary'}>
                          {conflict.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Agent Positions */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Agent Positions</h4>
                      <div className="space-y-4">
                        {positions.map((pos, index) => (
                          <Card key={pos.agentId} className={`border-l-4 ${index === 0 ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className={`font-medium ${index === 0 ? 'text-red-800' : 'text-blue-800'}`}>
                                    {pos.agentName}
                                  </h5>
                                  <p className="text-gray-700 mt-2 text-sm leading-relaxed">
                                    "{pos.position}"
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    {/* Resolution History */}
                    {conflict.resolutionHistory && conflict.resolutionHistory.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Resolution History</h4>
                        <div className="space-y-2">
                          {conflict.resolutionHistory.map((entry, index) => (
                            <div key={index} className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              <span className="font-medium">{format(new Date(entry.timestamp), 'PPp')}:</span> {entry.action}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Resolution Actions */}
                    <div className="border-t pt-4">
                      <h4 className="text-lg font-semibold mb-4">Resolution Actions</h4>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            handleResolve("auto");
                            setIsDetailsOpen(false);
                          }}
                          disabled={resolveConflictMutation.isPending}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Gavel className="h-4 w-4 mr-2" />
                          Auto-Resolve
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleResolve("escalate");
                            setIsDetailsOpen(false);
                          }}
                          disabled={resolveConflictMutation.isPending}
                        >
                          <ArrowUp className="h-4 w-4 mr-2" />
                          Escalate to CEO
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
