import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Zap, 
  Shield,
  Target,
  Award
} from "lucide-react";

interface AutonomyKPIs {
  auto_resolve_rate: number;
  target_auto_resolve_rate: number;
  mttd_minutes: number;
  target_mttd_minutes: number;
  mttr_minutes: number;
  target_mttr_minutes: number;
  cost_per_incident: number;
  target_cost_per_incident: number;
  conflict_half_life_minutes: number;
  total_incidents: number;
  auto_resolved: number;
  escalated: number;
  total_cost: number;
  is_autonomous: boolean;
  performance_grade: string;
  trending_up: boolean;
  budget_healthy: boolean;
}

export function AutonomyKPIs() {
  const { data: kpis, isLoading } = useQuery<AutonomyKPIs>({
    queryKey: ['/api/remediation/kpis'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-32">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;
  const formatMinutes = (value: number) => `${Math.round(value * 10) / 10}m`;
  const formatCurrency = (value: number) => `$${Math.round(value)}`;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Overall Grade */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Autonomy Performance</h3>
          <p className="text-gray-600 text-sm">Real-time KPIs proving agent autonomy</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${getGradeColor(kpis.performance_grade)} text-lg px-4 py-2`}>
            <Award className="h-4 w-4 mr-1" />
            Grade {kpis.performance_grade}
          </Badge>
          {kpis.is_autonomous && (
            <Badge className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              AUTONOMOUS
            </Badge>
          )}
        </div>
      </div>

      {/* Core KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Auto-Resolve Rate */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              Auto-Resolve Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold">
                {formatPercentage(kpis.auto_resolve_rate)}
              </span>
              <span className="text-sm text-gray-500">
                of {formatPercentage(kpis.target_auto_resolve_rate)}
              </span>
            </div>
            <Progress 
              value={kpis.auto_resolve_rate * 100} 
              className="h-2 mb-2" 
            />
            <div className="text-xs text-gray-600">
              {kpis.auto_resolved}/{kpis.total_incidents} incidents resolved
            </div>
          </CardContent>
        </Card>

        {/* Mean Time To Recover */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              MTTR (Recover)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold">
                {formatMinutes(kpis.mttr_minutes)}
              </span>
              <span className="text-sm text-gray-500">
                target: {formatMinutes(kpis.target_mttr_minutes)}
              </span>
            </div>
            <Progress 
              value={Math.max(0, 100 - (kpis.mttr_minutes / kpis.target_mttr_minutes * 100))} 
              className="h-2 mb-2" 
            />
            <div className="text-xs text-gray-600">
              Half-life: {formatMinutes(kpis.conflict_half_life_minutes)}
            </div>
          </CardContent>
        </Card>

        {/* Cost Per Incident */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              Cost Per Incident
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold">
                {formatCurrency(kpis.cost_per_incident)}
              </span>
              <span className="text-sm text-gray-500">
                target: {formatCurrency(kpis.target_cost_per_incident)}
              </span>
            </div>
            <Progress 
              value={Math.max(0, 100 - (kpis.cost_per_incident / kpis.target_cost_per_incident * 100))} 
              className="h-2 mb-2" 
            />
            <div className="text-xs text-gray-600">
              Total spend: {formatCurrency(kpis.total_cost)}
            </div>
          </CardContent>
        </Card>

        {/* Mean Time To Detect */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              MTTD (Detect)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold">
                {formatMinutes(kpis.mttd_minutes)}
              </span>
              <span className="text-sm text-gray-500">
                target: {formatMinutes(kpis.target_mttd_minutes)}
              </span>
            </div>
            <Progress 
              value={Math.max(0, 100 - (kpis.mttd_minutes / kpis.target_mttd_minutes * 100))} 
              className="h-2 mb-2" 
            />
            <div className="text-xs text-gray-600 flex items-center gap-1">
              {kpis.trending_up ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Improving</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">Degrading</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Autonomy Health Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {kpis.auto_resolved}
              </div>
              <div className="text-sm text-gray-600">Auto-Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {kpis.escalated}
              </div>
              <div className="text-sm text-gray-600">Escalated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {kpis.total_incidents}
              </div>
              <div className="text-sm text-gray-600">Total Incidents</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Budget Health:</span>
              <Badge className={kpis.budget_healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {kpis.budget_healthy ? 'Healthy' : 'At Risk'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span>Performance Trend:</span>
              <div className="flex items-center gap-1">
                {kpis.trending_up ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Improving</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">Needs Attention</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}