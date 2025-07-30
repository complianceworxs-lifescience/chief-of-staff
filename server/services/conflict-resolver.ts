import { storage } from "../storage";
import { type Conflict, type InsertConflict } from "@shared/schema";

export class ConflictResolver {

  async detectConflict(agentOutputs: Record<string, any>): Promise<boolean> {
    // Check for pricing conflicts between CRO and CMO
    if (agentOutputs.cro?.recommendations?.price && agentOutputs.cmo?.recommendations?.price) {
      if (agentOutputs.cro.recommendations.price !== agentOutputs.cmo.recommendations.price) {
        await this.createPricingConflict(agentOutputs.cro, agentOutputs.cmo);
        return true;
      }
    }

    // Check for budget allocation conflicts
    if (agentOutputs.coo?.budgetAllocation && agentOutputs.content?.budgetAllocation) {
      const cooAllocation = agentOutputs.coo.budgetAllocation;
      const contentAllocation = agentOutputs.content.budgetAllocation;
      
      if (cooAllocation + contentAllocation > 100) {
        await this.createBudgetConflict(agentOutputs.coo, agentOutputs.content);
        return true;
      }
    }

    return false;
  }

  private async createPricingConflict(croOutput: any, cmoOutput: any): Promise<Conflict> {
    const conflict: InsertConflict = {
      title: "Pricing Strategy Conflict",
      area: "Pricing Strategy",
      agents: ["cro", "cmo"],
      positions: {
        cro: croOutput.recommendations?.price || "Increase pricing for better margins",
        cmo: cmoOutput.recommendations?.price || "Maintain competitive pricing"
      },
      status: "active"
    };

    return await storage.createConflict(conflict);
  }

  private async createBudgetConflict(cooOutput: any, contentOutput: any): Promise<Conflict> {
    const conflict: InsertConflict = {
      title: "Budget Allocation Conflict",
      area: "Resource Allocation",
      agents: ["coo", "content"],
      positions: {
        coo: `Allocate ${cooOutput.budgetAllocation}% to operations`,
        content: `Allocate ${contentOutput.budgetAllocation}% to content strategy`
      },
      status: "active"
    };

    return await storage.createConflict(conflict);
  }

  async resolveConflict(conflictId: string, resolution: "auto" | "escalate" | "manual", manualResolution?: string): Promise<Conflict> {
    const conflict = await storage.getConflict(conflictId);
    if (!conflict) {
      throw new Error("Conflict not found");
    }

    let resolvedConflict: Partial<Conflict> = {
      status: "resolved",
      resolvedAt: new Date()
    };

    switch (resolution) {
      case "auto":
        resolvedConflict.resolution = await this.applyAutoResolution(conflict);
        break;
      case "escalate":
        resolvedConflict.status = "escalated";
        resolvedConflict.resolution = "Escalated to CEO Agent for manual review";
        break;
      case "manual":
        resolvedConflict.resolution = manualResolution || "Manually resolved";
        break;
    }

    return await storage.updateConflict(conflictId, resolvedConflict);
  }

  private async applyAutoResolution(conflict: Conflict): Promise<string> {
    // Business logic for auto-resolution
    if (conflict.area.includes("Pricing")) {
      // Default to strategic priority - if growth mode, favor revenue optimization
      return "Applied growth-focused pricing strategy based on strategic objectives";
    }

    if (conflict.area.includes("Budget") || conflict.area.includes("Resource")) {
      // Apply proportional allocation based on strategic alignment scores
      const agents = await storage.getAgents();
      const conflictAgents = conflict.agents.map(id => agents.find(a => a.id === id)).filter(Boolean);
      
      if (conflictAgents.length === 2) {
        const totalAlignment = conflictAgents[0]!.strategicAlignment + conflictAgents[1]!.strategicAlignment;
        const allocation1 = Math.round((conflictAgents[0]!.strategicAlignment / totalAlignment) * 100);
        const allocation2 = 100 - allocation1;
        
        return `Applied proportional allocation: ${conflictAgents[0]!.name} ${allocation1}%, ${conflictAgents[1]!.name} ${allocation2}%`;
      }
    }

    return "Applied default conflict resolution rules";
  }

  async getConflictsByArea(area: string): Promise<Conflict[]> {
    const conflicts = await storage.getConflicts();
    return conflicts.filter(c => c.area === area);
  }

  async getActiveConflictCount(): Promise<number> {
    const activeConflicts = await storage.getActiveConflicts();
    return activeConflicts.length;
  }
}

export const conflictResolver = new ConflictResolver();
