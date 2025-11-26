// COMPLIANCEWORXS — ADVANCED CAPABILITY PACK v1.0 API ROUTES
// Purpose: API endpoints for Revenue Predictive Model, Offer Optimization Engine, and Compliance Intelligence Reports

import { Router } from "express";
import { revenuePredictiveModel } from "../services/revenue-predictive-model";
import { offerOptimizationEngine } from "../services/offer-optimization-engine";
import { complianceIntelligenceReports } from "../services/compliance-intelligence-reports";

const router = Router();

// ==========================================
// ADVANCED CAPABILITY PACK STATUS
// ==========================================

router.get("/status", (req, res) => {
  const rpm = revenuePredictiveModel.getStatus();
  const ooe = offerOptimizationEngine.getStatus();
  const cir = complianceIntelligenceReports.getStatus();

  res.json({
    version: "v1.0",
    name: "Advanced Capability Pack",
    activatedAt: rpm.activatedAt || ooe.activatedAt || cir.activatedAt,
    capabilities: {
      revenuePredictiveModel: {
        active: rpm.active,
        owners: ["Strategist", "Librarian"],
        coOwners: ["CoS", "CRO"]
      },
      offerOptimizationEngine: {
        active: ooe.active,
        owners: ["CRO", "CMO"],
        coOwners: ["Strategist", "Librarian"]
      },
      complianceIntelligenceReports: {
        active: cir.active,
        owners: ["Content Manager", "Librarian"],
        coOwners: ["Strategist", "CoS"]
      }
    },
    integrations: {
      unifiedDataLayer: true,
      weeklyRevenueSprints: true,
      objectionIntelligenceLoop: true,
      cosDashboard: true,
      v15OperatingContext: true
    }
  });
});

router.post("/activate", (req, res) => {
  console.log("🚀 ACTIVATING ADVANCED CAPABILITY PACK v1.0");

  const rpmResult = revenuePredictiveModel.activate();
  const ooeResult = offerOptimizationEngine.activate();
  const cirResult = complianceIntelligenceReports.activate();

  const ooeReport = offerOptimizationEngine.generateWeeklyReport();

  console.log("✅ ADVANCED CAPABILITY PACK v1.0 ACTIVATED");

  res.json({
    success: true,
    message: "Advanced Capability Pack v1.0 Activated",
    results: {
      revenuePredictiveModel: rpmResult,
      offerOptimizationEngine: ooeResult,
      complianceIntelligenceReports: cirResult
    },
    nextSteps: [
      "72-hour integration sprint initiated",
      "ODAR cycles assigned to Strategist, CRO, CMO, Librarian, Content Manager",
      "All capabilities integrated with Weekly Revenue Sprint",
      "Monthly intelligence cycle scheduled"
    ]
  });
});

router.get("/cos-dashboard", (req, res) => {
  res.json({
    title: "Advanced Capabilities Dashboard",
    generatedAt: new Date().toISOString(),
    capabilities: [
      revenuePredictiveModel.getCosDashboardData(),
      offerOptimizationEngine.getCosDashboardData(),
      complianceIntelligenceReports.getCosDashboardData()
    ]
  });
});

// ==========================================
// REVENUE PREDICTIVE MODEL ENDPOINTS
// ==========================================

router.get("/revenue-model/status", (req, res) => {
  res.json(revenuePredictiveModel.getStatus());
});

router.get("/revenue-model/forecast", (req, res) => {
  const forecast = revenuePredictiveModel.getLatestForecast();
  if (!forecast) {
    return res.status(404).json({ error: "No forecast available. Activate the capability first." });
  }
  res.json(forecast);
});

router.get("/revenue-model/forecast/history", (req, res) => {
  const limit = parseInt(req.query.limit as string) || 7;
  res.json(revenuePredictiveModel.getForecastHistory(limit));
});

router.post("/revenue-model/forecast/generate", (req, res) => {
  const forecast = revenuePredictiveModel.generateDailyForecast();
  res.json({
    success: true,
    message: "New forecast generated",
    forecast
  });
});

router.post("/revenue-model/signals/update", (req, res) => {
  const { signalType, data } = req.body;
  if (!signalType || !data) {
    return res.status(400).json({ error: "signalType and data required" });
  }
  revenuePredictiveModel.updateSignal(signalType, data);
  res.json({ success: true, message: `Signal ${signalType} updated` });
});

router.get("/revenue-model/dashboard", (req, res) => {
  res.json(revenuePredictiveModel.getCosDashboardData());
});

// ==========================================
// OFFER OPTIMIZATION ENGINE ENDPOINTS
// ==========================================

router.get("/offer-engine/status", (req, res) => {
  res.json(offerOptimizationEngine.getStatus());
});

router.get("/offer-engine/variants", (req, res) => {
  const tier = req.query.tier ? parseInt(req.query.tier as string) as 1 | 2 | 3 : undefined;
  res.json(offerOptimizationEngine.getVariants(tier));
});

router.get("/offer-engine/tests", (req, res) => {
  res.json(offerOptimizationEngine.getABTests());
});

router.get("/offer-engine/report", (req, res) => {
  const report = offerOptimizationEngine.getLatestReport();
  if (!report) {
    return res.status(404).json({ error: "No report available. Activate the capability first." });
  }
  res.json(report);
});

router.post("/offer-engine/report/generate", (req, res) => {
  const report = offerOptimizationEngine.generateWeeklyReport();
  res.json({
    success: true,
    message: "Weekly offer report generated",
    report
  });
});

router.post("/offer-engine/variants", (req, res) => {
  const variant = offerOptimizationEngine.createVariant(req.body);
  res.json({
    success: true,
    message: "New variant created",
    variant
  });
});

router.post("/offer-engine/variants/:id/metrics", (req, res) => {
  const { id } = req.params;
  offerOptimizationEngine.updateVariantMetrics(id, req.body);
  res.json({ success: true, message: `Variant ${id} metrics updated` });
});

router.post("/offer-engine/engagement", (req, res) => {
  offerOptimizationEngine.updateEngagementData(req.body);
  res.json({ success: true, message: "Engagement data updated" });
});

router.get("/offer-engine/dashboard", (req, res) => {
  res.json(offerOptimizationEngine.getCosDashboardData());
});

// ==========================================
// COMPLIANCE INTELLIGENCE REPORTS ENDPOINTS
// ==========================================

router.get("/intel-reports/status", (req, res) => {
  res.json(complianceIntelligenceReports.getStatus());
});

router.get("/intel-reports/latest", (req, res) => {
  const report = complianceIntelligenceReports.getLatestReport();
  if (!report) {
    return res.status(404).json({ error: "No report available. Activate the capability first." });
  }
  res.json(report);
});

router.post("/intel-reports/generate", (req, res) => {
  const report = complianceIntelligenceReports.generateMonthlyReport();
  res.json({
    success: true,
    message: "Monthly intelligence report generated",
    report
  });
});

router.get("/intel-reports/assets", (req, res) => {
  const reportId = req.query.reportId as string | undefined;
  res.json(complianceIntelligenceReports.getContentAssets(reportId));
});

router.get("/intel-reports/revenue", (req, res) => {
  res.json(complianceIntelligenceReports.getRevenueMetrics());
});

router.get("/intel-reports/dashboard", (req, res) => {
  res.json(complianceIntelligenceReports.getCosDashboardData());
});

// ==========================================
// 72-HOUR INTEGRATION SPRINT
// ==========================================

router.get("/integration-sprint", (req, res) => {
  const now = new Date();
  const sprintEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  res.json({
    title: "Advanced Capability Pack Integration Sprint",
    status: "active",
    startedAt: now.toISOString(),
    endsAt: sprintEnd.toISOString(),
    remainingHours: 72,
    odarAssignments: [
      {
        agent: "Strategist",
        task: "Configure revenue prediction forecasting logic with VQS-compliant bounds",
        deadline: "24 hours",
        status: "in_progress"
      },
      {
        agent: "Librarian",
        task: "Build Revenue Prediction Layer in Unified Data Layer with all signal sources",
        deadline: "24 hours",
        status: "in_progress"
      },
      {
        agent: "CRO",
        task: "Activate continuous A/B testing on all three offer tiers",
        deadline: "48 hours",
        status: "pending"
      },
      {
        agent: "CMO",
        task: "Feed LinkedIn/dark-social engagement data into Unified Data Layer",
        deadline: "48 hours",
        status: "pending"
      },
      {
        agent: "Content Manager",
        task: "Generate first monthly compliance intelligence report and content assets",
        deadline: "72 hours",
        status: "pending"
      }
    ],
    integrationChecklist: [
      { item: "Unified Data Layer connection", status: "complete" },
      { item: "VQS-compliant metrics validation", status: "complete" },
      { item: "Weekly Revenue Sprint integration", status: "complete" },
      { item: "CoS Dashboard panels", status: "in_progress" },
      { item: "Objection Intelligence Loop hookup", status: "pending" },
      { item: "L5 maturity tracking update", status: "pending" }
    ],
    successCriteria: [
      "24-hour risk-adjusted revenue forecast published",
      "At least 1 high-performing offer variant identified per week",
      "Monthly intelligence report + content assets generated",
      "All capabilities visible on CoS Dashboard"
    ]
  });
});

export const advancedCapabilitiesRouter = router;
