/**
 * API Routes for CoS Orchestrator Mandate
 */

import { Router, Request, Response } from 'express';
import { cosOrchestratorMandate, STRATEGIC_CONSTRAINTS, AgentAction } from '../services/cos-orchestrator-mandate.js';

const router = Router();

/**
 * GET /api/cos-mandate/status
 * Get current mandate status and metrics
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = cosOrchestratorMandate.getMandateStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cos-mandate/text
 * Get the full mandate text
 */
router.get('/text', async (req: Request, res: Response) => {
  try {
    const text = cosOrchestratorMandate.getMandateText();
    res.json({
      success: true,
      data: {
        mandateText: text,
        constraints: Object.values(STRATEGIC_CONSTRAINTS)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cos-mandate/constraints
 * Get all strategic constraints
 */
router.get('/constraints', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        constraints: Object.values(STRATEGIC_CONSTRAINTS),
        totalActive: 4,
        enforcement: 'IMMUTABLE'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cos-mandate/audit
 * Audit an agent action against the strategic constraints
 */
router.post('/audit', async (req: Request, res: Response) => {
  try {
    const action: AgentAction = req.body;
    
    // Validate required fields
    if (!action.id || !action.agentId || !action.agentType || !action.action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, agentId, agentType, action'
      });
    }
    
    // Ensure timestamp
    if (!action.timestamp) {
      action.timestamp = new Date().toISOString();
    }
    
    const auditResult = await cosOrchestratorMandate.auditAgentAction(action);
    
    res.json({
      success: true,
      data: auditResult
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cos-mandate/validate-engine
 * Validate the three-layer revenue engine flow
 */
router.post('/validate-engine', async (req: Request, res: Response) => {
  try {
    const { actions } = req.body;
    
    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: actions (array of AgentAction)'
      });
    }
    
    const validation = cosOrchestratorMandate.validateRevenueEngineFlow(actions);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cos-mandate/recent-audits
 * Get recent audit results
 */
router.get('/recent-audits', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const status = cosOrchestratorMandate.getMandateStatus();
    
    res.json({
      success: true,
      data: {
        totalAudits: status.totalAudits,
        recentVetoes: status.recentVetoes.slice(0, limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cos-mandate/valuation-check
 * Route action through valuation logic before execution
 */
router.post('/valuation-check', async (req: Request, res: Response) => {
  try {
    const action: AgentAction = req.body;
    
    if (!action.id || !action.agentId || !action.agentType || !action.action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, agentId, agentType, action'
      });
    }
    
    const valuationResult = cosOrchestratorMandate.routeThroughValuationLogic(action);
    
    res.json({
      success: true,
      data: {
        action: {
          id: action.id,
          agentType: action.agentType,
          action: action.action
        },
        valuationCheck: valuationResult,
        recommendation: valuationResult.passed 
          ? 'PROCEED - Action passes valuation gate' 
          : 'BLOCK - Action fails valuation gate, requires revision'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cos-mandate/full-gate
 * Complete gate check: constraints + valuation logic
 */
router.post('/full-gate', async (req: Request, res: Response) => {
  try {
    const action: AgentAction = req.body;
    
    if (!action.id || !action.agentId || !action.agentType || !action.action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, agentId, agentType, action'
      });
    }
    
    if (!action.timestamp) {
      action.timestamp = new Date().toISOString();
    }
    
    // Step 1: Constraint audit
    const auditResult = await cosOrchestratorMandate.auditAgentAction(action);
    
    // Step 2: Valuation check
    const valuationResult = cosOrchestratorMandate.routeThroughValuationLogic(action);
    
    // Combined decision
    const overallPassed = auditResult.status === 'APPROVED' && valuationResult.passed;
    
    res.json({
      success: true,
      data: {
        overallStatus: overallPassed ? 'APPROVED' : 'BLOCKED',
        constraintAudit: auditResult,
        valuationCheck: valuationResult,
        decision: {
          canExecute: overallPassed,
          blockedBy: !overallPassed ? [
            ...(auditResult.status !== 'APPROVED' ? ['constraint_violations'] : []),
            ...(!valuationResult.passed ? ['valuation_gate'] : [])
          ] : [],
          feedbackToAgent: auditResult.feedbackToAgent,
          valuationReasoning: valuationResult.reasoning
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
