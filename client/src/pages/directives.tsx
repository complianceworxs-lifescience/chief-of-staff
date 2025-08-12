import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Play } from "lucide-react";
import { format } from "date-fns";

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
};

type Initiative = {
  id: string;
  title: string;
  description: string;
};

export default function DirectivesPage() {
  const { data: directives = [], isLoading } = useQuery<AgentDirective[]>({
    queryKey: ["/api/chief-of-staff/directives"]
  });

  const { data: initiatives = [] } = useQuery<Initiative[]>({
    queryKey: ["/api/chief-of-staff/initiatives"]
  });

  const getInitiativeTitle = (initiativeId: string) => {
    const initiative = initiatives.find(i => i.id === initiativeId);
    return initiative ? initiative.title : 'Unknown Initiative';
  };

  const getAgentInfo = (agentId: string) => {
    const agentMap: Record<string, { name: string; color: string; avatar: string }> = {
      'cro': { name: 'CRO Agent', color: 'bg-blue-500', avatar: 'CR' },
      'cfo': { name: 'CFO Agent', color: 'bg-green-500', avatar: 'CF' },
      'coo': { name: 'COO Agent', color: 'bg-purple-500', avatar: 'CO' },
      'cco': { name: 'CCO Agent', color: 'bg-orange-500', avatar: 'CC' }
    };
    return agentMap[agentId] || { name: agentId, color: 'bg-gray-500', avatar: agentId.substring(0, 2).toUpperCase() };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'p1': return 'bg-red-100 text-red-700 border-red-300';
      case 'p2': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'p3': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'assigned': return 'bg-yellow-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Play;
      case 'assigned': return Clock;
      case 'blocked': return AlertCircle;
      default: return Clock;
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Directives</h1>
          <p className="text-gray-600 mt-2">Specific tasks delegated to AI agents from strategic initiatives</p>
        </div>
      </div>

      {/* Directives Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Directives</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{directives.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {Object.keys(groupedDirectives).length} agents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusCounts['in_progress'] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently executing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusCounts['completed'] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {directives.filter(d => d.priority === 'p1').length}
            </div>
            <p className="text-xs text-muted-foreground">
              P1 directives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Directives Content */}
      {directives.length > 0 ? (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Directives</TabsTrigger>
            {Object.keys(groupedDirectives).map(agentId => {
              const agentInfo = getAgentInfo(agentId);
              return (
                <TabsTrigger key={agentId} value={agentId}>
                  {agentInfo.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {directives
              .sort((a, b) => {
                // Sort by priority first, then by creation date
                const priorityOrder = { 'p1': 1, 'p2': 2, 'p3': 3 };
                const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 4;
                const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 4;
                
                if (aPriority !== bPriority) return aPriority - bPriority;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map((directive) => {
                const agentInfo = getAgentInfo(directive.targetAgent);
                const StatusIcon = getStatusIcon(directive.status);
                const daysLeft = Math.ceil((new Date(directive.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={directive.id}>
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
                          </div>
                          <CardTitle className="text-lg">{directive.action}</CardTitle>
                          <CardDescription>{directive.goal}</CardDescription>
                          <p className="text-sm text-gray-600">
                            <strong>Initiative:</strong> {getInitiativeTitle(directive.initiativeId)}
                          </p>
                        </div>
                        <StatusIcon className={`h-5 w-5 ${getStatusColor(directive.status)} text-white rounded p-1`} />
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
                      
                      {directive.result && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium mb-1">Result</h4>
                          <p className="text-sm text-gray-700">{directive.result}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </TabsContent>

          {Object.entries(groupedDirectives).map(([agentId, agentDirectives]) => {
            const agentInfo = getAgentInfo(agentId);
            return (
              <TabsContent key={agentId} value={agentId} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`${agentInfo.color} text-white`}>
                      {agentInfo.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">{agentInfo.name}</h2>
                    <p className="text-gray-600">{agentDirectives.length} directives assigned</p>
                  </div>
                </div>
                
                {agentDirectives
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((directive) => {
                    const StatusIcon = getStatusIcon(directive.status);
                    const daysLeft = Math.ceil((new Date(directive.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <Card key={directive.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-3">
                                <Badge className={getPriorityColor(directive.priority)}>
                                  {directive.priority.toUpperCase()}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${getStatusColor(directive.status)}`} />
                                  <span className="text-xs text-gray-500 capitalize">{directive.status.replace('_', ' ')}</span>
                                </div>
                              </div>
                              <CardTitle className="text-lg">{directive.action}</CardTitle>
                              <CardDescription>{directive.goal}</CardDescription>
                              <p className="text-sm text-gray-600">
                                <strong>Initiative:</strong> {getInitiativeTitle(directive.initiativeId)}
                              </p>
                            </div>
                            <StatusIcon className={`h-5 w-5 ${getStatusColor(directive.status)} text-white rounded p-1`} />
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
                          
                          {directive.result && (
                            <div className="bg-gray-50 p-3 rounded-md">
                              <h4 className="text-sm font-medium mb-1">Result</h4>
                              <p className="text-sm text-gray-700">{directive.result}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No directives assigned</h3>
            <p className="text-gray-600 mb-4">
              Agent directives are created when you delegate strategic initiatives. 
              Generate initiatives first, then delegate them to create specific tasks for your AI agents.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}