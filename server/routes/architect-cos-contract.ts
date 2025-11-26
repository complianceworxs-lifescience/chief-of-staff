/**
 * ARCHITECT–CoS ESCALATION CONTRACT v1.0 API Routes
 * 
 * API endpoints for contract management, escalations, and governance enforcement.
 */

import { Router, Request, Response } from 'express';
import { 
  architectCosContract,
  AUTHORITY_HIERARCHY,
  ESCALATION_TRIGGERS,
  SAFETY_LOCKS,
  SUPERVISION_CYCLES,
  L5_CONSTRAINTS,
  L6_FUNCTION_BLOCKS
} from '../services/architect-cos-contract';

const router = Router();

// ============================================================================
// CONTRACT STATUS & GOVERNANCE
// ============================================================================

/**
 * GET /api/contract/status
 * Get full contract status including all authorities, locks, and escalations
 */
router.get('/status', (req: Request, res: Response) => {
  const status = architectCosContract.getContractStatus();
  res.json({
    contract: 'ARCHITECT–CoS ESCALATION CONTRACT',
    supersedes: 'All previous hierarchy documents',
    ...status
  });
});

/**
 * GET /api/contract/authorities
 * Get authority hierarchy definitions
 */
router.get('/authorities', (req: Request, res: Response) => {
  res.json({
    hierarchy: [
      { rank: 1, authority: 'Architect', type: 'Supreme Governance Authority' },
      { rank: 2, authority: 'CoS', type: 'Supreme Operational Authority' },
      { rank: 3, authority: 'Strategist', type: 'Strategic Advisory' },
      { rank: 4, authority: 'CMO/CRO/ContentManager', type: 'Operational Execution' }
    ],
    definitions: AUTHORITY_HIERARCHY
  });
});

// ============================================================================
// ESCALATION MANAGEMENT
// ============================================================================

/**
 * GET /api/contract/escalation-triggers
 * Get all escalation trigger definitions
 */
router.get('/escalation-triggers', (req: Request, res: Response) => {
  res.json({
    count: ESCALATION_TRIGGERS.length,
    triggers: ESCALATION_TRIGGERS
  });
});

/**
 * POST /api/contract/escalate
 * Manually trigger an escalation
 */
router.post('/escalate', (req: Request, res: Response) => {
  const { triggerId, sourceAgent, context } = req.body;

  if (!triggerId || !sourceAgent) {
    return res.status(400).json({ error: 'triggerId and sourceAgent required' });
  }

  const trigger = ESCALATION_TRIGGERS.find(t => t.id === triggerId);
  if (!trigger) {
    return res.status(404).json({ error: `Trigger ${triggerId} not found` });
  }

  const record = architectCosContract.recordEscalation(trigger, sourceAgent, context || {});
  res.json({
    success: true,
    escalation: record,
    message: `Escalated to ${trigger.escalateTo}`
  });
});

/**
 * POST /api/contract/resolve-escalation
 * Resolve an escalation (authority-checked)
 */
router.post('/resolve-escalation', (req: Request, res: Response) => {
  const { escalationId, resolution, resolvedBy } = req.body;

  if (!escalationId || !resolution || !resolvedBy) {
    return res.status(400).json({ error: 'escalationId, resolution, and resolvedBy required' });
  }

  if (!['CoS', 'Architect'].includes(resolvedBy)) {
    return res.status(400).json({ error: 'resolvedBy must be CoS or Architect' });
  }

  const success = architectCosContract.resolveEscalation(escalationId, resolution, resolvedBy);
  if (!success) {
    return res.status(403).json({ 
      error: 'Resolution failed',
      reason: 'Either escalation not found or authority violation'
    });
  }

  res.json({
    success: true,
    escalationId,
    resolution,
    resolvedBy
  });
});

/**
 * GET /api/contract/escalation-log
 * Get escalation history
 */
router.get('/escalation-log', (req: Request, res: Response) => {
  const log = architectCosContract.getEscalationLog();
  const pending = log.filter(e => !e.resolution);
  const resolved = log.filter(e => e.resolution);

  res.json({
    total: log.length,
    pending: pending.length,
    resolved: resolved.length,
    escalations: log.slice(-50) // Last 50
  });
});

// ============================================================================
// SAFETY LOCKS
// ============================================================================

/**
 * GET /api/contract/safety-locks
 * Get all safety lock definitions and status
 */
router.get('/safety-locks', (req: Request, res: Response) => {
  const locks = architectCosContract.getSafetyLocks();
  const active = locks.filter(l => l.isActive);
  const unlocked = locks.filter(l => !l.isActive);

  res.json({
    total: locks.length,
    active: active.length,
    unlocked: unlocked.length,
    locks
  });
});

/**
 * POST /api/contract/safety-locks/check
 * Check if a safety lock allows an action
 */
router.post('/safety-locks/check', (req: Request, res: Response) => {
  const { lockId } = req.body;

  if (!lockId) {
    return res.status(400).json({ error: 'lockId required' });
  }

  const result = architectCosContract.checkSafetyLock(lockId);
  res.json(result);
});

/**
 * POST /api/contract/safety-locks/unlock
 * Architect unlocks a safety lock
 */
router.post('/safety-locks/unlock', (req: Request, res: Response) => {
  const { lockId, authorization } = req.body;

  if (!lockId) {
    return res.status(400).json({ error: 'lockId required' });
  }

  // Only Architect can unlock
  if (authorization !== 'Architect') {
    return res.status(403).json({ 
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can unlock safety locks'
    });
  }

  const success = architectCosContract.unlockSafetyLock(lockId, 'Architect');
  if (!success) {
    return res.status(403).json({
      error: 'Unlock failed',
      reason: 'Lock is immutable or not found'
    });
  }

  res.json({
    success: true,
    lockId,
    message: 'Safety lock unlocked by Architect'
  });
});

// ============================================================================
// L5 CONSTRAINTS
// ============================================================================

/**
 * GET /api/contract/l5-constraints
 * Get all L5 constraint definitions
 */
router.get('/l5-constraints', (req: Request, res: Response) => {
  res.json({
    level: 'L5 - Revenue Optimization Intelligence',
    enforced: true,
    constraints: L5_CONSTRAINTS
  });
});

/**
 * GET /api/contract/l5-compliance
 * Get L5 compliance status
 */
router.get('/l5-compliance', (req: Request, res: Response) => {
  const status = architectCosContract.getL5ComplianceStatus();
  res.json({
    level: 'L5',
    ...status
  });
});

// ============================================================================
// L6 FUNCTION BLOCKS
// ============================================================================

/**
 * GET /api/contract/l6-blocks
 * Get all L6 function blocks and their status
 */
router.get('/l6-blocks', (req: Request, res: Response) => {
  const blocks = architectCosContract.getL6FunctionBlocks();
  const blocked = blocks.filter(b => b.blocked);
  const unlocked = blocks.filter(b => !b.blocked);

  res.json({
    level: 'L6 - Meta-Autonomy',
    status: 'BLOCKED',
    message: 'L6 functions blocked until explicit Architect approval',
    total: blocks.length,
    blocked: blocked.length,
    unlocked: unlocked.length,
    blocks
  });
});

/**
 * POST /api/contract/l6-blocks/check
 * Check if an L6 function is allowed
 */
router.post('/l6-blocks/check', (req: Request, res: Response) => {
  const { functionId } = req.body;

  if (!functionId) {
    return res.status(400).json({ error: 'functionId required' });
  }

  const result = architectCosContract.checkL6FunctionAllowed(functionId);
  res.json(result);
});

/**
 * POST /api/contract/l6-blocks/unlock
 * Architect unlocks an L6 function
 * 
 * For L6B-001 (business_model_redesign) and L6B-004 (market_expansion),
 * ALL 5 L6 thresholds must be met unless bypassReadinessCheck is true.
 */
router.post('/l6-blocks/unlock', (req: Request, res: Response) => {
  const { functionId, authorization, approvalReason, bypassReadinessCheck } = req.body;

  if (!functionId || !approvalReason) {
    return res.status(400).json({ error: 'functionId and approvalReason required' });
  }

  // Only Architect can unlock L6 functions
  if (authorization !== 'Architect') {
    return res.status(403).json({ 
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can unlock L6 functions'
    });
  }

  const result = architectCosContract.architectUnlockL6Function(
    functionId, 
    approvalReason, 
    bypassReadinessCheck === true
  );
  
  if (!result.success) {
    return res.status(403).json({
      error: 'Unlock failed',
      reason: result.reason,
      hint: 'For full L6 functions, verify readiness via /api/l6/readiness-assessment or set bypassReadinessCheck=true'
    });
  }

  res.json({
    success: true,
    functionId,
    approvalReason,
    bypassReadinessCheck: bypassReadinessCheck === true,
    message: result.reason
  });
});

/**
 * POST /api/contract/l6-blocks/lock
 * Architect re-locks an L6 function
 */
router.post('/l6-blocks/lock', (req: Request, res: Response) => {
  const { functionId, authorization, reason } = req.body;

  if (!functionId || !reason) {
    return res.status(400).json({ error: 'functionId and reason required' });
  }

  if (authorization !== 'Architect') {
    return res.status(403).json({ 
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can lock L6 functions'
    });
  }

  const success = architectCosContract.architectLockL6Function(functionId, reason);
  if (!success) {
    return res.status(404).json({
      error: 'Lock failed',
      reason: 'L6 function not found'
    });
  }

  res.json({
    success: true,
    functionId,
    reason,
    message: 'L6 function re-locked by Architect'
  });
});

// ============================================================================
// SUPERVISION CYCLES
// ============================================================================

/**
 * GET /api/contract/supervision-cycles
 * Get supervision cycle definitions
 */
router.get('/supervision-cycles', (req: Request, res: Response) => {
  res.json({
    cycles: SUPERVISION_CYCLES
  });
});

/**
 * POST /api/contract/supervision/architect-review
 * Trigger Architect governance review cycle
 */
router.post('/supervision/architect-review', async (req: Request, res: Response) => {
  try {
    const result = await architectCosContract.runArchitectGovernanceReview();
    res.json({
      success: true,
      review: result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contract/supervision/cos-review
 * Trigger CoS operational review cycle
 */
router.post('/supervision/cos-review', async (req: Request, res: Response) => {
  try {
    const result = await architectCosContract.runCosOperationalReview();
    res.json({
      success: true,
      review: result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// VIOLATION LOG
// ============================================================================

/**
 * GET /api/contract/violations
 * Get contract violation history
 */
router.get('/violations', (req: Request, res: Response) => {
  const violations = architectCosContract.getViolationLog();
  const last24h = violations.filter(v => {
    const vTime = new Date(v.timestamp).getTime();
    const oneDayAgo = Date.now() - 86400000;
    return vTime > oneDayAgo;
  });

  res.json({
    total: violations.length,
    last24h: last24h.length,
    violations: violations.slice(-50) // Last 50
  });
});

export default router;
