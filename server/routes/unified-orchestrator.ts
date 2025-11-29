import { Router } from 'express';
import { unifiedOrchestrator } from '../services/unified-orchestrator';

const router = Router();

router.get('/status', (req, res) => {
  const status = unifiedOrchestrator.getStatus();
  res.json({ success: true, data: status });
});

router.post('/run-core-cycle', async (req, res) => {
  try {
    const result = await unifiedOrchestrator.runCoreCycle();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Core cycle failed' });
  }
});

router.post('/run-research-cycle', async (req, res) => {
  try {
    const result = await unifiedOrchestrator.runResearchCycle();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Research cycle failed' });
  }
});

router.get('/agent-brief/:agent', async (req, res) => {
  try {
    const brief = await unifiedOrchestrator.getAgentBrief(req.params.agent);
    res.json({ success: true, data: brief });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get agent brief' });
  }
});

export default router;
