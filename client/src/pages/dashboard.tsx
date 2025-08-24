import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, HeartPulse, Users, AlertTriangle, Target, CheckCircle, Zap, Cpu } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AgentStatusCardWithRemediation } from "@/components/agent-status-card-with-remediation";
import { ConflictCard } from "@/components/conflict-card";
import { StrategicAlignment } from "@/components/strategic-alignment";
import { WeeklyReports } from "@/components/weekly-reports";
import { SystemControls } from "@/components/system-controls";
import { AutonomyTrafficLights } from "@/components/autonomy-traffic-lights";
import { LiveMetricsDashboard } from "@/components/live-metrics-dashboard";
import { ConflictResolutionIndicator } from "@/components/conflict-resolution-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { useAgents, useAgentMetrics } from "@/hooks/useAgent";
import { qk } from "@/state/queries";
import type { Agent, Conflict, SystemMetrics } from "@shared/schema";

export default function Dashboard() {
  // Use unified state management hooks
  const { data: agentsData, isLoading: agentsLoading } = useAgents();
  const { data: agentMetrics } = useAgentMetrics();
  
  // Extract agents array from the response structure
  const agents = agentsData?.items || [];

  const { data: activeConflicts = [] } = useQuery<Conflict[]>({
    queryKey: qk.conflictsActive,
    refetchInterval: 1800000 // Check every 30 minutes - maximum cost savings
  });

  const { data: resolvedConflicts = [] } = useQuery<any[]>({
    queryKey: qk.conflictsResolved,
    refetchInterval: 1800000 // Refresh every 30 minutes - maximum cost savings
  });

  const { data: systemHealth } = useQuery<any>({
    queryKey: qk.conflictSystemHealth,
    refetchInterval: 1800000 // Monitor every 30 minutes - maximum cost savings
  });

  const { data: systemMetrics } = useQuery<SystemMetrics>({
    queryKey: ["/api/system/metrics"]
  });

  return (
    <div className="space-y-8">
        {/* Header with Notification Bell */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chief of Staff Dashboard</h1>
            <p className="text-gray-600">Facilitating communication across Agents, driving key projects, and acting as a strategic advisor.</p>
          </div>
          <NotificationBell />
        </div>

        {/* Daily Signal Board - Steve Jobs Signal-to-Noise */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Revenue Hooks</h4>
                  <p className="text-sm text-gray-600">CTAs Converting</p>
                </div>
              </div>
              <div className="text-2xl">
                {(systemMetrics?.strategicAlignmentScore || 0) >= 85 ? '✅' : (systemMetrics?.strategicAlignmentScore || 0) >= 75 ? '⚠️' : '❌'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Cpu className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Autonomy Metrics</h4>
                  <p className="text-sm text-gray-600">Agents Status</p>
                </div>
              </div>
              <div className="text-2xl">
                {(systemMetrics?.systemHealth || 0) >= 85 ? '✅' : (systemMetrics?.systemHealth || 0) >= 70 ? '⚠️' : '❌'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Messaging</h4>
                  <p className="text-sm text-gray-600">Outbound Push Live</p>
                </div>
              </div>
              <div className="text-2xl">
                {activeConflicts.length === 0 ? '✅' : activeConflicts.length <= 2 ? '⚠️' : '❌'}
              </div>
            </div>
          </div>
          <div className="text-center mt-3">
            <p className="text-sm text-gray-600">
              {(systemMetrics?.strategicAlignmentScore || 0) >= 85 && (systemMetrics?.systemHealth || 0) >= 85 && activeConflicts.length === 0 
                ? "🎯 All systems green - Stay out" 
                : "⚡ Exceptions detected - Agent intervention required"}
            </p>
          </div>
        </div>

        {/* Strategic Execution Loop Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Strategic Execution Loop</h2>
              <p className="text-gray-600 mt-1">Orchestrated Execution - ComplianceWorxs' competitive advantage</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                Last updated: {systemMetrics ? 
                  formatDistanceToNow(new Date(systemMetrics.timestamp), { addSuffix: true }) : 
                  'Never'
                }
              </span>
            </div>
          </div>
          
          {/* Strategic Execution Loop Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">1. Goal</h3>
                </div>
                <p className="text-sm text-gray-600">Define clear, high-level business objectives</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">2. Orchestrate</h3>
                </div>
                <p className="text-sm text-gray-600">Analyze data and create prioritized directives</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HeartPulse className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">3. Execute</h3>
                </div>
                <p className="text-sm text-gray-600">Agents execute tasks with precision</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">4. Learn & Refine</h3>
                </div>
                <p className="text-sm text-gray-600">Analyze results and optimize strategy</p>
              </CardContent>
            </Card>
          </div>
          
          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Health</p>
                    <p className="text-2xl font-bold text-green-600">
                      {systemMetrics?.systemHealth || 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <HeartPulse className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Agents</p>
                    <p className="text-2xl font-bold text-primary">
                      {systemMetrics?.activeAgents || 0}/{systemMetrics?.totalAgents || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Conflicts</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {systemMetrics?.activeConflicts || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Strategic Alignment</p>
                    <p className="text-2xl font-bold text-green-600">
                      {systemMetrics?.strategicAlignmentScore || 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Live Metrics & Agent Command Surface */}
        <LiveMetricsDashboard />

        {/* Autonomy Traffic Light KPIs */}
        <AutonomyTrafficLights />

        {/* Agent Status Monitoring */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Agent Status Monitoring</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentsLoading ? (
              <div className="col-span-full text-center py-8">Loading agents...</div>
            ) : (
              agents.map((agent) => (
                <AgentStatusCardWithRemediation key={agent.id} agent={agent} />
              ))
            )}
          </div>
        </div>

        {/* Autonomous Conflict Resolution System */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-900">Autonomous Conflict Resolution</h3>
              <Badge className="bg-blue-100 text-blue-800">
                <Cpu className="h-3 w-3 mr-1" />
                NO HITL
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                {activeConflicts.length} Active
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {resolvedConflicts.length} Auto-Resolved
              </Badge>
            </div>
          </div>
          
          {/* Live Conflict Resolution Indicator */}
          <div className="mb-6">
            <ConflictResolutionIndicator isActive={activeConflicts.length > 0} />
          </div>
          
          {/* Autonomous System Status */}
          {systemHealth && (
            <Card className="mb-4 border-l-4 border-l-blue-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Autonomous System Status</h4>
                      <p className="text-sm text-gray-600">
                        Continuously monitoring and resolving conflicts without human intervention
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{systemHealth.resolvedToday || 0}</div>
                      <div className="text-xs text-gray-500">Resolved Today</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${systemHealth.overallHealth === 'healthy' ? 'text-green-600' : systemHealth.overallHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {systemHealth.overallHealth?.charAt(0).toUpperCase() + systemHealth.overallHealth?.slice(1) || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">System Health</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Resolved Conflicts (Real-time Autonomous Activity) */}
          <div className="space-y-4">
            {resolvedConflicts.length > 0 ? (
              <div>
                <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recently Auto-Resolved Conflicts
                </h4>
                <div className="space-y-3">
                  {resolvedConflicts.slice(0, 3).map((conflict) => (
                    <Card key={conflict.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                AUTONOMOUS
                              </Badge>
                              <span className="text-sm font-medium">{conflict.title}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{conflict.resolution}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Agents: {conflict.agents.join(', ').toUpperCase()}</span>
                              <span>Impact: {conflict.impactScore}/100</span>
                              <span>Resolution Time: {conflict.resolutionTime}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Resolved</div>
                            <div className="text-sm font-medium">
                              {formatDistanceToNow(new Date(conflict.resolvedAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
            
            {/* Active Conflicts (if any) */}
            {activeConflicts.length > 0 ? (
              <div>
                <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Active Conflicts Being Resolved
                </h4>
                <div className="space-y-3">
                  {activeConflicts.map((conflict) => (
                    <ConflictCard key={conflict.id} conflict={conflict} />
                  ))}
                </div>
              </div>
            ) : null}
            
            {/* Show success message when no conflicts */}
            {activeConflicts.length === 0 && resolvedConflicts.length > 0 ? (
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h4 className="font-medium text-green-900 mb-2">All Conflicts Autonomously Resolved</h4>
                  <p className="text-gray-600">
                    The Chief of Staff AI system is operating independently and has successfully resolved all detected conflicts without requiring human intervention.
                  </p>
                </CardContent>
              </Card>
            ) : null}
            
          </div>
        </div>

        {/* Strategic Alignment Tracking */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Strategic Alignment Tracking</h3>
          <StrategicAlignment />
        </div>

        {/* Weekly Reports */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Weekly Intelligence Reports</h3>
          <WeeklyReports />
        </div>

        {/* System Controls */}
        <div className="mb-8">
          <SystemControls />
        </div>
    </div>
  );
}
