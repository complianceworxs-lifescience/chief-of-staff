/**
 * STRATEGIST RPM ADVERSARIAL ANALYSIS API ROUTES
 * 
 * Endpoints for Architect-directed RPM confidence diagnosis.
 */

import { Router, Request, Response } from 'express';
import { strategistRpmAnalysis } from '../services/strategist-rpm-analysis';

const router = Router();

/**
 * POST /api/strategist-analysis/execute
 * Execute adversarial analysis (Architect directive only)
 */
router.post('/execute', (req: Request, res: Response) => {
  const { authorization, directive } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can direct adversarial analysis',
      requiredAuthority: 'Architect'
    });
  }

  try {
    console.log('[API] Architect directive received: major_correction_request_to_strategist');
    
    const report = strategistRpmAnalysis.executeAdversarialAnalysis();
    
    res.json({
      success: true,
      message: 'STRATEGIST ADVERSARIAL ANALYSIS COMPLETE',
      directive: directive || 'Diagnose RPM confidence collapse and provide intervention',
      report: {
        id: report.id,
        status: report.status,
        executedBy: report.executedBy,
        completionTime: report.completionTime,
        
        diagnosis: {
          rpmBefore: `${(report.rpmBefore * 100).toFixed(0)}%`,
          rpmAfter: `${(report.rpmAfter * 100).toFixed(0)}%`,
          rpmDrop: `${(report.rpmDrop * 100).toFixed(0)}%`,
          udlSyncStatus: report.udlSyncStatus
        },
        
        rootCause: {
          primary: report.rootCauseAnalysis.primaryCause,
          confidence: `${report.rootCauseAnalysis.confidence}%`,
          internalCorruptionShare: `${report.rootCauseAnalysis.internalCorruptionScore}%`,
          externalFactorShare: `${report.rootCauseAnalysis.externalFactorScore}%`,
          topContributors: report.rootCauseAnalysis.topContributors
        },
        
        intervention: report.recommendedIntervention,
        
        restorationTimeline: {
          deadline: report.restorationDeadline,
          milestones: report.milestones
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Analysis execution failed',
      message: error.message
    });
  }
});

/**
 * GET /api/strategist-analysis/status
 * Get current analysis status
 */
router.get('/status', (req: Request, res: Response) => {
  const status = strategistRpmAnalysis.getAnalysisStatus();
  
  if (!status) {
    return res.json({
      active: false,
      message: 'No adversarial analysis has been executed',
      hint: 'POST /api/strategist-analysis/execute with Architect authorization to initiate'
    });
  }

  res.json({
    active: true,
    analysisId: status.id,
    status: status.status,
    executedBy: status.executedBy,
    startTime: status.startTime,
    completionTime: status.completionTime,
    rpmDrop: `${(status.rpmDrop * 100).toFixed(0)}%`,
    rootCause: status.rootCauseAnalysis.primaryCause,
    interventionAction: status.recommendedIntervention.action.substring(0, 100) + '...'
  });
});

/**
 * GET /api/strategist-analysis/architect-summary
 * Get summary formatted for Architect consumption
 */
router.get('/architect-summary', (req: Request, res: Response) => {
  const summary = strategistRpmAnalysis.getArchitectSummary();
  res.json(summary);
});

/**
 * GET /api/strategist-analysis/root-cause
 * Get detailed root cause analysis
 */
router.get('/root-cause', (req: Request, res: Response) => {
  const status = strategistRpmAnalysis.getAnalysisStatus();
  
  if (!status) {
    return res.json({
      active: false,
      rootCause: null
    });
  }

  res.json({
    active: true,
    analysisId: status.id,
    rootCauseAnalysis: status.rootCauseAnalysis,
    internalIndicators: status.internalCorruptionIndicators.filter(i => i.detected),
    externalIndicators: status.externalFactorIndicators.filter(i => i.detected)
  });
});

/**
 * GET /api/strategist-analysis/intervention
 * Get recommended intervention details
 */
router.get('/intervention', (req: Request, res: Response) => {
  const status = strategistRpmAnalysis.getAnalysisStatus();
  
  if (!status) {
    return res.json({
      active: false,
      intervention: null
    });
  }

  res.json({
    active: true,
    analysisId: status.id,
    recommendedIntervention: status.recommendedIntervention,
    alternatives: status.alternativeInterventions,
    restorationDeadline: status.restorationDeadline,
    milestones: status.milestones
  });
});

/**
 * GET /api/strategist-analysis/milestones
 * Get restoration milestones
 */
router.get('/milestones', (req: Request, res: Response) => {
  const status = strategistRpmAnalysis.getAnalysisStatus();
  
  if (!status) {
    return res.json({
      active: false,
      milestones: []
    });
  }

  const now = new Date();
  const milestonesWithStatus = status.milestones.map(m => ({
    ...m,
    status: new Date(m.time) < now ? 'due' : 'pending',
    hoursRemaining: Math.max(0, (new Date(m.time).getTime() - now.getTime()) / (1000 * 60 * 60))
  }));

  res.json({
    active: true,
    restorationDeadline: status.restorationDeadline,
    hoursToDeadline: Math.max(0, (new Date(status.restorationDeadline).getTime() - now.getTime()) / (1000 * 60 * 60)),
    milestones: milestonesWithStatus
  });
});

/**
 * GET /api/strategist-analysis/history
 * Get analysis history
 */
router.get('/history', (req: Request, res: Response) => {
  const history = strategistRpmAnalysis.getHistory();
  
  res.json({
    totalAnalyses: history.length,
    analyses: history.map(h => ({
      id: h.id,
      executedBy: h.executedBy,
      startTime: h.startTime,
      completionTime: h.completionTime,
      status: h.status,
      rpmDrop: `${(h.rpmDrop * 100).toFixed(0)}%`,
      rootCause: h.rootCauseAnalysis.primaryCause,
      interventionSuccess: h.recommendedIntervention.confidenceOfSuccess
    }))
  });
});

/**
 * GET /api/strategist-analysis/all-indicators
 * Get all diagnostic indicators (detected and not detected)
 */
router.get('/all-indicators', (req: Request, res: Response) => {
  const status = strategistRpmAnalysis.getAnalysisStatus();
  
  if (!status) {
    return res.json({
      active: false,
      indicators: null
    });
  }

  res.json({
    active: true,
    analysisId: status.id,
    internalCorruption: {
      total: status.internalCorruptionIndicators.length,
      detected: status.internalCorruptionIndicators.filter(i => i.detected).length,
      indicators: status.internalCorruptionIndicators
    },
    externalFactors: {
      total: status.externalFactorIndicators.length,
      detected: status.externalFactorIndicators.filter(i => i.detected).length,
      indicators: status.externalFactorIndicators
    }
  });
});

export default router;
