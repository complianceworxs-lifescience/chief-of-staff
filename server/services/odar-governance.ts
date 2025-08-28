import fs from "fs/promises";
import path from "path";

export interface ODARGovernancePolicy {
  version: string;
  gates: {
    spend_per_day_usd: number;
    lifetime_spend_usd: number;
    requires_cco_for_public_claims: boolean;
    block_if_risk_high_increases: boolean;
    new_vendor_requires: string[];
  };
  prioritization: {
    objective: string;
    tie_breakers: string[];
    max_directives: number;
  };
  slas: {
    ingest_by_local: string;
    decision_block_minutes: number;
    escalation_hours_default: number;
  };
  reporting: {
    kpis: string[];
    email_snapshot: boolean;
  };
}

export interface ODARObservation {
  timestamp: string;
  snapshot_id: string;
  data_sources: string[];
  quality_score: number;
  data_gaps: string[];
  artifacts: {
    obs_snapshot_path: string;
  };
}

export interface ODARDiagnosis {
  timestamp: string;
  llm_provider: string;
  hypotheses: Array<{
    kpi: string;
    root_cause: string;
    evidence_links: string[];
    confidence_percent: number;
  }>;
  options: Array<{
    option: string;
    expected_impact: string;
    cost: number;
    time_to_effect: number;
    risk_notes: string;
  }>;
  recommendation: {
    chosen_option: string;
    rationale: string;
  };
  artifacts: {
    diag_bundle_path: string;
  };
}

export interface ODARAction {
  timestamp: string;
  directives_generated: number;
  gates_triggered: string[];
  blocked_directives: number;
  approved_directives: number;
  auto_executed: number;
  artifacts: {
    act_directives_path: string;
  };
}

export interface ODARReview {
  timestamp: string;
  yesterday_results: {
    impact_vs_targets: number;
    cost_actual: number;
    time_actual: number;
  };
  metrics: {
    win_rate: number;
    decision_velocity_hours: number;
    roi_per_day: number;
    guardrail_hits: number;
  };
  learning: {
    promoted_templates: string[];
    downgraded_patterns: string[];
  };
  artifacts: {
    rev_report_path: string;
  };
}

export interface BusinessDirective {
  title: string;
  rationale: string;
  executive_rationale: string; // ≤140 chars
  target_agents: string[];
  priority: "p0" | "p1" | "p2" | "p3";
  deadline: string;
  escalation_hours: number;
  tasks: Array<{
    text: string;
    owner_hint: string;
    due: string;
    link?: string;
  }>;
  success_criteria: Array<{
    kpi: string;
    goal: number;
    unit: string;
    by: string;
  }>;
  business_impact: {
    delta_revenue_pace: number;
    delta_mrr: number;
    delta_risk_high: number;
    delta_gtm_momentum: number;
    cost_per_day: number;
    time_to_effect_days: number;
  };
  requires_ceo_approval: boolean;
  blocked: boolean;
  blocked_reason?: string;
  mitigation_task?: string;
}

export class ODARGovernanceEngine {
  private policy: ODARGovernancePolicy;
  private artifactsPath: string;

  constructor() {
    this.artifactsPath = path.join(process.cwd(), "server", "lineage");
    this.loadPolicy();
  }

  private async loadPolicy(): Promise<void> {
    const defaultPolicy: ODARGovernancePolicy = {
      version: "1.0",
      gates: {
        spend_per_day_usd: 500,
        lifetime_spend_usd: 3000,
        requires_cco_for_public_claims: true,
        block_if_risk_high_increases: true,
        new_vendor_requires: ["CCO", "COO"]
      },
      prioritization: {
        objective: "RevenuePace>=90_this_week",
        tie_breakers: ["risk_gate_pass", "roi_per_day_desc", "cost_asc"],
        max_directives: 5
      },
      slas: {
        ingest_by_local: "06:35",
        decision_block_minutes: 10,
        escalation_hours_default: 72
      },
      reporting: {
        kpis: ["RevenuePace", "NetNewMRR", "RiskHighCount", "GTMMomentum", "DecisionVelocity", "ROIperDay"],
        email_snapshot: true
      }
    };

    try {
      const policyPath = path.join(process.cwd(), "server", "config", "odar-policy.json");
      const policyContent = await fs.readFile(policyPath, "utf-8");
      this.policy = JSON.parse(policyContent);
    } catch (error) {
      console.log("📋 Using default ODAR governance policy");
      this.policy = defaultPolicy;
      
      // Save default policy
      await this.saveDefaultPolicy(defaultPolicy);
    }
  }

  private async saveDefaultPolicy(policy: ODARGovernancePolicy): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), "server", "config");
      await fs.mkdir(configPath, { recursive: true });
      
      const policyPath = path.join(configPath, "odar-policy.json");
      await fs.writeFile(policyPath, JSON.stringify(policy, null, 2));
    } catch (error) {
      console.error("Failed to save default policy:", error);
    }
  }

  // OBSERVE: Data collection and validation
  async observe(dataSources: any): Promise<ODARObservation> {
    const timestamp = new Date().toISOString();
    const snapshotId = `obs_${timestamp.split('T')[0].replace(/-/g, '')}`;
    
    // Data quality assessment
    const requiredSources = ['scoreboard', 'initiatives', 'decisions', 'actions', 'meetings'];
    const availableSources = Object.keys(dataSources);
    const missingRequired = requiredSources.filter(source => !availableSources.includes(source));
    
    const qualityScore = Math.max(0, 100 - (missingRequired.length * 20));
    
    // Data minimization and privacy
    const cleanedData = this.sanitizeData(dataSources);
    
    // Save observation artifact
    await fs.mkdir(this.artifactsPath, { recursive: true });
    const obsPath = path.join(this.artifactsPath, `${snapshotId}.json`);
    await fs.writeFile(obsPath, JSON.stringify(cleanedData, null, 2));

    const observation: ODARObservation = {
      timestamp,
      snapshot_id: snapshotId,
      data_sources: availableSources,
      quality_score: qualityScore,
      data_gaps: missingRequired,
      artifacts: {
        obs_snapshot_path: obsPath
      }
    };

    console.log(`🔍 OBSERVE: Quality ${qualityScore}%, ${availableSources.length}/6 sources, gaps: ${missingRequired.join(',') || 'none'}`);
    
    return observation;
  }

  // DIAGNOSE: AI analysis with business framing
  async diagnose(observation: ODARObservation, aiRecommendations: any): Promise<ODARDiagnosis> {
    const timestamp = new Date().toISOString();
    const diagId = `diag_${timestamp.split('T')[0].replace(/-/g, '')}`;

    // Extract business hypotheses from AI output
    const hypotheses = this.extractHypotheses(aiRecommendations);
    const options = this.extractOptions(aiRecommendations);
    const recommendation = this.selectRecommendation(options);

    // Save diagnosis artifact
    const diagBundle = {
      observation_ref: observation.snapshot_id,
      ai_raw_output: aiRecommendations,
      hypotheses,
      options,
      recommendation,
      policy_applied: this.policy.version
    };

    const diagPath = path.join(this.artifactsPath, `${diagId}.json`);
    await fs.writeFile(diagPath, JSON.stringify(diagBundle, null, 2));

    const diagnosis: ODARDiagnosis = {
      timestamp,
      llm_provider: aiRecommendations.llm_provider || "unknown",
      hypotheses,
      options,
      recommendation,
      artifacts: {
        diag_bundle_path: diagPath
      }
    };

    console.log(`🧠 DIAGNOSE: ${hypotheses.length} hypotheses, ${options.length} options, selected: ${recommendation.chosen_option}`);
    
    return diagnosis;
  }

  // ACT: Apply business gates and guardrails
  async act(directives: BusinessDirective[]): Promise<ODARAction> {
    const timestamp = new Date().toISOString();
    const actId = `act_${timestamp.split('T')[0].replace(/-/g, '')}`;

    let gatesTriggered: string[] = [];
    let blockedCount = 0;
    let approvedCount = 0;
    let autoExecutedCount = 0;

    // Apply business gates to each directive
    for (const directive of directives) {
      const gateResults = this.applyBusinessGates(directive);
      gatesTriggered.push(...gateResults.triggered);
      
      if (gateResults.blocked) {
        directive.blocked = true;
        directive.blocked_reason = gateResults.reason;
        blockedCount++;
      } else if (gateResults.requires_approval) {
        directive.requires_ceo_approval = true;
        approvedCount++;
      } else {
        autoExecutedCount++;
      }
    }

    // Prioritization: Apply max directive limit
    const prioritizedDirectives = this.prioritizeDirectives(
      directives.filter(d => !d.blocked), 
      this.policy.prioritization.max_directives
    );

    // Save action artifact
    const actBundle = {
      original_count: directives.length,
      gates_triggered: gatesTriggered,
      blocked_count: blockedCount,
      approved_count: approvedCount,
      auto_executed_count: autoExecutedCount,
      final_directives: prioritizedDirectives,
      policy_gates: this.policy.gates
    };

    const actPath = path.join(this.artifactsPath, `${actId}.json`);
    await fs.writeFile(actPath, JSON.stringify(actBundle, null, 2));

    const action: ODARAction = {
      timestamp,
      directives_generated: directives.length,
      gates_triggered: [...new Set(gatesTriggered)],
      blocked_directives: blockedCount,
      approved_directives: approvedCount,
      auto_executed: autoExecutedCount,
      artifacts: {
        act_directives_path: actPath
      }
    };

    console.log(`⚡ ACT: ${directives.length} → ${autoExecutedCount} auto + ${approvedCount} approval + ${blockedCount} blocked`);
    
    return action;
  }

  // REVIEW: Learn and adjust for next cycle
  async review(previousResults: any): Promise<ODARReview> {
    const timestamp = new Date().toISOString();
    const revId = `rev_${timestamp.split('T')[0].replace(/-/g, '')}`;

    // Calculate business metrics
    const metrics = this.calculateBusinessMetrics(previousResults);
    
    // Learning: identify successful patterns
    const learning = this.extractLearning(previousResults);

    // Save review artifact
    const revBundle = {
      previous_results: previousResults,
      calculated_metrics: metrics,
      learning_outcomes: learning,
      next_cycle_adjustments: this.suggestAdjustments(metrics)
    };

    const revPath = path.join(this.artifactsPath, `${revId}.json`);
    await fs.writeFile(revPath, JSON.stringify(revBundle, null, 2));

    const review: ODARReview = {
      timestamp,
      yesterday_results: {
        impact_vs_targets: metrics.impact_vs_targets || 0,
        cost_actual: metrics.cost_actual || 0,
        time_actual: metrics.time_actual || 0
      },
      metrics: {
        win_rate: metrics.win_rate || 0,
        decision_velocity_hours: metrics.decision_velocity_hours || 0,
        roi_per_day: metrics.roi_per_day || 0,
        guardrail_hits: metrics.guardrail_hits || 0
      },
      learning: {
        promoted_templates: learning.promoted_templates || [],
        downgraded_patterns: learning.downgraded_patterns || []
      },
      artifacts: {
        rev_report_path: revPath
      }
    };

    console.log(`📊 REVIEW: Win rate ${metrics.win_rate}%, ROI/day $${metrics.roi_per_day}, velocity ${metrics.decision_velocity_hours}h`);
    
    return review;
  }

  // Business gates enforcement
  private applyBusinessGates(directive: BusinessDirective): {
    blocked: boolean;
    requires_approval: boolean;
    triggered: string[];
    reason?: string;
  } {
    const triggered: string[] = [];
    let blocked = false;
    let requires_approval = false;
    let reason = "";

    // Spend gates
    if (directive.business_impact.cost_per_day > this.policy.gates.spend_per_day_usd) {
      triggered.push("spend_per_day");
      requires_approval = true;
    }

    // Risk gates
    if (directive.business_impact.delta_risk_high > 0 && this.policy.gates.block_if_risk_high_increases) {
      if (!directive.mitigation_task) {
        triggered.push("risk_increase_no_mitigation");
        blocked = true;
        reason = "Risk increase without mitigation task";
      }
    }

    // Public claims gate
    if (directive.title.toLowerCase().includes("public") || 
        directive.title.toLowerCase().includes("marketing") ||
        directive.title.toLowerCase().includes("messaging")) {
      if (this.policy.gates.requires_cco_for_public_claims) {
        triggered.push("public_claims");
        requires_approval = true;
      }
    }

    return { blocked, requires_approval, triggered, reason };
  }

  // Directive prioritization with business tie-breakers
  private prioritizeDirectives(directives: BusinessDirective[], maxCount: number): BusinessDirective[] {
    return directives
      .sort((a, b) => {
        // Priority first (p0 > p1 > p2 > p3)
        const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then apply tie-breakers from policy
        for (const tieBreaker of this.policy.prioritization.tie_breakers) {
          switch (tieBreaker) {
            case "roi_per_day_desc":
              const roiDiff = (b.business_impact.delta_mrr / b.business_impact.time_to_effect_days) - 
                             (a.business_impact.delta_mrr / a.business_impact.time_to_effect_days);
              if (roiDiff !== 0) return roiDiff;
              break;
            case "cost_asc":
              const costDiff = a.business_impact.cost_per_day - b.business_impact.cost_per_day;
              if (costDiff !== 0) return costDiff;
              break;
          }
        }
        return 0;
      })
      .slice(0, maxCount);
  }

  // Data sanitization for privacy
  private sanitizeData(data: any): any {
    // Strip PII, hash IDs, aggregate sensitive data
    const cleaned = JSON.parse(JSON.stringify(data));
    
    // Remove any email addresses, names, or personally identifiable info
    const sanitizeObj = (obj: any): any => {
      if (typeof obj === 'string') {
        // Remove email patterns
        obj = obj.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
        // Remove name patterns (basic)
        obj = obj.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME_REDACTED]');
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          obj[key] = sanitizeObj(obj[key]);
        }
      }
      return obj;
    };

    return sanitizeObj(cleaned);
  }

  // Extract business hypotheses from AI output
  private extractHypotheses(aiOutput: any): Array<{
    kpi: string;
    root_cause: string;
    evidence_links: string[];
    confidence_percent: number;
  }> {
    // Parse AI recommendations into structured hypotheses
    const hypotheses = [];
    
    if (aiOutput.directives) {
      for (const directive of aiOutput.directives) {
        hypotheses.push({
          kpi: directive.kpi_impact || "Unknown",
          root_cause: directive.rationale || "Not specified",
          evidence_links: [], // TODO: link to specific data points
          confidence_percent: directive.confidence || 70
        });
      }
    }

    return hypotheses;
  }

  // Extract business options from AI output
  private extractOptions(aiOutput: any): Array<{
    option: string;
    expected_impact: string;
    cost: number;
    time_to_effect: number;
    risk_notes: string;
  }> {
    const options = [];
    
    if (aiOutput.directives) {
      for (const directive of aiOutput.directives) {
        options.push({
          option: directive.action || directive.title,
          expected_impact: directive.kpi_impact || "Unknown",
          cost: directive.business_impact?.cost_per_day || 0,
          time_to_effect: directive.business_impact?.time_to_effect_days || 1,
          risk_notes: directive.risk_notes || "Standard business risk"
        });
      }
    }

    return options;
  }

  // Select best recommendation using business criteria
  private selectRecommendation(options: any[]): {
    chosen_option: string;
    rationale: string;
  } {
    if (options.length === 0) {
      return {
        chosen_option: "No action",
        rationale: "No viable options identified"
      };
    }

    // Select highest ROI option
    const bestOption = options.reduce((best, current) => {
      const currentROI = current.expected_impact / (current.cost * current.time_to_effect);
      const bestROI = best.expected_impact / (best.cost * best.time_to_effect);
      return currentROI > bestROI ? current : best;
    });

    return {
      chosen_option: bestOption.option,
      rationale: `Highest ROI option: ${bestOption.expected_impact} impact at $${bestOption.cost}/day over ${bestOption.time_to_effect} days`
    };
  }

  // Calculate business metrics
  private calculateBusinessMetrics(results: any): any {
    // Mock implementation - integrate with your actual metrics
    return {
      win_rate: 75,
      decision_velocity_hours: 0.5,
      roi_per_day: 150,
      guardrail_hits: 0,
      impact_vs_targets: 85,
      cost_actual: 50,
      time_actual: 1.2
    };
  }

  // Extract learning patterns
  private extractLearning(results: any): any {
    return {
      promoted_templates: [],
      downgraded_patterns: []
    };
  }

  // Suggest adjustments for next cycle
  private suggestAdjustments(metrics: any): string[] {
    const adjustments = [];
    
    if (metrics.win_rate < 60) {
      adjustments.push("Increase directive specificity");
    }
    
    if (metrics.decision_velocity_hours > 1) {
      adjustments.push("Simplify gate logic");
    }
    
    return adjustments;
  }

  // Generate business-oriented prompt headers
  getBusinessPromptHeader(): string {
    return `You are the ComplianceWorxs ODAR engine.
Return JSON only.
Express impact as: delta_revenue_pace, delta_mrr, delta_risk_high, delta_gtm_momentum, cost_per_day, time_to_effect_days.
Respect policy gates. If a gate is breached, include "blocked": true and a mitigation task.
Limit to ${this.policy.prioritization.max_directives} directives. Each directive must have tasks[], success_criteria[], and an executive_rationale (≤140 chars).
Do not include PII; operate on aggregates only.
Current objective: ${this.policy.prioritization.objective}`;
  }

  getPolicy(): ODARGovernancePolicy {
    return this.policy;
  }
}

export const odarGovernance = new ODARGovernanceEngine();