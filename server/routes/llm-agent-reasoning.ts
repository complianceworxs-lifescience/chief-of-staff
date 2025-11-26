/**
 * LLM Agent Reasoning API Routes
 * 
 * Provides endpoints for:
 * - Triggering LLM-powered agent decisions
 * - Viewing decision logs
 * - Checking LLM health and token usage
 * - Running ODAR cycles with AI reasoning
 */

import { Router } from 'express';
import { llmAgentReasoning } from '../services/llm-agent-reasoning.js';
import { autonomousLLMAgents } from '../services/autonomous-llm-agents.js';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    const health = await llmAgentReasoning.healthCheck();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/token-usage', (req, res) => {
  res.json(llmAgentReasoning.getTokenUsage());
});

router.get('/agent-budgets', (req, res) => {
  res.json({
    budgets: llmAgentReasoning.getAgentBudgetStatus(),
    totalTokenUsage: llmAgentReasoning.getTokenUsage()
  });
});

router.get('/quota-health', (req, res) => {
  res.json(llmAgentReasoning.getQuotaHealthReport());
});

router.get('/decision-log', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json(llmAgentReasoning.getDecisionLog(limit));
});

router.post('/cos/orchestrate', async (req, res) => {
  try {
    const { activeConflicts, agentStatus, pendingActions, resourceUtilization, driftIndicators } = req.body;
    
    const decision = await llmAgentReasoning.cosOrchestrationDecision({
      activeConflicts: activeConflicts || [],
      agentStatus: agentStatus || {},
      pendingActions: pendingActions || [],
      resourceUtilization: resourceUtilization || {},
      driftIndicators: driftIndicators || []
    });
    
    res.json(decision);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/strategist/analyze', async (req, res) => {
  try {
    const { revenueMetrics, marketSignals, competitorActivity, vqsStatus, rpmForecast } = req.body;
    
    const recommendation = await llmAgentReasoning.strategistAnalysis({
      revenueMetrics: revenueMetrics || {},
      marketSignals: marketSignals || [],
      competitorActivity: competitorActivity || [],
      vqsStatus: vqsStatus || {},
      rpmForecast: rpmForecast || {}
    });
    
    res.json(recommendation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cmo/content-strategy', async (req, res) => {
  try {
    const { engagementMetrics, audienceSegments, contentPerformance, archetypeStats, darkSocialSignals } = req.body;
    
    const decision = await llmAgentReasoning.cmoContentStrategy({
      engagementMetrics: engagementMetrics || {},
      audienceSegments: audienceSegments || [],
      contentPerformance: contentPerformance || [],
      archetypeStats: archetypeStats || {},
      darkSocialSignals: darkSocialSignals || []
    });
    
    res.json(decision);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cro/optimize-offer', async (req, res) => {
  try {
    const { currentOffers, conversionRates, pricingData, abTestResults, revenueGoals } = req.body;
    
    const optimization = await llmAgentReasoning.croOfferOptimization({
      currentOffers: currentOffers || [],
      conversionRates: conversionRates || {},
      pricingData: pricingData || {},
      abTestResults: abTestResults || [],
      revenueGoals: revenueGoals || {}
    });
    
    res.json(optimization);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/content-manager/decide', async (req, res) => {
  try {
    const { contentQueue, stakeholderNeeds, complianceRequirements, recentPublications, engagementFeedback } = req.body;
    
    const decision = await llmAgentReasoning.contentManagerDecision({
      contentQueue: contentQueue || [],
      stakeholderNeeds: stakeholderNeeds || [],
      complianceRequirements: complianceRequirements || [],
      recentPublications: recentPublications || [],
      engagementFeedback: engagementFeedback || []
    });
    
    res.json(decision);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/conflict/analyze', async (req, res) => {
  try {
    const { id, type, severity, agents, description, resourcesInvolved } = req.body;
    
    if (!id || !type) {
      return res.status(400).json({ error: 'Conflict id and type required' });
    }
    
    const analysis = await llmAgentReasoning.analyzeConflict({
      id,
      type,
      severity: severity || 'medium',
      agents: agents || [],
      description: description || '',
      resourcesInvolved: resourcesInvolved || []
    });
    
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/odar/:agent', async (req, res) => {
  try {
    const agent = req.params.agent as any;
    const validAgents = ['CoS', 'Strategist', 'CMO', 'CRO', 'ContentManager'];
    
    if (!validAgents.includes(agent)) {
      return res.status(400).json({ error: 'Invalid agent', validAgents });
    }
    
    const { observe, currentState, recentActions, goals } = req.body;
    
    const odarResult = await llmAgentReasoning.odarCycleReasoning(agent, {
      observe: observe || {},
      currentState: currentState || {},
      recentActions: recentActions || [],
      goals: goals || []
    });
    
    res.json({
      agent,
      cycle: odarResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/run-all-agents', async (req, res) => {
  try {
    const results: Record<string, any> = {};
    const startTime = Date.now();
    
    console.log('🤖 RUNNING LLM-POWERED AGENT CYCLE FOR ALL AGENTS');
    
    results.cos = await llmAgentReasoning.cosOrchestrationDecision({
      activeConflicts: [],
      agentStatus: { CMO: 'active', CRO: 'active', ContentManager: 'active', Strategist: 'active' },
      pendingActions: [],
      resourceUtilization: { CMO: 0.7, CRO: 0.6, ContentManager: 0.5, Strategist: 0.8 },
      driftIndicators: []
    });
    
    results.strategist = await llmAgentReasoning.strategistAnalysis({
      revenueMetrics: { mrr: 11677, growth: 8.5 },
      marketSignals: [{ type: 'competitor', signal: 'new product launch' }],
      competitorActivity: [],
      vqsStatus: { compliant: true },
      rpmForecast: { predicted: 5486, confidence: 93 }
    });
    
    results.cmo = await llmAgentReasoning.cmoContentStrategy({
      engagementMetrics: { likes: 245, comments: 67, shares: 34 },
      audienceSegments: [{ name: 'QA Leaders', size: 3400 }],
      contentPerformance: [],
      archetypeStats: { topPerformer: 'E', avgEngagement: 0.12 },
      darkSocialSignals: []
    });
    
    results.cro = await llmAgentReasoning.croOfferOptimization({
      currentOffers: [{ name: 'Audit Readiness Accelerator', conversion: 0.12 }],
      conversionRates: { tier1: 0.15, tier2: 0.08, tier3: 0.03 },
      pricingData: { avg: 2500 },
      abTestResults: [],
      revenueGoals: { monthly: 50000, current: 12500 }
    });
    
    results.contentManager = await llmAgentReasoning.contentManagerDecision({
      contentQueue: [],
      stakeholderNeeds: [{ segment: 'IT', need: 'integration documentation' }],
      complianceRequirements: [],
      recentPublications: [],
      engagementFeedback: []
    });
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      duration: `${duration}ms`,
      tokenUsage: llmAgentReasoning.getTokenUsage(),
      results
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/autonomous/status', (req, res) => {
  res.json(autonomousLLMAgents.getStatus());
});

router.post('/autonomous/start', (req, res) => {
  autonomousLLMAgents.start();
  res.json({ 
    success: true, 
    message: 'Autonomous LLM agents started',
    status: autonomousLLMAgents.getStatus()
  });
});

router.post('/autonomous/stop', (req, res) => {
  autonomousLLMAgents.stop();
  res.json({ 
    success: true, 
    message: 'Autonomous LLM agents stopped',
    status: autonomousLLMAgents.getStatus()
  });
});

router.post('/autonomous/run-cycle', async (req, res) => {
  try {
    const results = await autonomousLLMAgents.runFullCycle();
    res.json({ 
      success: true, 
      results,
      tokenUsage: llmAgentReasoning.getTokenUsage()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/autonomous/run/:agent', async (req, res) => {
  try {
    const agent = req.params.agent as any;
    const validAgents = ['cos', 'strategist', 'cro', 'cmo', 'contentManager'];
    
    if (!validAgents.includes(agent)) {
      return res.status(400).json({ error: 'Invalid agent', validAgents });
    }
    
    const result = await autonomousLLMAgents.runManualCycle(agent);
    res.json({ 
      success: true, 
      result,
      tokenUsage: llmAgentReasoning.getTokenUsage()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/autonomous/decisions', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  res.json(autonomousLLMAgents.getRecentDecisions(limit));
});

export default router;
