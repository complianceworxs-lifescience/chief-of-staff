import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ZapIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon,
  XCircleIcon,
  TrendingUpIcon,
  ClockIcon,
  TargetIcon,
  ActivityIcon,
  PlayCircleIcon,
  BrainIcon
} from "lucide-react";

interface InterventionStats {
  totalInterventions: number;
  totalActions: number;
  completedActions: number;
  failedActions: number;
  successRate: number;
  lastInterventionAt: string | null;
}

interface InterventionAction {
  id: string;
  action: string;
  status: "pending" | "executing" | "completed" | "failed";
  executedAt?: string;
  impact?: string;
  result?: any;
}

interface InterventionHistory {
  predictionId: string;
  actions: InterventionAction[];
}

interface InterventionDashboard {
  stats: InterventionStats;
  recentInterventions: InterventionHistory[];
  systemStatus: {
    isActive: boolean;
    mode: string;
    lastScan: string;
  };
}

export function ActiveInterventionDashboard() {
  const { data: dashboard } = useQuery<InterventionDashboard>({
    queryKey: ['/api/intervention/dashboard'],
    refetchInterval: 5000,
  });

  const { data: stats } = useQuery<InterventionStats>({
    queryKey: ['/api/intervention/stats'],
    refetchInterval: 10000,
  });

  const handleTriggerIntervention = async () => {
    try {
      const response = await fetch('/api/intervention/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId: "manual_test_intervention",
          agents: ["CRO", "CMO", "Content Agent"],
          actions: [
            "Conduct comprehensive workflow review",
            "Reallocate resources to address bottlenecks"
          ]
        }),
      });
      
      if (response.ok) {
        console.log("Manual intervention triggered successfully");
      }
    } catch (error) {
      console.error('Failed to trigger intervention:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'executing': return <ActivityIcon className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'failed': return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'pending': return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangleIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'executing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6" data-testid="active-intervention-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="intervention-title">
            Active Intervention System
          </h2>
          <p className="text-gray-600 dark:text-gray-300" data-testid="intervention-description">
            Taking preventive action on conflict predictions - Not just reporting
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge 
            variant={dashboard?.systemStatus.isActive ? "default" : "outline"}
            data-testid="intervention-status-badge"
          >
            {dashboard?.systemStatus.isActive ? (
              <>
                <BrainIcon className="w-3 h-3 mr-1" />
                Active Intervention
              </>
            ) : (
              "Disabled"
            )}
          </Badge>
          
          <Button 
            onClick={handleTriggerIntervention}
            size="sm"
            data-testid="trigger-intervention-button"
          >
            <PlayCircleIcon className="w-4 h-4 mr-2" />
            Test Intervention
          </Button>
        </div>
      </div>

      {/* System Status */}
      {dashboard?.systemStatus && (
        <Card data-testid="intervention-system-status">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ZapIcon className="w-5 h-5 mr-2" />
              Intervention Engine Status
            </CardTitle>
            <CardDescription>
              Real-time prevention system actively monitoring and taking action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${dashboard.systemStatus.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="font-medium">System Status</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {dashboard.systemStatus.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <ActivityIcon className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Mode</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {dashboard.systemStatus.mode.replace('_', ' ')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">Last Scan</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(dashboard.systemStatus.lastScan)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Intervention Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="total-interventions-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Interventions
                </p>
                <p className="text-2xl font-bold" data-testid="total-interventions-value">
                  {stats?.totalInterventions || 0}
                </p>
              </div>
              <TargetIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="actions-executed-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Actions Executed
                </p>
                <p className="text-2xl font-bold" data-testid="actions-executed-value">
                  {stats?.totalActions || 0}
                </p>
              </div>
              <ZapIcon className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Completed: {stats?.completedActions || 0}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="success-rate-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Success Rate
                </p>
                <p className="text-2xl font-bold" data-testid="success-rate-value">
                  {stats?.successRate 
                    ? `${(stats.successRate * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <TrendingUpIcon className="w-8 h-8 text-green-500" />
            </div>
            <Progress 
              value={(stats?.successRate || 0) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card data-testid="last-intervention-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Last Intervention
                </p>
                <p className="text-lg font-bold" data-testid="last-intervention-value">
                  {stats?.lastInterventionAt 
                    ? formatTime(stats.lastInterventionAt)
                    : 'Never'
                  }
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Interventions */}
      {dashboard?.recentInterventions && dashboard.recentInterventions.length > 0 && (
        <Card data-testid="recent-interventions-card">
          <CardHeader>
            <CardTitle>Recent Interventions</CardTitle>
            <CardDescription>
              Latest actions taken by the intervention engine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.recentInterventions.map((intervention) => (
                <div 
                  key={intervention.predictionId}
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  data-testid={`intervention-${intervention.predictionId}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">
                      Prediction: {intervention.predictionId}
                    </h4>
                    <Badge variant="outline">
                      {intervention.actions.length} actions
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {intervention.actions.map((action) => (
                      <div 
                        key={action.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded"
                        data-testid={`action-${action.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(action.status)}
                          <div>
                            <p className="text-sm font-medium">{action.action}</p>
                            {action.impact && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {action.impact}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(action.status)}`} />
                          {action.executedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(action.executedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card data-testid="intervention-instructions">
        <CardHeader>
          <CardTitle>How Active Intervention Works</CardTitle>
          <CardDescription>
            Your Chief of Staff takes action, not just reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700 dark:text-green-400">✅ What It Does</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Monitors conflict predictions in real-time</li>
                <li>• Automatically executes workflow reviews</li>
                <li>• Reallocates resources to prevent bottlenecks</li>
                <li>• Implements priority-based task management</li>
                <li>• Initiates agent coordination sessions</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400">🎯 Intervention Triggers</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• High risk predictions (≥70%)</li>
                <li>• Multiple agents in conflict</li>
                <li>• Operational efficiency issues</li>
                <li>• Resource bottlenecks detected</li>
                <li>• Agent coordination breakdowns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}