import { storage } from "../storage.js";
import { actOnRecommendation } from "../actions.js";
import type { StrategicObjective, BusinessGoal } from "../../shared/schema.js";

interface OverdueGoalAction {
  goalId: string;
  goalTitle: string;
  assignedAgent: string;
  actionType: string;
  priority: 'low' | 'medium' | 'high';
  recommendations: string[];
  deadline: Date;
}

export class StrategyExecutor {
  /**
   * Automatically execute actions for overdue strategic goals
   */
  async executeOverdueGoalActions(): Promise<OverdueGoalAction[]> {
    const goals = await this.getOverdueGoals();
    const actions: OverdueGoalAction[] = [];
    
    for (const goal of goals) {
      const action = await this.createActionForGoal(goal);
      if (action) {
        actions.push(action);
        // Submit the action through the governance system
        await this.submitGoalAction(action);
      }
    }
    
    return actions;
  }
  
  /**
   * Identify overdue strategic goals that need immediate action
   */
  async getOverdueGoals(): Promise<StrategicObjective[]> {
    const objectives = await storage.getStrategicObjectives();
    const now = new Date();
    
    // Consider a goal overdue if:
    // 1. Progress < 70% (behind target), OR
    // 2. Progress < 50% (critical intervention needed), OR  
    // 3. Any goal with "retention" in title and progress < 80% (high priority)
    const overdueGoals = objectives.filter(obj => {
      const progress = obj.progress;
      const title = obj.title.toLowerCase();
      
      // Special handling for customer retention - critical business metric
      if (title.includes('retention') && progress < 80) {
        console.log(`🚨 CRITICAL: Customer retention goal "${obj.title}" at ${progress}% - IMMEDIATE ACTION REQUIRED`);
        return true;
      }
      
      // Revenue goals need urgent attention if < 60%
      if (title.includes('revenue') && progress < 60) {
        console.log(`🚨 URGENT: Revenue goal "${obj.title}" at ${progress}% - REVENUE AT RISK`);
        return true;
      }
      
      // General goals behind target
      if (progress < 70) {
        console.log(`⚠️ BEHIND TARGET: Goal "${obj.title}" at ${progress}% - needs intervention`);
        return true;
      }
      
      return false;
    });
    
    console.log(`🔍 Strategic Scan: Found ${overdueGoals.length} goals requiring intervention`);
    overdueGoals.forEach(goal => {
      console.log(`   - "${goal.title}": ${goal.progress}% progress (ID: ${goal.id})`);
    });
    
    return overdueGoals;
  }
  
  /**
   * Create specific action for an overdue goal
   */
  async createActionForGoal(goal: StrategicObjective): Promise<OverdueGoalAction | null> {
    const assignedAgent = this.determineResponsibleAgent(goal);
    const actionType = this.determineActionType(goal);
    const recommendations = this.generateRecommendations(goal);
    const priority = this.calculatePriority(goal);
    
    if (!assignedAgent || !actionType) return null;
    
    return {
      goalId: goal.id,
      goalTitle: goal.title,
      assignedAgent,
      actionType,
      priority,
      recommendations,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };
  }
  
  /**
   * Submit action through governance system for autonomous execution
   */
  async submitGoalAction(action: OverdueGoalAction): Promise<void> {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
    
    // Create Expected outcome record first
    const expected = {
      action_id: `goal_recovery_${action.goalId}_${Date.now()}`,
      agent: action.assignedAgent,
      action: action.actionType,
      expected_kpi: this.determineKPI(action.goalTitle),
      expected_target: this.determineTarget(action.goalTitle, action.priority),
      time_window_hours: 48,
      scope: `Strategic goal recovery: ${action.goalTitle}`,
      success_rule: this.determineSuccessRule(action.goalTitle, action.priority),
      canary_description: `Monitor ${action.assignedAgent} progress on ${action.goalTitle}`,
      owner: action.assignedAgent,
      confidence_pct: action.priority === 'high' ? 85 : 75,
      due_date: dueDate.toISOString(),
      created_at: now.toISOString()
    };
    
    // Create specific action directive
    const directive = {
      title: `URGENT: Strategic Goal Recovery - ${action.goalTitle}`,
      description: `Goal "${action.goalTitle}" is behind target and requires immediate action.`,
      actionType: action.actionType,
      assignedAgent: action.assignedAgent,
      priority: action.priority,
      dueDate: dueDate.toISOString(),
      recommendations: action.recommendations,
      expectedOutcome: expected,
      status: 'assigned',
      createdAt: now.toISOString()
    };
    
    console.log(`🎯 Strategic Executor: AUTO-ASSIGNING ${action.assignedAgent.toUpperCase()} to "${action.goalTitle}"`);
    console.log(`📅 DUE: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}`);
    console.log(`🎯 EXPECTED: ${expected.expected_target} via ${action.actionType}`);
    console.log(`📋 ACTIONS: ${action.recommendations.slice(0, 2).join(', ')}`);
    
    // Submit through governance system
    const recommendation = {
      title: directive.title,
      action: action.actionType,
      owner: action.assignedAgent,
      risk: action.priority === 'high' ? 'medium' : 'low',
      canary_n: 15,
      spend_cents: 0,
      payload: {
        directive,
        expected,
        goalId: action.goalId,
        autoGenerated: true,
        urgentAction: true
      },
      rationale: `Critical: Goal "${action.goalTitle}" requires immediate intervention. ${action.assignedAgent} assigned with 48h deadline.`
    };
    
    await actOnRecommendation(recommendation);
    
    // Update agent with specific assignment (handle agent ID mapping)
    const agentMapping = {
      'cro': 'cro',
      'cco': 'cco', 
      'cmo': 'cmo',
      'coo': 'coo'
    };
    
    const agentId = agentMapping[action.assignedAgent] || action.assignedAgent;
    
    try {
      await storage.updateAgent(agentId, {
        lastReport: `CRITICAL ASSIGNMENT: Strategic goal recovery for "${action.goalTitle}" - DUE ${dueDate.toLocaleDateString()}. Actions: ${action.recommendations[0]}`,
        lastActive: new Date()
      });
    } catch (error) {
      console.log(`⚠️ Agent ${agentId} not found in database, but assignment logged in actions`);
    }
    
    // Log the action for tracking
    console.log(`✅ ASSIGNED: ${action.assignedAgent} → "${action.goalTitle}" (Due: ${dueDate.toLocaleDateString()})`);
  }
  
  /**
   * Determine KPI for goal tracking
   */
  private determineKPI(goalTitle: string): string {
    const title = goalTitle.toLowerCase();
    
    if (title.includes('revenue')) return 'monthly_revenue';
    if (title.includes('customer') && title.includes('retention')) return 'customer_retention_rate';
    if (title.includes('acquisition') || title.includes('leads')) return 'customer_acquisition';
    if (title.includes('conversion')) return 'conversion_rate';
    if (title.includes('satisfaction')) return 'customer_satisfaction';
    if (title.includes('efficiency')) return 'operational_efficiency';
    if (title.includes('cost')) return 'cost_reduction';
    
    return 'goal_progress_percentage';
  }
  
  /**
   * Determine target for goal recovery
   */
  private determineTarget(goalTitle: string, priority: 'low' | 'medium' | 'high'): string {
    const title = goalTitle.toLowerCase();
    const urgencyMultiplier = priority === 'high' ? 1.5 : priority === 'medium' ? 1.2 : 1.0;
    
    if (title.includes('revenue')) {
      const baseTarget = priority === 'high' ? 15000 : 10000;
      return `$${Math.round(baseTarget * urgencyMultiplier)} increase in 48h`;
    }
    
    if (title.includes('retention')) {
      const baseTarget = priority === 'high' ? 5 : 3;
      return `${Math.round(baseTarget * urgencyMultiplier)}% improvement in retention rate`;
    }
    
    if (title.includes('acquisition')) {
      const baseTarget = priority === 'high' ? 20 : 15;
      return `${Math.round(baseTarget * urgencyMultiplier)} new customers in 48h`;
    }
    
    if (title.includes('conversion')) {
      const baseTarget = priority === 'high' ? 3 : 2;
      return `${Math.round(baseTarget * urgencyMultiplier)}% conversion rate improvement`;
    }
    
    // Default progress target
    const baseProgress = priority === 'high' ? 20 : 15;
    return `${Math.round(baseProgress * urgencyMultiplier)}% progress improvement in 48h`;
  }
  
  /**
   * Determine success rule for goal recovery
   */
  private determineSuccessRule(goalTitle: string, priority: 'low' | 'medium' | 'high'): string {
    const title = goalTitle.toLowerCase();
    
    if (title.includes('revenue')) {
      return priority === 'high' 
        ? 'Revenue increase ≥ target AND pipeline growth ≥ 25% AND no customer churn'
        : 'Revenue increase ≥ target OR pipeline growth ≥ 15%';
    }
    
    if (title.includes('retention')) {
      return priority === 'high'
        ? 'Retention rate improvement ≥ target AND customer satisfaction ≥ 8/10 AND churn reduction ≥ 30%'
        : 'Retention rate improvement ≥ target OR churn reduction ≥ 20%';
    }
    
    if (title.includes('acquisition')) {
      return priority === 'high'
        ? 'New customers ≥ target AND cost per acquisition ≤ $500 AND conversion rate ≥ 3%'
        : 'New customers ≥ target OR conversion rate improvement ≥ 2%';
    }
    
    // Default success rule
    return priority === 'high'
      ? 'Goal progress ≥ target AND no regression in related KPIs AND stakeholder approval'
      : 'Goal progress ≥ target OR measurable improvement in key metric';
  }
  
  /**
   * Determine which agent should be responsible for a goal
   */
  private determineResponsibleAgent(goal: StrategicObjective): string {
    const title = goal.title.toLowerCase();
    
    // Revenue-related goals
    if (title.includes('revenue') || title.includes('sales') || title.includes('conversion')) {
      return 'cro';
    }
    
    // Customer-related goals  
    if (title.includes('customer') || title.includes('retention') || title.includes('satisfaction')) {
      return 'cco';
    }
    
    // Marketing-related goals
    if (title.includes('marketing') || title.includes('brand') || title.includes('awareness') || title.includes('leads')) {
      return 'cmo';
    }
    
    // Operational goals
    if (title.includes('efficiency') || title.includes('cost') || title.includes('process') || title.includes('operations')) {
      return 'coo';
    }
    
    // Default to CRO for general business goals
    return 'cro';
  }
  
  /**
   * Determine appropriate action type for the goal
   */
  private determineActionType(goal: StrategicObjective): string {
    const title = goal.title.toLowerCase();
    const progress = goal.progress;
    
    if (progress < 30) {
      // Critical intervention needed
      if (title.includes('revenue')) return 'emergency_revenue_campaign';
      if (title.includes('customer')) return 'customer_recovery_program';
      if (title.includes('marketing')) return 'intensive_marketing_blitz';
      return 'strategic_intervention_plan';
    } else if (progress < 50) {
      // Moderate intervention
      if (title.includes('revenue')) return 'revenue_acceleration_tactics';
      if (title.includes('customer')) return 'customer_engagement_boost';
      if (title.includes('marketing')) return 'targeted_marketing_push';
      return 'performance_optimization';
    } else {
      // Light course correction
      if (title.includes('revenue')) return 'revenue_optimization';
      if (title.includes('customer')) return 'customer_experience_enhancement';
      if (title.includes('marketing')) return 'marketing_refinement';
      return 'goal_alignment_adjustment';
    }
  }
  
  /**
   * Generate specific recommendations for goal recovery
   */
  private generateRecommendations(goal: StrategicObjective): string[] {
    const title = goal.title.toLowerCase();
    const progress = goal.progress;
    const urgency = progress < 30 ? 'critical' : progress < 50 ? 'high' : 'moderate';
    
    const recommendations: string[] = [];
    
    if (title.includes('revenue')) {
      if (urgency === 'critical') {
        recommendations.push(
          'Launch emergency sales blitz with existing prospects',
          'Implement aggressive pricing incentives',
          'Activate all dormant sales channels',
          'Deploy CEO for key account rescue missions'
        );
      } else {
        recommendations.push(
          'Increase sales team activity by 30%',
          'Launch targeted upselling campaign',
          'Optimize conversion funnel bottlenecks'
        );
      }
    }
    
    if (title.includes('customer')) {
      if (urgency === 'critical') {
        recommendations.push(
          'Immediate customer outreach program',
          'Emergency customer success interventions',
          'Launch win-back campaigns for at-risk accounts',
          'Deploy retention specialists to key accounts'
        );
      } else {
        recommendations.push(
          'Increase customer engagement touchpoints',
          'Deploy satisfaction surveys and rapid response',
          'Enhance customer support response times'
        );
      }
    }
    
    if (title.includes('marketing')) {
      if (urgency === 'critical') {
        recommendations.push(
          'Launch emergency brand awareness campaign',
          'Activate all marketing channels simultaneously',
          'Deploy influencer partnerships immediately',
          'Increase ad spend by 50% on proven channels'
        );
      } else {
        recommendations.push(
          'Optimize underperforming marketing channels',
          'Launch A/B tests on key campaigns',
          'Increase content production velocity'
        );
      }
    }
    
    // Default recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        'Conduct immediate progress audit',
        'Identify and remove execution blockers',
        'Reallocate resources to highest-impact activities',
        'Implement daily progress tracking'
      );
    }
    
    return recommendations;
  }
  
  /**
   * Calculate priority level for goal action
   */
  private calculatePriority(goal: StrategicObjective): 'low' | 'medium' | 'high' {
    const progress = goal.progress;
    const daysToDealline = this.getDaysToDeadline(goal.lastUpdate);
    
    // High priority: Very behind or very urgent
    if (progress < 30 || daysToDealline < 0) return 'high';
    
    // Medium priority: Somewhat behind and moderately urgent  
    if (progress < 50 && daysToDealline < 14) return 'medium';
    
    // Low priority: Course correction needed
    return 'low';
  }
  
  /**
   * Calculate days until deadline (negative means overdue)
   */
  private getDaysToDeadline(lastUpdate: Date): number {
    const now = new Date();
    const quarterEnd = this.getQuarterEnd();
    return Math.ceil((quarterEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Get end of current quarter as default deadline
   */
  private getQuarterEnd(): Date {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const year = now.getFullYear();
    
    switch (quarter) {
      case 1: return new Date(year, 2, 31); // March 31
      case 2: return new Date(year, 5, 30); // June 30  
      case 3: return new Date(year, 8, 30); // September 30
      case 4: return new Date(year, 11, 31); // December 31
      default: return new Date(year, 11, 31);
    }
  }
}

export const strategyExecutor = new StrategyExecutor();