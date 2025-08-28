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

    // Gate 1: Spend per day limit
    const dailyCost = directive.business_impact?.cost_per_day || 0;
    if (dailyCost > this.policy.gates.spend_per_day_usd) {
      gatesTriggered.push("spend_per_day");
      approvalRequired.push("CEO");
    }

    // Gate 2: Risk increase gate
    const riskIncrease = directive.business_impact?.delta_risk_high || 0;
    if (riskIncrease > 0 && this.policy.gates.block_if_risk_high_increases) {
      gatesTriggered.push("risk_increase");
      
      // Check if mitigation is included
      const hasMitigation = this.checkForMitigation(directive);
      if (!hasMitigation) {
        blocked = true;
        blockedReason = "Risk increase without mitigation task";
        mitigationRequired = "Add specific risk mitigation task to directive";
      }
    }

    // Gate 3: Public claims gate
    if (this.isPublicClaim(directive) && this.policy.gates.requires_cco_for_public_claims) {
      gatesTriggered.push("public_claims");
      approvalRequired.push("CCO");
    }

    // Gate 4: New vendor gate
    if (this.involvesNewVendor(directive)) {
      gatesTriggered.push("new_vendor");
      approvalRequired.push(...this.policy.gates.new_vendor_requires);
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

  // Helper methods for gate detection

  private checkForMitigation(directive: AIDirective): boolean {
    // Check if directive includes mitigation language
    const text = `${directive.action} ${directive.rationale} ${directive.tasks?.map(t => t.text).join(' ') || ''}`.toLowerCase();
    
    const mitigationKeywords = [
      'mitigate', 'mitigation', 'risk reduction', 'safeguard', 'backup plan',
      'contingency', 'fallback', 'safety measure', 'risk control', 'prevention'
    ];

    return mitigationKeywords.some(keyword => text.includes(keyword));
  }

  private isPublicClaim(directive: AIDirective): boolean {
    const text = `${directive.action} ${directive.rationale}`.toLowerCase();
    
    const publicKeywords = [
      'public', 'marketing', 'announcement', 'press', 'media', 'blog',
      'social media', 'website', 'campaign', 'advertising', 'promotion',
      'messaging', 'communication', 'content', 'publication'
    ];

    return publicKeywords.some(keyword => text.includes(keyword));
  }

  private involvesNewVendor(directive: AIDirective): boolean {
    const text = `${directive.action} ${directive.rationale}`.toLowerCase();
    
    const vendorKeywords = [
      'vendor', 'supplier', 'third party', 'external', 'contractor',
      'service provider', 'partnership', 'integration', 'api',
      'new tool', 'software', 'platform', 'subscription'
    ];

    return vendorKeywords.some(keyword => text.includes(keyword));
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