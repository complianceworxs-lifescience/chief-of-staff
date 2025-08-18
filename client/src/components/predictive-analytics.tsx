import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

  // Mock predictions based on current system state
  const predictions: ConflictPrediction[] = [
    {
      id: "pred-1",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Action Executed",
        description: "Resolution action has been triggered successfully."
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