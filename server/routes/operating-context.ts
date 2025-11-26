// API routes for Agent Operating Context v1.5
import { Router } from 'express';
import {
  AGENT_OPERATING_CONTEXT,
  OPERATING_CONTEXT_VERSION,
  COMPANY_CONTEXT,
  STRATEGIC_FRAMEWORK,
  AGENT_ROLES,
  GOVERNANCE_RULES,
  OUTPUT_MANDATES,
  EXECUTION_LOGIC,
  PRIORITY_HIERARCHY,
  INTERCOMMUNICATION_RULES,
  SYSTEM_OUTCOMES,
  PLANNING_CYCLES,
  MATURITY_MODEL,
  REVENUE_SENSITIVITY_MODEL,
  COS_ESCALATION_PROTOCOLS,
  FINAL_DIRECTIVE,
  L5_STRUCTURAL_FIXES,
  MATURITY_STATE,
  checkVQSCompliance,
  checkGovernanceCompliance,
  getMaturityCapabilities,
  generateCoSBriefTemplate
} from '../services/agent-operating-context.js';

const router = Router();

// Get complete operating context (for CoS activation)
router.get('/complete', (req, res) => {
  res.json({
    version: OPERATING_CONTEXT_VERSION,
    status: "ACTIVE",
    deliveredTo: "Chief of Staff (CoS) Agent",
    context: AGENT_OPERATING_CONTEXT
  });
});

// Get version and status
router.get('/status', (req, res) => {
  res.json({
    version: OPERATING_CONTEXT_VERSION,
    status: FINAL_DIRECTIVE.status,
    binding: FINAL_DIRECTIVE.binding,
    maturityState: MATURITY_MODEL.currentState,
    activatedAt: new Date().toISOString()
  });
});

// Get company context
router.get('/company', (req, res) => {
  res.json(COMPANY_CONTEXT);
});

// Get strategic framework (Dunford + Walker + Kern)
router.get('/strategy', (req, res) => {
  res.json(STRATEGIC_FRAMEWORK);
});

// Get all agent roles
router.get('/agents', (req, res) => {
  res.json(AGENT_ROLES);
});

// Get specific agent role
router.get('/agents/:agentId', (req, res) => {
  const agentId = req.params.agentId;
  const agent = AGENT_ROLES[agentId as keyof typeof AGENT_ROLES];
  
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }
  
  res.json(agent);
});

// Get governance rules (immutable)
router.get('/governance', (req, res) => {
  res.json(GOVERNANCE_RULES);
});

// Get output mandates
router.get('/mandates', (req, res) => {
  res.json(OUTPUT_MANDATES);
});

// Get output mandates by period
router.get('/mandates/:period', (req, res) => {
  const period = req.params.period as keyof typeof OUTPUT_MANDATES;
  
  if (!OUTPUT_MANDATES[period]) {
    return res.status(404).json({ error: "Period not found. Use: weekly, biweekly, monthly, quarterly, asNeeded" });
  }
  
  res.json(OUTPUT_MANDATES[period]);
});

// Get execution logic
router.get('/execution', (req, res) => {
  res.json(EXECUTION_LOGIC);
});

// Get Kern conversion sequence
router.get('/execution/kern', (req, res) => {
  res.json(EXECUTION_LOGIC.kernConversionSequence);
});

// Get risk reversal protocol
router.get('/execution/risk-reversal', (req, res) => {
  res.json(EXECUTION_LOGIC.riskReversalProtocol);
});

// Get buyer committee navigation
router.get('/execution/buyer-committee', (req, res) => {
  res.json(EXECUTION_LOGIC.buyerCommitteeNavigation);
});

// Get priority hierarchy
router.get('/priorities', (req, res) => {
  res.json(PRIORITY_HIERARCHY);
});

// Get intercommunication rules
router.get('/communication', (req, res) => {
  res.json(INTERCOMMUNICATION_RULES);
});

// Get system outcomes
router.get('/outcomes', (req, res) => {
  res.json(SYSTEM_OUTCOMES);
});

// Get planning cycles
router.get('/cycles', (req, res) => {
  res.json(PLANNING_CYCLES);
});

// Get specific planning cycle
router.get('/cycles/:period', (req, res) => {
  const period = req.params.period as keyof typeof PLANNING_CYCLES;
  
  if (!PLANNING_CYCLES[period]) {
    return res.status(404).json({ error: "Cycle not found. Use: weekly, monthly, quarterly" });
  }
  
  res.json(PLANNING_CYCLES[period]);
});

// Get maturity model
router.get('/maturity', (req, res) => {
  res.json(MATURITY_MODEL);
});

// Get maturity level capabilities
router.get('/maturity/:level', (req, res) => {
  const level = req.params.level.toUpperCase() as keyof typeof MATURITY_MODEL.levels;
  
  if (!MATURITY_MODEL.levels[level]) {
    return res.status(404).json({ error: "Level not found. Use: L1, L2, L3, L4, L5" });
  }
  
  res.json({
    level,
    ...MATURITY_MODEL.levels[level],
    capabilities: getMaturityCapabilities(level)
  });
});

// Get revenue sensitivity model
router.get('/revenue-model', (req, res) => {
  res.json(REVENUE_SENSITIVITY_MODEL);
});

// Get CoS escalation protocols
router.get('/escalation', (req, res) => {
  res.json(COS_ESCALATION_PROTOCOLS);
});

// Get final directive
router.get('/directive', (req, res) => {
  res.json(FINAL_DIRECTIVE);
});

// CoS Brief Template
router.get('/cos/brief-template', (req, res) => {
  res.json(generateCoSBriefTemplate());
});

// Validate VQS compliance
router.post('/validate/vqs', (req, res) => {
  const { metric, value, type } = req.body;
  
  if (!metric || value === undefined || !type) {
    return res.status(400).json({ error: "Required: metric, value, type (workload|cost|performance)" });
  }
  
  const result = checkVQSCompliance({ metric, value, type });
  res.json(result);
});

// Validate governance compliance
router.post('/validate/governance', (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: "Required: content" });
  }
  
  const result = checkGovernanceCompliance(content);
  res.json(result);
});

// Activation endpoint for CoS
router.post('/activate', (req, res) => {
  res.json({
    status: "ACTIVATED",
    version: OPERATING_CONTEXT_VERSION,
    deliveredTo: "Chief of Staff (CoS) Agent",
    activatedAt: new Date().toISOString(),
    instructions: FINAL_DIRECTIVE.instructions,
    message: "Agent Operating Context v1.5 is now active. CoS Agent is the prime orchestrator. L5 Revenue Optimization Intelligence enabled."
  });
});

// ========================================
// L5 STRUCTURAL FIXES ENDPOINTS (v1.5)
// ========================================

// Get all L5 structural fixes
router.get('/l5/fixes', (req, res) => {
  res.json({
    version: "v1.5",
    transitionComplete: MATURITY_STATE.transitionComplete,
    currentLevel: MATURITY_STATE.currentLevel,
    fixes: L5_STRUCTURAL_FIXES
  });
});

// Get current maturity state
router.get('/l5/maturity', (req, res) => {
  res.json(MATURITY_STATE);
});

// Get Unified Data Layer status
router.get('/l5/unified-data-layer', (req, res) => {
  res.json({
    ...L5_STRUCTURAL_FIXES.unifiedDataLayer,
    enforcement: "All agents must log to Librarian's knowledge graph before ODAR cycle completion"
  });
});

// Get Revenue Offer Ladder
router.get('/l5/offer-ladder', (req, res) => {
  res.json(L5_STRUCTURAL_FIXES.revenueOfferLadder);
});

// Get Weekly Revenue Sprints configuration
router.get('/l5/revenue-sprints', (req, res) => {
  res.json({
    ...L5_STRUCTURAL_FIXES.weeklyRevenueSprints,
    currentWeek: new Date().toISOString(),
    sprintActive: true
  });
});

// Get Objection Intelligence Loop
router.get('/l5/objection-loop', (req, res) => {
  res.json(L5_STRUCTURAL_FIXES.objectionIntelligenceLoop);
});

// L5 Status Dashboard endpoint
router.get('/l5/dashboard', (req, res) => {
  res.json({
    version: OPERATING_CONTEXT_VERSION,
    maturity: MATURITY_STATE,
    fixes: {
      unifiedDataLayer: { ...L5_STRUCTURAL_FIXES.unifiedDataLayer },
      revenueOfferLadder: { ...L5_STRUCTURAL_FIXES.revenueOfferLadder },
      weeklyRevenueSprints: { ...L5_STRUCTURAL_FIXES.weeklyRevenueSprints },
      objectionIntelligenceLoop: { ...L5_STRUCTURAL_FIXES.objectionIntelligenceLoop }
    },
    governance: {
      rulesCount: GOVERNANCE_RULES.rules.length,
      version: GOVERNANCE_RULES.version,
      immutable: GOVERNANCE_RULES.immutable
    },
    status: "L5 Revenue Optimization Intelligence ACTIVE"
  });
});

export default router;
