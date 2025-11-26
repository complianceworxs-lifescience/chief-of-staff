/**
 * L5 OPERATING SUITE API ROUTES
 * 
 * Endpoints for Sections A-F of the L5 Operating Suite
 */

import { Router, Request, Response } from 'express';
import { 
  l5OperatingSuite,
  ArchitectOverrideCommand,
  AUTOMATIC_ESCALATION_TRIGGERS,
  ARCHITECT_OVERRIDE_COMMANDS,
  COS_DAILY_DUTIES,
  L6_SIMULATION_CONFIG
} from '../services/l5-operating-suite';

const router = Router();

// ============================================================================
// SECTION F: ACTIVATION
// ============================================================================

/**
 * POST /api/l5-suite/activate
 * Activate the full L5 Operating Suite
 */
router.post('/activate', (req: Request, res: Response) => {
  const result = l5OperatingSuite.activate();
  res.json(result);
});

/**
 * GET /api/l5-suite/status
 * Get activation status and system state
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    suite: 'L5 OPERATING SUITE v1.0',
    ...l5OperatingSuite.getSystemState(),
    sections: {
      A: 'ARCHITECT–CoS ESCALATION CONTRACT (Binding)',
      B: 'ARCHITECT SUPERVISION PANEL (Internal HUD)',
      C: 'CoS EXECUTION PANEL (Operational HUD)',
      D: 'L5→L6 TRANSITION SIMULATION (Sandbox Only)',
      E: 'ARCHITECT OVERRIDE COMMANDS'
    }
  });
});

// ============================================================================
// SECTION A: ESCALATION TRIGGERS
// ============================================================================

/**
 * GET /api/l5-suite/escalation-triggers
 * Get all automatic escalation triggers
 */
router.get('/escalation-triggers', (req: Request, res: Response) => {
  res.json({
    total: AUTOMATIC_ESCALATION_TRIGGERS.length,
    triggers: l5OperatingSuite.getAutoEscalationTriggers()
  });
});

/**
 * GET /api/l5-suite/escalation-triggers/check
 * Check which escalation triggers are currently firing
 */
router.get('/escalation-triggers/check', (req: Request, res: Response) => {
  const triggered = l5OperatingSuite.checkAutoEscalationTriggers();
  res.json({
    triggeredCount: triggered.length,
    triggered,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/l5-suite/escalation-log
 * Get auto-escalation log
 */
router.get('/escalation-log', (req: Request, res: Response) => {
  const log = l5OperatingSuite.getAutoEscalationLog();
  res.json({
    total: log.length,
    pending: log.filter(e => e.status === 'pending').length,
    acknowledged: log.filter(e => e.status === 'acknowledged').length,
    resolved: log.filter(e => e.status === 'resolved').length,
    log
  });
});

/**
 * POST /api/l5-suite/escalation/acknowledge
 * Architect acknowledges an escalation
 */
router.post('/escalation/acknowledge', (req: Request, res: Response) => {
  const { triggerId, authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can acknowledge escalations'
    });
  }

  const success = l5OperatingSuite.acknowledgeAutoEscalation(triggerId);
  if (!success) {
    return res.status(404).json({
      error: 'Escalation not found or already acknowledged'
    });
  }

  res.json({ success: true, triggerId, status: 'acknowledged' });
});

/**
 * POST /api/l5-suite/escalation/resolve
 * Architect resolves an escalation
 */
router.post('/escalation/resolve', (req: Request, res: Response) => {
  const { triggerId, authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can resolve escalations'
    });
  }

  const success = l5OperatingSuite.resolveAutoEscalation(triggerId);
  if (!success) {
    return res.status(404).json({
      error: 'Escalation not found or already resolved'
    });
  }

  res.json({ success: true, triggerId, status: 'resolved' });
});

// ============================================================================
// SECTION A: CoS DUTIES
// ============================================================================

/**
 * GET /api/l5-suite/cos-duties
 * Get all CoS daily duties
 */
router.get('/cos-duties', (req: Request, res: Response) => {
  res.json({
    total: COS_DAILY_DUTIES.length,
    duties: l5OperatingSuite.getCoSDuties()
  });
});

// ============================================================================
// SECTION B: ARCHITECT SUPERVISION PANEL
// ============================================================================

/**
 * GET /api/l5-suite/architect-panel
 * Get full Architect Supervision Panel data
 */
router.get('/architect-panel', (req: Request, res: Response) => {
  const panel = l5OperatingSuite.getArchitectSupervisionPanel();
  res.json({
    section: 'B - ARCHITECT SUPERVISION PANEL',
    timestamp: new Date().toISOString(),
    ...panel
  });
});

/**
 * POST /api/l5-suite/architect-panel/update
 * Update Architect Supervision Panel data (internal use)
 */
router.post('/architect-panel/update', (req: Request, res: Response) => {
  const { authorization, updates } = req.body;

  if (authorization !== 'Architect' && authorization !== 'CoS') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect or CoS can update supervision panel'
    });
  }

  l5OperatingSuite.updateArchitectSupervisionPanel(updates);
  res.json({ success: true, message: 'Architect panel updated' });
});

// ============================================================================
// SECTION C: CoS EXECUTION PANEL
// ============================================================================

/**
 * GET /api/l5-suite/cos-panel
 * Get full CoS Execution Panel data
 */
router.get('/cos-panel', (req: Request, res: Response) => {
  const panel = l5OperatingSuite.getCoSExecutionPanel();
  res.json({
    section: 'C - CoS EXECUTION PANEL',
    timestamp: new Date().toISOString(),
    ...panel
  });
});

/**
 * POST /api/l5-suite/cos-panel/update
 * Update CoS Execution Panel data
 */
router.post('/cos-panel/update', (req: Request, res: Response) => {
  const { authorization, updates } = req.body;

  if (authorization !== 'CoS') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only CoS can update execution panel'
    });
  }

  l5OperatingSuite.updateCoSExecutionPanel(updates);
  res.json({ success: true, message: 'CoS panel updated' });
});

/**
 * POST /api/l5-suite/cos-panel/agent-status
 * Update specific agent status (CoS or Architect only)
 */
router.post('/cos-panel/agent-status', (req: Request, res: Response) => {
  const { agent, authorization, status, currentTask, budgetUsed, healthScore } = req.body;

  if (authorization !== 'CoS' && authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only CoS or Architect can update agent status'
    });
  }

  if (!agent) {
    return res.status(400).json({ error: 'agent is required' });
  }

  l5OperatingSuite.updateAgentStatus(agent, {
    status,
    currentTask,
    budgetUsed,
    healthScore,
    lastActivity: new Date().toISOString()
  });

  res.json({ success: true, agent, updatedBy: authorization, message: 'Agent status updated' });
});

// ============================================================================
// SECTION D: L6 TRANSITION SIMULATION
// ============================================================================

/**
 * GET /api/l5-suite/l6-simulation/config
 * Get L6 simulation configuration
 */
router.get('/l6-simulation/config', (req: Request, res: Response) => {
  res.json({
    section: 'D - L5→L6 TRANSITION SIMULATION',
    warning: 'SANDBOX ONLY - DO NOT ACTIVATE L6',
    config: L6_SIMULATION_CONFIG
  });
});

/**
 * POST /api/l5-suite/l6-simulation/run
 * Run L6 transition simulation (Architect only, sandbox only)
 */
router.post('/l6-simulation/run', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can run L6 simulation'
    });
  }

  const result = l5OperatingSuite.runL6Simulation();
  res.json({
    success: true,
    warning: 'SIMULATION ONLY - L6 REMAINS BLOCKED',
    result
  });
});

/**
 * GET /api/l5-suite/l6-simulation/history
 * Get L6 simulation history
 */
router.get('/l6-simulation/history', (req: Request, res: Response) => {
  const history = l5OperatingSuite.getL6SimulationHistory();
  res.json({
    total: history.length,
    simulations: history
  });
});

// ============================================================================
// SECTION E: ARCHITECT OVERRIDE COMMANDS
// ============================================================================

/**
 * GET /api/l5-suite/override-commands
 * Get all available override commands
 */
router.get('/override-commands', (req: Request, res: Response) => {
  res.json({
    section: 'E - ARCHITECT OVERRIDE COMMANDS',
    commands: l5OperatingSuite.getOverrideCommands()
  });
});

/**
 * POST /api/l5-suite/override/execute
 * Execute an Architect override command
 */
router.post('/override/execute', (req: Request, res: Response) => {
  const { command, authorization, confirmation } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can execute override commands'
    });
  }

  if (!command) {
    return res.status(400).json({ error: 'command is required' });
  }

  const validCommands: ArchitectOverrideCommand[] = [
    'ARCHITECT_OVERRIDE_FREEZE',
    'ARCHITECT_OVERRIDE_RESET',
    'ARCHITECT_OVERRIDE_RESTORE_VQS',
    'ARCHITECT_OVERRIDE_SANDBOX',
    'ARCHITECT_OVERRIDE_FORCE_L6_SIM',
    'ARCHITECT_OVERRIDE_SHUTDOWN'
  ];

  if (!validCommands.includes(command)) {
    return res.status(400).json({ 
      error: 'Invalid command',
      validCommands 
    });
  }

  const result = l5OperatingSuite.executeOverrideCommand(command, confirmation === true);
  
  if (!result.success && result.requiresConfirmation) {
    return res.status(400).json({
      error: 'Confirmation required',
      command,
      message: 'Set confirmation: true to execute this command'
    });
  }

  res.json(result);
});

/**
 * POST /api/l5-suite/override/unfreeze
 * Unfreeze system (reverse FREEZE command)
 */
router.post('/override/unfreeze', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can unfreeze system'
    });
  }

  const result = l5OperatingSuite.unfreezeSystem();
  res.json(result);
});

/**
 * POST /api/l5-suite/override/exit-sandbox
 * Exit sandbox mode
 */
router.post('/override/exit-sandbox', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can exit sandbox mode'
    });
  }

  const result = l5OperatingSuite.exitSandboxMode();
  res.json(result);
});

/**
 * POST /api/l5-suite/override/resume
 * Resume from shutdown
 */
router.post('/override/resume', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can resume from shutdown'
    });
  }

  const result = l5OperatingSuite.resumeFromShutdown();
  res.json(result);
});

/**
 * GET /api/l5-suite/override-history
 * Get override command history
 */
router.get('/override-history', (req: Request, res: Response) => {
  const history = l5OperatingSuite.getOverrideHistory();
  res.json({
    total: history.length,
    history
  });
});

export default router;
