/**
 * L6 ACCELERATION PROTOCOL API ROUTES
 * 
 * Endpoints for managing the 7-day sprint acceleration protocol
 * All protocol execution requires Architect authorization
 */

import { Router, Request, Response } from 'express';
import { l6AccelerationProtocol } from '../services/l6-acceleration-protocol';

const router = Router();

/**
 * POST /api/l6-acceleration/execute
 * Execute the L6 Acceleration Protocol (Architect only)
 */
router.post('/execute', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can execute L6 Acceleration Protocol',
      requiredAuthority: 'Architect'
    });
  }

  try {
    const protocol = l6AccelerationProtocol.executeProtocol();
    
    res.json({
      success: true,
      message: 'L6 ACCELERATION PROTOCOL ACTIVATED',
      mode: '7_day_sprint',
      binding: true,
      protocol: {
        command: protocol.command,
        activatedAt: protocol.activatedAt,
        expiresAt: protocol.expiresAt,
        currentDay: protocol.currentDay,
        status: protocol.status,
        interventions: protocol.interventions.map(i => ({
          agent: i.agent,
          action: i.action,
          targetMetric: i.targetMetric,
          status: i.status
        })),
        constraints: protocol.constraints
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to execute protocol',
      message: error.message
    });
  }
});

/**
 * GET /api/l6-acceleration/status
 * Get current protocol status
 */
router.get('/status', (req: Request, res: Response) => {
  const protocol = l6AccelerationProtocol.getStatus();
  
  if (!protocol) {
    return res.json({
      active: false,
      message: 'No L6 Acceleration Protocol active'
    });
  }

  res.json({
    active: true,
    protocol: {
      command: protocol.command,
      mode: protocol.mode,
      binding: protocol.binding,
      status: protocol.status,
      currentDay: protocol.currentDay,
      daysRemaining: 7 - protocol.currentDay,
      activatedAt: protocol.activatedAt,
      expiresAt: protocol.expiresAt,
      interventions: protocol.interventions,
      constraints: protocol.constraints,
      metrics: protocol.metrics
    }
  });
});

/**
 * GET /api/l6-acceleration/architect-report
 * Get formatted Architect report (Architect or CoS only)
 */
router.get('/architect-report', (req: Request, res: Response) => {
  const report = l6AccelerationProtocol.getArchitectReport();
  res.json(report);
});

/**
 * GET /api/l6-acceleration/daily-reports
 * Get all daily reports
 */
router.get('/daily-reports', (req: Request, res: Response) => {
  const protocol = l6AccelerationProtocol.getStatus();
  
  if (!protocol) {
    return res.json({
      reports: [],
      message: 'No active protocol'
    });
  }

  res.json({
    currentDay: protocol.currentDay,
    totalReports: protocol.dailyReports.length,
    reports: protocol.dailyReports
  });
});

/**
 * POST /api/l6-acceleration/generate-report
 * Generate a new daily report (CoS or Architect only)
 */
router.post('/generate-report', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'CoS' && authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only CoS or Architect can generate daily reports'
    });
  }

  try {
    const report = l6AccelerationProtocol.generateDailyReport();
    res.json({
      success: true,
      report,
      generatedBy: authorization
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

/**
 * POST /api/l6-acceleration/force-udl-sync
 * Force an immediate UDL sync (CoS only)
 */
router.post('/force-udl-sync', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'CoS' && authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only CoS or Architect can force UDL sync'
    });
  }

  const result = l6AccelerationProtocol.forceUdlSync();
  
  res.json({
    success: result.success,
    rpmConfidence: result.rpmConfidence,
    rpmConfidencePercent: `${(result.rpmConfidence * 100).toFixed(1)}%`,
    target: '95%',
    targetMet: result.rpmConfidence >= 0.95,
    forcedBy: authorization
  });
});

/**
 * GET /api/l6-acceleration/udl-sync-log
 * Get UDL sync history
 */
router.get('/udl-sync-log', (req: Request, res: Response) => {
  const log = l6AccelerationProtocol.getUdlSyncLog();
  
  res.json({
    totalSyncs: log.length,
    targetInterval: '30 minutes',
    log: log.slice(-20) // Last 20 entries
  });
});

/**
 * GET /api/l6-acceleration/interventions
 * Get intervention status for all agents
 */
router.get('/interventions', (req: Request, res: Response) => {
  const protocol = l6AccelerationProtocol.getStatus();
  
  if (!protocol) {
    return res.json({
      active: false,
      interventions: []
    });
  }

  res.json({
    active: true,
    interventions: protocol.interventions.map(i => ({
      agent: i.agent,
      action: i.action,
      parameters: i.parameters,
      targetMetric: i.targetMetric,
      status: i.status,
      progress: `${i.progress}%`,
      executionCount: i.executionCount,
      lastExecution: i.lastExecution
    }))
  });
});

/**
 * POST /api/l6-acceleration/update-metrics
 * Update protocol metrics (CoS or Architect only)
 */
router.post('/update-metrics', (req: Request, res: Response) => {
  const { authorization, metrics } = req.body;

  if (authorization !== 'CoS' && authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only CoS or Architect can update metrics'
    });
  }

  l6AccelerationProtocol.updateMetrics(metrics);
  
  const protocol = l6AccelerationProtocol.getStatus();
  
  res.json({
    success: true,
    updatedBy: authorization,
    currentMetrics: protocol?.metrics
  });
});

/**
 * GET /api/l6-acceleration/constraints
 * Get active constraints
 */
router.get('/constraints', (req: Request, res: Response) => {
  const protocol = l6AccelerationProtocol.getStatus();
  
  if (!protocol) {
    return res.json({
      active: false,
      constraints: null
    });
  }

  res.json({
    active: true,
    constraints: protocol.constraints,
    enforcement: {
      l6SimulationAllowed: protocol.constraints.allowL6Simulation,
      l6ActivationBlocked: protocol.constraints.prohibitL6Activation,
      vqsProtected: protocol.constraints.protectVqs,
      agentMutationBlocked: protocol.constraints.noAgentMutation
    }
  });
});

/**
 * GET /api/l6-acceleration/l6-activation-check
 * Check if L6 activation is allowed
 */
router.get('/l6-activation-check', (req: Request, res: Response) => {
  const result = l6AccelerationProtocol.isL6ActivationAllowed();
  
  res.json({
    l6ActivationAllowed: result.allowed,
    reason: result.reason,
    requirement: 'Explicit Architect approval after ALL 5 L6 thresholds met'
  });
});

/**
 * POST /api/l6-acceleration/stop
 * Stop the protocol (Architect only)
 */
router.post('/stop', (req: Request, res: Response) => {
  const { authorization, reason } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can stop L6 Acceleration Protocol'
    });
  }

  l6AccelerationProtocol.stopProtocol();
  
  res.json({
    success: true,
    message: 'L6 Acceleration Protocol stopped',
    stoppedBy: 'Architect',
    reason: reason || 'Architect override'
  });
});

export default router;
