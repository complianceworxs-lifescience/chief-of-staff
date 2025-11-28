/**
 * POST-LAUNCH MONITORING PROTOCOL API ROUTES
 * 
 * 08:00–12:00 EST Window Monitoring
 * Three Pulse Checks: Email Velocity, Checkout Recovery, Revenue Attribution
 */

import { Router, Request, Response } from 'express';
import { postLaunchMonitor } from '../services/post-launch-monitor';

const router = Router();

// ============================================================================
// PROTOCOL CONTROL
// ============================================================================

router.get('/status', (req: Request, res: Response) => {
  try {
    const status = postLaunchMonitor.getStatus();
    res.json({
      success: true,
      protocol: 'POST_LAUNCH_MONITORING_v1.0',
      window: '08:00–12:00 EST',
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/start', (req: Request, res: Response) => {
  try {
    const result = postLaunchMonitor.startMonitoring();
    res.json({
      success: result.success,
      message: result.message,
      status: postLaunchMonitor.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/stop', (req: Request, res: Response) => {
  try {
    const result = postLaunchMonitor.stopMonitoring();
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// PULSE CHECKS
// ============================================================================

router.get('/pulse/all', (req: Request, res: Response) => {
  try {
    const pulses = postLaunchMonitor.runAllPulseChecks();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...pulses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to run pulse checks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/pulse/email', (req: Request, res: Response) => {
  try {
    const pulse = postLaunchMonitor.checkEmailVelocity();
    res.json({
      success: true,
      alias: 'The Spear',
      pulse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check email velocity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/pulse/recovery', (req: Request, res: Response) => {
  try {
    const pulse = postLaunchMonitor.checkCheckoutRecovery();
    res.json({
      success: true,
      alias: 'The Safety Net',
      pulse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check checkout recovery',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/pulse/attribution', (req: Request, res: Response) => {
  try {
    const pulse = postLaunchMonitor.checkRevenueAttribution();
    res.json({
      success: true,
      alias: 'The Webhook',
      pulse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check revenue attribution',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/pulse/inject', (req: Request, res: Response) => {
  try {
    const { check_type, metrics } = req.body;
    
    if (!check_type || !metrics) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: check_type and metrics'
      });
    }

    const validTypes = ['EMAIL_VELOCITY', 'CHECKOUT_RECOVERY', 'REVENUE_ATTRIBUTION'];
    if (!validTypes.includes(check_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid check_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const pulse = postLaunchMonitor.injectMetrics(check_type, metrics);
    res.json({
      success: true,
      message: `Metrics injected for ${check_type}`,
      pulse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to inject metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// CHAIRMAN WATCH LIST & ALERTS
// ============================================================================

router.get('/watch-list', (req: Request, res: Response) => {
  try {
    const watchList = postLaunchMonitor.getWatchList();
    res.json({
      success: true,
      title: 'WATCH LIST FOR THE CHAIRMAN',
      subtitle: 'What Success Looks Like',
      watch_list: watchList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get watch list',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/alerts', (req: Request, res: Response) => {
  try {
    const alerts = postLaunchMonitor.getChairmanAlerts();
    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get chairman alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/alerts/:alertId/acknowledge', (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const acknowledged = postLaunchMonitor.acknowledgeAlert(alertId);
    
    if (acknowledged) {
      res.json({
        success: true,
        message: `Alert ${alertId} acknowledged`
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Alert ${alertId} not found`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// FLIGHT DECK
// ============================================================================

router.get('/flight-deck', (req: Request, res: Response) => {
  try {
    const flightDeck = postLaunchMonitor.getFlightDeckData();
    res.json({
      success: true,
      title: 'POST-LAUNCH FLIGHT DECK',
      window: '08:00–12:00 EST',
      ...flightDeck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get flight deck data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// HISTORY
// ============================================================================

router.get('/history', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = postLaunchMonitor.getPulseHistory(limit);
    
    res.json({
      success: true,
      count: history.length,
      pulse_history: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get pulse history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// THRESHOLDS INFO
// ============================================================================

router.get('/thresholds', (req: Request, res: Response) => {
  res.json({
    success: true,
    protocol: 'Post-Launch Monitoring Protocol',
    window: '08:00–12:00 EST',
    pulse_checks: [
      {
        name: 'Email Open Velocity',
        alias: 'The Spear',
        purpose: 'Detect audience activation and funnel acceleration',
        thresholds: {
          GREEN: '≥ 22% open rate in first hour; upward trend',
          YELLOW: '12–21% first-hour open rate; flat trend',
          RED: '< 12% first-hour open rate; declining'
        },
        alert_trigger: 'RED sustained for 30 min'
      },
      {
        name: 'Checkout Recovery Success',
        alias: 'The Safety Net',
        purpose: 'Measure effectiveness of abandonment rescue logic',
        thresholds: {
          GREEN: '≥ 35% click-back; ≥ 10% recovered conversions',
          YELLOW: '20–34% click-back; 5–9% recovered conversions',
          RED: '< 20% click-back or < 5% conversions'
        },
        alert_trigger: 'RED sustained for 45 min'
      },
      {
        name: 'Revenue Attribution',
        alias: 'The Webhook',
        purpose: 'Verify Stripe Webhook operational + tie every dollar to source',
        thresholds: {
          GREEN: '≥ 95% attribution; consistent flow',
          YELLOW: '80–94% attribution; some missing source data',
          RED: '< 80% attribution OR webhook silence > 20 min'
        },
        alert_trigger: 'RED at any point (immediate)'
      }
    ]
  });
});

export default router;
