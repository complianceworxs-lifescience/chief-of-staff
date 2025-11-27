/**
 * L6 DUAL REPORT PACKAGE API ROUTES
 * 
 * DELIVERABLE: L6_DUAL_REPORT_PACKAGE_v1.0
 * DELIVERY TARGET: Architect
 */

import { Router, Request, Response } from 'express';
import { l6DualReportPackage } from '../services/l6-dual-report-package';

const router = Router();

/**
 * POST /api/l6-dual-package/generate
 * Generate the complete L6 Dual Report Package
 */
router.post('/generate', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can generate L6 Dual Report Package',
      requiredAuthority: 'Architect'
    });
  }

  try {
    console.log('[API] Architect requested L6 Dual Report Package generation');
    
    const pkg = l6DualReportPackage.generatePackage();
    
    res.json({
      success: true,
      message: 'L6 DUAL REPORT PACKAGE GENERATED',
      deliveryTarget: 'Architect',
      deliveredWithin24Hours: true,
      
      package: {
        packageId: pkg.packageId,
        packageVersion: pkg.packageVersion,
        generatedAt: pkg.generatedAt,
        deliveryDeadline: pkg.deliveryDeadline,
        
        executiveSummary: pkg.executiveSummary,
        
        component1_Readiness: {
          reportId: pkg.component1_Readiness.reportId,
          status: pkg.component1_Readiness.overallStatus,
          readinessScore: `${pkg.component1_Readiness.readinessScore}%`,
          thresholds: pkg.component1_Readiness.thresholds,
          failingThresholds: pkg.component1_Readiness.failingThresholds,
          primaryBlocker: pkg.component1_Readiness.primaryBlocker,
          prescription: pkg.component1_Readiness.prescription
        },
        
        component2_Sandbox: {
          reportId: pkg.component2_Sandbox.reportId,
          stressTestSummary: pkg.component2_Sandbox.stressTestSummary,
          failureSummary: pkg.component2_Sandbox.failureSummary,
          riskMap: pkg.component2_Sandbox.riskMap,
          revenueCurves: pkg.component2_Sandbox.revenueCurves,
          criticalFailures: pkg.component2_Sandbox.criticalFailures
        },
        
        unifiedAnalysis: pkg.unifiedAnalysis,
        architectDecision: pkg.architectDecision,
        safetyConfirmation: pkg.safetyConfirmation
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Package generation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/l6-dual-package/status
 * Get current package status
 */
router.get('/status', (req: Request, res: Response) => {
  const pkg = l6DualReportPackage.getCurrentPackage();
  
  if (!pkg) {
    return res.json({
      generated: false,
      message: 'No L6 Dual Report Package has been generated',
      hint: 'POST /api/l6-dual-package/generate with Architect authorization'
    });
  }

  res.json({
    generated: true,
    packageId: pkg.packageId,
    generatedAt: pkg.generatedAt,
    deliveryDeadline: pkg.deliveryDeadline,
    l6Status: pkg.executiveSummary.l6Status,
    verdict: pkg.architectDecision.verdict,
    criticalBlockers: pkg.executiveSummary.criticalBlockerCount
  });
});

/**
 * GET /api/l6-dual-package/executive-summary
 * Get executive summary only
 */
router.get('/executive-summary', (req: Request, res: Response) => {
  const summary = l6DualReportPackage.getExecutiveSummary();
  
  if (!summary) {
    return res.json({
      generated: false,
      executiveSummary: null
    });
  }

  res.json({
    generated: true,
    executiveSummary: summary
  });
});

/**
 * GET /api/l6-dual-package/decision
 * Get Architect decision only
 */
router.get('/decision', (req: Request, res: Response) => {
  const decision = l6DualReportPackage.getArchitectDecision();
  
  if (!decision) {
    return res.json({
      generated: false,
      decision: null
    });
  }

  res.json({
    generated: true,
    architectDecision: decision
  });
});

/**
 * GET /api/l6-dual-package/components
 * Get both component summaries
 */
router.get('/components', (req: Request, res: Response) => {
  const pkg = l6DualReportPackage.getCurrentPackage();
  
  if (!pkg) {
    return res.json({
      generated: false,
      components: null
    });
  }

  res.json({
    generated: true,
    components: {
      readiness: {
        reportId: pkg.component1_Readiness.reportId,
        status: pkg.component1_Readiness.overallStatus,
        score: `${pkg.component1_Readiness.readinessScore}%`
      },
      sandbox: {
        reportId: pkg.component2_Sandbox.reportId,
        risk: pkg.component2_Sandbox.riskMap.overallRisk,
        failureRate: pkg.component2_Sandbox.failureSummary.failureRate
      }
    }
  });
});

/**
 * GET /api/l6-dual-package/blockers
 * Get consolidated blockers
 */
router.get('/blockers', (req: Request, res: Response) => {
  const pkg = l6DualReportPackage.getCurrentPackage();
  
  if (!pkg) {
    return res.json({
      generated: false,
      blockers: []
    });
  }

  res.json({
    generated: true,
    consolidatedBlockers: pkg.unifiedAnalysis.consolidatedBlockers
  });
});

/**
 * GET /api/l6-dual-package/risk-assessment
 * Get risk assessment
 */
router.get('/risk-assessment', (req: Request, res: Response) => {
  const pkg = l6DualReportPackage.getCurrentPackage();
  
  if (!pkg) {
    return res.json({
      generated: false,
      riskAssessment: null
    });
  }

  res.json({
    generated: true,
    riskAssessment: pkg.unifiedAnalysis.riskAssessment
  });
});

/**
 * GET /api/l6-dual-package/immediate-actions
 * Get immediate actions required
 */
router.get('/immediate-actions', (req: Request, res: Response) => {
  const pkg = l6DualReportPackage.getCurrentPackage();
  
  if (!pkg) {
    return res.json({
      generated: false,
      actions: []
    });
  }

  res.json({
    generated: true,
    verdict: pkg.architectDecision.verdict,
    immediateActions: pkg.architectDecision.immediateActions,
    nextReviewDate: pkg.architectDecision.nextReviewDate
  });
});

/**
 * GET /api/l6-dual-package/history
 * Get package generation history
 */
router.get('/history', (req: Request, res: Response) => {
  const history = l6DualReportPackage.getPackageHistory();
  
  res.json({
    totalPackages: history.length,
    packages: history.map(h => ({
      packageId: h.packageId,
      generatedAt: h.generatedAt,
      l6Status: h.executiveSummary.l6Status,
      verdict: h.architectDecision.verdict,
      criticalBlockers: h.executiveSummary.criticalBlockerCount
    }))
  });
});

export default router;
