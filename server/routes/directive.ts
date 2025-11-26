// Multimillion-Dollar Directive API Routes
import { Router } from 'express';
import { 
  MULTIMILLION_DIRECTIVE, 
  CEO_CONTEXT_BLOCK,
  generateAgentBrief,
  generateWeeklyRollup,
  checkThreshold,
  type DailyBrief
} from '../services/multimillion-directive.js';
import { getGovernanceThresholds } from '../governance.js';
import { listAgents } from '../state/store.js';
import type { AgentState } from '../models/AgentState.js';

const router = Router();

// Get the full directive configuration
router.get('/config', (req, res) => {
  res.json({
    version: MULTIMILLION_DIRECTIVE.version,
    effectiveDate: MULTIMILLION_DIRECTIVE.effectiveDate,
    objective: MULTIMILLION_DIRECTIVE.objective,
    guidingPrinciples: MULTIMILLION_DIRECTIVE.guidingPrinciples,
    growthLine: MULTIMILLION_DIRECTIVE.growthLine,
    executionFramework: MULTIMILLION_DIRECTIVE.executionFramework,
    escalationThresholds: MULTIMILLION_DIRECTIVE.escalationThresholds,
    successCriteria: MULTIMILLION_DIRECTIVE.successCriteria,
    revenueModel: MULTIMILLION_DIRECTIVE.revenueModel,
    brandPositioning: MULTIMILLION_DIRECTIVE.brandPositioning,
    metricsThatMatter: MULTIMILLION_DIRECTIVE.metricsThatMatter
  });
});

// Get success criteria for tracking
router.get('/success-criteria', (req, res) => {
  res.json(MULTIMILLION_DIRECTIVE.successCriteria);
});

// Get revenue model thinking
router.get('/revenue-model', (req, res) => {
  res.json(MULTIMILLION_DIRECTIVE.revenueModel);
});

// Get brand positioning strategy
router.get('/brand-positioning', (req, res) => {
  res.json(MULTIMILLION_DIRECTIVE.brandPositioning);
});

// Get metrics that matter for $5M trajectory
router.get('/metrics', (req, res) => {
  res.json(MULTIMILLION_DIRECTIVE.metricsThatMatter);
});

// Get agent responsibilities per the directive
router.get('/agents', (req, res) => {
  res.json(MULTIMILLION_DIRECTIVE.agentResponsibilities);
});

// Get specific agent's directive responsibilities
router.get('/agents/:agentId', (req, res) => {
  const { agentId } = req.params;
  const agent = MULTIMILLION_DIRECTIVE.agentResponsibilities[
    agentId as keyof typeof MULTIMILLION_DIRECTIVE.agentResponsibilities
  ];
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found in directive' });
  }
  
  res.json(agent);
});

// Get CEO context block for November 26th activation
router.get('/ceo-context', (req, res) => {
  res.json({
    ...CEO_CONTEXT_BLOCK,
    activationDate: '2025-11-26',
    growthLine: MULTIMILLION_DIRECTIVE.growthLine,
    currentStatus: {
      loaded: true,
      lastUpdated: new Date().toISOString()
    }
  });
});

// Get $5M growth line status
router.get('/growth-line', (req, res) => {
  const growthLine = MULTIMILLION_DIRECTIVE.growthLine;
  
  // Calculate current trajectory (would pull from real metrics)
  const currentARR = 0; // Would be pulled from CRO metrics
  const monthlyGrowth = 0;
  
  const trajectory = currentARR >= growthLine.targetARR 
    ? "achieved" 
    : monthlyGrowth >= growthLine.monthlyGrowthTarget 
      ? "on-track" 
      : monthlyGrowth >= 0.05 
        ? "at-risk" 
        : "behind";
  
  res.json({
    target: {
      valuation: growthLine.targetValuation,
      arr: growthLine.targetARR,
      multiple: growthLine.arrMultiple,
      monthlyGrowth: growthLine.monthlyGrowthTarget
    },
    current: {
      arr: currentARR,
      monthlyGrowth: monthlyGrowth,
      trajectory: trajectory
    },
    ltv: growthLine.ltv,
    pricingTiers: {
      starter: '$99/mo',
      professional: '$149/mo',
      enterprise: '$499/mo'
    }
  });
});

// Get all escalation thresholds
router.get('/thresholds', (req, res) => {
  res.json({
    directive: MULTIMILLION_DIRECTIVE.escalationThresholds,
    current: getGovernanceThresholds()
  });
});

// Check a specific threshold
router.post('/thresholds/check', (req, res) => {
  const { category, metric, value } = req.body;
  
  if (!category || !metric || value === undefined) {
    return res.status(400).json({ 
      error: 'Missing required fields: category, metric, value' 
    });
  }
  
  const result = checkThreshold(category, metric, value);
  res.json(result);
});

// Get execution framework schedule
router.get('/execution-framework', (req, res) => {
  res.json(MULTIMILLION_DIRECTIVE.executionFramework);
});

// Generate daily brief for an agent
router.post('/briefs/daily', (req, res) => {
  const { agentId, metrics } = req.body;
  
  if (!agentId || !metrics) {
    return res.status(400).json({ 
      error: 'Missing required fields: agentId, metrics' 
    });
  }
  
  const brief = generateAgentBrief(agentId, metrics);
  res.json(brief);
});

// Generate weekly rollup for CEO
router.post('/briefs/weekly', (req, res) => {
  const { agentBriefs, financialMetrics } = req.body;
  
  if (!agentBriefs || !financialMetrics) {
    return res.status(400).json({ 
      error: 'Missing required fields: agentBriefs, financialMetrics' 
    });
  }
  
  const rollup = generateWeeklyRollup(agentBriefs, financialMetrics);
  res.json(rollup);
});

// Get system mindset alignment status
router.get('/mindset', (req, res) => {
  res.json({
    mindsetShift: CEO_CONTEXT_BLOCK.mindsetShift,
    guidingPrinciples: MULTIMILLION_DIRECTIVE.guidingPrinciples,
    systemVsFounder: {
      systemDriven: [
        "Agents and automation as middle management",
        "Reporting thresholds trigger actions",
        "Escalation rules replace manual oversight",
        "ODAR discipline enforced automatically"
      ],
      founderDriven: [
        "Manual daily decisions",
        "Ad-hoc problem solving",
        "Reactive threshold monitoring",
        "Inconsistent execution cadence"
      ],
      currentMode: "system-driven",
      complianceScore: 85
    }
  });
});

// Get current agent status mapped to directive responsibilities
router.get('/agent-compliance', async (req, res) => {
  const agents: AgentState[] = listAgents();
  const responsibilities = MULTIMILLION_DIRECTIVE.agentResponsibilities;
  
  const compliance = agents.map((agent: AgentState) => {
    const directive = responsibilities[agent.id as keyof typeof responsibilities];
    return {
      id: agent.id,
      displayName: agent.displayName,
      status: agent.status,
      directiveMandate: directive?.mandate || 'No directive assigned',
      kpis: directive?.kpis || [],
      escalationOwns: directive?.escalationOwns || [],
      complianceStatus: agent.status === 'healthy' ? 'aligned' : 'review-needed'
    };
  });
  
  res.json({
    totalAgents: compliance.length,
    aligned: compliance.filter((a: { complianceStatus: string }) => a.complianceStatus === 'aligned').length,
    reviewNeeded: compliance.filter((a: { complianceStatus: string }) => a.complianceStatus === 'review-needed').length,
    agents: compliance
  });
});

export default router;
