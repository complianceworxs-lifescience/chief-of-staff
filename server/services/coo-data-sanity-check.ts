import { storage } from '../storage.js';
import { nanoid } from 'nanoid';

interface CustomerJourney {
  customerId: string;
  customerEmail: string;
  conversionType: 'membership' | 'elsa_report';
  conversionDate: string;
  conversionValue: number;
  touchpoints: TouchpointEvent[];
  attributionScores: {
    firstTouch: ChannelAttribution;
    lastTouch: ChannelAttribution;
    uShaped: ChannelAttribution[];
    timeDecay: ChannelAttribution[];
  };
  journeyDuration: number; // days from first touch to conversion
  sessionCount: number;
}

interface TouchpointEvent {
  timestamp: string;
  sessionId: string;
  channel: string;
  source: string;
  medium: string;
  campaign?: string;
  page: string;
  eventType: 'page_view' | 'quiz_completion' | 'calculator_use' | 'email_click' | 'conversion';
  value?: number;
}

interface ChannelAttribution {
  channel: string;
  attribution: number; // 0-1 representing percentage of credit
  touchpointCount: number;
}

interface AttributionComparison {
  channel: string;
  ga4LastTouch: number;
  uShapedModel: number;
  timeDecayModel: number;
  discrepancyFlag: boolean;
  discrepancyPercentage: number;
}

interface SanityCheckReport {
  auditId: string;
  auditDate: string;
  sampleSize: number;
  customerJourneys: CustomerJourney[];
  attributionComparison: AttributionComparison[];
  dataQualityFlags: {
    missingTouchpoints: number;
    duplicateEvents: number;
    sessionStitchingErrors: number;
    attributionDiscrepancies: number;
  };
  recommendations: string[];
  overallConfidenceScore: number; // 0-100
}

class COODataSanityCheck {
  
  /**
   * Perform comprehensive data sanity check on recent conversions
   */
  async performSanityCheck(): Promise<SanityCheckReport> {
    const auditId = `audit_${nanoid(8)}`;
    
    // Step 1: Get recent conversions (paid members + ELSA buyers)
    const recentConversions = await this.getRecentConversions(10);
    
    // Step 2: Build complete customer journeys 
    const customerJourneys = await Promise.all(
      recentConversions.map(conversion => this.traceCustomerJourney(conversion))
    );
    
    // Step 3: Compare attribution models
    const attributionComparison = await this.compareAttributionModels(customerJourneys);
    
    // Step 4: Identify data quality issues
    const dataQualityFlags = this.identifyDataQualityIssues(customerJourneys);
    
    // Step 5: Generate recommendations
    const recommendations = this.generateRecommendations(attributionComparison, dataQualityFlags);
    
    const report: SanityCheckReport = {
      auditId,
      auditDate: new Date().toISOString(),
      sampleSize: customerJourneys.length,
      customerJourneys,
      attributionComparison,
      dataQualityFlags,
      recommendations,
      overallConfidenceScore: this.calculateConfidenceScore(dataQualityFlags, attributionComparison)
    };
    
    // Store the audit report (using generic storage for now)
    const auditRecord = {
      id: auditId,
      type: 'data_sanity_audit',
      data: report,
      createdAt: new Date().toISOString()
    };
    // TODO: Add audit report storage to storage interface
    
    return report;
  }

  /**
   * Get recent conversions from storage
   */
  private async getRecentConversions(limit: number = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Mock implementation - replace with actual storage query
    return [
      {
        customerId: 'cust_001',
        email: 'user1@example.com',
        type: 'membership' as const,
        date: '2025-09-10T10:30:00Z',
        value: 197,
        tier: 'rising_leader'
      },
      {
        customerId: 'cust_002', 
        email: 'user2@example.com',
        type: 'elsa_report' as const,
        date: '2025-09-09T15:45:00Z',
        value: 49,
        tier: null
      },
      {
        customerId: 'cust_003',
        email: 'user3@example.com', 
        type: 'membership' as const,
        date: '2025-09-08T09:15:00Z',
        value: 297,
        tier: 'validation_strategist'
      }
    ];
  }

  /**
   * Trace complete customer journey from first touch to conversion
   */
  private async traceCustomerJourney(conversion: any): Promise<CustomerJourney> {
    // Get all events for this customer
    const allEvents = await this.getCustomerEvents(conversion.customerId, conversion.email);
    
    // Stitch sessions together and build touchpoint sequence
    const touchpoints = this.buildTouchpointSequence(allEvents);
    
    // Calculate attribution scores for different models
    const attributionScores = this.calculateAttributionScores(touchpoints);
    
    return {
      customerId: conversion.customerId,
      customerEmail: conversion.email,
      conversionType: conversion.type,
      conversionDate: conversion.date,
      conversionValue: conversion.value,
      touchpoints,
      attributionScores,
      journeyDuration: this.calculateJourneyDuration(touchpoints),
      sessionCount: this.countUniqueSessions(touchpoints)
    };
  }

  /**
   * Get all events for a specific customer
   */
  private async getCustomerEvents(customerId: string, email: string): Promise<TouchpointEvent[]> {
    // Mock implementation - replace with actual event data query
    const mockEvents: TouchpointEvent[] = [
      {
        timestamp: '2025-09-01T14:30:00Z',
        sessionId: 'sess_001',
        channel: 'Organic Search',
        source: 'google',
        medium: 'organic',
        page: '/compliance-quiz',
        eventType: 'page_view'
      },
      {
        timestamp: '2025-09-01T14:35:00Z',
        sessionId: 'sess_001', 
        channel: 'Organic Search',
        source: 'google',
        medium: 'organic',
        page: '/quiz-results',
        eventType: 'quiz_completion'
      },
      {
        timestamp: '2025-09-03T10:15:00Z',
        sessionId: 'sess_002',
        channel: 'Email',
        source: 'mailchimp',
        medium: 'email',
        campaign: 'rising_leader_kickoff',
        page: '/roi-calculator',
        eventType: 'email_click'
      },
      {
        timestamp: '2025-09-03T10:20:00Z',
        sessionId: 'sess_002',
        channel: 'Email', 
        source: 'mailchimp',
        medium: 'email',
        page: '/roi-results',
        eventType: 'calculator_use'
      },
      {
        timestamp: '2025-09-10T10:30:00Z',
        sessionId: 'sess_003',
        channel: 'Direct',
        source: 'direct',
        medium: 'none',
        page: '/membership/rising-leader',
        eventType: 'conversion',
        value: 197
      }
    ];
    
    return mockEvents.filter(event => 
      event.timestamp <= '2025-09-10T10:30:00Z' // Before conversion
    );
  }

  /**
   * Build clean touchpoint sequence from raw events
   */
  private buildTouchpointSequence(events: TouchpointEvent[]): TouchpointEvent[] {
    // Sort by timestamp
    const sortedEvents = events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Remove duplicate events and clean data
    const cleanedEvents = this.deduplicateEvents(sortedEvents);
    
    return cleanedEvents;
  }

  /**
   * Calculate attribution scores for different models
   */
  private calculateAttributionScores(touchpoints: TouchpointEvent[]) {
    const channels = Array.from(new Set(touchpoints.map(tp => tp.channel)));
    
    // First-touch attribution  
    const firstTouch: ChannelAttribution = {
      channel: touchpoints[0]?.channel || 'Unknown',
      attribution: 1.0,
      touchpointCount: touchpoints.filter(tp => tp.channel === touchpoints[0]?.channel).length
    };
    
    // Last-touch attribution (exclude conversion event)
    const nonConversionTouchpoints = touchpoints.filter(tp => tp.eventType !== 'conversion');
    const lastTouch: ChannelAttribution = {
      channel: nonConversionTouchpoints[nonConversionTouchpoints.length - 1]?.channel || 'Unknown',
      attribution: 1.0,
      touchpointCount: nonConversionTouchpoints.filter(tp => 
        tp.channel === nonConversionTouchpoints[nonConversionTouchpoints.length - 1]?.channel
      ).length
    };
    
    // U-shaped attribution (40% first, 40% last, 20% middle)
    const uShaped = this.calculateUShapedAttribution(touchpoints);
    
    // Time-decay attribution (more recent touchpoints get more credit)
    const timeDecay = this.calculateTimeDecayAttribution(touchpoints);
    
    return {
      firstTouch,
      lastTouch,
      uShaped,
      timeDecay
    };
  }

  /**
   * Calculate U-shaped attribution model
   */
  private calculateUShapedAttribution(touchpoints: TouchpointEvent[]): ChannelAttribution[] {
    const nonConversionTouchpoints = touchpoints.filter(tp => tp.eventType !== 'conversion');
    const channels = Array.from(new Set(nonConversionTouchpoints.map(tp => tp.channel)));
    
    if (nonConversionTouchpoints.length === 0) return [];
    if (nonConversionTouchpoints.length === 1) {
      return [{
        channel: nonConversionTouchpoints[0].channel,
        attribution: 1.0,
        touchpointCount: 1
      }];
    }
    
    const firstChannel = nonConversionTouchpoints[0].channel;
    const lastChannel = nonConversionTouchpoints[nonConversionTouchpoints.length - 1].channel;
    const middleTouchpoints = nonConversionTouchpoints.slice(1, -1);
    
    const attribution: ChannelAttribution[] = channels.map(channel => ({
      channel,
      attribution: 0,
      touchpointCount: nonConversionTouchpoints.filter(tp => tp.channel === channel).length
    }));
    
    // 40% to first touch
    const firstIndex = attribution.findIndex(attr => attr.channel === firstChannel);
    if (firstIndex >= 0) attribution[firstIndex].attribution += 0.4;
    
    // 40% to last touch
    const lastIndex = attribution.findIndex(attr => attr.channel === lastChannel);
    if (lastIndex >= 0) attribution[lastIndex].attribution += 0.4;
    
    // 20% distributed among middle touchpoints
    if (middleTouchpoints.length > 0) {
      const middleCredit = 0.2 / middleTouchpoints.length;
      middleTouchpoints.forEach(tp => {
        const index = attribution.findIndex(attr => attr.channel === tp.channel);
        if (index >= 0) attribution[index].attribution += middleCredit;
      });
    }
    
    return attribution.filter(attr => attr.attribution > 0);
  }

  /**
   * Calculate time-decay attribution model
   */
  private calculateTimeDecayAttribution(touchpoints: TouchpointEvent[]): ChannelAttribution[] {
    const nonConversionTouchpoints = touchpoints.filter(tp => tp.eventType !== 'conversion');
    const channels = Array.from(new Set(nonConversionTouchpoints.map(tp => tp.channel)));
    
    if (nonConversionTouchpoints.length === 0) return [];
    
    const halfLife = 7; // 7 days half-life
    const conversionTime = new Date().getTime(); // Assume conversion is "now"
    
    // Calculate decay weights
    const weights = nonConversionTouchpoints.map(tp => {
      const daysSince = (conversionTime - new Date(tp.timestamp).getTime()) / (24 * 60 * 60 * 1000);
      return Math.pow(0.5, daysSince / halfLife);
    });
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    const attribution: ChannelAttribution[] = channels.map(channel => {
      const channelTouchpoints = nonConversionTouchpoints
        .map((tp, i) => ({ tp, weight: weights[i] }))
        .filter(({ tp }) => tp.channel === channel);
      
      const channelWeight = channelTouchpoints.reduce((sum, { weight }) => sum + weight, 0);
      
      return {
        channel,
        attribution: totalWeight > 0 ? channelWeight / totalWeight : 0,
        touchpointCount: channelTouchpoints.length
      };
    });
    
    return attribution.filter(attr => attr.attribution > 0);
  }

  /**
   * Compare attribution models and identify discrepancies
   */
  private async compareAttributionModels(journeys: CustomerJourney[]): Promise<AttributionComparison[]> {
    // Mock GA4 last-touch data for comparison
    const ga4Data = await this.getGA4LastTouchData();
    
    // Aggregate attribution across all journeys
    const aggregatedAttribution = this.aggregateAttribution(journeys);
    
    const comparison: AttributionComparison[] = [];
    
    Object.keys(aggregatedAttribution).forEach(channel => {
      const ga4Value = ga4Data[channel] || 0;
      const uShapedValue = aggregatedAttribution[channel].uShaped;
      const timeDecayValue = aggregatedAttribution[channel].timeDecay;
      
      const uShapedDiscrepancy = Math.abs(ga4Value - uShapedValue) / Math.max(ga4Value, uShapedValue, 0.01);
      const timeDecayDiscrepancy = Math.abs(ga4Value - timeDecayValue) / Math.max(ga4Value, timeDecayValue, 0.01);
      const maxDiscrepancy = Math.max(uShapedDiscrepancy, timeDecayDiscrepancy);
      
      comparison.push({
        channel,
        ga4LastTouch: ga4Value,
        uShapedModel: uShapedValue,
        timeDecayModel: timeDecayValue,
        discrepancyFlag: maxDiscrepancy > 0.25, // Flag if >25% difference
        discrepancyPercentage: maxDiscrepancy * 100
      });
    });
    
    return comparison.sort((a, b) => b.discrepancyPercentage - a.discrepancyPercentage);
  }

  /**
   * Aggregate attribution scores across all customer journeys
   */
  private aggregateAttribution(journeys: CustomerJourney[]) {
    const aggregated: Record<string, { uShaped: number; timeDecay: number }> = {};
    
    journeys.forEach(journey => {
      journey.attributionScores.uShaped.forEach(attr => {
        if (!aggregated[attr.channel]) {
          aggregated[attr.channel] = { uShaped: 0, timeDecay: 0 };
        }
        aggregated[attr.channel].uShaped += attr.attribution * journey.conversionValue;
      });
      
      journey.attributionScores.timeDecay.forEach(attr => {
        if (!aggregated[attr.channel]) {
          aggregated[attr.channel] = { uShaped: 0, timeDecay: 0 };
        }
        aggregated[attr.channel].timeDecay += attr.attribution * journey.conversionValue;
      });
    });
    
    // Normalize to percentages
    const totalUShaped = Object.values(aggregated).reduce((sum, val) => sum + val.uShaped, 0);
    const totalTimeDecay = Object.values(aggregated).reduce((sum, val) => sum + val.timeDecay, 0);
    
    Object.keys(aggregated).forEach(channel => {
      aggregated[channel].uShaped = totalUShaped > 0 ? aggregated[channel].uShaped / totalUShaped : 0;
      aggregated[channel].timeDecay = totalTimeDecay > 0 ? aggregated[channel].timeDecay / totalTimeDecay : 0;
    });
    
    return aggregated;
  }

  /**
   * Get GA4 last-touch attribution data for comparison
   */
  private async getGA4LastTouchData(): Promise<Record<string, number>> {
    // Mock GA4 data - replace with actual GA4 API integration
    return {
      'Organic Search': 0.35,
      'Email': 0.28,
      'Direct': 0.20,
      'Social Media': 0.12,
      'Paid Search': 0.05
    };
  }

  /**
   * Identify data quality issues in customer journeys
   */
  private identifyDataQualityIssues(journeys: CustomerJourney[]) {
    let missingTouchpoints = 0;
    let duplicateEvents = 0;
    let sessionStitchingErrors = 0;
    let attributionDiscrepancies = 0;
    
    journeys.forEach(journey => {
      // Check for missing first or last touchpoints
      if (journey.touchpoints.length < 2) {
        missingTouchpoints++;
      }
      
      // Check for duplicate events (same timestamp + page)
      const eventKeys = journey.touchpoints.map(tp => `${tp.timestamp}_${tp.page}`);
      if (eventKeys.length !== new Set(eventKeys).size) {
        duplicateEvents++;
      }
      
      // Check for session stitching errors (gaps > 30 minutes in same session)
      const sessionGroups = this.groupBySession(journey.touchpoints);
      Object.values(sessionGroups).forEach(events => {
        for (let i = 1; i < events.length; i++) {
          const timeDiff = new Date(events[i].timestamp).getTime() - new Date(events[i-1].timestamp).getTime();
          if (timeDiff > 30 * 60 * 1000) { // 30 minutes
            sessionStitchingErrors++;
            break;
          }
        }
      });
      
      // Check for attribution model inconsistencies
      const totalUShapedAttribution = journey.attributionScores.uShaped.reduce((sum, attr) => sum + attr.attribution, 0);
      const totalTimeDecayAttribution = journey.attributionScores.timeDecay.reduce((sum, attr) => sum + attr.attribution, 0);
      
      if (Math.abs(totalUShapedAttribution - 1.0) > 0.01 || Math.abs(totalTimeDecayAttribution - 1.0) > 0.01) {
        attributionDiscrepancies++;
      }
    });
    
    return {
      missingTouchpoints,
      duplicateEvents,
      sessionStitchingErrors,
      attributionDiscrepancies
    };
  }

  /**
   * Generate recommendations based on audit findings
   */
  private generateRecommendations(comparison: AttributionComparison[], dataQuality: any): string[] {
    const recommendations: string[] = [];
    
    // Attribution model recommendations
    const highDiscrepancyChannels = comparison.filter(c => c.discrepancyFlag);
    if (highDiscrepancyChannels.length > 0) {
      recommendations.push(`Investigate ${highDiscrepancyChannels.length} channels with >25% attribution discrepancy: ${highDiscrepancyChannels.map(c => c.channel).join(', ')}`);
    }
    
    // Data quality recommendations
    if (dataQuality.missingTouchpoints > 0) {
      recommendations.push(`Fix ${dataQuality.missingTouchpoints} customer journeys with incomplete touchpoint data`);
    }
    
    if (dataQuality.duplicateEvents > 0) {
      recommendations.push(`Clean ${dataQuality.duplicateEvents} duplicate events from event collection system`);
    }
    
    if (dataQuality.sessionStitchingErrors > 0) {
      recommendations.push(`Review session stitching logic - found ${dataQuality.sessionStitchingErrors} potential errors`);
    }
    
    if (dataQuality.attributionDiscrepancies > 0) {
      recommendations.push(`Fix attribution calculation errors in ${dataQuality.attributionDiscrepancies} customer journeys`);
    }
    
    // If no major issues found
    if (recommendations.length === 0) {
      recommendations.push('Data quality looks good. Consider expanding sample size for deeper validation.');
    }
    
    return recommendations;
  }

  /**
   * Calculate overall confidence score for the data
   */
  private calculateConfidenceScore(dataQuality: any, comparison: AttributionComparison[]): number {
    let score = 100;
    
    // Deduct for data quality issues
    score -= dataQuality.missingTouchpoints * 5;
    score -= dataQuality.duplicateEvents * 3;
    score -= dataQuality.sessionStitchingErrors * 4;
    score -= dataQuality.attributionDiscrepancies * 6;
    
    // Deduct for attribution discrepancies
    const highDiscrepancies = comparison.filter(c => c.discrepancyFlag).length;
    score -= highDiscrepancies * 8;
    
    return Math.max(0, Math.min(100, score));
  }

  // Helper methods
  private deduplicateEvents(events: TouchpointEvent[]): TouchpointEvent[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.timestamp}_${event.page}_${event.eventType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateJourneyDuration(touchpoints: TouchpointEvent[]): number {
    if (touchpoints.length < 2) return 0;
    const first = new Date(touchpoints[0].timestamp).getTime();
    const last = new Date(touchpoints[touchpoints.length - 1].timestamp).getTime();
    return (last - first) / (24 * 60 * 60 * 1000); // Convert to days
  }

  private countUniqueSessions(touchpoints: TouchpointEvent[]): number {
    return new Set(touchpoints.map(tp => tp.sessionId)).size;
  }

  private groupBySession(touchpoints: TouchpointEvent[]): Record<string, TouchpointEvent[]> {
    return touchpoints.reduce((groups, tp) => {
      if (!groups[tp.sessionId]) groups[tp.sessionId] = [];
      groups[tp.sessionId].push(tp);
      return groups;
    }, {} as Record<string, TouchpointEvent[]>);
  }
}

export { COODataSanityCheck, type SanityCheckReport, type CustomerJourney, type AttributionComparison };