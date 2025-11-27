/**
 * ARCHITECT DECISION FRAMEWORK API ROUTES
 * 
 * Endpoints for applying the Architect Decision Framework to
 * Strategist diagnostic briefs and rendering verdicts.
 */

import { Router, Request, Response } from 'express';
import { architectDecisionFramework } from '../services/architect-decision-framework';
import { strategistRpmAnalysis } from '../services/strategist-rpm-analysis';

const router = Router();

/**
 * POST /api/architect-framework/apply
 * Apply the full Architect Decision Framework to the current Strategist analysis
 */
router.post('/apply', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can apply the Decision Framework',
      requiredAuthority: 'Architect'
    });
  }

  // Get the current Strategist analysis
  const strategistReport = strategistRpmAnalysis.getArchitectSummary() as any;

  if (!strategistReport || strategistReport.status === 'no_analysis') {
    return res.status(400).json({
      error: 'NO_DIAGNOSTIC_AVAILABLE',
      message: 'No Strategist diagnostic brief available to evaluate',
      hint: 'Execute POST /api/strategist-analysis/execute first'
    });
  }

  try {
    // Build the diagnostic brief from Strategist output
    const diagnosticBrief = {
      analysisId: strategistReport.analysisId,
      rootCause: strategistReport.rootCause,
      proposedAction: strategistReport.singleRestorativeAction,
      projection: strategistReport.projection24h,
      safety: strategistReport.safety
    };

    // Apply the framework
    const verdict = architectDecisionFramework.applyFramework(diagnosticBrief);

    res.json({
      success: true,
      message: `ARCHITECT VERDICT RENDERED: ${verdict.verdict}`,
      verdict: {
        verdictId: verdict.verdictId,
        verdict: verdict.verdict,
        timestamp: verdict.timestamp,
        
        failureClassification: {
          class: verdict.failureClassification.class,
          urgency: verdict.failureClassification.urgency,
          correctionType: verdict.failureClassification.correctionType
        },
        
        criterionResults: {
          vqsProtection: verdict.evaluation.vqsProtection.passed,
          revenueIntegrity: verdict.evaluation.revenueIntegrity.passed,
          auditDefensibility: verdict.evaluation.auditDefensibility.passed,
          offerLadderIntegrity: verdict.evaluation.offerLadderIntegrity.passed,
          systemStability: verdict.evaluation.systemStability.passed,
          restorativePower24h: verdict.evaluation.restorativePower24h.passed,
          allPassed: Object.values(verdict.evaluation).every(c => c.passed)
        },
        
        verdictRationale: verdict.verdictRationale,
        architectCommand: verdict.architectCommand,
        
        executionDirective: verdict.executionDirective
      },
      
      // Reference to original analysis
      strategistAnalysisId: strategistReport.analysisId
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Framework application failed',
      message: error.message
    });
  }
});

/**
 * GET /api/architect-framework/current-verdict
 * Get the current verdict (if any)
 */
router.get('/current-verdict', (req: Request, res: Response) => {
  const verdict = architectDecisionFramework.getCurrentVerdict();
  
  if (!verdict) {
    return res.json({
      active: false,
      message: 'No verdict has been rendered',
      hint: 'POST /api/architect-framework/apply with Architect authorization'
    });
  }

  res.json({
    active: true,
    verdict: {
      verdictId: verdict.verdictId,
      verdict: verdict.verdict,
      timestamp: verdict.timestamp,
      strategistAnalysisId: verdict.strategistAnalysisId,
      failureClass: verdict.failureClassification.class,
      urgency: verdict.failureClassification.urgency,
      allCriteriaPassed: Object.values(verdict.evaluation).every(c => c.passed),
      architectCommand: verdict.architectCommand,
      deadline: verdict.executionDirective.deadline
    }
  });
});

/**
 * GET /api/architect-framework/verdict-details
 * Get full details of the current verdict
 */
router.get('/verdict-details', (req: Request, res: Response) => {
  const verdict = architectDecisionFramework.getCurrentVerdict();
  
  if (!verdict) {
    return res.json({
      active: false,
      message: 'No verdict available'
    });
  }

  res.json({
    active: true,
    verdictId: verdict.verdictId,
    timestamp: verdict.timestamp,
    verdict: verdict.verdict,
    strategistAnalysisId: verdict.strategistAnalysisId,
    proposedAction: verdict.proposedAction,
    
    failureClassification: verdict.failureClassification,
    
    evaluation: {
      vqsProtection: verdict.evaluation.vqsProtection,
      revenueIntegrity: verdict.evaluation.revenueIntegrity,
      auditDefensibility: verdict.evaluation.auditDefensibility,
      offerLadderIntegrity: verdict.evaluation.offerLadderIntegrity,
      systemStability: verdict.evaluation.systemStability,
      restorativePower24h: verdict.evaluation.restorativePower24h
    },
    
    verdictRationale: verdict.verdictRationale,
    architectCommand: verdict.architectCommand,
    executionDirective: verdict.executionDirective
  });
});

/**
 * GET /api/architect-framework/history
 * Get verdict history
 */
router.get('/history', (req: Request, res: Response) => {
  const history = architectDecisionFramework.getVerdictHistory();
  
  res.json({
    totalVerdicts: history.length,
    verdicts: history.map(v => ({
      verdictId: v.verdictId,
      verdict: v.verdict,
      timestamp: v.timestamp,
      strategistAnalysisId: v.strategistAnalysisId,
      failureClass: v.failureClassification.class,
      allCriteriaPassed: Object.values(v.evaluation).every(c => c.passed)
    }))
  });
});

/**
 * GET /api/architect-framework/criterion/:criterion
 * Get details for a specific criterion
 */
router.get('/criterion/:criterion', (req: Request, res: Response) => {
  const { criterion } = req.params;
  const verdict = architectDecisionFramework.getCurrentVerdict();
  
  if (!verdict) {
    return res.json({
      active: false,
      message: 'No verdict available'
    });
  }

  const criterionMap: Record<string, any> = {
    'vqs': verdict.evaluation.vqsProtection,
    'vqs-protection': verdict.evaluation.vqsProtection,
    'revenue': verdict.evaluation.revenueIntegrity,
    'revenue-integrity': verdict.evaluation.revenueIntegrity,
    'audit': verdict.evaluation.auditDefensibility,
    'audit-defensibility': verdict.evaluation.auditDefensibility,
    'offer-ladder': verdict.evaluation.offerLadderIntegrity,
    'ladder': verdict.evaluation.offerLadderIntegrity,
    'stability': verdict.evaluation.systemStability,
    'system-stability': verdict.evaluation.systemStability,
    '24h': verdict.evaluation.restorativePower24h,
    'restorative': verdict.evaluation.restorativePower24h
  };

  const result = criterionMap[criterion.toLowerCase()];
  
  if (!result) {
    return res.status(400).json({
      error: 'Invalid criterion',
      validCriteria: ['vqs', 'revenue', 'audit', 'offer-ladder', 'stability', '24h']
    });
  }

  res.json({
    verdictId: verdict.verdictId,
    criterion: result.criterion,
    passed: result.passed,
    evidence: result.evidence,
    violationReason: result.violationReason
  });
});

/**
 * GET /api/architect-framework/status
 * Get current framework status
 */
router.get('/status', (req: Request, res: Response) => {
  const verdict = architectDecisionFramework.getCurrentVerdict();
  const history = architectDecisionFramework.getVerdictHistory();

  if (!verdict) {
    return res.json({
      active: false,
      message: 'No verdict has been rendered',
      hint: 'POST /api/architect-framework/apply with Architect authorization',
      totalVerdicts: history.length
    });
  }

  res.json({
    active: true,
    framework: 'ARCHITECT_DECISION_FRAMEWORK_v1.0',
    currentVerdict: {
      verdictId: verdict.verdictId,
      verdict: verdict.verdict,
      timestamp: verdict.timestamp,
      failureClass: verdict.failureClassification.class,
      allCriteriaPassed: Object.values(verdict.evaluation).every(c => c.passed)
    },
    totalVerdicts: history.length,
    safety: {
      l6Activation: 'PROHIBITED',
      vqsProtection: 'ENFORCED',
      methodologyLock: 'ENFORCED'
    }
  });
});

export default router;
