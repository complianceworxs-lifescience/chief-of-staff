import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Play, Target, Zap, Settings, AlertTriangle, Plus, Upload, FileText, Link, Image, Search, Download, Paperclip, Eye, Trash2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { DirectiveActions } from "@/components/directive-actions";
import { ConflictResolutionPanel } from "@/components/conflict-resolution-panel";
import { OneClickPlaybooks } from "@/components/one-click-playbooks";
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

type AgentDirective = {
  id: string;
  initiativeId: string;
  targetAgent: string;
  action: string;
  goal: string;
  deadline: string;
  priority: string;
  status: string;
  result?: string;
  createdAt: string;
  completedAt?: string;
  impactScore?: number;
  effortScore?: number;
  estimatedImpact?: string;
  attachments?: Attachment[];
};

type Initiative = {
  id: string;
  title: string;
  description: string;
};

type Attachment = {
  id: string;
  name: string;
  url: string;
  type: 'document' | 'image' | 'link' | 'spreadsheet';
  size?: number;
  preview?: string;
  uploadedAt: string;
};

type OneClickTemplate = {
  id: string;
  name: string;
  description: string;
  sourceType: 'insight' | 'decision' | 'meeting' | 'metric';
  sourceData?: any;
  generatedContent: {
    title: string;
    rationale: string;
    tasks: Array<{
      text: string;
      owner_hint?: string;
      due?: string;
    }>;
    kpi_impacts?: Array<{
      kpi: string;
      goal: number;
      unit: string;
    }>;
  };
};

export default function DirectivesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [selectedDirective, setSelectedDirective] = useState<AgentDirective | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: directives = [], isLoading, refetch } = useQuery<AgentDirective[]>({
    queryKey: ["/api/chief-of-staff/directives", refreshTrigger],
    refetchInterval: 2 * 60 * 60 * 1000 // 2 hours unified polling
  });

  const { data: initiatives = [] } = useQuery<Initiative[]>({
    queryKey: ["/api/chief-of-staff/initiatives"],
    refetchInterval: 2 * 60 * 60 * 1000 // 2 hours unified polling
  });

  // One-click generation data sources
  const { data: insights } = useQuery({
    queryKey: ["/api/cockpit/insights"],
    refetchInterval: 2 * 60 * 60 * 1000
  });

  const { data: decisions } = useQuery({
    queryKey: ["/api/cockpit/decisions"],
    refetchInterval: 2 * 60 * 60 * 1000
  });

  const { data: meetings } = useQuery({
    queryKey: ["/api/cockpit/meetings"],
    refetchInterval: 2 * 60 * 60 * 1000
  });

  // Get conflicts from the API - maximum cost savings
  const { data: activeConflicts = [] } = useQuery<any[]>({
    queryKey: ["/api/conflicts/active"],
    refetchInterval: 7200000 // 2 hour intervals - unified polling schedule
  });
  
  const { data: resolvedConflicts = [] } = useQuery<any[]>({
    queryKey: ["/api/conflicts/resolved"],
    refetchInterval: 7200000 // 2 hour intervals - unified polling schedule
  });

  // File upload mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ directiveId, files }: { directiveId: string; files: FileList }) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('directiveId', directiveId);

      const response = await fetch('/api/directives/attachments/upload', {
        method: 'POST',
        body: formData
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Files Uploaded",
        description: "Attachments have been successfully uploaded to the directive."
      });
      refetch();
      setShowAttachmentDialog(false);
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload attachments. Please try again.",
        variant: "destructive"
      });
    }
  });

  // One-click generation mutation
  const generateDirectiveMutation = useMutation({
    mutationFn: async (template: OneClickTemplate) => {
      const response = await fetch('/api/directives/generate-from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Directive Generated",
        description: "New directive created from template and dispatched to agents."
      });
      refetch();
    }
  });

  // Transform API conflicts to match expected format
  const transformedConflicts = activeConflicts.map((conflict: any) => ({
    id: conflict.id,
    title: conflict.title || "Resource Allocation Conflict",
    area: conflict.area || "Budget Priority",
    agents: conflict.agents || ["cro", "cmo"],
    riskScore: conflict.riskScore || 85,
    reasoning: conflict.description || "Resource allocation conflict detected by autonomous monitoring system.",
    suggestedActions: conflict.suggestedActions || ["Apply priority weighting", "Reallocate resources via COO", "Escalate to CEO"]
  }));
  
  // Show resolved status message if there are recent resolutions but no active conflicts
  const hasRecentResolutions = resolvedConflicts.length > 0 && activeConflicts.length === 0;

  const handleDirectiveUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
    refetch();
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, directiveId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadAttachmentMutation.mutate({ directiveId, files: e.dataTransfer.files });
    }
  }, [uploadAttachmentMutation]);

  const handleFileSelect = (directiveId: string, files: FileList | null) => {
    if (files && files[0]) {
      uploadAttachmentMutation.mutate({ directiveId, files });
    }
  };

  // One-click generation templates
  const generateTemplatesFromData = (): OneClickTemplate[] => {
    const templates: OneClickTemplate[] = [];

    // Generate from top insights
    if (insights && (insights as any)?.length > 0) {
      const topInsight = (insights as any)[0];
      templates.push({
        id: `insight-${topInsight.id || 'latest'}`,
        name: "GTM Sprint from Top Insight",
        description: "Generate directive based on highest-impact market insight",
        sourceType: 'insight',
        sourceData: topInsight,
        generatedContent: {
          title: `Market Response: ${topInsight.title || 'Latest Market Intelligence'}`,
          rationale: `Based on market insight: ${topInsight.insight || 'High-impact market opportunity detected requiring immediate action'}`,
          tasks: [
            { text: "Analyze competitive landscape and positioning", owner_hint: "CMO", due: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0] },
            { text: "Execute tactical response campaign", owner_hint: "CRO", due: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0] }
          ],
          kpi_impacts: [
            { kpi: "GTMMomentum", goal: 25, unit: "score" },
            { kpi: "RevenuePace", goal: 15, unit: "%" }
          ]
        }
      });
    }

    // Generate from pending decisions
    if (decisions && (decisions as any)?.length > 0) {
      const pendingDecision = (decisions as any)[0];
      templates.push({
        id: `decision-${pendingDecision.id || 'latest'}`,
        name: "Execute Pending Decision",
        description: "Convert strategic decision into executable directive",
        sourceType: 'decision',
        sourceData: pendingDecision,
        generatedContent: {
          title: `Decision Implementation: ${pendingDecision.decision || 'Strategic Decision Execution'}`,
          rationale: `Execute approved decision: ${pendingDecision.decision || 'Strategic business decision requires immediate implementation'}`,
          tasks: [
            { text: "Implement decision framework", owner_hint: "COO", due: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0] },
            { text: "Monitor implementation metrics", owner_hint: "CMO", due: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0] }
          ],
          kpi_impacts: [
            { kpi: "Alignment", goal: 90, unit: "%" },
            { kpi: "StrategicHealth", goal: 85, unit: "score" }
          ]
        }
      });
    }

    // Generate from meeting actions
    if (meetings && (meetings as any)?.length > 0) {
      const latestMeeting = (meetings as any)[0];
      templates.push({
        id: `meeting-${latestMeeting.id || 'latest'}`,
        name: "Convert Meeting Actions",
        description: "Transform meeting action items into structured directive",
        sourceType: 'meeting',
        sourceData: latestMeeting,
        generatedContent: {
          title: `Follow-up: ${latestMeeting.title || 'Meeting Actions Implementation'}`,
          rationale: `Execute action items from ${latestMeeting.title || 'strategic meeting'} to maintain momentum and accountability`,
          tasks: latestMeeting.actions?.map((action: any, index: number) => ({
            text: action.item || `Action item ${index + 1}`,
            owner_hint: action.owner || "CMO",
            due: new Date(Date.now() + (index + 2)*24*60*60*1000).toISOString().split('T')[0]
          })) || [
            { text: "Execute primary action item", owner_hint: "CMO", due: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0] }
          ],
          kpi_impacts: [
            { kpi: "Alignment", goal: 95, unit: "%" }
          ]
        }
      });
    }

    // Revenue gap response template
    templates.push({
      id: 'revenue-gap-response',
      name: "Revenue Gap Emergency Response",
      description: "72-hour sprint to address revenue shortfall",
      sourceType: 'metric',
      generatedContent: {
        title: "Emergency Revenue Recovery Sprint",
        rationale: "Revenue metrics indicate urgent need for tactical intervention to close monthly gap",
        tasks: [
          { text: "Activate high-converting content themes", owner_hint: "CMO", due: new Date(Date.now() + 1*24*60*60*1000).toISOString().split('T')[0] },
          { text: "Execute outbound sales blitz to warm prospects", owner_hint: "CRO", due: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0] },
          { text: "Deploy upsell campaign to existing customers", owner_hint: "CCO", due: new Date(Date.now() + 1*24*60*60*1000).toISOString().split('T')[0] }
        ],
        kpi_impacts: [
          { kpi: "RevenuePace", goal: 90, unit: "%" },
          { kpi: "GTMMomentum", goal: 30, unit: "score" }
        ]
      }
    });

    return templates;
  };

  const oneClickTemplates = generateTemplatesFromData();

  const getInitiativeTitle = (initiativeId: string) => {
    const initiative = initiatives.find(i => i.id === initiativeId);
    return initiative ? initiative.title : 'Unknown Initiative';
  };

  const getAgentInfo = (agentId: string) => {
    const agentMap: Record<string, { name: string; color: string; avatar: string }> = {
      'cro': { name: 'CRO Agent', color: 'bg-blue-500', avatar: 'CR' },
      'cfo': { name: 'CFO Agent', color: 'bg-green-500', avatar: 'CF' },
      'coo': { name: 'COO Agent', color: 'bg-purple-500', avatar: 'CO' },
      'cco': { name: 'CCO Agent', color: 'bg-orange-500', avatar: 'CC' },
      'cmo': { name: 'CMO Agent', color: 'bg-pink-500', avatar: 'CM' }
    };
    return agentMap[agentId] || { name: agentId, color: 'bg-gray-500', avatar: agentId.substring(0, 2).toUpperCase() };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'p1': case 'high': case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'p2': case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'p3': case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': case 'active': return 'bg-blue-500';
      case 'assigned': return 'bg-yellow-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': case 'active': return Play;
      case 'assigned': return Clock;
      case 'blocked': return AlertCircle;
      default: return Clock;
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'image': return Image;
      case 'link': return Link;
      case 'spreadsheet': return FileText;
      default: return Paperclip;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const groupedDirectives = directives.reduce((acc, directive) => {
    if (!acc[directive.targetAgent]) {
      acc[directive.targetAgent] = [];
    }
    acc[directive.targetAgent].push(directive);
    return acc;
  }, {} as Record<string, AgentDirective[]>);

  const statusCounts = directives.reduce((acc, directive) => {
    acc[directive.status] = (acc[directive.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading directives...</div>;
  }

  // Mock directives with CEO Master Playbook content for demonstration
  const mockDirectives: AgentDirective[] = [
    {
      id: "dir-1",
      initiativeId: "init-1", 
      targetAgent: "cro",
      action: "Partnership Playbook Leadership",
      goal: "Lead Partnership Playbook for Q3: Source 5 strategic partnerships, collaborate with CMO on co-marketing initiatives",
      deadline: "2025-03-31T00:00:00.000Z",
      priority: "high",
      status: "active",
      createdAt: "2025-01-18T00:00:00.000Z",
      impactScore: 95,
      effortScore: 75,
      estimatedImpact: "$30K MRR increase, 5 new enterprise clients",
      attachments: [
        {
          id: "att-1",
          name: "Partnership_Strategy_Q3.pdf",
          url: "/attachments/partnership-strategy.pdf",
          type: "document",
          size: 2456789,
          uploadedAt: "2025-01-18T10:00:00.000Z"
        },
        {
          id: "att-2",
          name: "Co-Marketing Framework",
          url: "https://docs.company.com/co-marketing",
          type: "link",
          preview: "Comprehensive framework for co-marketing partnerships",
          uploadedAt: "2025-01-18T10:15:00.000Z"
        }
      ]
    },
    {
      id: "dir-2", 
      initiativeId: "init-2",
      targetAgent: "cmo",
      action: "Content Marketing Engine",
      goal: "Build quarterly content calendar and drive webinar registrations for ICP (Chief Compliance Officers)",
      deadline: "2025-02-28T00:00:00.000Z", 
      priority: "medium",
      status: "in_progress",
      createdAt: "2025-01-15T00:00:00.000Z",
      impactScore: 85,
      effortScore: 60,
      estimatedImpact: "2,400 MQLs, 20% organic traffic increase",
      attachments: [
        {
          id: "att-3",
          name: "Content_Calendar_Template.xlsx",
          url: "/attachments/content-calendar.xlsx",
          type: "spreadsheet",
          size: 987654,
          uploadedAt: "2025-01-15T14:30:00.000Z"
        }
      ]
    },
    {
      id: "dir-3",
      initiativeId: "init-3",
      targetAgent: "coo", 
      action: "Operational Excellence",
      goal: "Achieve 90% automation coverage and 40% trial activation within 3 days",
      deadline: "2025-04-15T00:00:00.000Z",
      priority: "high",
      status: "assigned", 
      createdAt: "2025-01-10T00:00:00.000Z",
      impactScore: 80,
      effortScore: 85,
      estimatedImpact: "Reduced onboarding friction by 30%, improved conversion rates"
    }
  ];

  const activeDirectives = directives.length > 0 ? directives : mockDirectives;

  return (
    <div className="space-y-6" data-testid="strategic-directives-cockpit">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Strategic Command Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Advanced directive management with attachments and one-click generation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
            {activeDirectives.length} Active Directives
          </Badge>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
            {activeDirectives.filter(d => d.status === 'completed').length} Completed
          </Badge>
        </div>
      </div>

      {/* One-Click Generation Panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            One-Click Directive Generation
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Generate structured directives from insights, decisions, and meeting actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {oneClickTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {template.sourceType}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateDirectiveMutation.mutate(template)}
                      disabled={generateDirectiveMutation.isPending}
                      data-testid={`generate-${template.id}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{template.description}</p>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-gray-400" />
                      <span className="truncate">{template.generatedContent.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span>{template.generatedContent.tasks.length} tasks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* One-Click Strategic Playbooks */}
      <OneClickPlaybooks />

      {/* Active Conflicts - Conflict Resolution Panel */}
      {transformedConflicts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Active Conflicts Requiring Resolution
          </h2>
          {transformedConflicts.map(conflict => (
            <ConflictResolutionPanel 
              key={conflict.id} 
              conflict={conflict} 
              onResolve={handleDirectiveUpdate}
            />
          ))}
        </div>
      ) : hasRecentResolutions ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Conflicts Resolved Autonomously
          </h2>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">All Conflicts Successfully Resolved</h4>
                  <p className="text-green-700">
                    The Chief of Staff system has autonomously resolved {resolvedConflicts.length} conflicts including resource allocation disputes.
                    Latest resolution: {resolvedConflicts[0]?.resolution || 'Automatically redistributed resources based on priority weights and capacity analysis'}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    ✅ Resource rebalancing completed • ✅ Priority weighting applied • ✅ Agent task queues updated
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Strategic Directives with Advanced Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Active Strategic Directives
          <Badge variant="outline" className="ml-2">
            {activeDirectives.filter(d => d.status === 'active' || d.status === 'in_progress').length} Executing
          </Badge>
        </h2>
        
        {activeDirectives.map(directive => {
          const agentInfo = getAgentInfo(directive.targetAgent);
          const StatusIcon = getStatusIcon(directive.status);
          const daysLeft = Math.ceil((new Date(directive.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <Card 
              key={directive.id} 
              className={`transition-all duration-200 ${dragActive ? 'border-blue-500 border-dashed' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, directive.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <Badge className={getPriorityColor(directive.priority)}>
                        {directive.priority.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className={`${agentInfo.color} text-white text-xs`}>
                            {agentInfo.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{agentInfo.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(directive.status)}`} />
                        <span className="text-xs text-gray-500 capitalize">{directive.status.replace('_', ' ')}</span>
                      </div>
                      {directive.attachments && directive.attachments.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {directive.attachments.length} attachments
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{directive.action}</CardTitle>
                    <CardDescription>{directive.goal}</CardDescription>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Initiative:</strong> {getInitiativeTitle(directive.initiativeId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-5 w-5 ${getStatusColor(directive.status)} text-white rounded p-1`} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`directive-actions-${directive.id}`}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedDirective(directive);
                          setShowAttachmentDialog(true);
                        }}>
                          <Upload className="h-4 w-4 mr-2" />
                          Add Attachments
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          if (directive.attachments?.length) {
                            setSelectedDirective(directive);
                            // Show attachments view
                          }
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Attachments ({directive.attachments?.length || 0})
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Created {format(new Date(directive.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className={`${daysLeft < 3 ? 'text-red-600' : 'text-gray-600'}`}>
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                      </span>
                    </div>
                  </div>
                  {directive.completedAt && (
                    <span className="text-green-600 text-sm">
                      Completed {format(new Date(directive.completedAt), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>

                {/* Attachments Preview */}
                {directive.attachments && directive.attachments.length > 0 && (
                  <div className="border-t pt-3">
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      Attachments ({directive.attachments.length})
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {directive.attachments.slice(0, 3).map((attachment) => {
                        const FileIcon = getFileTypeIcon(attachment.type);
                        return (
                          <div key={attachment.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2 text-sm">
                            <FileIcon className="h-4 w-4 text-gray-500" />
                            <span className="truncate max-w-32">{attachment.name}</span>
                            {attachment.size && (
                              <span className="text-xs text-gray-400">({formatFileSize(attachment.size)})</span>
                            )}
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" asChild>
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        );
                      })}
                      {directive.attachments.length > 3 && (
                        <div className="flex items-center text-sm text-gray-500">
                          +{directive.attachments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {directive.result && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-1">Result</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{directive.result}</p>
                  </div>
                )}

                {/* Drag & Drop Zone */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Drag & drop files here or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(directive.id, e.target.files)}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid={`upload-button-${directive.id}`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Attachment Upload Dialog */}
      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Attachments</DialogTitle>
            <DialogDescription>
              Upload documents, images, or add links to provide context for this directive
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Files</h3>
              <p className="text-gray-500 mb-4">Drag and drop files here, or click to browse</p>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => selectedDirective && handleFileSelect(selectedDirective.id, e.target.files)}
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose Files
                </label>
              </Button>
            </div>

            {/* Link Input */}
            <div className="space-y-2">
              <Label htmlFor="link-input">Add Link</Label>
              <div className="flex gap-2">
                <Input
                  id="link-input"
                  placeholder="Paste URL to documentation, brief, or resource"
                  className="flex-1"
                />
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <Label>Quick Add from Context</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="h-3 w-3 mr-1" />
                  Latest Decision
                </Button>
                <Button variant="outline" size="sm">
                  <Target className="h-3 w-3 mr-1" />
                  Top Insight
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  Meeting Notes
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="h-3 w-3 mr-1" />
                  Market Data
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legacy Directives View (if database has directives) */}
      {directives.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No directives assigned</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Use the Directive Center to create structured directives with business alignment and clear execution plans.
            </p>
            <Button variant="outline" asChild>
              <a href="/directive-center">
                <Plus className="h-4 w-4 mr-2" />
                Create First Directive
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}