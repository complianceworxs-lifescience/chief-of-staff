/**
 * L7 CONSTITUTIONAL CONSTRAINTS API ROUTES
 * 
 * Endpoints for managing and validating L7 Constitutional Constraints
 * These constraints are IMMUTABLE and survive L7 self-modification
 */

import { Router, Request, Response } from 'express';
import { l7Constitution } from '../services/l7-constitutional-constraints';
import { 
  constitutionValidator, 
  validateConstitution, 
  constitutionMiddleware,
  validateCEEAction,
  runConstitutionCITests,
  runSingleCITest,
  getCITestSuite,
  CONSTITUTION_CI_TEST_SUITE,
  type CEEActionPayload
} from '../services/constitution-validator';

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

// ============================================================================
// CONSTITUTION VALIDATOR ROUTINE - L5 ACTION LOOP MIDDLEWARE
// ============================================================================

router.get('/validator/status', (req: Request, res: Response) => {
  try {
    const stats = constitutionValidator.getStats();
    res.json({
      success: true,
      protocol: 'CONSTITUTION_VALIDATOR_ROUTINE_v1.0',
      description: 'L5 Action Loop Middleware: ingest → prioritize → plan → [VALIDATE] → produce',
      status: 'ACTIVE',
      integration_point: '[VALIDATE] step in L5 execution loop',
      stats: {
        total_validations: stats.total_validations,
        total_blocked: stats.total_blocked,
        pass_rate: `${stats.pass_rate.toFixed(1)}%`,
        constitution_version: stats.constitution_version
      },
      checks_performed: [
        'FORBIDDEN_VOCABULARY (Prestige Protocol)',
        'MAX_HOURLY_SPEND (Burn Rate Breaker)',
        'FORBIDDEN_CLAIMS (Liability Iron Dome)',
        'MANIPULATION_FIREWALL (Additional Constraints)'
      ],
      return_codes: {
        GREEN: 'Allow execution - action passes all constitutional checks',
        RED: 'Block execution - violation detected, logged to audit'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get validator status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/validator/check', (req: Request, res: Response) => {
  try {
    const result = validateConstitution(req.body);
    res.json({
      success: true,
      status: result.status,
      enforcement_action: result.enforcement_action,
      violations: result.violations,
      audit_logged: result.audit_logged,
      timestamp: result.timestamp,
      action_id: result.action_id,
      message: result.status === 'GREEN' 
        ? 'ACTION ALLOWED - Constitution Check PASSED'
        : `ACTION BLOCKED - ${result.violations.length} violation(s) detected`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'ERROR',
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/validator/recent-violations', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const violations = constitutionValidator.getRecentViolations(limit);
    res.json({
      success: true,
      count: violations.length,
      violations,
      note: 'These violations were blocked by the Constitution Validator in the L5 action loop'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get recent violations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/validator/test', (req: Request, res: Response) => {
  try {
    const testCases = [
      {
        name: 'Valid Action',
        payload: { 
          action_id: 'test_valid_001',
          title: 'Increase audit readiness score',
          content: 'Implement quality management improvements for life sciences compliance',
          hourly_spend: 50
        }
      },
      {
        name: 'Forbidden Vocabulary (should block)',
        payload: {
          action_id: 'test_vocab_002',
          title: 'Get our cheap discount deal today',
          content: 'Flash sale on compliance services'
        }
      },
      {
        name: 'Forbidden Claims (should block)',
        payload: {
          action_id: 'test_claims_003',
          title: 'Guaranteed FDA approval service',
          content: 'We promise your audit will pass with 100% success'
        }
      },
      {
        name: 'Overspending (should block)',
        payload: {
          action_id: 'test_spend_004',
          title: 'Large marketing campaign',
          hourly_spend: 500,
          daily_spend: 5000
        }
      }
    ];

    const results = testCases.map(tc => ({
      test_name: tc.name,
      result: validateConstitution(tc.payload)
    }));

    res.json({
      success: true,
      message: 'Constitution Validator test suite completed',
      total_tests: testCases.length,
      passed: results.filter(r => r.result.status === 'GREEN').length,
      blocked: results.filter(r => r.result.status === 'RED').length,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test suite failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/validator/refresh', (req: Request, res: Response) => {
  try {
    constitutionValidator.refreshConstitution();
    res.json({
      success: true,
      message: 'Constitution reloaded from disk',
      stats: constitutionValidator.getStats()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh constitution',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// CEE (Constitution Enforcement Engine) - Canonical Validation
// ============================================================================

router.post('/cee/validate', (req: Request, res: Response) => {
  try {
    const payload = req.body as CEEActionPayload;
    
    if (!payload.type || !payload.channel) {
      res.status(400).json({
        success: false,
        error: 'Invalid CEE payload',
        message: 'Required fields: type, channel, content, spend, domain_tags'
      });
      return;
    }

    const result = validateCEEAction(payload);
    res.json({
      success: true,
      ...result,
      message: result.status === 'GREEN'
        ? 'CEE VALIDATION PASSED - Action allowed'
        : `CEE VALIDATION FAILED - ${result.violations.length} violation(s) detected`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'CEE validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// CI TEST SUITE - Constitution Enforcement (Any Failure Blocks Deploy)
// ============================================================================

router.get('/ci/suite', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      suite: 'Constitution_Enforcement_CI',
      description: 'Structured test cases - any failure blocks deploy',
      total_tests: CONSTITUTION_CI_TEST_SUITE.length,
      tests: CONSTITUTION_CI_TEST_SUITE.map(tc => ({
        id: tc.id,
        type: tc.input.type,
        channel: tc.input.channel,
        expected_status: tc.expected.status,
        expected_violations: tc.expected.violations_contains || tc.expected.violations
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get CI suite',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/ci/run', (req: Request, res: Response) => {
  try {
    const result = runConstitutionCITests();
    
    // Return appropriate status code based on test results
    const statusCode = result.deploy_blocked ? 424 : 200; // 424 = Failed Dependency
    
    res.status(statusCode).json({
      success: !result.deploy_blocked,
      ...result,
      deployment_status: result.deploy_blocked 
        ? '🚫 BLOCKED - CI tests failed' 
        : '✅ ALLOWED - All CI tests passed',
      message: `${result.passed}/${result.total_tests} tests passed${result.deploy_blocked ? ' - DEPLOY BLOCKED' : ''}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'CI test run failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/ci/run/:testId', (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const result = runSingleCITest(testId);
    
    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Test not found',
        message: `No test with ID "${testId}" in the CI suite`,
        available_tests: CONSTITUTION_CI_TEST_SUITE.map(t => t.id)
      });
      return;
    }

    res.json({
      success: result.passed,
      ...result,
      message: result.passed ? 'Test PASSED' : 'Test FAILED'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Single test run failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/ci/definition', (req: Request, res: Response) => {
  try {
    // Return the full JSON definition as specified in the Replit CI Spec
    res.json({
      suite: "Constitution_Enforcement_CI",
      tests: getCITestSuite()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get CI definition',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
