import { sweepOverdueActions } from './actions.js';

const INTERVAL = parseInt(process.env.JOB_INTERVAL_SECONDS || "60") * 1000;
const DRY_RUN = (process.env.DRY_RUN || "true").toLowerCase() === "true";

function log(message: string, data?: any) {
  console.log(`[job] ${message}`, data ? JSON.stringify(data) : '');
}

export function tick() {
  log("tick", { dry_run: DRY_RUN });
  
  // Governance: flag actions that are missing outcomes beyond SLA
  const sla = parseInt(process.env.OUTCOME_SLA_HOURS || "24");
  const overdue = sweepOverdueActions(sla);
  
  if (overdue > 0) {
    log("overdue_actions", { count: overdue, sla_hours: sla });
  }
}

export function startJobRunner() {
  log("Starting job runner", { interval: INTERVAL });
  
  // Run immediately
  tick();
  
  // Then run on interval
  setInterval(tick, INTERVAL);
}