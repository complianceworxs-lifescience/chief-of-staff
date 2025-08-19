import { db } from "../db";
import { directiveConflicts, type DirectiveConflict } from "@shared/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

// Governance hierarchy rules from ComplianceWorxs specifications
const GOVERNANCE_RULES = {
  CRO_over_brand: {
    id: "CRO_over_brand",
    priority: 1,
    applies: (conflict: ConflictEvent) => 
      (conflict.category === "revenue" || conflict.trigger.toLowerCase().includes("revenue")) && 
      (conflict.agents.primary === "CRO" || conflict.agents.counterparty === "CRO"),
    winner: (conflict: ConflictEvent) => conflict.agents.primary === "CRO" ? "CRO" : 
                                       conflict.agents.counterparty === "CRO" ? "CRO" : conflict.agents.primary,
    reason: "Revenue-first hierarchy"
  },
  CCO_over_speed: {
    id: "CCO_over_speed", 
    priority: 2,
    applies: (conflict: ConflictEvent) => 
      (conflict.category === "compliance" || conflict.metrics?.compliance_risk_level === "high") && 
      (conflict.agents.primary === "CCO" || conflict.agents.counterparty === "CCO"),
    winner: (conflict: ConflictEvent) => conflict.agents.primary === "CCO" ? "CCO" : 
                                       conflict.agents.counterparty === "CCO" ? "CCO" : conflict.agents.primary,
    reason: "Compliance overrides speed"
  },
  CEO_over_scope: {
    id: "CEO_over_scope",
    priority: 3,
    applies: (conflict: ConflictEvent) => 
      (conflict.category === "strategy" || conflict.trigger.toLowerCase().includes("vision")) && 
      (conflict.agents.primary === "CEO" || conflict.agents.counterparty === "CEO"),
    winner: (conflict: ConflictEvent) => conflict.agents.primary === "CEO" ? "CEO" : 
                                       conflict.agents.counterparty === "CEO" ? "CEO" : conflict.agents.primary,
    reason: "Strategic vision overrides execution"
  },
  COO_over_method: {
    id: "COO_over_method",
    priority: 4,
    applies: (conflict: ConflictEvent) => 
      (conflict.category === "resourcing" || conflict.category === "timeline") && 
      (conflict.agents.primary === "COO" || conflict.agents.counterparty === "COO") &&
      conflict.agents.primary !== "CRO" && conflict.agents.counterparty !== "CRO" &&
      conflict.agents.primary !== "CCO" && conflict.agents.counterparty !== "CCO",
    winner: (conflict: ConflictEvent) => conflict.agents.primary === "COO" ? "COO" : 
                                       conflict.agents.counterparty === "COO" ? "COO" : conflict.agents.primary,
    reason: "Operational efficiency prevails"
  }
};

interface ConflictEvent {
  id: string;
  directive_id: string;
  detected_at: string;
  resolved_at?: string | null;
  status: "auto_resolved" | "needs_intervention" | "intervened" | "dismissed";
  agents: {
    primary: string;
    counterparty: string;
    others?: string[];
  };
  category: "revenue" | "compliance" | "strategy" | "timeline" | "resourcing" | "brand" | "data_quality" | "other";
  trigger: string;
  metrics?: {
    impact_score?: number;
    effort_score?: number;
    revenue_risk_usd?: number;
    compliance_risk_level?: "none" | "low" | "medium" | "high" | "critical";
  };
  governance_rule?: {
    id: string;
    reason: string;
  };
  decision: {
    winner: string;
    action: string;
    next_steps: string[];
  };
  summary: string;
  intercede?: {
    enabled: boolean;
    reason?: string;
    action_id?: string;
  };
}

export class DirectiveConflictResolver {
  async detectAndResolveConflict(conflictData: Partial<ConflictEvent>): Promise<ConflictEvent> {
    // Create basic conflict event
    const conflict: ConflictEvent = {
      id: `cfx_${nanoid(4)}`,
      directive_id: conflictData.directive_id || `dir_${nanoid(4)}`,
      detected_at: new Date().toISOString(),
      status: "auto_resolved",
      agents: conflictData.agents || { primary: "CRO", counterparty: "CMO" },
      category: conflictData.category || "revenue",
      trigger: conflictData.trigger || "Resource allocation conflict detected",
      metrics: conflictData.metrics || {
        impact_score: 85,
        effort_score: 65,
        revenue_risk_usd: 25000,
        compliance_risk_level: "none"
      },
      decision: {
        winner: "",
        action: "",
        next_steps: []
      },
      summary: ""
    };

    // Apply governance rules to resolve conflict
    const resolvedConflict = await this.applyGovernanceRules(conflict);

    // Store in database
    await this.storeConflictResolution(resolvedConflict);

    return resolvedConflict;
  }

  private async applyGovernanceRules(conflict: ConflictEvent): Promise<ConflictEvent> {
    // Check which governance rule applies
    const applicableRules = Object.values(GOVERNANCE_RULES).filter(rule => rule.applies(conflict));
    
    if (applicableRules.length === 0) {
      // Tie-breaker rule - needs intervention
      conflict.status = "needs_intervention";
      conflict.governance_rule = {
        id: "tie_breaker",
        reason: "No clear governance rule applies; manual review required"
      };
      conflict.intercede = {
        enabled: true,
        reason: "No governance rule applies",
        action_id: `act_${nanoid(4)}`
      };
      conflict.decision.winner = "TIE";
      conflict.decision.action = "Conflict escalated for manual resolution";
      conflict.decision.next_steps = ["Review conflict context", "Apply manual decision", "Update governance rules"];
      conflict.summary = `Conflict: ${conflict.agents.primary} vs ${conflict.agents.counterparty} on ${conflict.category}. Resolution pending — needs manual intervention.`;
      return conflict;
    }

    // Apply highest priority rule
    const rule = applicableRules.sort((a, b) => a.priority - b.priority)[0];
    const winner = rule.winner(conflict);

    conflict.governance_rule = {
      id: rule.id,
      reason: rule.reason
    };
    conflict.decision.winner = winner;

    // Generate resolution based on category
    const resolution = this.generateResolution(conflict, winner);
    conflict.decision.action = resolution.action;
    conflict.decision.next_steps = resolution.next_steps;

    // Check if intervention needed based on risk
    const needsIntervention = this.shouldEscalate(conflict);
    if (needsIntervention) {
      conflict.status = "needs_intervention";
      conflict.intercede = {
        enabled: true,
        reason: needsIntervention,
        action_id: `act_${nanoid(4)}`
      };
    } else {
      conflict.status = "auto_resolved";
      conflict.resolved_at = new Date().toISOString();
      conflict.intercede = { enabled: false };
    }

    conflict.summary = this.generateSummary(conflict);
    return conflict;
  }

  private generateResolution(conflict: ConflictEvent, winner: string) {
    const actions: Record<string, any> = {
      revenue: {
        action: `Launch ${winner === 'CRO' ? '1-week enterprise sales sprint' : 'balanced revenue-marketing approach'}`,
        next_steps: ["Update content calendar", "Reallocate budget priorities", "Set enterprise targets"]
      },
      compliance: {
        action: `${winner === 'CCO' ? 'Pause release pending validation' : 'Implement compliance-aware timeline'}`,
        next_steps: ["Run validation tests", "Update compliance documentation", "Schedule sign-off reviews"]
      },
      strategy: {
        action: `${winner === 'CEO' ? 'Align with strategic vision' : 'Balance strategy with execution'}`,
        next_steps: ["Review strategic priorities", "Update execution plan", "Communicate direction"]
      },
      timeline: {
        action: `${winner === 'COO' ? 'Optimize operational timeline' : 'Balance timeline with quality'}`,
        next_steps: ["Update project schedule", "Reallocate resources", "Set milestone reviews"]
      },
      default: {
        action: `Apply ${winner} priority based on governance hierarchy`,
        next_steps: ["Update directive priority", "Reallocate resources", "Monitor outcomes"]
      }
    };

    return actions[conflict.category] || actions.default;
  }

  private shouldEscalate(conflict: ConflictEvent): string | null {
    // Escalate if high compliance risk
    if (conflict.metrics?.compliance_risk_level === "high" || conflict.metrics?.compliance_risk_level === "critical") {
      return "High compliance risk detected";
    }
    
    // Escalate if high revenue risk
    if (conflict.metrics?.revenue_risk_usd && conflict.metrics.revenue_risk_usd > 10000) {
      return "Revenue impact >$10K threshold";
    }

    // Check for repeated conflicts (simulated for demo)
    const isRepeated = Math.random() < 0.1; // 10% chance for demo
    if (isRepeated) {
      return "Repeated conflict pattern detected";
    }

    return null;
  }

  private generateSummary(conflict: ConflictEvent): string {
    const { agents, category, decision, status } = conflict;
    
    if (status === "needs_intervention") {
      return `Conflict: ${agents.primary} vs ${agents.counterparty} on ${category}. Resolution pending — needs manual call.`;
    }
    
    return `Conflict: ${agents.primary} wanted ${this.getCategoryDescription(category, agents.primary)}; ${agents.counterparty} needed ${this.getCategoryDescription(category, agents.counterparty)}. Resolution: ${decision.winner} wins (${conflict.governance_rule?.reason.toLowerCase()}).`;
  }

  private getCategoryDescription(category: string, agent: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      revenue: {
        CRO: "enterprise sales sprint",
        CMO: "brand awareness campaign"
      },
      compliance: {
        CCO: "complete validation",
        COO: "early product ship"
      },
      strategy: {
        CEO: "strategic alignment",
        CRO: "tactical revenue focus"
      },
      timeline: {
        COO: "operational efficiency",
        CMO: "quality review time"
      }
    };

    return descriptions[category]?.[agent] || `${category} priority`;
  }

  private async storeConflictResolution(conflict: ConflictEvent) {
    try {
      await db.insert(directiveConflicts).values({
        directiveId: conflict.directive_id,
        primaryAgent: conflict.agents.primary,
        counterpartyAgent: conflict.agents.counterparty,
        otherAgents: conflict.agents.others || [],
        category: conflict.category,
        trigger: conflict.trigger,
        impactScore: conflict.metrics?.impact_score || 0,
        effortScore: conflict.metrics?.effort_score || 0,
        revenueRiskUsd: conflict.metrics?.revenue_risk_usd || 0,
        complianceRiskLevel: conflict.metrics?.compliance_risk_level || "none",
        governanceRuleId: conflict.governance_rule?.id,
        governanceReason: conflict.governance_rule?.reason,
        winner: conflict.decision.winner,
        action: conflict.decision.action,
        nextSteps: conflict.decision.next_steps,
        summary: conflict.summary,
        notes: `Auto-resolved via ${conflict.governance_rule?.id || 'tie_breaker'} rule`,
        interceptEnabled: conflict.intercede?.enabled || false,
        interceptReason: conflict.intercede?.reason,
        interceptActionId: conflict.intercede?.action_id,
        status: conflict.status,
        resolvedAt: conflict.resolved_at ? new Date(conflict.resolved_at) : null
      });
    } catch (error) {
      console.error("Failed to store conflict resolution:", error);
    }
  }

  async getDirectiveConflicts(directiveId: string) {
    return await db
      .select()
      .from(directiveConflicts)
      .where(eq(directiveConflicts.directiveId, directiveId))
      .orderBy(desc(directiveConflicts.detectedAt));
  }

  async getConflictStats(windowDays: number = 7) {
    const windowDate = new Date();
    windowDate.setDate(windowDate.getDate() - windowDays);

    const conflicts = await db
      .select()
      .from(directiveConflicts)
      .where(eq(directiveConflicts.detectedAt, windowDate.toISOString()));

    const autoResolved = conflicts.filter(c => c.status === "auto_resolved").length;
    const needsIntervention = conflicts.filter(c => c.status === "needs_intervention").length;
    
    // Calculate average resolution time for resolved conflicts
    const resolvedConflicts = conflicts.filter(c => c.resolvedAt);
    let avgResolutionTime = 0;
    if (resolvedConflicts.length > 0) {
      const totalTime = resolvedConflicts.reduce((sum, c) => {
        if (c.resolvedAt) {
          return sum + (new Date(c.resolvedAt).getTime() - new Date(c.detectedAt).getTime());
        }
        return sum;
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedConflicts.length / 1000); // in seconds
    }

    return {
      conflict_stats: {
        window: `${windowDays}d`,
        auto_resolved: autoResolved,
        needs_intervention: needsIntervention,
        avg_time_to_resolution_sec: avgResolutionTime
      }
    };
  }
}