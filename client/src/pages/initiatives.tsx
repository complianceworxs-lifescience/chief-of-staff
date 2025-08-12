import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, RefreshCw, Lightbulb, TrendingUp, Target, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type Initiative = {
  id: string;
  title: string;
  description: string;
  goalId: string;
  impactScore: number;
  effortScore: number;
  priorityRank: number;
  estimatedImpact: string;
  requiredResources: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

type BusinessGoal = {
  id: string;
  title: string;
  category: string;
  priority: string;
};

export default function InitiativesPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: initiatives = [], isLoading } = useQuery<Initiative[]>({
    queryKey: ["/api/chief-of-staff/initiatives"]
  });

  const { data: goals = [] } = useQuery<BusinessGoal[]>({
    queryKey: ["/api/chief-of-staff/goals"]
  });

  const generateInitiativesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/chief-of-staff/initiatives/generate", {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chief-of-staff/initiatives"] });
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    }
  });

  const delegateInitiativesMutation = useMutation({
    mutationFn: async (initiativeIds: string[]) => {
      return await apiRequest("/api/chief-of-staff/directives/delegate", {
        method: "POST",
        body: JSON.stringify({ initiativeIds })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chief-of-staff/directives"] });
    }
  });

  const handleGenerateInitiatives = () => {
    setIsGenerating(true);
    generateInitiativesMutation.mutate();
  };

  const handleDelegateTopInitiatives = () => {
    const topInitiatives = initiatives
      .sort((a, b) => a.priorityRank - b.priorityRank)
      .slice(0, 3)
      .map(i => i.id);
    
    delegateInitiativesMutation.mutate(topInitiatives);
  };

  const getGoalTitle = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    return goal ? goal.title : 'Unknown Goal';
  };

  const getImpactColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getEffortColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 text-red-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getPriorityBadgeColor = (rank: number) => {
    if (rank <= 3) return 'bg-red-500 text-white';
    if (rank <= 6) return 'bg-yellow-500 text-white';
    return 'bg-gray-500 text-white';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading initiatives...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strategic Initiatives</h1>
          <p className="text-gray-600 mt-2">AI-generated prioritized initiatives based on goal analysis</p>
        </div>
        
        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isGenerating || generateInitiativesMutation.isPending}>
                {isGenerating || generateInitiativesMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lightbulb className="h-4 w-4 mr-2" />
                )}
                Generate Initiatives
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Generate New Initiatives</AlertDialogTitle>
                <AlertDialogDescription>
                  This will analyze your business goals against current metrics and generate a prioritized list of strategic initiatives. 
                  Existing initiatives will be replaced with new ones based on the latest data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleGenerateInitiatives}>
                  Generate Initiatives
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {initiatives.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={delegateInitiativesMutation.isPending}>
                  <Play className="h-4 w-4 mr-2" />
                  Delegate Top 3
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delegate Top Initiatives</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will create specific directives for your AI agents based on the top 3 priority initiatives. 
                    Agents will receive actionable tasks to execute these initiatives.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelegateTopInitiatives}>
                    Create Directives
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Initiatives Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Initiatives</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initiatives.length}</div>
            <p className="text-xs text-muted-foreground">
              Generated from goal analysis
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {initiatives.filter(i => i.impactScore >= 80).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Impact score ≥ 80
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Effort</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {initiatives.filter(i => i.effortScore <= 40).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Quick wins available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Delegate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.min(3, initiatives.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              Top priority initiatives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Initiatives List */}
      {initiatives.length > 0 ? (
        <div className="space-y-4">
          {initiatives
            .sort((a, b) => a.priorityRank - b.priorityRank)
            .map((initiative, index) => (
              <Card key={initiative.id} className={`${index < 3 ? 'border-l-4 border-l-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityBadgeColor(initiative.priorityRank)}>
                          P{initiative.priorityRank}
                        </Badge>
                        <CardTitle className="text-lg">{initiative.title}</CardTitle>
                      </div>
                      <CardDescription>{initiative.description}</CardDescription>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Goal:</strong> {getGoalTitle(initiative.goalId)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Impact Score</span>
                        <span>{initiative.impactScore}/100</span>
                      </div>
                      <Progress value={initiative.impactScore} className="h-2" />
                      <Badge className={getImpactColor(initiative.impactScore)} variant="outline">
                        {initiative.impactScore >= 80 ? 'High Impact' : 
                         initiative.impactScore >= 60 ? 'Medium Impact' : 'Low Impact'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Effort Score</span>
                        <span>{initiative.effortScore}/100</span>
                      </div>
                      <Progress value={initiative.effortScore} className="h-2" />
                      <Badge className={getEffortColor(initiative.effortScore)} variant="outline">
                        {initiative.effortScore >= 80 ? 'High Effort' : 
                         initiative.effortScore >= 60 ? 'Medium Effort' : 'Low Effort'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Estimated Impact</h4>
                    <p className="text-sm text-gray-600">{initiative.estimatedImpact}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Required Resources</h4>
                    <div className="flex flex-wrap gap-1">
                      {initiative.requiredResources.map((resource, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {index < 3 && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-800">
                        🎯 <strong>Top Priority:</strong> This initiative is recommended for immediate delegation to agents.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No initiatives generated</h3>
            <p className="text-gray-600 mb-4">
              Generate strategic initiatives by analyzing your business goals against current metrics.
            </p>
            <Button onClick={handleGenerateInitiatives} disabled={isGenerating || generateInitiativesMutation.isPending}>
              {isGenerating || generateInitiativesMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4 mr-2" />
              )}
              Generate Initiatives
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}