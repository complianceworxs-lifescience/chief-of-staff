/**
 * L6 SANDBOX SIMULATION API ROUTES
 * 
 * ARCHITECT DIRECTIVE: RUN_L6_SANDBOX_SIMULATION
 * Scope: Simulation-only, NO live changes
 */

import { Router, Request, Response } from 'express';
import { l6SandboxSimulation } from '../services/l6-sandbox-simulation';

const router = Router();

/**
 * POST /api/l6-sandbox/run
 * Run the full L6 Sandbox Simulation
 */
router.post('/run', (req: Request, res: Response) => {
  const { authorization, directiveId } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can run L6 Sandbox Simulation',
      requiredAuthority: 'Architect'
    });
  }

  try {
    console.log(`[API] Architect directive received: ${directiveId || 'RUN_L6_SANDBOX_SIMULATION'}`);
    
    const report = l6SandboxSimulation.runSimulation();
    
    res.json({
      success: true,
      message: 'L6 SANDBOX SIMULATION COMPLETE',
      directiveId: directiveId || 'RUN_L6_SANDBOX_SIMULATION',
      safetyNote: 'NO LIVE CHANGES APPLIED - Simulation only',
      
      report: {
        reportId: report.reportId,
        timestamp: report.timestamp,
        duration: `${report.duration}ms`,
        
        stressTestSummary: report.stressTests.map(t => ({
          capability: t.capability,
          displayName: t.displayName,
          result: t.result,
          confidence: `${t.confidence.toFixed(0)}%`,
          failures: t.failedActions,
          riskLevel: t.riskLevel
        })),
        
        failureSummary: {
          totalSimulatedActions: report.totalSimulatedActions,
          totalFailures: report.totalFailures,
          failureRate: `${report.failureRate.toFixed(1)}%`
        },
        
        l6RiskMap: {
          overallRisk: report.l6RiskMap.overallRisk,
          riskScore: report.l6RiskMap.riskScore,
          safetyMargin: report.l6RiskMap.safetyMargin
        },
        
        revenueCurves: {
          sevenDay: report.revenueCurves.sevenDay.summary,
          fourteenDay: report.revenueCurves.fourteenDay.summary
        },
        
        architectRecommendation: report.architectRecommendation,
        
        safetyConfirmation: report.safetyConfirmation
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Simulation execution failed',
      message: error.message
    });
  }
});

/**
 * GET /api/l6-sandbox/status
 * Get current simulation status
 */
router.get('/status', (req: Request, res: Response) => {
  const report = l6SandboxSimulation.getCurrentReport();
  
  if (!report) {
    return res.json({
      active: false,
      message: 'No L6 sandbox simulation has been run',
      hint: 'POST /api/l6-sandbox/run with Architect authorization'
    });
  }

  res.json({
    active: true,
    reportId: report.reportId,
    timestamp: report.timestamp,
    verdict: report.architectRecommendation.verdict,
    riskLevel: report.l6RiskMap.overallRisk,
    failureRate: `${report.failureRate.toFixed(1)}%`,
    criticalBlockers: report.architectRecommendation.criticalBlockers.length
  });
});

/**
 * GET /api/l6-sandbox/stress-tests
 * Get all stress test results
 */
router.get('/stress-tests', (req: Request, res: Response) => {
  const report = l6SandboxSimulation.getCurrentReport();
  
  if (!report) {
    return res.json({
      active: false,
      stressTests: []
    });
  }

  res.json({
    active: true,
    reportId: report.reportId,
    stressTests: report.stressTests
  });
});

/**
 * GET /api/l6-sandbox/risk-map
 * Get the L6 Risk Map
 */
router.get('/risk-map', (req: Request, res: Response) => {
  const riskMap = l6SandboxSimulation.getRiskMap();
  
  if (!riskMap) {
    return res.json({
      active: false,
      riskMap: null
    });
  }

  res.json({
    active: true,
    riskMap
  });
});

/**
 * GET /api/l6-sandbox/revenue-curves
 * Get Predictive Revenue Curves
 */
router.get('/revenue-curves', (req: Request, res: Response) => {
  const curves = l6SandboxSimulation.getRevenueCurves();
  
  if (!curves) {
    return res.json({
      active: false,
      revenueCurves: null
    });
  }

  res.json({
    active: true,
    revenueCurves: curves
  });
});

/**
 * GET /api/l6-sandbox/revenue-curves/:timeframe
 * Get specific revenue curve (7-day or 14-day)
 */
router.get('/revenue-curves/:timeframe', (req: Request, res: Response) => {
  const { timeframe } = req.params;
  const curves = l6SandboxSimulation.getRevenueCurves();
  
  if (!curves) {
    return res.json({
      active: false,
      curve: null
    });
  }

  if (timeframe === '7-day') {
    res.json({ active: true, curve: curves.sevenDay });
  } else if (timeframe === '14-day') {
    res.json({ active: true, curve: curves.fourteenDay });
  } else {
    res.status(400).json({
      error: 'Invalid timeframe',
      validOptions: ['7-day', '14-day']
    });
  }
});

/**
 * GET /api/l6-sandbox/recommendation
 * Get Architect Recommendation
 */
router.get('/recommendation', (req: Request, res: Response) => {
  const recommendation = l6SandboxSimulation.getArchitectRecommendation();
  
  if (!recommendation) {
    return res.json({
      active: false,
      recommendation: null
    });
  }

  res.json({
    active: true,
    recommendation
  });
});

/**
 * GET /api/l6-sandbox/failures
 * Get all simulation failures
 */
router.get('/failures', (req: Request, res: Response) => {
  const failures = l6SandboxSimulation.getAllFailures();
  
  res.json({
    count: failures.length,
    failures: failures.map(f => ({
      failureId: f.failureId,
      capability: f.capability,
      type: f.type,
      severity: f.severity,
      description: f.description,
      rootCause: f.rootCause,
      mitigationPath: f.mitigationPath
    }))
  });
});

/**
 * GET /api/l6-sandbox/failures/critical
 * Get only critical failures
 */
router.get('/failures/critical', (req: Request, res: Response) => {
  const failures = l6SandboxSimulation.getAllFailures()
    .filter(f => f.severity === 'critical');
  
  res.json({
    count: failures.length,
    criticalFailures: failures
  });
});

/**
 * GET /api/l6-sandbox/history
 * Get simulation history
 */
router.get('/history', (req: Request, res: Response) => {
  const history = l6SandboxSimulation.getHistory();
  
  res.json({
    totalSimulations: history.length,
    simulations: history.map(h => ({
      reportId: h.reportId,
      timestamp: h.timestamp,
      verdict: h.architectRecommendation.verdict,
      riskLevel: h.l6RiskMap.overallRisk,
      failureRate: `${h.failureRate.toFixed(1)}%`
    }))
  });
});

export default router;
