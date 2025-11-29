import { Router } from 'express';
import { revenueScoreboard } from '../services/revenue-scoreboard';

const router = Router();

router.get('/scoreboard', async (req, res) => {
  try {
    const scoreboard = await revenueScoreboard.getScoreboard();
    res.json({ success: true, data: scoreboard });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch scoreboard' });
  }
});

router.get('/narrative', async (req, res) => {
  try {
    const narrative = await revenueScoreboard.getNarrative();
    res.json({ success: true, data: narrative });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch narrative' });
  }
});

router.get('/health', async (req, res) => {
  try {
    const health = await revenueScoreboard.calculateHealthScore();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to calculate health' });
  }
});

router.get('/agent-brief/:agent', async (req, res) => {
  try {
    const brief = await revenueScoreboard.getAgentBrief(req.params.agent);
    res.json({ success: true, data: brief });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch agent brief' });
  }
});

router.post('/sync-research', async (req, res) => {
  try {
    await revenueScoreboard.syncResearchInsights();
    res.json({ success: true, message: 'Research insights synced to scoreboard' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to sync research insights' });
  }
});

router.post('/update-metric', async (req, res) => {
  try {
    const { category, updates } = req.body;
    await revenueScoreboard.updateMetric(category, updates);
    res.json({ success: true, message: `Updated ${category} metrics` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update metric' });
  }
});

router.post('/record-action', async (req, res) => {
  try {
    const { agent, action, revenueImpact } = req.body;
    await revenueScoreboard.recordAgentAction(agent, action, revenueImpact);
    res.json({ success: true, message: 'Agent action recorded' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record action' });
  }
});

export default router;
