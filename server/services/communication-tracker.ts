import { storage } from "../storage";
import { type InsertAgentCommunication, type AgentCommunication } from "@shared/schema";

export class CommunicationTracker {
  
  async logCommunication(communication: InsertAgentCommunication): Promise<AgentCommunication> {
    return await storage.createAgentCommunication(communication);
  }

  async getRecentCommunications(limit: number = 50): Promise<AgentCommunication[]> {
    return await storage.getRecentAgentCommunications(limit);
  }

  async getCommunicationsByAgent(agentId: string, limit: number = 20): Promise<AgentCommunication[]> {
    return await storage.getAgentCommunications(agentId, limit);
  }

  async getCollaborationPatterns(): Promise<{
    pairs: Array<{ agents: string[], collaborations: number }>,
    objectives: Array<{ objective: string, agents: string[], communications: number }>
  }> {
    const communications = await storage.getRecentAgentCommunications(500);
    
    // Analyze collaboration pairs
    const pairMap = new Map<string, number>();
    const objectiveMap = new Map<string, { agents: Set<string>, count: number }>();

    communications.forEach(comm => {
      if (comm.toAgent) {
        const pair = [comm.fromAgent, comm.toAgent].sort().join('-');
        pairMap.set(pair, (pairMap.get(pair) || 0) + 1);
      }

      if (comm.relatedObjective) {
        const obj = objectiveMap.get(comm.relatedObjective) || { agents: new Set(), count: 0 };
        obj.agents.add(comm.fromAgent);
        if (comm.toAgent) obj.agents.add(comm.toAgent);
        obj.count++;
        objectiveMap.set(comm.relatedObjective, obj);
      }
    });

    const pairs = Array.from(pairMap.entries()).map(([pair, count]) => ({
      agents: pair.split('-'),
      collaborations: count
    })).sort((a, b) => b.collaborations - a.collaborations);

    const objectives = Array.from(objectiveMap.entries()).map(([obj, data]) => ({
      objective: obj,
      agents: Array.from(data.agents),
      communications: data.count
    })).sort((a, b) => b.communications - a.communications);

    return { pairs, objectives };
  }

  // Simulate agent communications for demo purposes
  async simulateAgentActivity(): Promise<void> {
    const agents = ['CEO Agent', 'CRO Agent', 'CMO Agent', 'COO Agent', 'Content Manager'];
    const objectives = ['Increase Tier 3 MRR by 20%', 'Improve Customer Retention by 15%', 'Expand Content Marketing Reach by 40%'];
    const actions = [
      'Updated quarterly strategy',
      'Reviewed performance metrics',
      'Coordinated campaign launch',
      'Aligned on resource allocation',
      'Shared market analysis',
      'Requested priority adjustment',
      'Completed task delegation',
      'Resolved process conflict'
    ];

    const communications: InsertAgentCommunication[] = [];
    
    for (let i = 0; i < 15; i++) {
      const fromAgent = agents[Math.floor(Math.random() * agents.length)];
      const toAgent = Math.random() > 0.3 ? agents.filter(a => a !== fromAgent)[Math.floor(Math.random() * (agents.length - 1))] : undefined;
      const action = actions[Math.floor(Math.random() * actions.length)];
      const type = Math.random() > 0.7 ? 'conflict' : Math.random() > 0.5 ? 'collaboration' : 'decision';
      const objective = Math.random() > 0.4 ? objectives[Math.floor(Math.random() * objectives.length)] : undefined;

      communications.push({
        fromAgent,
        toAgent,
        action,
        content: `${fromAgent} ${action.toLowerCase()}${toAgent ? ` with ${toAgent}` : ''} regarding ${objective || 'general operations'}.`,
        type,
        relatedObjective: objective
      });
    }

    for (const comm of communications) {
      await this.logCommunication(comm);
    }
  }
}

export const communicationTracker = new CommunicationTracker();