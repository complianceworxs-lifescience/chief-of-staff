import { sweepOverdueActions } from './actions.js';
import { strategyExecutor } from './services/strategic-executor.js';
import { l7StateUpdater } from './services/l7-state-updater.js';
import { revenueScoreboard } from './services/revenue-scoreboard.js';
import { narrativeEnforcer } from './services/narrative-enforcer.js';

const INTERVAL = parseInt(process.env.JOB_INTERVAL_SECONDS || "7200") * 1000; // 2 hours - SINGLE CORE CYCLE
const DRY_RUN = (process.env.DRY_RUN || "false").toLowerCase() === "true"; // REAL EXECUTION - no simulation

const CORE_NARRATIVE = narrativeEnforcer.getNarrative();

function log(message: string, data?: any) {
  const prefix = `[job] 📢 "${CORE_NARRATIVE.core.substring(0, 40)}..." |`;
  console.log(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
}

export async function tick() {
  log("tick", { dry_run: DRY_RUN });
  
  // Governance: flag actions that are missing outcomes beyond SLA
  const sla = parseInt(process.env.OUTCOME_SLA_HOURS || "24");
  const overdue = sweepOverdueActions(sla);
  
  if (overdue > 0) {
    log("overdue_actions", { count: overdue, sla_hours: sla });
  }
  
  // Strategic Execution: Auto-assign agents to overdue goals
  try {
    const strategicActions = await strategyExecutor.executeOverdueGoalActions();
    if (strategicActions.length > 0) {
      log("strategic_executor", { 
        actions_created: strategicActions.length,
        assigned_agents: strategicActions.map(a => `${a.assignedAgent}:${a.actionType}`)
      });
    }
  } catch (error) {
    log("strategic_executor_error", { error: error instanceof Error ? error.message : String(error) });
  }

  // L7 State Updater: Update proof conditions, track interventions, generate digests
  try {
    const l7Update = await l7StateUpdater.runUpdateCycle();
    if (l7Update.updates.length > 0) {
      log("l7_state_updater", {
        updates: l7Update.updates.length,
        overdue_count: l7Update.overdue_count,
        intervention_detected: l7Update.intervention_detected,
        digest_generated: l7Update.digest_generated
      });
    }
    
    if (l7Update.intervention_detected) {
      log("l7_intervention_alert", {
        message: "L7 Evolution Protocol detected intervention required",
        overdue_actions: l7Update.overdue_count
      });
    }
  } catch (error) {
    log("l7_state_updater_error", { error: error instanceof Error ? error.message : String(error) });
  }

  // Revenue Scoreboard: Sync and report (Single Source of Truth)
  try {
    await revenueScoreboard.syncResearchInsights();
    const health = await revenueScoreboard.calculateHealthScore();
    log("revenue_scoreboard", { 
      health_score: health.score, 
      breakdown: health.breakdown,
      narrative: CORE_NARRATIVE.core.substring(0, 50)
    });
  } catch (error) {
    log("revenue_scoreboard_error", { error: error instanceof Error ? error.message : String(error) });
  }

  // NOTE: Research Mandate is now handled by Unified Orchestrator (fewer systems, more cycles)
}

export function startJobRunner() {
  log("Starting job runner", { interval: INTERVAL });
  
  // Run immediately
  tick();
  
  // Then run on interval  
  setInterval(tick, INTERVAL);
}