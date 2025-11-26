/**
 * CoS Daily Monitoring Checklist API Routes
 * 
 * Provides endpoints for running and managing the daily monitoring checklist
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

export default router;
