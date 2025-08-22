import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type BusinessGoal = {
  id: string;
  title: string;
  description: string;
  targetValue: string;
  currentValue: string;
  deadline: string;
  priority: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export default function StrategicObjectivesPage() {
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery<BusinessGoal[]>({
    queryKey: ["/api/objectives"],
    select: (data: any[]) => data.map(obj => ({
      id: obj.id,
      title: obj.title,
      description: `Strategic objective targeting ${obj.progress}% completion`,
      targetValue: "100%",
      currentValue: `${obj.progress}%`,
      deadline: obj.lastUpdate || new Date().toISOString(),
      priority: obj.progress > 75 ? "high" : obj.progress > 50 ? "medium" : "low",
      status: obj.progress >= 90 ? "completed" : obj.progress >= 75 ? "on-track" : obj.progress >= 50 ? "in-progress" : "at-risk",
      category: "strategic",
      createdAt: obj.lastUpdate || new Date().toISOString(),
      updatedAt: obj.lastUpdate || new Date().toISOString()
    }))
  });

  const executeOverdueGoalsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', "/api/strategic/execute-overdue");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/actions/recent"] });
      console.log(`✅ Strategic Executor: ${data.actions_created} agents auto-assigned to overdue goals`);
    }
  });

  const calculateProgress = (current: string, target: string) => {
    const currentNum = parseFloat(current.replace(/[^0-9.]/g, '')) || 0;
    const targetNum = parseFloat(target.replace(/[^0-9.]/g, '')) || 1;
    return Math.min(100, Math.round((currentNum / targetNum) * 100));
  };

  const getRiskLevel = (goal: BusinessGoal) => {
    const progress = calculateProgress(goal.currentValue, goal.targetValue);
    const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (progress < 30 && daysLeft < 30) return 'high';
    if (progress < 50 && daysLeft < 60) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading goals...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strategic Objectives</h1>
          <p className="text-gray-600 mt-2">Define high-level outcomes that generate agent directives</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => executeOverdueGoalsMutation.mutate()}
            disabled={executeOverdueGoalsMutation.isPending}
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
            data-testid="button-auto-assign-agents"
          >
            {executeOverdueGoalsMutation.isPending ? "Executing..." : "🎯 Auto-Assign Agents"}
          </Button>
          <Button data-testid="button-add-objective">
            <Plus className="h-4 w-4 mr-2" />
            Add Objective
          </Button>
        </div>
      </div>

      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-goals">{goals.length}</div>
            <p className="text-xs text-muted-foreground">
              {goals.filter(g => g.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-high-priority">
              {goals.filter(g => g.priority === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Critical objectives</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-at-risk">
              {goals.filter(g => getRiskLevel(g) === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentValue, goal.targetValue);
          const riskLevel = getRiskLevel(goal);
          const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <Card key={goal.id} className="relative" data-testid={`card-goal-${goal.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg" data-testid={`text-goal-title-${goal.id}`}>{goal.title}</CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(goal.priority)} data-testid={`badge-priority-${goal.id}`}>
                      {goal.priority}
                    </Badge>
                    <div className={`w-3 h-3 rounded-full ${getRiskColor(riskLevel)}`} title={`${riskLevel} risk`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span data-testid={`text-progress-${goal.id}`}>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{goal.currentValue}</span>
                    <span>{goal.targetValue}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <Badge variant="outline" className="capitalize">
                    {goal.category}
                  </Badge>
                  <span className={`${daysLeft < 30 ? 'text-red-600' : 'text-gray-600'}`} data-testid={`text-deadline-${goal.id}`}>
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first business goal to track progress.</p>
            <Button data-testid="button-create-first-goal">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}