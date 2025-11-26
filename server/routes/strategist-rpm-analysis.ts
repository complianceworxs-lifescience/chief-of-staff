/**
 * STRATEGIST RPM ADVERSARIAL ANALYSIS API ROUTES
 * 
 * Endpoints for Architect-directed RPM confidence diagnosis.
 * Delivers exactly 4 components: rootCause, confidenceDeltaExplanation, 
 * singleRestorativeAction, projection24h
 */

import { Router, Request, Response } from 'express';
import { strategistRpmAnalysis } from '../services/strategist-rpm-analysis';

const router = Router();

/**
 * POST /api/strategist-analysis/execute
 * Execute adversarial analysis (Architect directive only)
 * HALTS all non-critical Strategist tasks and enters diagnostic mode
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
    console.log('[API] Architect directive received: major_correction_request_to_strategist_rpm_collapse');
    
    const report = strategistRpmAnalysis.executeAdversarialAnalysis();
    
    res.json({
      success: true,
      message: 'STRATEGIST ADVERSARIAL ANALYSIS COMPLETE',
      directive: directive || 'major_correction_request_to_strategist_rpm_collapse',
      
      // THE 4 REQUIRED COMPONENTS
      report: {
        analysisId: report.analysisId,
        executedBy: report.executedBy,
        timestamp: report.timestamp,
        
        rootCause: report.rootCause,
        confidenceDeltaExplanation: report.confidenceDeltaExplanation,
        singleRestorativeAction: report.singleRestorativeAction,
        projection24h: report.projection24h,
        
        safety: report.safety
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
 * Get current analysis status and Strategist mode
 */
router.get('/status', (req: Request, res: Response) => {
  const status = strategistRpmAnalysis.getAnalysisStatus();
  const state = strategistRpmAnalysis.getState();
  
  if (!status) {
    return res.json({
      active: false,
      mode: state.mode,
      message: 'No adversarial analysis has been executed',
      hint: 'POST /api/strategist-analysis/execute with Architect authorization to initiate'
    });
  }

  res.json({
    active: true,
    mode: state.mode,
    haltedTasks: state.haltedTasks,
    analysisId: status.analysisId,
    timestamp: status.timestamp,
    rootCauseSource: status.rootCause.source,
    projectedRpm: `${(status.projection24h.projectedRpm * 100).toFixed(0)}%`
  });
});

/**
 * GET /api/strategist-analysis/architect-report
 * Get the full Architect-formatted report (4 components)
 */
router.get('/architect-report', (req: Request, res: Response) => {
  const summary = strategistRpmAnalysis.getArchitectSummary();
  res.json(summary);
});

/**
 * GET /api/strategist-analysis/root-cause
 * Get root cause component only
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
    analysisId: status.analysisId,
    rootCause: status.rootCause
  });
});

/**
 * GET /api/strategist-analysis/confidence-delta
 * Get confidence delta explanation component only
 */
router.get('/confidence-delta', (req: Request, res: Response) => {
  const status = strategistRpmAnalysis.getAnalysisStatus();
  
  if (!status) {
    return res.json({
      active: false,
      confidenceDelta: null
    });
  }

  res.json({
    active: true,
    analysisId: status.analysisId,
    confidenceDeltaExplanation: status.confidenceDeltaExplanation
  });
});

/**
 * GET /api/strategist-analysis/restorative-action
 * Get single restorative action component only
 */
router.get('/restorative-action', (req: Request, res: Response) => {
  const status = strategistRpmAnalysis.getAnalysisStatus();
  
  if (!status) {
    return res.json({
      active: false,
      restorativeAction: null
    });
  }

  res.json({
    active: true,
    analysisId: status.analysisId,
    singleRestorativeAction: status.singleRestorativeAction
  });
});

/**
 * GET /api/strategist-analysis/projection
 * Get 24h RPM projection component only
 */
router.get('/projection', (req: Request, res: Response) => {
  const status = strategistRpmAnalysis.getAnalysisStatus();
  
  if (!status) {
    return res.json({
      active: false,
      projection: null
    });
  }

  const now = new Date();
  const milestones = status.projection24h.milestones.map(m => {
    const targetTime = new Date(new Date(status.timestamp).getTime() + m.hour * 60 * 60 * 1000);
    return {
      ...m,
      targetTime: targetTime.toISOString(),
      status: now >= targetTime ? 'due' : 'pending'
    };
  });

  res.json({
    active: true,
    analysisId: status.analysisId,
    currentRpm: `${(status.projection24h.currentRpm * 100).toFixed(0)}%`,
    projectedRpm: `${(status.projection24h.projectedRpm * 100).toFixed(0)}%`,
    confidenceInProjection: `${status.projection24h.confidenceInProjection}%`,
    milestones
  });
});

/**
 * POST /api/strategist-analysis/resume
 * Resume normal Strategist operations after diagnostic complete
 */
router.post('/resume', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect' && authorization !== 'CoS') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect or CoS can resume Strategist operations'
    });
  }

  strategistRpmAnalysis.resumeNormalOperations();
  const state = strategistRpmAnalysis.getState();

  res.json({
    success: true,
    message: 'Strategist operations resumed',
    mode: state.mode,
    resumedBy: authorization
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
      analysisId: h.analysisId,
      timestamp: h.timestamp,
      rootCauseSource: h.rootCause.source,
      projectedRpm: `${(h.projection24h.projectedRpm * 100).toFixed(0)}%`
    }))
  });
});

export default router;
