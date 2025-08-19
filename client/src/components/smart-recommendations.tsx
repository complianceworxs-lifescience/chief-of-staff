import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Lightbulb, TrendingUp, Users, Target } from "lucide-react";

interface SmartRecommendation {
  id: string;
  type: 'strategic' | 'resource' | 'conflict' | 'optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  affectedAgents: string[];
  status: 'pending' | 'implemented' | 'dismissed';
  createdAt: string;
}

export function SmartRecommendations() {
  const { toast } = useToast();
  
  const { data: recommendations, isLoading } = useQuery<SmartRecommendation[]>({
    queryKey: ['/api/recommendations'],
    refetchInterval: 30000
  });

  const implementRecommendation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🚀 Implementing recommendation:', id);
      const response = await apiRequest('POST', `/api/recommendations/${id}/implement`);
      const result = await response.json();
      console.log('✅ Implementation response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Implementation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      toast({
        title: "Recommendation Implemented",
        description: "The recommendation has been successfully implemented and will take effect immediately."
      });
    },
    onError: (error) => {
      console.error('❌ Implementation failed:', error);
      toast({
        title: "Implementation Failed",
        description: "Failed to implement recommendation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const dismissRecommendation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ Dismissing recommendation:', id);
      const response = await apiRequest('POST', `/api/recommendations/${id}/dismiss`);
      const result = await response.json();
      console.log('✅ Dismissal response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Dismissal successful:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      toast({
        title: "Recommendation Dismissed",
        description: "The recommendation has been dismissed and will not be shown again."
      });
    },
    onError: (error) => {
      console.error('❌ Dismissal failed:', error);
      toast({
        title: "Dismissal Failed", 
        description: "Failed to dismiss recommendation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strategic': return <Target className="h-4 w-4" />;
      case 'resource': return <Users className="h-4 w-4" />;
      case 'conflict': return <XCircle className="h-4 w-4" />;
      case 'optimization': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strategic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resource': return 'bg-green-100 text-green-800 border-green-200';
      case 'conflict': return 'bg-red-100 text-red-800 border-red-200';
      case 'optimization': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterRecommendations = (status: string) => {
    return recommendations?.filter(rec => rec.status === status) || [];
  };

  const RecommendationCard = ({ recommendation }: { recommendation: SmartRecommendation }) => (
    <Alert key={recommendation.id} className="border-l-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getTypeIcon(recommendation.type)}
          <div className="space-y-3 flex-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium">{recommendation.title}</h4>
                <Badge className={getTypeColor(recommendation.type)}>
                  {recommendation.type}
                </Badge>
                <Badge className={getImpactColor(recommendation.impact)}>
                  {recommendation.impact} impact
                </Badge>
                <Badge className={getEffortColor(recommendation.effort)}>
                  {recommendation.effort} effort
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{recommendation.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {recommendation.affectedAgents.map((agent) => (
                <Badge key={agent} variant="outline" className="text-xs">
                  {agent}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {recommendation.status === 'pending' && (
          <div className="flex gap-2 ml-4">
            <Button 
              size="sm" 
              onClick={() => implementRecommendation.mutate(recommendation.id)}
              disabled={implementRecommendation.isPending}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Implement
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => dismissRecommendation.mutate(recommendation.id)}
              disabled={dismissRecommendation.isPending}
              className="flex items-center gap-1"
            >
              <XCircle className="h-3 w-3" />
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const pendingRecs = filterRecommendations('pending');
  const implementedRecs = filterRecommendations('implemented');
  const dismissedRecs = filterRecommendations('dismissed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Smart Recommendations</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          AI-powered insights
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Lightbulb className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRecs.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implemented</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{implementedRecs.length}</div>
            <p className="text-xs text-muted-foreground">Successfully applied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {recommendations?.filter(r => r.impact === 'high').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Priority recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">94%</div>
            <p className="text-xs text-muted-foreground">Implementation success</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingRecs.length})</TabsTrigger>
          <TabsTrigger value="implemented">Implemented ({implementedRecs.length})</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed ({dismissedRecs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRecs.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                  <h3 className="font-medium">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">No pending recommendations at the moment.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingRecs.map((recommendation) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))
          )}
        </TabsContent>

        <TabsContent value="implemented" className="space-y-4">
          {implementedRecs.map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4">
          {dismissedRecs.map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}