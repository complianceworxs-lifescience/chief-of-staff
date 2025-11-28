import { sweepOverdueActions } from './actions.js';
import { strategyExecutor } from './services/strategic-executor.js';
import { l7StateUpdater } from './services/l7-state-updater.js';

const INTERVAL = parseInt(process.env.JOB_INTERVAL_SECONDS || "7200") * 1000; // 2 hours for L7 state updates
const DRY_RUN = (process.env.DRY_RUN || "false").toLowerCase() === "true"; // REAL EXECUTION - no simulation

function log(message: string, data?: any) {
  console.log(`[job] ${message}`, data ? JSON.stringify(data) : '');
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
}

export function startJobRunner() {
  log("Starting job runner", { interval: INTERVAL });
  
  // Run immediately
  tick();
  
  // Then run on interval  
  setInterval(tick, INTERVAL);
}