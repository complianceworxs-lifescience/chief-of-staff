import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowRight, 
  Pause, 
  Play, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Target,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Shield,
  AlertCircle,
  Timer
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DirectiveConflict {
  id: string;
  conflictType: string;
  agents: string[];
  description: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  status: string;
}

interface DirectiveActionsProps {
  directive: {
    id: string;
    title: string;
    assignedAgent: string;
    priority: string;
    status: string;
    impactScore: number;
    effortScore: number;
    estimatedImpact: string;
    lastConflict?: DirectiveConflict;
    conflictCount?: number;
  };
  onUpdate: () => void;
}

export function DirectiveActions({ directive, onUpdate }: DirectiveActionsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [showReassign, setShowReassign] = useState(false);

  const agents = [
    { id: "ceo", name: "CEO Agent", color: "bg-primary" },
    { id: "cro", name: "CRO Agent", color: "bg-success-green" },
    { id: "cmo", name: "CMO Agent", color: "bg-purple-600" },
    { id: "coo", name: "COO Agent", color: "bg-indigo-600" },
    { id: "content-manager", name: "Content Manager", color: "bg-teal-600" },
    { id: "market-intelligence", name: "Market Intelligence", color: "bg-blue-600" }
  ];

  const handleAction = async (action: string, targetAgent?: string) => {
    setIsLoading(true);
    try {
      let result;
      
      switch (action) {
        case 'reassign':
          if (!targetAgent) return;
          result = await apiRequest(`/api/directives/${directive.id}/reassign`, 'POST', { newAgent: targetAgent });
          toast({
            title: "Directive Reassigned",
            description: `Successfully moved to ${agents.find(a => a.id === targetAgent)?.name}`,
          });
          break;
          
        case 'pause':
          result = await apiRequest(`/api/directives/${directive.id}/status`, 'PATCH', { status: 'paused' });
          toast({
            title: "Directive Paused",
            description: "Task execution suspended until resumed",
          });
          break;
          
        case 'resume':
          result = await apiRequest(`/api/directives/${directive.id}/status`, 'PATCH', { status: 'active' });
          toast({
            title: "Directive Resumed",
            description: "Task execution reactivated",
          });
          break;
          
        case 'cancel':
          result = await apiRequest(`/api/directives/${directive.id}/status`, 'PATCH', { status: 'cancelled' });
          toast({
            title: "Directive Cancelled",
            description: "Task removed from active queue",
          });
          break;
          
        case 'escalate':
          result = await apiRequest(`/api/directives/${directive.id}/escalate`, 'POST', { escalateTo: 'ceo', reason: 'User-initiated escalation for override' });
          toast({
            title: "Directive Escalated",
            description: "Moved to CEO Agent for executive override",
          });
          break;
          
        case 'clone':
          result = await apiRequest(`/api/directives/${directive.id}/clone`, 'POST', {});
          toast({
            title: "Directive Cloned",
            description: "Created duplicate for parallel execution",
          });
          break;
          
        case 'intercede':
          result = await apiRequest(`/api/directives/${directive.id}/intercede`, 'POST', { 
            reason: 'Manual intervention requested',
            pauseExecution: true 
          });
          toast({
            title: "Interceding in Directive",
            description: "Agent execution paused, directive moved to manual review queue",
          });
          break;
      }
      
      onUpdate();
      setShowReassign(false);
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Unable to execute directive action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactIcon = (impact: string) => {
    if (impact.includes('revenue') || impact.includes('$')) return <DollarSign className="h-4 w-4" />;
    if (impact.includes('traffic') || impact.includes('growth')) return <TrendingUp className="h-4 w-4" />;
    if (impact.includes('automation') || impact.includes('efficiency')) return <Target className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Enhanced governance-based conflict resolution data
  const mockLastConflict = directive.lastConflict || {
    id: "cfx_8b2f",
    conflictType: "revenue",
    agents: ["CMO", "CRO"],
    description: "Timeline conflict: CMO wanted 2-week awareness campaign, CRO needed 1-week sales sprint",
    resolution: "CRO wins (Revenue-first hierarchy) - Launch 1-week enterprise sales sprint; postpone awareness to Q next",
    resolvedBy: "auto",
    resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    status: "resolved",
    governanceRule: "CRO_over_brand",
    impactScore: 92,
    revenueRisk: 30000
  };

  const hasActiveConflict = directive.status === 'conflict' || (directive.lastConflict && directive.lastConflict.status === 'active');
  const hasRecentConflict = directive.lastConflict || mockLastConflict;
  const conflictCount = directive.conflictCount || 2;

  return (
    <Card className="mb-4" data-testid={`directive-card-${directive.id}`}>
      {/* Conflict Banner */}
      {hasActiveConflict && (
        <div className="bg-orange-50 border-l-4 border-l-orange-500 p-3 m-4 mb-0 rounded">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-orange-800 font-medium">
              Conflict Detected: {hasRecentConflict.agents.map(a => a.toUpperCase()).join(' vs ')} Agent
            </span>
          </div>
          <p className="text-orange-700 text-sm mt-1">
            Resolution: {hasRecentConflict.resolvedBy === 'auto' ? 'Auto-resolved' : 'Manual intervention'} - {hasRecentConflict.resolution}
          </p>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{directive.title}</CardTitle>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getPriorityColor(directive.priority)}>
                {directive.priority.toUpperCase()}
              </Badge>
              <Badge className={getStatusColor(directive.status)}>
                {directive.status.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {agents.find(a => a.id === directive.assignedAgent)?.name || directive.assignedAgent}
              </Badge>
              {conflictCount > 0 && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  ✅ {conflictCount} auto-resolved
                </Badge>
              )}
              {mockLastConflict.governanceRule && (
                <Badge className="bg-blue-100 text-blue-700 text-xs">
                  Rule: {mockLastConflict.governanceRule.replace('_', ' → ')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                {getImpactIcon(directive.estimatedImpact)}
                <span>{directive.estimatedImpact}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Impact: {directive.impactScore}/100</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Effort: {directive.effortScore}/100</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Separator className="mb-4" />
        
        {/* Direct Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Reassign Agent */}
          <Dialog open={showReassign} onOpenChange={setShowReassign}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                data-testid={`button-reassign-${directive.id}`}
              >
                <ArrowRight className="h-4 w-4" />
                Reassign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reassign Directive</DialogTitle>
                <DialogDescription>
                  Move this directive to a different agent for execution.
                </DialogDescription>
              </DialogHeader>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.filter(a => a.id !== directive.assignedAgent).map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button
                  onClick={() => handleAction('reassign', selectedAgent)}
                  disabled={!selectedAgent || isLoading}
                >
                  Reassign Directive
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Pause/Resume */}
          {directive.status === 'active' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('pause')}
              disabled={isLoading}
              className="flex items-center gap-1"
              data-testid={`button-pause-${directive.id}`}
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          ) : directive.status === 'paused' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('resume')}
              disabled={isLoading}
              className="flex items-center gap-1"
              data-testid={`button-resume-${directive.id}`}
            >
              <Play className="h-4 w-4" />
              Resume
            </Button>
          ) : null}

          {/* Intercede (Priority button for conflicts) */}
          {hasActiveConflict || hasRecentConflict ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('intercede')}
              disabled={isLoading}
              className="flex items-center gap-1 border-orange-300 text-orange-700 hover:bg-orange-50"
              data-testid={`button-intercede-${directive.id}`}
            >
              <Shield className="h-4 w-4" />
              Intercede
            </Button>
          ) : (
            /* Escalate (Default option when no conflicts) */
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('escalate')}
              disabled={isLoading || directive.assignedAgent === 'ceo'}
              className="flex items-center gap-1"
              data-testid={`button-escalate-${directive.id}`}
            >
              <AlertTriangle className="h-4 w-4" />
              Escalate
            </Button>
          )}

          {/* Clone & Split */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('clone')}
            disabled={isLoading}
            className="flex items-center gap-1"
            data-testid={`button-clone-${directive.id}`}
          >
            <Copy className="h-4 w-4" />
            Clone
          </Button>

          {/* Cancel */}
          {directive.status !== 'cancelled' && directive.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('cancel')}
              disabled={isLoading}
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
              data-testid={`button-cancel-${directive.id}`}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
        
        {/* Last Conflict Resolution Log */}
        {hasRecentConflict && (
          <>
            <Separator className="my-4" />
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Last Conflict ({hasRecentConflict.resolvedAt ? formatDistanceToNow(new Date(hasRecentConflict.resolvedAt)) : 'Recently'} ago)
                    </span>
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      ✅ AUTO-RESOLVED
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      {mockLastConflict.governanceRule || 'GOVERNANCE APPLIED'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {hasRecentConflict.description}
                  </p>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">
                      <span className="font-medium">Resolution:</span> {hasRecentConflict.resolution}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}