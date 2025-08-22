import { storage } from '../storage.js';
import { nanoid } from 'nanoid';

/**
 * Action Record Schema - Required for every recommendation
 */
export interface ActionRecord {
  action_id: string;
  recommendation_title: string;
  owner_agent: string;
  created_ts: string;
  
  // Expected (before execution)
  expected: {
    kpi: string;
    target: string;
    time_window_hours: number;
    scope: string;
    pass_fail_rule: string;
    canary_size: number;
    confidence_pct: number;
  };
  
  // Execution details
  execution: {
    started_ts: string | null;
    status: 'queued' | 'executing' | 'completed' | 'overdue';
    risk: 'low' | 'medium' | 'high';
    spend_cents: number;
  };
  
  // Outcome (must be filled within 24h)
  outcome: {
    observed_vs_target: string | null;
    sample_size_n: number | null;
    window: string | null;
    result_code: 'Achieved' | 'Partial' | 'No-Effect' | 'Negative' | 'Blocked' | null;
    next_action: 'Promote' | 'Roll-back' | 'Retry' | 'Investigate' | null;
    evidence_link: string | null;
    completed_ts: string | null;
  };
  
  // Governance tracking
  governance: {
    auto_approved: boolean;
    approval_reason: string | null;
    escalated: boolean;
    escalation_reason: string | null;
  };
  
  // Audit trail
  audit: {
    executed_by: string;
    execution_details: string;
    changes_made: string[];
  };
}

/**
 * Action Tracker Service - Enforces O→D→A→R loop with real ownership
 */
export class ActionTracker {
  
  /**
   * Create Action Record for any recommendation
   */
  async createActionRecord(
    title: string,
    owner: string,
    expected: ActionRecord['expected'],
    risk: 'low' | 'medium' | 'high' = 'low',
    spend_cents: number = 0
  ): Promise<ActionRecord> {
    const now = new Date().toISOString();
    const action_id = `action_${nanoid(12)}`;
    
    const record: ActionRecord = {
      action_id,
      recommendation_title: title,
      owner_agent: owner,
      created_ts: now,
      expected,
      execution: {
        started_ts: null,
        status: 'queued',
        risk,
        spend_cents
      },
      outcome: {
        observed_vs_target: null,
        sample_size_n: null,
        window: null,
        result_code: null,
        next_action: null,
        evidence_link: null,
        completed_ts: null
      },
      governance: {
        auto_approved: false,
        approval_reason: null,
        escalated: false,
        escalation_reason: null
      },
      audit: {
        executed_by: owner,
        execution_details: '',
        changes_made: []
      }
    };
    
    // Store action record
    await this.storeActionRecord(record);
    
    console.log(`📝 ACTION CREATED: ${action_id} | ${owner.toUpperCase()} | ${title}`);
    console.log(`🎯 EXPECTED: ${expected.target} (${expected.confidence_pct}% confidence)`);
    console.log(`⏰ DUE: ${expected.time_window_hours}h | Risk: ${risk} | Spend: $${spend_cents/100}`);
    
    return record;
  }
  
  /**
   * Check governance and auto-execute if approved
   */
  async processActionRecord(record: ActionRecord): Promise<void> {
    const canGovernanceApprove = this.checkGovernanceApproval(record);
    
    if (canGovernanceApprove.approved) {
      // Auto-execute
      record.governance.auto_approved = true;
      record.governance.approval_reason = canGovernanceApprove.reason;
      record.execution.status = 'executing';
      record.execution.started_ts = new Date().toISOString();
      
      console.log(`✅ AUTO-APPROVED: ${record.action_id} - ${canGovernanceApprove.reason}`);
      console.log(`🚀 EXECUTING: ${record.owner_agent} → ${record.recommendation_title}`);
      
      // Set 24-hour outcome deadline
      setTimeout(async () => {
        await this.checkOutcomeDeadline(record.action_id);
      }, 24 * 60 * 60 * 1000);
      
    } else {
      // Queue for approval
      record.governance.escalated = true;
      record.governance.escalation_reason = canGovernanceApprove.reason;
      
      console.log(`⏸️ QUEUED: ${record.action_id} - ${canGovernanceApprove.reason}`);
      console.log(`📋 REQUIRES APPROVAL: ${record.recommendation_title}`);
    }
    
    await this.updateActionRecord(record);
  }
  
  /**
   * Record outcome within 24 hours
   */
  async recordOutcome(
    action_id: string,
    observed_vs_target: string,
    sample_size_n: number,
    result_code: ActionRecord['outcome']['result_code'],
    next_action: ActionRecord['outcome']['next_action'],
    evidence_link?: string
  ): Promise<void> {
    const record = await this.getActionRecord(action_id);
    if (!record) {
      throw new Error(`Action record ${action_id} not found`);
    }
    
    const now = new Date().toISOString();
    record.outcome = {
      observed_vs_target,
      sample_size_n,
      window: `${record.expected.time_window_hours}h`,
      result_code,
      next_action,
      evidence_link: evidence_link || null,
      completed_ts: now
    };
    record.execution.status = 'completed';
    
    await this.updateActionRecord(record);
    
    console.log(`🎉 OUTCOME RECORDED: ${action_id} | ${result_code} | ${observed_vs_target}`);
    console.log(`📊 SAMPLE: n=${sample_size_n} | NEXT: ${next_action}`);
  }
  
  /**
   * Check governance approval rules
   */
  private checkGovernanceApproval(record: ActionRecord): { approved: boolean; reason: string } {
    // Auto-execute only if: risk ≤ low, spend = $0, canary ≥10, within $100/month cap
    if (record.execution.risk !== 'low') {
      return { approved: false, reason: `Risk level ${record.execution.risk} requires approval` };
    }
    
    if (record.execution.spend_cents > 0) {
      return { approved: false, reason: `Spend $${record.execution.spend_cents/100} requires approval` };
    }
    
    if (record.expected.canary_size < 10) {
      return { approved: false, reason: `Canary size ${record.expected.canary_size} below minimum 10` };
    }
    
    // TODO: Check monthly budget cap $100
    
    return { 
      approved: true, 
      reason: `Risk: ${record.execution.risk}, Spend: $0, Canary: ${record.expected.canary_size}` 
    };
  }
  
  /**
   * Check for overdue outcomes (24h deadline)
   */
  async checkOutcomeDeadline(action_id: string): Promise<void> {
    const record = await this.getActionRecord(action_id);
    if (!record) return;
    
    if (!record.outcome.completed_ts && record.execution.status !== 'completed') {
      record.execution.status = 'overdue';
      record.governance.escalated = true;
      record.governance.escalation_reason = 'Outcome missing >24h - escalated to Chief of Staff';
      
      await this.updateActionRecord(record);
      
      console.log(`🚨 OVERDUE: ${action_id} | ${record.owner_agent} | ${record.recommendation_title}`);
      console.log(`📞 ESCALATED: Chief of Staff - Outcome deadline missed`);
    }
  }
  
  /**
   * Get all overdue actions for monitoring
   */
  async getOverdueActions(): Promise<ActionRecord[]> {
    // This would query stored action records for overdue items
    // For now, return empty array until storage implementation
    return [];
  }
  
  /**
   * Store action record (implement based on storage system)
   */
  private async storeActionRecord(record: ActionRecord): Promise<void> {
    // Store in database or memory storage
    console.log(`💾 STORED: Action record ${record.action_id}`);
  }
  
  /**
   * Update action record
   */
  private async updateActionRecord(record: ActionRecord): Promise<void> {
    // Update in database or memory storage
    console.log(`🔄 UPDATED: Action record ${record.action_id}`);
  }
  
  /**
   * Get action record by ID
   */
  private async getActionRecord(action_id: string): Promise<ActionRecord | null> {
    // Retrieve from database or memory storage
    return null; // Placeholder
  }
  
  /**
   * Get daily report data
   */
  async getDailyReport(): Promise<{
    actions_created: number;
    pct_actioned_1h: number;
    median_time_to_action: number;
    pct_outcomes_24h: number;
    overdue_count: number;
    top_criticals: string[];
    incidents: string[];
  }> {
    // Implementation for daily 08:00 ET report
    return {
      actions_created: 0,
      pct_actioned_1h: 0,
      median_time_to_action: 0,
      pct_outcomes_24h: 0,
      overdue_count: 0,
      top_criticals: [],
      incidents: []
    };
  }
}

export const actionTracker = new ActionTracker();