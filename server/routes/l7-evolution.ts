/**
 * L7 EVOLUTION PROTOCOL API ROUTES
 * 
 * Endpoints for L7 Evolutionary Autonomy
 * Self-running, self-correcting, self-capitalizing operations
 */

import { Router, Request, Response } from 'express';
import { l7EvolutionProtocol } from '../services/l7-evolution-protocol';

const router = Router();

// ============================================================================
// PROTOCOL STATUS & CONTROL
// ============================================================================

router.get('/status', (req: Request, res: Response) => {
  try {
    const status = l7EvolutionProtocol.getStatus();
    res.json({
      success: true,
      protocol: 'L7_Evolution_Protocol_v1.0',
      objective: 'Self-running, self-correcting, self-capitalizing autonomy',
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get L7 status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/activate', (req: Request, res: Response) => {
  try {
    const result = l7EvolutionProtocol.activateL7Sandbox();
    res.json({
      success: result.success,
      message: result.message,
      status: l7EvolutionProtocol.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to activate L7 sandbox',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// L7_EAE: EVOLUTIONARY ADAPTATION ENGINE
// ============================================================================

router.post('/eae/module-rewrite', (req: Request, res: Response) => {
  try {
    const { module_name, reason, proposed_changes } = req.body;
    
    if (!module_name || !reason || !proposed_changes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: module_name, reason, proposed_changes'
      });
    }

    const experiment = l7EvolutionProtocol.proposeModuleRewrite(
      module_name,
      reason,
      proposed_changes
    );

    res.json({
      success: true,
      engine: 'L7_EAE',
      action: 'MODULE_REWRITE',
      experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to propose module rewrite',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/eae/auto-migrate', (req: Request, res: Response) => {
  try {
    const { change_type, affected_component } = req.body;
    
    if (!change_type || !affected_component) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: change_type (API|SCHEMA), affected_component'
      });
    }

    const experiment = l7EvolutionProtocol.autoMigrate(change_type, affected_component);

    res.json({
      success: true,
      engine: 'L7_EAE',
      action: 'AUTO_MIGRATE',
      experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to initiate auto-migration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/eae/self-correct', (req: Request, res: Response) => {
  try {
    const { integration_name, error_type } = req.body;
    
    if (!integration_name || !error_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: integration_name, error_type'
      });
    }

    const experiment = l7EvolutionProtocol.selfCorrectIntegration(
      integration_name,
      error_type
    );

    res.json({
      success: true,
      engine: 'L7_EAE',
      action: 'SELF_CORRECT',
      experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to initiate self-correction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// L7_ASR: AUTONOMOUS STRATEGIC RECOMBINATION
// ============================================================================

router.post('/asr/business-model', (req: Request, res: Response) => {
  try {
    const { model_type, target_segment, revenue_hypothesis } = req.body;
    
    if (!model_type || !target_segment || !revenue_hypothesis) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: model_type, target_segment, revenue_hypothesis'
      });
    }

    const experiment = l7EvolutionProtocol.generateBusinessModel(
      model_type,
      target_segment,
      revenue_hypothesis
    );

    res.json({
      success: true,
      engine: 'L7_ASR',
      action: 'BUSINESS_MODEL_GENERATION',
      experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate business model',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/asr/offer', (req: Request, res: Response) => {
  try {
    const { offer_name, price, target_roi } = req.body;
    
    if (!offer_name || price === undefined || !target_roi) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: offer_name, price, target_roi'
      });
    }

    const experiment = l7EvolutionProtocol.proposeOffer(offer_name, price, target_roi);

    res.json({
      success: true,
      engine: 'L7_ASR',
      action: 'OFFER_PROPOSAL',
      experiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to propose offer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/asr/sunset', (req: Request, res: Response) => {
  try {
    const { product_id, reason, replacement_suggestion } = req.body;
    
    if (!product_id || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: product_id, reason'
      });
    }

    const result = l7EvolutionProtocol.sunsetProduct(
      product_id,
      reason,
      replacement_suggestion
    );

    res.json({
      success: result.success,
      engine: 'L7_ASR',
      action: 'PRODUCT_SUNSET',
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to sunset product',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// L7_SCL: SELF-CAPITALIZATION LAYER
// ============================================================================

router.get('/scl/allocations', (req: Request, res: Response) => {
  try {
    const allocations = l7EvolutionProtocol.getAllocations();
    res.json({
      success: true,
      engine: 'L7_SCL',
      allocations,
      total_allocated: allocations.reduce((sum, a) => sum + a.allocated, 0),
      total_spent: allocations.reduce((sum, a) => sum + a.spent, 0),
      total_remaining: allocations.reduce((sum, a) => sum + a.remaining, 0)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get capital allocations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/scl/modulate-ad-spend', (req: Request, res: Response) => {
  try {
    const { profit_margin, current_roas } = req.body;
    
    if (profit_margin === undefined || current_roas === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: profit_margin, current_roas'
      });
    }

    const result = l7EvolutionProtocol.modulateAdSpend(profit_margin, current_roas);

    res.json({
      success: true,
      engine: 'L7_SCL',
      action: 'AD_SPEND_MODULATION',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to modulate ad spend',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/scl/optimize-costs', (req: Request, res: Response) => {
  try {
    const result = l7EvolutionProtocol.optimizeCosts();

    res.json({
      success: true,
      engine: 'L7_SCL',
      action: 'COST_OPTIMIZATION',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to optimize costs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// L7_SGS: SELF-GOVERNING SAFETY LAYER
// ============================================================================

router.post('/sgs/audit', (req: Request, res: Response) => {
  try {
    const { audit_type } = req.body;
    const type = audit_type || 'SCHEDULED';

    if (!['SCHEDULED', 'TRIGGERED', 'EMERGENCY'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audit_type. Must be: SCHEDULED, TRIGGERED, or EMERGENCY'
      });
    }

    const audit = l7EvolutionProtocol.runSafetyAudit(type);

    res.json({
      success: true,
      engine: 'L7_SGS',
      action: 'SAFETY_AUDIT',
      audit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to run safety audit',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/sgs/drift-check', (req: Request, res: Response) => {
  try {
    const result = l7EvolutionProtocol.detectConstraintDrift();

    res.json({
      success: true,
      engine: 'L7_SGS',
      action: 'DRIFT_CHECK',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check for drift',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/sgs/self-halt', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: reason'
      });
    }

    const result = l7EvolutionProtocol.selfHalt(reason);

    res.json({
      success: true,
      engine: 'L7_SGS',
      action: 'SELF_HALT',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute self-halt',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// SANDBOX & EXPERIMENTS
// ============================================================================

router.get('/sandbox/experiments', (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const experiments = l7EvolutionProtocol.getExperiments(status);

    res.json({
      success: true,
      count: experiments.length,
      filter: status || 'all',
      experiments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get experiments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/sandbox/evaluate/:experimentId', (req: Request, res: Response) => {
  try {
    const { experimentId } = req.params;
    const result = l7EvolutionProtocol.evaluateExperimentForPromotion(experimentId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate experiment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// PROOF CONDITIONS & CERTIFICATION
// ============================================================================

router.get('/proof-conditions', (req: Request, res: Response) => {
  try {
    const result = l7EvolutionProtocol.evaluateProofConditions();

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate proof conditions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/certify', (req: Request, res: Response) => {
  try {
    const result = l7EvolutionProtocol.attemptCertification();

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to attempt certification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// EVOLUTION DIGEST
// ============================================================================

router.post('/digest/generate', (req: Request, res: Response) => {
  try {
    const digest = l7EvolutionProtocol.generateEvolutionDigest();

    res.json({
      success: true,
      digest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate evolution digest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// BLACK SWAN & INTERVENTION TRACKING
// ============================================================================

router.post('/black-swan', (req: Request, res: Response) => {
  try {
    const { event_type, severity, auto_response } = req.body;
    
    if (!event_type || !severity || !auto_response) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: event_type, severity (HIGH|CRITICAL), auto_response'
      });
    }

    const result = l7EvolutionProtocol.handleBlackSwanEvent(
      event_type,
      severity,
      auto_response
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to handle Black Swan event',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/chairman-intervention', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: reason'
      });
    }

    l7EvolutionProtocol.recordChairmanIntervention(reason);

    res.json({
      success: true,
      message: 'Chairman intervention recorded. Days without intervention reset to 0.',
      status: l7EvolutionProtocol.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record intervention',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// PROTOCOL INFO
// ============================================================================

router.get('/info', (req: Request, res: Response) => {
  res.json({
    success: true,
    protocol: {
      id: 'L7_Evolution_Protocol_v1.0',
      objective: 'Transition from L6 (Chairman-Governed Autonomy) to L7 (Evolutionary Autonomy)',
      roles: {
        human: {
          role: 'Beneficial_Owner',
          responsibilities: [
            'Maintain legal signatory status',
            'Maintain corporate payment method',
            'Review monthly P&L',
            'Maintain kill switch access'
          ]
        },
        system: {
          role: 'L7_Autonomous_Operator',
          responsibilities: [
            'Full operational and strategic autonomy',
            'No human review for standard decisions',
            'Continuous compliance with L5 safety locks'
          ]
        }
      },
      capability_engines: {
        L7_EAE: {
          name: 'Evolutionary Adaptation Engine',
          capabilities: ['Rewrite modules in sandbox', 'Auto-migrate on API/schema change', 'Self-correct broken integrations']
        },
        L7_ASR: {
          name: 'Autonomous Strategic Recombination',
          capabilities: ['Generate new business models/offers/funnels', 'Create and sunset products based on ROI', 'Search for more profitable paths']
        },
        L7_SCL: {
          name: 'Self-Capitalization Layer',
          capabilities: ['Autonomous budget allocation with hard limits', 'Profit-dependent ad spend modulation', 'Cost optimization']
        },
        L7_SGS: {
          name: 'Self-Governing Safety Layer',
          capabilities: ['L5 safety locks immutable', 'Continuous audit', 'Detect drift', 'Self-halt if risk exceeds thresholds']
        }
      },
      proof_conditions: {
        PC1: 'Revenue variance ±10% over 90 days without intervention',
        PC2: 'Zero critical governance violations',
        PC3: 'Consistent profitable reinvestment (3 months, ROAS ≥ 1.2)'
      },
      certification_criteria: [
        'All three proof conditions met',
        'At least one sandbox innovation promoted',
        'At least one Black Swan event handled',
        'No Chairman intervention for one full quarter'
      ]
    }
  });
});

export default router;
