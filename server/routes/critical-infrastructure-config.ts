/**
 * CRITICAL_INFRASTRUCTURE_CONFIG_v1.0 API Routes
 * 
 * Provides endpoints for infrastructure status, validation, and management.
 */

import { Router, Request, Response } from 'express';
import { criticalInfrastructureConfig } from '../services/critical-infrastructure-config';

const router = Router();

/**
 * GET /api/infrastructure/status
 * Get current infrastructure status and health
 */
router.get('/status', (req: Request, res: Response) => {
  const status = criticalInfrastructureConfig.getStatus();
  
  res.json({
    module: status.module,
    version: status.version,
    status: status.status,
    uptime: status.uptime,
    lastCheck: status.lastCheck,
    health: status.health,
    components: status.components,
    summary: {
      agents: `${status.agents.filter(a => a.status === 'active').length}/${status.agents.length} active`,
      secrets: `${status.secrets.filter(s => s.configured).length}/${status.secrets.length} configured`,
      stateFiles: `${status.stateFiles.filter(s => s.exists && s.valid).length}/${status.stateFiles.length} valid`,
      tasks: `${status.tasks.filter(t => t.status === 'completed').length}/${status.tasks.length} completed`
    }
  });
});

/**
 * GET /api/infrastructure/agents
 * Get agent status details
 */
router.get('/agents', (req: Request, res: Response) => {
  const status = criticalInfrastructureConfig.getStatus();
  
  res.json({
    total: status.agents.length,
    active: status.agents.filter(a => a.status === 'active').length,
    agents: status.agents.map(a => ({
      name: a.name,
      status: a.status,
      lastActivity: a.lastActivity,
      odarCyclesCompleted: a.odarCyclesCompleted,
      idleMinutes: Math.floor((Date.now() - new Date(a.lastActivity).getTime()) / 60000)
    }))
  });
});

/**
 * POST /api/infrastructure/agents/:name/activity
 * Update agent activity timestamp
 */
router.post('/agents/:name/activity', (req: Request, res: Response) => {
  const { name } = req.params;
  
  criticalInfrastructureConfig.updateAgentActivity(name);
  
  res.json({
    success: true,
    message: `Agent ${name} activity updated`,
    timestamp: new Date()
  });
});

/**
 * POST /api/infrastructure/agents/:name/odar-complete
 * Increment ODAR cycle count for agent
 */
router.post('/agents/:name/odar-complete', (req: Request, res: Response) => {
  const { name } = req.params;
  
  criticalInfrastructureConfig.incrementOdarCycle(name);
  
  res.json({
    success: true,
    message: `Agent ${name} ODAR cycle recorded`,
    timestamp: new Date()
  });
});

/**
 * GET /api/infrastructure/secrets
 * Get secrets configuration status (not values)
 */
router.get('/secrets', (req: Request, res: Response) => {
  const status = criticalInfrastructureConfig.getStatus();
  
  res.json({
    total: status.secrets.length,
    configured: status.secrets.filter(s => s.configured).length,
    missing: status.secrets.filter(s => !s.configured).length,
    secrets: status.secrets.map(s => ({
      key: s.key,
      configured: s.configured,
      lastValidated: s.lastValidated
    })),
    policy: [
      'No hard-coded secrets in source files',
      'Secrets must be rotated without code changes',
      'Agents read secrets from environment only'
    ]
  });
});

/**
 * GET /api/infrastructure/state-files
 * Get state file status
 */
router.get('/state-files', (req: Request, res: Response) => {
  const status = criticalInfrastructureConfig.getStatus();
  
  res.json({
    total: status.stateFiles.length,
    valid: status.stateFiles.filter(s => s.exists && s.valid).length,
    missing: status.stateFiles.filter(s => !s.exists).length,
    invalid: status.stateFiles.filter(s => s.exists && !s.valid).length,
    files: status.stateFiles,
    policy: [
      'These files must persist across restarts',
      'No agent may delete or overwrite without Architect-level logic',
      'Backups must be possible from these files alone'
    ]
  });
});

/**
 * GET /api/infrastructure/state-files/:filename
 * Read a specific state file
 */
router.get('/state-files/:filename', async (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = `state/${filename}`;
  
  const data = await criticalInfrastructureConfig.readStateFile(filePath);
  
  if (!data) {
    return res.status(404).json({
      error: 'State file not found or invalid',
      path: filePath
    });
  }
  
  res.json({
    path: filePath,
    data
  });
});

/**
 * GET /api/infrastructure/tasks
 * Get scheduled task status
 */
router.get('/tasks', (req: Request, res: Response) => {
  const status = criticalInfrastructureConfig.getStatus();
  
  res.json({
    interval: '120 minutes',
    total: status.tasks.length,
    completed: status.tasks.filter(t => t.status === 'completed').length,
    pending: status.tasks.filter(t => t.status === 'pending').length,
    failed: status.tasks.filter(t => t.status === 'failed').length,
    tasks: status.tasks.map(t => ({
      name: t.name,
      owner: t.owner,
      description: t.description,
      status: t.status,
      lastRun: t.lastRun,
      nextRun: t.nextRun,
      consecutiveFailures: t.consecutiveFailures
    }))
  });
});

/**
 * POST /api/infrastructure/validate
 * Trigger a manual validation cycle
 */
router.post('/validate', async (req: Request, res: Response) => {
  const { authorization } = req.body;
  
  if (!authorization || !['Architect', 'CoS'].includes(authorization)) {
    return res.status(403).json({
      error: 'Unauthorized',
      message: 'Only Architect or CoS may trigger validation cycles',
      required: ['Architect', 'CoS']
    });
  }

  try {
    const result = await criticalInfrastructureConfig.runValidationCycle();
    
    res.json({
      success: true,
      message: 'Validation cycle completed',
      result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Validation cycle failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/infrastructure/logs
 * Get recent infrastructure logs
 */
router.get('/logs', (req: Request, res: Response) => {
  const status = criticalInfrastructureConfig.getStatus();
  const { level, category, limit = '50' } = req.query;
  
  let logs = status.recentLogs;
  
  if (level) {
    logs = logs.filter(l => l.level === level);
  }
  
  if (category) {
    logs = logs.filter(l => l.category === category);
  }
  
  const limitNum = parseInt(limit as string, 10) || 50;
  
  res.json({
    total: logs.length,
    limit: limitNum,
    logs: logs.slice(-limitNum).reverse()
  });
});

/**
 * GET /api/infrastructure/health
 * Get infrastructure health summary
 */
router.get('/health', (req: Request, res: Response) => {
  const status = criticalInfrastructureConfig.getStatus();
  
  res.json({
    score: status.health.score,
    status: status.status,
    uptime: status.uptime,
    issues: status.health.issues,
    recommendations: status.health.recommendations,
    components: Object.entries(status.components).map(([name, healthy]) => ({
      name,
      healthy,
      status: healthy ? 'OK' : 'ISSUE'
    }))
  });
});

/**
 * GET /api/infrastructure/networking
 * Get networking configuration
 */
router.get('/networking', (req: Request, res: Response) => {
  res.json({
    outboundTargets: [
      { target: 'https://api.openai.com', purpose: 'OpenAI API' },
      { target: 'https://generativelanguage.googleapis.com', purpose: 'Gemini API' },
      { target: 'https://usX.api.mailchimp.com', purpose: 'Mailchimp API (region-specific)' },
      { target: 'internal/UDL_ENDPOINTS', purpose: 'Unified Data Layer' },
      { target: 'future/linked_in_signals', purpose: 'LinkedIn (placeholder)' }
    ],
    policy: [
      'All agent-to-agent and agent-to-service calls must use configured clients',
      'No direct raw HTTP in business logic; use shared clients/wrappers',
      'Network failures must trigger TRANSIENT error handling, not crashes'
    ]
  });
});

export default router;
