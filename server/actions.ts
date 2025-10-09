import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { policyDecision, overdueCutoff } from './governance.js';

const LOG_PATH = process.env.ACTION_LOG_PATH || "data/action_log.jsonl";

// Ensure log directory exists
const logDir = path.dirname(LOG_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

interface Recommendation {
  owner?: string;
  action?: string;
  risk?: string;
  canary_n?: number;
  spend_cents?: number;
  payload?: any;
  title?: string;
  rationale?: string;
}

interface ActionEvent {
  type: string;
  action_id: string;
  ts: string;
  agent: string;
  [key: string]: any;
}

function nowIso(): string {
  return new Date().toISOString();
}

function append(event: ActionEvent): void {
  const line = JSON.stringify(event) + '\n';
  fs.appendFileSync(LOG_PATH, line, 'utf-8');
}

export function actOnRecommendation(reco: Recommendation): any {
  const actionId = randomUUID();
  const agent = reco.owner || "unknown_agent";
  const action = reco.action || "unspecified";
  const risk = (reco.risk || "low").toLowerCase();
  const canaryN = reco.canary_n || 10;
  const spendCents = reco.spend_cents || 0;
  const dry = (process.env.DRY_RUN || "false").toLowerCase() === "true"; // REAL EXECUTION - no simulation

  const policy = policyDecision(reco, LOG_PATH);

  const startEvt: ActionEvent = {
    type: "action_started",
    action_id: actionId,
    ts: nowIso(),
    agent,
    action,
    risk,
    canary_n: canaryN,
    spend_cents: spendCents,
    payload: reco.payload || {},
    recommendation: { 
      title: reco.title, 
      rationale: reco.rationale 
    },
    status: policy.auto_execute ? "executing" : "queued",
    policy
  };
  
  append(startEvt);

  // Execute or queue according to governance
  let outcome: any;
  if (policy.auto_execute) {
    outcome = { 
      result: dry ? "simulated" : "executed", 
      notes: "auto-exec via governance" 
    };
    completeAction(actionId, agent, true, outcome, spendCents);
  } else {
    outcome = { 
      result: "queued", 
      notes: policy.requires_approval ? "awaiting approval" : "held per policy" 
    };
    
    // In exceptions-only mode we do not notify the Founder; we just log an escalation for Chief of Staff
    if (policy.violation) {
      append({
        type: "escalation",
        action_id: actionId,
        ts: nowIso(),
        agent,
        to: process.env.ESCALATE_OWNER || "ChiefOfStaff",
        reasons: policy.reasons
      });
    }
  }

  return {
    action_id: actionId,
    agent,
    date: startEvt.ts,
    action,
    outcome: outcome.result
  };
}

export function completeAction(
  actionId: string, 
  agent: string, 
  success: boolean, 
  outcome: any, 
  spendCents: number = 0
): void {
  const evt: ActionEvent = {
    type: "action_completed",
    action_id: actionId,
    ts: nowIso(),
    agent,
    success: Boolean(success),
    outcome,
    spend_cents: spendCents
  };
  
  append(evt);
}

export function recentActions(limit: number = 50): ActionEvent[] {
  try {
    const content = fs.readFileSync(LOG_PATH, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    return lines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function sweepOverdueActions(slaHours: number = 24): number {
  const cutoff = overdueCutoff(slaHours);
  
  try {
    const content = fs.readFileSync(LOG_PATH, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const started: { [key: string]: ActionEvent } = {};
    const completed = new Set<string>();
    
    for (const line of lines) {
      try {
        const evt = JSON.parse(line);
        if (evt.type === "action_started") {
          started[evt.action_id] = evt;
        } else if (evt.type === "action_completed") {
          completed.add(evt.action_id);
        }
      } catch {
        continue;
      }
    }
    
    let overdue = 0;
    for (const [aid, evt] of Object.entries(started)) {
      if (completed.has(aid)) continue;
      
      try {
        const ts = new Date(evt.ts);
        if (ts < cutoff) {
          overdue++;
          append({
            type: "action_overdue",
            action_id: aid,
            ts: nowIso(),
            agent: evt.agent,
            to: process.env.ESCALATE_OWNER || "ChiefOfStaff",
            note: `Outcome missing >${slaHours}h`
          });
        }
      } catch {
        continue;
      }
    }
    
    return overdue;
  } catch {
    return 0;
  }
}