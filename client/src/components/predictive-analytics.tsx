import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { AlertTriangle, TrendingUp, Clock, Shield } from "lucide-react";

interface ConflictPrediction {
  id: string;
  agents: string[];
  riskScore: number;
  area: string;
  reasoning: string;
  suggestedActions: string[];
  status: string;
  createdAt: string;
}

interface PerformanceTrends {
  dates: string[];
  successRate: number[];
  collaborationScore: number[];
  tasksCompleted: number[];
}

export function PredictiveAnalytics() {
  const { data: predictions, isLoading: isLoadingPredictions } = useQuery<ConflictPrediction[]>({
    queryKey: ['/api/analytics/predictions'],
    refetchInterval: 60000
  });

  const { data: ceoTrends } = useQuery<PerformanceTrends>({
    queryKey: ['/api/analytics/performance/ceo'],
    refetchInterval: 300000
  });

  const { data: croTrends } = useQuery<PerformanceTrends>({
    queryKey: ['/api/analytics/performance/cro'],
    refetchInterval: 300000
  });

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  const prepareTrendData = (trends: PerformanceTrends | undefined) => {
    if (!trends) return [];
    return trends.dates.map((date, index) => ({
      date: new Date(date).toLocaleDateString(),
      successRate: trends.successRate[index],
      collaboration: trends.collaborationScore[index],
      tasks: trends.tasksCompleted[index]
    }));
  };

  if (isLoadingPredictions) {
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

  const highRiskPredictions = predictions?.filter(p => p.riskScore >= 70) || [];
  const avgRiskScore = predictions && predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Predictive Analytics</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Real-time monitoring
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active forecasts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highRiskPredictions.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgRiskScore)}</div>
            <Progress value={avgRiskScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prevention Rate</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">87%</div>
            <p className="text-xs text-muted-foreground">Conflicts prevented</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conflict Risk Predictions</CardTitle>
            <CardDescription>Potential conflicts and their risk assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {predictions?.map((prediction) => (
                <Alert key={prediction.id} className="border-l-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {prediction.agents.join(' vs ')}
                          </span>
                          <Badge className={getRiskColor(prediction.riskScore)}>
                            {getRiskLevel(prediction.riskScore)} Risk ({prediction.riskScore}%)
                          </Badge>
                        </div>
                        <Badge variant="outline">{prediction.area}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{prediction.reasoning}</p>
                      <div className="text-xs">
                        <span className="font-medium">Suggested Actions:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {prediction.suggestedActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>CEO Agent success rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareTrendData(ceoTrends)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="successRate" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="collaboration" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Task Completion Trends</CardTitle>
          <CardDescription>Daily task completion for key agents</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prepareTrendData(croTrends)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tasks" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}