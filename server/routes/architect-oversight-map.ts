/**
 * 7-DAY ARCHITECT OVERSIGHT MAP API ROUTES
 * 
 * Endpoints for the Architect's daily monitoring and decision-making
 * during the L6 Acceleration Protocol.
 */

import { Router, Request, Response } from 'express';
import { architectOversightMap } from '../services/architect-oversight-map';

const router = Router();

/**
 * POST /api/architect-oversight/initialize
 * Initialize the 7-Day Oversight Map (Architect only)
 */
router.post('/initialize', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can initialize the Oversight Map'
    });
  }

  try {
    const oversightMap = architectOversightMap.initialize();
    
    res.json({
      success: true,
      message: '7-DAY ARCHITECT OVERSIGHT MAP INITIALIZED',
      map: {
        name: oversightMap.name,
        scope: oversightMap.scope,
        horizonDays: oversightMap.horizonDays,
        currentDay: oversightMap.currentDay,
        objectives: oversightMap.objectives,
        activatedAt: oversightMap.activatedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to initialize oversight map',
      message: error.message
    });
  }
});

/**
 * GET /api/architect-oversight/status
 * Get current oversight map status
 */
router.get('/status', (req: Request, res: Response) => {
  const status = architectOversightMap.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      message: 'Oversight map not initialized'
    });
  }

  res.json({
    active: true,
    name: status.name,
    scope: status.scope,
    horizonDays: status.horizonDays,
    currentDay: status.currentDay,
    objectives: status.objectives,
    verdict: status.verdict,
    safetyGuards: status.safetyGuards,
    activatedAt: status.activatedAt
  });
});

/**
 * GET /api/architect-oversight/daily-view
 * Get the Architect's daily view dashboard
 */
router.get('/daily-view', (req: Request, res: Response) => {
  try {
    const view = architectOversightMap.getArchitectDailyView();
    const status = architectOversightMap.getStatus();
    
    res.json({
      day: status?.currentDay || 1,
      view,
      focusAreas: status?.dailyFocus[status.currentDay - 1]?.focus || []
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get daily view',
      message: error.message
    });
  }
});

/**
 * GET /api/architect-oversight/metrics
 * Get all tracked metrics with current values
 */
router.get('/metrics', (req: Request, res: Response) => {
  const status = architectOversightMap.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      metrics: []
    });
  }

  res.json({
    active: true,
    currentDay: status.currentDay,
    metrics: status.metricsTracked.map(m => ({
      name: m.name,
      source: m.source,
      target: m.target,
      currentValue: m.currentValue,
      targetMet: m.targetMet,
      alertActive: m.alertActive,
      trend: m.trend
    }))
  });
});

/**
 * GET /api/architect-oversight/alerts
 * Get currently triggered alerts
 */
router.get('/alerts', (req: Request, res: Response) => {
  const alerts = architectOversightMap.getActiveAlerts();
  
  res.json({
    alertCount: alerts.length,
    alerts
  });
});

/**
 * GET /api/architect-oversight/day-focus
 * Get focus areas for all days
 */
router.get('/day-focus', (req: Request, res: Response) => {
  const status = architectOversightMap.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      focus: []
    });
  }

  res.json({
    active: true,
    currentDay: status.currentDay,
    focus: status.dailyFocus
  });
});

/**
 * GET /api/architect-oversight/day-focus/:day
 * Get focus areas for a specific day
 */
router.get('/day-focus/:day', (req: Request, res: Response) => {
  const day = parseInt(req.params.day);
  const status = architectOversightMap.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      focus: null
    });
  }

  if (day < 1 || day > 7) {
    return res.status(400).json({
      error: 'Invalid day',
      message: 'Day must be between 1 and 7'
    });
  }

  res.json({
    active: true,
    day,
    isCurrent: day === status.currentDay,
    focus: status.dailyFocus[day - 1]
  });
});

/**
 * POST /api/architect-oversight/generate-report
 * Generate a daily cycle report (Architect only)
 */
router.post('/generate-report', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can generate daily reports'
    });
  }

  try {
    const report = architectOversightMap.generateDailyCycleReport();
    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

/**
 * GET /api/architect-oversight/daily-reports
 * Get all daily cycle reports
 */
router.get('/daily-reports', (req: Request, res: Response) => {
  const status = architectOversightMap.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      reports: []
    });
  }

  res.json({
    active: true,
    currentDay: status.currentDay,
    totalReports: status.dailyReports.length,
    reports: status.dailyReports
  });
});

/**
 * POST /api/architect-oversight/decision
 * Record an Architect decision (Architect only)
 */
router.post('/decision', (req: Request, res: Response) => {
  const { authorization, decision, reasoning, target } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can record decisions'
    });
  }

  const validDecisions = architectOversightMap.getDecisionSpace();
  if (!validDecisions.includes(decision)) {
    return res.status(400).json({
      error: 'Invalid decision',
      validDecisions
    });
  }

  if (!reasoning) {
    return res.status(400).json({
      error: 'reasoning is required'
    });
  }

  try {
    const decisionRecord = architectOversightMap.recordDecision(decision, reasoning, target);
    res.json({
      success: true,
      decision: decisionRecord
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to record decision',
      message: error.message
    });
  }
});

/**
 * GET /api/architect-oversight/decisions
 * Get all Architect decisions
 */
router.get('/decisions', (req: Request, res: Response) => {
  const status = architectOversightMap.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      decisions: []
    });
  }

  res.json({
    active: true,
    currentDay: status.currentDay,
    totalDecisions: status.decisions.length,
    decisions: status.decisions
  });
});

/**
 * GET /api/architect-oversight/decision-space
 * Get available decision options
 */
router.get('/decision-space', (req: Request, res: Response) => {
  const decisions = architectOversightMap.getDecisionSpace();
  
  res.json({
    decisions,
    descriptions: {
      no_action_required: 'No intervention needed - metrics are on track',
      minor_correction_to_cos: 'Issue a minor correction directive to CoS',
      major_correction_request_to_strategist: 'Escalate to Strategist for major correction',
      freeze_specific_agent: 'Freeze a specific agent to prevent further drift',
      reset_specific_metric_window: 'Reset the measurement window for a specific metric'
    }
  });
});

/**
 * POST /api/architect-oversight/advance-day
 * Complete current day and advance to next (Architect only)
 */
router.post('/advance-day', (req: Request, res: Response) => {
  const { authorization } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can advance days'
    });
  }

  try {
    const result = architectOversightMap.advanceDay();
    res.json({
      success: true,
      previousDay: result.previousDay,
      newDay: result.newDay,
      verdict: result.verdict || null,
      message: result.verdict 
        ? `Day 7 complete. Verdict: ${result.verdict.toUpperCase()}`
        : `Advanced to Day ${result.newDay}`
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to advance day',
      message: error.message
    });
  }
});

/**
 * POST /api/architect-oversight/finding
 * Add a finding to current day (Architect only)
 */
router.post('/finding', (req: Request, res: Response) => {
  const { authorization, finding } = req.body;

  if (authorization !== 'Architect') {
    return res.status(403).json({
      error: 'AUTHORITY VIOLATION',
      reason: 'Only Architect can add findings'
    });
  }

  if (!finding) {
    return res.status(400).json({
      error: 'finding is required'
    });
  }

  architectOversightMap.addFinding(finding);
  
  res.json({
    success: true,
    message: 'Finding added',
    finding
  });
});

/**
 * GET /api/architect-oversight/safety-guards
 * Get safety guard status
 */
router.get('/safety-guards', (req: Request, res: Response) => {
  const guards = architectOversightMap.getSafetyGuards();
  
  if (!guards) {
    return res.json({
      active: false,
      guards: null
    });
  }

  res.json({
    active: true,
    guards,
    allEnforced: true
  });
});

/**
 * GET /api/architect-oversight/verdict
 * Get current verdict (only meaningful on Day 7)
 */
router.get('/verdict', (req: Request, res: Response) => {
  const status = architectOversightMap.getStatus();
  
  if (!status) {
    return res.json({
      active: false,
      verdict: null
    });
  }

  res.json({
    active: true,
    currentDay: status.currentDay,
    verdictRendered: status.currentDay === 7 && status.verdict !== 'pending',
    verdict: status.verdict,
    nextSteps: status.verdict === 'improving' 
      ? 'Define next 7-day refinement cycle'
      : status.verdict === 'stalled'
        ? 'Strategist + CoS to generate root-cause plan'
        : 'Pending Day 7 completion'
  });
});

export default router;
