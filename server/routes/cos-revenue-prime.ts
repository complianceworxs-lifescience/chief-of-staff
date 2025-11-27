/**
 * COS REVENUE PRIME API ROUTES
 * 
 * Endpoints for L6 Revenue Prime directive management
 */

import { Router, Request, Response } from 'express';
import { 
  cosRevenuePrime, 
  COS_L6_SYSTEM_PROMPT,
  applyRevenueFilter 
} from '../services/cos-revenue-prime';
import { sendPipelineFlushReport } from '../services/gmail-sender';

const router = Router();

// ============================================================================
// ACTIVATION & STATUS
// ============================================================================

/**
 * POST /api/revenue-prime/activate
 * Activate the Revenue Prime directive (L6)
 * Requires Architect authorization
 */
router.post('/activate', (req: Request, res: Response) => {
  const { authorization, directiveId } = req.body;
  
  // Validate authorization - must be Architect
  if (authorization !== 'Architect') {
    return res.status(403).json({
      success: false,
      error: 'AUTHORIZATION_REQUIRED',
      message: 'Revenue Prime L6 activation requires Architect authorization',
      hint: 'Include { "authorization": "Architect" } in request body'
    });
  }
  
  const result = cosRevenuePrime.activate({ 
    authorization, 
    directiveId: directiveId || 'OPERATION_REVENUE_PRIME' 
  });
  
  if (!result.success) {
    return res.status(403).json({
      success: false,
      governanceVerdict: result.governanceVerdict,
      reason: result.reason
    });
  }
  
  res.json({
    success: result.success,
    message: 'Revenue Prime directive activated - CoS now operating at SCOPED L6 as Revenue Commander',
    activatedAt: result.activatedAt,
    authority: 'SCOPED L6 - Within VQS/Governance Constraints',
    governanceVerdict: result.governanceVerdict,
    scopedConstraints: result.scopedConstraints,
    reason: result.reason
  });
});

/**
 * POST /api/revenue-prime/deactivate
 * Deactivate Revenue Prime (return to L5)
 */
router.post('/deactivate', (req: Request, res: Response) => {
  const result = cosRevenuePrime.deactivate();
  res.json({
    success: result.success,
    message: 'Revenue Prime directive deactivated - CoS returning to L5 operation',
    deactivatedAt: result.deactivatedAt
  });
});

/**
 * GET /api/revenue-prime/status
 * Get current Revenue Prime status
 */
router.get('/status', (req: Request, res: Response) => {
  const status = cosRevenuePrime.getStatus();
  res.json({
    directive: 'OPERATION_REVENUE_PRIME',
    version: '1.0.0',
    ...status
  });
});

/**
 * GET /api/revenue-prime/system-prompt
 * Get the L6 system prompt for CoS
 */
router.get('/system-prompt', (req: Request, res: Response) => {
  const status = cosRevenuePrime.getStatus();
  
  if (!status.activated) {
    return res.json({
      activated: false,
      message: 'Revenue Prime not active - no L6 system prompt available',
      prompt: null
    });
  }
  
  res.json({
    activated: true,
    authority: status.authority,
    prompt: COS_L6_SYSTEM_PROMPT
  });
});

/**
 * GET /api/revenue-prime/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', (req: Request, res: Response) => {
  const dashboard = cosRevenuePrime.getDashboard();
  res.json({
    directive: 'OPERATION_REVENUE_PRIME',
    ...dashboard
  });
});

// ============================================================================
// REVENUE FILTER
// ============================================================================

/**
 * POST /api/revenue-prime/filter/evaluate
 * Evaluate a task through the Revenue Filter
 */
router.post('/filter/evaluate', (req: Request, res: Response) => {
  const { taskId, taskDescription, sourceAgent } = req.body;
  
  if (!taskDescription) {
    return res.status(400).json({
      error: 'MISSING_TASK_DESCRIPTION',
      message: 'taskDescription is required'
    });
  }
  
  const evaluation = cosRevenuePrime.evaluateTask(
    taskId || `task_${Date.now()}`,
    taskDescription,
    sourceAgent
  );
  
  res.json({
    success: true,
    evaluation
  });
});

/**
 * POST /api/revenue-prime/filter/test
 * Test the Revenue Filter without logging (preview mode)
 */
router.post('/filter/test', (req: Request, res: Response) => {
  const { taskDescription } = req.body;
  
  if (!taskDescription) {
    return res.status(400).json({
      error: 'MISSING_TASK_DESCRIPTION',
      message: 'taskDescription is required'
    });
  }
  
  const result = applyRevenueFilter(taskDescription);
  
  res.json({
    preview: true,
    taskDescription,
    result
  });
});

/**
 * GET /api/revenue-prime/filter/recent
 * Get recent task evaluations
 */
router.get('/filter/recent', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const evaluations = cosRevenuePrime.getRecentEvaluations(limit);
  
  res.json({
    total: evaluations.length,
    evaluations
  });
});

// ============================================================================
// BLACK SWAN DEFENSE
// ============================================================================

/**
 * POST /api/revenue-prime/black-swan/check
 * Check for Black Swan conditions
 */
router.post('/black-swan/check', async (req: Request, res: Response) => {
  const { expectedRevenue, actualRevenue } = req.body;
  
  if (expectedRevenue === undefined || actualRevenue === undefined) {
    return res.status(400).json({
      error: 'MISSING_REVENUE_DATA',
      message: 'expectedRevenue and actualRevenue are required'
    });
  }
  
  const event = await cosRevenuePrime.checkBlackSwanConditions(
    expectedRevenue,
    actualRevenue
  );
  
  if (event) {
    res.json({
      triggered: true,
      event
    });
  } else {
    res.json({
      triggered: false,
      message: 'Revenue within acceptable threshold',
      revenueDelta: ((expectedRevenue - actualRevenue) / expectedRevenue * 100).toFixed(2) + '%'
    });
  }
});

/**
 * GET /api/revenue-prime/black-swan/events
 * Get Black Swan events
 */
router.get('/black-swan/events', (req: Request, res: Response) => {
  const status = req.query.status as 'ACTIVE' | 'RESOLVED' | 'ESCALATED' | undefined;
  const events = cosRevenuePrime.getBlackSwanEvents(status);
  
  res.json({
    total: events.length,
    filter: status || 'all',
    events
  });
});

/**
 * POST /api/revenue-prime/black-swan/resolve
 * Resolve a Black Swan event
 */
router.post('/black-swan/resolve', (req: Request, res: Response) => {
  const { eventId, resolution } = req.body;
  
  if (!eventId || !resolution) {
    return res.status(400).json({
      error: 'MISSING_PARAMS',
      message: 'eventId and resolution are required'
    });
  }
  
  const event = cosRevenuePrime.resolveBlackSwanEvent(eventId, resolution);
  
  if (!event) {
    return res.status(404).json({
      error: 'EVENT_NOT_FOUND',
      message: `Black Swan event ${eventId} not found`
    });
  }
  
  res.json({
    success: true,
    event
  });
});

/**
 * PATCH /api/revenue-prime/black-swan/config
 * Update Black Swan configuration
 */
router.patch('/black-swan/config', (req: Request, res: Response) => {
  const updates = req.body;
  const config = cosRevenuePrime.updateBlackSwanConfig(updates);
  
  res.json({
    success: true,
    config
  });
});

// ============================================================================
// SUB-AGENT COMMAND
// ============================================================================

/**
 * POST /api/revenue-prime/command/pause-campaign
 * Pause a campaign (L6 authority)
 */
router.post('/command/pause-campaign', (req: Request, res: Response) => {
  const { campaignId, reason } = req.body;
  
  if (!campaignId || !reason) {
    return res.status(400).json({
      error: 'MISSING_PARAMS',
      message: 'campaignId and reason are required'
    });
  }
  
  const result = cosRevenuePrime.pauseCampaign(campaignId, reason);
  res.json(result);
});

/**
 * POST /api/revenue-prime/command/reallocate
 * Reallocate resources between agents (L6 authority)
 */
router.post('/command/reallocate', (req: Request, res: Response) => {
  const { allocations } = req.body;
  
  if (!allocations || typeof allocations !== 'object') {
    return res.status(400).json({
      error: 'MISSING_ALLOCATIONS',
      message: 'allocations object is required (e.g., { Marketing: 30, CRO: 40, Tech: 15, Content: 15 })'
    });
  }
  
  const result = cosRevenuePrime.reallocateResources(allocations);
  res.json(result);
});

// ============================================================================
// PIPELINE FLUSH
// ============================================================================

/**
 * POST /api/revenue-prime/pipeline-flush
 * Execute Total Pipeline Flush - purge all legacy L5 activities
 * Requires Revenue Prime to be activated
 */
router.post('/pipeline-flush', (req: Request, res: Response) => {
  const { tasks } = req.body;
  
  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({
      error: 'MISSING_TASKS',
      message: 'tasks array is required with objects containing: id, description, type, source?, estimatedValue?'
    });
  }
  
  const result = cosRevenuePrime.executePipelineFlush(tasks);
  
  if (!result.success) {
    return res.status(403).json({
      error: 'REVENUE_PRIME_NOT_ACTIVE',
      message: 'Revenue Prime must be activated to execute Pipeline Flush'
    });
  }
  
  res.json(result);
});

/**
 * POST /api/revenue-prime/pipeline-flush/from-database
 * Execute Pipeline Flush using tasks from database
 */
router.post('/pipeline-flush/from-database', async (req: Request, res: Response) => {
  try {
    // Import database and fetch active tasks
    const { db } = await import('../db');
    const { agentTasks, conflicts, initiatives } = await import('@shared/schema');
    const { eq, or, and, isNull, not } = await import('drizzle-orm');
    
    // Gather tasks from multiple sources
    const tasks: Array<{
      id: string;
      description: string;
      type: string;
      source?: string;
      estimatedValue?: number;
    }> = [];
    
    // 1. Get active agent tasks
    try {
      const agentTasksData = await db.select().from(agentTasks).limit(100);
      for (const task of agentTasksData) {
        tasks.push({
          id: `task_${task.id}`,
          description: task.description || task.title || 'Agent task',
          type: 'agent_task',
          source: task.agentName || 'Unknown'
        });
      }
    } catch (e) {
      // Table may not exist
    }
    
    // 2. Get unresolved conflicts
    try {
      const conflictsData = await db.select().from(conflicts)
        .where(not(eq(conflicts.status, 'resolved')))
        .limit(50);
      for (const conflict of conflictsData) {
        tasks.push({
          id: `conflict_${conflict.id}`,
          description: conflict.description,
          type: 'conflict',
          source: 'ConflictResolver'
        });
      }
    } catch (e) {
      // Table may not exist
    }
    
    // 3. Get active initiatives
    try {
      const initiativesData = await db.select().from(initiatives)
        .where(not(eq(initiatives.status, 'completed')))
        .limit(50);
      for (const initiative of initiativesData) {
        tasks.push({
          id: `initiative_${initiative.id}`,
          description: initiative.description,
          type: 'initiative',
          source: 'Strategic'
        });
      }
    } catch (e) {
      // Table may not exist
    }
    
    if (tasks.length === 0) {
      return res.json({
        success: true,
        message: 'No tasks found in database to flush',
        report: {
          totalTasksProcessed: 0,
          p1DirectRevenue: { count: 0, tasks: [], estimatedTotalValue: 0 },
          p2Nurture: { count: 0, tasks: [], status: 'NO_TASKS' },
          p3SupportAdmin: { count: 0, killed: [], automated: [], totalTerminated: 0 },
          resourceReallocation: { p1Allocation: '100%', message: 'Ready for P1 tasks' }
        }
      });
    }
    
    const result = cosRevenuePrime.executePipelineFlush(tasks);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      error: 'FLUSH_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// EMAIL REPORT
// ============================================================================

/**
 * POST /api/revenue-prime/send-report
 * Send Pipeline Flush Report via email
 */
router.post('/send-report', async (req: Request, res: Response) => {
  const { to, flushReport } = req.body;
  
  if (!to || !flushReport) {
    return res.status(400).json({
      error: 'MISSING_PARAMS',
      message: 'to (email address) and flushReport are required'
    });
  }
  
  try {
    const result = await sendPipelineFlushReport(to, flushReport);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Pipeline Flush Report sent to ${to}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// AUDIT TRAIL
// ============================================================================

/**
 * GET /api/revenue-prime/audit
 * Get audit log
 */
router.get('/audit', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const auditLog = cosRevenuePrime.getAuditLog(limit);
  
  res.json({
    total: auditLog.length,
    entries: auditLog
  });
});

export default router;
