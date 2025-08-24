import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  XCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  ExternalLinkIcon,
  TimerIcon,
  AlertCircleIcon,
  ShieldCheckIcon
} from "lucide-react";

interface KPIData {
  id: string;
  title: string;
  value: number;
  unit: string;
  thresholds: {
    green_min?: number;
    green_max?: number;
    yellow_min?: number;
    yellow_max?: number;
  };
  trend_24h: number;
  detail_href: string;
  updated_at: string;
}

interface KPIResponse {
  kpis: KPIData[];
}

export function AutonomyTrafficLights() {
  const { data: kpiData } = useQuery<KPIResponse>({
    queryKey: ['/api/autonomy/traffic-lights'],
    refetchInterval: 1800000, // Maximum cost savings: 30 minutes
  });

  // Fallback to current autonomy KPIs if traffic lights endpoint not available
  const { data: fallbackKPIs } = useQuery({
    queryKey: ['/api/autonomy/kpis'],
    refetchInterval: 1800000, // Maximum cost savings: 30 minutes
  });

  // Transform current KPI data to traffic light format if needed
  const kpis = kpiData?.kpis || (fallbackKPIs ? [
    {
      id: "auto_resolve_rate",
      title: "Auto-Resolve Rate",
      value: fallbackKPIs.auto_resolve_rate || 0,
      unit: "ratio",
      thresholds: { green_min: 0.85, yellow_min: 0.70 },
      trend_24h: 0.03,
      detail_href: "/logs/lineage?filter=auto_resolve",
      updated_at: new Date().toISOString()
    },
    {
      id: "mttr_minutes", 
      title: "MTTR (min)",
      value: fallbackKPIs.mttr_minutes || 0,
      unit: "minutes",
      thresholds: { green_max: 5, yellow_max: 10 },
      trend_24h: -0.6,
      detail_href: "/logs/lineage?filter=mttr",
      updated_at: new Date().toISOString()
    },
    {
      id: "escalations_per_day",
      title: "Escalations / Day", 
      value: fallbackKPIs.escalated || 0,
      unit: "count",
      thresholds: { green_max: 5, yellow_max: 10 },
      trend_24h: -1,
      detail_href: "/logs/lineage?filter=escalations",
      updated_at: new Date().toISOString()
    }
  ] : []);

  const getTrafficLightStatus = (kpi: KPIData): 'green' | 'yellow' | 'red' => {
    const { value, thresholds } = kpi;
    
    if (thresholds.green_min !== undefined && thresholds.yellow_min !== undefined) {
      // Higher is better (e.g., auto-resolve rate)
      if (value >= thresholds.green_min) return 'green';
      if (value >= thresholds.yellow_min) return 'yellow';
      return 'red';
    } else if (thresholds.green_max !== undefined && thresholds.yellow_max !== undefined) {
      // Lower is better (e.g., MTTR, escalations)
      if (value <= thresholds.green_max) return 'green';
      if (value <= thresholds.yellow_max) return 'yellow';
      return 'red';
    }
    
    return 'green'; // Default fallback
  };

  const getStatusIcon = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'yellow': return <AlertTriangleIcon className="w-6 h-6 text-yellow-500" />;
      case 'red': return <XCircleIcon className="w-6 h-6 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'green' | 'yellow' | 'red') => {
    const colors = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500', 
      red: 'bg-red-500'
    };
    
    const emojis = {
      green: '🟢',
      yellow: '🟡',
      red: '🔴'
    };

    return (
      <Badge className={`${colors[status]} text-white`}>
        {emojis[status]} {status.toUpperCase()}
      </Badge>
    );
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDownIcon className="w-4 h-4 text-red-500" />;
    return <MinusIcon className="w-4 h-4 text-gray-500" />;
  };

  const formatValue = (kpi: KPIData) => {
    const { value, unit } = kpi;
    switch (unit) {
      case 'ratio': return `${(value * 100).toFixed(1)}%`;
      case 'minutes': return `${value.toFixed(1)}min`;
      case 'count': return value.toString();
      default: return value.toString();
    }
  };

  const getSystemStatus = () => {
    const statuses = kpis.map(getTrafficLightStatus);
    if (statuses.every(s => s === 'green')) return 'all_green';
    if (statuses.some(s => s === 'red')) return 'any_red';
    if (statuses.some(s => s === 'yellow')) return 'any_yellow';
    return 'all_green';
  };

  const getSystemMessage = () => {
    const status = getSystemStatus();
    switch (status) {
      case 'all_green':
        return {
          message: "🟢 Autopilot Engaged - System is fully autonomous",
          description: "All KPIs green. Chief of Staff handling everything autonomously.",
          action: "Stay in back seat. Only supply goals to CEO Agent."
        };
      case 'any_yellow':
        return {
          message: "🟡 Turbulence Detected - System adjusting autonomously",
          description: "Some KPIs yellow. Chief of Staff monitoring and adjusting playbook weights.",
          action: "No action needed. System self-correcting."
        };
      case 'any_red':
        return {
          message: "🔴 Manual Override Considered - CEO Agent engaged",
          description: "Critical KPIs red. Automatic escalation to CEO Agent with options.",
          action: "CEO Agent will provide recommendations for your review."
        };
      default:
        return {
          message: "System status unknown",
          description: "Unable to determine system status",
          action: "Check individual KPIs"
        };
    }
  };

  const systemStatus = getSystemMessage();

  return (
    <TooltipProvider>
      <div className="space-y-6" data-testid="autonomy-traffic-lights">
        {/* System Status Header */}
        <Card className="border-2" data-testid="system-status-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <ShieldCheckIcon className="w-5 h-5" />
                  <span>Autonomy Status</span>
                </CardTitle>
                <CardDescription>{systemStatus.description}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold" data-testid="system-status-message">
                  {systemStatus.message}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {systemStatus.action}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* KPI Traffic Light Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kpis.map((kpi) => {
            const status = getTrafficLightStatus(kpi);
            
            return (
              <Card key={kpi.id} className="relative" data-testid={`kpi-card-${kpi.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{kpi.title}</CardTitle>
                    {getStatusIcon(status)}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Main Value */}
                    <div className="flex items-baseline justify-between">
                      <span 
                        className="text-3xl font-bold"
                        data-testid={`kpi-value-${kpi.id}`}
                      >
                        {formatValue(kpi)}
                      </span>
                      {getStatusBadge(status)}
                    </div>
                    
                    {/* Trend */}
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(kpi.trend_24h)}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {kpi.trend_24h > 0 ? '+' : ''}{kpi.trend_24h.toFixed(1)} vs 24h
                      </span>
                    </div>
                    
                    {/* Thresholds Tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full">
                          <AlertCircleIcon className="w-4 h-4 mr-2" />
                          View Thresholds
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-semibold mb-1">Traffic Light Rules:</p>
                          {kpi.thresholds.green_min && (
                            <p>🟢 Green: ≥ {(kpi.thresholds.green_min * (kpi.unit === 'ratio' ? 100 : 1)).toFixed(0)}{kpi.unit === 'ratio' ? '%' : kpi.unit}</p>
                          )}
                          {kpi.thresholds.green_max && (
                            <p>🟢 Green: ≤ {kpi.thresholds.green_max}{kpi.unit}</p>
                          )}
                          {kpi.thresholds.yellow_min && (
                            <p>🟡 Yellow: {(kpi.thresholds.yellow_min * (kpi.unit === 'ratio' ? 100 : 1)).toFixed(0)}-{((kpi.thresholds.green_min || 0) * (kpi.unit === 'ratio' ? 100 : 1)).toFixed(0)}{kpi.unit === 'ratio' ? '%' : kpi.unit}</p>
                          )}
                          {kpi.thresholds.yellow_max && (
                            <p>🟡 Yellow: {kpi.thresholds.green_max}-{kpi.thresholds.yellow_max}{kpi.unit}</p>
                          )}
                          <p>🔴 Red: Below yellow threshold</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* Detail Link */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.open(kpi.detail_href, '_blank')}
                      data-testid={`kpi-detail-link-${kpi.id}`}
                    >
                      <ExternalLinkIcon className="w-4 h-4 mr-2" />
                      View Detail Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Legend */}
        <Card data-testid="traffic-light-legend">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TimerIcon className="w-5 h-5 mr-2" />
              Traffic Light System
            </CardTitle>
            <CardDescription>
              Your dashboard acts like a pilot's instrument panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">Green = Autopilot Engaged</p>
                  <p className="text-gray-600 dark:text-gray-400">System stable, stay relaxed. Only supply goals to CEO Agent.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-700 dark:text-yellow-400">Yellow = Turbulence</p>
                  <p className="text-gray-600 dark:text-gray-400">Chief of Staff adjusting. System self-correcting, no action needed.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <XCircleIcon className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-400">Red = Manual Override</p>
                  <p className="text-gray-600 dark:text-gray-400">CEO Agent engaged with options. Review only when escalated.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}