/**
 * DIRECTIVE ENHANCEMENT API ROUTES
 * 
 * Endpoints for the 5 high-impact directive enhancements:
 * 1. Real-Time Conversion Tracking
 * 2. Inter-Directive Signal Routing
 * 3. Real User Retention Data
 * 4. AI-Powered Asset Generation
 * 5. Automated Intelligence Scraping
 */

import { Router } from "express";
import {
  getRealtimeConversionMetrics,
  processSignalRouting,
  getRealUserRetentionData,
  generateAssetWithAI,
  processContentGenerationQueue,
  gatherAutomatedIntelligence,
  runEnhancedDirectiveCycle,
  emitDirectiveSignal,
  queueContentGeneration,
  ConversionMetrics,
  SignalRoutingState,
  UserActivityData,
  IntelligenceItem,
  GeneratedAsset,
  ContentGenerationRequest
} from "../services/directive-enhancements";
import * as fs from "fs";
import * as path from "path";

const router = Router();
const STATE_DIR = path.join(process.cwd(), "state");

function loadState(key: string): any {
  const filePath = path.join(STATE_DIR, `enhancement_${key}.json`);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (error) {
    return null;
  }
  return null;
}

// ============================================================================
// UNIFIED STATUS ENDPOINT
// ============================================================================

router.get("/status", async (req, res) => {
  try {
    const conversionMetrics = loadState("conversion_metrics") || {};
    const signalRouting = loadState("signal_routing") || { pendingSignals: [], processedSignals: [], activeLoops: {} };
    const retentionData = loadState("retention_data") || { users: [], summary: {} };
    const generatedAssets = loadState("generated_assets") || [];
    const intelligence = loadState("intelligence_feed") || [];

    const activeLoops = signalRouting.activeLoops || {};
    const activeLoopCount = Object.values(activeLoops).filter(Boolean).length;

    res.json({
      success: true,
      title: "Directive Enhancements v1.0",
      description: "5 high-impact improvements for Agent Installation Directives",
      enhancements: {
        conversionTracking: {
          name: "Real-Time Conversion Event Tracking",
          status: conversionMetrics.mrr !== undefined ? "active" : "initializing",
          metrics: {
            conversionRate: conversionMetrics.conversionRate || 0,
            mrr: conversionMetrics.mrr || 0,
            arr: conversionMetrics.arr || 0,
            last24hRevenue: conversionMetrics.last24hRevenue || 0
          }
        },
        signalRouting: {
          name: "Inter-Directive Signal Routing",
          status: "active",
          metrics: {
            activeLoops: activeLoopCount,
            pendingSignals: (signalRouting.pendingSignals || []).length,
            processedSignals: (signalRouting.processedSignals || []).length
          }
        },
        retentionEngine: {
          name: "Real User Retention Data",
          status: (retentionData.users || []).length > 0 ? "active" : "initializing",
          metrics: {
            usersAnalyzed: (retentionData.users || []).length,
            highRisk: retentionData.summary?.highRisk || 0,
            ltvAtRisk: retentionData.summary?.totalLtvAtRisk || 0
          }
        },
        contentGeneration: {
          name: "AI-Powered Asset Generation",
          status: generatedAssets.length > 0 ? "active" : "ready",
          metrics: {
            assetsGenerated: generatedAssets.length,
            pendingQueue: (loadState("generation_queue") || []).filter((r: any) => r.status === "pending").length
          }
        },
        intelligenceGathering: {
          name: "Automated Intelligence Scraping",
          status: intelligence.length > 0 ? "active" : "initializing",
          metrics: {
            totalItems: intelligence.length,
            highImpact: intelligence.filter((i: IntelligenceItem) => i.impact === "high").length,
            actionable: intelligence.filter((i: IntelligenceItem) => i.actionable).length
          }
        }
      },
      lastCycle: signalRouting.lastProcessed || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================================================
// TRIGGER FULL ENHANCEMENT CYCLE
// ============================================================================

router.post("/cycle", async (req, res) => {
  try {
    console.log("\n🚀 API: Triggering full enhancement cycle...");
    const result = await runEnhancedDirectiveCycle();
    
    res.json({
      success: true,
      message: "Enhancement cycle completed successfully",
      summary: {
        conversionRate: result.conversionMetrics.conversionRate,
        mrr: result.conversionMetrics.mrr,
        activeSignalLoops: Object.values(result.signalRouting.activeLoops).filter(Boolean).length,
        usersAtRisk: result.retentionData.filter(u => u.riskScore >= 50).length,
        newAssets: result.generatedAssets.length,
        actionableIntel: result.intelligence.filter(i => i.actionable).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================================================
// 1. CONVERSION TRACKING ENDPOINTS
// ============================================================================

router.get("/conversion", async (req, res) => {
  try {
    const metrics = await getRealtimeConversionMetrics();
    res.json({
      success: true,
      enhancement: "Real-Time Conversion Event Tracking",
      data: metrics
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get("/conversion/history", (req, res) => {
  const metrics = loadState("conversion_metrics");
  res.json({
    success: true,
    data: metrics || { message: "No conversion data available yet" }
  });
});

// ============================================================================
// 2. SIGNAL ROUTING ENDPOINTS
// ============================================================================

router.get("/signals", async (req, res) => {
  try {
    const state = await processSignalRouting();
    res.json({
      success: true,
      enhancement: "Inter-Directive Signal Routing",
      data: state
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post("/signals/emit", (req, res) => {
  try {
    const { source, target, type, priority, payload } = req.body;
    
    if (!source || !target || !type) {
      return res.status(400).json({ success: false, error: "Missing required fields: source, target, type" });
    }

    const signal = emitDirectiveSignal({
      source,
      target,
      type,
      priority: priority || "medium",
      payload: payload || {}
    });

    res.json({
      success: true,
      message: "Signal emitted successfully",
      signal
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get("/signals/active-loops", (req, res) => {
  const state = loadState("signal_routing");
  res.json({
    success: true,
    activeLoops: state?.activeLoops || {
      cmoToContent: false,
      croToCmo: false,
      strategistToAll: false,
      contentToCro: false
    },
    description: {
      cmoToContent: "CMO winning hook triggers Content asset production",
      croToCmo: "CRO conversion drop triggers CMO messaging adjustment",
      strategistToAll: "Strategist competitive intel broadcasts to all directives",
      contentToCro: "Content gap detection triggers AI generation"
    }
  });
});

// ============================================================================
// 3. RETENTION ENGINE ENDPOINTS
// ============================================================================

router.get("/retention", async (req, res) => {
  try {
    const users = await getRealUserRetentionData();
    res.json({
      success: true,
      enhancement: "Real User Retention Data",
      data: {
        users,
        summary: {
          total: users.length,
          highRisk: users.filter(u => u.riskScore >= 70).length,
          mediumRisk: users.filter(u => u.riskScore >= 30 && u.riskScore < 70).length,
          lowRisk: users.filter(u => u.riskScore < 30).length,
          totalLtvAtRisk: users.filter(u => u.riskScore >= 50).reduce((sum, u) => sum + u.ltv, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get("/retention/at-risk", (req, res) => {
  const data = loadState("retention_data");
  const users = (data?.users || []).filter((u: UserActivityData) => u.riskScore >= 50);
  
  res.json({
    success: true,
    atRiskUsers: users.map((u: UserActivityData) => ({
      userId: u.userId,
      email: u.email,
      riskScore: u.riskScore,
      ltv: u.ltv,
      riskFactors: u.riskFactors,
      recommendedIntervention: u.recommendedIntervention,
      daysSinceActivity: u.daysSinceLastActivity
    })),
    totalLtvAtRisk: users.reduce((sum: number, u: UserActivityData) => sum + u.ltv, 0)
  });
});

router.post("/retention/intervene", async (req, res) => {
  try {
    const { userId, interventionType } = req.body;
    
    if (!userId || !interventionType) {
      return res.status(400).json({ success: false, error: "Missing userId or interventionType" });
    }

    // Emit signal to trigger intervention
    emitDirectiveSignal({
      source: "CRO",
      target: "CMO",
      type: "churn_alert",
      priority: "high",
      payload: {
        userId,
        interventionType,
        triggeredManually: true
      }
    });

    res.json({
      success: true,
      message: `Intervention ${interventionType} triggered for user ${userId}`,
      signalEmitted: true
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================================================
// 4. AI CONTENT GENERATION ENDPOINTS
// ============================================================================

router.get("/content/generated", (req, res) => {
  const assets = loadState("generated_assets") || [];
  res.json({
    success: true,
    enhancement: "AI-Powered Asset Generation",
    assets,
    count: assets.length
  });
});

router.get("/content/queue", (req, res) => {
  const queue = loadState("generation_queue") || [];
  res.json({
    success: true,
    queue,
    summary: {
      total: queue.length,
      pending: queue.filter((r: ContentGenerationRequest) => r.status === "pending").length,
      generating: queue.filter((r: ContentGenerationRequest) => r.status === "generating").length,
      review: queue.filter((r: ContentGenerationRequest) => r.status === "review").length
    }
  });
});

router.post("/content/generate", async (req, res) => {
  try {
    const { topic, assetType, targetPersona, spearTipAngle, routingDestination } = req.body;

    if (!topic || !assetType) {
      return res.status(400).json({ success: false, error: "Missing required fields: topic, assetType" });
    }

    const requestId = queueContentGeneration({
      topic,
      assetType: assetType || "linkedin_post",
      targetPersona: targetPersona || "Quality Manager",
      spearTipAngle: spearTipAngle || "audit_readiness",
      routingDestination: routingDestination || "dashboard"
    });

    // Optionally process immediately
    if (req.query.immediate === "true") {
      await processContentGenerationQueue();
      const assets = loadState("generated_assets") || [];
      const generated = assets.find((a: GeneratedAsset) => a.id.includes(requestId.split("_")[1]));
      
      return res.json({
        success: true,
        message: "Content generated immediately",
        requestId,
        asset: generated || null
      });
    }

    res.json({
      success: true,
      message: "Content generation request queued",
      requestId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post("/content/process-queue", async (req, res) => {
  try {
    await processContentGenerationQueue();
    const queue = loadState("generation_queue") || [];
    
    res.json({
      success: true,
      message: "Generation queue processed",
      remaining: queue.filter((r: ContentGenerationRequest) => r.status === "pending").length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================================================
// 5. INTELLIGENCE GATHERING ENDPOINTS
// ============================================================================

router.get("/intelligence", async (req, res) => {
  try {
    const intel = await gatherAutomatedIntelligence();
    res.json({
      success: true,
      enhancement: "Automated Intelligence Scraping",
      data: intel,
      summary: {
        total: intel.length,
        highImpact: intel.filter(i => i.impact === "high").length,
        actionable: intel.filter(i => i.actionable).length,
        byType: {
          regulatory: intel.filter(i => i.type === "regulatory").length,
          competitor: intel.filter(i => i.type === "competitor_news" || i.type === "funding" || i.type === "product_launch").length,
          market: intel.filter(i => i.type === "market_trend" || i.type === "pain_point").length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get("/intelligence/feed", (req, res) => {
  const intel = loadState("intelligence_feed") || [];
  const limit = parseInt(req.query.limit as string) || 20;
  const type = req.query.type as string;
  const impact = req.query.impact as string;

  let filtered = intel;
  if (type) filtered = filtered.filter((i: IntelligenceItem) => i.type === type);
  if (impact) filtered = filtered.filter((i: IntelligenceItem) => i.impact === impact);

  res.json({
    success: true,
    items: filtered.slice(0, limit),
    total: filtered.length,
    filters: { type, impact, limit }
  });
});

router.get("/intelligence/actionable", (req, res) => {
  const intel = loadState("intelligence_feed") || [];
  const actionable = intel.filter((i: IntelligenceItem) => i.actionable);

  res.json({
    success: true,
    items: actionable,
    count: actionable.length,
    suggestedActions: actionable.map((i: IntelligenceItem) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      suggestedAction: i.suggestedAction
    }))
  });
});

export default router;
