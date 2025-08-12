import { db } from "../db";
import { rulesOfEngagement, autonomousPlaybooks, playbookExecutions } from "@shared/schema";
import type { RulesOfEngagement, AutonomousPlaybook, PlaybookExecution } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export class AutonomousGovernanceService {
  /**
   * Level 1: Rules of Engagement Management
   * These are the high-level policies set by the user that govern playbook creation
   */
  
  async createRulesOfEngagement(rules: {
    title: string;
    description: string;
    category: string;
    rules: Record<string, any>;
  }) {
    const [rule] = await db.insert(rulesOfEngagement).values(rules).returning();
    return rule;
  }

  async getRulesOfEngagement() {
    return await db.select().from(rulesOfEngagement)
      .where(eq(rulesOfEngagement.isActive, true))
      .orderBy(desc(rulesOfEngagement.createdAt));
  }

  async updateRulesOfEngagement(id: string, updates: Partial<RulesOfEngagement>) {
    const [rule] = await db.update(rulesOfEngagement)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rulesOfEngagement.id, id))
      .returning();
    return rule;
  }

  /**
   * Level 2: Autonomous Playbook Management
   * Chief of Staff creates and manages these based on the Rules of Engagement
   */

  async createPlaybook(playbook: {
    title: string;
    agentId: string;
    triggerCondition: string;
    action: string;
    autonomyLevel: number;
    riskLevel: string;
    financialImpact?: number;
    reasoning: string;
  }) {
    // Validate against Rules of Engagement
    const rules = await this.getRulesOfEngagement();
    const validatedPlaybook = await this.validateAgainstRules(playbook, rules);
    
    const [newPlaybook] = await db.insert(autonomousPlaybooks)
      .values(validatedPlaybook)
      .returning();
    
    return newPlaybook;
  }

  async getPlaybooks(status?: string) {
    const query = db.select().from(autonomousPlaybooks);
    
    if (status) {
      query.where(eq(autonomousPlaybooks.status, status));
    }
    
    return await query.orderBy(desc(autonomousPlaybooks.createdAt));
  }

  async getPlaybooksByAgent(agentId: string) {
    return await db.select().from(autonomousPlaybooks)
      .where(and(
        eq(autonomousPlaybooks.agentId, agentId),
        eq(autonomousPlaybooks.status, 'active')
      ));
  }

  async approvePlaybook(id: string, approvedBy: string) {
    const [playbook] = await db.update(autonomousPlaybooks)
      .set({
        status: 'active',
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(autonomousPlaybooks.id, id))
      .returning();
    
    return playbook;
  }

  async rejectPlaybook(id: string, reason: string) {
    const [playbook] = await db.update(autonomousPlaybooks)
      .set({
        status: 'archived',
        reasoning: reason
      })
      .where(eq(autonomousPlaybooks.id, id))
      .returning();
    
    return playbook;
  }

  /**
   * Playbook Execution System
   */

  async executePlaybook(playbookId: string, trigger: string, metadata?: Record<string, any>) {
    const playbook = await db.select().from(autonomousPlaybooks)
      .where(eq(autonomousPlaybooks.id, playbookId))
      .limit(1);
    
    if (!playbook.length || playbook[0].status !== 'active') {
      throw new Error('Playbook not found or inactive');
    }

    const pb = playbook[0];
    
    // Create execution record
    const [execution] = await db.insert(playbookExecutions)
      .values({
        playbookId: pb.id,
        agentId: pb.agentId,
        trigger,
        action: pb.action,
        result: pb.autonomyLevel === 1 ? 'pending_approval' : 'success',
        approvalRequired: pb.autonomyLevel === 1,
        metadata
      })
      .returning();

    // Update playbook execution count
    await db.update(autonomousPlaybooks)
      .set({
        executionCount: pb.executionCount + 1
      })
      .where(eq(autonomousPlaybooks.id, pb.id));

    return execution;
  }

  async approveExecution(executionId: string, approvedBy: string) {
    const [execution] = await db.update(playbookExecutions)
      .set({
        result: 'success',
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(playbookExecutions.id, executionId))
      .returning();
    
    return execution;
  }

  async getExecutions(agentId?: string) {
    const query = db.select().from(playbookExecutions);
    
    if (agentId) {
      query.where(eq(playbookExecutions.agentId, agentId));
    }
    
    return await query.orderBy(desc(playbookExecutions.executedAt));
  }

  async getPendingApprovals() {
    return await db.select().from(playbookExecutions)
      .where(eq(playbookExecutions.result, 'pending_approval'))
      .orderBy(desc(playbookExecutions.executedAt));
  }

  /**
   * Intelligent Playbook Generation
   * Chief of Staff automatically creates playbooks based on conflicts and patterns
   */

  async generatePlaybookForConflict(agentId: string, conflictType: string, conflictDetails: string) {
    const rules = await this.getRulesOfEngagement();
    
    // Find relevant rules for conflict handling
    const conflictRules = rules.filter(r => r.category === 'conflict');
    
    // Generate playbook based on conflict type and rules
    const playbook = this.designConflictPlaybook(agentId, conflictType, conflictDetails, conflictRules);
    
    return await this.createPlaybook(playbook);
  }

  async generatePlaybookForPattern(agentId: string, pattern: string, frequency: number) {
    const rules = await this.getRulesOfEngagement();
    
    // Find autonomy graduation rules
    const autonomyRules = rules.filter(r => r.category === 'autonomy');
    
    // Determine if this pattern should be automated
    if (frequency >= 5) { // User approved same action 5+ times
      const playbook = this.designAutonomyPlaybook(agentId, pattern, autonomyRules);
      return await this.createPlaybook(playbook);
    }
    
    return null;
  }

  /**
   * Private helper methods
   */

  private async validateAgainstRules(playbook: any, rules: RulesOfEngagement[]) {
    // Apply financial guardrails
    const financialRules = rules.filter(r => r.category === 'financial');
    for (const rule of financialRules) {
      if (playbook.financialImpact > rule.rules.maxSingleAction) {
        playbook.autonomyLevel = 1; // Force manual approval
        playbook.reasoning += ` Financial impact (${playbook.financialImpact}) exceeds threshold (${rule.rules.maxSingleAction}).`;
      }
    }

    // Apply conflict handling protocols
    const conflictRules = rules.filter(r => r.category === 'conflict');
    if (playbook.triggerCondition.includes('conflict')) {
      const conflictRule = conflictRules[0];
      if (conflictRule?.rules.newConflictPlaybooksLevel) {
        playbook.autonomyLevel = conflictRule.rules.newConflictPlaybooksLevel;
      }
    }

    // Apply human-in-the-loop requirements
    const humanLoopRules = rules.filter(r => r.category === 'human_loop');
    for (const rule of humanLoopRules) {
      if (rule.rules.alwaysManualActions?.some((action: string) => 
        playbook.action.toLowerCase().includes(action.toLowerCase())
      )) {
        playbook.autonomyLevel = 1;
        playbook.reasoning += ` Action requires human approval per governance rules.`;
      }
    }

    return playbook;
  }

  private designConflictPlaybook(agentId: string, conflictType: string, details: string, rules: RulesOfEngagement[]) {
    // Example: CMO Agent campaign performance conflict
    if (conflictType === 'campaign_performance' && agentId === 'cmo') {
      return {
        title: `Auto-resolve ${conflictType} for ${agentId}`,
        agentId,
        triggerCondition: `When ${conflictType} conflict detected`,
        action: `Pause underperforming ad set and reallocate budget to best performer`,
        autonomyLevel: 1, // Start with manual approval
        riskLevel: 'medium',
        financialImpact: 1000,
        reasoning: `Generated playbook for recurring ${conflictType} conflict. Starting at Level 1 per conflict handling protocol.`
      };
    }

    // Default playbook structure
    return {
      title: `Handle ${conflictType} conflict`,
      agentId,
      triggerCondition: `${conflictType} conflict detected`,
      action: `Analyze and propose solution for ${conflictType}`,
      autonomyLevel: 1,
      riskLevel: 'low',
      reasoning: `Generated playbook for ${conflictType} conflict type.`
    };
  }

  private designAutonomyPlaybook(agentId: string, pattern: string, rules: RulesOfEngagement[]) {
    return {
      title: `Auto-approve: ${pattern}`,
      agentId,
      triggerCondition: pattern,
      action: `Execute previously approved action for ${pattern}`,
      autonomyLevel: 2, // Autonomous with notification
      riskLevel: 'low',
      reasoning: `Pattern approved 5+ times, promoting to autonomous execution per autonomy graduation rules.`
    };
  }
}

export const autonomousGovernance = new AutonomousGovernanceService();