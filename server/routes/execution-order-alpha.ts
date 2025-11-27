/**
 * EXECUTION ORDER: ALPHA (CASH CASCADE) API ROUTES
 * 
 * Endpoints for managing the Cash Cascade execution order
 */

import { Router, Request, Response } from 'express';
import { executionOrderAlpha } from '../services/execution-order-alpha';

const router = Router();

// ============================================================================
// INITIATION & STATUS
// ============================================================================

/**
 * POST /api/execution-order/initiate
 * Initiate EXECUTION ORDER: ALPHA (CASH CASCADE)
 */
router.post('/initiate', (req: Request, res: Response) => {
  const order = executionOrderAlpha.initiate();
  
  res.json({
    success: true,
    message: 'EXECUTION ORDER: ALPHA (CASH CASCADE) initiated',
    order
  });
});

/**
 * GET /api/execution-order/status
 * Get current execution order status
 */
router.get('/status', (req: Request, res: Response) => {
  const order = executionOrderAlpha.getStatus();
  
  if (!order) {
    return res.json({
      initiated: false,
      message: 'No execution order active. POST /api/execution-order/initiate to start.'
    });
  }
  
  res.json({
    initiated: true,
    order
  });
});

/**
 * GET /api/execution-order/dashboard
 * Get execution dashboard with all metrics
 */
router.get('/dashboard', (req: Request, res: Response) => {
  const dashboard = executionOrderAlpha.getDashboard();
  
  res.json({
    directive: 'EXECUTION ORDER: ALPHA (CASH CASCADE)',
    ...dashboard
  });
});

// ============================================================================
// CORRECTIONS
// ============================================================================

/**
 * POST /api/execution-order/correct
 * Apply P2 → P1 correction for a deal
 */
router.post('/correct', (req: Request, res: Response) => {
  const { dealId, description, estimatedValue } = req.body;
  
  if (!dealId || !description || estimatedValue === undefined) {
    return res.status(400).json({
      error: 'MISSING_PARAMS',
      message: 'dealId, description, and estimatedValue are required'
    });
  }
  
  const result = executionOrderAlpha.applyCorrection(dealId, description, estimatedValue);
  
  res.json({
    success: result.success,
    correction: result.correction,
    deal: result.deal
  });
});

// ============================================================================
// DEAL MANAGEMENT
// ============================================================================

/**
 * POST /api/execution-order/close
 * Record a deal closure
 */
router.post('/close', (req: Request, res: Response) => {
  const { dealId, closedValue } = req.body;
  
  if (!dealId || closedValue === undefined) {
    return res.status(400).json({
      error: 'MISSING_PARAMS',
      message: 'dealId and closedValue are required'
    });
  }
  
  const result = executionOrderAlpha.closeDeal(dealId, closedValue);
  
  if (result.reportDue) {
    res.json({
      success: true,
      deal: result.deal,
      phaseComplete: result.phaseComplete,
      reportDue: true,
      message: '⚠️ PHASE 1 COMPLETE - IMMEDIATE REPORTING REQUIRED',
      phase1Report: executionOrderAlpha.getPhase1Report()
    });
  } else {
    res.json({
      success: result.success,
      deal: result.deal,
      phaseComplete: result.phaseComplete
    });
  }
});

/**
 * POST /api/execution-order/blocker
 * Update signature blocker for anchor deals
 */
router.post('/blocker', (req: Request, res: Response) => {
  const { dealId, blocker, removalTactic } = req.body;
  
  if (!dealId || !blocker || !removalTactic) {
    return res.status(400).json({
      error: 'MISSING_PARAMS',
      message: 'dealId, blocker, and removalTactic are required'
    });
  }
  
  const result = executionOrderAlpha.updateSignatureBlocker(dealId, blocker, removalTactic);
  
  res.json({
    success: result.success,
    deal: result.deal
  });
});

/**
 * GET /api/execution-order/tactical/:dealId
 * Get tactical directive for a specific deal
 */
router.get('/tactical/:dealId', (req: Request, res: Response) => {
  const { dealId } = req.params;
  
  const directive = executionOrderAlpha.getTacticalDirective(dealId);
  
  if (!directive) {
    return res.status(404).json({
      error: 'DEAL_NOT_FOUND',
      message: `Deal ${dealId} not found in execution order`
    });
  }
  
  res.json({
    success: true,
    directive
  });
});

// ============================================================================
// PHASE REPORTS
// ============================================================================

/**
 * GET /api/execution-order/phase1-report
 * Get Phase 1 Liquidity Sprint report
 */
router.get('/phase1-report', (req: Request, res: Response) => {
  const report = executionOrderAlpha.getPhase1Report();
  
  if (!report) {
    return res.json({
      initiated: false,
      message: 'Execution order not active'
    });
  }
  
  res.json({
    phase: 'PHASE 1: LIQUIDITY SPRINT',
    target: '$12,000 in 24 hours',
    ...report
  });
});

export default router;
