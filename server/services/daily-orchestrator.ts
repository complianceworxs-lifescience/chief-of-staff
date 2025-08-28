import { LLMDirectiveEngine } from "./llm-directive-engine";
import { AgentDispatchService } from "./agent-dispatch";
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
  data_sources_loaded: string[];
  directives_generated: number;
  agents_notified: number;
  failed_dispatches: number;
  llm_provider: string;
  execution_time_ms: number;
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

    console.log("🚀 Starting LLM Daily Orchestration Cycle");
    const startTime = Date.now();
    this.isRunning = true;

    try {
      // Step 1: Validate data sources
      console.log("📊 Step 1: Validating data sources...");
      const dataSources = await this.validateDataSources();
      
      if (dataSources.length < 3) {
        throw new Error(`Insufficient data sources (${dataSources.length}/6). Need at least scoreboard, initiatives, and actions data.`);
      }

      // Step 2: Generate directives using LLM
      console.log("🤖 Step 2: Generating directives with LLM...");
      const directives = await this.llmEngine.generateDirectives();
      
      console.log(`✅ Generated ${directives.directives.length} directives using ${directives.llm_provider}`);
      console.log(`📈 Agent distribution:`, directives.summary.by_agent);

      // Step 3: Save directives and create lineage
      console.log("💾 Step 3: Saving directives and lineage...");
      await this.llmEngine.saveDirectives(directives);

      // Step 4: Dispatch to agents (skip in dry run)
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
        console.log("📤 Step 4: Dispatching directives to agents...");
        dispatchResult = await this.agentDispatch.dispatchDirectives(directives);
        console.log(`✅ Dispatched to ${dispatchResult.successful} agents, ${dispatchResult.failed} failed`);
      }

      // Step 5: Generate and send CoS snapshot email (optional)
      if (this.config.enableEmailNotifications && !this.config.dryRun) {
        console.log("📧 Step 5: Sending CoS snapshot email...");
        await this.sendCosSnapshotEmail(directives, dispatchResult);
      }

      const result: OrchestrationResult = {
        success: true,
        timestamp: new Date().toISOString(),
        run_mode: this.config.mode,
        data_sources_loaded: dataSources,
        directives_generated: directives.directives.length,
        agents_notified: dispatchResult.successful,
        failed_dispatches: dispatchResult.failed,
        llm_provider: directives.llm_provider,
        execution_time_ms: Date.now() - startTime,
        summary: directives.summary
      };

      console.log("🎉 Daily orchestration completed successfully!");
      console.log(`⏱️  Total execution time: ${result.execution_time_ms}ms`);

      // Log result for audit trail
      await this.logOrchestrationResult(result);

      return result;

    } catch (error) {
      const errorResult: OrchestrationResult = {
        success: false,
        timestamp: new Date().toISOString(),
        run_mode: this.config.mode,
        data_sources_loaded: [],
        directives_generated: 0,
        agents_notified: 0,
        failed_dispatches: 0,
        llm_provider: "none",
        execution_time_ms: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };

      console.error("❌ Daily orchestration failed:", error);
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