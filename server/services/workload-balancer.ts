import { storage } from "../storage";
import { type InsertAgentWorkload, type AgentWorkload } from "@shared/schema";

export class WorkloadBalancer {
  
  async initializeWorkloads(): Promise<void> {
    const agents = await storage.getAgents();
    
    for (const agent of agents) {
      const existingWorkload = await storage.getAgentWorkload(agent.id);
      if (!existingWorkload) {
        const workload: InsertAgentWorkload = {
          agentId: agent.id,
          currentTasks: this.getRandomTaskCount(agent.status),
          capacity: this.getAgentCapacity(agent.name),
          utilizationRate: 0,
          priority: this.getAgentPriority(agent.name)
        };
        
        workload.utilizationRate = Math.round((workload.currentTasks / workload.capacity) * 100);
        await storage.createAgentWorkload(workload);
      }
    }
  }
  
  private getRandomTaskCount(status: string): number {
    switch (status) {
      case 'healthy': return Math.floor(Math.random() * 8) + 5; // 5-12 tasks
      case 'conflict': return Math.floor(Math.random() * 6) + 8; // 8-13 tasks  
      case 'delayed': return Math.floor(Math.random() * 10) + 6; // 6-15 tasks
      default: return Math.floor(Math.random() * 8) + 4; // 4-11 tasks
    }
  }
  
  private getAgentCapacity(agentName: string): number {
    const capacities = {
      'CEO Agent': 12,
      'CRO Agent': 15,
      'CMO Agent': 14,
      'COO Agent': 16,
      'Content Agent': 18,
      'Lexi Agent': 13
    };
    return capacities[agentName as keyof typeof capacities] || 12;
  }
  
  private getAgentPriority(agentName: string): string {
    const priorities = {
      'CEO Agent': 'critical',
      'CRO Agent': 'high',
      'CMO Agent': 'high', 
      'COO Agent': 'high',
      'Content Agent': 'medium',
      'Lexi Agent': 'medium'
    };
    return priorities[agentName as keyof typeof priorities] || 'medium';
  }
  
  async updateWorkloads(): Promise<void> {
    const workloads = await storage.getAgentWorkloads();
    
    for (const workload of workloads) {
      const newTaskCount = Math.max(0, workload.currentTasks + Math.floor(Math.random() * 6) - 2); // +/- 2 tasks
      const newUtilization = Math.round((newTaskCount / workload.capacity) * 100);
      
      await storage.updateAgentWorkload(workload.agentId, {
        currentTasks: newTaskCount,
        utilizationRate: newUtilization
      });
    }
  }
  
  async getWorkloadDistribution(): Promise<{
    balanced: AgentWorkload[],
    overloaded: AgentWorkload[],
    underutilized: AgentWorkload[]
  }> {
    const workloads = await storage.getAgentWorkloads();
    
    return {
      balanced: workloads.filter(w => w.utilizationRate >= 60 && w.utilizationRate <= 85),
      overloaded: workloads.filter(w => w.utilizationRate > 85),
      underutilized: workloads.filter(w => w.utilizationRate < 60)
    };
  }
  
  async suggestRebalancing(): Promise<{
    actions: Array<{
      from: string,
      to: string,
      tasks: number,
      reasoning: string
    }>
  }> {
    const distribution = await this.getWorkloadDistribution();
    const actions: Array<{from: string, to: string, tasks: number, reasoning: string}> = [];
    
    // Sort by utilization for optimal redistribution
    const overloaded = distribution.overloaded.sort((a, b) => b.utilizationRate - a.utilizationRate);
    const underutilized = distribution.underutilized.sort((a, b) => a.utilizationRate - b.utilizationRate);
    
    for (const overloadedAgent of overloaded) {
      for (const underutilizedAgent of underutilized) {
        if (overloadedAgent.utilizationRate > 85 && underutilizedAgent.utilizationRate < 60) {
          const tasksToMove = Math.min(
            Math.floor((overloadedAgent.utilizationRate - 80) / 100 * overloadedAgent.capacity),
            Math.floor((70 - underutilizedAgent.utilizationRate) / 100 * underutilizedAgent.capacity)
          );
          
          if (tasksToMove > 0) {
            actions.push({
              from: overloadedAgent.agentId,
              to: underutilizedAgent.agentId,
              tasks: tasksToMove,
              reasoning: `${overloadedAgent.agentId} is at ${overloadedAgent.utilizationRate}% capacity while ${underutilizedAgent.agentId} is at ${underutilizedAgent.utilizationRate}%`
            });
          }
        }
      }
    }
    
    return { actions };
  }
  
  async getCapacityPlanning(): Promise<{
    totalCapacity: number,
    totalCurrentTasks: number,
    overallUtilization: number,
    projectedNeeds: {
      nextWeek: number,
      nextMonth: number
    }
  }> {
    const workloads = await storage.getAgentWorkloads();
    
    const totalCapacity = workloads.reduce((sum, w) => sum + w.capacity, 0);
    const totalCurrentTasks = workloads.reduce((sum, w) => sum + w.currentTasks, 0);
    const overallUtilization = Math.round((totalCurrentTasks / totalCapacity) * 100);
    
    // Simple projection based on current trends
    const growthRate = 0.15; // 15% growth assumption
    const projectedNeeds = {
      nextWeek: Math.round(totalCurrentTasks * (1 + growthRate / 4)),
      nextMonth: Math.round(totalCurrentTasks * (1 + growthRate))
    };
    
    return {
      totalCapacity,
      totalCurrentTasks,
      overallUtilization,
      projectedNeeds
    };
  }
}

export const workloadBalancer = new WorkloadBalancer();