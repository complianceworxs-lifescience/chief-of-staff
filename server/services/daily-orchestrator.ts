import { LLMDirectiveEngine } from "./llm-directive-engine";
import { AgentDispatchService } from "./agent-dispatch";
import { odarGovernance, type ODARObservation, type ODARDiagnosis, type ODARAction, type ODARReview } from "./odar-governance";
import { policyGate, type AIDirective, type DirectiveAssessment } from "./policy-gate";
import fs from "fs/promises";
import path from "path";

interface OrchestrationConfig {
  mode: "once" | "scheduled";
  runAt: string; // Format: "HH:MM" (24-hour)
  timezone: string;
  enableEmailNotifications: boolean;
  dryRun: boolean;
}

interface OrchestrationResult {
  success: boolean;
  timestamp: string;
  run_mode: string;
  odar_cycle: {
    observation: ODARObservation;
    diagnosis: ODARDiagnosis;
    action: ODARAction;
    review?: ODARReview;
  };
  data_sources_loaded: string[];
  directives_generated: number;
  agents_notified: number;
  failed_dispatches: number;
  llm_provider: string;
  execution_time_ms: number;
  business_metrics: {
    decision_velocity_hours: number;
    plan_adherence_pct: number;
    win_rate_pct: number;
    revenue_pace_days_green: number;
    risk_posture_high_count: number;
    roi_per_day: number;
  };
  errors?: string[];
  summary?: any;
}

export class DailyOrchestrator {
  private config: OrchestrationConfig;
  private llmEngine: LLMDirectiveEngine;
  private agentDispatch: AgentDispatchService;
  private isRunning: boolean = false;
  private scheduledTimeout?: NodeJS.Timeout;

  constructor(config?: Partial<OrchestrationConfig>) {
    this.config = {
      mode: "scheduled",
      runAt: process.env.RUN_AT || "06:35",
      timezone: "UTC",
      enableEmailNotifications: true,
      dryRun: process.env.MODE === "dry_run",
      ...config
    };

    this.llmEngine = new LLMDirectiveEngine();
    this.agentDispatch = new AgentDispatchService();
  }

  async start(): Promise<void> {
    if (this.config.mode === "once") {
      await this.runOnce();
    } else {
      this.scheduleDaily();
    }
  }

  async stop(): Promise<void> {
    if (this.scheduledTimeout) {
      clearTimeout(this.scheduledTimeout);
      this.scheduledTimeout = undefined;
    }
    this.isRunning = false;
    console.log("🛑 Daily orchestrator stopped");
  }

  async runOnce(): Promise<OrchestrationResult> {
    if (this.isRunning) {
      throw new Error("Orchestrator is already running");
    }

    console.log("🚀 Starting ODAR Daily Orchestration Cycle");
    const startTime = Date.now();
    this.isRunning = true;

    try {
      // OBSERVE: Data collection and validation
      console.log("🔍 OBSERVE: Data collection and validation...");
      const dataSourcesRaw = await this.loadAllDataSources();
      const observation = await odarGovernance.observe(dataSourcesRaw);
      
      if (observation.quality_score < 60) {
        throw new Error(`Data quality too low (${observation.quality_score}%). Gaps: ${observation.data_gaps.join(', ')}`);
      }

      // DIAGNOSE: AI analysis with business framing
      console.log("🧠 DIAGNOSE: AI analysis with business framing...");
      const rawDirectives = await this.llmEngine.generateDirectives();
      const diagnosis = await odarGovernance.diagnose(observation, rawDirectives);
      
      console.log(`✅ Generated ${rawDirectives.directives.length} directives using ${diagnosis.llm_provider}`);
      console.log(`📈 Agent distribution:`, rawDirectives.summary.by_agent);

      // ACT: Apply policy gates and guardrails
      console.log("⚡ ACT: Applying policy gates and guardrails...");
      const policyAssessments = await policyGate.assessDirectives(rawDirectives.directives as AIDirective[]);
      const policySummary = policyGate.getSummary(policyAssessments);
      
      console.log(`📋 Policy Gates: ${Object.keys(policySummary.gates_hit).join(', ') || 'none'}`);
      console.log(`🚦 Policy Results: ${policySummary.approved} approved + ${policySummary.needs_approval} need approval + ${policySummary.blocked} blocked`);

      // Convert to business directives with policy status
      const businessDirectives = this.convertToBusinessDirectivesWithPolicy(rawDirectives, policyAssessments);
      const action = await odarGovernance.act(businessDirectives);
      
      console.log(`🚦 Final Results: ${action.auto_executed} auto + ${action.approved_directives} approval + ${action.blocked_directives} blocked`);

      // Dispatch approved directives (skip in dry run)
      let dispatchResult;
      if (this.config.dryRun) {
        console.log("🧪 DRY RUN: Skipping agent dispatch");
        dispatchResult = {
          total_dispatched: 0,
          successful: 0,
          failed: 0,
          results: [],
          errors: []
        };
      } else {
        console.log("📤 Dispatching approved directives to agents...");
        const approvedDirectives = businessDirectives.filter(d => !d.blocked && !d.requires_ceo_approval);
        dispatchResult = await this.agentDispatch.dispatchBusinessDirectives(approvedDirectives);
        console.log(`✅ Dispatched to ${dispatchResult.successful} agents, ${dispatchResult.failed} failed`);
      }

      // REVIEW: Close the loop and learn
      console.log("📊 REVIEW: Learning and adjustments...");
      const previousResults = await this.loadPreviousResults();
      const review = await odarGovernance.review(previousResults);

      // Calculate business metrics
      const businessMetrics = {
        decision_velocity_hours: review.metrics.decision_velocity_hours,
        plan_adherence_pct: 85, // Mock - integrate with your tracking
        win_rate_pct: review.metrics.win_rate,
        revenue_pace_days_green: 4, // Mock - from weekly tracking
        risk_posture_high_count: observation.data_gaps.length,
        roi_per_day: review.metrics.roi_per_day
      };

      // Generate CoS snapshot email (optional)
      if (this.config.enableEmailNotifications && !this.config.dryRun) {
        console.log("📧 Sending CoS ODAR snapshot email...");
        await this.sendOdarSnapshotEmail(observation, diagnosis, action, review, businessMetrics);
      }

      const result: OrchestrationResult = {
        success: true,
        timestamp: new Date().toISOString(),
        run_mode: this.config.mode,
        odar_cycle: {
          observation,
          diagnosis,
          action,
          review
        },
        data_sources_loaded: observation.data_sources,
        directives_generated: rawDirectives.directives.length,
        agents_notified: dispatchResult.successful,
        failed_dispatches: dispatchResult.failed,
        llm_provider: diagnosis.llm_provider,
        execution_time_ms: Date.now() - startTime,
        business_metrics: businessMetrics,
        summary: rawDirectives.summary
      };

      console.log("🎉 ODAR cycle completed successfully!");
      console.log(`⏱️  Decision velocity: ${businessMetrics.decision_velocity_hours}h`);
      console.log(`📈 ROI/day: $${businessMetrics.roi_per_day}`);
      console.log(`🎯 Win rate: ${businessMetrics.win_rate_pct}%`);

      // Log result for audit trail
      await this.logOrchestrationResult(result);

      return result;

    } catch (error) {
      const errorResult: OrchestrationResult = {
        success: false,
        timestamp: new Date().toISOString(),
        run_mode: this.config.mode,
        odar_cycle: {} as any, // Incomplete cycle
        data_sources_loaded: [],
        directives_generated: 0,
        agents_notified: 0,
        failed_dispatches: 0,
        llm_provider: "none",
        execution_time_ms: Date.now() - startTime,
        business_metrics: {
          decision_velocity_hours: 0,
          plan_adherence_pct: 0,
          win_rate_pct: 0,
          revenue_pace_days_green: 0,
          risk_posture_high_count: 999,
          roi_per_day: -100
        },
        errors: [error instanceof Error ? error.message : String(error)]
      };

      console.error("❌ ODAR orchestration failed:", error);
      await this.logOrchestrationResult(errorResult);
      
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private scheduleDaily(): void {
    const [hours, minutes] = this.config.runAt.split(':').map(Number);
    
    const scheduleNext = () => {
      const now = new Date();
      const scheduled = new Date();
      scheduled.setUTCHours(hours, minutes, 0, 0);
      
      // If scheduled time has passed today, schedule for tomorrow
      if (scheduled <= now) {
        scheduled.setUTCDate(scheduled.getUTCDate() + 1);
      }

      const delay = scheduled.getTime() - now.getTime();
      
      console.log(`⏰ Daily orchestrator scheduled for ${scheduled.toISOString()} (in ${Math.round(delay/1000/60)} minutes)`);
      
      this.scheduledTimeout = setTimeout(async () => {
        try {
          await this.runOnce();
        } catch (error) {
          console.error("Scheduled orchestration failed:", error);
        }
        
        // Schedule next run
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }

  private async loadAllDataSources(): Promise<any> {
    return await this.llmEngine.loadDataSources();
  }

  private async loadPreviousResults(): Promise<any> {
    // Mock implementation - integrate with your results tracking
    return {
      yesterday_directives: [],
      completion_rate: 0.85,
      cost_actual: 150,
      impact_measured: 0.75
    };
  }

  private convertToBusinessDirectivesWithPolicy(rawDirectives: any, policyAssessments: Array<{ directive: AIDirective; assessment: DirectiveAssessment }>): any[] {
    return policyAssessments.map(({ directive, assessment }) => ({
      title: directive.action,
      rationale: directive.rationale,
      executive_rationale: `${directive.action} (${assessment.status})`,
      target_agents: [directive.agent],
      priority: directive.priority,
      deadline: directive.due,
      escalation_hours: 72,
      tasks: directive.tasks || [],
      success_criteria: [],
      business_impact: {
        delta_revenue_pace: 0,
        delta_mrr: 0,
        delta_risk_high: directive.business_impact?.delta_risk_high || 0,
        delta_gtm_momentum: 0,
        cost_per_day: directive.business_impact?.cost_per_day || 0,
        time_to_effect_days: 1
      },
      requires_ceo_approval: assessment.status.includes('ceo'),
      blocked: assessment.status === 'blocked',
      blocked_reason: assessment.blocked_reason,
      mitigation_task: assessment.mitigation_required
    }));
  }

  private async sendOdarSnapshotEmail(observation: ODARObservation, diagnosis: ODARDiagnosis, action: ODARAction, review: ODARReview, metrics: any): Promise<void> {
    // TODO: Implement ODAR snapshot email
    console.log("📧 ODAR snapshot email (TODO: implement email service)");
    console.log(`   - Data quality: ${observation.quality_score}%`);
    console.log(`   - ${diagnosis.hypotheses.length} hypotheses analyzed`);
    console.log(`   - ${action.auto_executed} directives auto-executed`);
    console.log(`   - Decision velocity: ${metrics.decision_velocity_hours}h`);
    console.log(`   - ROI/day: $${metrics.roi_per_day}`);
  }

  private async validateDataSources(): Promise<string[]> {
    const dataPath = path.join(process.cwd(), "server", "data");
    const requiredFiles = ['scoreboard.json', 'initiatives.json', 'decisions.json', 'actions.json', 'meetings.json'];
    const optionalFiles = ['insights.json'];
    
    const availableSources: string[] = [];
    
    for (const file of [...requiredFiles, ...optionalFiles]) {
      try {
        const filePath = path.join(dataPath, file);
        const content = await fs.readFile(filePath, "utf-8");
        JSON.parse(content); // Validate JSON format
        availableSources.push(file.replace('.json', ''));
        console.log(`✅ ${file}: Available and valid`);
      } catch (error) {
        if (requiredFiles.includes(file)) {
          console.warn(`⚠️  ${file}: Missing or invalid (required)`);
        } else {
          console.log(`ℹ️  ${file}: Not available (optional)`);
        }
      }
    }

    return availableSources;
  }

  private async sendCosSnapshotEmail(directives: any, dispatchResult: any): Promise<void> {
    // TODO: Implement email notification using template
    // This would send a summary email to the CEO with:
    // - Number of directives generated
    // - Agent assignments
    // - High priority items
    // - Data source summary
    
    console.log("📧 CoS snapshot email (TODO: implement email service)");
    console.log(`   - ${directives.directives.length} directives generated`);
    console.log(`   - ${dispatchResult.successful} agents notified`);
    console.log(`   - ${directives.summary.high_priority_count} high priority items`);
  }

  private async logOrchestrationResult(result: OrchestrationResult): Promise<void> {
    try {
      const lineagePath = path.join(process.cwd(), "server", "lineage");
      await fs.mkdir(lineagePath, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const logFile = path.join(lineagePath, `orchestration_${timestamp}.json`);
      
      await fs.writeFile(logFile, JSON.stringify(result, null, 2));
      console.log(`📋 Orchestration log saved: ${logFile}`);
    } catch (error) {
      console.error("Failed to save orchestration log:", error);
    }
  }

  getStatus(): any {
    return {
      is_running: this.isRunning,
      config: this.config,
      next_scheduled_run: this.scheduledTimeout ? "scheduled" : "none",
      status: this.isRunning ? "running" : "idle"
    };
  }
}

// Export singleton instance for easy access
export const dailyOrchestrator = new DailyOrchestrator();