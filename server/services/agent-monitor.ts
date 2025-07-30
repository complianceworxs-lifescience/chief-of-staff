import { storage } from "../storage";
import { type Agent } from "@shared/schema";

export class AgentMonitor {
  
  async checkAgentHealth(agentId: string): Promise<string> {
    const agent = await storage.getAgent(agentId);
    if (!agent) {
      return "Agent not found";
    }

    const now = new Date();
    const timeSinceActive = now.getTime() - agent.lastActive.getTime();
    const hoursInactive = timeSinceActive / (1000 * 60 * 60);

    if (hoursInactive > 48) {
      return `${agent.name} is inactive for ${Math.floor(hoursInactive)} hours`;
    }

    if (agent.status === "error") {
      return `${agent.name} reported error`;
    }

    return "healthy";
  }

  async updateAgentStatus(agentId: string, status: string): Promise<Agent> {
    return await storage.updateAgent(agentId, { 
      status, 
      lastActive: new Date() 
    });
  }

  async getSystemHealth(): Promise<number> {
    const agents = await storage.getAgents();
    const healthyAgents = agents.filter(agent => agent.status === "healthy").length;
    return Math.round((healthyAgents / agents.length) * 100);
  }

  async refreshAgentMetrics(): Promise<void> {
    const agents = await storage.getAgents();
    
    for (const agent of agents) {
      const health = await this.checkAgentHealth(agent.id);
      let status = "healthy";
      
      if (health !== "healthy") {
        if (health.includes("inactive")) {
          status = "error";
        } else if (health.includes("error")) {
          status = "error";
        }
      }

      // Simulate some status updates based on business logic
      if (agent.id === "content" && Math.random() > 0.7) {
        status = "delayed";
      }

      await storage.updateAgent(agent.id, { 
        status,
        lastActive: new Date(Date.now() - Math.random() * 30 * 60 * 1000) // Random last active within 30 minutes
      });
    }

    // Update system metrics
    const systemHealth = await this.getSystemHealth();
    const activeConflicts = await storage.getActiveConflicts();
    
    await storage.createSystemMetrics({
      systemHealth,
      activeAgents: agents.filter(a => a.status === "healthy").length,
      totalAgents: agents.length,
      activeConflicts: activeConflicts.length,
      strategicAlignmentScore: Math.round(agents.reduce((sum, a) => sum + a.strategicAlignment, 0) / agents.length)
    });
  }
}

export const agentMonitor = new AgentMonitor();
