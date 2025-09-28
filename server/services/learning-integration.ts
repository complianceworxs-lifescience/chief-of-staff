// Learning Integration Service - Connects agents to learning infrastructure

export interface LearningOutcome {
  agent: string;
  strategy: string;
  outcome: 'success' | 'failure' | 'partial';
  cost: number;
  impact: number;
  confidence: number;
  timestamp: string;
}

export interface StrategyRecommendation {
  strategy: string;
  expected_impact: number;
  confidence: 'high' | 'medium' | 'low';
  cost_efficiency: number;
  learned_from: string[];
}

export class LearningIntegrationService {
  private static instance: LearningIntegrationService;
  private learningHistory: LearningOutcome[] = [];
  private banditState: Record<string, { trials: number; reward: number; successCount: number }> = {};

  static getInstance(): LearningIntegrationService {
    if (!this.instance) {
      this.instance = new LearningIntegrationService();
    }
    return this.instance;
  }

  // Record outcome from agent actions for learning
  recordOutcome(outcome: LearningOutcome): void {
    this.learningHistory.push(outcome);
    
    // Update bandit learning based on outcome
    const success = outcome.outcome === 'success';
    this.updateBanditState(outcome.strategy, success);
    
    console.log(`📚 Learning recorded: ${outcome.agent} → ${outcome.strategy} → ${outcome.outcome} (confidence: ${outcome.confidence}%)`);
  }

  // Update bandit learning state
  private updateBanditState(strategy: string, success: boolean): void {
    if (!this.banditState[strategy]) {
      this.banditState[strategy] = { trials: 0, reward: 0, successCount: 0 };
    }
    
    this.banditState[strategy].trials++;
    if (success) {
      this.banditState[strategy].successCount++;
      this.banditState[strategy].reward = this.banditState[strategy].successCount / this.banditState[strategy].trials;
    }
  }

  // Get optimized strategy recommendations for an agent
  getStrategyRecommendations(agent: string): StrategyRecommendation[] {
    const agentHistory = this.learningHistory.filter(h => h.agent === agent);
    
    // Calculate agent-specific success rates for strategies
    const strategyPerformance = new Map<string, { success: number; total: number; avgCost: number; avgImpact: number }>();
    
    agentHistory.forEach(outcome => {
      const current = strategyPerformance.get(outcome.strategy) || { success: 0, total: 0, avgCost: 0, avgImpact: 0 };
      current.total++;
      if (outcome.outcome === 'success') current.success++;
      current.avgCost = (current.avgCost * (current.total - 1) + outcome.cost) / current.total;
      current.avgImpact = (current.avgImpact * (current.total - 1) + outcome.impact) / current.total;
      strategyPerformance.set(outcome.strategy, current);
    });

    // Generate recommendations combining bandit learning + agent history
    const recommendations: StrategyRecommendation[] = [];
    
    Object.entries(this.banditState).forEach(([strategy, data]) => {
      const agentData = strategyPerformance.get(strategy);
      const globalSuccessRate = data.trials > 0 ? data.reward : 0.5;
      const agentSuccessRate = agentData ? agentData.success / agentData.total : globalSuccessRate;
      
      // Blend global learning with agent-specific performance
      const blendedSuccessRate = agentData ? 
        (globalSuccessRate * 0.3 + agentSuccessRate * 0.7) : 
        globalSuccessRate;
      
      recommendations.push({
        strategy,
        expected_impact: blendedSuccessRate * 100,
        confidence: data.trials > 10 ? 'high' : data.trials > 5 ? 'medium' : 'low',
        cost_efficiency: agentData ? (agentData.avgImpact / Math.max(agentData.avgCost, 1)) : 1,
        learned_from: [`${data.trials} global trials`, agentData ? `${agentData.total} agent trials` : 'global data only']
      });
    });

    return recommendations.sort((a, b) => b.expected_impact - a.expected_impact).slice(0, 5);
  }

  // Adapt agent strategies based on learning
  adaptAgentStrategies(agent: string, currentStrategy: string): { 
    recommendation: 'continue' | 'adjust' | 'switch';
    newStrategy?: string;
    reasoning: string;
  } {
    const recommendations = this.getStrategyRecommendations(agent);
    const currentPerformance = recommendations.find(r => r.strategy === currentStrategy);
    const bestAlternative = recommendations[0];

    if (!currentPerformance) {
      return {
        recommendation: 'switch',
        newStrategy: bestAlternative.strategy,
        reasoning: `No data for current strategy "${currentStrategy}". Switching to best-performing: "${bestAlternative.strategy}" (${bestAlternative.expected_impact}% success rate)`
      };
    }

    if (currentPerformance.expected_impact >= 70) {
      return {
        recommendation: 'continue',
        reasoning: `Current strategy "${currentStrategy}" performing well (${currentPerformance.expected_impact}% expected impact)`
      };
    }

    if (bestAlternative.strategy !== currentStrategy && bestAlternative.expected_impact > currentPerformance.expected_impact + 15) {
      return {
        recommendation: 'switch',
        newStrategy: bestAlternative.strategy,
        reasoning: `Better strategy available: "${bestAlternative.strategy}" (${bestAlternative.expected_impact}% vs ${currentPerformance.expected_impact}%)`
      };
    }

    return {
      recommendation: 'adjust',
      reasoning: `Current strategy "${currentStrategy}" needs optimization (${currentPerformance.expected_impact}% impact). Consider adjusting parameters.`
    };
  }

  // Get agent learning status
  getAgentLearningStatus(agent: string): {
    total_decisions: number;
    success_rate: number;
    top_strategies: string[];
    learning_velocity: 'fast' | 'moderate' | 'slow';
    next_optimization: string;
  } {
    const agentHistory = this.learningHistory.filter(h => h.agent === agent);
    const recentHistory = agentHistory.slice(-20); // Last 20 decisions
    
    const successRate = agentHistory.length > 0 ? 
      agentHistory.filter(h => h.outcome === 'success').length / agentHistory.length : 0;
    
    const strategyCounts = new Map<string, number>();
    agentHistory.forEach(h => {
      strategyCounts.set(h.strategy, (strategyCounts.get(h.strategy) || 0) + 1);
    });
    
    const topStrategies = Array.from(strategyCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([strategy]) => strategy);

    const learningVelocity = recentHistory.length >= 15 ? 'fast' : 
                           recentHistory.length >= 8 ? 'moderate' : 'slow';

    const recommendations = this.getStrategyRecommendations(agent);
    const nextOptimization = recommendations.length > 0 ? 
      `Try "${recommendations[0].strategy}" for ${recommendations[0].expected_impact}% expected impact` :
      'Collect more data for optimization';

    return {
      total_decisions: agentHistory.length,
      success_rate: successRate,
      top_strategies: topStrategies,
      learning_velocity,
      next_optimization
    };
  }

  // Clear learning history (for testing)
  clearHistory(): void {
    this.learningHistory = [];
    console.log('🧹 Learning history cleared');
  }

  // Get full learning analytics
  getAnalytics(): {
    total_outcomes: number;
    global_success_rate: number;
    agent_performance: Record<string, { decisions: number; success_rate: number }>;
    strategy_effectiveness: Record<string, { usage: number; success_rate: number }>;
    learning_trends: string[];
  } {
    const agentPerformance: Record<string, { decisions: number; success_rate: number }> = {};
    const strategyEffectiveness: Record<string, { usage: number; success_rate: number }> = {};

    // Calculate agent performance
    const agentGroups = new Map<string, LearningOutcome[]>();
    this.learningHistory.forEach(outcome => {
      if (!agentGroups.has(outcome.agent)) {
        agentGroups.set(outcome.agent, []);
      }
      agentGroups.get(outcome.agent)!.push(outcome);
    });

    agentGroups.forEach((outcomes, agent) => {
      const successCount = outcomes.filter(o => o.outcome === 'success').length;
      agentPerformance[agent] = {
        decisions: outcomes.length,
        success_rate: outcomes.length > 0 ? successCount / outcomes.length : 0
      };
    });

    // Calculate strategy effectiveness
    const strategyGroups = new Map<string, LearningOutcome[]>();
    this.learningHistory.forEach(outcome => {
      if (!strategyGroups.has(outcome.strategy)) {
        strategyGroups.set(outcome.strategy, []);
      }
      strategyGroups.get(outcome.strategy)!.push(outcome);
    });

    strategyGroups.forEach((outcomes, strategy) => {
      const successCount = outcomes.filter(o => o.outcome === 'success').length;
      strategyEffectiveness[strategy] = {
        usage: outcomes.length,
        success_rate: outcomes.length > 0 ? successCount / outcomes.length : 0
      };
    });

    const globalSuccessRate = this.learningHistory.length > 0 ?
      this.learningHistory.filter(h => h.outcome === 'success').length / this.learningHistory.length : 0;

    return {
      total_outcomes: this.learningHistory.length,
      global_success_rate: globalSuccessRate,
      agent_performance: agentPerformance,
      strategy_effectiveness: strategyEffectiveness,
      learning_trends: [
        `${Object.keys(agentPerformance).length} agents actively learning`,
        `${Object.keys(strategyEffectiveness).length} strategies being tested`,
        `${(globalSuccessRate * 100).toFixed(1)}% overall success rate`
      ]
    };
  }
}

export const learningIntegration = LearningIntegrationService.getInstance();