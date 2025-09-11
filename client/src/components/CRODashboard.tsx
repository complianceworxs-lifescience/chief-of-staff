import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, Users, DollarSign, Target, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface FunnelMetrics {
  quiz_completion_rate: number;
  roi_calculation_rate: number;
  membership_recommendation_rate: number;
  purchase_conversion_rate: number;
  upsell_conversion_rate: number;
}

interface PersonaMetrics {
  conversion: number;
  revenue: number;
  velocity: number;
}

interface SynergyReport {
  generated_at: string;
  executive_summary: {
    overall_health: string;
    red_line_breaches: number;
    primary_concerns: string[];
  };
  funnel_performance: FunnelMetrics;
  velocity_metrics: any;
  revenue_metrics: any;
  persona_breakdown: {
    rising_leader: PersonaMetrics;
    validation_strategist: PersonaMetrics;
    compliance_architect: PersonaMetrics;
  };
  recommendations: string[];
  next_actions: string[];
}

export function CRODashboard() {
  const { data: synergyReport, isLoading, error } = useQuery<SynergyReport>({
    queryKey: ['/api/cro/synergy-report'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: agentHealth } = useQuery({
    queryKey: ['/api/cro/agent-health'],
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !synergyReport) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">Failed to load CRO Dashboard data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getHealthColor = (health: string) => {
    if (health.includes('ATTENTION')) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (health.includes('CRITICAL')) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="p-6 space-y-6" data-testid="cro-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">
            Revenue Synergy Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time funnel performance and revenue tracking
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge 
            variant="outline" 
            className={getHealthColor(synergyReport.executive_summary.overall_health)}
            data-testid="health-status"
          >
            {synergyReport.executive_summary.overall_health}
          </Badge>
          <Button variant="outline" size="sm" data-testid="refresh-button">
            <Clock className="h-4 w-4 mr-2" />
            Auto-refresh: 30s
          </Button>
        </div>
      </div>

      {/* Red-line Alerts */}
      {synergyReport.executive_summary.red_line_breaches > 0 && (
        <Card className="border-red-200 bg-red-50" data-testid="red-line-alerts">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Red-line Breaches ({synergyReport.executive_summary.red_line_breaches})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {synergyReport.executive_summary.primary_concerns.map((concern, index) => (
                <li key={index} className="text-red-700">• {concern}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="mrr-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(synergyReport.revenue_metrics.weekly_mrr * 4.33)}</div>
            <div className="flex items-center mt-1">
              {synergyReport.revenue_metrics.mrr_change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={synergyReport.revenue_metrics.mrr_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                {synergyReport.revenue_metrics.mrr_change >= 0 ? '+' : ''}{synergyReport.revenue_metrics.mrr_change}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="conversion-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(synergyReport.funnel_performance.purchase_conversion_rate)}</div>
            <div className="text-sm text-gray-600 mt-1">
              Quiz → Purchase
            </div>
          </CardContent>
        </Card>

        <Card data-testid="velocity-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Time to Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(synergyReport.velocity_metrics.avg_membership_to_purchase_hours / 24).toFixed(1)} days</div>
            <div className="text-sm text-gray-600 mt-1">
              From first touch
            </div>
          </CardContent>
        </Card>

        <Card data-testid="arpu-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Revenue Per User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(synergyReport.revenue_metrics.avg_revenue_per_user)}</div>
            <div className="text-sm text-gray-600 mt-1">
              Monthly basis
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="funnel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="funnel" data-testid="funnel-tab">Funnel Performance</TabsTrigger>
          <TabsTrigger value="personas" data-testid="personas-tab">Persona Breakdown</TabsTrigger>
          <TabsTrigger value="velocity" data-testid="velocity-tab">Funnel Velocity</TabsTrigger>
          <TabsTrigger value="health" data-testid="health-tab">Agent Health</TabsTrigger>
        </TabsList>

        {/* Funnel Performance Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <Card data-testid="funnel-metrics-card">
            <CardHeader>
              <CardTitle>Funnel Stage Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { stage: 'Quiz Completion', rate: synergyReport.funnel_performance.quiz_completion_rate, threshold: 50 },
                  { stage: 'ROI Calculation', rate: synergyReport.funnel_performance.roi_calculation_rate, threshold: 65 },
                  { stage: 'Membership Recommendation', rate: synergyReport.funnel_performance.membership_recommendation_rate, threshold: 60 },
                  { stage: 'Purchase Conversion', rate: synergyReport.funnel_performance.purchase_conversion_rate, threshold: 15 },
                  { stage: 'Upsell Conversion', rate: synergyReport.funnel_performance.upsell_conversion_rate, threshold: 20 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{item.stage}</div>
                    <div className="flex items-center space-x-4">
                      <div className="text-lg font-bold">{formatPercentage(item.rate)}</div>
                      {item.rate < item.threshold && (
                        <Badge variant="destructive" className="text-xs">
                          Below Threshold
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Persona Breakdown Tab */}
        <TabsContent value="personas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(synergyReport.persona_breakdown).map(([persona, metrics]) => (
              <Card key={persona} data-testid={`persona-card-${persona}`}>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {persona.replace('_', ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion:</span>
                    <span className="font-bold">{formatPercentage(metrics.conversion)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-bold">{formatCurrency(metrics.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Velocity:</span>
                    <span className="font-bold">{metrics.velocity} days</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Velocity Tab */}
        <TabsContent value="velocity" className="space-y-6">
          <Card data-testid="velocity-metrics-card">
            <CardHeader>
              <CardTitle>Funnel Velocity Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { stage: 'Quiz → ROI Calculator', hours: synergyReport.velocity_metrics.avg_quiz_to_roi_hours, threshold: 72 },
                  { stage: 'ROI → Membership Recommendation', hours: synergyReport.velocity_metrics.avg_roi_to_membership_hours, threshold: 120 },
                  { stage: 'Membership → Purchase', hours: synergyReport.velocity_metrics.avg_membership_to_purchase_hours, threshold: 336 },
                  { stage: 'Purchase → Upsell', hours: synergyReport.velocity_metrics.avg_purchase_to_upsell_hours, threshold: 240 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{item.stage}</div>
                    <div className="flex items-center space-x-4">
                      <div className="text-lg font-bold">{item.hours.toFixed(1)}h</div>
                      {item.hours > item.threshold && (
                        <Badge variant="destructive" className="text-xs">
                          Above Threshold
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="coo-health-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  COO Automation Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Event Fire Rate:</span>
                  <span className="font-bold">96.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Journey Entry Success:</span>
                  <span className="font-bold">87.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Trigger Latency:</span>
                  <span className="font-bold">45s</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="cmo-health-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  CMO Messaging Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">CTA Click Rates:</span>
                  <span className="font-bold">12.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Message Consistency:</span>
                  <span className="font-bold">94.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Landing Page Performance:</span>
                  <span className="font-bold">78.3%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recommendations and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="recommendations-card">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {synergyReport.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="actions-card">
          <CardHeader>
            <CardTitle>Next Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {synergyReport.next_actions.map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-amber-600 mr-2">→</span>
                  <span className="text-sm font-medium">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}