import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Target,
  BarChart3,
  RefreshCw,
  Play,
  ArrowRight,
  Zap
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  currentTasks: number;
  maxCapacity: number;
  utilizationRate: number;
  status: "optimal" | "overloaded" | "underutilized";
  priority: "low" | "medium" | "high" | "critical";
  workload: Array<{
    task: string;
    effort: number;
    priority: "low" | "medium" | "high" | "critical";
  }>;
}

interface RebalancingSuggestion {
  id: string;
  type: string;
  fromAgent: string;
  toAgent: string;
  task: string;
  effort: number;
  impact: string;
  reasoning: string;
}

interface WorkloadData {
  totalCapacity: number;
  currentLoad: number;
  overloadedAgents: number;
  systemEfficiency: number;
  agents: Agent[];
  rebalancingSuggestions: RebalancingSuggestion[];
  capacityPlanning: {
    nextWeek: {
      estimatedTasks: number;
      availableCapacity: number;
      utilizationForecast: number;
    };
    nextMonth: {
      estimatedTasks: number;
      availableCapacity: number;
      utilizationForecast: number;
    };
  };
}

export default function WorkloadsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workloadData, isLoading } = useQuery<WorkloadData>({
    queryKey: ['/api/workloads'],
    refetchInterval: 30000,
  });

  const initializeWorkloadsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/workloads/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to initialize workloads');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workloads'] });
      toast({
        title: "Workloads Initialized",
        description: "Agent workloads have been set up successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize workloads",
        variant: "destructive",
      });
    },
  });

  const updateWorkloadsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/workloads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update workloads');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workloads'] });
      toast({
        title: "Workloads Updated",
        description: "Agent workload data has been refreshed",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update workloads",
        variant: "destructive",
      });
    },
  });

  const rebalanceMutation = useMutation({
    mutationFn: async (suggestion: RebalancingSuggestion) => {
      const response = await fetch('/api/workloads/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          fromAgent: suggestion.fromAgent,
          toAgent: suggestion.toAgent,
          task: suggestion.task,
          effort: suggestion.effort,
        }),
      });
      if (!response.ok) throw new Error('Failed to rebalance workloads');
      return response.json();
    },
    onSuccess: (data, suggestion) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workloads'] });
      toast({
        title: "Workload Rebalanced",
        description: `Task "${suggestion.task}" moved from ${suggestion.fromAgent} to ${suggestion.toAgent}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to rebalance workloads",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-green-500';
      case 'overloaded': return 'bg-red-500';
      case 'underutilized': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      optimal: 'bg-green-100 text-green-800',
      overloaded: 'bg-red-100 text-red-800', 
      underutilized: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatUtilization = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading workload data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="workloads-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workload Management
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor and optimize agent task distribution
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={() => updateWorkloadsMutation.mutate()}
            disabled={updateWorkloadsMutation.isPending}
            variant="outline"
            data-testid="update-workloads-button"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${updateWorkloadsMutation.isPending ? 'animate-spin' : ''}`} />
            Update Workloads
          </Button>
          <Button 
            onClick={() => initializeWorkloadsMutation.mutate()}
            disabled={initializeWorkloadsMutation.isPending}
            data-testid="initialize-workloads-button"
          >
            <Play className="w-4 h-4 mr-2" />
            Initialize
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="total-capacity-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Capacity
                </p>
                <p className="text-2xl font-bold" data-testid="total-capacity-value">
                  {workloadData?.totalCapacity || 0}
                </p>
                <p className="text-xs text-gray-500">Maximum tasks</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="current-load-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Current Load
                </p>
                <p className="text-2xl font-bold" data-testid="current-load-value">
                  {workloadData?.currentLoad || 0}
                </p>
                <p className="text-xs text-gray-500">Active tasks</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="overloaded-agents-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overloaded Agents
                </p>
                <p className="text-2xl font-bold text-red-600" data-testid="overloaded-agents-value">
                  {workloadData?.overloadedAgents || 0}
                </p>
                <p className="text-xs text-gray-500">Need rebalancing</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="system-efficiency-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  System Efficiency
                </p>
                <p className="text-2xl font-bold text-green-600" data-testid="system-efficiency-value">
                  {workloadData?.systemEfficiency 
                    ? `${(workloadData.systemEfficiency * 100).toFixed(0)}%`
                    : '0%'
                  }
                </p>
                <p className="text-xs text-gray-500">Overall utilization</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Agent Workload Distribution</TabsTrigger>
          <TabsTrigger value="balance">Workload Balance Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Agent Status</TabsTrigger>
          <TabsTrigger value="suggestions">Rebalancing Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current tasks vs capacity for each agent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workloadData?.agents?.map((agent) => (
                  <div key={agent.id} className="space-y-2" data-testid={`agent-${agent.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                        <span className="font-medium">{agent.name}</span>
                        <Badge className={getStatusBadge(agent.status)}>
                          {agent.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {agent.currentTasks}/{agent.maxCapacity} tasks ({formatUtilization(agent.utilizationRate)})
                      </div>
                    </div>
                    <Progress 
                      value={Math.min((agent.currentTasks / agent.maxCapacity) * 100, 100)}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution of agent workload states</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workloadData?.agents && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {workloadData.agents.filter(a => a.status === 'optimal').length}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">Optimal</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {workloadData.agents.filter(a => a.status === 'overloaded').length}
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">Overloaded</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {workloadData.agents.filter(a => a.status === 'underutilized').length}
                      </div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">Underutilized</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workloadData?.agents?.map((agent) => (
              <Card key={agent.id} data-testid={`agent-detail-${agent.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge className={getStatusBadge(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {agent.currentTasks} tasks • {formatUtilization(agent.utilizationRate)} utilization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress 
                      value={Math.min((agent.currentTasks / agent.maxCapacity) * 100, 100)}
                      className="h-2"
                    />
                    <div className="space-y-2">
                      {agent.workload?.slice(0, 3).map((task, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="truncate">{task.task}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                            <span className="text-gray-500">{task.effort}</span>
                          </div>
                        </div>
                      ))}
                      {agent.workload?.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{agent.workload.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended task redistributions</CardTitle>
              <CardDescription>
                Optimize workload distribution across agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workloadData?.rebalancingSuggestions?.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Well Balanced! No rebalancing needed at this time.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {workloadData?.rebalancingSuggestions?.map((suggestion) => (
                    <div 
                      key={suggestion.id}
                      className="border rounded-lg p-4 space-y-3"
                      data-testid={`suggestion-${suggestion.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Move: {suggestion.task}</h4>
                          <p className="text-sm text-gray-600">
                            {suggestion.fromAgent} <ArrowRight className="inline w-4 h-4 mx-2" /> {suggestion.toAgent}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {suggestion.impact} impact
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {suggestion.effort} effort
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {suggestion.reasoning}
                      </p>
                      <Button
                        onClick={() => rebalanceMutation.mutate(suggestion)}
                        disabled={rebalanceMutation.isPending}
                        size="sm"
                        data-testid={`rebalance-${suggestion.id}`}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Apply Rebalancing
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Capacity Planning */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-4">Capacity Planning</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Next Week:</span>
                      <span className="text-sm text-gray-600">
                        {workloadData?.capacityPlanning?.nextWeek?.estimatedTasks || 0} tasks
                      </span>
                    </div>
                    <Progress 
                      value={(workloadData?.capacityPlanning?.nextWeek?.utilizationForecast || 0) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Next Month:</span>
                      <span className="text-sm text-gray-600">
                        {workloadData?.capacityPlanning?.nextMonth?.estimatedTasks || 0} tasks
                      </span>
                    </div>
                    <Progress 
                      value={(workloadData?.capacityPlanning?.nextMonth?.utilizationForecast || 0) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}