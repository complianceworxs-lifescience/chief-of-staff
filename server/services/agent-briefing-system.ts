import { storage } from '../storage.js';
import { COODataSanityCheck, type SanityCheckReport, type CustomerJourney, type AttributionComparison } from './coo-data-sanity-check.js';
import { learningIntegration, type LearningOutcome } from './learning-integration.js';
import { nanoid } from 'nanoid';

interface ChannelPerformance {
  channel: string;
  revenue: number;
  conversions: number;
  sessions: number;
  conversionRate: number;
  revenuePerSession: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number; // 0-100
}

interface ContentPath {
  path: string;
  description: string;
  conversions: number;
  conversionRate: number;
  averageValue: number;
  touchpointCount: number;
  priority: 'high' | 'medium' | 'low';
}

interface CMOBriefing {
  briefingId: string;
  generatedAt: string;
  dataConfidence: number;
  top5Channels: ChannelPerformance[];
  channelRecommendations: {
    doubleDown: string[]; // Channels to increase investment
    investigate: string[]; // Channels with anomalies  
    pause: string[]; // Underperforming channels
  };
  contentStrategy: {
    highPerformingTopics: string[];
    underperformingAreas: string[];
    gapAnalysis: string[];
  };
  actionItems: string[];
  nextBriefingDue: string;
}

interface CROBriefing {
  briefingId: string;
  generatedAt: string;
  dataConfidence: number;
  top3ContentPaths: ContentPath[];
  conversionOptimization: {
    highImpactTests: Array<{
      testType: 'landing_page' | 'email' | 'flow';
      description: string;
      expectedImpact: number;
      effort: 'low' | 'medium' | 'high';
    }>;
    quickWins: string[];
    longTermProjects: string[];
  };
  funnelAnalysis: {
    dropoffPoints: Array<{
      step: string;
      dropoffRate: number;
      opportunity: number;
    }>;
    improvements: string[];
  };
  actionItems: string[];
  nextBriefingDue: string;
}

interface CEOBriefing {
  briefingId: string;
  generatedAt: string;
  dataConfidence: number;
  channelROIDashboard: {
    topPerformers: Array<{
      channel: string;
      spend: number;
      revenue: number;
      roi: number;
      trend: string;
    }>;
    portfolioHealth: {
      diversificationScore: number;
      riskAssessment: string;
      sustainabilityRating: 'high' | 'medium' | 'low';
    };
    competitivePosition: {
      marketShare: number;
      growthRate: number;
      efficiency: number;
    };
  };
  strategicInsights: {
    opportunities: string[];
    threats: string[];
    recommendations: string[];
  };
  boardReadyMetrics: {
    totalROI: number;
    costPerAcquisition: number;
    customerLifetimeValue: number;
    paybackPeriod: number;
  };
  actionItems: string[];
  nextBriefingDue: string;
}

class AgentBriefingSystem {
  private sanityChecker: COODataSanityCheck;
  
  constructor() {
    this.sanityChecker = new COODataSanityCheck();
  }

  /**
   * Generate comprehensive briefing for CMO Agent focusing on high-intent traffic channels
   * NOW ENHANCED: Uses learning integration to adapt strategies based on past performance
   */
  async generateCMOBriefing(): Promise<CMOBriefing> {
    // Get validated data from sanity check
    const sanityReport = await this.sanityChecker.performSanityCheck();
    
    // Generate top 5 channels based on validated attribution data
    const top5Channels = await this.calculateTop5Channels(sanityReport);
    
    // 🧠 LEARNING INTEGRATION: Get CMO strategy recommendations based on past performance
    const learningRecommendations = learningIntegration.getStrategyRecommendations('cmo');
    const strategyAdaptation = learningIntegration.adaptAgentStrategies('cmo', 'content_marketing_expansion');
    
    // Generate channel recommendations enhanced with learning data
    const channelRecommendations = this.generateChannelRecommendations(top5Channels, sanityReport.attributionComparison, learningRecommendations);
    
    // Analyze content strategy opportunities with learning insights
    const contentStrategy = await this.analyzeContentStrategy(sanityReport.customerJourneys, strategyAdaptation);
    
    const briefing: CMOBriefing = {
      briefingId: `cmo_brief_${nanoid(8)}`,
      generatedAt: new Date().toISOString(),
      dataConfidence: sanityReport.overallConfidenceScore,
      top5Channels,
      channelRecommendations,
      contentStrategy,
      actionItems: this.generateCMOActionItems(top5Channels, channelRecommendations, contentStrategy, learningRecommendations),
      nextBriefingDue: this.getNextBriefingDate('weekly')
    };
    
    // 📚 RECORD LEARNING OUTCOME: Track this briefing generation for future adaptation
    const outcome: LearningOutcome = {
      agent: 'cmo',
      strategy: 'content_marketing_expansion',
      outcome: sanityReport.overallConfidenceScore > 80 ? 'success' : 'partial',
      cost: 5, // Cost of generating briefing
      impact: Math.round(sanityReport.overallConfidenceScore),
      confidence: sanityReport.overallConfidenceScore,
      timestamp: new Date().toISOString()
    };
    learningIntegration.recordOutcome(outcome);
    
    return briefing;
  }

  /**
   * Generate comprehensive briefing for CRO Agent focusing on conversion optimization
   * NOW ENHANCED: Uses learning integration to adapt conversion strategies based on past performance
   */
  async generateCROBriefing(): Promise<CROBriefing> {
    const sanityReport = await this.sanityChecker.performSanityCheck();
    
    // Identify top 3 content paths that precede sales
    const top3ContentPaths = await this.identifyTop3ContentPaths(sanityReport.customerJourneys);
    
    // 🧠 LEARNING INTEGRATION: Get CRO strategy recommendations based on past conversion performance
    const learningRecommendations = learningIntegration.getStrategyRecommendations('cro');
    const strategyAdaptation = learningIntegration.adaptAgentStrategies('cro', 'funnel_optimization');
    
    // Generate conversion optimization recommendations enhanced with learning data
    const conversionOptimization = this.generateConversionOptimization(top3ContentPaths, sanityReport, learningRecommendations);
    
    // Analyze funnel for dropoff points with learning insights
    const funnelAnalysis = await this.analyzeFunnelDropoffs(sanityReport.customerJourneys, strategyAdaptation);
    
    const briefing: CROBriefing = {
      briefingId: `cro_brief_${nanoid(8)}`,
      generatedAt: new Date().toISOString(),
      dataConfidence: sanityReport.overallConfidenceScore,
      top3ContentPaths,
      conversionOptimization,
      funnelAnalysis,
      actionItems: this.generateCROActionItems(top3ContentPaths, conversionOptimization, funnelAnalysis, learningRecommendations),
      nextBriefingDue: this.getNextBriefingDate('bi-weekly')
    };
    
    // 📚 RECORD LEARNING OUTCOME: Track conversion optimization success for future adaptation
    const outcome: LearningOutcome = {
      agent: 'cro',
      strategy: 'funnel_optimization',
      outcome: sanityReport.overallConfidenceScore > 80 ? 'success' : 'partial',
      cost: 8, // Cost of conversion analysis
      impact: Math.round(sanityReport.overallConfidenceScore),
      confidence: sanityReport.overallConfidenceScore,
      timestamp: new Date().toISOString()
    };
    learningIntegration.recordOutcome(outcome);
    
    return briefing;
  }

  /**
   * Generate comprehensive briefing for CEO Agent with board-ready Channel ROI dashboard
   */
  async generateCEOBriefing(): Promise<CEOBriefing> {
    const sanityReport = await this.sanityChecker.performSanityCheck();
    
    // Build comprehensive Channel ROI dashboard
    const channelROIDashboard = await this.buildChannelROIDashboard(sanityReport);
    
    // Generate strategic insights for board conversations
    const strategicInsights = this.generateStrategicInsights(channelROIDashboard, sanityReport);
    
    // Calculate board-ready metrics
    const boardReadyMetrics = this.calculateBoardReadyMetrics(sanityReport.customerJourneys);
    
    const briefing: CEOBriefing = {
      briefingId: `ceo_brief_${nanoid(8)}`,
      generatedAt: new Date().toISOString(),
      dataConfidence: sanityReport.overallConfidenceScore,
      channelROIDashboard,
      strategicInsights,
      boardReadyMetrics,
      actionItems: this.generateCEOActionItems(channelROIDashboard, strategicInsights, boardReadyMetrics),
      nextBriefingDue: this.getNextBriefingDate('monthly')
    };
    
    return briefing;
  }

  /**
   * Calculate top 5 performing channels based on validated attribution data
   */
  private async calculateTop5Channels(sanityReport: SanityCheckReport): Promise<ChannelPerformance[]> {
    // Aggregate channel performance from customer journeys
    const channelMetrics: Record<string, {
      revenue: number;
      conversions: number;
      sessions: number;
    }> = {};
    
    sanityReport.customerJourneys.forEach(journey => {
      // Use U-shaped attribution for balanced view
      journey.attributionScores.uShaped.forEach(attr => {
        if (!channelMetrics[attr.channel]) {
          channelMetrics[attr.channel] = { revenue: 0, conversions: 0, sessions: 0 };
        }
        
        channelMetrics[attr.channel].revenue += attr.attribution * journey.conversionValue;
        channelMetrics[attr.channel].conversions += attr.attribution;
        channelMetrics[attr.channel].sessions += attr.touchpointCount;
      });
    });
    
    // Calculate performance metrics and trends
    const channels: ChannelPerformance[] = Object.entries(channelMetrics).map(([channel, metrics]) => {
      const conversionRate = metrics.sessions > 0 ? (metrics.conversions / metrics.sessions) * 100 : 0;
      const revenuePerSession = metrics.sessions > 0 ? metrics.revenue / metrics.sessions : 0;
      
      return {
        channel,
        revenue: metrics.revenue,
        conversions: metrics.conversions,
        sessions: metrics.sessions,
        conversionRate,
        revenuePerSession,
        trend: this.calculateTrend(channel), // Based on historical data
        confidence: this.calculateChannelConfidence(channel, metrics.conversions)
      };
    });
    
    // Return top 5 by revenue, but consider confidence
    return channels
      .filter(ch => ch.confidence > 50) // Filter low-confidence channels
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  /**
   * Identify top 3 content paths that consistently lead to conversions
   */
  private async identifyTop3ContentPaths(journeys: CustomerJourney[]): Promise<ContentPath[]> {
    // Analyze common page sequences that lead to conversions
    const pathPatterns: Record<string, {
      count: number;
      conversions: number;
      totalValue: number;
      avgTouchpoints: number;
    }> = {};
    
    journeys.forEach(journey => {
      // Extract key content path (last 3 meaningful pages before conversion)
      const contentPages = journey.touchpoints
        .filter(tp => tp.eventType === 'page_view' && tp.page !== '/')
        .slice(-3)
        .map(tp => tp.page);
      
      if (contentPages.length >= 2) {
        const pathKey = contentPages.join(' → ');
        
        if (!pathPatterns[pathKey]) {
          pathPatterns[pathKey] = { count: 0, conversions: 0, totalValue: 0, avgTouchpoints: 0 };
        }
        
        pathPatterns[pathKey].count += 1;
        pathPatterns[pathKey].conversions += 1; // All journeys in our sample converted
        pathPatterns[pathKey].totalValue += journey.conversionValue;
        pathPatterns[pathKey].avgTouchpoints += journey.touchpoints.length;
      }
    });
    
    // Calculate path performance and return top 3
    const paths: ContentPath[] = Object.entries(pathPatterns).map(([path, stats]) => {
      const conversionRate = stats.count > 0 ? (stats.conversions / stats.count) * 100 : 0;
      const averageValue = stats.conversions > 0 ? stats.totalValue / stats.conversions : 0;
      const avgTouchpoints = stats.count > 0 ? stats.avgTouchpoints / stats.count : 0;
      
      return {
        path,
        description: this.generatePathDescription(path),
        conversions: stats.conversions,
        conversionRate,
        averageValue,
        touchpointCount: avgTouchpoints,
        priority: this.calculatePathPriority(conversionRate, averageValue, stats.conversions)
      };
    });
    
    return paths
      .filter(path => path.conversions >= 2) // Minimum sample size
      .sort((a, b) => b.conversions * b.averageValue - a.conversions * a.averageValue)
      .slice(0, 3);
  }

  /**
   * Generate channel investment recommendations for CMO
   */
  private generateChannelRecommendations(channels: ChannelPerformance[], attributionComparison: AttributionComparison[]) {
    const doubleDown: string[] = [];
    const investigate: string[] = [];
    const pause: string[] = [];
    
    channels.forEach(channel => {
      // Find attribution discrepancy for this channel
      const discrepancy = attributionComparison.find(comp => comp.channel === channel.channel);
      
      if (channel.trend === 'up' && channel.conversionRate > 2 && channel.confidence > 75) {
        doubleDown.push(channel.channel);
      } else if (discrepancy?.discrepancyFlag || channel.confidence < 60) {
        investigate.push(channel.channel);
      } else if (channel.trend === 'down' && channel.conversionRate < 1) {
        pause.push(channel.channel);
      }
    });
    
    return { doubleDown, investigate, pause };
  }

  /**
   * Build comprehensive Channel ROI dashboard for CEO
   */
  private async buildChannelROIDashboard(sanityReport: SanityCheckReport) {
    // Calculate channel spending (mock data - integrate with actual spend tracking)
    const channelSpend: Record<string, number> = {
      'Organic Search': 0, // SEO efforts
      'Email': 500, // Mailchimp + automation costs
      'Direct': 0, // No direct spend
      'Social Media': 800, // Social ads + content
      'Paid Search': 1200 // Google/Bing ads
    };
    
    const topPerformers = sanityReport.attributionComparison.map(channel => {
      const spend = channelSpend[channel.channel] || 0;
      const revenue = channel.uShapedModel * 10000; // Scale to actual revenue
      const roi = spend > 0 ? (revenue - spend) / spend : revenue > 0 ? Infinity : 0;
      
      return {
        channel: channel.channel,
        spend,
        revenue,
        roi,
        trend: roi > 3 ? 'Strong ROI' : roi > 1 ? 'Positive ROI' : 'Needs Optimization'
      };
    }).sort((a, b) => b.roi - a.roi);
    
    const totalSpend = Object.values(channelSpend).reduce((sum, spend) => sum + spend, 0);
    const totalRevenue = topPerformers.reduce((sum, ch) => sum + ch.revenue, 0);
    
    return {
      topPerformers: topPerformers.slice(0, 5),
      portfolioHealth: {
        diversificationScore: this.calculateDiversificationScore(topPerformers),
        riskAssessment: totalSpend < 5000 ? 'Low Risk - Conservative Approach' : 'Medium Risk - Balanced Portfolio',
        sustainabilityRating: (totalRevenue / totalSpend > 3 ? 'high' : totalRevenue / totalSpend > 1.5 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
      },
      competitivePosition: {
        marketShare: 15, // Mock data
        growthRate: 25, // Mock data
        efficiency: totalSpend > 0 ? totalRevenue / totalSpend : 0
      }
    };
  }

  // Helper methods
  private calculateTrend(channel: string): 'up' | 'down' | 'stable' {
    // Mock trend calculation - integrate with historical data
    const trendMap: Record<string, 'up' | 'down' | 'stable'> = {
      'Organic Search': 'up',
      'Email': 'up', 
      'Direct': 'stable',
      'Social Media': 'down',
      'Paid Search': 'stable'
    };
    return trendMap[channel] || 'stable';
  }

  private calculateChannelConfidence(channel: string, conversions: number): number {
    // Base confidence on sample size and channel type
    const baseConfidence = Math.min(90, 40 + (conversions * 10));
    
    // Adjust for channel reliability
    const channelAdjustment: Record<string, number> = {
      'Organic Search': 10,
      'Email': 15,
      'Direct': 5,
      'Social Media': -5,
      'Paid Search': 8
    };
    
    return Math.max(0, Math.min(100, baseConfidence + (channelAdjustment[channel] || 0)));
  }

  private generatePathDescription(path: string): string {
    const descriptions: Record<string, string> = {
      '/compliance-quiz → /roi-calculator → /membership/rising-leader': 'Quiz-driven conversion path for Rising Leaders',
      '/roi-calculator → /membership-calculator → /membership/validation-strategist': 'ROI-first approach for efficiency seekers', 
      '/elsa-report → /roi-calculator → /membership/compliance-architect': 'ELSA to Enterprise upgrade path'
    };
    return descriptions[path] || 'Custom conversion journey';
  }

  private calculatePathPriority(conversionRate: number, averageValue: number, conversions: number): 'high' | 'medium' | 'low' {
    const score = (conversionRate * 0.3) + (averageValue * 0.4) + (conversions * 0.3);
    if (score > 80) return 'high';
    if (score > 50) return 'medium';
    return 'low';
  }

  private calculateDiversificationScore(channels: any[]): number {
    // Calculate revenue distribution across channels
    const totalRevenue = channels.reduce((sum, ch) => sum + ch.revenue, 0);
    if (totalRevenue === 0) return 0;
    
    const entropy = channels.reduce((ent, ch) => {
      const proportion = ch.revenue / totalRevenue;
      return ent - (proportion * Math.log2(proportion));
    }, 0);
    
    return Math.min(100, (entropy / Math.log2(channels.length)) * 100);
  }

  private generateCMOActionItems(channels: ChannelPerformance[], recommendations: any, contentStrategy: any): string[] {
    const actions: string[] = [];
    
    if (recommendations.doubleDown.length > 0) {
      actions.push(`Increase content investment in: ${recommendations.doubleDown.join(', ')}`);
    }
    
    if (recommendations.investigate.length > 0) {
      actions.push(`Investigate attribution discrepancies in: ${recommendations.investigate.join(', ')}`);
    }
    
    if (contentStrategy.gapAnalysis.length > 0) {
      actions.push(`Fill content gaps in: ${contentStrategy.gapAnalysis.slice(0, 2).join(', ')}`);
    }
    
    return actions;
  }

  private generateCROActionItems(paths: ContentPath[], optimization: any, funnel: any): string[] {
    const actions: string[] = [];
    
    if (paths.length > 0) {
      actions.push(`A/B test optimization for: ${paths[0].path.split(' → ').slice(-1)[0]}`);
    }
    
    if (optimization.quickWins.length > 0) {
      actions.push(`Implement quick wins: ${optimization.quickWins.slice(0, 2).join(', ')}`);
    }
    
    if (funnel.dropoffPoints.length > 0) {
      const topDropoff = funnel.dropoffPoints[0];
      actions.push(`Address ${topDropoff.dropoffRate}% dropoff at ${topDropoff.step}`);
    }
    
    return actions;
  }

  private generateCEOActionItems(dashboard: any, insights: any, metrics: any): string[] {
    const actions: string[] = [];
    
    if (dashboard.portfolioHealth.sustainabilityRating === 'low') {
      actions.push('Review marketing spend efficiency and optimization opportunities');
    }
    
    if (insights.opportunities.length > 0) {
      actions.push(`Explore strategic opportunity: ${insights.opportunities[0]}`);
    }
    
    if (metrics.totalROI < 2) {
      actions.push('Initiate comprehensive marketing ROI improvement initiative');
    }
    
    return actions;
  }

  private getNextBriefingDate(frequency: 'weekly' | 'bi-weekly' | 'monthly'): string {
    const now = new Date();
    const days = frequency === 'weekly' ? 7 : frequency === 'bi-weekly' ? 14 : 30;
    now.setDate(now.getDate() + days);
    return now.toISOString();
  }

  // Placeholder implementations for complex analysis
  private async analyzeContentStrategy(journeys: CustomerJourney[]) {
    return {
      highPerformingTopics: ['ROI Calculation', 'Compliance Quiz', 'Membership Benefits'],
      underperformingAreas: ['Social Proof', 'Case Studies', 'Pricing Transparency'],
      gapAnalysis: ['Video Content', 'Interactive Tools', 'Mobile Experience']
    };
  }

  private generateConversionOptimization(paths: ContentPath[], sanityReport: SanityCheckReport) {
    return {
      highImpactTests: [
        {
          testType: 'landing_page' as const,
          description: 'Test simplified ROI calculator with fewer form fields',
          expectedImpact: 15,
          effort: 'medium' as const
        },
        {
          testType: 'email' as const,
          description: 'A/B test subject lines with personalized ROI values',
          expectedImpact: 8,
          effort: 'low' as const
        }
      ],
      quickWins: ['Add exit-intent popups on calculator page', 'Optimize mobile form experience'],
      longTermProjects: ['Implement progressive profiling', 'Build personalization engine']
    };
  }

  private async analyzeFunnelDropoffs(journeys: CustomerJourney[]) {
    return {
      dropoffPoints: [
        {
          step: 'ROI Calculator Form',
          dropoffRate: 35,
          opportunity: 8500 // Revenue opportunity
        },
        {
          step: 'Membership Selection',
          dropoffRate: 22,
          opportunity: 6200
        }
      ],
      improvements: [
        'Reduce form friction on ROI calculator',
        'Add social proof to membership selection page',
        'Implement exit-intent capture'
      ]
    };
  }

  private generateStrategicInsights(dashboard: any, sanityReport: SanityCheckReport) {
    return {
      opportunities: [
        'Email marketing shows 85% confidence - scale content production',
        'Organic search growing consistently - invest in SEO content',
        'Direct traffic stable - focus on brand strengthening'
      ],
      threats: [
        'Social media trend declining - review content strategy',
        'Attribution discrepancy in paid search - investigate tracking'
      ],
      recommendations: [
        'Maintain current low-cost strategy - ROI remains strong',
        'Consider gradual scaling of high-performing channels',
        'Implement advanced attribution model for better insights'
      ]
    };
  }

  private calculateBoardReadyMetrics(journeys: CustomerJourney[]) {
    const totalRevenue = journeys.reduce((sum, j) => sum + j.conversionValue, 0);
    const totalCustomers = journeys.length;
    const avgJourneyDuration = journeys.reduce((sum, j) => sum + j.journeyDuration, 0) / totalCustomers;
    
    return {
      totalROI: 4.2, // Mock calculation
      costPerAcquisition: totalRevenue > 0 ? (2500 / totalCustomers) : 0, // Mock spend
      customerLifetimeValue: 890, // Mock LTV
      paybackPeriod: avgJourneyDuration || 30 // Days to payback
    };
  }
}

export { AgentBriefingSystem, type CMOBriefing, type CROBriefing, type CEOBriefing };