import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Cpu, Zap, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SystemHealth {
  overallHealth: 'healthy' | 'warning' | 'critical';
  activeConflicts: number;
  resolvedToday: number;
  triggers: { id: string; active: boolean; severity: string; }[];
  autonomous: boolean;
  lastCheck: string;
}

export function AutonomousStatusIndicator() {
  const { toast } = useToast();
  
  const { data: systemHealth, isLoading, refetch } = useQuery<SystemHealth>({
    queryKey: ['/api/conflicts/system-health'],
    refetchInterval: 7200000, // 2 hour intervals - unified polling schedule
  });

  const triggerMonitoring = async () => {
    try {
      const result = await apiRequest('POST', '/api/conflicts/trigger-monitoring', {}) as { message?: string };
      toast({
        title: "Autonomous Monitoring Triggered",
        description: result?.message || "Monitoring cycle initiated",
      });
      // Refresh the data
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
    } catch (error) {
      toast({
        title: "Monitoring Trigger Failed",
        description: "Could not trigger autonomous monitoring cycle",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !systemHealth) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Autonomous System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="ml-2 text-sm">Loading system status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const HealthIcon = getHealthIcon(systemHealth.overallHealth);
  const activeTriggers = systemHealth.triggers.filter(t => t.active);
  const criticalTriggers = activeTriggers.filter(t => t.severity === 'critical');

  return (
    <Card className="w-full border-l-4 border-l-blue-600" data-testid="autonomous-status-indicator">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-600" />
            Autonomous System Status
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              NO HITL
            </Badge>
          </CardTitle>
          <Badge className={getHealthColor(systemHealth.overallHealth)}>
            <HealthIcon className="h-3 w-3 mr-1" />
            {systemHealth.overallHealth.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Metrics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600">
              {systemHealth.activeConflicts}
            </div>
            <div className="text-xs text-gray-500">Active Conflicts</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">
              {systemHealth.resolvedToday}
            </div>
            <div className="text-xs text-gray-500">Resolved Today</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-orange-600">
              {activeTriggers.length}
            </div>
            <div className="text-xs text-gray-500">Active Triggers</div>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalTriggers.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Critical Issues Detected
              </span>
            </div>
            <div className="space-y-1">
              {criticalTriggers.map(trigger => (
                <div key={trigger.id} className="text-xs text-red-700">
                  • {trigger.id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Autonomous Capabilities */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Autonomous Capabilities Active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
            <div>✓ Conflict Detection</div>
            <div>✓ Auto-Resolution</div>
            <div>✓ Resource Rebalancing</div>
            <div>✓ Priority Enforcement</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={triggerMonitoring}
            className="flex-1"
            data-testid="trigger-autonomous-monitoring"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Force Check
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => refetch()}
            className="flex-1"
            data-testid="refresh-status"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Last Update */}
        <div className="text-xs text-gray-500 text-center">
          Last checked: {new Date(systemHealth.lastCheck).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}