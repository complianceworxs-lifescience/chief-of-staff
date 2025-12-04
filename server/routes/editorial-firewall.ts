/**
 * ====================================================
 * EDITORIAL FIREWALL ROUTES
 * ====================================================
 * 
 * API routes for testing the Editorial & Persona Governance Firewall.
 * Includes test cases for domain, persona, pillar, and end-to-end validation.
 */

import { Router, Request, Response } from 'express';
import {
  editorialFirewall,
  analyzeText,
  firewallCheckIdea,
  firewallCheckBrief,
  firewallCheckDraft,
  ContentMessage
} from '../utils/editorialFirewall.js';
import { messageBus, TOPICS } from '../utils/messageBus.js';

const router = Router();

/**
 * Analyze text for domain anchors, prohibited terms, and pillars
 */
router.post('/analyze', async (req: Request, res: Response) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Missing text field' });
  }

  const analysis = analyzeText(text);
  
  res.json({
    analysis,
    summary: {
      domainAnchorsCount: analysis.domainAnchors.length,
      passesAudienceLock: analysis.domainAnchors.length >= 2,
      hasProhibitedTerms: analysis.prohibitedTerms.length > 0,
      pillarsDetected: analysis.pillarsDetected.length
    }
  });
});

/**
 * Test idea stage firewall (CMA validation)
 */
router.post('/check/idea', async (req: Request, res: Response) => {
  const { rawIdea, persona } = req.body;
  
  if (!rawIdea || !persona) {
    return res.status(400).json({ error: 'Missing rawIdea or persona field' });
  }

  const result = firewallCheckIdea(rawIdea, persona);
  
  res.json(result);
});

/**
 * Test brief stage firewall (CoS validation)
 */
router.post('/check/brief', async (req: Request, res: Response) => {
  const { topic, persona, title, rawIdea } = req.body;
  
  if (!topic || !persona || !title || !rawIdea) {
    return res.status(400).json({ error: 'Missing required fields: topic, persona, title, rawIdea' });
  }

  const message: ContentMessage = {
    topic,
    persona,
    title,
    rawIdea,
    metadata: {
      domainAnchors: [],
      prohibitedTerms: [],
      pillars: [],
      lifecycleStage: 'brief'
    }
  };

  const result = firewallCheckBrief(message);
  
  res.json(result);
});

/**
 * Test draft stage firewall (CoS final validation before WordPress)
 */
router.post('/check/draft', async (req: Request, res: Response) => {
  const { draftContent, persona } = req.body;
  
  if (!draftContent || !persona) {
    return res.status(400).json({ error: 'Missing draftContent or persona field' });
  }

  const result = firewallCheckDraft(draftContent, persona);
  
  res.json(result);
});

/**
 * Submit idea through message bus (full CMO → CMA flow)
 */
router.post('/submit/idea', async (req: Request, res: Response) => {
  const { topic, persona, title, rawIdea } = req.body;
  
  if (!topic || !persona || !title || !rawIdea) {
    return res.status(400).json({ error: 'Missing required fields: topic, persona, title, rawIdea' });
  }

  const messageId = messageBus.submitIdea({
    topic,
    persona,
    title,
    rawIdea
  });
  
  res.json({
    success: true,
    messageId,
    message: 'Idea submitted to TOPIC_IDEA_QUEUE. Check message bus logs for validation results.'
  });
});

/**
 * Get message bus history
 */
router.get('/messages', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const messages = messageBus.getRecentMessages(limit);
  
  res.json({
    total: messages.length,
    messages
  });
});

/**
 * Get messages by topic
 */
router.get('/messages/:topic', async (req: Request, res: Response) => {
  const { topic } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  const messages = messageBus.getMessagesByTopic(topic, limit);
  
  res.json({
    topic,
    total: messages.length,
    messages
  });
});

/**
 * Run all test cases
 */
router.get('/test', async (_req: Request, res: Response) => {
  const results: any[] = [];

  // Test 3.1: Domain & persona tests
  
  // Generic corporate compliance (BAD) - SOX, DOJ, SEC, GDPR, no FDA/validation
  results.push({
    name: 'Generic corporate compliance (BAD)',
    input: {
      rawIdea: 'Why SOX compliance programs fail: DOJ enforcement actions and SEC penalties are rising. GDPR fines impact corporate governance.',
      persona: 'CFO'
    },
    expected: 'IDEA_REJECTED by CMA (audience lock + prohibited terms)',
    result: firewallCheckIdea(
      'Why SOX compliance programs fail: DOJ enforcement actions and SEC penalties are rising. GDPR fines impact corporate governance.',
      'CFO'
    )
  });

  // Financial AML/KYC (BAD)
  results.push({
    name: 'Financial AML/KYC (BAD)',
    input: {
      rawIdea: 'Reducing AML/KYC risk with better controls and sanctions screening.',
      persona: 'Compliance Officer'
    },
    expected: 'IDEA_REJECTED by CMA (prohibited domain)',
    result: firewallCheckIdea(
      'Reducing AML/KYC risk with better controls and sanctions screening.',
      'Compliance Officer'
    )
  });

  // Life sciences, weak anchors (BAD)
  results.push({
    name: 'Life sciences, weak anchors (BAD)',
    input: {
      rawIdea: 'Why quality programs fail in pharma - we need better documentation.',
      persona: 'Validation Strategist'
    },
    expected: 'IDEA_REJECTED (fails ≥2 domain anchors)',
    result: firewallCheckIdea(
      'Why quality programs fail in pharma - we need better documentation.',
      'Validation Strategist'
    )
  });

  // Life sciences, strong anchors (GOOD)
  results.push({
    name: 'Life sciences, strong anchors (GOOD)',
    input: {
      rawIdea: 'Why CSV efforts fail FDA inspections under 21 CFR Part 11 and Annex 11. How to improve audit readiness.',
      persona: 'Validation Strategist'
    },
    expected: 'IDEA PASSED from CMA',
    result: firewallCheckIdea(
      'Why CSV efforts fail FDA inspections under 21 CFR Part 11 and Annex 11. How to improve audit readiness.',
      'Validation Strategist'
    )
  });

  // Test 3.2: Draft content tests

  // Brief is good, draft drifts to corporate compliance (BAD)
  results.push({
    name: 'Brief good, draft drifts to corporate (BAD)',
    input: {
      draftContent: 'SOX compliance and DOJ enforcement are key concerns. GDPR fines are rising. Corporate governance is essential.',
      persona: 'Validation Strategist'
    },
    expected: 'DRAFT_REJECTED by CoS (draft drifted from FDA to corporate)',
    result: firewallCheckDraft(
      'SOX compliance and DOJ enforcement are key concerns. GDPR fines are rising. Corporate governance is essential.',
      'Validation Strategist'
    )
  });

  // Brief is good, draft stays GxP-specific (GOOD)
  results.push({
    name: 'Brief good, draft stays GxP-specific (GOOD)',
    input: {
      draftContent: 'FDA validation requirements under 21 CFR Part 11 and Annex 11 require robust CSV practices. PQ/PPQ documentation must demonstrate CAPA closure to save time and reduce rework.',
      persona: 'Validation Strategist'
    },
    expected: 'DRAFT APPROVED - Ready for WordPress publish',
    result: firewallCheckDraft(
      'FDA validation requirements under 21 CFR Part 11 and Annex 11 require robust CSV practices. PQ/PPQ documentation must demonstrate CAPA closure to save time and reduce rework.',
      'Validation Strategist'
    )
  });

  // Test 3.3: Pillar tests

  // No pillar present (BAD)
  results.push({
    name: 'No pillar present (BAD)',
    input: {
      draftContent: 'FDA regulations require 21 CFR Part 11 compliance. Annex 11 governs computerized systems. CSV is mandatory.',
      persona: 'Validation Strategist'
    },
    expected: 'DRAFT_REJECTED (fails pillars check)',
    result: firewallCheckDraft(
      'FDA regulations require 21 CFR Part 11 compliance. Annex 11 governs computerized systems. CSV is mandatory.',
      'Validation Strategist'
    )
  });

  // Time Reclaimed pillar (GOOD)
  results.push({
    name: 'Time Reclaimed pillar (GOOD)',
    input: {
      draftContent: 'FDA validation under 21 CFR Part 11 and Annex 11 can be streamlined. Faster validation cycles save time and reduce documentation burden for CSV teams.',
      persona: 'Validation Strategist'
    },
    expected: 'DRAFT APPROVED (Time Reclaimed pillar)',
    result: firewallCheckDraft(
      'FDA validation under 21 CFR Part 11 and Annex 11 can be streamlined. Faster validation cycles save time and reduce documentation burden for CSV teams.',
      'Validation Strategist'
    )
  });

  // Proof of ROI pillar (GOOD)
  results.push({
    name: 'Proof of ROI pillar (GOOD)',
    input: {
      draftContent: 'FDA compliance under 21 CFR Part 11 and Annex 11 delivers measurable ROI. CSV automation reduces deviations by 40% with quantifiable cost savings.',
      persona: 'Validation Strategist'
    },
    expected: 'DRAFT APPROVED (Proof of ROI pillar)',
    result: firewallCheckDraft(
      'FDA compliance under 21 CFR Part 11 and Annex 11 delivers measurable ROI. CSV automation reduces deviations by 40% with quantifiable cost savings.',
      'Validation Strategist'
    )
  });

  // Professional Equity pillar (GOOD)
  results.push({
    name: 'Professional Equity pillar (GOOD)',
    input: {
      draftContent: 'FDA inspection success under 21 CFR Part 11 and Annex 11 builds professional credibility. CSV excellence drives career advancement and executive visibility.',
      persona: 'Validation Strategist'
    },
    expected: 'DRAFT APPROVED (Professional Equity pillar)',
    result: firewallCheckDraft(
      'FDA inspection success under 21 CFR Part 11 and Annex 11 builds professional credibility. CSV excellence drives career advancement and executive visibility.',
      'Validation Strategist'
    )
  });

  // Test 3.4: End-to-end scenario test - "Why Compliance Programs Fail" (BAD article)
  results.push({
    name: 'End-to-end: "Why Compliance Programs Fail" (current bad article)',
    input: {
      rawIdea: 'Why Compliance Programs Fail: Best practices for enterprise compliance programs. Synergy between departments improves corporate governance and reduces regulatory risk.',
      persona: 'Chief Compliance Officer'
    },
    expected: 'IDEA_REJECTED - This is the exact failure that triggered the firewall',
    result: firewallCheckIdea(
      'Why Compliance Programs Fail: Best practices for enterprise compliance programs. Synergy between departments improves corporate governance and reduces regulatory risk.',
      'Chief Compliance Officer'
    )
  });

  // Calculate summary
  const passed = results.filter(r => r.result.passed === r.expected.includes('GOOD') || r.expected.includes('APPROVED') || r.expected.includes('PASSED'));
  const allCorrect = results.every(r => {
    const shouldPass = r.expected.includes('GOOD') || r.expected.includes('APPROVED') || r.expected.includes('PASSED');
    return r.result.passed === shouldPass;
  });

  res.json({
    summary: {
      total: results.length,
      allTestsPassing: allCorrect,
      message: allCorrect 
        ? '✅ ALL TESTS PASSING - Firewall correctly blocks bad content and approves good content'
        : '⚠️ Some tests may need review'
    },
    testCases: results
  });
});

/**
 * Get firewall configuration (anchors, prohibited terms, pillars, personas)
 */
router.get('/config', async (_req: Request, res: Response) => {
  res.json({
    version: '1.0',
    anchors: editorialFirewall.ANCHORS,
    prohibitedTerms: editorialFirewall.PROHIBITED,
    pillars: editorialFirewall.PILLARS,
    validPersonas: editorialFirewall.PERSONAS,
    rules: {
      audienceLock: 'Requires ≥2 domain anchors from life sciences',
      prohibitedDomains: 'Zero tolerance - any hit blocks content',
      personaLock: 'Must be one of: Rising Leader, Validation Strategist, Compliance Architect',
      pillars: 'Must reinforce: Time Reclaimed, Proof of ROI, or Professional Equity'
    }
  });
});

export default router;
