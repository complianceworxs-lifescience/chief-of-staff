import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  User,
  MessageSquare,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface DirectiveFormData {
  targetAgent: string;
  priority: string;
  deadline: string;
  content: string;
}

interface RecentDirective {
  id: string;
  targetAgent: string;
  content: string;
  priority: string;
  status: 'sent' | 'in_progress' | 'completed';
  createdAt: string;
}

export default function DirectiveCenter() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<DirectiveFormData>({
    targetAgent: '',
    priority: 'medium',
    deadline: '',
    content: ''
  });

  // Get directive statistics
  const { data: directiveStats } = useQuery({
    queryKey: ['/api/chief-of-staff/directive-stats'],
    refetchInterval: 7200000 // 2 hour intervals - unified polling schedule
  });

  // Get recent directives
  const { data: recentDirectives = [] } = useQuery<RecentDirective[]>({
    queryKey: ['/api/chief-of-staff/recent-directives'],
    refetchInterval: 7200000 // 2 hour intervals - unified polling schedule
  });

  const sendDirectiveMutation = useMutation({
    mutationFn: async (data: DirectiveFormData) => {
      return apiRequest('POST', '/api/chief-of-staff/send-directive', data);
    },
    onSuccess: () => {
      toast({
        title: "Directive Sent",
        description: `Directive has been sent to ${getAgentName(formData.targetAgent)} successfully.`
      });
      // Reset form
      setFormData({
        targetAgent: '',
        priority: 'medium',
        deadline: '',
        content: ''
      });
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/chief-of-staff/directive-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chief-of-staff/recent-directives'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send directive. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getAgentName = (agentId: string) => {
    const agentMap: Record<string, string> = {
      'ceo': 'CEO',
      'cro': 'CRO Agent',
      'cmo': 'CMO Agent',
      'coo': 'COO Agent',
      'cco': 'CCO Agent',
      'content-manager': 'Content Manager',
      'market-intelligence': 'Market Intelligence Agent'
    };
    return agentMap[agentId] || agentId;
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
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetAgent || !formData.content) {
      toast({
        title: "Missing Information",
        description: "Please select a target agent and enter directive content.",
        variant: "destructive"
      });
      return;
    }
    sendDirectiveMutation.mutate(formData);
  };

  const stats = directiveStats || {
    activeAgents: 7,
    directivesSent: 25,
    completed: 0,
    urgent: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Directive Center</h1>
        <p className="text-gray-600 mt-2">Send strategic directives to any agent in your organization</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeAgents}</p>
                <p className="text-sm text-gray-600">Active Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.directivesSent}</p>
                <p className="text-sm text-gray-600">Directives Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-sm text-gray-600">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send New Directive */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send New Directive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="target-agent">Target Agent</Label>
                <Select 
                  value={formData.targetAgent} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, targetAgent: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cro">CRO Agent</SelectItem>
                    <SelectItem value="cmo">CMO Agent</SelectItem>
                    <SelectItem value="coo">COO Agent</SelectItem>
                    <SelectItem value="cco">CCO Agent</SelectItem>
                    <SelectItem value="content-manager">Content Manager</SelectItem>
                    <SelectItem value="market-intelligence">Market Intelligence Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="content">Directive Content</Label>
                <Textarea
                  placeholder="Enter your directive here... Be specific about what you want the agent to do, any constraints, success criteria, and expected deliverables."
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={sendDirectiveMutation.isPending}
              >
                {sendDirectiveMutation.isPending ? 'Sending...' : 'Send Directive'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Directives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Directives ({recentDirectives.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {recentDirectives.map((directive) => (
                  <div key={directive.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(directive.priority)}>
                          {directive.priority}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(directive.status)}>
                          {directive.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(directive.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">{getAgentName(directive.targetAgent)}</span>
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {directive.content}
                    </p>
                  </div>
                ))}
                
                {recentDirectives.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No recent directives</p>
                    <p className="text-sm">Send your first directive to get started</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}