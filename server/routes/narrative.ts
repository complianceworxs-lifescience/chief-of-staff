import { Router } from 'express';
import { narrativeEnforcer } from '../services/narrative-enforcer';

const router = Router();

router.get('/core', (req, res) => {
  res.json({ success: true, data: narrativeEnforcer.getNarrative() });
});

router.get('/agent-brief/:agent', (req, res) => {
  const brief = narrativeEnforcer.getAgentNarrativeBrief(req.params.agent);
  res.json({ success: true, data: { agent: req.params.agent, brief } });
});

router.post('/check-compliance', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content required' });
    }
    const compliance = narrativeEnforcer.checkNarrativeCompliance(content);
    res.json({ success: true, data: compliance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Compliance check failed' });
  }
});

router.post('/enforce', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content required' });
    }
    const enforced = narrativeEnforcer.enforceNarrative(content);
    res.json({ success: true, data: { original: content, enforced } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Enforcement failed' });
  }
});

router.post('/calculate-confidence', (req, res) => {
  try {
    const { data, sources, lastUpdated } = req.body;
    const confidence = narrativeEnforcer.calculateConfidenceScore(data, sources, lastUpdated);
    res.json({ success: true, data: confidence });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Confidence calculation failed' });
  }
});

router.get('/wrapper', (req, res) => {
  const wrapper = narrativeEnforcer.generateNarrativeWrapper();
  res.json({ success: true, data: { wrapper } });
});

export default router;
