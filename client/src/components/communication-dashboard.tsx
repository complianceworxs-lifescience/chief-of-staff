import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Users, TrendingUp, Activity } from "lucide-react";

interface AgentCommunication {
  id: string;
  fromAgent: string;
  toAgent?: string;
  action: string;
  content: string;
  type: 'collaboration' | 'conflict' | 'decision';
  timestamp: string;
  relatedObjective?: string;
}

interface CollaborationPatterns {
  pairs: Array<{ agents: string[], collaborations: number }>;
  objectives: Array<{ objective: string, agents: string[], communications: number }>;
}

export function CommunicationDashboard() {
  const { toast } = useToast();
  
  const { data: communications, isLoading: isLoadingComms } = useQuery<AgentCommunication[]>({
    queryKey: ['/api/communications'],
    refetchInterval: 1800000 // Maximum cost savings: 30 minutes
  });

  const { data: patterns, isLoading: isLoadingPatterns } = useQuery<CollaborationPatterns>({
    queryKey: ['/api/communications/patterns'],
    refetchInterval: 1800000 // Maximum cost savings: 30 minutes
  });

  const simulateActivity = useMutation({
    mutationFn: () => apiRequest('POST', '/api/communications/simulate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/communications/patterns'] });
      toast({
        title: "Activity Simulated",
        description: "New agent communications generated successfully"
      });
    },
    onError: (error) => {
      console.error('Simulate activity error:', error);
      toast({
        title: "Simulation Failed",
        description: "Failed to simulate agent activity. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'collaboration': return 'bg-green-100 text-green-800 border-green-200';
      case 'conflict': return 'bg-red-100 text-red-800 border-red-200';
      case 'decision': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isLoadingComms || isLoadingPatterns) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Loading Communication Dashboard...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Agent Communication Tracker</h2>
        <Button 
          onClick={() => simulateActivity.mutate()}
          disabled={simulateActivity.isPending}
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          {simulateActivity.isPending ? 'Simulating...' : 'Simulate Activity'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Collaborations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patterns?.pairs.length || 0}</div>
            <p className="text-xs text-muted-foreground">Agent pairs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objective Focus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patterns?.objectives.length || 0}</div>
            <p className="text-xs text-muted-foreground">Strategic objectives</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Communications</CardTitle>
            <CardDescription>Latest agent interactions and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {communications?.slice(0, 20).map((comm) => (
                  <div key={comm.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comm.fromAgent}</span>
                        {comm.toAgent && (
                          <>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-sm">{comm.toAgent}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(comm.type)}>
                          {comm.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(comm.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{comm.content}</p>
                    {comm.relatedObjective && (
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Related: {comm.relatedObjective}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collaboration Patterns</CardTitle>
            <CardDescription>Agent interaction frequency and strategic alignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Top Agent Pairs</h4>
                <div className="space-y-2">
                  {patterns?.pairs.slice(0, 5).map((pair, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">
                        {pair.agents.join(' & ')}
                      </div>
                      <Badge variant="secondary">
                        {pair.collaborations} interactions
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-3">Objective Focus Areas</h4>
                <div className="space-y-2">
                  {patterns?.objectives.slice(0, 3).map((obj, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-1">{obj.objective}</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {obj.communications} communications
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {obj.agents.map((agent) => (
                          <Badge key={agent} variant="outline" className="text-xs">
                            {agent}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}