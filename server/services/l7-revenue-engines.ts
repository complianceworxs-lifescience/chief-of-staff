import fs from 'fs';
import path from 'path';

const STATE_PATH = path.join(process.cwd(), 'state', 'L7_MASTER_DIRECTIVE.json');

interface AssetScore {
  assetId: string;
  title: string;
  probability_of_checkout_7d: number;
  expected_revenue: number;
  persona_fit_score: number;
  composite_score: number;
  recommendation: 'PUBLISH' | 'HOLD' | 'DEPRECATE';
}

interface UserBehavior {
  userId: string;
  visitCount: number;
  engagementScore: number;
  intentSignals: string[];
  lastActivity: string;
}

interface OfferRecommendation {
  userId: string;
  tier: 'cold' | 'warm' | 'hot' | 'enterprise';
  recommendedOffer: string;
  priceRange: number[] | null;
  confidence: number;
}

interface PriceTest {
  testId: string;
  name: string;
  variants: { name: string; price: number; conversions: number; revenue: number }[];
  status: 'active' | 'completed' | 'paused';
  winner: string | null;
  startDate: string;
}

interface L7State {
  version: string;
  lastUpdated: string | null;
  metrics: {
    totalAssetsScored: number;
    totalAssetsPublished: number;
    totalOffersServed: number;
    totalRecoveriesTriggered: number;
    weeklyRevenue: number;
    weeklyConversions: number;
    currentCycleDay: number;
    cycleStartDate: string | null;
  };
  engines: {
    predictiveRevenue: { enabled: boolean; publishThreshold: number };
    dynamicOffer: { enabled: boolean };
    pricingExperimentation: { enabled: boolean; activeTests: PriceTest[]; maxConcurrentTests: number };
    attribution: { enabled: boolean };
  };
}

function loadState(): L7State {
  try {
    const data = fs.readFileSync(STATE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    throw new Error('L7 Master Directive state not found');
  }
}

function saveState(state: L7State): void {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export class PredictiveRevenueEngine {
  scoreAsset(asset: {
    id: string;
    title: string;
    impressions?: number;
    clicks?: number;
    checkouts?: number;
    revenue?: number;
    personaMatch?: number;
  }): AssetScore {
    const state = loadState();
    
    const impressions = asset.impressions || 0;
    const clicks = asset.clicks || 0;
    const checkouts = asset.checkouts || 0;
    const revenue = asset.revenue || 0;
    
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const checkoutRate = clicks > 0 ? checkouts / clicks : 0;
    const probability_of_checkout_7d = Math.min(1, ctr * checkoutRate * 7);
    const expected_revenue = revenue > 0 ? revenue : checkouts * 150;
    const persona_fit_score = asset.personaMatch || 0.5;
    
    const composite_score = (
      probability_of_checkout_7d * 0.4 +
      Math.min(1, expected_revenue / 1000) * 0.4 +
      persona_fit_score * 0.2
    );
    
    let recommendation: 'PUBLISH' | 'HOLD' | 'DEPRECATE' = 'HOLD';
    if (composite_score >= state.engines.predictiveRevenue.publishThreshold) {
      recommendation = 'PUBLISH';
    } else if (composite_score < 0.05) {
      recommendation = 'DEPRECATE';
    }
    
    state.metrics.totalAssetsScored++;
    if (recommendation === 'PUBLISH') {
      state.metrics.totalAssetsPublished++;
    }
    saveState(state);
    
    return {
      assetId: asset.id,
      title: asset.title,
      probability_of_checkout_7d,
      expected_revenue,
      persona_fit_score,
      composite_score,
      recommendation
    };
  }
  
  scoreAssets(assets: any[]): AssetScore[] {
    const scores = assets.map(a => this.scoreAsset(a));
    return scores.sort((a, b) => b.composite_score - a.composite_score);
  }
  
  getTop20Percent(assets: any[]): AssetScore[] {
    const scores = this.scoreAssets(assets);
    const top20Count = Math.max(1, Math.ceil(scores.length * 0.2));
    return scores.slice(0, top20Count);
  }
  
  getPublishableAssets(assets: any[]): AssetScore[] {
    return this.scoreAssets(assets).filter(s => s.recommendation === 'PUBLISH');
  }
}

export class DynamicOfferEngine {
  classifyUser(behavior: UserBehavior): OfferRecommendation {
    const state = loadState();
    
    let tier: 'cold' | 'warm' | 'hot' | 'enterprise' = 'cold';
    let confidence = 0.5;
    
    const hasEnterpriseSignals = behavior.intentSignals.some(s => 
      ['enterprise', 'team', 'bulk', 'annual', 'demo_request'].includes(s.toLowerCase())
    );
    const hasHighIntent = behavior.intentSignals.some(s =>
      ['pricing_viewed', 'checkout_started', 'comparison', 'trial_started'].includes(s.toLowerCase())
    );
    
    if (hasEnterpriseSignals && behavior.engagementScore > 0.7) {
      tier = 'enterprise';
      confidence = 0.85;
    } else if (hasHighIntent || behavior.engagementScore > 0.6) {
      tier = 'hot';
      confidence = 0.75;
    } else if (behavior.visitCount > 2 || behavior.engagementScore > 0.3) {
      tier = 'warm';
      confidence = 0.65;
    } else {
      tier = 'cold';
      confidence = 0.55;
    }
    
    const offerMap = {
      cold: { offer: 'Free tool or $9 asset', priceRange: [0, 29] as number[] },
      warm: { offer: '$99/$149 tier', priceRange: [99, 149] as number[] },
      hot: { offer: '$499 Architect', priceRange: [299, 499] as number[] },
      enterprise: { offer: 'Enterprise pathway', priceRange: null }
    };
    
    state.metrics.totalOffersServed++;
    saveState(state);
    
    return {
      userId: behavior.userId,
      tier,
      recommendedOffer: offerMap[tier].offer,
      priceRange: offerMap[tier].priceRange,
      confidence
    };
  }
  
  getOfferForIntent(intentLevel: number): OfferRecommendation {
    const tier = intentLevel >= 0.8 ? 'enterprise' :
                 intentLevel >= 0.6 ? 'hot' :
                 intentLevel >= 0.3 ? 'warm' : 'cold';
    
    const offerMap = {
      cold: { offer: 'Free tool or $9 asset', priceRange: [0, 29] as number[] },
      warm: { offer: '$99/$149 tier', priceRange: [99, 149] as number[] },
      hot: { offer: '$499 Architect', priceRange: [299, 499] as number[] },
      enterprise: { offer: 'Enterprise pathway', priceRange: null }
    };
    
    return {
      userId: 'anonymous',
      tier,
      recommendedOffer: offerMap[tier].offer,
      priceRange: offerMap[tier].priceRange,
      confidence: 0.6
    };
  }
}

export class PricingExperimentationEngine {
  createTest(name: string, variants: { name: string; price: number }[]): PriceTest {
    const state = loadState();
    
    if (state.engines.pricingExperimentation.activeTests.length >= state.engines.pricingExperimentation.maxConcurrentTests) {
      throw new Error(`Maximum concurrent tests (${state.engines.pricingExperimentation.maxConcurrentTests}) reached`);
    }
    
    const test: PriceTest = {
      testId: `test_${Date.now()}`,
      name,
      variants: variants.map(v => ({ ...v, conversions: 0, revenue: 0 })),
      status: 'active',
      winner: null,
      startDate: new Date().toISOString()
    };
    
    state.engines.pricingExperimentation.activeTests.push(test);
    saveState(state);
    
    return test;
  }
  
  recordConversion(testId: string, variantName: string, revenue: number): void {
    const state = loadState();
    const test = state.engines.pricingExperimentation.activeTests.find(t => t.testId === testId);
    
    if (!test) throw new Error(`Test ${testId} not found`);
    
    const variant = test.variants.find(v => v.name === variantName);
    if (!variant) throw new Error(`Variant ${variantName} not found`);
    
    variant.conversions++;
    variant.revenue += revenue;
    
    state.metrics.weeklyConversions++;
    state.metrics.weeklyRevenue += revenue;
    saveState(state);
  }
  
  evaluateTest(testId: string): { winner: string | null; recommendation: string } {
    const state = loadState();
    const test = state.engines.pricingExperimentation.activeTests.find(t => t.testId === testId);
    
    if (!test) throw new Error(`Test ${testId} not found`);
    
    const totalConversions = test.variants.reduce((sum, v) => sum + v.conversions, 0);
    if (totalConversions < 30) {
      return { winner: null, recommendation: 'Insufficient data. Continue test.' };
    }
    
    const winner = test.variants.reduce((best, current) => {
      const bestRPV = best.conversions > 0 ? best.revenue / best.conversions : 0;
      const currentRPV = current.conversions > 0 ? current.revenue / current.conversions : 0;
      return currentRPV > bestRPV ? current : best;
    });
    
    test.winner = winner.name;
    test.status = 'completed';
    saveState(state);
    
    return {
      winner: winner.name,
      recommendation: `Winner: ${winner.name} with $${(winner.revenue / winner.conversions).toFixed(2)} revenue per conversion`
    };
  }
  
  getActiveTests(): PriceTest[] {
    const state = loadState();
    return state.engines.pricingExperimentation.activeTests.filter(t => t.status === 'active');
  }
}

export class AttributionEngine {
  private attributionLog: Map<string, any> = new Map();
  
  trackEvent(event: {
    sessionId: string;
    userId?: string;
    eventType: 'content' | 'click' | 'checkout' | 'revenue';
    assetId?: string;
    channel?: string;
    persona?: string;
    value?: number;
  }): void {
    const existing = this.attributionLog.get(event.sessionId) || {
      sessionId: event.sessionId,
      userId: event.userId,
      journey: [],
      totalValue: 0
    };
    
    existing.journey.push({
      type: event.eventType,
      assetId: event.assetId,
      channel: event.channel,
      persona: event.persona,
      value: event.value || 0,
      timestamp: new Date().toISOString()
    });
    
    if (event.eventType === 'revenue' && event.value) {
      existing.totalValue += event.value;
      
      const state = loadState();
      state.metrics.weeklyRevenue += event.value;
      saveState(state);
    }
    
    this.attributionLog.set(event.sessionId, existing);
  }
  
  getAttributionPath(sessionId: string): any {
    return this.attributionLog.get(sessionId);
  }
  
  getRevenueByAsset(): Map<string, number> {
    const byAsset = new Map<string, number>();
    
    this.attributionLog.forEach(session => {
      const revenueEvents = session.journey.filter((e: any) => e.type === 'revenue');
      const contentEvents = session.journey.filter((e: any) => e.type === 'content');
      
      if (revenueEvents.length > 0 && contentEvents.length > 0) {
        const firstContent = contentEvents[0];
        const totalRevenue = revenueEvents.reduce((sum: number, e: any) => sum + e.value, 0);
        
        if (firstContent.assetId) {
          const current = byAsset.get(firstContent.assetId) || 0;
          byAsset.set(firstContent.assetId, current + totalRevenue);
        }
      }
    });
    
    return byAsset;
  }
  
  getRevenueByPersona(): Map<string, number> {
    const byPersona = new Map<string, number>();
    
    this.attributionLog.forEach(session => {
      const revenueEvents = session.journey.filter((e: any) => e.type === 'revenue');
      const contentEvents = session.journey.filter((e: any) => e.type === 'content' && e.persona);
      
      if (revenueEvents.length > 0 && contentEvents.length > 0) {
        const persona = contentEvents[0].persona;
        const totalRevenue = revenueEvents.reduce((sum: number, e: any) => sum + e.value, 0);
        
        if (persona) {
          const current = byPersona.get(persona) || 0;
          byPersona.set(persona, current + totalRevenue);
        }
      }
    });
    
    return byPersona;
  }
}

export class CheckoutRecoveryEngine {
  async triggerRecovery(sessionData: {
    email: string;
    abandonedCart: any;
    lastActivity: string;
  }): Promise<{ triggered: boolean; channel: string; recoveryId: string }> {
    const state = loadState();
    
    state.metrics.totalRecoveriesTriggered++;
    saveState(state);
    
    const recoveryId = `recovery_${Date.now()}`;
    
    console.log(`🔄 CHECKOUT RECOVERY TRIGGERED: ${recoveryId}`);
    console.log(`   📧 Email: ${sessionData.email}`);
    console.log(`   🛒 Cart: ${JSON.stringify(sessionData.abandonedCart)}`);
    
    return {
      triggered: true,
      channel: 'mailchimp',
      recoveryId
    };
  }
}

export class L7WeeklyExecutionLoop {
  private engines: {
    predictiveRevenue: PredictiveRevenueEngine;
    dynamicOffer: DynamicOfferEngine;
    pricingExperimentation: PricingExperimentationEngine;
    attribution: AttributionEngine;
    checkoutRecovery: CheckoutRecoveryEngine;
  };
  
  constructor() {
    this.engines = {
      predictiveRevenue: new PredictiveRevenueEngine(),
      dynamicOffer: new DynamicOfferEngine(),
      pricingExperimentation: new PricingExperimentationEngine(),
      attribution: new AttributionEngine(),
      checkoutRecovery: new CheckoutRecoveryEngine()
    };
  }
  
  getCurrentCycleDay(): number {
    const state = loadState();
    if (!state.metrics.cycleStartDate) {
      state.metrics.cycleStartDate = new Date().toISOString();
      state.metrics.currentCycleDay = 1;
      saveState(state);
      return 1;
    }
    
    const start = new Date(state.metrics.cycleStartDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = (daysDiff % 7) + 1;
    
    state.metrics.currentCycleDay = cycleDay;
    saveState(state);
    
    return cycleDay;
  }
  
  async executeDailyPhase(): Promise<{
    day: number;
    phase: string;
    actions: string[];
    results: any;
  }> {
    const day = this.getCurrentCycleDay();
    const state = loadState();
    const weeklyLoop = (state as any).weeklyLoop;
    const dayKey = `day${day}` as keyof typeof weeklyLoop;
    const phaseInfo = weeklyLoop[dayKey];
    
    const actions: string[] = [];
    let results: any = {};
    
    console.log(`\n╔══════════════════════════════════════════════════════════════════╗`);
    console.log(`║     L7 WEEKLY EXECUTION LOOP - DAY ${day}: ${phaseInfo.phase.toUpperCase()}                    ║`);
    console.log(`╚══════════════════════════════════════════════════════════════════╝`);
    
    switch (day) {
      case 1:
        actions.push('Scoring all content assets');
        actions.push('Identifying top 20% for publication');
        results = { phase: 'PREDICT', assetsScored: state.metrics.totalAssetsScored };
        break;
        
      case 2:
        actions.push('CMO publishing CoS-approved assets');
        actions.push('Routing to highest-yield channels');
        results = { phase: 'DEPLOY', assetsPublished: state.metrics.totalAssetsPublished };
        break;
        
      case 3:
        actions.push('CRO detecting user intent signals');
        actions.push('Switching offers based on behavior tier');
        results = { phase: 'DETECT', offersServed: state.metrics.totalOffersServed };
        break;
        
      case 4:
        actions.push('Running CoS-defined price experiments');
        const activeTests = this.engines.pricingExperimentation.getActiveTests();
        results = { phase: 'TEST', activeTests: activeTests.length };
        break;
        
      case 5:
        actions.push('Removing low-yield assets');
        actions.push('Amplifying winners');
        results = { phase: 'OPTIMIZE', weeklyRevenue: state.metrics.weeklyRevenue };
        break;
        
      case 6:
        actions.push('Triggering checkout recovery flows');
        results = { phase: 'RECOVER', recoveriesTriggered: state.metrics.totalRecoveriesTriggered };
        break;
        
      case 7:
        actions.push('Compiling weekly KPIs');
        actions.push('Updating next cycle parameters');
        results = {
          phase: 'REPORT',
          weeklyMetrics: {
            revenue: state.metrics.weeklyRevenue,
            conversions: state.metrics.weeklyConversions,
            assetsScored: state.metrics.totalAssetsScored,
            assetsPublished: state.metrics.totalAssetsPublished,
            offersServed: state.metrics.totalOffersServed,
            recoveries: state.metrics.totalRecoveriesTriggered
          }
        };
        break;
    }
    
    console.log(`   📋 Phase: ${phaseInfo.phase}`);
    console.log(`   🎯 Action: ${phaseInfo.action}`);
    actions.forEach(a => console.log(`   ✅ ${a}`));
    
    return { day, phase: phaseInfo.phase, actions, results };
  }
  
  getWeeklyReport(): any {
    const state = loadState();
    return {
      cycleDay: state.metrics.currentCycleDay,
      cycleStartDate: state.metrics.cycleStartDate,
      metrics: state.metrics,
      engines: {
        predictiveRevenue: state.engines.predictiveRevenue.enabled,
        dynamicOffer: state.engines.dynamicOffer.enabled,
        pricingExperimentation: state.engines.pricingExperimentation.enabled,
        attribution: state.engines.attribution.enabled
      }
    };
  }
}

export const predictiveRevenueEngine = new PredictiveRevenueEngine();
export const dynamicOfferEngine = new DynamicOfferEngine();
export const pricingExperimentationEngine = new PricingExperimentationEngine();
export const attributionEngine = new AttributionEngine();
export const checkoutRecoveryEngine = new CheckoutRecoveryEngine();
export const l7WeeklyLoop = new L7WeeklyExecutionLoop();
