/**
 * VQS REVENUE ACCELERATION PROTOCOL API ROUTES
 * 
 * L5-Safe revenue prioritization endpoints
 */

import { Router, Request, Response } from 'express';
import { vqsRevenueAcceleration } from '../services/vqs-revenue-acceleration';

const router = Router();

// ============================================================================
// STATUS & CONFIGURATION
// ============================================================================

/**
 * GET /api/vqs-acceleration/status
 * Get current VQS Revenue Acceleration protocol status
 */
router.get('/status', (req: Request, res: Response) => {
  const status = vqsRevenueAcceleration.getStatus();
  res.json({
    protocol: 'VQS_REVENUE_ACCELERATION',
    version: '1.0.0',
    level: 'L5-SAFE',
    ...status
  });
});

// ============================================================================
// TASK EVALUATION
// ============================================================================

/**
 * POST /api/vqs-acceleration/evaluate
 * Evaluate a task using VQS Revenue Acceleration weights
 */
router.post('/evaluate', (req: Request, res: Response) => {
  const { taskId, taskDescription, completionPercentage, estimatedHours } = req.body;
  
  if (!taskDescription) {
    return res.status(400).json({
      error: 'MISSING_TASK_DESCRIPTION',
      message: 'taskDescription is required'
    });
  }
  
  const evaluation = vqsRevenueAcceleration.evaluateTask(
    taskId || `task_${Date.now()}`,
    taskDescription,
    { completionPercentage, estimatedHours }
  );
  
  res.json({
    success: true,
    evaluation,
    actionRequired: evaluation.priority === 'EXECUTE_NOW' || evaluation.priority === 'EXECUTE_SOON'
  });
});

/**
 * GET /api/vqs-acceleration/evaluations
 * Get recent task evaluations
 */
router.get('/evaluations', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const evaluations = vqsRevenueAcceleration.getRecentEvaluations(limit);
  
  res.json({
    count: evaluations.length,
    evaluations
  });
});

// ============================================================================
// PIPELINE TRIAGE
// ============================================================================

/**
 * POST /api/vqs-acceleration/pipeline/triage
 * Score buying intent for pipeline triage
 */
router.post('/pipeline/triage', (req: Request, res: Response) => {
  const { interaction } = req.body;
  
  if (!interaction) {
    return res.status(400).json({
      error: 'MISSING_INTERACTION',
      message: 'interaction text is required'
    });
  }
  
  const intentScore = vqsRevenueAcceleration.scorePipelineIntent(interaction);
  const conversionGuidance = vqsRevenueAcceleration.getConversionGuidance(interaction);
  
  res.json({
    success: true,
    intentScore,
    guidance: conversionGuidance,
    threshold: '>60% = PRIORITIZE, 40-60% = ENGAGE, <40% = AUTOMATE'
  });
});

// ============================================================================
// ASSET PRIORITIZATION
// ============================================================================

/**
 * POST /api/vqs-acceleration/assets/register
 * Register an asset in the work-in-progress pool
 */
router.post('/assets/register', (req: Request, res: Response) => {
  const { assetId, name, completionPercentage, monetizationType } = req.body;
  
  if (!name || completionPercentage === undefined) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'name and completionPercentage are required'
    });
  }
  
  const asset = vqsRevenueAcceleration.registerAsset(
    assetId || `asset_${Date.now()}`,
    name,
    completionPercentage,
    monetizationType || 'premium_deliverable'
  );
  
  vqsRevenueAcceleration.saveState();
  
  res.json({
    success: true,
    asset
  });
});

/**
 * GET /api/vqs-acceleration/assets/top3
 * Get top 3 monetizable assets for 80% compute allocation
 */
router.get('/assets/top3', (req: Request, res: Response) => {
  const top3 = vqsRevenueAcceleration.getTop3MonetizableAssets();
  
  res.json({
    directive: 'ASSET_POLISH',
    description: 'Allocate 80% of compute resources to finalizing these items',
    computeAllocation: {
      top1: '40%',
      top2: '25%',
      top3: '15%',
      other: '20%'
    },
    assets: top3
  });
});

// ============================================================================
// CONVERSION FOCUS
// ============================================================================

/**
 * POST /api/vqs-acceleration/conversion/guidance
 * Get conversion-focused guidance for an interaction
 */
router.post('/conversion/guidance', (req: Request, res: Response) => {
  const { context } = req.body;
  
  if (!context) {
    return res.status(400).json({
      error: 'MISSING_CONTEXT',
      message: 'context is required'
    });
  }
  
  const guidance = vqsRevenueAcceleration.getConversionGuidance(context);
  
  res.json({
    success: true,
    directive: 'CONVERSION_FOCUS',
    guidance,
    reminder: 'Always end interactions with a monetized path unless blocked by VQS governance'
  });
});

// ============================================================================
// TACTICAL SUMMARY
// ============================================================================

/**
 * GET /api/vqs-acceleration/tactical-summary
 * Get tactical summary of current revenue acceleration state
 */
router.get('/tactical-summary', (req: Request, res: Response) => {
  const status = vqsRevenueAcceleration.getStatus();
  const top3Assets = status.top3Assets;
  const recentEvals = vqsRevenueAcceleration.getRecentEvaluations(10);
  
  // Calculate summary stats
  const highPriorityTasks = recentEvals.filter(e => 
    e.priority === 'EXECUTE_NOW' || e.priority === 'EXECUTE_SOON'
  ).length;
  
  const avgCompositeScore = recentEvals.length > 0
    ? recentEvals.reduce((sum, e) => sum + e.compositeScore, 0) / recentEvals.length
    : 0;
  
  res.json({
    protocol: 'VQS_REVENUE_ACCELERATION',
    mode: 'L5-SAFE',
    
    weights: {
      value: '50% (Monetizable Value)',
      quality: '30% (Conversion Readiness)',
      speed: '20% (Time-to-Invoice)'
    },
    
    pipelineTriage: {
      threshold: '>60% buying intent = PRIORITIZE',
      lowIntent: 'Route to automation scripts'
    },
    
    assetPolish: {
      top3Assets: top3Assets.map(a => ({
        name: a.name,
        completion: `${a.completionPercentage}%`,
        score: a.vqsScore.toFixed(1)
      })),
      computeAllocation: '80% to top 3 monetizable assets'
    },
    
    conversionFocus: {
      directive: 'End all interactions with monetized path',
      constraint: 'Unless blocked by VQS governance'
    },
    
    recentActivity: {
      tasksEvaluated: recentEvals.length,
      highPriorityTasks,
      avgCompositeScore: avgCompositeScore.toFixed(1)
    },
    
    constraintCompliance: status.constraintCompliance
  });
});

export default router;
