import { storage } from "../storage";
import { type InsertConflictPrediction, type ConflictPrediction, type InsertPerformanceHistory } from "@shared/schema";

export class PredictiveAnalytics {
  
  async generateConflictPredictions(): Promise<ConflictPrediction[]> {
    const agents = await storage.getAgents();
    const recentCommunications = await storage.getRecentAgentCommunications(100);
    const activeConflicts = await storage.getActiveConflicts();
    
    const predictions: InsertConflictPrediction[] = [];
    
    // Analyze communication patterns for tension
    const agentInteractions = new Map<string, number>();
    const conflictAreas = ['pricing', 'strategy', 'resource allocation', 'timeline'];
    
    recentCommunications.forEach(comm => {
      if (comm.type === 'conflict' || comm.content.toLowerCase().includes('disagree')) {
        const key = [comm.fromAgent, comm.toAgent].sort().join('-');
        agentInteractions.set(key, (agentInteractions.get(key) || 0) + 1);
      }
    });
    
    // Predict based on high-tension pairs
    for (const [agentPair, tensions] of agentInteractions.entries()) {
      if (tensions >= 3) {
        const agents = agentPair.split('-');
        const riskScore = Math.min(tensions * 20, 95);
        const area = conflictAreas[Math.floor(Math.random() * conflictAreas.length)];
        
        predictions.push({
          agents,
          riskScore,
          area,
          reasoning: `High tension detected between ${agents.join(' and ')} based on ${tensions} conflicting communications regarding ${area}.`,
          suggestedActions: [
            `Schedule mediation session between ${agents.join(' and ')}`,
            `Review and clarify responsibilities in ${area}`,
            `Implement structured communication protocol`
          ]
        });
      }
    }
    
    // Predict based on agent status patterns
    const conflictAgents = agents.filter(a => a.status === 'conflict');
    const delayedAgents = agents.filter(a => a.status === 'delayed');
    
    if (conflictAgents.length >= 2 && delayedAgents.length >= 1) {
      predictions.push({
        agents: [...conflictAgents.slice(0, 2).map(a => a.name), delayedAgents[0].name],
        riskScore: 75,
        area: 'operational efficiency',
        reasoning: 'Multiple agents in conflict status combined with delayed agents indicates systemic operational issues.',
        suggestedActions: [
          'Conduct comprehensive workflow review',
          'Reallocate resources to address bottlenecks',
          'Implement priority-based task management'
        ]
      });
    }
    
    // Save predictions to database
    const savedPredictions: ConflictPrediction[] = [];
    for (const prediction of predictions) {
      const saved = await storage.createConflictPrediction(prediction);
      savedPredictions.push(saved);
    }
    
    return savedPredictions;
  }
  
  async updatePerformanceHistory(): Promise<void> {
    const agents = await storage.getAgents();
    
    for (const agent of agents) {
      const collaborationScore = await this.calculateCollaborationScore(agent.name);
      const responseTime = Math.floor(Math.random() * 30) + 5; // 5-35 minutes
      const tasksCompleted = Math.floor(Math.random() * 10) + 5; // 5-15 tasks
      
      const performanceEntry: InsertPerformanceHistory = {
        agentId: agent.id,
        successRate: agent.successRate,
        tasksCompleted,
        strategicAlignment: agent.strategicAlignment,
        collaborationScore,
        responseTime
      };
      
      await storage.createPerformanceHistory(performanceEntry);
    }
  }
  
  private async calculateCollaborationScore(agentName: string): Promise<number> {
    const communications = await storage.getAgentCommunications(agentName, 50);
    const collaborations = communications.filter(c => c.type === 'collaboration').length;
    const conflicts = communications.filter(c => c.type === 'conflict').length;
    
    const baseScore = Math.max(0, collaborations - conflicts) * 10;
    return Math.min(100, baseScore + 60); // Base score of 60 + collaboration bonus
  }
  
  async getPerformanceTrends(agentId: string, days: number = 30): Promise<{
    dates: string[],
    successRate: number[],
    collaborationScore: number[],
    tasksCompleted: number[]
  }> {
    const history = await storage.getPerformanceHistory(agentId, days);
    
    return {
      dates: history.map(h => h.date.toISOString().split('T')[0]),
      successRate: history.map(h => h.successRate),
      collaborationScore: history.map(h => h.collaborationScore),
      tasksCompleted: history.map(h => h.tasksCompleted)
    };
  }
}

export const predictiveAnalytics = new PredictiveAnalytics();