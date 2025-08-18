import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, DollarSign, TrendingUp, Target, Zap, Brain, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Tier2KPIs {
  auto_resolve_rate: number;
  target_auto_resolve_rate: number;
  total_incidents: number;
  auto_resolved: number;
  escalated: number;
  total_cost: number;
  is_autonomous: boolean;
  budget_healthy: boolean;
  mttr_minutes: number;
  tier: number;
  cost_per_incident: number;
  concurrency_efficiency: number;
  bandit_performance: Record<string, number>;
  escalation_rate: number;
  freshness_compliance: number;
}

export function Tier2KPIs() {
  const { data: kpis, isLoading } = useQuery<Tier2KPIs>({
    queryKey: ['/api/autonomy/kpis'],
  });

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Tier 2 Autonomy Layer
          </CardTitle>
          <CardDescription>Loading advanced autonomy metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kpis || kpis.tier !== 2) {
    // Fallback to regular autonomy KPIs if Tier 2 not available
    return null;
  }

  const autonomyStatus = kpis.is_autonomous ? 'Fully Autonomous' : 'Requires Intervention';
  const budgetStatus = kpis.budget_healthy ? 'Within Budget' : 'Over Budget';
  const costEfficiency = kpis.auto_resolved > 0 ? kpis.cost_per_incident : 0;
  
  return (
    <Card className="mb-6 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Tier 2 Autonomy Layer
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
              ADVANCED
            </Badge>
          </div>
          <Badge 
            variant={kpis.is_autonomous ? "default" : "destructive"}
            className="text-xs"
          >
            {autonomyStatus}
          </Badge>
        </CardTitle>
        <CardDescription>
          Cost-aware selection • Dynamic orchestration • Bandit learning • Risk gates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Auto-Resolve</span>
            </div>
            <div className="text-2xl font-bold">
              {(kpis.auto_resolve_rate * 100).toFixed(1)}%
            </div>
            <Progress 
              value={kpis.auto_resolve_rate * 100} 
              className="h-2"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Cost/Incident</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${costEfficiency.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {costEfficiency < 5 ? 'Highly efficient' : costEfficiency < 15 ? 'Good' : 'Needs optimization'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Throughput</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {(kpis.concurrency_efficiency * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">
              resource efficiency
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Data Fresh</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {(kpis.freshness_compliance * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">
              within SLA
            </div>
          </div>
        </div>

        {/* Bandit Learning Performance */}
        {Object.keys(kpis.bandit_performance).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Bandit Learning Performance
            </h4>
            <div className="space-y-2">
              {Object.entries(kpis.bandit_performance).map(([playbook, avgReward]) => (
                <div key={playbook} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{playbook}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(avgReward + 1) * 50} className="w-20 h-2" />
                    <span className="text-xs font-mono w-12 text-right">
                      {avgReward.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Summary Row */}
        <div className="pt-3 border-t border-border/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Budget</span>
              </div>
              <Badge 
                variant={kpis.budget_healthy ? "default" : "destructive"}
                className="text-xs"
              >
                {budgetStatus}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">HITL Rate</span>
              </div>
              <Badge 
                variant={kpis.escalation_rate < 0.2 ? "default" : "destructive"}
                className="text-xs"
              >
                {(kpis.escalation_rate * 100).toFixed(0)}%
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">MTTR</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {kpis.mttr_minutes.toFixed(1)}m
              </Badge>
            </div>
          </div>
        </div>

        {/* Advanced Status Messages */}
        {kpis.is_autonomous && kpis.budget_healthy && kpis.escalation_rate < 0.2 && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Tier 2 autonomy optimal:</strong> Cost-aware selection active, bandit learning improving performance, 
              all risk gates functioning within thresholds.
            </div>
          </div>
        )}

        {costEfficiency > 20 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Cost optimization needed:</strong> Average cost per incident is ${costEfficiency.toFixed(2)}. 
              Consider bandit exploration parameter tuning or playbook efficiency review.
            </div>
          </div>
        )}

        {kpis.escalation_rate > 0.6 && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-sm text-red-800 dark:text-red-200">
              <strong>High HITL rate detected:</strong> {(kpis.escalation_rate * 100).toFixed(0)}% of actions escalated. 
              Review risk gate thresholds or consider agent training improvements.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}