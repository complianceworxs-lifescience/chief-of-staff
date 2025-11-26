import { Router, Request, Response } from 'express';
import { compressedDirective } from '../services/compressed-directive';

const router = Router();

/**
 * GET /api/directive/compressed
 * Returns the token-optimized compressed directive
 */
router.get('/compressed', (_req: Request, res: Response) => {
  const directive = compressedDirective.getDirective();
  const tokenCount = compressedDirective.getTokenCount();
  
  res.json({
    directive,
    metadata: {
      tokenCount,
      compressionRatio: "35-50% more efficient than full version",
      format: "machine-optimized",
      readyForIngestion: true
    }
  });
});

/**
 * GET /api/directive/72h-sprint
 * Returns the full 72-hour execution plan
 */
router.get('/72h-sprint', (_req: Request, res: Response) => {
  const plan = compressedDirective.getExecutionPlan();
  const progress = compressedDirective.getSprintProgress();
  
  res.json({
    plan,
    progress,
    expectedOutcomes: compressedDirective.getExpectedOutcomes()
  });
});

/**
 * GET /api/directive/72h-sprint/progress
 * Returns current sprint progress summary
 */
router.get('/72h-sprint/progress', (_req: Request, res: Response) => {
  const progress = compressedDirective.getSprintProgress();
  
  res.json({
    status: 'active',
    ...progress
  });
});

/**
 * GET /api/directive/72h-sprint/phase/:phase
 * Returns tasks for a specific phase
 */
router.get('/72h-sprint/phase/:phase', (req: Request, res: Response) => {
  const { phase } = req.params;
  const validPhases = ['0-24h', '24-48h', '48-72h'];
  
  if (!validPhases.includes(phase)) {
    return res.status(400).json({ error: 'Invalid phase. Use: 0-24h, 24-48h, or 48-72h' });
  }
  
  const tasks = compressedDirective.getPhaseTasks(phase as '0-24h' | '24-48h' | '48-72h');
  const progress = compressedDirective.getSprintProgress();
  
  res.json({
    phase,
    objective: phase === '0-24h' ? 'INSTALL + LINK DATA' :
               phase === '24-48h' ? 'EXECUTE + TEST' :
               'OPTIMIZE + SYNTHESIZE',
    tasks,
    phaseProgress: progress.byPhase[phase] || { completed: 0, total: 0 }
  });
});

/**
 * GET /api/directive/72h-sprint/agent/:agent
 * Returns tasks for a specific agent
 */
router.get('/72h-sprint/agent/:agent', (req: Request, res: Response) => {
  const { agent } = req.params;
  const tasks = compressedDirective.getAgentTasks(agent);
  const progress = compressedDirective.getSprintProgress();
  
  if (tasks.length === 0) {
    return res.status(404).json({ error: `No tasks found for agent: ${agent}` });
  }
  
  res.json({
    agent,
    tasks,
    agentProgress: progress.byAgent[agent] || { completed: 0, total: 0, inProgress: 0, blocked: 0 }
  });
});

/**
 * PATCH /api/directive/72h-sprint/milestone/:id
 * Update a milestone's status
 */
router.patch('/72h-sprint/milestone/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, blockedReason } = req.body;
  
  const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use: pending, in_progress, completed, or blocked' });
  }
  
  const milestone = compressedDirective.updateMilestoneStatus(id, status, blockedReason);
  
  if (!milestone) {
    return res.status(404).json({ error: `Milestone not found: ${id}` });
  }
  
  res.json({
    success: true,
    milestone,
    updatedProgress: compressedDirective.getSprintProgress()
  });
});

/**
 * GET /api/directive/72h-sprint/blocked
 * Returns all blocked milestones
 */
router.get('/72h-sprint/blocked', (_req: Request, res: Response) => {
  const blocked = compressedDirective.getBlockedMilestones();
  
  res.json({
    blockedCount: blocked.length,
    milestones: blocked,
    requiresIntervention: blocked.length > 0
  });
});

/**
 * POST /api/directive/72h-sprint/initiate
 * Initiates a new 72-hour sprint (resets all milestones)
 */
router.post('/72h-sprint/initiate', (_req: Request, res: Response) => {
  const plan = compressedDirective.initiate72HourSprint();
  
  res.json({
    success: true,
    message: '72-Hour Integration Sprint Initiated',
    plan,
    expectedOutcomes: compressedDirective.getExpectedOutcomes()
  });
});

/**
 * GET /api/directive/cos-brief
 * Returns a CoS-optimized brief for dashboard integration
 */
router.get('/cos-brief', (_req: Request, res: Response) => {
  const directive = compressedDirective.getDirective();
  const progress = compressedDirective.getSprintProgress();
  const blocked = compressedDirective.getBlockedMilestones();
  
  res.json({
    title: 'ACP v1.0 Compressed Directive Brief',
    version: directive.version,
    sprintStatus: {
      phase: progress.phase,
      percentComplete: progress.percentComplete,
      hoursRemaining: progress.hoursRemaining
    },
    capabilities: directive.capabilities.map(c => ({
      id: c.id,
      name: c.name,
      owners: c.owners,
      successCriteria: c.successCriteria
    })),
    integrationRules: directive.integrationRules,
    agentProgress: progress.byAgent,
    blockedItems: blocked.length,
    cosEnforcement: directive.cosEnforcement
  });
});

export default router;
