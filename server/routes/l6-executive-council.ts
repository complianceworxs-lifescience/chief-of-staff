/**
 * L6 EXECUTIVE COUNCIL API ROUTES
 * 
 * Consensus Protocol endpoints for autonomous execution.
 * 3x PASS = AUTO-EXECUTE | Any FAIL = HOLD + Chairman Alert
 */

import { Router, Request, Response } from 'express';
import { 
  l6ExecutiveCouncil, 
  type ExecuteCommand,
  type ExecuteCommandType 
} from '../services/l6-executive-council';

const router = Router();

// ============================================================================
// STATUS & HEALTH
// ============================================================================

router.get('/status', (req: Request, res: Response) => {
  try {
    const status = l6ExecutiveCouncil.getStatus();
    res.json({
      success: true,
      council: 'L6_EXECUTIVE_COUNCIL',
      protocol: 'CONSENSUS_v1.0',
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get council status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// DELIBERATION - Submit command for Council vote
// ============================================================================

router.post('/deliberate', async (req: Request, res: Response) => {
  try {
    const {
      type,
      payload,
      agent_id = 'System',
      priority = 'MEDIUM'
    } = req.body;

    if (!type || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type and payload'
      });
    }

    const command: ExecuteCommand = {
      command_id: `CMD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type: type as ExecuteCommandType,
      payload,
      agent_id,
      priority,
      created_at: new Date().toISOString()
    };

    const decision = await l6ExecutiveCouncil.deliberate(command);
    
    res.json({
      success: true,
      decision,
      summary: {
        unanimous: decision.unanimous,
        final_decision: decision.final_decision,
        votes: decision.votes.map(v => ({ member: v.alias, vote: v.vote }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Deliberation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// MONDAY LAUNCH QUEUE
// ============================================================================

router.get('/launch-queue', (req: Request, res: Response) => {
  try {
    const queue = l6ExecutiveCouncil.getLaunchQueue();
    const status = l6ExecutiveCouncil.getStatus();
    
    res.json({
      success: true,
      queue,
      stats: status.queue_stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get launch queue',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/launch-queue/add', async (req: Request, res: Response) => {
  try {
    const {
      type,
      payload,
      agent_id = 'System',
      priority = 'MEDIUM',
      scheduled_for
    } = req.body;

    if (!type || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type and payload'
      });
    }

    const command: ExecuteCommand = {
      command_id: `CMD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type: type as ExecuteCommandType,
      payload,
      agent_id,
      priority,
      created_at: new Date().toISOString()
    };

    const item = l6ExecutiveCouncil.addToLaunchQueue(command, scheduled_for);
    
    res.json({
      success: true,
      item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add to launch queue',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/launch-queue/process', async (req: Request, res: Response) => {
  try {
    const result = await l6ExecutiveCouncil.processLaunchQueue();
    
    res.json({
      success: true,
      message: `Processed ${result.processed} items: ${result.approved} APPROVED, ${result.held} HELD`,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process launch queue',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/launch-queue/execute', async (req: Request, res: Response) => {
  try {
    const result = await l6ExecutiveCouncil.executeApprovedQueue();
    
    res.json({
      success: true,
      message: `Executed ${result.executed} items, ${result.failed} failed`,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute launch queue',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/launch-queue/clear-executed', (req: Request, res: Response) => {
  try {
    const cleared = l6ExecutiveCouncil.clearExecutedFromQueue();
    
    res.json({
      success: true,
      cleared,
      message: `Cleared ${cleared} executed items from queue`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear executed items',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// CHAIRMAN ALERTS
// ============================================================================

router.get('/chairman-alerts', (req: Request, res: Response) => {
  try {
    const alerts = l6ExecutiveCouncil.getChairmanAlerts();
    
    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get chairman alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// AUDIT TRAIL
// ============================================================================

router.get('/audit-trail', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const trail = l6ExecutiveCouncil.getAuditTrail(limit);
    
    res.json({
      success: true,
      count: trail.length,
      audit_trail: trail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get audit trail',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// COUNCIL INFO
// ============================================================================

router.get('/council-members', (req: Request, res: Response) => {
  res.json({
    success: true,
    council: {
      name: 'L6 Executive Council',
      protocol: 'Consensus Protocol v1.0',
      execution_rule: '3x PASS = AUTO-EXECUTE | Any FAIL = HOLD',
      members: [
        {
          vote: 'A',
          member: 'GOVERNANCE',
          alias: 'The Lawyer',
          checks: ['Regulatory Compliance', 'No Absolute Claims', 'Constraint Rules', 'Industry Filter']
        },
        {
          vote: 'B',
          member: 'REVENUE',
          alias: 'The Accountant',
          checks: ['Daily Cap', 'Predicted ROI', 'Monetization Path', 'Revenue Prime Alignment']
        },
        {
          vote: 'C',
          member: 'COHERENCE',
          alias: 'The Brand Manager',
          checks: ['Archetype H Tone', 'Drift Score', 'Professional Equity', 'VQS Matrix']
        }
      ]
    }
  });
});

export default router;
