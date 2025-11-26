import { Router } from 'express';
import { l5AgentHealthMonitor } from '../services/l5-agent-health-monitor';

const router = Router();

router.get('/status', (req, res) => {
  try {
    const status = l5AgentHealthMonitor.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get health monitor status' });
  }
});

router.get('/cycle/latest', (req, res) => {
  try {
    const status = l5AgentHealthMonitor.getStatus();
    if (status.lastCycle) {
      res.json(status.lastCycle);
    } else {
      res.json({ message: 'No validation cycles executed yet' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get latest cycle' });
  }
});

router.get('/cycle/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const history = l5AgentHealthMonitor.getCycleHistory(limit);
    res.json({
      count: history.length,
      cycles: history
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cycle history' });
  }
});

router.post('/cycle/force', async (req, res) => {
  try {
    const result = await l5AgentHealthMonitor.forceValidationCycle();
    res.json({
      message: 'Validation cycle forced successfully',
      result
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to force validation cycle' });
  }
});

router.get('/failure-conditions', (req, res) => {
  try {
    const conditions = l5AgentHealthMonitor.checkFailureConditions();
    const triggeredConditions = conditions.filter(c => c.triggered);
    res.json({
      totalConditions: conditions.length,
      triggeredCount: triggeredConditions.length,
      conditions,
      triggeredConditions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check failure conditions' });
  }
});

router.post('/agent-activity', (req, res) => {
  try {
    const { agentName, actionType } = req.body;
    if (!agentName || !actionType) {
      return res.status(400).json({ error: 'agentName and actionType are required' });
    }
    l5AgentHealthMonitor.recordAgentActivity(agentName, actionType);
    res.json({
      message: 'Agent activity recorded',
      agentName,
      actionType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record agent activity' });
  }
});

router.get('/config', (req, res) => {
  try {
    const status = l5AgentHealthMonitor.getStatus();
    res.json({
      config: status.config,
      description: {
        cycleIntervalMs: '2-hour validation cycle interval',
        minIntervalMs: '90 minutes minimum between cycles',
        maxIntervalMs: '3 hours maximum between cycles',
        maxTokensPerCycle: 'Maximum tokens used per validation cycle',
        silentUnlessCritical: 'Only surface reports when drift persists or blockers appear'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get config' });
  }
});

router.get('/directive', (req, res) => {
  res.json({
    name: 'L5 AGENT HEALTH MONITOR DIRECTIVE',
    version: '1.0',
    agent: 'Chief of Staff (CoS)',
    level: 'L5 Autonomous System Governance',
    purpose: 'Provide autonomous, periodic system health validation without manual prompting',
    operatingFrequency: {
      interval: '2 hours',
      minimum: '90 minutes',
      maximum: '3 hours'
    },
    validationCycleScope: {
      observe: [
        'UDL Sync Status (< 2 hours)',
        'Agent Activity (CMO, CRO, Content Manager, Strategist)',
        'Critical Drift Indicators',
        'External Signals (Optional)'
      ],
      decide: [
        'Identify off-course agents',
        'Determine downstream corrections',
        'Route Strategist updates',
        'Route Blueprint mutations',
        'Route Offer Ladder adjustments',
        'Route Packet refreshes'
      ],
      act: [
        'Push corrections to agents',
        'Reallocate bandwidth',
        'Trigger updates (Blueprint, Offers, Packets)',
        'Initiate micro-corrections'
      ],
      reflect: [
        'Log to UDL',
        'Update health metrics',
        'Adjust learning loops',
        'Alert Strategist if anomalies persist (2+ cycles)',
        'Escalate to Architect for structural failures only'
      ]
    },
    failureConditions: [
      'No agent activity in 2 hours',
      'CMO no new Archetype in 4 hours',
      'CRO no Tier 2/3 movement',
      'Content Manager no Packet updates in 24 hours',
      'Strategist forecast older than 2 hours',
      'VQS violation',
      'Offer Ladder blockage',
      'RPM accuracy < 85%'
    ],
    autoCorrections: [
      'Force Blueprint mutation',
      'Force CRO micro-offer push',
      'Force Strategist scenario sim update',
      'Force content refresh',
      'Reset WIS thresholds',
      'Escalate drift to Strategist'
    ],
    tokenEfficiency: {
      maxPerCycle: 350,
      optimizations: [
        'No full Blueprint regeneration unless triggered',
        'Summary-only logs to UDL',
        'Compact agent state reports',
        'Minimal prediction updates',
        'Last 3 actions only (not full logs)'
      ]
    },
    reportingBehavior: {
      autonomous: true,
      surfaceReportWhen: [
        'Drift persists',
        'Blocker appears',
        'Revenue predictability falls',
        'Critical anomaly triggers escalation'
      ],
      silentOtherwise: true
    }
  });
});

export default router;
