import { sweepOverdueActions } from './actions.js';
import { strategyExecutor } from './services/strategic-executor.js';

const INTERVAL = parseInt(process.env.JOB_INTERVAL_SECONDS || "14400") * 1000; // 4 hours optimized for 3-4 daily checks
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
}

export function startJobRunner() {
  log("Starting job runner", { interval: INTERVAL });
  
  // Run immediately
  tick();
  
  // Then run on interval  
  setInterval(tick, INTERVAL);
}