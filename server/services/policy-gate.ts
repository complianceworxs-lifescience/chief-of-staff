import fs from "fs/promises";
import path from "path";

export interface PolicyConfig {
  version: string;
  gates: {
    spend_per_day_usd: number;
    lifetime_spend_usd: number;
    requires_cco_for_public_claims: boolean;
    block_if_risk_high_increases: boolean;
    new_vendor_requires: string[];
  };
}

export type DirectiveStatus = 
  | "approved"
  | "needs_ceo" 
  | "needs_cco" 
  | "needs_coo" 
  | "needs_cco_coo" 
  | "needs_multi" 
  | "blocked";

export interface DirectiveAssessment {
  status: DirectiveStatus;
  gates_triggered: string[];
  blocked_reason?: string;
  mitigation_required?: string;
  approval_route?: string[];
}

export interface AIDirective {
  id?: string;
  agent: string;
  action: string;
  rationale: string;
  priority: "p0" | "p1" | "p2" | "p3";
  due: string;
  business_impact?: {
    cost_per_day?: number;
    delta_risk_high?: number;
  };
  tasks?: Array<{
    text: string;
    owner: string;
    due: string;
  }>;
  context?: {
    risk_level?: "low" | "medium" | "high";
  };
}

export class PolicyGate {
  private policy: PolicyConfig;

  constructor() {
    this.loadPolicy();
  }

  private async loadPolicy(): Promise<void> {
    try {
      const policyPath = path.join(process.cwd(), "policy.json");
      const content = await fs.readFile(policyPath, "utf-8");
      this.policy = JSON.parse(content);
      console.log(`📋 Policy loaded: v${this.policy.version}`);
    } catch (error) {
      throw new Error(`Failed to load policy.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Inspects an AI-generated directive and stamps it with approval status
   */
  async assessDirective(directive: AIDirective): Promise<DirectiveAssessment> {
    const gatesTriggered: string[] = [];
    const approvalRequired: string[] = [];
    let blocked = false;
    let blockedReason = "";
    let mitigationRequired = "";

    // Normalize impact fields from various possible locations
    const impact = this.normalizeImpact(directive);

    // Gate 1: Spend gates → CEO approval
    if (impact.cost_per_day > this.policy.gates.spend_per_day_usd) {
      gatesTriggered.push("spend_per_day");
      approvalRequired.push("CEO");
    }

    if (impact.lifetime_cost > this.policy.gates.lifetime_spend_usd) {
      gatesTriggered.push("lifetime_spend");
      approvalRequired.push("CEO");
    }

    // Gate 2: Public claims → CCO approval
    if (this.isPublicClaim(directive) && this.policy.gates.requires_cco_for_public_claims) {
      gatesTriggered.push("public_claims");
      approvalRequired.push("CCO");
    }

    // Gate 3: New vendor → CCO + COO approvals
    if (this.involvesNewVendor(directive)) {
      gatesTriggered.push("new_vendor");
      approvalRequired.push(...this.policy.gates.new_vendor_requires);
    }

    // Gate 4: Risk increase without mitigation → BLOCK
    if (this.policy.gates.block_if_risk_high_increases && impact.delta_risk_high > 0) {
      gatesTriggered.push("risk_increase");
      
      if (!this.checkForMitigation(directive)) {
        blocked = true;
        blockedReason = "Increases Risk High without mitigation task";
        mitigationRequired = "Add mitigation task (e.g., CAPA containment/remediation) or Proof-of-Effectiveness plan with monitoring window";
      }
    }

    // Gate 5: High priority emergency gate
    if (directive.priority === "p0") {
      gatesTriggered.push("emergency_priority");
      approvalRequired.push("CEO");
    }

    // Determine final status
    let status: DirectiveStatus;
    
    if (blocked) {
      status = "blocked";
    } else if (approvalRequired.length === 0) {
      status = "approved";
    } else {
      // Determine approval route based on required approvers
      const uniqueApprovers = [...new Set(approvalRequired)];
      
      if (uniqueApprovers.length === 1) {
        switch (uniqueApprovers[0]) {
          case "CEO": status = "needs_ceo"; break;
          case "CCO": status = "needs_cco"; break;
          case "COO": status = "needs_coo"; break;
          default: status = "needs_ceo"; break;
        }
      } else if (uniqueApprovers.includes("CCO") && uniqueApprovers.includes("COO")) {
        status = "needs_cco_coo";
      } else {
        status = "needs_multi";
      }
    }

    return {
      status,
      gates_triggered: gatesTriggered,
      blocked_reason: blocked ? blockedReason : undefined,
      mitigation_required: blocked ? mitigationRequired : undefined,
      approval_route: approvalRequired.length > 0 ? approvalRequired : undefined
    };
  }

  /**
   * Batch assess multiple directives
   */
  async assessDirectives(directives: AIDirective[]): Promise<Array<{
    directive: AIDirective;
    assessment: DirectiveAssessment;
  }>> {
    const results = [];
    
    for (const directive of directives) {
      const assessment = await this.assessDirective(directive);
      results.push({ directive, assessment });
    }

    return results;
  }

  /**
   * Get summary of assessment results
   */
  getSummary(assessments: Array<{ directive: AIDirective; assessment: DirectiveAssessment }>): {
    total: number;
    approved: number;
    blocked: number;
    needs_approval: number;
    gates_hit: Record<string, number>;
  } {
    const summary = {
      total: assessments.length,
      approved: 0,
      blocked: 0,
      needs_approval: 0,
      gates_hit: {} as Record<string, number>
    };

    for (const { assessment } of assessments) {
      switch (assessment.status) {
        case "approved":
          summary.approved++;
          break;
        case "blocked":
          summary.blocked++;
          break;
        default:
          summary.needs_approval++;
          break;
      }

      // Count gate hits
      for (const gate of assessment.gates_triggered) {
        summary.gates_hit[gate] = (summary.gates_hit[gate] || 0) + 1;
      }
    }

    return summary;
  }

  // Helper methods for gate detection (enhanced with Life Sciences patterns)

  private checkForMitigation(directive: AIDirective): boolean {
    // Check for explicit flag first
    if ((directive as any).mitigation_included === true) {
      return true;
    }

    // Check tasks for mitigation keywords
    for (const task of directive.tasks || []) {
      const text = task.text.toLowerCase();
      const mitigationPattern = /\b(mitigation|mitigate|risk control|capa|poe|proof[- ]?of[- ]?effectiveness|remediation|containment|verification|validation|audit pack|evidence)\b/i;
      
      if (mitigationPattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  private isPublicClaim(directive: AIDirective): boolean {
    // Check for explicit flag first
    if ((directive as any).requires_public_claim_review === true) {
      return true;
    }

    // Build text from directive and tasks
    const taskTexts = directive.tasks?.map(t => t.text).join(' ') || '';
    const text = `${directive.action} ${directive.rationale} ${taskTexts}`.toLowerCase();
    
    // Enhanced pattern for Life Sciences claims
    const claimPattern = /\b(claim|efficacy|safe|effective|fda|regulator|press release|public statement|advertising|marketing claim|testimonial|clinical|therapeutic|indication|dosage)\b/i;

    return claimPattern.test(text);
  }

  private involvesNewVendor(directive: AIDirective): boolean {
    // Check for explicit flag first
    if ((directive as any).introduces_new_vendor === true) {
      return true;
    }

    // Build text from directive and tasks
    const taskTexts = directive.tasks?.map(t => t.text).join(' ') || '';
    const text = `${directive.action} ${directive.rationale} ${taskTexts}`.toLowerCase();
    
    // Enhanced pattern for vendor/integration detection
    const vendorPattern = /\b(new vendor|onboard .*vendor|adopt .*tool|trial .*saas|switch to|procure|third[- ]party integration|cro|cmo|contract)\b/i;

    return vendorPattern.test(text);
  }

  private normalizeImpact(directive: AIDirective): {
    delta_risk_high: number;
    cost_per_day: number;
    lifetime_cost: number;
    time_to_effect_days: number;
  } {
    const impact = directive.business_impact || {};
    const topLevel = directive as any;
    
    return {
      delta_risk_high: this.parseNumber(topLevel.delta_risk_high || impact.delta_risk_high || 0),
      cost_per_day: this.parseNumber(topLevel.cost_per_day || impact.cost_per_day || 0),
      lifetime_cost: this.parseNumber(topLevel.lifetime_cost || impact.lifetime_cost || 0),
      time_to_effect_days: this.parseNumber(topLevel.time_to_effect_days || impact.time_to_effect_days || 1)
    };
  }

  private parseNumber(value: any, defaultValue: number = 0): number {
    try {
      return parseFloat(value) || defaultValue;
    } catch {
      return defaultValue;
    }
  }

  getPolicy(): PolicyConfig {
    return this.policy;
  }

  async reloadPolicy(): Promise<void> {
    await this.loadPolicy();
  }
}

// Export singleton instance
export const policyGate = new PolicyGate();