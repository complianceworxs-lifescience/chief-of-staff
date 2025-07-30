import { storage } from "../storage";
import { type InsertSmartRecommendation, type SmartRecommendation } from "@shared/schema";

export class SmartRecommendationsEngine {
  
  async generateRecommendations(): Promise<SmartRecommendation[]> {
    const agents = await storage.getAgents();
    const conflicts = await storage.getActiveConflicts();
    const objectives = await storage.getStrategicObjectives();
    const workloads = await storage.getAgentWorkloads();
    const predictions = await storage.getConflictPredictions();
    
    const recommendations: InsertSmartRecommendation[] = [];
    
    // Workload optimization recommendations
    const overloadedAgents = workloads.filter(w => w.utilizationRate > 85);
    const underutilizedAgents = workloads.filter(w => w.utilizationRate < 50);
    
    if (overloadedAgents.length > 0 && underutilizedAgents.length > 0) {
      recommendations.push({
        type: 'resource',
        title: 'Optimize Workload Distribution',
        description: `Redistribute tasks from overloaded agents (${overloadedAgents.map(a => a.agentId).join(', ')}) to underutilized agents (${underutilizedAgents.map(a => a.agentId).join(', ')}).`,
        impact: 'high',
        effort: 'medium',
        affectedAgents: [...overloadedAgents.map(a => a.agentId), ...underutilizedAgents.map(a => a.agentId)]
      });
    }
    
    // Strategic alignment recommendations
    const lowAlignmentAgents = agents.filter(a => a.strategicAlignment < 70);
    if (lowAlignmentAgents.length > 0) {
      recommendations.push({
        type: 'strategic',
        title: 'Improve Strategic Alignment',
        description: `Focus alignment training and objective clarification for agents with low alignment scores: ${lowAlignmentAgents.map(a => a.name).join(', ')}.`,
        impact: 'high',
        effort: 'medium',
        affectedAgents: lowAlignmentAgents.map(a => a.name)
      });
    }
    
    // Conflict prevention recommendations
    const highRiskPredictions = predictions.filter(p => p.riskScore > 70 && p.status === 'active');
    if (highRiskPredictions.length > 0) {
      for (const prediction of highRiskPredictions) {
        recommendations.push({
          type: 'conflict',
          title: `Prevent ${prediction.area} Conflict`,
          description: `High risk of conflict detected between ${prediction.agents.join(' and ')}. ${prediction.reasoning}`,
          impact: 'high',
          effort: 'low',
          affectedAgents: prediction.agents
        });
      }
    }
    
    // Performance optimization recommendations
    const lowPerformanceAgents = agents.filter(a => a.successRate < 80);
    if (lowPerformanceAgents.length > 0) {
      recommendations.push({
        type: 'optimization',
        title: 'Boost Agent Performance',
        description: `Implement performance improvement plan for agents with success rates below 80%: ${lowPerformanceAgents.map(a => a.name).join(', ')}.`,
        impact: 'medium',
        effort: 'high',
        affectedAgents: lowPerformanceAgents.map(a => a.name)
      });
    }
    
    // Collaboration enhancement recommendations
    const communications = await storage.getRecentAgentCommunications(100);
    const collaborationMap = new Map<string, number>();
    
    communications.forEach(comm => {
      if (comm.type === 'collaboration' && comm.toAgent) {
        const pair = [comm.fromAgent, comm.toAgent].sort().join('-');
        collaborationMap.set(pair, (collaborationMap.get(pair) || 0) + 1);
      }
    });
    
    const lowCollaborationPairs = Array.from(collaborationMap.entries())
      .filter(([_, count]) => count < 3)
      .map(([pair, _]) => pair.split('-'));
    
    if (lowCollaborationPairs.length > 0) {
      recommendations.push({
        type: 'optimization',
        title: 'Enhance Cross-Agent Collaboration',
        description: `Implement structured collaboration protocols for agent pairs with low interaction: ${lowCollaborationPairs.map(pair => pair.join(' & ')).join(', ')}.`,
        impact: 'medium',
        effort: 'low',
        affectedAgents: lowCollaborationPairs.flat()
      });
    }
    
    // Objective progress recommendations
    const strugglingObjectives = objectives.filter(obj => obj.progress < 30);
    if (strugglingObjectives.length > 0) {
      for (const objective of strugglingObjectives) {
        recommendations.push({
          type: 'strategic',
          title: `Accelerate "${objective.title}" Progress`,
          description: `Objective progress is only ${objective.progress}%. Consider reallocating resources or adjusting timeline.`,
          impact: 'high',
          effort: 'medium',
          affectedAgents: objective.contributingAgents
        });
      }
    }
    
    // Save recommendations to database
    const savedRecommendations: SmartRecommendation[] = [];
    for (const recommendation of recommendations) {
      const saved = await storage.createSmartRecommendation(recommendation);
      savedRecommendations.push(saved);
    }
    
    return savedRecommendations;
  }
  
  async implementRecommendation(id: string): Promise<SmartRecommendation> {
    return await storage.updateSmartRecommendation(id, { status: 'implemented' });
  }
  
  async dismissRecommendation(id: string): Promise<SmartRecommendation> {
    return await storage.updateSmartRecommendation(id, { status: 'dismissed' });
  }
  
  async getPendingRecommendations(): Promise<SmartRecommendation[]> {
    return await storage.getSmartRecommendations('pending');
  }
  
  async getRecommendationsByImpact(impact: string): Promise<SmartRecommendation[]> {
    const allRecommendations = await storage.getSmartRecommendations();
    return allRecommendations.filter(r => r.impact === impact);
  }
}

export const smartRecommendationsEngine = new SmartRecommendationsEngine();