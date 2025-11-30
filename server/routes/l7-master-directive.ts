import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  predictiveRevenueEngine,
  dynamicOfferEngine,
  pricingExperimentationEngine,
  attributionEngine,
  checkoutRecoveryEngine,
  l7WeeklyLoop
} from '../services/l7-revenue-engines.js';

const router = Router();
const STATE_PATH = path.join(process.cwd(), 'state', 'L7_MASTER_DIRECTIVE.json');

function loadDirective(): any {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    throw new Error('L7 Master Directive not found');
  }
}

router.get('/status', (_req: Request, res: Response) => {
  try {
    const directive = loadDirective();
    res.json({
      success: true,
      directive: {
        version: directive.version,
        name: directive.name,
        status: directive.status,
        lastUpdated: directive.lastUpdated,
        authority: directive.authority,
        corePrinciple: directive.corePrinciple,
        currentCycleDay: directive.metrics.currentCycleDay,
        engines: {
          predictiveRevenue: directive.engines.predictiveRevenue.enabled,
          dynamicOffer: directive.engines.dynamicOffer.enabled,
          pricingExperimentation: directive.engines.pricingExperimentation.enabled,
          attribution: directive.engines.attribution.enabled
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/guardrails', (_req: Request, res: Response) => {
  try {
    const directive = loadDirective();
    res.json({
      success: true,
      guardrails: directive.guardrails,
      enforcement: 'ACTIVE',
      principle: directive.corePrinciple
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/assets/score', (req: Request, res: Response) => {
  try {
    const { asset } = req.body;
    if (!asset || !asset.id || !asset.title) {
      return res.status(400).json({ success: false, error: 'Asset with id and title required' });
    }
    
    const score = predictiveRevenueEngine.scoreAsset(asset);
    
    console.log(`📊 L7 ASSET SCORED: ${asset.title}`);
    console.log(`   🎯 Composite Score: ${(score.composite_score * 100).toFixed(1)}%`);
    console.log(`   📋 Recommendation: ${score.recommendation}`);
    
    res.json({ success: true, score });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/assets/score-batch', (req: Request, res: Response) => {
  try {
    const { assets } = req.body;
    if (!Array.isArray(assets)) {
      return res.status(400).json({ success: false, error: 'Assets array required' });
    }
    
    const scores = predictiveRevenueEngine.scoreAssets(assets);
    const publishable = scores.filter(s => s.recommendation === 'PUBLISH');
    const deprecated = scores.filter(s => s.recommendation === 'DEPRECATE');
    
    console.log(`📊 L7 BATCH SCORING COMPLETE`);
    console.log(`   📈 Total Scored: ${scores.length}`);
    console.log(`   ✅ Publishable: ${publishable.length}`);
    console.log(`   ❌ Deprecated: ${deprecated.length}`);
    
    res.json({
      success: true,
      totalScored: scores.length,
      publishable: publishable.length,
      deprecated: deprecated.length,
      scores
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/assets/top20', (req: Request, res: Response) => {
  try {
    const mockAssets = [
      { id: 'asset_1', title: 'CSV Validation Guide', impressions: 1000, clicks: 50, checkouts: 5, revenue: 750 },
      { id: 'asset_2', title: 'Compliance Automation Webinar', impressions: 500, clicks: 30, checkouts: 3, revenue: 450 },
      { id: 'asset_3', title: 'Life Sciences Best Practices', impressions: 800, clicks: 40, checkouts: 4, revenue: 600 },
      { id: 'asset_4', title: 'Regulatory Update Newsletter', impressions: 1200, clicks: 60, checkouts: 2, revenue: 300 },
      { id: 'asset_5', title: 'Audit Readiness Checklist', impressions: 600, clicks: 45, checkouts: 6, revenue: 900 }
    ];
    
    const top20 = predictiveRevenueEngine.getTop20Percent(mockAssets);
    
    res.json({
      success: true,
      totalAssets: mockAssets.length,
      top20Count: top20.length,
      top20Assets: top20
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/offer/classify', (req: Request, res: Response) => {
  try {
    const { userId, visitCount, engagementScore, intentSignals, lastActivity } = req.body;
    
    const recommendation = dynamicOfferEngine.classifyUser({
      userId: userId || 'anonymous',
      visitCount: visitCount || 1,
      engagementScore: engagementScore || 0,
      intentSignals: intentSignals || [],
      lastActivity: lastActivity || new Date().toISOString()
    });
    
    console.log(`🎯 L7 OFFER CLASSIFICATION: ${recommendation.tier.toUpperCase()}`);
    console.log(`   💰 Recommended: ${recommendation.recommendedOffer}`);
    console.log(`   📊 Confidence: ${(recommendation.confidence * 100).toFixed(0)}%`);
    
    res.json({ success: true, recommendation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/offer/intent', (req: Request, res: Response) => {
  try {
    const { intentLevel } = req.body;
    if (typeof intentLevel !== 'number' || intentLevel < 0 || intentLevel > 1) {
      return res.status(400).json({ success: false, error: 'intentLevel must be a number between 0 and 1' });
    }
    
    const recommendation = dynamicOfferEngine.getOfferForIntent(intentLevel);
    res.json({ success: true, recommendation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/pricing/test/create', (req: Request, res: Response) => {
  try {
    const { name, variants } = req.body;
    if (!name || !variants || !Array.isArray(variants)) {
      return res.status(400).json({ success: false, error: 'name and variants array required' });
    }
    
    const test = pricingExperimentationEngine.createTest(name, variants);
    
    console.log(`🧪 L7 PRICE TEST CREATED: ${name}`);
    console.log(`   🔢 Variants: ${variants.map((v: any) => `${v.name}=$${v.price}`).join(', ')}`);
    
    res.json({ success: true, test });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/pricing/test/:testId/conversion', (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const { variantName, revenue } = req.body;
    
    pricingExperimentationEngine.recordConversion(testId, variantName, revenue);
    
    res.json({ success: true, message: 'Conversion recorded' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/pricing/test/:testId/evaluate', (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const result = pricingExperimentationEngine.evaluateTest(testId);
    
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/pricing/tests/active', (_req: Request, res: Response) => {
  try {
    const tests = pricingExperimentationEngine.getActiveTests();
    res.json({ success: true, tests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/attribution/track', (req: Request, res: Response) => {
  try {
    const { sessionId, userId, eventType, assetId, channel, persona, value } = req.body;
    
    if (!sessionId || !eventType) {
      return res.status(400).json({ success: false, error: 'sessionId and eventType required' });
    }
    
    attributionEngine.trackEvent({ sessionId, userId, eventType, assetId, channel, persona, value });
    
    res.json({ success: true, message: 'Event tracked' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/attribution/session/:sessionId', (req: Request, res: Response) => {
  try {
    const path = attributionEngine.getAttributionPath(req.params.sessionId);
    res.json({ success: true, path });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/attribution/by-asset', (_req: Request, res: Response) => {
  try {
    const byAsset = attributionEngine.getRevenueByAsset();
    res.json({ success: true, revenueByAsset: Object.fromEntries(byAsset) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/attribution/by-persona', (_req: Request, res: Response) => {
  try {
    const byPersona = attributionEngine.getRevenueByPersona();
    res.json({ success: true, revenueByPersona: Object.fromEntries(byPersona) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/recovery/trigger', async (req: Request, res: Response) => {
  try {
    const { email, abandonedCart, lastActivity } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'email required' });
    }
    
    const result = await checkoutRecoveryEngine.triggerRecovery({
      email,
      abandonedCart: abandonedCart || {},
      lastActivity: lastActivity || new Date().toISOString()
    });
    
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/weekly-loop/status', (_req: Request, res: Response) => {
  try {
    const report = l7WeeklyLoop.getWeeklyReport();
    res.json({ success: true, ...report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/weekly-loop/execute', async (_req: Request, res: Response) => {
  try {
    const result = await l7WeeklyLoop.executeDailyPhase();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sub-directives/cmo', (_req: Request, res: Response) => {
  try {
    const directive = loadDirective();
    res.json({
      success: true,
      subDirective: 'CMO',
      ...directive.subDirectives.CMO,
      enforcement: 'ACTIVE',
      governedBy: 'ChiefOfStaff'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sub-directives/cro', (_req: Request, res: Response) => {
  try {
    const directive = loadDirective();
    res.json({
      success: true,
      subDirective: 'CRO',
      ...directive.subDirectives.CRO,
      enforcement: 'ACTIVE',
      governedBy: 'ChiefOfStaff'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/kpis', (_req: Request, res: Response) => {
  try {
    const directive = loadDirective();
    res.json({
      success: true,
      kpis: directive.kpis,
      currentMetrics: directive.metrics
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export function initL7MasterDirective(): void {
  console.log(`\n╔══════════════════════════════════════════════════════════════════╗`);
  console.log(`║       L7 REVENUE-FIRST OPERATING SYSTEM INITIALIZED             ║`);
  console.log(`╚══════════════════════════════════════════════════════════════════╝`);
  
  const directive = loadDirective();
  console.log(`   📜 Version: ${directive.version}`);
  console.log(`   ⚡ Authority: ${directive.authority.owner} (${directive.authority.level})`);
  console.log(`   🎯 Principle: "${directive.corePrinciple}"`);
  console.log(`   🔧 Engines:`);
  console.log(`      ✅ Predictive Revenue: ${directive.engines.predictiveRevenue.enabled ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`      ✅ Dynamic Offer: ${directive.engines.dynamicOffer.enabled ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`      ✅ Pricing Experimentation: ${directive.engines.pricingExperimentation.enabled ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`      ✅ Attribution: ${directive.engines.attribution.enabled ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`   📋 Sub-Directives: CMO, CRO`);
  console.log(`   🔄 Weekly Loop: 7-day cycle`);
  
  l7WeeklyLoop.executeDailyPhase().then(result => {
    console.log(`   📆 Current Phase: Day ${result.day} - ${result.phase}`);
  });
}

export default router;
