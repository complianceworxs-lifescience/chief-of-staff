import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  NetworkIcon, 
  TimerIcon, 
  UsersIcon, 
  TrendingUpIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  TestTubeIcon,
  CheckCircleIcon
} from "lucide-react";
import { useState } from "react";

interface Tier3Config {
  tier: number;
  config: any;
  features: string[];
  status: {
    enabled: boolean;
    simulation_mode: boolean;
    canary_agents: string[];
  };
}

interface Tier3KPIs {
  tier: number;
  coordination_metrics: {
    active_coordinations: number;
    cooperation_efficiency: number;
    conflict_half_life_min: number;
    coordination_overhead: number;
    canary_mode: boolean;
    simulation_mode: boolean;
  };
}

interface CoordinationSession {
  id: string;
  agents: string[];
  startTime: number;
  status: 'active' | 'resolved' | 'timeout';
  conflictId: string;
  duration: number;
  metrics: {
    cooperationEfficiency: number;
    coordinationTime: number;
    resourcesSaved: number;
  };
}

export function Tier3CoordinationDashboard() {
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [canaryEnabled, setCanaryEnabled] = useState(false);

  const { data: config } = useQuery<Tier3Config>({
    queryKey: ['/api/tier3/config'],
  });

  const { data: kpis } = useQuery<Tier3KPIs>({
    queryKey: ['/api/tier3/kpis'],
    refetchInterval: 10000,
  });

  const { data: coordinations } = useQuery<{
    total: number;
    active: number;
    sessions: CoordinationSession[];
  }>({
    queryKey: ['/api/tier3/coordinations'],
    refetchInterval: 5000,
  });

  const handleToggleMode = async (mode: 'simulation' | 'canary', enabled: boolean) => {
    try {
      const response = await fetch('/api/tier3/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, enabled }),
      });
      
      if (response.ok) {
        if (mode === 'simulation') setSimulationEnabled(enabled);
        if (mode === 'canary') setCanaryEnabled(enabled);
      }
    } catch (error) {
      console.error('Failed to toggle mode:', error);
    }
  };

  const handleTestCoordination = async () => {
    try {
      await fetch('/api/tier3/test-coordination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: "CRO",
          status: "error",
          lastReport: "Testing coordination from dashboard",
          metrics: {
            successRate: 0.65,
            alignment: 0.75,
            backlogAgeMinutes: 25,
            costBurnRatePerHour: 12
          },
          context: {
            errorCode: "CONFLICT",
            dependencies: ["CMO", "CFO"]
          },
          ts: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Failed to test coordination:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      case 'timeout': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6" data-testid="tier3-coordination-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="tier3-title">
            Tier 3 - Coordination Layer
          </h2>
          <p className="text-gray-600 dark:text-gray-300" data-testid="tier3-description">
            Inter-agent coordination with conflict half-life &lt;10min
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge 
            variant={config?.status.simulation_mode ? "secondary" : "outline"}
            data-testid="simulation-badge"
          >
            {config?.status.simulation_mode ? (
              <>
                <TestTubeIcon className="w-3 h-3 mr-1" />
                Simulation Mode
              </>
            ) : config?.status.enabled ? (
              <>
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                Canary Live
              </>
            ) : (
              "Disabled"
            )}
          </Badge>
          
          <Button 
            onClick={handleTestCoordination}
            size="sm"
            data-testid="test-coordination-button"
          >
            <PlayCircleIcon className="w-4 h-4 mr-2" />
            Test Coordination
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <Card data-testid="tier3-controls">
        <CardHeader>
          <CardTitle className="flex items-center">
            <NetworkIcon className="w-5 h-5 mr-2" />
            Tier 3 Controls
          </CardTitle>
          <CardDescription>
            Manage simulation and canary rollout modes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="simulation-mode" className="font-medium">
                  Simulation Mode
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Safe testing with sim harness
                </p>
              </div>
              <Switch
                id="simulation-mode"
                checked={simulationEnabled}
                onCheckedChange={(enabled) => handleToggleMode('simulation', enabled)}
                data-testid="simulation-toggle"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="canary-mode" className="font-medium">
                  Canary Mode (CRO↔CMO)
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Live coordination for canary agents
                </p>
              </div>
              <Switch
                id="canary-mode"
                checked={canaryEnabled}
                onCheckedChange={(enabled) => handleToggleMode('canary', enabled)}
                data-testid="canary-toggle"
                disabled={simulationEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="cooperation-efficiency-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Cooperation Efficiency
                </p>
                <p className="text-2xl font-bold" data-testid="cooperation-efficiency-value">
                  {kpis?.coordination_metrics.cooperation_efficiency 
                    ? `${(kpis.coordination_metrics.cooperation_efficiency * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <UsersIcon className="w-8 h-8 text-blue-500" />
            </div>
            <Progress 
              value={(kpis?.coordination_metrics.cooperation_efficiency || 0) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card data-testid="conflict-half-life-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Conflict Half-Life
                </p>
                <p className="text-2xl font-bold" data-testid="conflict-half-life-value">
                  {kpis?.coordination_metrics.conflict_half_life_min?.toFixed(1) || '0'}
                  <span className="text-sm font-normal text-gray-500">min</span>
                </p>
              </div>
              <TimerIcon className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge variant={
                (kpis?.coordination_metrics.conflict_half_life_min || 0) <= 10 
                  ? "default" 
                  : "destructive"
              }>
                Target: &lt;10min
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="active-coordinations-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Coordinations
                </p>
                <p className="text-2xl font-bold" data-testid="active-coordinations-value">
                  {coordinations?.active || 0}
                </p>
              </div>
              <NetworkIcon className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total: {coordinations?.total || 0}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="coordination-overhead-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Coordination Overhead
                </p>
                <p className="text-2xl font-bold" data-testid="coordination-overhead-value">
                  {kpis?.coordination_metrics.coordination_overhead 
                    ? `${(kpis.coordination_metrics.coordination_overhead * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <TrendingUpIcon className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <Badge variant={
                (kpis?.coordination_metrics.coordination_overhead || 0) <= 0.05 
                  ? "default" 
                  : "secondary"
              }>
                Target: &lt;5%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Coordination Sessions */}
      {coordinations && coordinations.sessions.length > 0 && (
        <Card data-testid="coordination-sessions-card">
          <CardHeader>
            <CardTitle>Active Coordination Sessions</CardTitle>
            <CardDescription>
              Real-time inter-agent coordination activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coordinations.sessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  data-testid={`coordination-session-${session.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(session.status)}`} />
                    <div>
                      <p className="font-medium">
                        {session.agents.join(' ↔ ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Duration: {formatDuration(session.duration)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {session.status}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      Efficiency: {(session.metrics.cooperationEfficiency * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features List */}
      <Card data-testid="tier3-features-card">
        <CardHeader>
          <CardTitle>Tier 3 Features</CardTitle>
          <CardDescription>
            Advanced coordination capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {config?.features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center space-x-2"
                data-testid={`tier3-feature-${index}`}
              >
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}