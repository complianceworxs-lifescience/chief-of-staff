// Tier 2 Autonomy — Upgrade Pack
// Adds: Cost-aware selection, Dynamic orchestration, Freshness contracts, Bandit learning, Risk gates

import { Autonomy, type Signal, type Classification, type Playbook } from './autonomy';

// Tier 2 Configuration
const TIER2_CONFIG = {
  // Budget & pricing
  BUDGET_CAP_DAILY_USD: parseInt(process.env.AUTOREM_BUDGET_CAP_DAILY_USD || '25'),
  COST_PER_RESTART: parseFloat(process.env.AUTOREM_COST_PER_RESTART || '0.02'),
  COST_PER_RETRY: parseFloat(process.env.AUTOREM_COST_PER_RETRY || '0.005'),
  COST_PER_REBALANCE: parseFloat(process.env.AUTOREM_COST_PER_REBALANCE || '0.03'),
  COST_PER_FETCH: parseFloat(process.env.AUTOREM_COST_PER_FETCH || '0.002'),
  VALUE_REVENUE_POINT: parseFloat(process.env.AUTOREM_VALUE_REVENUE_POINT || '1.0'),
  VALUE_MARKETING_POINT: parseFloat(process.env.AUTOREM_VALUE_MARKETING_POINT || '0.3'),
  VALUE_CONTENT_POINT: parseFloat(process.env.AUTOREM_VALUE_CONTENT_POINT || '0.2'),

  // Autoscaling / orchestration
  MAX_CONCURRENCY: parseInt(process.env.AUTOREM_MAX_CONCURRENCY || '8'),
  MIN_CONCURRENCY: parseInt(process.env.AUTOREM_MIN_CONCURRENCY || '1'),
  QUEUE_SLA_MIN: parseInt(process.env.AUTOREM_QUEUE_SLA_MIN || '15'),
  ROI_FLOOR: parseFloat(process.env.AUTOREM_ROI_FLOOR || '0.2'),

  // Data freshness contracts (minutes)
  FRESHNESS_MARKET_INTEL: parseInt(process.env.FRESHNESS_MARKET_INTEL || '60'),
  FRESHNESS_CONTENT_BRIEFS: parseInt(process.env.FRESHNESS_CONTENT_BRIEFS || '1440'),
  FRESHNESS_SALES_PIPELINE: parseInt(process.env.FRESHNESS_SALES_PIPELINE || '30'),

  // Learning loop
  BANDIT_ENABLED: process.env.AUTOREM_BANDIT_ENABLED === 'true' || true,
  BANDIT_EXPLORATION: parseFloat(process.env.AUTOREM_BANDIT_EXPLORATION || '0.15'),

  // Risk gates
  RISK_HITL_THRESHOLD: parseFloat(process.env.AUTOREM_RISK_HITL_THRESHOLD || '0.8'),
  MAX_ESCALATIONS_PER_DAY: parseInt(process.env.AUTOREM_MAX_ESCALATIONS_PER_DAY || '5')
};

// Data dependency contracts
const FRESHNESS_CONTRACTS = {
  'market-intelligence': { 
    freshnessTargetMinutes: TIER2_CONFIG.FRESHNESS_MARKET_INTEL,
    fallback: 'PartnerFeeds',
    degradeMode: 'UseLastKnownGood<=6h'
  },
  'content-manager': { 
    freshnessTargetMinutes: TIER2_CONFIG.FRESHNESS_CONTENT_BRIEFS,
    fallback: 'BaselineTemplates',
    degradeMode: 'UseLastKnownGood<=24h'
  },
  'cro': { 
    freshnessTargetMinutes: TIER2_CONFIG.FRESHNESS_SALES_PIPELINE,
    fallback: 'StaticPipeline',
    degradeMode: 'UseLastKnownGood<=2h'
  }
};

// Bandit state for learning
const banditState: Record<string, { count: number; totalReward: number; avgReward: number }> = {};

// Global concurrency slots tracking
let currentConcurrencySlots: Record<string, number> = {
  'cro': 2, 'cmo': 2, 'content-manager': 1, 'market-intelligence': 1, 
  'ceo': 1, 'coo': 1, 'chief-of-staff': 1
};

// Risk tracking
let dailyEscalations = 0;
let lastEscalationReset = new Date().toDateString();

// Tier 2 Enhanced Playbooks
const TIER2_PLAYBOOKS: Playbook[] = [
  {
    name: "CostAwareRebalance",
    match: { classification: "CAPACITY" },
    steps: [
      { do: "estimateImpact", args: { agentVar: "agent" } },
      { do: "rebalanceByROI", args: { roiFloorVar: "env.AUTOREM_ROI_FLOOR" } },
      { do: "throttleLowROI", args: { reserveSlots: 1 } }
    ],
    successCriteria: { backlogAgeMaxMinutes: TIER2_CONFIG.QUEUE_SLA_MIN }
  },
  {
    name: "FreshnessFirstRetry",
    match: { classification: "DATA_DEP" },
    steps: [
      { do: "checkFreshness", args: { sourceVar: "context.dependencies[0]" } },
      { do: "refreshIfStale", args: { freshnessMapEnv: true } },
      { do: "retryLastTask", args: { backoffMs: 1200, max: 2 } }
    ],
    successCriteria: { inputsValid: true }
  },
  {
    name: "BanditChosenPlaybook",
    match: { classification: "TRANSIENT" },
    steps: [
      { do: "selectByBandit", args: { candidates: ["RestartAndRetryTransient", "FreshnessFirstRetry"] } },
      { do: "executeSelected" }
    ],
    successCriteria: { lastTaskSucceeded: true }
  }
];

// Tier 2 Action Primitives
const Tier2Actions = {
  async estimateImpact({ agentVar }: { agentVar: string }): Promise<{ impactPoints: number }> {
    console.log(`TIER2: Estimating impact for ${agentVar}`);
    
    // Map agent to impact multiplier
    const impactMultipliers: Record<string, number> = {
      'cro': TIER2_CONFIG.VALUE_REVENUE_POINT,
      'cmo': TIER2_CONFIG.VALUE_MARKETING_POINT,
      'content-manager': TIER2_CONFIG.VALUE_CONTENT_POINT,
      'market-intelligence': 0.4,
      'ceo': 0.8,
      'coo': 0.6
    };
    
    const baseImpact = Math.random() * 10 + 5; // 5-15 base points
    const multiplier = impactMultipliers[agentVar] || 0.5;
    const impactPoints = baseImpact * multiplier;
    
    console.log(`TIER2: Agent ${agentVar} impact: ${impactPoints.toFixed(2)} points`);
    return { impactPoints };
  },

  async rebalanceByROI({ roiFloorVar }: { roiFloorVar: string }): Promise<{ slotsRebalanced: number }> {
    console.log(`TIER2: Rebalancing by ROI with floor ${roiFloorVar}`);
    
    // Calculate ROI per agent
    const agentROIs: Record<string, number> = {};
    const totalSlots = Object.values(currentConcurrencySlots).reduce((a, b) => a + b, 0);
    
    for (const [agent, slots] of Object.entries(currentConcurrencySlots)) {
      const impactPerHour = Math.random() * 20 + 10; // Simulated impact
      agentROIs[agent] = impactPerHour / Math.max(slots, 1);
    }
    
    // Rebalance: move slots from low-ROI to high-ROI agents
    let rebalanced = 0;
    const sortedByROI = Object.entries(agentROIs).sort(([,a], [,b]) => b - a);
    
    for (let i = 0; i < sortedByROI.length - 1; i++) {
      const [highROIAgent, highROI] = sortedByROI[i];
      const [lowROIAgent, lowROI] = sortedByROI[sortedByROI.length - 1 - i];
      
      if (highROI > TIER2_CONFIG.ROI_FLOOR && lowROI < TIER2_CONFIG.ROI_FLOOR * 0.8) {
        if (currentConcurrencySlots[lowROIAgent] > TIER2_CONFIG.MIN_CONCURRENCY) {
          currentConcurrencySlots[lowROIAgent]--;
          currentConcurrencySlots[highROIAgent]++;
          rebalanced++;
        }
      }
    }
    
    console.log(`TIER2: Rebalanced ${rebalanced} slots based on ROI`);
    return { slotsRebalanced: rebalanced };
  },

  async throttleLowROI({ reserveSlots }: { reserveSlots: number }): Promise<{ throttled: string[] }> {
    console.log(`TIER2: Throttling low-ROI agents, reserving ${reserveSlots} slots`);
    
    const throttled: string[] = [];
    const totalSlots = Object.values(currentConcurrencySlots).reduce((a, b) => a + b, 0);
    
    if (totalSlots > TIER2_CONFIG.MAX_CONCURRENCY) {
      // Find agents with lowest ROI and throttle them
      const agentROIs: [string, number][] = Object.keys(currentConcurrencySlots).map(agent => {
        const impactPerHour = Math.random() * 20 + 10;
        const slots = currentConcurrencySlots[agent];
        return [agent, impactPerHour / Math.max(slots, 1)];
      });
      
      agentROIs.sort(([,a], [,b]) => a - b); // Sort by ROI ascending
      
      for (const [agent, roi] of agentROIs) {
        if (roi < TIER2_CONFIG.ROI_FLOOR && currentConcurrencySlots[agent] > TIER2_CONFIG.MIN_CONCURRENCY) {
          currentConcurrencySlots[agent]--;
          throttled.push(agent);
          if (Object.values(currentConcurrencySlots).reduce((a, b) => a + b, 0) <= TIER2_CONFIG.MAX_CONCURRENCY) {
            break;
          }
        }
      }
    }
    
    console.log(`TIER2: Throttled agents: ${throttled.join(', ')}`);
    return { throttled };
  },

  async checkFreshness({ sourceVar }: { sourceVar: string }): Promise<{ isStale: boolean; stalenessMinutes: number }> {
    console.log(`TIER2: Checking freshness for source ${sourceVar}`);
    
    const contract = FRESHNESS_CONTRACTS[sourceVar as keyof typeof FRESHNESS_CONTRACTS];
    const stalenessMinutes = Math.random() * 120; // 0-120 minutes old
    const isStale = contract ? stalenessMinutes > contract.freshnessTargetMinutes : stalenessMinutes > 60;
    
    console.log(`TIER2: Source ${sourceVar} is ${isStale ? 'stale' : 'fresh'} (${stalenessMinutes.toFixed(1)}m old)`);
    return { isStale, stalenessMinutes };
  },

  async refreshIfStale({ freshnessMapEnv }: { freshnessMapEnv: boolean }): Promise<{ refreshed: boolean }> {
    console.log(`TIER2: Refreshing stale data sources`);
    
    // Simulate data refresh with some failure probability
    const refreshed = Math.random() > 0.1; // 90% success rate
    
    if (refreshed) {
      console.log(`TIER2: Successfully refreshed stale data`);
    } else {
      console.log(`TIER2: Failed to refresh - will try fallback`);
    }
    
    return { refreshed };
  },

  async selectByBandit({ candidates }: { candidates: string[] }): Promise<{ selectedPlaybook: string }> {
    console.log(`TIER2: Bandit selection from candidates:`, candidates);
    
    if (!TIER2_CONFIG.BANDIT_ENABLED) {
      const selected = candidates[0];
      console.log(`TIER2: Bandit disabled, selected first: ${selected}`);
      return { selectedPlaybook: selected };
    }
    
    // Initialize bandit state for new candidates
    for (const candidate of candidates) {
      if (!banditState[candidate]) {
        banditState[candidate] = { count: 0, totalReward: 0, avgReward: 0 };
      }
    }
    
    // Epsilon-greedy selection
    let selectedPlaybook: string;
    
    if (Math.random() < TIER2_CONFIG.BANDIT_EXPLORATION) {
      // Explore: random selection
      selectedPlaybook = candidates[Math.floor(Math.random() * candidates.length)];
      console.log(`TIER2: Bandit exploring: ${selectedPlaybook}`);
    } else {
      // Exploit: select best performing candidate
      selectedPlaybook = candidates.reduce((best, current) => 
        banditState[current].avgReward > banditState[best].avgReward ? current : best
      );
      console.log(`TIER2: Bandit exploiting best: ${selectedPlaybook} (avg reward: ${banditState[selectedPlaybook].avgReward.toFixed(3)})`);
    }
    
    return { selectedPlaybook };
  },

  async executeSelected(): Promise<{ executed: boolean }> {
    console.log(`TIER2: Executing bandit-selected playbook`);
    // This would execute the playbook selected by selectByBandit
    return { executed: true };
  }
};

// Cost-Aware Playbook Selector
class CostAwareSelector {
  static calculateExpectedUtility(playbook: Playbook, signal: Signal): number {
    const projectedValueGain = this.estimateValueGain(playbook, signal);
    const actionCost = this.calculateActionCost(playbook);
    const riskPenalty = this.calculateRiskPenalty(playbook, signal);
    
    const expectedUtility = projectedValueGain - actionCost - riskPenalty;
    
    console.log(`TIER2: EU for ${playbook.name}: Value=${projectedValueGain.toFixed(2)} - Cost=${actionCost.toFixed(2)} - Risk=${riskPenalty.toFixed(2)} = ${expectedUtility.toFixed(2)}`);
    
    return expectedUtility;
  }

  private static estimateValueGain(playbook: Playbook, signal: Signal): number {
    // Estimate value based on agent type and current metrics
    const agentValueMap: Record<string, number> = {
      'cro': TIER2_CONFIG.VALUE_REVENUE_POINT,
      'cmo': TIER2_CONFIG.VALUE_MARKETING_POINT,
      'content-manager': TIER2_CONFIG.VALUE_CONTENT_POINT,
      'market-intelligence': 0.4,
      'ceo': 0.8,
      'coo': 0.6
    };
    
    const baseValue = agentValueMap[signal.agent] || 0.5;
    const metricsImprovement = (1 - signal.metrics.successRate) + (1 - signal.metrics.alignment);
    
    return baseValue * metricsImprovement * 10; // Scale to reasonable range
  }

  private static calculateActionCost(playbook: Playbook): number {
    let totalCost = 0;
    
    for (const step of playbook.steps) {
      switch (step.do) {
        case 'restartAgent':
          totalCost += TIER2_CONFIG.COST_PER_RESTART;
          break;
        case 'retryLastTask':
          totalCost += TIER2_CONFIG.COST_PER_RETRY * (step.args?.max || 1);
          break;
        case 'reallocateSlots':
        case 'rebalanceByROI':
          totalCost += TIER2_CONFIG.COST_PER_REBALANCE;
          break;
        case 'refreshCache':
        case 'refetchSource':
        case 'refreshIfStale':
          totalCost += TIER2_CONFIG.COST_PER_FETCH;
          break;
        default:
          totalCost += 0.01; // Default small cost
      }
    }
    
    return totalCost;
  }

  private static calculateRiskPenalty(playbook: Playbook, signal: Signal): number {
    let riskScore = 0;
    
    // Budget overrun risk
    if (signal.metrics.costBurnRatePerHour > 5) {
      riskScore += 0.3;
    }
    
    // User-facing blast radius
    if (['cro', 'content-manager'].includes(signal.agent)) {
      riskScore += 0.2;
    }
    
    // Compliance sensitivity
    if (signal.agent === 'market-intelligence') {
      riskScore += 0.1;
    }
    
    return riskScore * 2; // Scale risk penalty
  }
}

// Risk Gate Implementation
class RiskGate {
  static shouldEscalateToHITL(playbook: Playbook, signal: Signal): boolean {
    // Reset daily escalation count if needed
    const today = new Date().toDateString();
    if (lastEscalationReset !== today) {
      dailyEscalations = 0;
      lastEscalationReset = today;
    }
    
    // Check if we've exceeded daily escalation limit
    if (dailyEscalations >= TIER2_CONFIG.MAX_ESCALATIONS_PER_DAY) {
      console.log(`TIER2: Daily escalation limit reached (${dailyEscalations}/${TIER2_CONFIG.MAX_ESCALATIONS_PER_DAY})`);
      return false; // Process without escalation
    }
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(playbook, signal);
    
    console.log(`TIER2: Risk score for ${playbook.name}: ${riskScore.toFixed(3)} (threshold: ${TIER2_CONFIG.RISK_HITL_THRESHOLD})`);
    
    if (riskScore >= TIER2_CONFIG.RISK_HITL_THRESHOLD) {
      dailyEscalations++;
      return true;
    }
    
    return false;
  }

  private static calculateRiskScore(playbook: Playbook, signal: Signal): number {
    let riskScore = 0;
    
    // Budget overrun likelihood
    const dailyBudgetUsed = Math.random() * TIER2_CONFIG.BUDGET_CAP_DAILY_USD;
    const budgetRisk = dailyBudgetUsed / TIER2_CONFIG.BUDGET_CAP_DAILY_USD;
    riskScore += budgetRisk * 0.4;
    
    // User-facing blast radius
    if (['cro', 'content-manager', 'cmo'].includes(signal.agent)) {
      riskScore += 0.3;
    }
    
    // Compliance sensitivity
    if (signal.agent === 'market-intelligence' && signal.context?.errorCode === 'CONFIG') {
      riskScore += 0.2;
    }
    
    // High-impact playbooks
    if (['ResolveInterAgentConflict', 'CostAwareRebalance'].includes(playbook.name)) {
      riskScore += 0.1;
    }
    
    return Math.min(riskScore, 1.0);
  }
}

// Bandit Learning System
class BanditLearning {
  static updateReward(playbookName: string, reward: number): void {
    if (!banditState[playbookName]) {
      banditState[playbookName] = { count: 0, totalReward: 0, avgReward: 0 };
    }
    
    const state = banditState[playbookName];
    state.count++;
    state.totalReward += reward;
    state.avgReward = state.totalReward / state.count;
    
    console.log(`TIER2: Updated bandit for ${playbookName}: reward=${reward.toFixed(3)}, avgReward=${state.avgReward.toFixed(3)}, count=${state.count}`);
  }
  
  static calculateReward(beforeMetrics: any, afterMetrics: any, executionTimeMs: number, cost: number): number {
    const alignmentDelta = (afterMetrics.alignment || 0) - (beforeMetrics.alignment || 0);
    const successRateDelta = (afterMetrics.successRate || 0) - (beforeMetrics.successRate || 0);
    const timeToRecoverMinutes = executionTimeMs / 60000;
    
    const reward = alignmentDelta + successRateDelta - (timeToRecoverMinutes / 10) - (cost / 10);
    
    return reward;
  }
}

// Enhanced Autonomy Class for Tier 2
export class AutonomyTier2 extends Autonomy {
  // Override playbook selection with cost-aware and bandit logic
  static selectPlaybook({ classification, signal }: { classification: Classification; signal?: Signal }): Playbook {
    console.log(`TIER2: Cost-aware playbook selection for ${classification}`);
    
    // Get all matching playbooks (Tier 1 + Tier 2)
    // Since we can't access base class playbooks, use the standard selection as fallback
    const basePlaybook = super.selectPlaybook({ classification });
    const tier2Playbooks = TIER2_PLAYBOOKS.filter(p => p.match.classification === classification);
    const allCandidates = [basePlaybook, ...tier2Playbooks];
    
    if (allCandidates.length === 0) {
      throw new Error(`No playbooks found for classification: ${classification}`);
    }
    
    if (!signal) {
      return allCandidates[0];
    }
    
    // Calculate Expected Utility for each candidate
    const playbooksWithEU = allCandidates.map(playbook => ({
      playbook,
      expectedUtility: CostAwareSelector.calculateExpectedUtility(playbook, signal)
    }));
    
    // Select playbook with highest Expected Utility
    const bestPlaybook = playbooksWithEU.reduce((best, current) => 
      current.expectedUtility > best.expectedUtility ? current : best
    );
    
    console.log(`TIER2: Selected ${bestPlaybook.playbook.name} with EU=${bestPlaybook.expectedUtility.toFixed(3)}`);
    
    return bestPlaybook.playbook;
  }
  
  // Override execution with risk gates and learning
  static async execute(signal: Signal): Promise<void> {
    console.log(`TIER2: Processing signal for ${signal.agent} with Tier 2 enhancements`);
    
    const startTime = Date.now();
    const classification = this.classifyIssue(signal);
    const playbook = this.selectPlaybook({ classification, signal });
    
    // Risk gate check
    if (RiskGate.shouldEscalateToHITL(playbook, signal)) {
      console.log(`TIER2: Risk gate triggered - escalating ${signal.agent} to HITL`);
      
      await this.escalateWithOptions({
        agent: signal.agent,
        context: signal.context || {},
        reason: "HighRiskPlaybook",
        playbook: playbook.name,
        riskScore: RiskGate['calculateRiskScore'](playbook, signal),
        safeOption: { name: "DeferToNextCycle", description: "Wait for lower risk conditions" },
        aggressiveOption: { name: "ExecuteWithMonitoring", description: "Proceed with enhanced monitoring" }
      });
      return;
    }
    
    // Execute with standard Tier 1 logic
    let ok = false;
    let attempt = 0;
    const beforeMetrics = { ...signal.metrics };
    const maxAttempts = 2; // Keep from Tier 1 config
    
    while (!ok && attempt < maxAttempts) {
      attempt++;
      console.log(`TIER2: Attempt ${attempt}/${maxAttempts} for ${signal.agent}`);

      try {
        if (TIER2_PLAYBOOKS.includes(playbook)) {
          await this.runPlaybookTier2(playbook, signal);
        } else {
          await super.runPlaybook(playbook, signal);
        }
        ok = await this.verifyRecovery({ 
          agent: signal.agent, 
          expected: playbook.successCriteria 
        });

        const afterMetrics = await this.fetchMetrics(signal.agent);
        const executionTime = Date.now() - startTime;
        const cost = CostAwareSelector['calculateActionCost'](playbook);
        
        // Calculate bandit reward
        const reward = BanditLearning.calculateReward(beforeMetrics, afterMetrics, executionTime, cost);
        BanditLearning.updateReward(playbook.name, reward);

        await this.logDecision({
          ts: new Date().toISOString(),
          actor: "ChiefOfStaff-Tier2",
          event: "auto_remediation_tier2",
          agent: signal.agent,
          classification,
          playbook: playbook.name,
          attempt,
          ok,
          before: beforeMetrics,
          after: afterMetrics,
          executionTimeMs: executionTime,
          cost,
          reward,
          tier: 2
        });

        if (ok) {
          console.log(`TIER2: Successfully remediated ${signal.agent} using ${playbook.name} (reward: ${reward.toFixed(3)})`);
          break;
        }
      } catch (error) {
        console.error(`TIER2: Error in attempt ${attempt}:`, error);
      }
    }

    if (!ok) {
      console.log(`TIER2: Escalating ${signal.agent} after ${attempt} failed attempts`);
      await this.escalate({
        agent: signal.agent,
        context: signal.context || {},
        reason: "Tier2AutoRemediationFailed",
        recommendations: ["ReassignToCOO", "ReduceScopeAndRetry", "ManualIntervention"]
      });
    }
  }
  
  // Enhanced playbook execution with Tier 2 actions
  static async runPlaybookTier2(playbook: Playbook, signal: Signal): Promise<void> {
    console.log(`TIER2: Executing enhanced playbook ${playbook.name} for ${signal.agent}`);
    
    for (const step of playbook.steps) {
      console.log(`TIER2: Executing step ${step.do}`, step.args);
      const args = this.resolveArgs(step.args, signal);
      
      // Check if it's a Tier 2 action
      if (Tier2Actions[step.do as keyof typeof Tier2Actions]) {
        await Tier2Actions[step.do as keyof typeof Tier2Actions](args);
      } else {
        // Fall back to Tier 1 actions
        await super.runPlaybook(playbook, signal);
        return; // Let Tier 1 handle the rest
      }
    }
  }

  // Enhanced escalation with options
  private static async escalateWithOptions({ agent, context, reason, playbook, riskScore, safeOption, aggressiveOption }: {
    agent: string;
    context: any;
    reason: string;
    playbook: string;
    riskScore: number;
    safeOption: { name: string; description: string };
    aggressiveOption: { name: string; description: string };
  }): Promise<void> {
    const escalationPayload = {
      to: "CEO",
      reason,
      agent,
      context,
      playbook,
      riskScore: riskScore.toFixed(3),
      options: [safeOption, aggressiveOption],
      lineageRef: `decision_lineage.json#${new Date().toISOString()}`
    };

    console.log(`TIER2: Enhanced escalation for ${agent}:`, escalationPayload);
    // Would POST to CEO endpoint in production
  }

  // Global concurrency rebalancer (runs on timer)
  static async rebalanceConcurrency({ slaMin, roiFloor }: { slaMin: number; roiFloor: number }): Promise<void> {
    console.log(`TIER2: Global concurrency rebalancing - SLA: ${slaMin}min, ROI floor: ${roiFloor}`);
    
    const beforeSlots = { ...currentConcurrencySlots };
    
    await Tier2Actions.rebalanceByROI({ roiFloorVar: roiFloor.toString() });
    await Tier2Actions.throttleLowROI({ reserveSlots: TIER2_CONFIG.MIN_CONCURRENCY });
    
    const afterSlots = { ...currentConcurrencySlots };
    
    console.log(`TIER2: Concurrency rebalanced:`, { before: beforeSlots, after: afterSlots });
  }

  // Enhanced KPIs for Tier 2
  static getTier2KPIMetrics() {
    const baseTier1KPIs = super.getKPIMetrics();
    
    return {
      ...baseTier1KPIs,
      tier: 2,
      cost_per_incident: baseTier1KPIs.auto_resolved > 0 ? 
        baseTier1KPIs.total_cost / baseTier1KPIs.auto_resolved : 0,
      concurrency_efficiency: this.calculateConcurrencyEfficiency(),
      bandit_performance: this.getBanditPerformance(),
      escalation_rate: dailyEscalations / TIER2_CONFIG.MAX_ESCALATIONS_PER_DAY,
      freshness_compliance: this.calculateFreshnessCompliance()
    };
  }

  private static calculateConcurrencyEfficiency(): number {
    const totalAllocated = Object.values(currentConcurrencySlots).reduce((a, b) => a + b, 0);
    const totalCapacity = TIER2_CONFIG.MAX_CONCURRENCY;
    return totalAllocated / totalCapacity;
  }

  private static getBanditPerformance(): Record<string, number> {
    const performance: Record<string, number> = {};
    for (const [playbook, state] of Object.entries(banditState)) {
      performance[playbook] = state.avgReward;
    }
    return performance;
  }

  private static calculateFreshnessCompliance(): number {
    // Simulate freshness compliance rate
    return Math.random() * 0.3 + 0.7; // 70-100% compliance
  }

  // Expose helper methods for testing
  static getPlaybooks() {
    return TIER2_PLAYBOOKS; // Return Tier 2 playbooks
  }
  
  static resolveArgs(args: any, signal: Signal): any {
    // Simple args resolution for Tier 2
    const resolvedArgs: any = {};
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && value.startsWith('env.')) {
        const envKey = value.replace('env.', '');
        resolvedArgs[key] = process.env[envKey] || value;
      } else {
        resolvedArgs[key] = value;
      }
    }
    return resolvedArgs;
  }
  
  static async fetchMetrics(agent: string): Promise<any> {
    // Return simulated metrics for Tier 2 testing
    return {
      successRate: Math.random() * 0.3 + 0.7,
      alignment: Math.random() * 0.2 + 0.8,
      backlogAgeMinutes: Math.random() * 30,
      lastTaskSucceeded: Math.random() > 0.2
    };
  }
}

export { TIER2_CONFIG, Tier2Actions, CostAwareSelector, RiskGate, BanditLearning };