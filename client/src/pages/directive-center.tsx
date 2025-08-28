import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Clock, AlertCircle, CheckCircle, Target, Plus, Trash2, Calendar, Eye, Send, TestTube } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Task {
  text: string;
  owner_hint?: string;
  due?: string;
  link?: string;
}

interface SuccessCriteria {
  kpi: string;
  goal: number;
  unit: string;
  by?: string;
}

interface KpiImpact {
  kpi: string;
  goal?: number;
  unit?: string;
  by?: string;
  note?: string;
}

interface DirectiveFormData {
  version: string;
  target_agents: string[];
  watchers: string[];
  priority: string;
  deadline?: string;
  directive_type: string;
  objective?: {
    id?: string;
    name?: string;
  };
  kpi_impacts: KpiImpact[];
  title: string;
  rationale: string;
  tasks: Task[];
  success_criteria: SuccessCriteria[];
  requires_ceo_approval: boolean;
  escalation_after_hours: number;
  schedule?: {
    type: 'once' | 'recurring';
    datetime?: string;
    rrule?: string;
  };
  template_id?: string;
  attachments: string[];
  metadata: Record<string, any>;
}

export default function DirectiveCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<DirectiveFormData>({
    version: '1.0',
    target_agents: [],
    watchers: [],
    priority: 'medium',
    directive_type: 'operational',
    kpi_impacts: [],
    title: '',
    rationale: '',
    tasks: [{ text: '' }],
    success_criteria: [],
    requires_ceo_approval: false,
    escalation_after_hours: 72,
    attachments: [],
    metadata: { source: 'CoS-UI', room: 'Dashboard/DirectiveForm' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const getAgentName = (agentId: string) => {
    const agentMap: Record<string, string> = {
      'CEO': 'CEO',
      'CFO': 'CFO',
      'CoS': 'Chief of Staff',
      'CRO': 'CRO',
      'CMO': 'CMO',
      'COO': 'COO',
      'CCO': 'CCO',
      'Content': 'Content Manager',
      'MarketIntel': 'Market Intelligence'
    };
    return agentMap[agentId] || agentId;
  };

  const agentOptions = ['CMO', 'CRO', 'Content', 'CCO', 'COO', 'CEO', 'CoS'];
  const kpiOptions = ['RevenuePace', 'StrategicHealth', 'Alignment', 'RiskRadar', 'GTMMomentum', 'Custom'];
  const unitOptions = ['%', 'score', '$', 'count', 'hours', 'Custom'];

  const templates = [
    { id: '72h-gtm-sprint', name: '72-hour GTM sprint' },
    { id: 'content-brief', name: 'Fast-track content brief' },
    { id: 'compliance-risk', name: 'Close High compliance risk' },
    { id: 'budget-experiment', name: 'Budget shift + experiment' }
  ];

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (formData.target_agents.length === 0) errors.push('At least one target agent is required');
    if (!formData.title.trim()) errors.push('Title is required');
    if (formData.title.length < 4 || formData.title.length > 140) errors.push('Title must be 4-140 characters');
    if (!formData.rationale.trim()) errors.push('Rationale is required');
    if (formData.rationale.length < 10) errors.push('Rationale must be at least 10 characters');
    if (formData.tasks.length === 0 || !formData.tasks[0].text.trim()) errors.push('At least one task is required');
    if (formData.directive_type === 'daily_run' && !formData.schedule) errors.push('Schedule is required for daily run directives');
    if (formData.requires_ceo_approval && !formData.watchers.includes('CEO')) {
      errors.push('CEO must be added to watchers when approval is required');
    }
    
    return errors;
  };

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { text: '' }]
    }));
  };

  const removeTask = (index: number) => {
    if (formData.tasks.length > 1) {
      setFormData(prev => ({
        ...prev,
        tasks: prev.tasks.filter((_, i) => i !== index)
      }));
    }
  };

  const updateTask = (index: number, field: keyof Task, value: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const addSuccessCriteria = () => {
    setFormData(prev => ({
      ...prev,
      success_criteria: [...prev.success_criteria, { kpi: 'RevenuePace', goal: 0, unit: '%' }]
    }));
  };

  const removeSuccessCriteria = (index: number) => {
    setFormData(prev => ({
      ...prev,
      success_criteria: prev.success_criteria.filter((_, i) => i !== index)
    }));
  };

  const updateSuccessCriteria = (index: number, field: keyof SuccessCriteria, value: any) => {
    setFormData(prev => ({
      ...prev,
      success_criteria: prev.success_criteria.map((criteria, i) => 
        i === index ? { ...criteria, [field]: value } : criteria
      )
    }));
  };

  const addKpiImpact = () => {
    setFormData(prev => ({
      ...prev,
      kpi_impacts: [...prev.kpi_impacts, { kpi: 'RevenuePace' }]
    }));
  };

  const removeKpiImpact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      kpi_impacts: prev.kpi_impacts.filter((_, i) => i !== index)
    }));
  };

  const updateKpiImpact = (index: number, field: keyof KpiImpact, value: any) => {
    setFormData(prev => ({
      ...prev,
      kpi_impacts: prev.kpi_impacts.map((impact, i) => 
        i === index ? { ...impact, [field]: value } : impact
      )
    }));
  };

  const applyTemplate = (templateId: string) => {
    const templates: Record<string, Partial<DirectiveFormData>> = {
      '72h-gtm-sprint': {
        directive_type: 'operational',
        priority: 'high',
        title: '72-hour GTM sprint',
        rationale: 'Fast sprint to close revenue gap and capitalize on high-performing content themes',
        escalation_after_hours: 72,
        tasks: [
          { text: 'Produce 2 new creatives + 1 repurpose', owner_hint: 'CMO', due: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0] },
          { text: 'UTM tag all assets with campaign tracking', owner_hint: 'CMO', due: new Date(Date.now() + 1*24*60*60*1000).toISOString().split('T')[0] }
        ],
        kpi_impacts: [{ kpi: 'RevenuePace', goal: 90, unit: '%' }]
      },
      'content-brief': {
        directive_type: 'implementation',
        priority: 'medium',
        title: 'Fast-track content brief',
        rationale: 'Accelerate content production pipeline with structured brief and clear success metrics',
        tasks: [
          { text: 'Create content brief with messaging framework', owner_hint: 'Content', due: new Date(Date.now() + 1*24*60*60*1000).toISOString().split('T')[0] }
        ],
        kpi_impacts: [{ kpi: 'GTMMomentum', goal: 15, unit: 'score' }]
      }
    };
    
    const template = templates[templateId];
    if (template) {
      setFormData(prev => ({ ...prev, ...template }));
    }
  };

  // API Queries
  const { data: stats } = useQuery({
    queryKey: ['/api/chief-of-staff/directive-stats'],
    refetchInterval: 2 * 60 * 60 * 1000 // 2 hours
  });

  const { data: recentDirectives } = useQuery({
    queryKey: ['/api/chief-of-staff/recent-directives'],
    refetchInterval: 2 * 60 * 60 * 1000 // 2 hours
  });

  const { data: objectives } = useQuery({
    queryKey: ['/api/cockpit/initiatives'],
    refetchInterval: 2 * 60 * 60 * 1000 // 2 hours
  });

  // Send directive mutation
  const sendDirectiveMutation = useMutation({
    mutationFn: async (directiveData: DirectiveFormData) => {
      const response = await fetch('/api/chief-of-staff/send-directive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(directiveData)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Directive Sent",
        description: `Directive dispatched to ${formData.target_agents.length} agent(s) successfully.`
      });
      // Reset form
      setFormData({
        version: '1.0',
        target_agents: [],
        watchers: [],
        priority: 'medium',
        directive_type: 'operational',
        kpi_impacts: [],
        title: '',
        rationale: '',
        tasks: [{ text: '' }],
        success_criteria: [],
        requires_ceo_approval: false,
        escalation_after_hours: 72,
        attachments: [],
        metadata: { source: 'CoS-UI', room: 'Dashboard/DirectiveForm' }
      });
      setValidationErrors([]);
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

  const sendTestMutation = useMutation({
    mutationFn: async (directiveData: DirectiveFormData) => {
      const response = await fetch('/api/chief-of-staff/send-directive-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(directiveData)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Sent",
        description: "Test directive sent to CoS for validation."
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fix ${errors.length} error(s) before submitting.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await sendDirectiveMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTest = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix validation errors before sending test.",
        variant: "destructive"
      });
      return;
    }

    await sendTestMutation.mutateAsync(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Directive Center</h1>
          <p className="text-gray-600 dark:text-gray-400">Send structured, CoS-quality directives to agents</p>
        </div>
        <Target className="h-8 w-8 text-blue-600" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{(stats as any)?.activeAgents || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Directives Sent</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{(stats as any)?.directivesSent || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{(stats as any)?.completed || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{(stats as any)?.urgent || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Template Quick Actions */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Quick Templates</CardTitle>
          <CardDescription>Start with proven directive patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(template.id)}
                className="text-xs"
                data-testid={`template-${template.id}`}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Please fix the following errors:</span>
            </div>
            <ul className="mt-2 text-sm text-red-600 dark:text-red-400 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="ml-4">• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Send Directive Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Create Directive</CardTitle>
              <CardDescription>Structure your directive with business alignment and clear execution plan</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Top Row: Target Agents, Priority, Deadline, CEO Approval */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Target Agents *</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {agentOptions.map((agent) => (
                        <div key={agent} className="flex items-center space-x-2">
                          <Checkbox
                            id={`target-${agent}`}
                            checked={formData.target_agents.includes(agent)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  target_agents: [...prev.target_agents, agent]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  target_agents: prev.target_agents.filter(a => a !== agent)
                                }));
                              }
                            }}
                            data-testid={`checkbox-target-${agent}`}
                          />
                          <Label htmlFor={`target-${agent}`} className="text-sm">{getAgentName(agent)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Watchers/CC</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {agentOptions.map((agent) => (
                        <div key={agent} className="flex items-center space-x-2">
                          <Checkbox
                            id={`watcher-${agent}`}
                            checked={formData.watchers.includes(agent)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  watchers: [...prev.watchers, agent]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  watchers: prev.watchers.filter(a => a !== agent)
                                }));
                              }
                            }}
                            data-testid={`checkbox-watcher-${agent}`}
                          />
                          <Label htmlFor={`watcher-${agent}`} className="text-sm">{getAgentName(agent)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Deadline</Label>
                      <Input
                        type="datetime-local"
                        value={formData.deadline || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        className="bg-white dark:bg-gray-700"
                        data-testid="input-deadline"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ceo-approval"
                        checked={formData.requires_ceo_approval}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_ceo_approval: checked }))}
                        data-testid="switch-ceo-approval"
                      />
                      <Label htmlFor="ceo-approval" className="text-sm">Requires CEO approval</Label>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Escalation (hours)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="240"
                        value={formData.escalation_after_hours}
                        onChange={(e) => setFormData(prev => ({ ...prev, escalation_after_hours: parseInt(e.target.value) || 72 }))}
                        className="bg-white dark:bg-gray-700"
                        data-testid="input-escalation-hours"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Strategy Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strategy</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Directive Type *</Label>
                      <RadioGroup
                        value={formData.directive_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, directive_type: value }))}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="implementation" id="impl" />
                          <Label htmlFor="impl" className="text-sm">Implementation</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="operational" id="ops" />
                          <Label htmlFor="ops" className="text-sm">Operational</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="decision" id="decision" />
                          <Label htmlFor="decision" className="text-sm">Decision</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="daily_run" id="daily" />
                          <Label htmlFor="daily" className="text-sm">Daily Run</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="experiment" id="experiment" />
                          <Label htmlFor="experiment" className="text-sm">Experiment</Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Determines required fields and routing</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Objective/Initiative</Label>
                      <Select
                        value={formData.objective?.name || ''}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, objective: { name: value } }))}
                      >
                        <SelectTrigger data-testid="select-objective">
                          <SelectValue placeholder="Link to strategic objective" />
                        </SelectTrigger>
                        <SelectContent>
                          {(objectives as any)?.map((obj: any) => (
                            <SelectItem key={obj.name} value={obj.name}>{obj.name}</SelectItem>
                          ))}
                          <SelectItem value="_new">+ New Objective</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-700 dark:text-gray-300">KPI Impact</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addKpiImpact} data-testid="button-add-kpi">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {formData.kpi_impacts.map((impact, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                            <Select
                              value={impact.kpi}
                              onValueChange={(value) => updateKpiImpact(index, 'kpi', value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {kpiOptions.map(kpi => (
                                  <SelectItem key={kpi} value={kpi}>{kpi}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="Target"
                              value={impact.goal || ''}
                              onChange={(e) => updateKpiImpact(index, 'goal', parseFloat(e.target.value))}
                              className="w-20"
                            />
                            <Select
                              value={impact.unit || '%'}
                              onValueChange={(value) => updateKpiImpact(index, 'unit', value)}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {unitOptions.map(unit => (
                                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeKpiImpact(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pick the business KPI(s) this directive will move</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Plan Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plan</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Title *</Label>
                      <Input
                        placeholder="One-line directive summary (4-140 chars)"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-white dark:bg-gray-700"
                        maxLength={140}
                        data-testid="input-title"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formData.title.length}/140 characters</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Rationale *</Label>
                      <Textarea
                        placeholder="Why this matters—ties to KPIs/insights (min 10 chars)"
                        value={formData.rationale}
                        onChange={(e) => setFormData(prev => ({ ...prev, rationale: e.target.value }))}
                        className="bg-white dark:bg-gray-700"
                        rows={3}
                        data-testid="textarea-rationale"
                      />
                    </div>
                  </div>

                  {/* Tasks Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700 dark:text-gray-300">Tasks *</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addTask} data-testid="button-add-task">
                        <Plus className="h-3 w-3 mr-1" /> Add Task
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.tasks.map((task, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 p-2 border rounded">
                          <Input
                            placeholder="Task description"
                            value={task.text}
                            onChange={(e) => updateTask(index, 'text', e.target.value)}
                            className="col-span-4 bg-white dark:bg-gray-700"
                            data-testid={`input-task-text-${index}`}
                          />
                          <Input
                            placeholder="Owner hint"
                            value={task.owner_hint || ''}
                            onChange={(e) => updateTask(index, 'owner_hint', e.target.value)}
                            className="col-span-2 bg-white dark:bg-gray-700"
                            data-testid={`input-task-owner-${index}`}
                          />
                          <Input
                            type="date"
                            value={task.due || ''}
                            onChange={(e) => updateTask(index, 'due', e.target.value)}
                            className="col-span-2 bg-white dark:bg-gray-700"
                            data-testid={`input-task-due-${index}`}
                          />
                          <Input
                            placeholder="Link (optional)"
                            value={task.link || ''}
                            onChange={(e) => updateTask(index, 'link', e.target.value)}
                            className="col-span-3 bg-white dark:bg-gray-700"
                            data-testid={`input-task-link-${index}`}
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeTask(index)}
                            className="col-span-1"
                            disabled={formData.tasks.length === 1}
                            data-testid={`button-remove-task-${index}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Success Criteria */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700 dark:text-gray-300">Success Criteria</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSuccessCriteria} data-testid="button-add-success-criteria">
                        <Plus className="h-3 w-3 mr-1" /> Add Criteria
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.success_criteria.map((criteria, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                          <Select
                            value={criteria.kpi}
                            onValueChange={(value) => updateSuccessCriteria(index, 'kpi', value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {kpiOptions.map(kpi => (
                                <SelectItem key={kpi} value={kpi}>{kpi}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Goal"
                            value={criteria.goal || ''}
                            onChange={(e) => updateSuccessCriteria(index, 'goal', parseFloat(e.target.value))}
                            className="w-20"
                          />
                          <Select
                            value={criteria.unit}
                            onValueChange={(value) => updateSuccessCriteria(index, 'unit', value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {unitOptions.map(unit => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="date"
                            placeholder="By date"
                            value={criteria.by || ''}
                            onChange={(e) => updateSuccessCriteria(index, 'by', e.target.value)}
                            className="w-32"
                          />
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeSuccessCriteria(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Escalation after {formData.escalation_after_hours}h • Schedule: Now • Recipients: {formData.target_agents.length} agent(s)
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={showPreview} onOpenChange={setShowPreview}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" data-testid="button-preview">
                          <Eye className="h-3 w-3 mr-1" /> Preview JSON
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Directive Preview</DialogTitle>
                          <DialogDescription>JSON payload that will be sent to agent webhooks</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh]">
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
                            {JSON.stringify(formData, null, 2)}
                          </pre>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    
                    <Button type="button" variant="outline" size="sm" onClick={handleSendTest} data-testid="button-send-test">
                      <TestTube className="h-3 w-3 mr-1" /> Send Test
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-dispatch"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {isSubmitting ? 'Dispatching...' : 'Dispatch'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Directives - Right Sidebar */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Recent Directives</CardTitle>
              <CardDescription>Latest directive activity with tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(recentDirectives as any)?.map((directive: any) => (
                  <div key={directive.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge 
                            variant={directive.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {directive.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getAgentName(directive.targetAgent)}
                          </Badge>
                          <Badge 
                            variant={directive.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {directive.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {directive.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(directive.createdAt).toLocaleString()}
                        </p>
                        {directive.status === 'sent' && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            📍 Ack received ✓ • SLA 72h • Escalates: {new Date(new Date(directive.createdAt).getTime() + 72*60*60*1000).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!recentDirectives || (recentDirectives as any)?.length === 0) && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No recent directives
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help & Tips */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">CoS Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                <p>• Link every directive to strategic objectives</p>
                <p>• Use templates for consistent quality</p>
                <p>• Set escalation timers to prevent stalls</p>
                <p>• Multi-select agents for cross-functional work</p>
                <p>• Add CEO to watchers if approval needed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}