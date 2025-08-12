import { storage } from "../storage";
import { 
  type InsertBusinessGoal, 
  type InsertBusinessMetric, 
  type InsertInitiative, 
  type InsertAgentDirective, 
  type InsertStrategicBrief,
  type BusinessGoal,
  type BusinessMetric,
  type Initiative,
  type AgentDirective,
  type StrategicBrief
} from "@shared/schema";

export class ChiefOfStaffService {
  
  // =====================================
  // 1. INGEST & SYNTHESIZE DATA (The Senses)
  // =====================================
  
  /**
   * Ingest high-level business goals from user
   */
  async setBusinessGoal(goalData: InsertBusinessGoal): Promise<BusinessGoal> {
    return await storage.createBusinessGoal(goalData);
  }
  
  /**
   * Ingest real-time business metrics from executive agents
   */
  async recordBusinessMetric(metricData: InsertBusinessMetric): Promise<BusinessMetric> {
    return await storage.createBusinessMetric(metricData);
  }
  
  /**
   * Get complete business data picture for analysis
   */
  async getBusinessSnapshot(): Promise<{
    goals: BusinessGoal[];
    metrics: BusinessMetric[];
    agents: any[];
    systemHealth: any;
  }> {
    const [goals, metrics, agents, systemMetrics] = await Promise.all([
      storage.getBusinessGoals(),
      storage.getRecentBusinessMetrics(50),
      storage.getAgents(),
      storage.getLatestSystemMetrics()
    ]);
    
    return {
      goals,
      metrics,
      agents,
      systemHealth: systemMetrics
    };
  }
  
  // =====================================
  // 2. ANALYZE & PRIORITIZE (The Brain)
  // =====================================
  
  /**
   * Analyze goals vs reality and generate prioritized initiatives
   */
  async generatePrioritizedInitiatives(): Promise<Initiative[]> {
    const snapshot = await this.getBusinessSnapshot();
    const initiatives: InsertInitiative[] = [];
    
    // Analyze each goal against current reality
    for (const goal of snapshot.goals) {
      if (goal.status !== 'active') continue;
      
      const relevantMetrics = snapshot.metrics.filter(m => m.goalId === goal.id);
      const gapAnalysis = this.analyzeGoalProgress(goal, relevantMetrics);
      
      // Generate initiatives to close the gap
      const goalInitiatives = this.generateInitiativesForGoal(goal, gapAnalysis);
      initiatives.push(...goalInitiatives);
    }
    
    // Score and rank all initiatives
    const scoredInitiatives = initiatives.map((init, index) => ({
      ...init,
      priorityRank: this.calculatePriorityRank(init, snapshot)
    }));
    
    // Sort by priority rank
    scoredInitiatives.sort((a, b) => a.priorityRank - b.priorityRank);
    
    // Store initiatives in database
    const storedInitiatives: Initiative[] = [];
    for (const initiative of scoredInitiatives) {
      const stored = await storage.createInitiative(initiative);
      storedInitiatives.push(stored);
    }
    
    return storedInitiatives;
  }
  
  private analyzeGoalProgress(goal: BusinessGoal, metrics: BusinessMetric[]): {
    currentProgress: number;
    targetProgress: number;
    gapPercentage: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    // Extract numeric values from goal
    const targetValue = this.extractNumericValue(goal.targetValue);
    const currentValue = this.extractNumericValue(goal.currentValue);
    
    const currentProgress = currentValue;
    const targetProgress = targetValue;
    const gapPercentage = targetProgress > 0 ? ((targetProgress - currentProgress) / targetProgress) * 100 : 0;
    
    // Determine risk level based on deadline proximity and gap
    const daysToDeadline = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    if (gapPercentage > 70 && daysToDeadline < 30) riskLevel = 'high';
    else if (gapPercentage > 50 && daysToDeadline < 60) riskLevel = 'medium';
    
    return { currentProgress, targetProgress, gapPercentage, riskLevel };
  }
  
  private generateInitiativesForGoal(goal: BusinessGoal, analysis: any): InsertInitiative[] {
    const initiatives: InsertInitiative[] = [];
    
    if (goal.category === 'revenue' && analysis.gapPercentage > 30) {
      initiatives.push({
        title: `Accelerate Revenue Generation for ${goal.title}`,
        description: `Launch targeted campaigns to close ${Math.round(analysis.gapPercentage)}% revenue gap`,
        goalId: goal.id,
        impactScore: Math.min(95, 60 + Math.round(analysis.gapPercentage / 2)),
        effortScore: 40,
        priorityRank: 1,
        estimatedImpact: `Close ${Math.round(analysis.gapPercentage)}% of revenue gap`,
        requiredResources: ['CRO Agent', 'CFO Agent'],
        status: 'pending'
      });
    }
    
    if (goal.category === 'growth' && analysis.gapPercentage > 25) {
      initiatives.push({
        title: `Growth Acceleration Initiative`,
        description: `Implement growth strategies to achieve ${goal.title}`,
        goalId: goal.id,
        impactScore: 80,
        effortScore: 50,
        priorityRank: 2,
        estimatedImpact: `Accelerate growth by ${Math.round(analysis.gapPercentage / 2)}%`,
        requiredResources: ['CRO Agent', 'COO Agent'],
        status: 'pending'
      });
    }
    
    if (goal.category === 'partnerships' && analysis.gapPercentage > 40) {
      initiatives.push({
        title: `Partnership Development Initiative`,
        description: `Accelerate partnership onboarding for ${goal.title}`,
        goalId: goal.id,
        impactScore: 75,
        effortScore: 60,
        priorityRank: 3,
        estimatedImpact: `Onboard missing partners to achieve goal`,
        requiredResources: ['COO Agent', 'CCO Agent'],
        status: 'pending'
      });
    }
    
    return initiatives;
  }
  
  private calculatePriorityRank(initiative: InsertInitiative, snapshot: any): number {
    // Priority score = (Impact Score - Effort Score) + Goal Priority Multiplier
    const goal = snapshot.goals.find((g: BusinessGoal) => g.id === initiative.goalId);
    const goalPriorityMultiplier = goal?.priority === 'high' ? 20 : goal?.priority === 'medium' ? 10 : 0;
    
    return Math.max(1, 100 - (initiative.impactScore - initiative.effortScore) - goalPriorityMultiplier);
  }
  
  // =====================================
  // 3. DELEGATE & DIRECT (The Voice)
  // =====================================
  
  /**
   * Generate specific directives for each agent based on top initiatives
   */
  async delegateToAgents(topInitiativeIds: string[]): Promise<AgentDirective[]> {
    const directives: AgentDirective[] = [];
    
    for (const initiativeId of topInitiativeIds) {
      const initiative = await storage.getInitiative(initiativeId);
      if (!initiative) continue;
      
      const agentDirectives = this.generateDirectivesForInitiative(initiative);
      
      for (const directiveData of agentDirectives) {
        const directive = await storage.createAgentDirective(directiveData);
        directives.push(directive);
      }
    }
    
    return directives;
  }
  
  private generateDirectivesForInitiative(initiative: Initiative): InsertAgentDirective[] {
    const directives: InsertAgentDirective[] = [];
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
    
    // Generate specific directives based on required resources
    for (const resource of initiative.requiredResources) {
      if (resource === 'CRO Agent') {
        directives.push({
          initiativeId: initiative.id,
          targetAgent: 'cro',
          action: `Execute lead generation campaign for "${initiative.title}"`,
          goal: `Generate qualified leads to support initiative impact`,
          deadline,
          priority: 'p1',
          status: 'assigned'
        });
      }
      
      if (resource === 'CFO Agent') {
        directives.push({
          initiativeId: initiative.id,
          targetAgent: 'cfo',
          action: `Allocate budget and track ROI for "${initiative.title}"`,
          goal: `Ensure cost-effective execution of initiative`,
          deadline,
          priority: 'p1',
          status: 'assigned'
        });
      }
      
      if (resource === 'COO Agent') {
        directives.push({
          initiativeId: initiative.id,
          targetAgent: 'coo',
          action: `Ensure operational capacity for "${initiative.title}"`,
          goal: `Maintain service quality during initiative execution`,
          deadline,
          priority: 'p2',
          status: 'assigned'
        });
      }
      
      if (resource === 'CCO Agent') {
        directives.push({
          initiativeId: initiative.id,
          targetAgent: 'cco',
          action: `Ensure compliance alignment for "${initiative.title}"`,
          goal: `Maintain regulatory compliance during initiative`,
          deadline,
          priority: 'p2',
          status: 'assigned'
        });
      }
    }
    
    return directives;
  }
  
  /**
   * Generate Monday Morning Strategic Brief
   */
  async generateStrategicBrief(): Promise<StrategicBrief> {
    const snapshot = await this.getBusinessSnapshot();
    const initiatives = await storage.getActiveInitiatives();
    const directives = await storage.getActiveDirectives();
    
    // Calculate goal progress
    const goalProgress = snapshot.goals.map(goal => {
      const metrics = snapshot.metrics.filter(m => m.goalId === goal.id);
      const progress = this.analyzeGoalProgress(goal, metrics);
      return {
        goalId: goal.id,
        title: goal.title,
        currentProgress: progress.currentProgress,
        targetProgress: progress.targetProgress,
        gapPercentage: progress.gapPercentage,
        riskLevel: progress.riskLevel
      };
    });
    
    // Generate executive summary
    const totalGoals = snapshot.goals.length;
    const onTrackGoals = goalProgress.filter(g => g.gapPercentage < 25).length;
    const highRiskGoals = goalProgress.filter(g => g.riskLevel === 'high').length;
    
    const executiveSummary = `Strategic Overview: ${onTrackGoals}/${totalGoals} goals on track. ${highRiskGoals} goals at high risk requiring immediate attention. ${initiatives.length} active initiatives driving progress.`;
    
    // Top priorities for the week
    const topPriorities = initiatives.slice(0, 3).map(init => 
      `${init.title} (Impact: ${init.impactScore}/100)`
    );
    
    // Key insights
    const keyInsights = [
      `${directives.length} agent directives assigned for execution`,
      `${highRiskGoals > 0 ? 'Focus required on high-risk goals' : 'Goals progressing as planned'}`,
      `System health at ${snapshot.systemHealth?.systemHealth || 'unknown'}%`
    ];
    
    // Next week focus
    const nextWeekFocus = initiatives.length > 0 
      ? `Primary focus: ${initiatives[0].title}. Secondary: ${initiatives[1]?.title || 'Optimization'}.`
      : 'Focus on operational excellence and goal alignment.';
    
    // Risk factors
    const riskFactors = goalProgress
      .filter(g => g.riskLevel === 'high')
      .map(g => `${g.title}: ${Math.round(g.gapPercentage)}% behind target`);
    
    const briefData: InsertStrategicBrief = {
      weekOf: new Date(),
      executiveSummary,
      goalProgress: JSON.stringify(goalProgress),
      topPriorities,
      keyInsights,
      nextWeekFocus,
      riskFactors
    };
    
    return await storage.createStrategicBrief(briefData);
  }
  
  // =====================================
  // UTILITY METHODS
  // =====================================
  
  private extractNumericValue(value: string): number {
    // Extract numeric value from strings like "$100,000", "30 signups", "2 partners"
    const match = value.replace(/[,$%]/g, '').match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
  
  /**
   * Simulate real-time data ingestion from agents
   */
  async simulateAgentDataIngestion(): Promise<void> {
    const goals = await storage.getBusinessGoals();
    const agents = ['cro', 'cfo', 'coo', 'cco'];
    
    for (const agent of agents) {
      const metrics = this.generateSimulatedMetrics(agent, goals);
      for (const metric of metrics) {
        await storage.createBusinessMetric(metric);
      }
    }
  }
  
  private generateSimulatedMetrics(agent: string, goals: BusinessGoal[]): InsertBusinessMetric[] {
    const metrics: InsertBusinessMetric[] = [];
    
    switch (agent) {
      case 'cro':
        metrics.push({
          sourceAgent: 'cro',
          metricType: 'leads',
          metricName: 'Weekly Lead Generation',
          value: (Math.random() * 20 + 10).toFixed(0),
          unit: 'count',
          goalId: goals.find(g => g.category === 'revenue')?.id
        });
        break;
        
      case 'cfo':
        metrics.push({
          sourceAgent: 'cfo',
          metricType: 'revenue',
          metricName: 'Monthly Revenue',
          value: (Math.random() * 50000 + 25000).toFixed(0),
          unit: 'dollars',
          goalId: goals.find(g => g.category === 'revenue')?.id
        });
        break;
        
      case 'coo':
        metrics.push({
          sourceAgent: 'coo',
          metricType: 'capacity',
          metricName: 'Available Hours',
          value: (Math.random() * 100 + 50).toFixed(0),
          unit: 'hours',
          goalId: goals.find(g => g.category === 'operations')?.id
        });
        break;
        
      case 'cco':
        metrics.push({
          sourceAgent: 'cco',
          metricType: 'compliance',
          metricName: 'Compliance Score',
          value: (Math.random() * 20 + 80).toFixed(0),
          unit: 'percentage',
          goalId: goals.find(g => g.category === 'operations')?.id
        });
        break;
    }
    
    return metrics;
  }
}

export const chiefOfStaff = new ChiefOfStaffService();