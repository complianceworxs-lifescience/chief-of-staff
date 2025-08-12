import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Shield,
  Zap,
  AlertTriangle,
  User,
  Bot,
  Play,
  Pause
} from "lucide-react";

interface RuleOfEngagement {
  id: string;
  title: string;
  description: string;
  category: string;
  rules: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AutonomousPlaybook {
  id: string;
  title: string;
  agentId: string;
  triggerCondition: string;
  action: string;
  autonomyLevel: number;
  status: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
  executionCount: number;
  successRate: number;
  riskLevel: string;
  financialImpact: number;
  reasoning: string;
}

interface PlaybookExecution {
  id: string;
  playbookId: string;
  agentId: string;
  trigger: string;
  action: string;
  result: string;
  executedAt: string;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

const ruleFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  maxSingleAction: z.number().min(0).optional(),
  newConflictPlaybooksLevel: z.number().min(1).max(3).optional(),
  alwaysManualActions: z.array(z.string()).optional(),
  autonomyGraduationThreshold: z.number().min(1).optional(),
});

export default function GovernancePage() {
  const { toast } = useToast();
  const [selectedPlaybook, setSelectedPlaybook] = useState<AutonomousPlaybook | null>(null);

  const { data: rules, isLoading: isLoadingRules } = useQuery<RuleOfEngagement[]>({
    queryKey: ['/api/governance/rules'],
    refetchInterval: 30000
  });

  const { data: playbooks, isLoading: isLoadingPlaybooks } = useQuery<AutonomousPlaybook[]>({
    queryKey: ['/api/governance/playbooks'],
    refetchInterval: 10000
  });

  const { data: pendingApprovals } = useQuery<PlaybookExecution[]>({
    queryKey: ['/api/governance/pending-approvals'],
    refetchInterval: 5000
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/governance/rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/governance/rules'] });
      toast({ title: "Rule created successfully" });
    }
  });

  const approvePlaybookMutation = useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => 
      apiRequest('PATCH', `/api/governance/playbooks/${id}/approve`, { approvedBy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/governance/playbooks'] });
      toast({ title: "Playbook approved" });
    }
  });

  const rejectPlaybookMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      apiRequest('PATCH', `/api/governance/playbooks/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/governance/playbooks'] });
      toast({ title: "Playbook rejected" });
    }
  });

  const approveExecutionMutation = useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => 
      apiRequest('PATCH', `/api/governance/executions/${id}/approve`, { approvedBy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/governance/pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/executions'] });
      toast({ title: "Action approved and executed" });
    }
  });

  const form = useForm<z.infer<typeof ruleFormSchema>>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "financial",
    }
  });

  const onSubmitRule = (data: z.infer<typeof ruleFormSchema>) => {
    const ruleData = {
      title: data.title,
      description: data.description,
      category: data.category,
      rules: {
        ...(data.maxSingleAction && { maxSingleAction: data.maxSingleAction }),
        ...(data.newConflictPlaybooksLevel && { newConflictPlaybooksLevel: data.newConflictPlaybooksLevel }),
        ...(data.alwaysManualActions && { alwaysManualActions: data.alwaysManualActions }),
        ...(data.autonomyGraduationThreshold && { autonomyGraduationThreshold: data.autonomyGraduationThreshold }),
      }
    };
    createRuleMutation.mutate(ruleData);
    form.reset();
  };

  const getAutonomyLevelBadge = (level: number) => {
    switch (level) {
      case 1: return <Badge variant="outline" className="text-orange-600 border-orange-300">Level 1: Manual Approval</Badge>;
      case 2: return <Badge variant="outline" className="text-blue-600 border-blue-300">Level 2: Auto with Notification</Badge>;
      case 3: return <Badge variant="outline" className="text-green-600 border-green-300">Level 3: Fully Autonomous</Badge>;
      default: return <Badge variant="outline">Unknown Level</Badge>;
    }
  };

  const getRiskLevelIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <Shield className="h-4 w-4 text-green-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-700" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoadingRules || isLoadingPlaybooks) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const proposedPlaybooks = playbooks?.filter(p => p.status === 'proposed') || [];
  const activePlaybooks = playbooks?.filter(p => p.status === 'active') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Autonomous Governance</h2>
          <p className="text-muted-foreground">
            Two-level delegation system: Set high-level policies, let Chief of Staff manage playbooks
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules?.filter(r => r.isActive).length || 0}</div>
            <p className="text-xs text-muted-foreground">Governing policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Playbooks</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlaybooks.length}</div>
            <p className="text-xs text-muted-foreground">Automated actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(proposedPlaybooks.length + (pendingApprovals?.length || 0))}
            </div>
            <p className="text-xs text-muted-foreground">Require your decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activePlaybooks.reduce((sum, p) => sum + p.executionCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Actions automated</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="rules">Rules of Engagement</TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Playbook Approvals</CardTitle>
              <CardDescription>
                Chief of Staff has created new playbooks that need your approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {proposedPlaybooks.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No playbook approvals pending. Chief of Staff will create new ones as conflicts arise.
                  </AlertDescription>
                </Alert>
              ) : (
                proposedPlaybooks.map((playbook) => (
                  <div key={playbook.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{playbook.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Agent: <Badge variant="outline">{playbook.agentId}</Badge>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRiskLevelIcon(playbook.riskLevel)}
                        {getAutonomyLevelBadge(playbook.autonomyLevel)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs font-medium">Trigger Condition</Label>
                        <p className="text-sm">{playbook.triggerCondition}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Proposed Action</Label>
                        <p className="text-sm">{playbook.action}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Reasoning</Label>
                        <p className="text-sm text-muted-foreground">{playbook.reasoning}</p>
                      </div>
                      {playbook.financialImpact > 0 && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Financial impact: ${playbook.financialImpact}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approvePlaybookMutation.mutate({
                          id: playbook.id,
                          approvedBy: "System Admin"
                        })}
                        disabled={approvePlaybookMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve Playbook
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectPlaybookMutation.mutate({
                          id: playbook.id,
                          reason: "Rejected by admin"
                        })}
                        disabled={rejectPlaybookMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Approvals</CardTitle>
              <CardDescription>
                Level 1 playbooks requiring your approval before execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pendingApprovals?.length ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No action approvals pending. Approved playbooks will appear here when triggered.
                  </AlertDescription>
                </Alert>
              ) : (
                pendingApprovals.map((execution) => (
                  <div key={execution.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">Action Required</h4>
                        <p className="text-sm text-muted-foreground">
                          Agent: <Badge variant="outline">{execution.agentId}</Badge>
                        </p>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Pending Approval
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs font-medium">Trigger</Label>
                        <p className="text-sm">{execution.trigger}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Proposed Action</Label>
                        <p className="text-sm">{execution.action}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveExecutionMutation.mutate({
                          id: execution.id,
                          approvedBy: "System Admin"
                        })}
                        disabled={approveExecutionMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Approve & Execute
                      </Button>
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4 mr-1" />
                        Delay
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Playbooks Tab */}
        <TabsContent value="playbooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Autonomous Playbooks</CardTitle>
              <CardDescription>
                Playbooks created by Chief of Staff and approved by you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activePlaybooks.length === 0 ? (
                <Alert>
                  <BookOpen className="h-4 w-4" />
                  <AlertDescription>
                    No active playbooks yet. Chief of Staff will create them as conflicts arise and patterns emerge.
                  </AlertDescription>
                </Alert>
              ) : (
                activePlaybooks.map((playbook) => (
                  <div key={playbook.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{playbook.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{playbook.agentId}</Badge>
                          {getRiskLevelIcon(playbook.riskLevel)}
                          <span className="text-sm text-muted-foreground">{playbook.riskLevel} risk</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        {getAutonomyLevelBadge(playbook.autonomyLevel)}
                        <p className="text-xs text-muted-foreground">
                          {playbook.executionCount} executions • {playbook.successRate}% success
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium">Trigger</Label>
                        <p className="text-muted-foreground">{playbook.triggerCondition}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Action</Label>
                        <p className="text-muted-foreground">{playbook.action}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(playbook.createdAt).toLocaleDateString()}
                        {playbook.approvedAt && ` • Approved: ${new Date(playbook.approvedAt).toLocaleDateString()}`}
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Rule</CardTitle>
                <CardDescription>
                  Set high-level policies that govern how Chief of Staff creates playbooks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitRule)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rule Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Financial Guardrails" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what this rule governs..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="financial">Financial Guardrails</SelectItem>
                              <SelectItem value="autonomy">Autonomy Graduation</SelectItem>
                              <SelectItem value="conflict">Conflict Handling</SelectItem>
                              <SelectItem value="human_loop">Human-in-the-Loop</SelectItem>
                              <SelectItem value="performance">Performance Standards</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("category") === "financial" && (
                      <FormField
                        control={form.control}
                        name="maxSingleAction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Single Action Amount ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1000" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch("category") === "autonomy" && (
                      <FormField
                        control={form.control}
                        name="autonomyGraduationThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Approval Threshold for Auto-graduation</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="5" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Button type="submit" disabled={createRuleMutation.isPending}>
                      {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Rules of Engagement</CardTitle>
                <CardDescription>
                  Your high-level policies governing autonomous behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rules?.length === 0 ? (
                  <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                      No rules configured yet. Create your first rule to start governing autonomous behavior.
                    </AlertDescription>
                  </Alert>
                ) : (
                  rules?.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{rule.title}</h4>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">{rule.category}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(rule.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}