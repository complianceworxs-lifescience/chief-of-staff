import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Target, Users, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function LiveMetricsDashboard() {
  const { data: objectives = [] } = useQuery({
    queryKey: ["/api/objectives"]
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["/api/agents"]
  });

  const { data: activeConflicts = [] } = useQuery({
    queryKey: ["/api/conflicts/active"]
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ["/api/system/metrics"]
  });

  // Calculate live metrics
  const objectivesAtRisk = objectives.filter((obj: any) => obj.progress < 50);
  const objectivesOnTrack = objectives.filter((obj: any) => obj.progress >= 75);
  const avgProgress = objectives.length > 0 
    ? objectives.reduce((sum: number, obj: any) => sum + obj.progress, 0) / objectives.length 
    : 0;

  const autonomyHealth = systemMetrics?.systemHealth || 0;
  const escalationsToday = activeConflicts.length;

  // Determine which agent is assigned to handle each objective
  const getAssignedAgent = (objective: any) => {
    const title = objective.title?.toLowerCase() || '';
    
    if (title.includes('revenue') || title.includes('mrr') || title.includes('sales')) {
      return { agent: 'CRO', fullName: 'Chief Revenue Officer', color: 'blue' };
    }
    if (title.includes('retention') || title.includes('customer') || title.includes('churn')) {
      return { agent: 'CCO', fullName: 'Chief Customer Officer', color: 'green' };
    }
    if (title.includes('marketing') || title.includes('content') || title.includes('reach')) {
      return { agent: 'CMO', fullName: 'Chief Marketing Officer', color: 'purple' };
    }
    if (title.includes('operation') || title.includes('efficiency') || title.includes('cost')) {
      return { agent: 'COO', fullName: 'Chief Operating Officer', color: 'orange' };
    }
    
    // Default assignment to Chief of Staff for unmatched objectives
    return { agent: 'COS', fullName: 'Chief of Staff', color: 'gray' };
  };

  return (
    <div className="space-y-6">
      {/* Live Metrics & Signals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Run Rate Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">
                  {Math.round(avgProgress)}%
                </span>
                <Badge className={avgProgress >= 75 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {avgProgress >= 75 ? "On Track" : "Needs Attention"}
                </Badge>
              </div>
              <Progress value={avgProgress} className="h-2" />
              <p className="text-sm text-gray-600">
                Average strategic progress across {objectives.length} objectives
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Autonomy Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">
                  {autonomyHealth}%
                </span>
                <div className="text-2xl">
                  {autonomyHealth >= 85 ? '🟢' : autonomyHealth >= 70 ? '🟡' : '🔴'}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>Auto-resolve ≥85%</span>
                <span>•</span>
                <span>MTTR &lt;5min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Escalations in Last 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">
                  {escalationsToday}
                </span>
                <Badge className={escalationsToday <= 5 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {escalationsToday <= 5 ? "Within Target" : "Above Target"}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Target: ≤5 escalations/day
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Controls for Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Strategic Objectives - Live Command Surface
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              Agent Actions Enabled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {objectives.map((objective: any) => (
              <div key={objective.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{objective.title}</h4>
                    <Badge className={
                      objective.progress >= 90 ? "bg-green-100 text-green-800" :
                      objective.progress >= 75 ? "bg-blue-100 text-blue-800" :
                      objective.progress >= 50 ? "bg-yellow-100 text-yellow-800" : 
                      "bg-red-100 text-red-800"
                    }>
                      {objective.progress}% Complete
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Agents: {objective.contributingAgents?.join(', ').toUpperCase()}</span>
                    <span>Updated: {formatDistanceToNow(new Date(objective.lastUpdate), { addSuffix: true })}</span>
                  </div>
                </div>
                
                {/* Agent Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  {objective.progress < 50 && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleResolveAction(objective.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEscalateAction(objective.id)}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Escalate
                      </Button>
                    </>
                  )}
                  {objective.progress >= 50 && objective.progress < 90 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleReassignAction('current', 'coo')}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Reassign
                    </Button>
                  )}
                  {objective.progress >= 90 && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exception Surfacing */}
      {objectivesAtRisk.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Exceptions Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {objectivesAtRisk.map((objective: any) => {
                const assignment = getAssignedAgent(objective);
                return (
                  <div key={objective.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-red-900">{objective.title}</h5>
                      <p className="text-sm text-red-700">
                        Progress: {objective.progress}% - Below 50% threshold
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={
                          assignment.color === 'blue' ? "bg-blue-100 text-blue-800 border-blue-200" :
                          assignment.color === 'green' ? "bg-green-100 text-green-800 border-green-200" :
                          assignment.color === 'purple' ? "bg-purple-100 text-purple-800 border-purple-200" :
                          assignment.color === 'orange' ? "bg-orange-100 text-orange-800 border-orange-200" :
                          "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Agent Assigned
                      </Badge>
                      <div className="text-right text-sm">
                        <div className="font-medium text-gray-900">{assignment.agent}</div>
                        <div className="text-xs text-gray-600">{assignment.fullName}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}