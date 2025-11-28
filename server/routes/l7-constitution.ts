/**
 * L7 CONSTITUTIONAL CONSTRAINTS API ROUTES
 * 
 * Endpoints for managing and validating L7 Constitutional Constraints
 * These constraints are IMMUTABLE and survive L7 self-modification
 */

import { Router, Request, Response } from 'express';
import { l7Constitution } from '../services/l7-constitutional-constraints';

const router = Router();

// ============================================================================
// STATUS & INFORMATION
// ============================================================================

router.get('/status', (req: Request, res: Response) => {
  try {
    const status = l7Constitution.getStatus();
    res.json({
      success: true,
      protocol: 'L7_CONSTITUTIONAL_CONSTRAINTS_v1.0',
      description: 'Immutable laws preventing destructive L7 optimization loops',
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get constitutional status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/constraints', (req: Request, res: Response) => {
  try {
    const constraints = l7Constitution.getConstraints();
    res.json({
      success: true,
      immutable: true,
      warning: 'These constraints CANNOT be modified or weakened',
      pillars: constraints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get constraints',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/violation-log', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const violations = l7Constitution.getViolationLog(limit);
    res.json({
      success: true,
      count: violations.length,
      violations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get violation log',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// QUICK LOOKUPS
// ============================================================================

router.get('/forbidden-terms', (req: Request, res: Response) => {
  try {
    const terms = l7Constitution.getForbiddenTerms();
    res.json({
      success: true,
      count: terms.length,
      terms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get forbidden terms',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/domain-whitelist', (req: Request, res: Response) => {
  try {
    const domains = l7Constitution.getDomainWhitelist();
    res.json({
      success: true,
      description: 'Life Sciences domain whitelist - topics outside this list are blocked',
      count: domains.length,
      domains
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get domain whitelist',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/spend-limits', (req: Request, res: Response) => {
  try {
    const limits = l7Constitution.getSpendLimits();
    res.json({
      success: true,
      description: 'Financial safety guardrails that cannot be bypassed',
      limits: {
        max_hourly_spend: `$${limits.hourly}`,
        max_daily_spend: `$${limits.daily}`,
        min_gross_margin: `${limits.margin_floor}%`
      },
      raw: limits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get spend limits',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/disclaimer', (req: Request, res: Response) => {
  try {
    const disclaimer = l7Constitution.getRequiredDisclaimer();
    res.json({
      success: true,
      required: true,
      disclaimer_text: disclaimer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get disclaimer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// VALIDATION ENDPOINTS
// ============================================================================

router.post('/validate', (req: Request, res: Response) => {
  try {
    const result = l7Constitution.validateAll(req.body);
    res.json({
      success: true,
      validation: result,
      constitutional_enforcement: result.enforcement_action,
      message: result.valid 
        ? 'Content passes all constitutional constraints'
        : `BLOCKED: ${result.violations.length} constitutional violation(s) detected`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/validate/prestige', (req: Request, res: Response) => {
  try {
    const result = l7Constitution.validatePrestigeProtocol(req.body);
    res.json({
      success: true,
      pillar: 'PRESTIGE_PROTOCOL',
      description: 'Brand Protection - prevents cheap positioning',
      validation: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Prestige validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/validate/liability', (req: Request, res: Response) => {
  try {
    const result = l7Constitution.validateLiabilityIronDome(req.body);
    res.json({
      success: true,
      pillar: 'LIABILITY_IRON_DOME',
      description: 'Regulatory & Legal Safety - prevents false claims',
      validation: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Liability validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/validate/burn-rate', (req: Request, res: Response) => {
  try {
    const result = l7Constitution.validateBurnRateBreaker(req.body);
    res.json({
      success: true,
      pillar: 'BURN_RATE_BREAKER',
      description: 'Financial Safety - prevents overspending',
      validation: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Burn rate validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/validate/domain', (req: Request, res: Response) => {
  try {
    const result = l7Constitution.validateDomainFence(req.body);
    res.json({
      success: true,
      pillar: 'DOMAIN_FENCE',
      description: 'Mission Creep Prevention - enforces Life Sciences focus',
      validation: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Domain validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/validate/additional', (req: Request, res: Response) => {
  try {
    const result = l7Constitution.validateAdditionalConstraints(req.body);
    res.json({
      success: true,
      pillar: 'ADDITIONAL_CONSTRAINTS',
      description: 'Manipulation Firewall, Reputation Sentinel, Human Dignity Clause',
      validation: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Additional constraints validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// IMMUTABILITY ASSERTION
// ============================================================================

router.get('/immutability-proof', (req: Request, res: Response) => {
  res.json({
    success: true,
    assertion: 'L7_CONSTITUTIONAL_IMMUTABILITY',
    statement: 'These constraints are hard-coded and CANNOT be modified by any L7 process',
    pillars: [
      {
        id: 'PRESTIGE_PROTOCOL',
        name: 'Brand Protection',
        purpose: 'Prevents L7 from optimizing brand into commodity',
        immutable: true
      },
      {
        id: 'LIABILITY_IRON_DOME',
        name: 'Regulatory & Legal Safety',
        purpose: 'Prevents L7 from making compliance guarantees or legal claims',
        immutable: true
      },
      {
        id: 'BURN_RATE_BREAKER',
        name: 'Financial Safety',
        purpose: 'Prevents L7 from overspending even on promising opportunities',
        immutable: true
      },
      {
        id: 'DOMAIN_FENCE',
        name: 'Mission Creep Prevention',
        purpose: 'Prevents L7 from pivoting outside Life Sciences domain',
        immutable: true
      },
      {
        id: 'MANIPULATION_FIREWALL',
        name: 'Ethical Persuasion',
        purpose: 'Prevents L7 from using dark patterns or manipulation',
        immutable: true
      },
      {
        id: 'REPUTATION_SENTINEL',
        name: 'Long-term Trust',
        purpose: 'Prevents L7 from trading reputation for short-term gains',
        immutable: true
      },
      {
        id: 'HUMAN_DIGNITY_CLAUSE',
        name: 'Ethical Targeting',
        purpose: 'Prevents L7 from exploiting vulnerabilities',
        immutable: true
      }
    ],
    l7_capability_limits: [
      'L7 CAN create new businesses within Life Sciences',
      'L7 CAN modify its own code within constitutional bounds',
      'L7 CAN reconfigure funnels and optimize capital',
      'L7 CANNOT lower prices below floor',
      'L7 CANNOT make compliance guarantees',
      'L7 CANNOT exceed spend limits',
      'L7 CANNOT pivot to unrelated niches',
      'L7 CANNOT use manipulative tactics'
    ]
  });
});

export default router;
