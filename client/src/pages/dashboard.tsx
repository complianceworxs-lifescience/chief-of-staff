import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, HeartPulse, Users, AlertTriangle, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AgentStatusCard } from "@/components/agent-status-card";
import { ConflictCard } from "@/components/conflict-card";
import { StrategicAlignment } from "@/components/strategic-alignment";
import { WeeklyReports } from "@/components/weekly-reports";
import { SystemControls } from "@/components/system-controls";
import type { Agent, Conflict, SystemMetrics } from "@shared/schema";

export default function Dashboard() {
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"]
  });

  const { data: activeConflicts = [] } = useQuery<Conflict[]>({
    queryKey: ["/api/conflicts/active"]
  });

  const { data: systemMetrics } = useQuery<SystemMetrics>({
    queryKey: ["/api/system/metrics"]
  });

  const notificationCount = activeConflicts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-robot text-2xl text-primary"></i>
                <h1 className="text-xl font-bold text-gray-900">Meta-Agent Orchestrator</h1>
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                ComplianceWorxs
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-primary transition-colors">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">SA</span>
                </div>
                <span className="text-sm text-gray-700">System Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* System Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
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

        {/* Agent Status Monitoring */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Agent Status Monitoring</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentStatusCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        {/* Active Conflicts & Resolution */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Active Conflicts & Resolution</h3>
            <Badge variant="outline" className="bg-orange-100 text-orange-800">
              {activeConflicts.length} Active
            </Badge>
          </div>
          
          <div className="space-y-4">
            {activeConflicts.length > 0 ? (
              activeConflicts.map((conflict) => (
                <ConflictCard key={conflict.id} conflict={conflict} />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active conflicts detected</p>
                </CardContent>
              </Card>
            )}
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
    </div>
  );
}
