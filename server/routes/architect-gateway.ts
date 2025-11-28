/**
 * ARCHITECT GATEWAY API ROUTES
 * 
 * REST API endpoints for the Architect Gateway - the single entry point
 * for all AI-powered strategic planning and analysis.
 * 
 * Features:
 * - Three-Tier Action Classification (Safe/Constrained/Sensitive)
 * - Governor Policy Engine (non-bypassable validation)
 * - Auditor (redundant AI check for Tier 2+)
 * - Immutable Audit Logs + Kill Switch
 */

import { Router, Request, Response } from 'express';
import { architectGateway, type ArchitectRequest } from '../services/architect-gateway';

const router = Router();

// ============================================================================
// STATUS & HEALTH
// ============================================================================

router.get('/status', (req: Request, res: Response) => {
  try {
    const status = architectGateway.getStatus();
    res.json({
      success: true,
      gateway: 'ARCHITECT_GATEWAY',
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get gateway status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// QUERY ENDPOINT (Main Entry Point)
// ============================================================================

router.post('/query', async (req: Request, res: Response) => {
  try {
    const {
      agent_id = 'System',
      question,
      question_type = 'DIAGNOSTIC',
      env = 'development',
      state_snapshot,
      constraints = [],
      risk_level = 'LOW',
      simulate_only = true,
      token_budget = 1500,
      timeout_ms = 30000
    } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: question'
      });
    }

    const request: ArchitectRequest = {
      request_id: `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      correlation_id: `CORR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      version: '3.0',
      agent_id,
      env,
      state_snapshot: state_snapshot || {
        l5_status: 'ACTIVE',
        l6_mode: 'SHADOW_MODE',
        active_campaigns: [],
        governance_locks: ['VQS_LOCK', 'L6_BLOCK']
      },
      question,
      question_type,
      constraints,
      risk_level,
      simulate_only,
      token_budget,
      timeout_ms
    };

    const response = await architectGateway.query(request);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Query failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// SPECIALIZED REVIEW ENDPOINTS
// ============================================================================

router.post('/review/l6-structure', async (req: Request, res: Response) => {
  try {
    const { agent_id = 'CoS' } = req.body;
    const response = await architectGateway.requestL6StructureReview(agent_id);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'L6 structure review failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/review/vqs-alignment', async (req: Request, res: Response) => {
  try {
    const { agent_id = 'CoS' } = req.body;
    const response = await architectGateway.requestVQSAlignmentCheck(agent_id);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'VQS alignment check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// AUDIT LOGS
// ============================================================================

router.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = architectGateway.getAuditLogs(limit);
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get audit logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// ACTION TIER INFO
// ============================================================================

router.get('/action-tiers', (req: Request, res: Response) => {
  res.json({
    success: true,
    tiers: {
      TIER_1_SAFE: {
        description: 'Auto-execute: read, log, simulate, score',
        actions: ['READ', 'LOG', 'SIMULATE', 'SCORE', 'ANALYZE', 'REPORT', 'NOTIFY'],
        auto_execute: true,
        requires_auditor: false
      },
      TIER_2_CONSTRAINED: {
        description: 'Execute within templates + budgets: email copy, UI text, A/B variants',
        actions: ['EMAIL_COPY', 'UI_TEXT', 'AB_VARIANT', 'CONTENT_UPDATE', 'CAMPAIGN_ADJUST'],
        auto_execute: true,
        requires_auditor: true
      },
      TIER_3_SENSITIVE: {
        description: 'Never direct execute: pricing, billing, infra - only propose diffs',
        actions: ['PRICING_CHANGE', 'BILLING_ACTION', 'INFRA_CHANGE', 'DATA_DELETE', 'GOVERNANCE_OVERRIDE', 'DEPLOYMENT'],
        auto_execute: false,
        requires_auditor: true
      }
    },
    governance: {
      governor: 'Non-bypassable policy validation',
      auditor: 'Redundant AI check for Tier 2+',
      kill_switch: 'ARCHITECT_LIVE=false forces simulation mode'
    }
  });
});

export default router;
