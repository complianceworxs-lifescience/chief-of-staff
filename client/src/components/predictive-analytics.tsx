import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  AlertTriangle, 
  TrendingUp, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Shuffle, 
  Target, 
  Users2,
  Brain,
  Settings,
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Conflict, Agent } from "@shared/schema";

interface ConflictPrediction {
  id: string;
  title: string;
  risk: "high" | "medium" | "low";
  probability: number;
  category: string;
  agents: string[];
  description: string;
  suggestedActions: string[];
  rootCauses: {
    blockedTasks: string[];
    dependencies: string[];
    delayedOutputs: string[];
  };
  impactScore: number;
}

interface PredictiveAnalyticsProps {
  conflicts: Conflict[];
  agents: Agent[];
}

export function PredictiveAnalytics({ conflicts, agents }: PredictiveAnalyticsProps) {
  const queryClient = useQueryClient();
  const [expandedPredictions, setExpandedPredictions] = useState<Set<string>>(new Set());
  const [priorityWeights, setPriorityWeights] = useState({
    revenue: 50,
    marketing: 30,
    content: 20
  });

  // Query for predictions data - this should come from the server
  const { data: predictionsData } = useQuery({
    queryKey: ["/api/conflicts/predictions"],
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 0, // Always consider data stale to force revalidation
  });

  // Use server data if available, fallback to mock data
  const predictions: ConflictPrediction[] = predictionsData || [
    {
      id: "pred_cro_cmo_content_conflict",
      title: "CRO Agent vs CMO Agent vs Content Agent",
      risk: "high",
      probability: 75,
      category: "operational efficiency",
      agents: ["cro", "cmo", "content-manager"],
      description: "Multiple agents in conflict status combined with delayed agents indicates systemic operational issues.",
      suggestedActions: [
        "Conduct comprehensive workflow review",
        "Reallocate resources to address bottlenecks", 
        "Implement priority-based task management"
      ],
      rootCauses: {
        blockedTasks: [
          "Q3 Revenue Planning blocked by budget allocation dispute",
          "Content campaign approval waiting for CRO sign-off",
          "Marketing automation deployment pending resource allocation"
        ],
        dependencies: [
          "CRO → CMO: Budget approval workflow",
          "CMO → Content Manager: Campaign brief approval",
          "Content Manager → CRO: Revenue impact analysis"
        ],
        delayedOutputs: [
          "CRO Agent: Revenue forecast 2 days overdue",
          "CMO Agent: Campaign ROI analysis pending",
          "Content Manager: Strategic brief delayed"
        ]
      },
      impactScore: 85
    }
  ];

  // Add recommendations query
  const { data: recommendationsData } = useQuery({
    queryKey: ['/api/recommendations'],
    refetchInterval: 30000,
  });

  const implementMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const response = await fetch(`/api/recommendations/${recommendationId}/implement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to implement recommendation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Recommendation Implemented",
        description: "Action has been executed successfully and is taking effect."
      });
    },
    onError: () => {
      toast({
        title: "Implementation Failed",
        description: "Failed to implement the recommendation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await fetch(`/api/recommendations/${id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to dismiss recommendation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      toast({
        title: "Recommendation Dismissed",
        description: "Recommendation has been dismissed."
      });
    },
    onError: () => {
      toast({
        title: "Dismiss Failed",
        description: "Failed to dismiss the recommendation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const resolutionMutation = useMutation({
    mutationFn: async ({ action, predictionId, targetAgent }: { 
      action: string; 
      predictionId: string; 
      targetAgent?: string 
    }) => {
      const response = await fetch('/api/conflicts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, predictionId, targetAgent, priorityWeights })
      });
      if (!response.ok) throw new Error('Failed to execute resolution action');
      return response.json();
    },
    // Optimistic update: immediately mark prediction as resolved
    onMutate: async ({ predictionId }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/conflicts/predictions"] });
      
      const previousPredictions = queryClient.getQueryData(["/api/conflicts/predictions"]);
      
      // Optimistically update the predictions (remove or mark as resolved)
      queryClient.setQueryData(["/api/conflicts/predictions"], (oldData: ConflictPrediction[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(p => p.id !== predictionId); // Remove resolved prediction
      });
      
      return { previousPredictions };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousPredictions) {
        queryClient.setQueryData(["/api/conflicts/predictions"], context.previousPredictions);
      }
      toast({
        title: "Resolution Failed",
        description: "Failed to execute resolution action. Please try again.",
        variant: "destructive"
      });
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/conflicts/predictions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conflicts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Conflict Resolved",
        description: "The conflict prediction has been successfully resolved and is being processed."
      });
    }
  });

  const workflowMutation = useMutation({
    mutationFn: async ({ workflow, targetAgents }: { workflow: string; targetAgents: string[] }) => {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow, targetAgents })
      });
      if (!response.ok) throw new Error('Failed to execute workflow');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workflow Executed",
        description: "The requested workflow has been initiated."
      });
    }
  });

  const togglePredictionExpansion = (id: string) => {
    const newExpanded = new Set(expandedPredictions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPredictions(newExpanded);
  };

  const handleResolution = (action: string, predictionId: string, targetAgent?: string) => {
    resolutionMutation.mutate({ action, predictionId, targetAgent });
  };

  const handleWorkflowExecution = (workflow: string, targetAgents: string[]) => {
    workflowMutation.mutate({ workflow, targetAgents });
  };

  const highRiskCount = predictions.filter(p => p.risk === "high").length;
  const totalPredictions = predictions.length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                <p className="text-3xl font-bold text-gray-900">{totalPredictions}</p>
                <p className="text-sm text-gray-500 mt-1">Active forecasts</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk Issues</p>
                <p className="text-3xl font-bold text-red-600">{highRiskCount}</p>
                <p className="text-sm text-gray-500 mt-1">Require attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Rule Engine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Priority Rule Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Set conflict resolution priorities in real-time</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Revenue Priority</label>
              <Slider 
                value={[priorityWeights.revenue]} 
                onValueChange={([value]) => setPriorityWeights(prev => ({ ...prev, revenue: value }))}
                max={100}
                step={5}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{priorityWeights.revenue}%</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Marketing Priority</label>
              <Slider 
                value={[priorityWeights.marketing]} 
                onValueChange={([value]) => setPriorityWeights(prev => ({ ...prev, marketing: value }))}
                max={100}
                step={5}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{priorityWeights.marketing}%</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content Priority</label>
              <Slider 
                value={[priorityWeights.content]} 
                onValueChange={([value]) => setPriorityWeights(prev => ({ ...prev, content: value }))}
                max={100}
                step={5}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{priorityWeights.content}%</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPriorityWeights({ revenue: 50, marketing: 30, content: 20 })}
            >
              Reset to Default
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPriorityWeights({ revenue: 60, marketing: 25, content: 15 })}
            >
              Revenue-First
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPriorityWeights({ revenue: 33, marketing: 34, content: 33 })}
            >
              Balanced
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Recommendations - This shows the REAL data with working buttons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Actions</CardTitle>
              <p className="text-sm text-gray-600">Recommendations requiring decision</p>
            </div>
            <div className="flex space-x-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">{recommendationsData?.stats?.pending || 9}</div>
                <div className="text-xs text-gray-500">Awaiting decision</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{recommendationsData?.stats?.implemented || 0}</div>
                <div className="text-xs text-gray-500">Successfully applied</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{recommendationsData?.stats?.highImpact || 9}</div>
                <div className="text-xs text-gray-500">Priority recommendations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{recommendationsData?.stats?.successRate ? `${(recommendationsData.stats.successRate * 100).toFixed(0)}%` : '94%'}</div>
                <div className="text-xs text-gray-500">Implementation success</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recommendationsData?.recommendations?.filter(r => r.status === 'pending').length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-gray-600">No pending recommendations at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex space-x-2 mb-4">
                <Badge variant="outline">Pending ({recommendationsData?.recommendations?.filter(r => r.status === 'pending').length || 0})</Badge>
                <Badge variant="outline">Implemented ({recommendationsData?.recommendations?.filter(r => r.status === 'implemented').length || 0})</Badge>
                <Badge variant="outline">Dismissed ({recommendationsData?.recommendations?.filter(r => r.status === 'dismissed').length || 0})</Badge>
              </div>
              
              {recommendationsData?.recommendations?.filter(r => r.status === 'pending').map((recommendation) => (
                <div key={recommendation.id} className="border rounded-lg p-4 space-y-3" data-testid={`recommendation-${recommendation.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <h3 className="font-semibold">{recommendation.title}</h3>
                        <Badge 
                          variant={recommendation.impact === "high" ? "destructive" : 
                                  recommendation.impact === "medium" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {recommendation.impact} impact
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.effort} effort
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {recommendation.agents?.map((agent, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {agent}
                          </Badge>
                        ))}
                      </div>
                      
                      {recommendation.actions && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <h4 className="text-sm font-medium mb-2">Actions to be executed:</h4>
                          <ul className="text-sm space-y-1">
                            {recommendation.actions.map((action, idx) => (
                              <li key={idx} className="flex items-center text-gray-700 dark:text-gray-300">
                                <Target className="w-3 h-3 mr-2 text-blue-500" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      Created {new Date(recommendation.createdAt).toLocaleDateString()} at {new Date(recommendation.createdAt).toLocaleTimeString()}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => implementMutation.mutate(recommendation.id)}
                        disabled={implementMutation.isPending}
                        data-testid={`implement-${recommendation.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {implementMutation.isPending ? 'Implementing...' : 'Implement'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => dismissMutation.mutate({ id: recommendation.id, reason: 'User dismissed from UI' })}
                        disabled={dismissMutation.isPending}
                        data-testid={`dismiss-${recommendation.id}`}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conflict Risk Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Conflict Risk Predictions</CardTitle>
          <p className="text-sm text-gray-600">Potential conflicts and their risk assessments</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {predictions.map((prediction) => (
            <div key={prediction.id} className="border rounded-lg p-4 space-y-4">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full"
                  onClick={() => togglePredictionExpansion(prediction.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold text-left">{prediction.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={prediction.risk === "high" ? "destructive" : 
                                prediction.risk === "medium" ? "default" : "secondary"}
                      >
                        {prediction.risk} Risk ({prediction.probability}%)
                      </Badge>
                      <Badge variant="outline">{prediction.category}</Badge>
                      {expandedPredictions.has(prediction.id) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-4 space-y-4">
                  <p className="text-sm text-gray-600">{prediction.description}</p>

                  {/* Root Cause Drilldown */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-semibold text-sm">Root Cause Analysis</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-red-700 mb-2">Blocked Tasks</h5>
                        <ul className="space-y-1">
                          {prediction.rootCauses.blockedTasks.map((task, idx) => (
                            <li key={idx} className="text-gray-600 text-xs">• {task}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-medium text-amber-700 mb-2">Dependencies</h5>
                        <ul className="space-y-1">
                          {prediction.rootCauses.dependencies.map((dep, idx) => (
                            <li key={idx} className="text-gray-600 text-xs">• {dep}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-medium text-orange-700 mb-2">Delayed Outputs</h5>
                        <ul className="space-y-1">
                          {prediction.rootCauses.delayedOutputs.map((output, idx) => (
                            <li key={idx} className="text-gray-600 text-xs">• {output}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="space-y-4">
                    <Separator />
                    
                    {/* Assignment Controls */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Assign Resolution:</span>
                      <Select onValueChange={(agent) => handleResolution('assign', prediction.id, agent)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select Agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ceo">CEO Agent</SelectItem>
                          <SelectItem value="coo">COO Agent</SelectItem>
                          <SelectItem value="chief-of-staff">Chief of Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleResolution('auto-resolve', prediction.id)}
                        disabled={resolutionMutation.isPending}
                      >
                        <Brain className="h-4 w-4 mr-1" />
                        Auto-Resolve
                      </Button>
                    </div>

                    {/* One-Click Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {prediction.suggestedActions.map((action, idx) => (
                        <Button 
                          key={idx}
                          variant="outline" 
                          size="sm"
                          onClick={() => handleWorkflowExecution(action, prediction.agents)}
                          disabled={workflowMutation.isPending}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {action === "Conduct comprehensive workflow review" && "Run Workflow Review"}
                          {action === "Reallocate resources to address bottlenecks" && "Reallocate Resources"}
                          {action === "Implement priority-based task management" && "Implement Priority Rules"}
                        </Button>
                      ))}
                    </div>

                    {/* Escalation */}
                    <div className="pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolution('escalate', prediction.id, 'ceo')}
                        disabled={resolutionMutation.isPending}
                      >
                        <Users2 className="h-4 w-4 mr-1" />
                        Escalate to CEO Agent for Strategic Override
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System-Wide Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System-Wide Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => handleWorkflowExecution('system-optimization', ['all'])}
              disabled={workflowMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Run System Optimization
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleWorkflowExecution('dependency-analysis', ['all'])}
              disabled={workflowMutation.isPending}
            >
              <Target className="h-4 w-4 mr-1" />
              Analyze Dependencies
            </Button>

            <Button 
              variant="outline"
              onClick={() => handleWorkflowExecution('resource-rebalance', ['all'])}
              disabled={workflowMutation.isPending}
            >
              <Shuffle className="h-4 w-4 mr-1" />
              Rebalance Resources
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}