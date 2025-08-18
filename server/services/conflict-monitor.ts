import { autonomousConflictResolver } from './autonomous-conflict-resolver';
import { db } from '../db';
import { conflicts, agents, agentDirectives, conflictPredictions } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface ConflictTrigger {
  id: string;
  condition: () => Promise<boolean>;
  createConflict: () => Promise<string>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ConflictMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  private triggers: ConflictTrigger[] = [
    {
      id: 'resource-overallocation',
      condition: async () => {
        // Check for agents with >90% utilization
        const overutilized = await db.execute(sql`
          SELECT COUNT(*) as count FROM agent_workloads 
          WHERE utilization_rate > 90
        `);
        return Number(overutilized.rows[0]?.count) > 0;
      },
      createConflict: async () => {
        return await this.createResourceConflict();
      },
      severity: 'high'
    },
    {
      id: 'priority-collision',
      condition: async () => {
        // Check for multiple P1 directives on same agent
        const priorityCollisions = await db.execute(sql`
          SELECT target_agent, COUNT(*) as count 
          FROM agent_directives 
          WHERE priority = 'p1' AND status IN ('assigned', 'in_progress')
          GROUP BY target_agent 
          HAVING COUNT(*) > 2
        `);
        return priorityCollisions.rows.length > 0;
      },
      createConflict: async () => {
        return await this.createPriorityConflict();
      },
      severity: 'high'
    },
    {
      id: 'deadline-collision',
      condition: async () => {
        // Check for overlapping critical deadlines
        const overlappingDeadlines = await db.execute(sql`
          SELECT target_agent, COUNT(*) as count
          FROM agent_directives 
          WHERE deadline < NOW() + INTERVAL '3 days' 
          AND status IN ('assigned', 'in_progress')
          GROUP BY target_agent 
          HAVING COUNT(*) > 1
        `);
        return overlappingDeadlines.rows.length > 0;
      },
      createConflict: async () => {
        return await this.createDeadlineConflict();
      },
      severity: 'critical'
    },
    {
      id: 'cross-agent-dependency',
      condition: async () => {
        // Check for circular dependencies or blocked chains
        const blockedDirectives = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM agent_directives 
          WHERE status = 'blocked'
        `);
        return Number(blockedDirectives.rows[0]?.count) > 2;
      },
      createConflict: async () => {
        return await this.createDependencyConflict();
      },
      severity: 'medium'
    },
    {
      id: 'performance-degradation',
      condition: async () => {
        // Check for agents with declining success rates
        const underperforming = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM agents 
          WHERE success_rate < 70 OR strategic_alignment < 60
        `);
        return Number(underperforming.rows[0]?.count) > 0;
      },
      createConflict: async () => {
        return await this.createPerformanceConflict();
      },
      severity: 'medium'
    }
  ];

  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.log('Conflict monitoring already active');
      return;
    }

    console.log(`Starting autonomous conflict monitoring with ${intervalMs}ms interval`);
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      await this.monitoringCycle();
    }, intervalMs);

    // Run initial monitoring cycle
    this.monitoringCycle();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Stopped autonomous conflict monitoring');
  }

  private async monitoringCycle(): Promise<void> {
    try {
      console.log('Running autonomous conflict monitoring cycle...');
      
      // Check all triggers
      for (const trigger of this.triggers) {
        try {
          const conditionMet = await trigger.condition();
          if (conditionMet) {
            console.log(`Conflict trigger detected: ${trigger.id} (${trigger.severity})`);
            
            // Create conflict
            const conflictId = await trigger.createConflict();
            
            // Immediately resolve if high/critical severity
            if (trigger.severity === 'high' || trigger.severity === 'critical') {
              setTimeout(async () => {
                const result = await autonomousConflictResolver.resolveConflictAutonomously(conflictId);
                console.log(`Auto-resolved ${trigger.severity} conflict ${conflictId}:`, result.reasoning);
              }, 1000); // Small delay to ensure conflict is committed
            }
          }
        } catch (error) {
          console.error(`Error checking trigger ${trigger.id}:`, error);
        }
      }

      // Run autonomous resolution on any unresolved conflicts
      await autonomousConflictResolver.monitorAndResolveConflicts();
      
    } catch (error) {
      console.error('Error in monitoring cycle:', error);
    }
  }

  private async createResourceConflict(): Promise<string> {
    // Get overutilized agents
    const overutilized = await db.execute(sql`
      SELECT agent_id FROM agent_workloads 
      WHERE utilization_rate > 90
    `);

    const agentIds = overutilized.rows.map(row => row.agent_id as string);

    const [conflict] = await db.insert(conflicts).values({
      title: 'Resource Over-allocation Detected',
      area: 'resource-capacity',
      agents: agentIds,
      positions: agentIds.reduce((acc, id) => {
        acc[id] = `Agent ${id} operating at >90% capacity`;
        return acc;
      }, {} as Record<string, string>),
      status: 'active'
    }).returning();

    return conflict.id;
  }

  private async createPriorityConflict(): Promise<string> {
    // Get agents with multiple P1 directives
    const priorityData = await db.execute(sql`
      SELECT target_agent, COUNT(*) as count 
      FROM agent_directives 
      WHERE priority = 'p1' AND status IN ('assigned', 'in_progress')
      GROUP BY target_agent 
      HAVING COUNT(*) > 2
    `);

    const agentIds = priorityData.rows.map(row => row.target_agent as string);

    const [conflict] = await db.insert(conflicts).values({
      title: 'Multiple High-Priority Task Collision',
      area: 'priority-management',
      agents: agentIds,
      positions: agentIds.reduce((acc, id) => {
        acc[id] = `Agent ${id} has multiple P1 directives competing for resources`;
        return acc;
      }, {} as Record<string, string>),
      status: 'active'
    }).returning();

    return conflict.id;
  }

  private async createDeadlineConflict(): Promise<string> {
    // Get agents with overlapping critical deadlines
    const deadlineData = await db.execute(sql`
      SELECT target_agent, COUNT(*) as count
      FROM agent_directives 
      WHERE deadline < NOW() + INTERVAL '3 days' 
      AND status IN ('assigned', 'in_progress')
      GROUP BY target_agent 
      HAVING COUNT(*) > 1
    `);

    const agentIds = deadlineData.rows.map(row => row.target_agent as string);

    const [conflict] = await db.insert(conflicts).values({
      title: 'Critical Deadline Collision',
      area: 'timeline-management',
      agents: agentIds,
      positions: agentIds.reduce((acc, id) => {
        acc[id] = `Agent ${id} has multiple critical deadlines within 3 days`;
        return acc;
      }, {} as Record<string, string>),
      status: 'active'
    }).returning();

    return conflict.id;
  }

  private async createDependencyConflict(): Promise<string> {
    // Get blocked directives and their agents
    const blockedData = await db.execute(sql`
      SELECT target_agent 
      FROM agent_directives 
      WHERE status = 'blocked'
    `);

    const agentIds = Array.from(new Set(blockedData.rows.map(row => row.target_agent as string)));

    const [conflict] = await db.insert(conflicts).values({
      title: 'Cross-Agent Dependency Bottleneck',
      area: 'workflow-dependencies',
      agents: agentIds,
      positions: agentIds.reduce((acc, id) => {
        acc[id] = `Agent ${id} has blocked tasks creating dependency chain issues`;
        return acc;
      }, {} as Record<string, string>),
      status: 'active'
    }).returning();

    return conflict.id;
  }

  private async createPerformanceConflict(): Promise<string> {
    // Get underperforming agents
    const performanceData = await db.execute(sql`
      SELECT id, name, success_rate, strategic_alignment 
      FROM agents 
      WHERE success_rate < 70 OR strategic_alignment < 60
    `);

    const agentIds = performanceData.rows.map(row => row.id as string);

    const [conflict] = await db.insert(conflicts).values({
      title: 'Agent Performance Degradation',
      area: 'performance-optimization',
      agents: agentIds,
      positions: agentIds.reduce((acc, id) => {
        const agent = performanceData.rows.find(row => row.id === id);
        acc[id] = `Agent ${id} showing declining performance: ${agent?.success_rate}% success, ${agent?.strategic_alignment}% alignment`;
        return acc;
      }, {} as Record<string, string>),
      status: 'active'
    }).returning();

    return conflict.id;
  }

  // Public method to check system health
  async getSystemHealthStatus(): Promise<{
    overallHealth: 'healthy' | 'warning' | 'critical';
    activeConflicts: number;
    resolvedToday: number;
    triggers: { id: string; active: boolean; severity: string; }[];
  }> {
    // Count active conflicts
    const activeConflicts = await db.execute(sql`
      SELECT COUNT(*) as count FROM conflicts WHERE status = 'active'
    `);

    // Count resolved today
    const resolvedToday = await db.execute(sql`
      SELECT COUNT(*) as count FROM conflicts 
      WHERE status = 'resolved' AND resolved_at >= CURRENT_DATE
    `);

    // Check trigger conditions
    const triggerStatus = await Promise.all(
      this.triggers.map(async (trigger) => ({
        id: trigger.id,
        active: await trigger.condition().catch(() => false),
        severity: trigger.severity
      }))
    );

    const activeCount = Number(activeConflicts.rows[0]?.count) || 0;
    const criticalTriggers = triggerStatus.filter(t => t.active && t.severity === 'critical').length;
    const highTriggers = triggerStatus.filter(t => t.active && t.severity === 'high').length;

    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalTriggers > 0 || activeCount > 3) {
      overallHealth = 'critical';
    } else if (highTriggers > 0 || activeCount > 1) {
      overallHealth = 'warning';
    }

    return {
      overallHealth,
      activeConflicts: activeCount,
      resolvedToday: Number(resolvedToday.rows[0]?.count) || 0,
      triggers: triggerStatus
    };
  }
}

// Export singleton instance
export const conflictMonitor = new ConflictMonitor();