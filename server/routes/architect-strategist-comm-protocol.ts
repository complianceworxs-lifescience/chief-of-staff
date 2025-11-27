/**
 * ARCHITECT_STRATEGIST_COMM_PROTOCOL API Routes
 * 
 * Provides REST API endpoints for the Architect ↔ Strategist communication protocol.
 */

import { Router, Request, Response } from 'express';
import { 
  architectStrategistCommProtocol,
  type DirectiveIntent,
  type StrategistDiagnosticBrief
} from '../services/architect-strategist-comm-protocol';

const router = Router();

// ============================================================================
// PROTOCOL STATUS
// ============================================================================

/**
 * GET /api/protocol/status
 * Returns the current status of the Architect-Strategist communication protocol
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = architectStrategistCommProtocol.getProtocolStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get protocol status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// DIRECTIVE OPERATIONS
// ============================================================================

/**
 * POST /api/protocol/directive
 * Create and route a new Architect directive to Strategist
 */
router.post('/directive', async (req: Request, res: Response) => {
  try {
    const { intent, payload, context_version, token_budget, deadline_minutes } = req.body;

    if (!intent || !payload) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['intent', 'payload']
      });
    }

    // Validate intent
    const validIntents: DirectiveIntent[] = ['DIAGNOSTIC', 'RECOVERY', 'FORECAST', 'STRATEGIC_ANALYSIS'];
    if (!validIntents.includes(intent)) {
      return res.status(400).json({
        error: 'Invalid intent',
        valid_intents: validIntents
      });
    }

    // Create directive packet
    const directive = architectStrategistCommProtocol.createDirectivePacket(
      intent as DirectiveIntent,
      payload,
      { context_version, token_budget, deadline_minutes }
    );

    // Route to Strategist
    const routeResult = await architectStrategistCommProtocol.routeToStrategist(directive);

    res.json({
      success: routeResult.success,
      transaction_id: routeResult.transaction_id,
      directive
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create directive',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/protocol/directive/simulate
 * Create directive and simulate Strategist response (for testing)
 */
router.post('/directive/simulate', async (req: Request, res: Response) => {
  try {
    const { intent, payload, context_version, token_budget, deadline_minutes } = req.body;

    if (!intent) {
      return res.status(400).json({
        error: 'Missing required field: intent'
      });
    }

    // Create directive
    const directive = architectStrategistCommProtocol.createDirectivePacket(
      intent as DirectiveIntent,
      payload || {},
      { context_version, token_budget, deadline_minutes }
    );

    // Simulate Strategist response
    const simulatedBrief = architectStrategistCommProtocol.simulateStrategistResponse(directive);

    // Execute full decision flow
    const flowResult = await architectStrategistCommProtocol.executeDecisionFlow(
      directive,
      simulatedBrief
    );

    res.json({
      ...flowResult,
      directive,
      strategist_brief: simulatedBrief
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to simulate directive flow',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// BRIEF OPERATIONS
// ============================================================================

/**
 * POST /api/protocol/brief
 * Process a Strategist diagnostic brief
 */
router.post('/brief', async (req: Request, res: Response) => {
  try {
    const { transaction_id, brief } = req.body;

    if (!transaction_id || !brief) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['transaction_id', 'brief']
      });
    }

    // Process the brief
    const processResult = await architectStrategistCommProtocol.processStrategistBrief(
      transaction_id,
      brief as StrategistDiagnosticBrief
    );

    if (!processResult.success) {
      return res.status(400).json({
        success: false,
        validation_errors: processResult.validation_errors,
        governance_violations: processResult.governance_violations
      });
    }

    // Route to Gatekeeper
    const gatekeeperResult = await architectStrategistCommProtocol.routeToGatekeeper(transaction_id);

    // Route to CoS
    const cosSummary = await architectStrategistCommProtocol.routeToCoS(transaction_id);

    res.json({
      success: true,
      gatekeeper_decision: gatekeeperResult.decision,
      gatekeeper_reasoning: gatekeeperResult.reasoning,
      modifications: gatekeeperResult.modifications,
      cos_summary: cosSummary,
      governance_violations: processResult.governance_violations
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process brief',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

/**
 * GET /api/protocol/transactions
 * Get recent transactions
 */
router.get('/transactions', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;

    let transactions;
    if (status) {
      transactions = architectStrategistCommProtocol.getTransactionsByStatus(
        status as any
      );
    } else {
      transactions = architectStrategistCommProtocol.getRecentTransactions(limit);
    }

    res.json({
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/protocol/transactions/:id
 * Get a specific transaction
 */
router.get('/transactions/:id', (req: Request, res: Response) => {
  try {
    const transaction = architectStrategistCommProtocol.getTransaction(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        transaction_id: req.params.id
      });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get transaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// DECISION FLOW
// ============================================================================

/**
 * POST /api/protocol/decision-flow
 * Execute the full decision flow with provided directive and brief
 */
router.post('/decision-flow', async (req: Request, res: Response) => {
  try {
    const { directive, brief } = req.body;

    if (!directive || !brief) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['directive', 'brief']
      });
    }

    const result = await architectStrategistCommProtocol.executeDecisionFlow(
      directive,
      brief
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to execute decision flow',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// LOGS
// ============================================================================

/**
 * GET /api/protocol/logs
 * Get recent protocol logs
 */
router.get('/logs', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = architectStrategistCommProtocol.getRecentLogs(limit);

    res.json({
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// GOVERNANCE
// ============================================================================

/**
 * GET /api/protocol/governance
 * Get governance constraint status
 */
router.get('/governance', (req: Request, res: Response) => {
  try {
    const status = architectStrategistCommProtocol.getProtocolStatus();
    
    res.json({
      module: status.module,
      version: status.version,
      constraints: status.governance_constraints,
      enforcement: 'ACTIVE',
      locks: {
        vqs_protection: true,
        positioning_lock: true,
        offer_ladder_lock: true,
        l6_lock: true
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get governance status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
