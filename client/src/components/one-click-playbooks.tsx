import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Zap, 
  DollarSign, 
  FileSearch, 
  Settings,
  RefreshCw,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface Playbook {
  id: string;
  title: string;
  description: string;
  category: 'conflict' | 'revenue' | 'content' | 'optimization';
  estimatedTime: string;
  impact: 'low' | 'medium' | 'high';
  targetAgents: string[];
  actions: string[];
  successRate: number;
}

const playbooks: Playbook[] = [
  {
    id: 'resolve-agent-conflict',
    title: 'Resolve Agent Conflict',
    description: 'Triggers auto-priority rules + COO resource shuffle',
    category: 'conflict',
    estimatedTime: '5-10 min',
    impact: 'high',
    targetAgents: ['coo', 'all-agents'],
    actions: [
      'Apply priority weighting rules',
      'Analyze resource bottlenecks',
      'Redistribute workload via COO Agent',
      'Update agent task queues'
    ],
    successRate: 92
  },
  {
    id: 'accelerate-revenue-tasks',
    title: 'Accelerate Revenue Tasks',
    description: 'CRO Agent gets temporary resource boost',
    category: 'revenue',
    estimatedTime: '3-5 min',
    impact: 'high',
    targetAgents: ['cro', 'cmo', 'coo'],
    actions: [
      'Identify high-impact revenue tasks',
      'Allocate additional processing capacity to CRO',
      'Prioritize partnership and upsell initiatives',
      'Generate revenue acceleration report'
    ],
    successRate: 88
  },
  {
    id: 'audit-content-bottleneck',
    title: 'Audit Content Bottleneck',
    description: 'CMO Agent generates report + reorders backlog',
    category: 'content',
    estimatedTime: '10-15 min',
    impact: 'medium',
    targetAgents: ['cmo', 'content-manager'],
    actions: [
      'Analyze content pipeline bottlenecks',
      'Generate content performance audit',
      'Reorder backlog by strategic priority',
      'Optimize content creation workflow'
    ],
    successRate: 85
  },
  {
    id: 'system-optimization-sweep',
    title: 'System Optimization Sweep',
    description: 'Comprehensive efficiency analysis and automation',
    category: 'optimization',
    estimatedTime: '15-20 min',
    impact: 'high',
    targetAgents: ['coo', 'chief-of-staff'],
    actions: [
      'Run full system efficiency analysis',
      'Identify automation opportunities',
      'Optimize cross-agent workflows',
      'Update operational procedures'
    ],
    successRate: 90
  }
];

export function OneClickPlaybooks() {
  const { toast } = useToast();
  const [runningPlaybooks, setRunningPlaybooks] = useState<string[]>([]);
  const [completedPlaybooks, setCompletedPlaybooks] = useState<string[]>([]);
  
  // Get conflict data - maximum cost savings
  const { data: activeConflicts = [] } = useQuery<any[]>({
    queryKey: ["/api/conflicts/active"],
    refetchInterval: 7200000 // 2 hour intervals - unified polling schedule
  });
  
  const { data: resolvedConflicts = [] } = useQuery<any[]>({
    queryKey: ["/api/conflicts/resolved"],
    refetchInterval: 7200000 // 2 hour intervals - unified polling schedule
  });

  const handleRunPlaybook = async (playbook: Playbook) => {
    setRunningPlaybooks(prev => [...prev, playbook.id]);
    
    try {
      toast({
        title: "Playbook Starting",
        description: `Executing ${playbook.title}...`,
      });

      // Use the orchestrator endpoint that connects to the actual conflict system
      if (playbook.id === 'resolve-agent-conflict') {
        // Connect to the same conflict system the dashboard uses
        const response = await fetch("/api/playbooks/resolve-conflicts", { 
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-idempotency-key": crypto.randomUUID() 
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to resolve conflicts: ${response.status}`);
        }

        const data = await response.json();
        
        // Immediately invalidate queries to refresh dashboard
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['/api/conflicts/active'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/conflicts/resolved'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/conflicts/system-health'] })
        ]);

        toast({
          title: "Conflicts Resolved",
          description: `Resolved ${data.resolved} conflicts • ${data.remaining_active} remaining`,
        });

      } else {
        // For other playbooks, execute autonomy signals
        const signals = playbook.targetAgents.map(agent => ({
          agent,
          status: "degraded",
          metrics: { successRate: 0.65, alignment: 0.70 },
          context: { playbook: playbook.title, trigger: `manual-playbook-${playbook.id}` }
        }));

        const signalPromises = signals.map(signal => 
          fetch("/api/autonomy/execute", {
            method: "POST",
            body: JSON.stringify(signal),
            headers: { "Content-Type": "application/json" }
          })
        );

        const results = await Promise.all(signalPromises);
        const allSucceeded = results.every(res => res.ok);
        
        if (!allSucceeded) {
          throw new Error("Some agent executions failed");
        }

        toast({
          title: "Playbook Completed",
          description: `${playbook.title} executed - system rebalanced`,
        });
      }

      // Mark as completed
      setCompletedPlaybooks(prev => [...prev, playbook.id]);

      // Remove from completed after 8 seconds
      setTimeout(() => {
        setCompletedPlaybooks(prev => prev.filter(id => id !== playbook.id));
      }, 8000);
      
    } catch (error) {
      console.error("Playbook execution failed:", error);
      toast({
        title: "Playbook Failed",
        description: error instanceof Error ? error.message : "Execution failed",
        variant: "destructive"
      });
    } finally {
      setRunningPlaybooks(prev => prev.filter(id => id !== playbook.id));
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'conflict': return <AlertTriangle className="h-5 w-5" />;
      case 'revenue': return <DollarSign className="h-5 w-5" />;
      case 'content': return <FileSearch className="h-5 w-5" />;
      case 'optimization': return <Settings className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'conflict': return 'bg-red-100 text-red-600';
      case 'revenue': return 'bg-green-100 text-green-600';
      case 'content': return 'bg-purple-100 text-purple-600';
      case 'optimization': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card data-testid="one-click-playbooks">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          One-Click Strategic Playbooks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playbooks.map((playbook) => {
            const isRunning = runningPlaybooks.includes(playbook.id);
            const isCompleted = completedPlaybooks.includes(playbook.id);
            
            // Check if this playbook's conflict type has been resolved
            const recentResolution = resolvedConflicts.find((conflict: any) => 
              conflict.resolution?.includes('redistributed resources') ||
              conflict.resolution?.includes('priority weights') ||
              conflict.title?.includes('Resource Overallocation')
            );
            
            const isConflictResolved = playbook.id === 'resolve-agent-conflict' && 
              activeConflicts.length === 0 && 
              recentResolution;
            
            // Show resolved status for conflict playbooks
            const displayStatus = isConflictResolved ? 'resolved' : isCompleted ? 'completed' : isRunning ? 'running' : 'ready';
            
            return (
              <div
                key={playbook.id}
                className={`border rounded-lg p-4 transition-all ${
                  isConflictResolved ? 'bg-green-50 border-green-200' :
                  isCompleted ? 'bg-green-50 border-green-200' :
                  isRunning ? 'bg-blue-50 border-blue-200' : 
                  'bg-white border-gray-200 hover:border-gray-300'
                }`}
                data-testid={`playbook-card-${playbook.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getCategoryColor(playbook.category)}`}>
                      {getCategoryIcon(playbook.category)}
                    </div>
                    <div>
                      <h4 className="font-medium">{playbook.title}</h4>
                      {isConflictResolved && recentResolution ? (
                        <p className="text-sm text-green-700 font-medium">
                          ✅ Resolved: {recentResolution.resolution || 'Resource rebalancing completed'}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600">{playbook.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {isRunning && <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {playbook.estimatedTime}
                      </div>
                      <Badge className={getImpactColor(playbook.impact)}>
                        {playbook.impact.toUpperCase()} IMPACT
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{playbook.successRate}% success</span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={isConflictResolved ? 100 : isRunning ? 65 : isCompleted ? 100 : 0} 
                    className="h-2"
                  />
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleRunPlaybook(playbook)}
                        disabled={isRunning || isCompleted || isConflictResolved}
                        className="w-full"
                        variant={isCompleted || isConflictResolved ? "outline" : "default"}
                        data-testid={`button-run-playbook-${playbook.id}`}
                      >
                        {isConflictResolved ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            CONFLICT RESOLVED
                          </>
                        ) : isCompleted ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </>
                        ) : isRunning ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Run Playbook
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="font-medium mb-1">Actions:</p>
                        <ul className="text-xs space-y-1">
                          {playbook.actions.map((action, index) => (
                            <li key={index}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}