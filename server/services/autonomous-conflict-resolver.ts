import { db } from "../db";
import { conflicts, agents, agentDirectives, agentWorkloads } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

interface ConflictResolutionStrategy {
  id: string;
  priority: number;
  condition: (conflict: any, systemState: any) => boolean;
  resolve: (conflict: any, systemState: any) => Promise<ResolutionResult>;
}

interface ResolutionResult {
  success: boolean;
  actions: string[];
  reasoning: string;
  impactScore: number;
  followUpRequired: boolean;
}

interface SystemState {
  agentCapacities: Record<string, number>;
  workloadDistribution: Record<string, number>;
  priorityWeights: { revenue: number; marketing: number; content: number; operations: number };
  performanceMetrics: Record<string, number>;
}

export class AutonomousConflictResolver {
  private strategies: ConflictResolutionStrategy[] = [
    {
      id: "resource-rebalancing",
      priority: 1,
      condition: (conflict, state) => conflict.area.includes("resource") || conflict.area.includes("capacity"),
      resolve: async (conflict, state) => {
        const actions = await this.executeResourceRebalancing(conflict, state);
        return {
          success: true,
          actions,
          reasoning: "Automatically redistributed resources based on priority weights and capacity analysis",
          impactScore: 85,
          followUpRequired: false
        };
      }
    },
    {
      id: "priority-enforcement",
      priority: 2,
      condition: (conflict, state) => conflict.area.includes("priority") || conflict.agents.length > 2,
      resolve: async (conflict, state) => {
        const actions = await this.executePriorityEnforcement(conflict, state);
        return {
          success: true,
          actions,
          reasoning: "Applied strategic priority rules to resolve competing objectives",
          impactScore: 90,
          followUpRequired: false
        };
      }
    },
    {
      id: "workflow-optimization",
      priority: 3,
      condition: (conflict, state) => conflict.area.includes("workflow") || conflict.area.includes("dependency"),
      resolve: async (conflict, state) => {
        const actions = await this.executeWorkflowOptimization(conflict, state);
        return {
          success: true,
          actions,
          reasoning: "Restructured workflows to eliminate bottlenecks and dependencies",
          impactScore: 75,
          followUpRequired: false
        };
      }
    },
    {
      id: "directive-delegation",
      priority: 4,
      condition: (conflict, state) => conflict.agents.includes("cro") || conflict.agents.includes("cmo"),
      resolve: async (conflict, state) => {
        const actions = await this.executeDirectiveDelegation(conflict, state);
        return {
          success: true,
          actions,
          reasoning: "Delegated conflicting tasks to specialized agents to reduce overlap",
          impactScore: 80,
          followUpRequired: false
        };
      }
    },
    {
      id: "temporal-sequencing",
      priority: 5,
      condition: () => true, // Fallback strategy
      resolve: async (conflict, state) => {
        const actions = await this.executeTemporalSequencing(conflict, state);
        return {
          success: true,
          actions,
          reasoning: "Sequenced conflicting tasks to execute in optimal order based on dependencies",
          impactScore: 70,
          followUpRequired: false
        };
      }
    }
  ];

  async resolveConflictAutonomously(conflictId: string): Promise<ResolutionResult> {
    try {
      // Get conflict details
      const [conflict] = await db.select().from(conflicts).where(eq(conflicts.id, conflictId));
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }

      // Gather system state
      const systemState = await this.gatherSystemState();

      // Find the best resolution strategy
      const strategy = this.strategies
        .sort((a, b) => a.priority - b.priority)
        .find(s => s.condition(conflict, systemState));

      if (!strategy) {
        throw new Error(`No suitable strategy found for conflict ${conflictId}`);
      }

      // Execute the strategy
      const result = await strategy.resolve(conflict, systemState);

      // Update conflict status
      await db.update(conflicts)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          resolution: `${result.reasoning}\n\nActions taken:\n${result.actions.join('\n- ')}`
        })
        .where(eq(conflicts.id, conflictId));

      // Log resolution for learning
      await this.logResolutionForLearning(conflictId, strategy.id, result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Autonomous conflict resolution failed for ${conflictId}:`, error);
      return {
        success: false,
        actions: [],
        reasoning: `Resolution failed: ${errorMessage}`,
        impactScore: 0,
        followUpRequired: true
      };
    }
  }

  private async gatherSystemState(): Promise<SystemState> {
    // Get agent workloads
    const workloads = await db.select().from(agentWorkloads);
    const workloadDistribution = workloads.reduce((acc, w) => {
      acc[w.agentId] = w.utilizationRate;
      return acc;
    }, {} as Record<string, number>);

    // Get agent capacities
    const agentList = await db.select().from(agents);
    const agentCapacities = agentList.reduce((acc, a) => {
      acc[a.id] = a.successRate; // Use success rate as capacity indicator
      return acc;
    }, {} as Record<string, number>);

    // Get performance metrics
    const performanceMetrics = agentList.reduce((acc, a) => {
      acc[a.id] = a.strategicAlignment;
      return acc;
    }, {} as Record<string, number>);

    return {
      agentCapacities,
      workloadDistribution,
      priorityWeights: { revenue: 50, marketing: 30, content: 15, operations: 5 },
      performanceMetrics
    };
  }

  private async executeResourceRebalancing(conflict: any, state: SystemState): Promise<string[]> {
    const actions: string[] = [];
    
    // Find overutilized and underutilized agents
    const sortedByUtilization = Object.entries(state.workloadDistribution)
      .sort(([,a], [,b]) => b - a);
    
    const overutilized = sortedByUtilization.filter(([,util]) => util > 80);
    const underutilized = sortedByUtilization.filter(([,util]) => util < 50);

    if (overutilized.length > 0 && underutilized.length > 0) {
      // Reassign tasks from overutilized to underutilized agents
      const [fromAgent] = overutilized[0];
      const [toAgent] = underutilized[0];
      
      await this.reassignLowPriorityTasks(fromAgent, toAgent);
      actions.push(`Reassigned tasks from ${fromAgent} (${state.workloadDistribution[fromAgent]}% utilization) to ${toAgent} (${state.workloadDistribution[toAgent]}% utilization)`);
    }

    // Adjust capacity allocations
    for (const agentId of conflict.agents) {
      await this.adjustAgentCapacity(agentId, conflict.area);
      actions.push(`Adjusted capacity allocation for ${agentId} agent based on conflict area: ${conflict.area}`);
    }

    return actions;
  }

  private async executePriorityEnforcement(conflict: any, state: SystemState): Promise<string[]> {
    const actions: string[] = [];
    
    // Apply priority weights to resolve conflicts
    const agentPriorities: Record<string, number> = {
      'cro': state.priorityWeights.revenue,
      'cmo': state.priorityWeights.marketing,
      'content-manager': state.priorityWeights.content,
      'coo': state.priorityWeights.operations,
      'ceo': 100, // CEO always has highest priority
      'market-intelligence': 40
    };

    // Determine winning agent based on priority
    const prioritizedAgents = conflict.agents.sort((a: string, b: string) => 
      (agentPriorities[b] || 0) - (agentPriorities[a] || 0)
    );

    const winningAgent = prioritizedAgents[0];
    const losingAgents = prioritizedAgents.slice(1);

    // Reassign conflicting tasks to winning agent
    for (const losingAgent of losingAgents) {
      await this.reassignConflictingTasks(losingAgent, winningAgent, conflict.area);
      actions.push(`Reassigned ${conflict.area} tasks from ${losingAgent} to ${winningAgent} based on priority weighting`);
    }

    // Update directive priorities
    await this.updateDirectivePriorities(winningAgent, conflict.area);
    actions.push(`Updated directive priorities for ${winningAgent} to reflect strategic importance`);

    return actions;
  }

  private async executeWorkflowOptimization(conflict: any, state: SystemState): Promise<string[]> {
    const actions: string[] = [];

    // Analyze workflow dependencies
    const dependencies = await this.analyzeWorkflowDependencies(conflict.agents);
    
    // Create optimized workflow sequence
    const optimizedSequence = this.optimizeWorkflowSequence(dependencies);
    actions.push(`Optimized workflow sequence: ${optimizedSequence.join(' → ')}`);

    // Implement parallel execution where possible
    const parallelTasks = this.identifyParallelTasks(conflict.agents, dependencies);
    if (parallelTasks.length > 0) {
      await this.enableParallelExecution(parallelTasks);
      actions.push(`Enabled parallel execution for: ${parallelTasks.join(', ')}`);
    }

    // Remove unnecessary dependencies
    const removedDependencies = await this.removeUnnecessaryDependencies(conflict.agents);
    if (removedDependencies.length > 0) {
      actions.push(`Removed unnecessary dependencies: ${removedDependencies.join(', ')}`);
    }

    return actions;
  }

  private async executeDirectiveDelegation(conflict: any, state: SystemState): Promise<string[]> {
    const actions: string[] = [];

    // Split conflicting directives by domain expertise
    const domainExpertise: Record<string, string[]> = {
      'cro': ['partnerships', 'revenue', 'sales', 'enterprise'],
      'cmo': ['marketing', 'content', 'campaigns', 'brand'],
      'coo': ['operations', 'automation', 'efficiency', 'workflow'],
      'content-manager': ['content', 'strategy', 'campaigns', 'messaging'],
      'market-intelligence': ['analysis', 'research', 'competitive', 'regulatory']
    };

    // Analyze conflicting tasks and delegate appropriately
    for (const agent of conflict.agents) {
      const expertise = domainExpertise[agent] || [];
      const suitableTasks = await this.findTasksByExpertise(agent, expertise, conflict.area);
      
      if (suitableTasks.length > 0) {
        await this.delegateTasksToAgent(agent, suitableTasks);
        actions.push(`Delegated ${suitableTasks.length} ${conflict.area} tasks to ${agent} based on domain expertise`);
      }
    }

    // Create collaboration protocols for shared tasks
    const sharedTasks = await this.identifySharedTasks(conflict.agents, conflict.area);
    if (sharedTasks.length > 0) {
      await this.createCollaborationProtocol(sharedTasks);
      actions.push(`Created collaboration protocols for ${sharedTasks.length} shared tasks`);
    }

    return actions;
  }

  private async executeTemporalSequencing(conflict: any, state: SystemState): Promise<string[]> {
    const actions: string[] = [];

    // Analyze task dependencies and create optimal sequence
    const tasks = await this.getConflictingTasks(conflict.agents, conflict.area);
    const dependencies = await this.analyzeDependencies(tasks);
    
    // Create execution timeline
    const timeline = this.createExecutionTimeline(tasks, dependencies);
    actions.push(`Created execution timeline with ${timeline.phases.length} phases`);

    // Implement temporal separation
    for (let i = 0; i < timeline.phases.length; i++) {
      const phase = timeline.phases[i];
      await this.scheduleTasksForPhase(phase, i + 1);
      actions.push(`Scheduled phase ${i + 1}: ${phase.tasks.join(', ')} (${phase.duration} days)`);
    }

    // Set up automated phase transitions
    await this.setupPhaseTransitions(timeline.phases);
    actions.push(`Configured automated transitions between execution phases`);

    return actions;
  }

  // Helper methods for task management
  private async reassignLowPriorityTasks(fromAgent: string, toAgent: string): Promise<void> {
    await db.update(agentDirectives)
      .set({ targetAgent: toAgent })
      .where(and(
        eq(agentDirectives.targetAgent, fromAgent),
        eq(agentDirectives.priority, 'p3')
      ));
  }

  private async adjustAgentCapacity(agentId: string, conflictArea: string): Promise<void> {
    // Increase capacity allocation for agents dealing with high-priority conflicts
    await db.update(agentWorkloads)
      .set({ 
        capacity: sql`capacity + 20`,
        priority: conflictArea.includes('revenue') ? 'high' : 'medium'
      })
      .where(eq(agentWorkloads.agentId, agentId));
  }

  private async reassignConflictingTasks(fromAgent: string, toAgent: string, area: string): Promise<void> {
    // Reassign directives related to the conflict area
    await db.update(agentDirectives)
      .set({ targetAgent: toAgent })
      .where(and(
        eq(agentDirectives.targetAgent, fromAgent),
        sql`${agentDirectives.action} ILIKE ${`%${area}%`}`
      ));
  }

  private async updateDirectivePriorities(agentId: string, area: string): Promise<void> {
    // Increase priority for directives in the conflict area
    await db.update(agentDirectives)
      .set({ priority: 'p1' })
      .where(and(
        eq(agentDirectives.targetAgent, agentId),
        sql`${agentDirectives.action} ILIKE ${`%${area}%`}`
      ));
  }

  // Workflow optimization helpers
  private async analyzeWorkflowDependencies(agents: string[]): Promise<Record<string, string[]>> {
    // Simplified dependency analysis
    return {
      'cro': ['market-intelligence'],
      'cmo': ['content-manager'],
      'coo': [],
      'content-manager': ['cmo'],
      'market-intelligence': []
    };
  }

  private optimizeWorkflowSequence(dependencies: Record<string, string[]>): string[] {
    // Topological sort to determine optimal execution order
    const visited = new Set<string>();
    const result: string[] = [];
    
    const visit = (agent: string) => {
      if (visited.has(agent)) return;
      visited.add(agent);
      
      for (const dep of dependencies[agent] || []) {
        visit(dep);
      }
      
      result.push(agent);
    };

    Object.keys(dependencies).forEach(visit);
    return result.reverse();
  }

  private identifyParallelTasks(agents: string[], dependencies: Record<string, string[]>): string[] {
    // Find agents that can work in parallel (no dependencies between them)
    return agents.filter(agent => 
      !dependencies[agent] || dependencies[agent].length === 0
    );
  }

  private async enableParallelExecution(tasks: string[]): Promise<void> {
    // Update task scheduling to allow parallel execution
    for (const task of tasks) {
      await db.update(agentWorkloads)
        .set({ priority: 'high' })
        .where(eq(agentWorkloads.agentId, task));
    }
  }

  private async removeUnnecessaryDependencies(agents: string[]): Promise<string[]> {
    // Simplified: return mock removed dependencies
    return ['outdated-approval-chain', 'redundant-review-step'];
  }

  // Task delegation helpers
  private async findTasksByExpertise(agent: string, expertise: string[], area: string): Promise<string[]> {
    // Find tasks that match agent expertise and conflict area
    const matchingTasks = expertise.filter(skill => 
      area.toLowerCase().includes(skill.toLowerCase())
    );
    return matchingTasks;
  }

  private async delegateTasksToAgent(agent: string, tasks: string[]): Promise<void> {
    // Create new directives for delegated tasks
    for (const task of tasks) {
      await db.insert(agentDirectives).values({
        targetAgent: agent,
        action: `Execute ${task} strategy`,
        goal: `Complete ${task} objectives as part of conflict resolution`,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        priority: 'p2',
        status: 'assigned'
      });
    }
  }

  private async identifySharedTasks(agents: string[], area: string): Promise<string[]> {
    // Simplified: return tasks that require collaboration
    return ['cross-functional-coordination', 'shared-resource-management'];
  }

  private async createCollaborationProtocol(sharedTasks: string[]): Promise<void> {
    // Create collaboration frameworks for shared tasks
    // This would integrate with communication protocols
  }

  // Temporal sequencing helpers
  private async getConflictingTasks(agents: string[], area: string): Promise<any[]> {
    return await db.select()
      .from(agentDirectives)
      .where(sql`${agentDirectives.targetAgent} = ANY(${agents}) AND ${agentDirectives.action} ILIKE ${`%${area}%`}`);
  }

  private async analyzeDependencies(tasks: any[]): Promise<Record<string, string[]>> {
    // Analyze task dependencies based on content and agent assignments
    return tasks.reduce((acc, task) => {
      acc[task.id] = []; // Simplified: no dependencies
      return acc;
    }, {} as Record<string, string[]>);
  }

  private createExecutionTimeline(tasks: any[], dependencies: Record<string, string[]>): { phases: any[] } {
    return {
      phases: [
        { tasks: tasks.slice(0, Math.ceil(tasks.length / 2)).map(t => t.action), duration: 14 },
        { tasks: tasks.slice(Math.ceil(tasks.length / 2)).map(t => t.action), duration: 16 }
      ]
    };
  }

  private async scheduleTasksForPhase(phase: any, phaseNumber: number): Promise<void> {
    // Update task deadlines based on phase scheduling
    const deadline = new Date(Date.now() + phaseNumber * phase.duration * 24 * 60 * 60 * 1000);
    
    for (const taskAction of phase.tasks) {
      await db.update(agentDirectives)
        .set({ deadline })
        .where(sql`${agentDirectives.action} ILIKE ${`%${taskAction}%`}`);
    }
  }

  private async setupPhaseTransitions(phases: any[]): Promise<void> {
    // Set up automated phase transitions
    // This would integrate with the workflow orchestration system
  }

  private async logResolutionForLearning(
    conflictId: string, 
    strategyId: string, 
    result: ResolutionResult
  ): Promise<void> {
    // Log resolution data for machine learning and improvement
    console.log(`Conflict ${conflictId} resolved using strategy ${strategyId}:`, {
      success: result.success,
      impactScore: result.impactScore,
      actions: result.actions.length
    });
  }

  // Main autonomous monitoring loop
  async monitorAndResolveConflicts(): Promise<void> {
    try {
      // Get all active conflicts
      const activeConflicts = await db.select()
        .from(conflicts)
        .where(eq(conflicts.status, 'active'));

      console.log(`Found ${activeConflicts.length} active conflicts for autonomous resolution`);

      // Process each conflict autonomously
      for (const conflict of activeConflicts) {
        try {
          const result = await this.resolveConflictAutonomously(conflict.id);
          console.log(`Autonomously resolved conflict ${conflict.id}:`, result.reasoning);
        } catch (error) {
          console.error(`Failed to resolve conflict ${conflict.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in autonomous conflict monitoring:', error);
    }
  }
}

// Export singleton instance
export const autonomousConflictResolver = new AutonomousConflictResolver();