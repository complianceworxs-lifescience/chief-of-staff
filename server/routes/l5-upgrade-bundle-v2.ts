/**
 * L5_UPGRADE_BUNDLE_V2 API Routes
 * 
 * Provides REST API endpoints for the three L5 upgrades:
 * 1. Conversion-Stage Friction Map (CRO-owned)
 * 2. L6 Drift Detector (Strategist-owned)
 * 3. Daily RPM Stress Test Engine (System-owned)
 */

import { Router, Request, Response } from 'express';
import { l5UpgradeBundleV2 } from '../services/l5-upgrade-bundle-v2';

const router = Router();

// ============================================================================
// BUNDLE ACTIVATION & STATUS
// ============================================================================

/**
 * POST /api/l5-bundle/activate
 * Activate the L5 Upgrade Bundle V2
 */
router.post('/activate', async (req: Request, res: Response) => {
  try {
    const status = await l5UpgradeBundleV2.activate();
    res.json({
      success: true,
      message: 'L5_UPGRADE_BUNDLE_V2 activated successfully',
      status
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to activate bundle',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/l5-bundle/status
 * Get the current status of the L5 Upgrade Bundle
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = l5UpgradeBundleV2.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get bundle status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// CONVERSION-STAGE FRICTION MAP (CRO-owned)
// ============================================================================

/**
 * GET /api/l5-bundle/friction/map
 * Generate and get the current friction map
 */
router.get('/friction/map', (req: Request, res: Response) => {
  try {
    const map = l5UpgradeBundleV2.frictionMap.generateFrictionMap();
    res.json({
      module: 'CONVERSION_STAGE_FRICTION_MAP',
      owner: 'CRO',
      map
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate friction map',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/l5-bundle/friction/latest
 * Get the latest friction map without generating a new one
 */
router.get('/friction/latest', (req: Request, res: Response) => {
  try {
    const map = l5UpgradeBundleV2.frictionMap.getLatestMap();
    if (!map) {
      return res.status(404).json({
        error: 'No friction map available',
        message: 'Generate a friction map first using POST /friction/map'
      });
    }
    res.json({
      module: 'CONVERSION_STAGE_FRICTION_MAP',
      owner: 'CRO',
      map
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get latest friction map',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/l5-bundle/friction/trend
 * Get the friction reduction trend
 */
router.get('/friction/trend', (req: Request, res: Response) => {
  try {
    const trend = l5UpgradeBundleV2.frictionMap.getFrictionTrend();
    const latestMap = l5UpgradeBundleV2.frictionMap.getLatestMap();
    
    res.json({
      module: 'CONVERSION_STAGE_FRICTION_MAP',
      trend,
      current_friction: latestMap?.total_friction_index || null,
      target_reduction: 0.25,
      days_to_target: 10,
      on_track: trend.improving && trend.delta > 0.01
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get friction trend',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/l5-bundle/friction/update
 * Update friction metrics
 */
router.post('/friction/update', (req: Request, res: Response) => {
  try {
    const metrics = req.body;
    l5UpgradeBundleV2.frictionMap.updateMetrics(metrics);
    res.json({
      success: true,
      message: 'Friction metrics updated'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update friction metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// L6 DRIFT DETECTOR (Strategist-owned)
// ============================================================================

/**
 * POST /api/l5-bundle/drift/scan
 * Scan an action for L6 drift
 */
router.post('/drift/scan', (req: Request, res: Response) => {
  try {
    const { action, source_agent } = req.body;

    if (!action || !source_agent) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['action', 'source_agent']
      });
    }

    const driftEvent = l5UpgradeBundleV2.driftDetector.scanForDrift(action, source_agent);

    if (driftEvent) {
      res.status(403).json({
        module: 'L6_DRIFT_DETECTOR',
        owner: 'Strategist',
        drift_detected: true,
        drift_event: driftEvent,
        message: 'ACTION BLOCKED: L6 drift detected and halted'
      });
    } else {
      res.json({
        module: 'L6_DRIFT_DETECTOR',
        owner: 'Strategist',
        drift_detected: false,
        message: 'Action approved - no L6 drift detected'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to scan for drift',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/l5-bundle/drift/status
 * Get the current drift detector status
 */
router.get('/drift/status', (req: Request, res: Response) => {
  try {
    const status = l5UpgradeBundleV2.driftDetector.getStatus();
    res.json({
      module: 'L6_DRIFT_DETECTOR',
      owner: 'Strategist',
      status,
      success_target: 'Zero L6 drifts in 30-day rolling window'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get drift status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/l5-bundle/drift/events
 * Get recent drift events
 */
router.get('/drift/events', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const events = l5UpgradeBundleV2.driftDetector.getRecentDrifts(limit);
    
    res.json({
      module: 'L6_DRIFT_DETECTOR',
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get drift events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// DAILY RPM STRESS TEST ENGINE (System-owned)
// ============================================================================

/**
 * POST /api/l5-bundle/stress/run
 * Run the daily RPM stress test
 */
router.post('/stress/run', async (req: Request, res: Response) => {
  try {
    const report = await l5UpgradeBundleV2.stressTestEngine.runDailyStressTest();
    res.json({
      module: 'DAILY_RPM_STRESS_TEST_ENGINE',
      owner: 'System',
      report
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to run stress test',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/l5-bundle/stress/latest
 * Get the latest stress test report
 */
router.get('/stress/latest', (req: Request, res: Response) => {
  try {
    const report = l5UpgradeBundleV2.stressTestEngine.getLatestReport();
    
    if (!report) {
      return res.status(404).json({
        error: 'No stress test report available',
        message: 'Run a stress test first using POST /stress/run'
      });
    }

    res.json({
      module: 'DAILY_RPM_STRESS_TEST_ENGINE',
      owner: 'System',
      report
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get latest stress test',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/l5-bundle/stress/history
 * Get stress test history
 */
router.get('/stress/history', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 7;
    const history = l5UpgradeBundleV2.stressTestEngine.getTestHistory(limit);
    
    res.json({
      module: 'DAILY_RPM_STRESS_TEST_ENGINE',
      count: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get stress test history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/l5-bundle/stress/update-rpm
 * Update the base RPM for stress testing
 */
router.post('/stress/update-rpm', (req: Request, res: Response) => {
  try {
    const { rpm } = req.body;
    
    if (typeof rpm !== 'number' || rpm < 0 || rpm > 1) {
      return res.status(400).json({
        error: 'Invalid RPM value',
        message: 'RPM must be a number between 0 and 1'
      });
    }

    l5UpgradeBundleV2.stressTestEngine.updateBaseRPM(rpm);
    res.json({
      success: true,
      message: `Base RPM updated to ${rpm}`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update base RPM',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// COMBINED DASHBOARD
// ============================================================================

/**
 * GET /api/l5-bundle/dashboard
 * Get a combined dashboard view of all L5 upgrade modules
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const bundleStatus = l5UpgradeBundleV2.getStatus();
    const frictionMap = l5UpgradeBundleV2.frictionMap.getLatestMap();
    const frictionTrend = l5UpgradeBundleV2.frictionMap.getFrictionTrend();
    const driftStatus = l5UpgradeBundleV2.driftDetector.getStatus();
    const stressReport = l5UpgradeBundleV2.stressTestEngine.getLatestReport();

    res.json({
      bundle: bundleStatus,
      modules: {
        friction_map: {
          status: frictionMap?.status || 'NOT_GENERATED',
          total_friction_index: frictionMap?.total_friction_index || null,
          trend: frictionTrend,
          target: 'Reduce friction ≥25% in 10 days'
        },
        drift_detector: {
          status: driftStatus.status,
          zero_drift_streak: driftStatus.zero_drift_streak_days,
          drifts_blocked: driftStatus.drifts_blocked,
          target: 'Zero L6 drifts in 30-day rolling window'
        },
        stress_test: {
          status: stressReport?.overall_status || 'NOT_RUN',
          stability_score: stressReport?.stability_score || null,
          rpm_maintained: stressReport?.rpm_maintained_above_target || null,
          target: 'Maintain RPM ≥90% after correction'
        }
      },
      governance: {
        vqs_integrity: 'ENFORCED',
        methodology_lock: 'ENFORCED',
        positioning_guardrails: 'ACTIVE',
        offer_ladder_compliance: 'ENFORCED',
        audit_transparency: 'ENABLED'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
