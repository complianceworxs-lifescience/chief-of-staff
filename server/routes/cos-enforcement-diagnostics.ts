/**
 * CoS ENFORCEMENT DIAGNOSTICS v1.0 API ROUTES
 * 
 * Endpoints for L5 system integrity validation and CoS enforcement monitoring.
 */

import { Router, Request, Response } from 'express';
import { cosEnforcementDiagnostics } from '../services/cos-enforcement-diagnostics';

const router = Router();

/**
 * POST /api/cos-diagnostics/initialize
 * Initialize the CoS Enforcement Diagnostics system
 */
router.post('/initialize', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect' && authorization !== 'CoS') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect or CoS can initialize diagnostics'
    });
  }

  try {
    const diagnostics = cosEnforcementDiagnostics.initialize();
    
    res.json({
      success: true,
      message: 'CoS ENFORCEMENT DIAGNOSTICS v1.0 INITIALIZED',
      diagnostics: {
        name: diagnostics.name,
        scope: diagnostics.scope,
        frequencyHours: diagnostics.frequencyHours,
        currentAlertMode: diagnostics.currentAlertMode,
        nextCycleAt: diagnostics.nextCycleAt
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to initialize diagnostics',
      message: error.message
    });
  }
});

/**
 * GET /api/cos-diagnostics/status
 * Get current diagnostics status
 */
router.get('/status', (req: Request, res: Response) => {
  const status = cosEnforcementDiagnostics.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      message: 'CoS Enforcement Diagnostics not initialized'
    });
  }

  res.json({
    active: true,
    name: status.name,
    scope: status.scope,
    frequencyHours: status.frequencyHours,
    currentAlertMode: status.currentAlertMode,
    lastCycleAt: status.lastCycleAt,
    nextCycleAt: status.nextCycleAt,
    totalChecks: status.diagnosticChecks.length,
    checksPassed: status.diagnosticChecks.filter(c => c.status === 'pass').length,
    checksFailed: status.diagnosticChecks.filter(c => c.status === 'fail').length,
    checksWarning: status.diagnosticChecks.filter(c => c.status === 'warning').length,
    unresolvedViolations: status.violations.filter(v => !v.resolved).length,
    safety: status.safety
  });
});

/**
 * GET /api/cos-diagnostics/architect-panel
 * Get summary for Architect panel ingestion
 */
router.get('/architect-panel', (req: Request, res: Response) => {
  const summary = cosEnforcementDiagnostics.getArchitectPanelSummary();
  res.json(summary);
});

/**
 * GET /api/cos-diagnostics/checks
 * Get all diagnostic checks with current status
 */
router.get('/checks', (req: Request, res: Response) => {
  const status = cosEnforcementDiagnostics.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      checks: []
    });
  }

  res.json({
    active: true,
    currentAlertMode: status.currentAlertMode,
    checks: status.diagnosticChecks
  });
});

/**
 * GET /api/cos-diagnostics/violations
 * Get detected violations
 */
router.get('/violations', (req: Request, res: Response) => {
  const includeResolved = req.query.includeResolved === 'true';
  const violations = cosEnforcementDiagnostics.getViolations(includeResolved);
  
  res.json({
    total: violations.length,
    includeResolved,
    violations
  });
});

/**
 * GET /api/cos-diagnostics/corrections
 * Get applied corrections
 */
router.get('/corrections', (req: Request, res: Response) => {
  const pendingOnly = req.query.pendingOnly === 'true';
  const corrections = cosEnforcementDiagnostics.getCorrections(pendingOnly);
  
  res.json({
    total: corrections.length,
    pendingOnly,
    corrections
  });
});

/**
 * GET /api/cos-diagnostics/trends
 * Get RPM and stability trends
 */
router.get('/trends', (req: Request, res: Response) => {
  const trends = cosEnforcementDiagnostics.getTrends();
  res.json(trends);
});

/**
 * GET /api/cos-diagnostics/agent-statuses
 * Get all agent statuses
 */
router.get('/agent-statuses', (req: Request, res: Response) => {
  const status = cosEnforcementDiagnostics.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      agents: []
    });
  }

  res.json({
    active: true,
    agents: status.agentStatuses
  });
});

/**
 * GET /api/cos-diagnostics/cycle-history
 * Get diagnostic cycle history
 */
router.get('/cycle-history', (req: Request, res: Response) => {
  const status = cosEnforcementDiagnostics.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      cycles: []
    });
  }

  res.json({
    active: true,
    totalCycles: status.cycleSummaries.length,
    cycles: status.cycleSummaries.slice(-10) // Last 10 cycles
  });
});

/**
 * POST /api/cos-diagnostics/trigger-cycle
 * Manually trigger a diagnostic cycle (CoS or Architect only)
 */
router.post('/trigger-cycle', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'CoS' && authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only CoS or Architect can trigger diagnostic cycles'
    });
  }

  try {
    const summary = cosEnforcementDiagnostics.triggerManualCycle();
    
    res.json({
      success: true,
      message: 'Diagnostic cycle triggered',
      triggeredBy: authorization,
      summary
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to trigger diagnostic cycle',
      message: error.message
    });
  }
});

/**
 * POST /api/cos-diagnostics/agent-activity
 * Update agent activity (prevents idle timeout)
 */
router.post('/agent-activity', (req: Request, res: Response) => {
  const { agentName } = req.body;

  if (!agentName) {
    return res.status(400).json({
      error: 'agentName is required'
    });
  }

  cosEnforcementDiagnostics.updateAgentActivity(agentName);
  
  res.json({
    success: true,
    message: `Activity recorded for ${agentName}`,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/cos-diagnostics/safety
 * Get safety constraints
 */
router.get('/safety', (req: Request, res: Response) => {
  const status = cosEnforcementDiagnostics.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      safety: null
    });
  }

  res.json({
    active: true,
    safety: status.safety,
    allEnforced: true
  });
});

/**
 * GET /api/cos-diagnostics/required-reports
 * Get list of required reports for each cycle
 */
router.get('/required-reports', (req: Request, res: Response) => {
  res.json({
    reports: [
      'udl_sync_status',
      'odar_compliance_check',
      'drift_indicator_scan',
      'vqs_violation_scan',
      'offer_ladder_integrity',
      'agent_idle_time_report',
      'signal_density_delta',
      'rpm_confidence_delta',
      'revenue_stability_delta'
    ],
    description: 'These reports are generated automatically during each 2-hour diagnostic cycle'
  });
});

/**
 * POST /api/cos-diagnostics/stop
 * Stop diagnostic cycles (Architect only)
 */
router.post('/stop', (req: Request, res: Response) => {
  const { authorization, reason } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can stop diagnostic cycles'
    });
  }

  cosEnforcementDiagnostics.stop();
  
  res.json({
    success: true,
    message: 'CoS Enforcement Diagnostics stopped',
    stoppedBy: 'Architect',
    reason: reason || 'Architect override'
  });
});

export default router;
