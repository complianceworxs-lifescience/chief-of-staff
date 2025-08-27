import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, HeartPulse, Users, AlertTriangle, Target, CheckCircle, Zap, Cpu } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AgentStatusCardWithRemediation } from "@/components/agent-status-card-with-remediation";
import { ConflictCard } from "@/components/conflict-card";
import { StrategicAlignment } from "@/components/strategic-alignment";
import { WeeklyReports } from "@/components/weekly-reports";
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
    refetchInterval: 21600000 // Check every 6 hours - optimized for 3-4 daily checks
  });

  const { data: resolvedConflicts = [] } = useQuery<any[]>({
    queryKey: qk.conflictsResolved,
    refetchInterval: 21600000 // Refresh every 6 hours - optimized for 3-4 daily checks
  });

  const { data: systemHealth } = useQuery<any>({
    queryKey: qk.conflictSystemHealth,
    refetchInterval: 21600000 // Monitor every 6 hours - optimized for 3-4 daily checks
  });

  const { data: systemMetrics } = useQuery<SystemMetrics>({
    queryKey: ["/api/system/metrics"]
  });

  return (
    <div className="space-y-8">
        {/* Header with Notification Bell */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chief of Staff – Strategic Alignment & Oversight</h1>
            <p className="text-gray-600">Ensuring executive agents remain aligned to revenue goals, highlighting cross-agent dependencies, and surfacing risks that impact business performance.</p>
          </div>
          <NotificationBell />
        </div>

        {/* Revenue-Focused Headline KPIs */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Executive KPI Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Revenue Alignment</h4>
                  <p className="text-sm text-gray-600">{(systemMetrics?.strategicAlignmentScore || 0)}% / 100%</p>
                </div>
              </div>
              <div className="text-2xl">
                {(systemMetrics?.strategicAlignmentScore || 0) >= 85 ? '✅' : (systemMetrics?.strategicAlignmentScore || 0) >= 75 ? '⚠️' : '❌'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Dependencies Cleared</h4>
                  <p className="text-sm text-gray-600">{activeConflicts.length === 0 ? 'All' : `${activeConflicts.length} pending`}</p>
                </div>
              </div>
              <div className="text-2xl">
                {activeConflicts.length === 0 ? '✅' : activeConflicts.length <= 2 ? '⚠️' : '❌'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Initiatives On Track</h4>
                  <p className="text-sm text-gray-600">Active strategic projects</p>
                </div>
              </div>
              <div className="text-2xl">
                {(systemMetrics?.activeAgents || 0) >= 6 ? '✅' : (systemMetrics?.activeAgents || 0) >= 4 ? '⚠️' : '❌'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Cpu className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Agent Reliability</h4>
                  <p className="text-sm text-gray-600">{(systemMetrics?.systemHealth || 0)}% / 95%+</p>
                </div>
              </div>
              <div className="text-2xl">
                {(systemMetrics?.systemHealth || 0) >= 95 ? '✅' : (systemMetrics?.systemHealth || 0) >= 85 ? '⚠️' : '❌'}
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Agent Executive Summary */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Cross-Agent Executive Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-900">CRO Insight</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  CRO reports 15% shortfall risk in enterprise segment.
                </p>
                <div className="text-xs text-gray-500">
                  Revenue pipeline: $2.3M active deals
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-blue-900">CMO Insight</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  CMO highlights content marketing driving 23% ROI, recommends budget shift.
                </p>
                <div className="text-xs text-gray-500">
                  Conversion rate: 12.3% (target: 15%)
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Cpu className="h-4 w-4 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-orange-900">COO Insight</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  COO flags 7 unresolved tickets impacting $45K revenue.
                </p>
                <div className="text-xs text-gray-500">
                  System uptime: 99.2% (target: 99.5%)
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-purple-900">CCO Insight</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  CCO confirms compliance risk in validation process, potential $125K exposure.
                </p>
                <div className="text-xs text-gray-500">
                  Compliance score: 94% (target: 98%)
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Strategic Alignment Tracker */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Strategic Initiative Alignment</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">ARR Growth Acceleration</h4>
                  <Badge className="bg-green-100 text-green-800">On Track</Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Dependencies:</span>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        CRO revenue acquisition
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        CMO funnel conversions
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        COO ticket resolution
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Alignment:</span>
                    <span className="font-medium text-green-600">82%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Churn Reduction</h4>
                  <Badge className="bg-yellow-100 text-yellow-800">At Risk</Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Dependencies:</span>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        CRO churn mitigation
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        COO support resolution
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        CCO compliance stability
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Alignment:</span>
                    <span className="font-medium text-yellow-600">67%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weekly Reports */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Weekly Intelligence Reports</h3>
          <WeeklyReports />
        </div>

        {/* Strategic Alerts */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Strategic Alerts</h3>
          <div className="space-y-4">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-red-100 text-red-800 text-xs">HIGH PRIORITY</Badge>
                      <span className="font-medium text-red-900">Revenue Growth Trajectory</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Revenue growth trajectory behind by 18% — dependency bottleneck at COO agent.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">MEDIUM</Badge>
                      <span className="font-medium text-yellow-900">Initiative Slippage</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Initiative Churn Reduction slipping — dependency COO support resolution unresolved.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Chief of Staff Insights */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Chief of Staff Strategic Insights</h3>
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <Target className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold text-indigo-900">Strategic Assessment</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="bg-white rounded-lg p-4 border">
                    <span className="font-medium text-gray-900">Revenue alignment:</span>
                    <span className="ml-2 text-gray-700">CRO and CMO coordination improving, but COO operational bottlenecks creating 15% revenue impact.</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <span className="font-medium text-gray-900">Top dependency risk:</span>
                    <span className="ml-2 text-gray-700">COO support ticket resolution blocking customer retention initiatives across CRO and CCO agents.</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <span className="font-medium text-gray-900">Cross-agent synergy opportunity:</span>
                    <span className="ml-2 text-gray-700">CMO content marketing success (23% ROI) should be leveraged for CRO enterprise segment pipeline acceleration.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
              agents.map((agent: any) => (
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


    </div>
  );
}
