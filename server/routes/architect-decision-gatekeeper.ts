/**
 * ARCHITECT DECISION GATEKEEPER v1.0 API ROUTES
 * 
 * Scope: architect_only
 * Purpose: Evaluate Strategist corrective actions for RPM/L6-related changes
 */

import { Router, Request, Response } from 'express';
import { architectDecisionGatekeeper } from '../services/architect-decision-gatekeeper';

const router = Router();

/**
 * POST /api/gatekeeper/evaluate
 * Evaluate a Strategist proposal through the gatekeeper
 */
router.post('/evaluate', (req: Request, res: Response) => {
  const { source, root_cause_class, proposed_action, projected_impact } = req.body;

  // Validate source
  if (source !== 'Strategist') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Strategist can submit proposals to the gatekeeper',
      requiredSource: 'Strategist'
    });
  }

  // Validate root cause class
  const validRootCauses = ['UDL', 'REVENUE_STABILITY', 'RPM_CONFIDENCE', 'OBJECTION_DRIFT', 'OFFER_LADDER_PREDICTABILITY'];
  if (!validRootCauses.includes(root_cause_class)) {
    return res.status(400).json({
      error: 'INVALID_ROOT_CAUSE',
      reason: `root_cause_class must be one of: ${validRootCauses.join(', ')}`,
      provided: root_cause_class
    });
  }

  // Validate proposed action
  if (!proposed_action || typeof proposed_action !== 'string') {
    return res.status(400).json({
      error: 'MISSING_PROPOSAL',
      reason: 'proposed_action is required and must be a string'
    });
  }

  // Validate projected impact
  if (!projected_impact || 
      typeof projected_impact.rpm_confidence_delta !== 'number' ||
      typeof projected_impact.revenue_delta !== 'number') {
    return res.status(400).json({
      error: 'INVALID_PROJECTED_IMPACT',
      reason: 'projected_impact must include rpm_confidence_delta (number) and revenue_delta (number)'
    });
  }

  try {
    const decision = architectDecisionGatekeeper.evaluate({
      source: 'Strategist',
      root_cause_class,
      proposed_action,
      projected_impact
    });

    res.json({
      success: true,
      gatekeeper: 'ARCHITECT_DECISION_GATEKEEPER_v1.0',
      
      decision: decision.decision,
      decisionId: decision.decisionId,
      timestamp: decision.timestamp,
      
      reason: decision.reason,
      instructions_to_strategist: decision.instructions_to_strategist,
      notes_for_cos: decision.notes_for_cos,
      
      evaluation: {
        hard_filters: decision.evaluation.hard_filters.map(f => ({
          filter: f.filter,
          passed: f.passed,
          reason: f.reason
        })),
        gate_constraints: decision.evaluation.gate_constraints.map(f => ({
          filter: f.filter,
          passed: f.passed,
          reason: f.reason
        })),
        soft_filters: decision.evaluation.soft_filters.map(f => ({
          filter: f.filter,
          passed: f.passed,
          reason: f.reason
        })),
        summary: {
          all_hard_passed: decision.evaluation.all_hard_passed,
          all_gate_passed: decision.evaluation.all_gate_passed,
          soft_violations: decision.evaluation.soft_violations
        }
      },
      
      safety: decision.safety
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Gatekeeper evaluation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/gatekeeper/status
 * Get gatekeeper status and last decision
 */
router.get('/status', (req: Request, res: Response) => {
  const lastDecision = architectDecisionGatekeeper.getLastDecision();
  const history = architectDecisionGatekeeper.getDecisionHistory();

  res.json({
    gatekeeper: 'ARCHITECT_DECISION_GATEKEEPER_v1.0',
    status: 'ACTIVE',
    
    safety_locks: {
      l6_activation: 'PROHIBITED',
      vqs_methodology_lock: 'ENFORCED',
      offer_ladder_structure_lock: 'ENFORCED',
      positioning_lock: 'ENFORCED'
    },
    
    lastDecision: lastDecision ? {
      decisionId: lastDecision.decisionId,
      timestamp: lastDecision.timestamp,
      decision: lastDecision.decision,
      root_cause_class: lastDecision.input.root_cause_class
    } : null,
    
    totalDecisions: history.length
  });
});

/**
 * GET /api/gatekeeper/rules
 * Get classification rules and gate constraints
 */
router.get('/rules', (req: Request, res: Response) => {
  res.json({
    gatekeeper: 'ARCHITECT_DECISION_GATEKEEPER_v1.0',
    
    classification_rules: architectDecisionGatekeeper.getClassificationRules(),
    
    gate_by_root_cause: architectDecisionGatekeeper.getGateConstraints(),
    
    hard_filters: [
      'VQS_PROTECTION: action MUST NOT alter VQS, methodology, or claimed ranges',
      'REVENUE_INTEGRITY: action MUST NOT materially increase revenue volatility',
      'AUDIT_DEFENSIBILITY: action MUST remain conservative, reproducible, regulator-defensible'
    ],
    
    soft_filters: [
      'OFFER_LADDER_INTEGRITY: MUST preserve Tier1→Tier2→Tier3 sequence',
      'L5_STABILITY: MUST NOT introduce L6-like experimental breadth',
      '24H_RESTORABILITY: action SHOULD restore RPM_CONFIDENCE ≥0.90 within 24h'
    ],
    
    verdicts: [
      'APPROVE: all hard_filters pass, gate constraints respected, soft_filters acceptable',
      'MODIFY: hard_filters pass, but gate/soft_filters violated → narrow action',
      'REJECT: any hard_filter violated, or action structurally unsafe'
    ]
  });
});

/**
 * GET /api/gatekeeper/history
 * Get decision history
 */
router.get('/history', (req: Request, res: Response) => {
  const history = architectDecisionGatekeeper.getDecisionHistory();

  res.json({
    totalDecisions: history.length,
    decisions: history.map(d => ({
      decisionId: d.decisionId,
      timestamp: d.timestamp,
      root_cause_class: d.input.root_cause_class,
      proposed_action: d.input.proposed_action.substring(0, 100) + '...',
      decision: d.decision,
      instructions: d.instructions_to_strategist
    }))
  });
});

/**
 * GET /api/gatekeeper/decision/:id
 * Get specific decision by ID
 */
router.get('/decision/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const history = architectDecisionGatekeeper.getDecisionHistory();
  const decision = history.find(d => d.decisionId === id);

  if (!decision) {
    return res.status(404).json({
      error: 'Decision not found',
      decisionId: id
    });
  }

  res.json({
    decision
  });
});

export default router;
