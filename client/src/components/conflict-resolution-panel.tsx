import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  Settings, 
  RefreshCw, 
  Target,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ConflictData {
  id: string;
  title: string;
  area: string;
  agents: string[];
  riskScore: number;
  reasoning: string;
  suggestedActions: string[];
}

interface ConflictResolutionPanelProps {
  conflict: ConflictData;
  onResolve: () => void;
}

export function ConflictResolutionPanel({ conflict, onResolve }: ConflictResolutionPanelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [priorityWeights, setPriorityWeights] = useState({
    revenue: 50,
    marketing: 30,
    content: 20
  });

  const handleResolution = async (strategy: string) => {
    setIsLoading(true);
    try {
      let result;
      
      switch (strategy) {
        case 'priority-rules':
          result = await apiRequest('POST', '/api/conflicts/resolve', {
            action: 'auto-resolve',
            predictionId: conflict.id,
            priorityWeights,
            strategy: 'priority-based'
          });
          toast({
            title: "Priority Rules Applied",
            description: `Conflict resolved using Revenue (${priorityWeights.revenue}%), Marketing (${priorityWeights.marketing}%), Content (${priorityWeights.content}%) weighting`,
          });
          break;
          
        case 'auto-reallocation':
          result = await apiRequest('POST', '/api/workflows/execute', {
            workflow: 'Resource Reallocation',
            targetAgents: conflict.agents,
            conflictId: conflict.id
          });
          toast({
            title: "Resources Reallocated",
            description: "COO Agent initiated resource shuffle to resolve bottleneck",
          });
          break;
          
        case 'workflow-optimization':
          result = await apiRequest('POST', '/api/workflows/execute', {
            workflow: 'Workflow Optimization',
            targetAgents: ['coo'],
            conflictId: conflict.id
          });
          toast({
            title: "Workflow Optimized", 
            description: "COO Agent restructuring queue to eliminate conflict",
          });
          break;
          
        case 'escalate-ceo':
          result = await apiRequest('POST', '/api/conflicts/resolve', {
            action: 'escalate',
            predictionId: conflict.id,
            targetAgent: 'ceo',
            reason: 'User-initiated executive escalation'
          });
          toast({
            title: "Escalated to CEO",
            description: "Conflict moved to CEO Agent for executive decision",
          });
          break;
      }
      
      onResolve();
      setShowPanel(false);
    } catch (error) {
      toast({
        title: "Resolution Failed",
        description: "Unable to execute conflict resolution. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getAgentName = (agentId: string) => {
    const agentMap: Record<string, string> = {
      'ceo': 'CEO Agent',
      'cro': 'CRO Agent',
      'cmo': 'CMO Agent',
      'coo': 'COO Agent',
      'content-manager': 'Content Manager',
      'market-intelligence': 'Market Intelligence'
    };
    return agentMap[agentId] || agentId.toUpperCase();
  };

  return (
    <Card className="border-orange-200 bg-orange-50" data-testid={`conflict-card-${conflict.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg text-orange-800">{conflict.title}</CardTitle>
            <Badge className={`${getRiskColor(conflict.riskScore)} font-medium`}>
              Risk: {conflict.riskScore}%
            </Badge>
          </div>
          
          <Dialog open={showPanel} onOpenChange={setShowPanel}>
            <DialogTrigger asChild>
              <Button 
                variant="default" 
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
                data-testid={`button-resolve-conflict-${conflict.id}`}
              >
                <Settings className="h-4 w-4 mr-1" />
                Resolve Conflict
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Conflict Resolution Center
                </DialogTitle>
                <DialogDescription>
                  {conflict.reasoning}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Affected Agents */}
                <div>
                  <h4 className="font-medium mb-2">Affected Agents</h4>
                  <div className="flex gap-2">
                    {conflict.agents.map(agent => (
                      <Badge key={agent} variant="outline">
                        {getAgentName(agent)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Priority Rules Engine */}
                <div>
                  <h4 className="font-medium mb-3">Priority Weighting</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-4 w-4" />
                          Revenue Priority
                        </span>
                        <span className="font-medium">{priorityWeights.revenue}%</span>
                      </div>
                      <Slider
                        value={[priorityWeights.revenue]}
                        onValueChange={([value]) => setPriorityWeights(prev => ({
                          ...prev,
                          revenue: value,
                          marketing: Math.round((100 - value) * prev.marketing / (prev.marketing + prev.content)),
                          content: Math.round((100 - value) * prev.content / (prev.marketing + prev.content))
                        }))}
                        max={100}
                        step={5}
                        className="w-full"
                        data-testid="slider-revenue-priority"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-1 text-sm">
                          <TrendingUp className="h-4 w-4" />
                          Marketing Priority
                        </span>
                        <span className="font-medium">{priorityWeights.marketing}%</span>
                      </div>
                      <Slider
                        value={[priorityWeights.marketing]}
                        onValueChange={([value]) => setPriorityWeights(prev => ({
                          revenue: Math.round((100 - value) * prev.revenue / (prev.revenue + prev.content)),
                          marketing: value,
                          content: Math.round((100 - value) * prev.content / (prev.revenue + prev.content))
                        }))}
                        max={100}
                        step={5}
                        className="w-full"
                        data-testid="slider-marketing-priority"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          Content Priority
                        </span>
                        <span className="font-medium">{priorityWeights.content}%</span>
                      </div>
                      <Slider
                        value={[priorityWeights.content]}
                        onValueChange={([value]) => setPriorityWeights(prev => ({
                          revenue: Math.round((100 - value) * prev.revenue / (prev.revenue + prev.marketing)),
                          marketing: Math.round((100 - value) * prev.marketing / (prev.revenue + prev.marketing)),
                          content: value
                        }))}
                        max={100}
                        step={5}
                        className="w-full"
                        data-testid="slider-content-priority"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Resolution Strategies */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleResolution('priority-rules')}
                    disabled={isLoading}
                    className="flex items-center gap-2 h-auto p-3 justify-start"
                    data-testid="button-apply-priority-rules"
                  >
                    <Target className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Apply Priority Rules</div>
                      <div className="text-xs text-gray-500">Use weighting above</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleResolution('auto-reallocation')}
                    disabled={isLoading}
                    className="flex items-center gap-2 h-auto p-3 justify-start"
                    data-testid="button-auto-reallocation"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Auto-Reallocation</div>
                      <div className="text-xs text-gray-500">Redistribute resources</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleResolution('workflow-optimization')}
                    disabled={isLoading}
                    className="flex items-center gap-2 h-auto p-3 justify-start"
                    data-testid="button-workflow-optimization"
                  >
                    <Settings className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Workflow Optimization</div>
                      <div className="text-xs text-gray-500">Restructure queue</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleResolution('escalate-ceo')}
                    disabled={isLoading}
                    className="flex items-center gap-2 h-auto p-3 justify-start"
                    data-testid="button-escalate-ceo"
                  >
                    <ArrowRight className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Escalate to CEO</div>
                      <div className="text-xs text-gray-500">Executive override</div>
                    </div>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-sm">Area:</span> {conflict.area}
          </div>
          <div>
            <span className="font-medium text-sm">Reasoning:</span>
            <p className="text-sm text-gray-600 mt-1">{conflict.reasoning}</p>
          </div>
          
          {conflict.suggestedActions.length > 0 && (
            <div>
              <span className="font-medium text-sm">Suggested Actions:</span>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                {conflict.suggestedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}