import { Router, Request, Response } from 'express';
import { roleCascade } from '../services/role-cascade';

const router = Router();

/**
 * GET /api/role-cascade/status
 * Returns the current status of the Role Cascade Directive
 */
router.get('/status', (_req: Request, res: Response) => {
  const status = roleCascade.getStatus();
  res.json(status);
});

/**
 * POST /api/role-cascade/integrate
 * Integrates the Role Cascade Directive v1.0
 */
router.post('/integrate', (_req: Request, res: Response) => {
  const status = roleCascade.integrate();
  res.json({
    success: true,
    message: 'Role Cascade v1.0 integrated',
    status
  });
});

/**
 * GET /api/role-cascade/acknowledgment
 * Returns the CoS acknowledgment for Role Cascade
 */
router.get('/acknowledgment', (_req: Request, res: Response) => {
  const acknowledgment = roleCascade.generateCosAcknowledgment();
  res.json(acknowledgment);
});

/**
 * GET /api/role-cascade/agents
 * Returns all active agents with their inherited roles
 */
router.get('/agents', (_req: Request, res: Response) => {
  const agents = roleCascade.getActiveAgents();
  res.json({
    count: agents.length,
    agents
  });
});

/**
 * GET /api/role-cascade/agents/:agentId
 * Returns a specific agent's responsibilities
 */
router.get('/agents/:agentId', (req: Request, res: Response) => {
  const { agentId } = req.params;
  const responsibilities = roleCascade.getAgentResponsibilities(agentId);
  const inheritedCycles = roleCascade.getInheritedOdarCycles(agentId);
  
  if (responsibilities.length === 0) {
    return res.status(404).json({ error: `Agent not found: ${agentId}` });
  }
  
  res.json({
    agentId,
    responsibilities,
    inheritedOdarCycles: inheritedCycles
  });
});

/**
 * GET /api/role-cascade/mappings
 * Returns all role mappings
 */
router.get('/mappings', (_req: Request, res: Response) => {
  const mappings = roleCascade.getRoleMappings();
  res.json({
    count: mappings.length,
    mappings
  });
});

/**
 * GET /api/role-cascade/remapped/:originalRole
 * Returns the remapped agents for an original role
 */
router.get('/remapped/:originalRole', (req: Request, res: Response) => {
  const { originalRole } = req.params;
  const remappedTo = roleCascade.getRemappedAgent(originalRole);
  
  if (remappedTo.length === 0) {
    return res.status(404).json({ error: `Original role not found: ${originalRole}` });
  }
  
  res.json({
    originalRole,
    remappedTo
  });
});

export default router;
