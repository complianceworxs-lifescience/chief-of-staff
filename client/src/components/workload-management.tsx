import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Activity, TrendingUp, AlertTriangle, Zap, BarChart3 } from "lucide-react";

interface AgentWorkload {
  id: string;
  agentId: string;
  currentTasks: number;
  capacity: number;
  utilizationRate: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
}

interface WorkloadDistribution {
  balanced: AgentWorkload[];
  overloaded: AgentWorkload[];
  underutilized: AgentWorkload[];
}

interface RebalanceAction {
  from: string;
  to: string;
  tasks: number;
  reasoning: string;
}

interface CapacityPlanning {
  totalCapacity: number;
  totalCurrentTasks: number;
  overallUtilization: number;
  projectedNeeds: {
    nextWeek: number;
    nextMonth: number;
  };
}

export function WorkloadManagement() {
  const { toast } = useToast();
  
  const { data: workloads, isLoading: isLoadingWorkloads } = useQuery<AgentWorkload[]>({
    queryKey: ['/api/workloads'],
    refetchInterval: 30000
  });

  const { data: distribution, isLoading: isLoadingDistribution } = useQuery<WorkloadDistribution>({
    queryKey: ['/api/workloads/distribution'],
    refetchInterval: 30000
  });

  const { data: rebalancing } = useQuery<{ actions: RebalanceAction[] }>({
    queryKey: ['/api/workloads/rebalancing'],
    refetchInterval: 60000
  });

  const { data: capacity } = useQuery<CapacityPlanning>({
    queryKey: ['/api/workloads/capacity'],
    refetchInterval: 60000
  });

  const initializeWorkloads = useMutation({
    mutationFn: () => apiRequest('POST', '/api/workloads/initialize'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workloads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workloads/distribution'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workloads/capacity'] });
      toast({
        title: "Workloads Initialized",
        description: "Agent workloads have been set up successfully"
      });
    },
    onError: (error: any) => {
      console.error('Initialize error:', error);
      toast({
        title: "Error",
        description: "Failed to initialize workloads. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateWorkloads = useMutation({
    mutationFn: () => apiRequest('POST', '/api/workloads/update'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workloads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workloads/distribution'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workloads/capacity'] });
      toast({
        title: "Workloads Updated",
        description: "Agent workloads have been refreshed"
      });
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update workloads. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate > 85) return 'text-red-600';
    if (rate < 60) return 'text-orange-600';
    return 'text-green-600';
  };

  const prepareChartData = () => {
    return workloads?.map(w => ({
      agent: w.agentId,
      current: w.currentTasks,
      capacity: w.capacity,
      utilization: w.utilizationRate
    })) || [];
  };

  const preparePieData = () => {
    if (!distribution) return [];
    return [
      { name: 'Balanced', value: distribution.balanced.length, color: '#10b981' },
      { name: 'Overloaded', value: distribution.overloaded.length, color: '#ef4444' },
      { name: 'Underutilized', value: distribution.underutilized.length, color: '#f59e0b' }
    ];
  };

  if (isLoadingWorkloads || isLoadingDistribution) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Workload Management</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => updateWorkloads.mutate()}
            disabled={updateWorkloads.isPending}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            {updateWorkloads.isPending ? 'Updating...' : 'Update Workloads'}
          </Button>
          <Button 
            onClick={() => initializeWorkloads.mutate()}
            disabled={initializeWorkloads.isPending}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {initializeWorkloads.isPending ? 'Initializing...' : 'Initialize'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacity?.totalCapacity || 0}</div>
            <p className="text-xs text-muted-foreground">Maximum tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Load</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacity?.totalCurrentTasks || 0}</div>
            <Progress value={capacity?.overallUtilization || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overloaded Agents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{distribution?.overloaded.length || 0}</div>
            <p className="text-xs text-muted-foreground">Need rebalancing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{capacity?.overallUtilization || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall utilization</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Workload Distribution</CardTitle>
            <CardDescription>Current tasks vs capacity for each agent</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="agent" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="current" fill="#8884d8" />
                <Bar dataKey="capacity" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workload Balance Overview</CardTitle>
            <CardDescription>Distribution of agent workload states</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={preparePieData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {preparePieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Individual Agent Status</CardTitle>
            <CardDescription>Detailed workload breakdown by agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {workloads?.map((workload) => (
                <div key={workload.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{workload.agentId}</span>
                      <Badge className={getPriorityColor(workload.priority)}>
                        {workload.priority}
                      </Badge>
                    </div>
                    <span className={`font-bold ${getUtilizationColor(workload.utilizationRate)}`}>
                      {workload.utilizationRate}%
                    </span>
                  </div>
                  <Progress value={workload.utilizationRate} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{workload.currentTasks} / {workload.capacity} tasks</span>
                    <span>Updated: {new Date(workload.lastUpdated).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rebalancing Suggestions</CardTitle>
            <CardDescription>Recommended task redistributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rebalancing?.actions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-medium text-green-600">Well Balanced!</h3>
                  <p className="text-sm text-muted-foreground">No rebalancing needed at this time.</p>
                </div>
              ) : (
                rebalancing?.actions.map((action, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            Move {action.tasks} tasks: {action.from} → {action.to}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{action.reasoning}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Capacity Planning</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Next Week:</span>
                    <div className="font-medium">{capacity?.projectedNeeds.nextWeek} tasks</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Next Month:</span>
                    <div className="font-medium">{capacity?.projectedNeeds.nextMonth} tasks</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}