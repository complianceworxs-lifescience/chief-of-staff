import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, AlertTriangle, DollarSign, Clock, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AutonomyKPIs {
  auto_resolve_rate: number;
  target_auto_resolve_rate: number;
  total_incidents: number;
  auto_resolved: number;
  escalated: number;
  total_cost: number;
  is_autonomous: boolean;
  budget_healthy: boolean;
  mttr_minutes: number;
}

export function AutonomyKPIs() {
  // Check for Tier 2 first, fallback to Tier 1
  const { data: tier2KPIs } = useQuery<any>({
    queryKey: ['/api/autonomy/kpis'],
    select: (data) => data?.tier === 2 ? data : null
  });
  
  const { data: kpis, isLoading } = useQuery<AutonomyKPIs>({
    queryKey: ['/api/autonomy/kpis', { tier: tier2KPIs ? '2' : '1' }],
    enabled: !tier2KPIs
  });

  // Show Tier 2 component if available
  if (tier2KPIs) {
    // Dynamic import doesn't work here, just use regular autonomy KPIs for now
    // TODO: Implement proper Tier 2 KPI switching
  }

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Unified Autonomy Layer
          </CardTitle>
          <CardDescription>Loading autonomy metrics...</CardDescription>
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

  if (!kpis) return null;

  const autonomyStatus = kpis.is_autonomous ? 'Autonomous' : 'Manual Intervention Required';
  const budgetStatus = kpis.budget_healthy ? 'Healthy' : 'Over Budget';
  
  return (
    <Card className="mb-6 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Unified Autonomy Layer
          </div>
          <Badge 
            variant={kpis.is_autonomous ? "default" : "destructive"}
            className="text-xs"
          >
            {autonomyStatus}
          </Badge>
        </CardTitle>
        <CardDescription>
          Enterprise-grade autonomous conflict resolution with $25/day budget constraint
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Auto-Resolve Rate</span>
            </div>
            <div className="text-2xl font-bold">
              {(kpis.auto_resolve_rate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {(kpis.target_auto_resolve_rate * 100).toFixed(0)}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Incidents Resolved</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {kpis.auto_resolved}
            </div>
            <div className="text-xs text-muted-foreground">
              of {kpis.total_incidents} total
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Escalated</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {kpis.escalated}
            </div>
            <div className="text-xs text-muted-foreground">
              to CEO Agent
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">MTTR</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {kpis.mttr_minutes.toFixed(1)}m
            </div>
            <div className="text-xs text-muted-foreground">
              mean time to recover
            </div>
          </div>
        </div>

        {/* Cost and Budget Row */}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Cost: ${kpis.total_cost.toFixed(2)}</span>
            </div>
            <Badge 
              variant={kpis.budget_healthy ? "default" : "destructive"}
              className="text-xs"
            >
              Budget: {budgetStatus}
            </Badge>
          </div>
          
          {/* Cost efficiency indicator */}
          {kpis.auto_resolved > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Average cost per incident: ${(kpis.total_cost / kpis.auto_resolved).toFixed(2)}
            </div>
          )}
        </div>

        {/* Status Messages */}
        {!kpis.is_autonomous && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Manual intervention required:</strong> Auto-resolve rate below 85% threshold.
              Check escalated conflicts for resolution patterns.
            </div>
          </div>
        )}

        {!kpis.budget_healthy && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-sm text-red-800 dark:text-red-200">
              <strong>Budget warning:</strong> Weekly spending above $175 threshold.
              Consider optimizing playbook efficiency or adjusting agent priorities.
            </div>
          </div>
        )}

        {kpis.is_autonomous && kpis.budget_healthy && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-sm text-green-800 dark:text-green-200">
              <strong>Optimal autonomy achieved:</strong> System operating within budget and SLA targets.
              No human intervention required.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}