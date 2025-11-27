/**
 * L6 READINESS DIAGNOSTIC API ROUTES
 * 
 * ARCHITECT DIRECTIVE: ARCHITECT_L6_DOUBLE_EXEC_v1.0
 * 
 * Endpoints for full-system L6 readiness diagnostic.
 * Strategist (lead) + CoS (coordination)
 */

import { Router, Request, Response } from 'express';
import { l6ReadinessDiagnostic } from '../services/l6-readiness-diagnostic';

const router = Router();

/**
 * POST /api/l6-readiness/run-diagnostic
 * Execute the full L6 Readiness Diagnostic per Architect directive
 */
router.post('/run-diagnostic', (req: Request, res: Response) => {
  const { authorization, directiveId } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can run L6 Readiness Diagnostic',
      requiredAuthority: 'Architect'
    });
  }

  try {
    console.log(`[API] Architect directive received: ${directiveId || 'ARCHITECT_L6_DOUBLE_EXEC_v1.0'}`);
    
    const report = l6ReadinessDiagnostic.runDiagnostic();
    
    res.json({
      success: true,
      message: 'L6 READINESS DIAGNOSTIC COMPLETE',
      directiveId: directiveId || 'ARCHITECT_L6_DOUBLE_EXEC_v1.0',
      
      report: {
        reportId: report.reportId,
        timestamp: report.timestamp,
        deadline: report.deadline,
        
        overallReadiness: report.overallReadiness,
        
        thresholds: report.thresholds.map(t => ({
          threshold: t.threshold,
          displayName: t.displayName,
          status: t.status,
          currentValue: t.currentValue,
          targetValue: t.targetValue,
          gap: t.gap,
          confidence: t.confidence,
          rootCauseContribution: t.rootCauseContribution
        })),
        
        failureClusters: report.failureClusters,
        primaryBlocker: report.primaryBlocker,
        architectPrescription: report.architectPrescription,
        sandboxSimulation: report.sandboxSimulation,
        safetyConfirmation: report.safetyConfirmation
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Diagnostic execution failed',
      message: error.message
    });
  }
});

/**
 * GET /api/l6-readiness/status
 * Get current L6 readiness status
 */
router.get('/status', (req: Request, res: Response) => {
  const report = l6ReadinessDiagnostic.getCurrentReport();
  
  if (!report) {
    return res.json({
      active: false,
      message: 'No L6 readiness diagnostic has been run',
      hint: 'POST /api/l6-readiness/run-diagnostic with Architect authorization'
    });
  }

  res.json({
    active: true,
    reportId: report.reportId,
    timestamp: report.timestamp,
    overallStatus: report.overallReadiness.status,
    readinessScore: `${report.overallReadiness.score.toFixed(0)}%`,
    passingThresholds: report.overallReadiness.passingThresholds,
    failingThresholds: report.overallReadiness.failingThresholds,
    primaryBlocker: report.primaryBlocker.threshold,
    timeToL6Unlock: report.architectPrescription.timeToL6Unlock
  });
});

/**
 * GET /api/l6-readiness/architect-summary
 * Get Architect-formatted summary
 */
router.get('/architect-summary', (req: Request, res: Response) => {
  const summary = l6ReadinessDiagnostic.getArchitectSummary();
  res.json(summary);
});

/**
 * GET /api/l6-readiness/thresholds
 * Get all 5 threshold diagnostics
 */
router.get('/thresholds', (req: Request, res: Response) => {
  const report = l6ReadinessDiagnostic.getCurrentReport();
  
  if (!report) {
    return res.json({
      active: false,
      thresholds: []
    });
  }

  res.json({
    active: true,
    reportId: report.reportId,
    thresholds: report.thresholds
  });
});

/**
 * GET /api/l6-readiness/failing-thresholds
 * Get only failing thresholds
 */
router.get('/failing-thresholds', (req: Request, res: Response) => {
  const failingThresholds = l6ReadinessDiagnostic.getFailingThresholds();
  
  res.json({
    count: failingThresholds.length,
    failingThresholds: failingThresholds.map(t => ({
      threshold: t.threshold,
      displayName: t.displayName,
      status: t.status,
      currentValue: t.currentValue,
      targetValue: t.targetValue,
      gap: t.gap,
      confidence: t.confidence,
      correctionPath: t.correctionPath,
      timeToRemediation: t.timeToRemediation
    }))
  });
});

/**
 * GET /api/l6-readiness/primary-blocker
 * Get the primary blocker to L6 readiness
 */
router.get('/primary-blocker', (req: Request, res: Response) => {
  const report = l6ReadinessDiagnostic.getCurrentReport();
  
  if (!report) {
    return res.json({
      active: false,
      primaryBlocker: null
    });
  }

  res.json({
    active: true,
    reportId: report.reportId,
    primaryBlocker: report.primaryBlocker
  });
});

/**
 * GET /api/l6-readiness/prescription
 * Get the Architect prescription (single action to unlock L6)
 */
router.get('/prescription', (req: Request, res: Response) => {
  const report = l6ReadinessDiagnostic.getCurrentReport();
  
  if (!report) {
    return res.json({
      active: false,
      prescription: null
    });
  }

  res.json({
    active: true,
    reportId: report.reportId,
    prescription: report.architectPrescription
  });
});

/**
 * GET /api/l6-readiness/sandbox-simulation
 * Get sandbox simulation results
 */
router.get('/sandbox-simulation', (req: Request, res: Response) => {
  const report = l6ReadinessDiagnostic.getCurrentReport();
  
  if (!report) {
    return res.json({
      active: false,
      sandbox: null
    });
  }

  res.json({
    active: true,
    reportId: report.reportId,
    sandboxSimulation: report.sandboxSimulation
  });
});

/**
 * GET /api/l6-readiness/failure-clusters
 * Get failure cluster analysis
 */
router.get('/failure-clusters', (req: Request, res: Response) => {
  const report = l6ReadinessDiagnostic.getCurrentReport();
  
  if (!report) {
    return res.json({
      active: false,
      clusters: []
    });
  }

  res.json({
    active: true,
    reportId: report.reportId,
    clusterCount: report.failureClusters.length,
    clusters: report.failureClusters
  });
});

/**
 * GET /api/l6-readiness/history
 * Get diagnostic history
 */
router.get('/history', (req: Request, res: Response) => {
  const history = l6ReadinessDiagnostic.getHistory();
  
  res.json({
    totalDiagnostics: history.length,
    diagnostics: history.map(h => ({
      reportId: h.reportId,
      timestamp: h.timestamp,
      overallStatus: h.overallReadiness.status,
      readinessScore: `${h.overallReadiness.score.toFixed(0)}%`,
      primaryBlocker: h.primaryBlocker.threshold
    }))
  });
});

export default router;
