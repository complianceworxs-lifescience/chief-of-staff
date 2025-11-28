/**
 * L6 SHADOW MODE API ROUTES
 * 
 * READ-ONLY ADVISORS: All endpoints return scores, flags, rankings, or reports.
 * No execution authority - L5 CoS must initiate all actions.
 */

import { Router } from 'express';
import { l6ShadowMode } from '../services/l6-shadow-mode';

const router = Router();

// ============================================================================
// L6 STATUS & CONFIGURATION
// ============================================================================

router.get('/status', async (req, res) => {
  try {
    const report = await l6ShadowMode.generateAdvisoryReport();
    res.json({
      success: true,
      l6Mode: 'SHADOW_MODE',
      authority: 'READ-ONLY ADVISOR',
      ...report
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get L6 status' });
  }
});

// ============================================================================
// PROPENSITY-TO-PAY SCORER
// ============================================================================

router.post('/propensity/score', async (req, res) => {
  try {
    const contactData = req.body;
    const result = await l6ShadowMode.scorer.scoreContact(contactData);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Propensity scoring failed' });
  }
});

router.post('/propensity/rank-all', async (req, res) => {
  try {
    const { contacts } = req.body;
    const result = await l6ShadowMode.scorer.rankAllContacts(contacts || []);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Contact ranking failed' });
  }
});

// ============================================================================
// SENTIMENT HEATMAP
// ============================================================================

router.post('/sentiment/analyze', async (req, res) => {
  try {
    const { content, source } = req.body;
    const result = await l6ShadowMode.sentiment.analyzeSentiment(content, source);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sentiment analysis failed' });
  }
});

router.post('/sentiment/heatmap', async (req, res) => {
  try {
    const { entries } = req.body;
    const result = await l6ShadowMode.sentiment.generateHeatmapReport(entries || []);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Heatmap generation failed' });
  }
});

// ============================================================================
// SHADOW CHALLENGER (Simulation Engine)
// ============================================================================

router.post('/simulation/run', async (req, res) => {
  try {
    const params = req.body;
    const result = await l6ShadowMode.simulator.runSimulation(params);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Simulation failed' });
  }
});

router.post('/simulation/optimize', async (req, res) => {
  try {
    const { scenarios } = req.body;
    const result = await l6ShadowMode.simulator.runStrategyOptimization(scenarios || []);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Strategy optimization failed' });
  }
});

// ============================================================================
// DRIFT DETECTIVE
// ============================================================================

router.post('/drift/detect', async (req, res) => {
  try {
    const { content, goldenArchetype } = req.body;
    
    // Default Golden Archetype for ComplianceWorxs
    const archetype = goldenArchetype || {
      voice: ['validation', 'compliance', 'audit', 'evidence', 'regulatory', 'CSV', 'GAMP'],
      positioning: ['life sciences', 'pharma', 'medtech', 'quality assurance', 'digital validation'],
      forbiddenTerms: ['cheap', 'discount', 'free trial', 'no risk', 'guaranteed'],
      requiredElements: ['ComplianceWorxs', 'validation', 'audit readiness']
    };
    
    const result = await l6ShadowMode.driftDetector.detectDrift(content, archetype);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Drift detection failed' });
  }
});

// ============================================================================
// REVENUE EARLY-WARNING SYSTEM
// ============================================================================

router.post('/revenue/analyze', async (req, res) => {
  try {
    const data = req.body;
    const result = await l6ShadowMode.revenueMonitor.analyzeRevenueSignals(data);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Revenue analysis failed' });
  }
});

// ============================================================================
// OFFER SENSITIVITY SCANNER
// ============================================================================

router.post('/offer/sensitivity', async (req, res) => {
  try {
    const offer = req.body;
    const result = await l6ShadowMode.offerAnalyzer.scanOfferSensitivity(offer);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Offer analysis failed' });
  }
});

// ============================================================================
// PATH FRICTION ANALYZER
// ============================================================================

router.post('/friction/analyze', async (req, res) => {
  try {
    const pathData = req.body;
    const result = await l6ShadowMode.friction.analyzeFriction(pathData);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Friction analysis failed' });
  }
});

// ============================================================================
// SIGNAL-TO-NOISE GATEKEEPER
// ============================================================================

router.post('/signals/filter', async (req, res) => {
  try {
    const { signals } = req.body;
    const result = await l6ShadowMode.signalFilter.filterSignals(signals || []);
    l6ShadowMode.queueAdvisory(result);
    res.json({ success: true, advisory: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Signal filtering failed' });
  }
});

// ============================================================================
// ADVISORY QUEUE MANAGEMENT
// ============================================================================

router.get('/advisories', async (req, res) => {
  try {
    const report = await l6ShadowMode.generateAdvisoryReport();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get advisories' });
  }
});

router.post('/advisories/clear', async (req, res) => {
  try {
    l6ShadowMode.clearProcessedAdvisories();
    res.json({ success: true, message: 'Advisory queue cleared after L5 processing' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to clear advisories' });
  }
});

export default router;
