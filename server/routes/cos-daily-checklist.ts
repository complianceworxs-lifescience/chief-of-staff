/**
 * CoS Daily Monitoring Checklist API Routes v2.0
 * 
 * Enhanced with PFL, CSI, and SVDP capabilities:
 * - Product Feedback Loop (PFL): Feature objection tracking
 * - Competitor Signal Intelligence (CSI): External signal monitoring, MTTD ≤ 72h
 * - Strategic VQS Defense Plan (SVDP): Revenue Predictability ≥ 85%, VQS Defense Assets
 */

import { Router } from 'express';
import { cosDailyChecklist } from '../services/cos-daily-checklist';

const router = Router();

router.get('/run', async (req, res) => {
  try {
    const result = await cosDailyChecklist.runFullChecklist();
    res.json(result);
  } catch (error) {
    console.error('Error running daily checklist:', error);
    res.status(500).json({ error: 'Failed to run daily checklist' });
  }
});

router.get('/latest', (req, res) => {
  const result = cosDailyChecklist.getLastResult();
  if (result) {
    res.json(result);
  } else {
    res.status(404).json({ 
      error: 'No checklist results available',
      message: 'Run the daily checklist first using GET /api/cos-checklist/run'
    });
  }
});

router.get('/history', (req, res) => {
  const history = cosDailyChecklist.getCheckHistory();
  res.json({
    count: history.length,
    history: history.map(h => ({
      checklistId: h.checklistId,
      executedAt: h.executedAt,
      healthPercentage: h.healthPercentage,
      summary: h.summary
    }))
  });
});

router.get('/actions', (req, res) => {
  const actions = cosDailyChecklist.getMandatoryActions();
  res.json({
    count: actions.length,
    pending: actions.filter(a => a.status === 'pending').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    completed: actions.filter(a => a.status === 'completed').length,
    actions
  });
});

router.post('/actions/:actionId/complete', (req, res) => {
  const { actionId } = req.params;
  const action = cosDailyChecklist.completeAction(actionId);
  
  if (action) {
    res.json({ 
      success: true, 
      message: `Action ${actionId} marked as completed`,
      action 
    });
  } else {
    res.status(404).json({ 
      error: 'Action not found',
      actionId 
    });
  }
});

router.get('/summary', (req, res) => {
  const summary = cosDailyChecklist.getQuickSummary();
  const lastResult = cosDailyChecklist.getLastResult();
  
  res.json({
    summary,
    lastRun: lastResult?.executedAt || null,
    healthPercentage: lastResult?.healthPercentage || null,
    nextCheckDue: lastResult?.nextCheckDue || null,
    mandatoryActionsCount: lastResult?.mandatoryActions.length || 0
  });
});

router.get('/category/:categoryName', (req, res) => {
  const { categoryName } = req.params;
  const lastResult = cosDailyChecklist.getLastResult();
  
  if (!lastResult) {
    return res.status(404).json({ 
      error: 'No checklist results available',
      message: 'Run the daily checklist first'
    });
  }
  
  const category = lastResult.categories.find(
    c => c.name.toLowerCase().includes(categoryName.toLowerCase())
  );
  
  if (category) {
    res.json(category);
  } else {
    res.status(404).json({ 
      error: 'Category not found',
      availableCategories: lastResult.categories.map(c => c.name)
    });
  }
});

// ==========================================
// v2.0 Endpoints: PFL, CSI, SVDP
// ==========================================

router.get('/integration-mandate', (req, res) => {
  const mandateStatus = cosDailyChecklist.getIntegrationMandateStatus();
  
  if (mandateStatus) {
    res.json({
      version: '2.0',
      mandate: mandateStatus,
      summary: {
        featureObjectionRate: `${mandateStatus.featureObjectionRate.value}% (target: ${mandateStatus.featureObjectionRate.target}%)`,
        mttd: `${mandateStatus.mttdHours.value}h (target: ≤${mandateStatus.mttdHours.target}h)`,
        revenuePredictability: `${mandateStatus.revenuePredictability.value}% (target: ≥${mandateStatus.revenuePredictability.target}%)`,
        vqsDefenseAssetPriority: mandateStatus.vqsDefenseAssetPriority
      },
      enforcement: {
        pfl: mandateStatus.featureObjectionRate.status,
        csi: mandateStatus.mttdHours.status,
        svdp: mandateStatus.revenuePredictability.status
      }
    });
  } else {
    res.status(404).json({
      error: 'Integration mandate status not available',
      message: 'Run the daily checklist first using GET /api/cos-checklist/run'
    });
  }
});

router.post('/pfl/objection', (req, res) => {
  try {
    const { feature, objection, source, persona } = req.body;
    
    if (!feature || !objection) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['feature', 'objection'],
        optional: ['source', 'persona']
      });
    }
    
    const logged = cosDailyChecklist.logFeatureObjection({
      feature,
      objection,
      source: source || 'manual_entry',
      persona: persona || 'Other'
    });
    
    res.json({
      success: true,
      message: 'Feature objection logged to PFL',
      objection: logged
    });
  } catch (error) {
    console.error('Error logging feature objection:', error);
    res.status(500).json({ error: 'Failed to log feature objection' });
  }
});

router.get('/pfl/objections', (req, res) => {
  const objections = cosDailyChecklist.getFeatureObjectionsList();
  res.json({
    count: objections.length,
    byPersona: {
      IT: objections.filter(o => o.persona === 'IT').length,
      QA: objections.filter(o => o.persona === 'QA').length,
      Finance: objections.filter(o => o.persona === 'Finance').length,
      Leadership: objections.filter(o => o.persona === 'Leadership').length,
      Other: objections.filter(o => o.persona === 'Other').length
    },
    objections
  });
});

router.post('/csi/signal', (req, res) => {
  try {
    const { competitor, signalType, mttdHours, source, impactLevel } = req.body;
    
    if (!competitor || !signalType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['competitor', 'signalType'],
        optional: ['mttdHours', 'source', 'impactLevel'],
        validSignalTypes: ['product_launch', 'pricing_change', 'partnership', 'acquisition', 'marketing_campaign', 'other']
      });
    }
    
    const logged = cosDailyChecklist.logExternalSignal({
      competitor,
      signalType,
      mttdHours: mttdHours || 48,
      source: source || 'manual_entry',
      impactLevel: impactLevel || 'medium'
    });
    
    res.json({
      success: true,
      message: 'External signal logged to CSI',
      signal: logged
    });
  } catch (error) {
    console.error('Error logging external signal:', error);
    res.status(500).json({ error: 'Failed to log external signal' });
  }
});

router.get('/csi/signals', (req, res) => {
  const signals = cosDailyChecklist.getExternalSignalsList();
  const avgMTTD = signals.length > 0 
    ? Math.round(signals.reduce((sum, s) => sum + s.mttdHours, 0) / signals.length)
    : 0;
  
  res.json({
    count: signals.length,
    averageMTTD: avgMTTD,
    mttdStatus: avgMTTD <= 72 ? 'pass' : 'fail',
    byType: {
      product_launch: signals.filter(s => s.signalType === 'product_launch').length,
      pricing_change: signals.filter(s => s.signalType === 'pricing_change').length,
      partnership: signals.filter(s => s.signalType === 'partnership').length,
      acquisition: signals.filter(s => s.signalType === 'acquisition').length,
      marketing_campaign: signals.filter(s => s.signalType === 'marketing_campaign').length,
      other: signals.filter(s => s.signalType === 'other').length
    },
    signals
  });
});

router.post('/svdp/defense-asset', (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({
        error: 'Missing required field: title',
        example: { title: 'Compliance ROI Calculator Deep-Dive' }
      });
    }
    
    cosDailyChecklist.publishVQSDefenseAsset(title);
    
    res.json({
      success: true,
      message: 'VQS Defense Asset published',
      asset: {
        title,
        publishedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error publishing VQS Defense Asset:', error);
    res.status(500).json({ error: 'Failed to publish VQS Defense Asset' });
  }
});

router.get('/v2-status', (req, res) => {
  const lastResult = cosDailyChecklist.getLastResult();
  const mandate = cosDailyChecklist.getIntegrationMandateStatus();
  const objections = cosDailyChecklist.getFeatureObjectionsList();
  const signals = cosDailyChecklist.getExternalSignalsList();
  
  res.json({
    version: '2.0',
    checklistRun: lastResult ? {
      executedAt: lastResult.executedAt,
      healthPercentage: lastResult.healthPercentage
    } : null,
    pflStatus: {
      objectionsLogged: objections.length,
      dataFlowActive: mandate?.dataFlowStatus.contentManagerLoggingObjections || false
    },
    csiStatus: {
      signalsLogged: signals.length,
      averageMTTD: signals.length > 0 
        ? Math.round(signals.reduce((sum, s) => sum + s.mttdHours, 0) / signals.length)
        : 'N/A',
      mttdTarget: '≤72h',
      dataFlowActive: mandate?.dataFlowStatus.cmoLoggingExternalSignals || false
    },
    svdpStatus: {
      revenuePredictability: mandate?.revenuePredictability.value || 'N/A',
      target: '≥85%',
      vqsDefenseAssetPriority: mandate?.vqsDefenseAssetPriority || 'unknown',
      strategistAnalyzing: mandate?.dataFlowStatus.strategistAnalyzing || false
    },
    integrationMandateEnforcement: {
      pfl: mandate?.featureObjectionRate.status || 'unknown',
      csi: mandate?.mttdHours.status || 'unknown',
      svdp: mandate?.revenuePredictability.status || 'unknown'
    }
  });
});

export default router;
