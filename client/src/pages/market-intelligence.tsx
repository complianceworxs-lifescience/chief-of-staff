import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  Globe, 
  FileText, 
  Brain, 
  Target,
  Clock,
  Activity,
  ExternalLink,
  CheckCircle2,
  Zap,
  BarChart3,
  Building
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface MarketSignal {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'near-term' | 'long-term';
  category: 'regulatory' | 'competitive' | 'market' | 'technology';
  tags: string[];
  analysisNotes?: string;
  flaggedAt: string;
  processedAt?: string;
  actionTaken: boolean;
  assignedAgent?: string;
  rawData?: any;
}

export function MarketIntelligence() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: allSignals = [], isLoading, error } = useQuery<MarketSignal[]>({
    queryKey: ['/api/market-intelligence/signals'],
    refetchInterval: 30000, // 30 seconds for faster updates
    staleTime: 0 // Always fetch fresh data
  });

  const { data: highPrioritySignals = [] } = useQuery<MarketSignal[]>({
    queryKey: ['/api/market-intelligence/signals/high-priority'],
    refetchInterval: 30000, // 30 seconds for high priority
    staleTime: 0 // Always fetch fresh data
  });

  // Debug logging
  console.log('Market Intelligence Data:', { 
    allSignals, 
    isLoading, 
    error,
    signalCount: allSignals?.length || 0,
    highPriorityCount: highPrioritySignals?.length || 0
  });

  const gatherIntelligence = useMutation({
    mutationFn: () => apiRequest('POST', '/api/market-intelligence/gather'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/market-intelligence/signals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market-intelligence/signals/high-priority'] });
      toast({
        title: "Intelligence Gathered",
        description: "New market signals have been collected and analyzed"
      });
    },
    onError: () => {
      toast({
        title: "Collection Failed",
        description: "Failed to gather market intelligence. Please try again.",
        variant: "destructive"
      });
    }
  });

  const processSignal = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => 
      apiRequest('PATCH', `/api/market-intelligence/signals/${id}/process`, { actionNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/market-intelligence/signals'] });
      toast({
        title: "Signal Processed",
        description: "Market signal has been marked as processed"
      });
    }
  });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return <Zap className="h-4 w-4 text-red-500" />;
      case 'near-term': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'long-term': return <Target className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'regulatory': return <FileText className="h-4 w-4" />;
      case 'competitive': return <TrendingUp className="h-4 w-4" />;
      case 'market': return <BarChart3 className="h-4 w-4" />;
      case 'technology': return <Brain className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const filteredSignals = allSignals?.filter(signal => 
    selectedCategory === 'all' || signal.category === selectedCategory
  ) || [];

  const categoryStats = allSignals?.reduce((acc, signal) => {
    acc[signal.category] = (acc[signal.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Market Intelligence</h2>
          <p className="text-muted-foreground">
            AI-powered monitoring of regulatory, competitive, and market signals
          </p>
        </div>
        <Button 
          onClick={() => gatherIntelligence.mutate()}
          disabled={gatherIntelligence.isPending}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          {gatherIntelligence.isPending ? 'Gathering...' : 'Gather Intelligence'}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allSignals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active market signals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highPrioritySignals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allSignals?.filter(s => s.actionTaken && 
                s.processedAt && 
                new Date(s.processedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Signals acted upon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Assignments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(allSignals?.filter(s => s.assignedAgent).map(s => s.assignedAgent)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">Agents involved</p>
          </CardContent>
        </Card>
      </div>

      {/* High Priority Alerts */}
      {highPrioritySignals && highPrioritySignals.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <strong>{highPrioritySignals.length} high-priority signals</strong> require immediate attention. 
            Review the regulatory and competitive intelligence below.
          </AlertDescription>
        </Alert>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({allSignals?.length || 0})</TabsTrigger>
          <TabsTrigger value="regulatory">Regulatory ({categoryStats.regulatory || 0})</TabsTrigger>
          <TabsTrigger value="competitive">Competitive ({categoryStats.competitive || 0})</TabsTrigger>
          <TabsTrigger value="market">Market ({categoryStats.market || 0})</TabsTrigger>
          <TabsTrigger value="technology">Technology ({categoryStats.technology || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {filteredSignals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Signals Found</h3>
                <p className="text-gray-500 text-center mb-4">
                  {selectedCategory === 'all' 
                    ? 'No market intelligence signals are currently available.'
                    : `No ${selectedCategory} signals are currently available.`
                  }
                </p>
                <Button 
                  onClick={() => gatherIntelligence.mutate()}
                  disabled={gatherIntelligence.isPending}
                  variant="outline"
                >
                  Gather Intelligence
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSignals.map((signal) => (
                <Card key={signal.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(signal.category)}
                          <Badge variant="outline" className="capitalize">
                            {signal.category}
                          </Badge>
                          <Badge className={getImpactColor(signal.impact)}>
                            {signal.impact.toUpperCase()} IMPACT
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getUrgencyIcon(signal.urgency)}
                            <span className="text-xs text-muted-foreground capitalize">
                              {signal.urgency}
                            </span>
                          </div>
                        </div>
                        <CardTitle className="text-lg">{signal.title}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-2 mt-1">
                            <span>Source: {signal.source}</span>
                            {signal.sourceUrl && (
                              <a 
                                href={signal.sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Flagged {formatDistanceToNow(new Date(signal.flaggedAt))} ago
                        </div>
                        {signal.assignedAgent && (
                          <Badge variant="secondary" className="mt-1">
                            Assigned to {signal.assignedAgent.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Summary</h4>
                        <p className="text-sm text-muted-foreground">{signal.summary}</p>
                      </div>

                      {signal.tags.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {signal.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {signal.analysisNotes && (
                        <div>
                          <h4 className="font-medium mb-2">Analysis Notes</h4>
                          <p className="text-sm text-muted-foreground">{signal.analysisNotes}</p>
                        </div>
                      )}

                      {signal.rawData?.actionItems && (
                        <div>
                          <h4 className="font-medium mb-2">Suggested Actions</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {signal.rawData.actionItems.map((action: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span>•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!signal.actionTaken && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => processSignal.mutate({ id: signal.id, notes: 'Reviewed and processed via dashboard' })}
                            disabled={processSignal.isPending}
                          >
                            Mark as Processed
                          </Button>
                        </div>
                      )}

                      {signal.actionTaken && signal.processedAt && (
                        <div className="flex items-center gap-2 pt-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Processed {formatDistanceToNow(new Date(signal.processedAt))} ago
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}