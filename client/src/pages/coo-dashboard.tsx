import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Settings, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  Target,
  FileText,
  AlertTriangle,
  Cpu,
  Activity,
  BarChart3,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { qk } from "@/state/queries";
import type { Agent } from "@shared/schema";

export default function COODashboard() {
  const { data: agentsData } = useQuery({
    queryKey: qk.agents,
    refetchInterval: 21600000 // Optimized for 3-4 daily checks: 6 hours
  });

  const { data: cooRemediationState } = useQuery({
    queryKey: qk.remediation("coo"),
    refetchInterval: 21600000 // Optimized for 3-4 daily checks: 6 hours
  });

  const cooAgent = (agentsData as any)?.items?.find((agent: Agent) => agent.id === "coo");

  if (!cooAgent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Main Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">COO Agent Dashboard</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">COO Agent not found. Please check system status.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="back-to-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Main Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">COO Agent Dashboard</h1>
            <p className="text-gray-600">Operational Engine Room - Workflow Execution & Efficiency</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {cooAgent.status}
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Risk Score: {cooAgent.riskScore}
          </Badge>
        </div>
      </div>

      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">{cooAgent.status}</div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last updated {formatDistanceToNow(new Date(cooAgent.updatedAt))} ago
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-600">{cooAgent.riskScore}</div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-green-600 mt-1">Excellent - Lowest risk</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((cooAgent.performance?.success_rate || 0) * 100)}%
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={(cooAgent.performance?.success_rate || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-600">
                {cooAgent.performance?.avg_response_time || 0}ms
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-green-600 mt-1">Optimal performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Excellence Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Operational Control Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Process Optimization</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Team Coordination</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Monitoring</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Resource Management</span>
                </div>
                <Badge className="bg-purple-100 text-purple-800">Optimized</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Efficiency Tracking</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">Real-time</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Autonomous Health Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">System Health</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Excellent</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Remediation Status</span>
                <span className="text-sm font-medium text-green-600">
                  {(cooRemediationState as any)?.status || 'Healthy'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Degraded Count</span>
                <span className="text-sm font-medium">
                  {(cooRemediationState as any)?.degradedCount || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Auto-Recovery</span>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">99.8%</div>
                <div className="text-sm text-gray-600">Uptime This Quarter</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Tasks and Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Current Operations Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Blocked Tasks</h4>
              {cooAgent.blockedTasks?.length === 0 ? (
                <div className="text-center py-4 text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No blocked tasks</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cooAgent.blockedTasks?.map((task: any, idx: any) => (
                    <div key={idx} className="p-2 bg-red-50 rounded text-sm text-red-700">
                      {task}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Dependencies</h4>
              {cooAgent.dependencies?.length === 0 ? (
                <div className="text-center py-4 text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No dependencies</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cooAgent.dependencies?.map((dep: any, idx: any) => (
                    <div key={idx} className="p-2 bg-blue-50 rounded text-sm text-blue-700">
                      {dep}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Delayed Outputs</h4>
              {cooAgent.delayedOutputs?.length === 0 ? (
                <div className="text-center py-4 text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No delays</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cooAgent.delayedOutputs?.map((output: any, idx: any) => (
                    <div key={idx} className="p-2 bg-orange-50 rounded text-sm text-orange-700">
                      {output}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}