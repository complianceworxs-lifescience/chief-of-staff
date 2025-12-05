import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { 
  User, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  Zap,
  FileText,
  Activity,
  BarChart3
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@shared/schema";

interface ExtendedAgent extends Agent {
  avatar?: string;
  displayName?: string;
}

interface AgentStatusCardProps {
  agent: ExtendedAgent;
}

interface RemediationState {
  status: 'healthy' | 'degraded' | 'error' | 'recovering';
  degradedCount: number;
  remediationAttempts: number;
  activePlaybook?: string;
}

export function AgentStatusCardWithRemediation({ agent }: AgentStatusCardProps) {
  const { toast } = useToast();

  // Fetch remediation state
  const { data: remediationState } = useQuery<RemediationState>({
    queryKey: ['/api/remediation/state', agent.id],
    refetchInterval: 7200000, // 2 hour intervals - unified polling schedule
  });

  // Manual remediation trigger
  const remediationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/remediation/trigger', 'POST', {
        agent: agent.id,
        status: 'error',
        lastReport: agent.lastReport,
        metrics: {
          successRate: 0.8,
          alignment: 0.8
        },
        context: {
          errorCode: 'MANUAL_TRIGGER'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Auto-Remediation Triggered",
        description: `Manual remediation started for ${agent.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/remediation/state', agent.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    },
    onError: () => {
      toast({
        title: "Remediation Failed",
        description: "Could not trigger auto-remediation",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'recovering': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return CheckCircle;
      case 'degraded': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'recovering': return RefreshCw;
      default: return User;
    }
  };

  const currentStatus = remediationState?.status || agent.status;
  const StatusIcon = getStatusIcon(currentStatus);
  const isRecovering = remediationState?.status === 'recovering';
  const hasError = remediationState?.status === 'error';

  return (
    <Card className={`transition-all hover:shadow-lg ${isRecovering ? 'border-l-4 border-l-blue-500' : hasError ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={agent.avatar} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {(agent.displayName || agent.name || '').split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{agent.displayName || agent.name}</h3>
              <p className="text-sm text-gray-500">
                Active {agent.lastActive ? formatDistanceToNow(new Date(agent.lastActive), { addSuffix: true }) : 'never'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {remediationState?.activePlaybook && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                <Activity className="h-3 w-3 mr-1" />
                {remediationState.activePlaybook}
              </Badge>
            )}
            <Badge className={getStatusColor(currentStatus)}>
              <StatusIcon className={`h-3 w-3 mr-1 ${isRecovering ? 'animate-spin' : ''}`} />
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Auto-Remediation Status */}
        {remediationState && (remediationState.status === 'recovering' || remediationState.remediationAttempts > 0) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Auto-Remediation Active
                </span>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                NO HITL
              </Badge>
            </div>
            {isRecovering && (
              <div className="space-y-2">
                <div className="text-xs text-blue-700">
                  Running playbook: {remediationState.activePlaybook}
                </div>
                <Progress value={65} className="h-2" />
              </div>
            )}
            <div className="flex justify-between text-xs text-blue-600 mt-2">
              <span>Attempts: {remediationState.remediationAttempts}/2</span>
              <span>Auto-resolving...</span>
            </div>
          </div>
        )}

        {/* Agent Metrics */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Last Report:</span>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {agent.lastReport}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Success Rate:</span>
                <span className="font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Strategic Alignment:</span>
                <span className="font-medium">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {hasError && !isRecovering && (
            <Button
              size="sm"
              onClick={() => remediationMutation.mutate()}
              disabled={remediationMutation.isPending}
              className="flex-1"
              data-testid={`auto-resolve-${agent.id}`}
            >
              <Zap className="h-3 w-3 mr-1" />
              Auto-Resolve
            </Button>
          )}
          
          {agent.id === 'coo' ? (
            <Link href="/coo">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                data-testid="view-coo-dashboard"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                COO Dashboard
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              data-testid={`view-remediation-log-${agent.id}`}
            >
              <FileText className="h-3 w-3 mr-1" />
              View Remediation Log
            </Button>
          )}
        </div>

        {/* Recovery Success Message */}
        {remediationState?.status === 'healthy' && remediationState.remediationAttempts > 0 && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
            <div className="text-xs text-green-800">
              ✓ Conflict cleared by Chief of Staff: Auto-remediation successful
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}