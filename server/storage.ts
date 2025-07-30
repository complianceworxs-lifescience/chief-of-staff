import { 
  type Agent, 
  type InsertAgent,
  type Conflict,
  type InsertConflict,
  type StrategicObjective,
  type InsertStrategicObjective,
  type WeeklyReport,
  type InsertWeeklyReport,
  type SystemMetrics,
  type InsertSystemMetrics,
  type AgentCommunication,
  type InsertAgentCommunication,
  type PerformanceHistory,
  type InsertPerformanceHistory,
  type ConflictPrediction,
  type InsertConflictPrediction,
  type AgentWorkload,
  type InsertAgentWorkload,
  type SmartRecommendation,
  type InsertSmartRecommendation,
  type AiQuestion,
  type InsertAiQuestion,
  agents,
  conflicts,
  strategicObjectives,
  weeklyReports,
  systemMetrics,
  agentCommunications,
  performanceHistory,
  conflictPredictions,
  agentWorkloads,
  smartRecommendations,
  aiQuestions
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Agents
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, agent: Partial<Agent>): Promise<Agent>;
  
  // Conflicts
  getConflicts(): Promise<Conflict[]>;
  getActiveConflicts(): Promise<Conflict[]>;
  getConflict(id: string): Promise<Conflict | undefined>;
  createConflict(conflict: InsertConflict): Promise<Conflict>;
  updateConflict(id: string, conflict: Partial<Conflict>): Promise<Conflict>;
  
  // Strategic Objectives
  getStrategicObjectives(): Promise<StrategicObjective[]>;
  getStrategicObjective(id: string): Promise<StrategicObjective | undefined>;
  createStrategicObjective(objective: InsertStrategicObjective): Promise<StrategicObjective>;
  updateStrategicObjective(id: string, objective: Partial<StrategicObjective>): Promise<StrategicObjective>;
  
  // Weekly Reports
  getWeeklyReports(): Promise<WeeklyReport[]>;
  getWeeklyReport(id: string): Promise<WeeklyReport | undefined>;
  createWeeklyReport(report: InsertWeeklyReport): Promise<WeeklyReport>;
  
  // System Metrics
  getLatestSystemMetrics(): Promise<SystemMetrics | undefined>;
  createSystemMetrics(metrics: InsertSystemMetrics): Promise<SystemMetrics>;
  
  // Agent Communications
  getRecentAgentCommunications(limit: number): Promise<AgentCommunication[]>;
  getAgentCommunications(agentId: string, limit: number): Promise<AgentCommunication[]>;
  createAgentCommunication(communication: InsertAgentCommunication): Promise<AgentCommunication>;
  
  // Performance History
  getPerformanceHistory(agentId: string, days: number): Promise<PerformanceHistory[]>;
  createPerformanceHistory(history: InsertPerformanceHistory): Promise<PerformanceHistory>;
  
  // Conflict Predictions
  getConflictPredictions(): Promise<ConflictPrediction[]>;
  createConflictPrediction(prediction: InsertConflictPrediction): Promise<ConflictPrediction>;
  updateConflictPrediction(id: string, prediction: Partial<ConflictPrediction>): Promise<ConflictPrediction>;
  
  // Agent Workloads
  getAgentWorkloads(): Promise<AgentWorkload[]>;
  getAgentWorkload(agentId: string): Promise<AgentWorkload | undefined>;
  createAgentWorkload(workload: InsertAgentWorkload): Promise<AgentWorkload>;
  updateAgentWorkload(agentId: string, workload: Partial<AgentWorkload>): Promise<AgentWorkload>;
  
  // Smart Recommendations
  getSmartRecommendations(status?: string): Promise<SmartRecommendation[]>;
  createSmartRecommendation(recommendation: InsertSmartRecommendation): Promise<SmartRecommendation>;
  updateSmartRecommendation(id: string, recommendation: Partial<SmartRecommendation>): Promise<SmartRecommendation>;
  
  // AI Questions
  getRecentAiQuestions(limit: number): Promise<AiQuestion[]>;
  getAiQuestionsByCategory(category: string): Promise<AiQuestion[]>;
  createAiQuestion(question: InsertAiQuestion): Promise<AiQuestion>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database storage doesn't need initialization
  }

  private async initializeData() {
    // Check if data already exists
    const existingAgents = await db.select().from(agents);
    if (existingAgents.length > 0) {
      return; // Data already initialized
    }

    // Initialize default agents
    const defaultAgents: InsertAgent[] = [
      {
        id: "ceo",
        name: "CEO Agent",
        status: "healthy",
        lastActive: new Date(Date.now() - 15 * 60 * 1000),
        lastReport: "Weekly Strategy Brief",
        successRate: 98,
        strategicAlignment: 95,
        icon: "fas fa-crown",
        color: "bg-primary"
      },
      {
        id: "cro",
        name: "CRO Agent",
        status: "conflict",
        lastActive: new Date(Date.now() - 8 * 60 * 1000),
        lastReport: "Revenue Analysis",
        successRate: 94,
        strategicAlignment: 88,
        icon: "fas fa-chart-line",
        color: "bg-success-green"
      },
      {
        id: "cmo",
        name: "CMO Agent",
        status: "conflict",
        lastActive: new Date(Date.now() - 12 * 60 * 1000),
        lastReport: "Campaign Performance",
        successRate: 91,
        strategicAlignment: 82,
        icon: "fas fa-bullhorn",
        color: "bg-purple-600"
      },
      {
        id: "coo",
        name: "COO Agent",
        status: "healthy",
        lastActive: new Date(Date.now() - 5 * 60 * 1000),
        lastReport: "Operations Review",
        successRate: 96,
        strategicAlignment: 90,
        icon: "fas fa-cogs",
        color: "bg-indigo-600"
      },
      {
        id: "content",
        name: "Content Agent",
        status: "delayed",
        lastActive: new Date(Date.now() - 20 * 60 * 1000),
        lastReport: "Content Calendar",
        successRate: 89,
        strategicAlignment: 78,
        icon: "fas fa-pen-fancy",
        color: "bg-teal-600"
      },
      {
        id: "lexi",
        name: "Lexi Agent",
        status: "healthy",
        lastActive: new Date(Date.now() - 3 * 60 * 1000),
        lastReport: "FAQ Update",
        successRate: 93,
        strategicAlignment: 85,
        icon: "fas fa-comments",
        color: "bg-pink-600"
      }
    ];

    await db.insert(agents).values(defaultAgents);

    // Initialize default conflicts
    const defaultConflicts: InsertConflict[] = [
      {
        title: "Pricing Strategy Conflict - Tier 2",
        area: "Pricing Tier 2",
        agents: ["cro", "cmo"],
        positions: {
          "cro": "Increase Tier 2 pricing by 15% to improve margins",
          "cmo": "Price sensitivity analysis suggests maintaining current pricing"
        },
        status: "active"
      },
      {
        title: "Resource Allocation Dispute",
        area: "Budget Allocation",
        agents: ["coo", "content"],
        positions: {
          "coo": "Allocate 60% of Q3 budget to compliance automation",
          "content": "Requires 40% budget allocation for content strategy expansion"
        },
        status: "active"
      }
    ];

    for (const conflict of defaultConflicts) {
      await db.insert(conflicts).values(conflict);
    }

    // Initialize strategic objectives
    const defaultObjectives: InsertStrategicObjective[] = [
      {
        title: "Increase Tier 3 MRR by 20%",
        progress: 78,
        contributingAgents: ["ceo", "cro"],
        quarter: "Q3 2025"
      },
      {
        title: "Improve Customer Retention by 15%",
        progress: 65,
        contributingAgents: ["coo", "content", "lexi"],
        quarter: "Q3 2025"
      },
      {
        title: "Expand Content Marketing Reach by 40%",
        progress: 45,
        contributingAgents: ["cmo", "content"],
        quarter: "Q3 2025"
      }
    ];

    for (const objective of defaultObjectives) {
      await db.insert(strategicObjectives).values(objective);
    }

    // Initialize system metrics
    await db.insert(systemMetrics).values({
      systemHealth: 92,
      activeAgents: 6,
      totalAgents: 6,
      activeConflicts: 2,
      strategicAlignmentScore: 85
    });
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    await this.initializeData();
    return await db.select().from(agents);
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db
      .insert(agents)
      .values(agent)
      .returning();
    return newAgent;
  }

  async updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
    const [updated] = await db
      .update(agents)
      .set(agent)
      .where(eq(agents.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Agent with id ${id} not found`);
    }
    return updated;
  }

  // Conflicts
  async getConflicts(): Promise<Conflict[]> {
    return await db.select().from(conflicts).orderBy(desc(conflicts.createdAt));
  }

  async getActiveConflicts(): Promise<Conflict[]> {
    return await db.select().from(conflicts).where(eq(conflicts.status, "active"));
  }

  async getConflict(id: string): Promise<Conflict | undefined> {
    const [conflict] = await db.select().from(conflicts).where(eq(conflicts.id, id));
    return conflict || undefined;
  }

  async createConflict(conflict: InsertConflict): Promise<Conflict> {
    const [newConflict] = await db
      .insert(conflicts)
      .values({
        ...conflict,
        agents: conflict.agents as string[]
      })
      .returning();
    return newConflict;
  }

  async updateConflict(id: string, conflict: Partial<Conflict>): Promise<Conflict> {
    const [updated] = await db
      .update(conflicts)
      .set(conflict)
      .where(eq(conflicts.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Conflict with id ${id} not found`);
    }
    return updated;
  }

  // Strategic Objectives
  async getStrategicObjectives(): Promise<StrategicObjective[]> {
    return await db.select().from(strategicObjectives).orderBy(desc(strategicObjectives.lastUpdate));
  }

  async getStrategicObjective(id: string): Promise<StrategicObjective | undefined> {
    const [objective] = await db.select().from(strategicObjectives).where(eq(strategicObjectives.id, id));
    return objective || undefined;
  }

  async createStrategicObjective(objective: InsertStrategicObjective): Promise<StrategicObjective> {
    const [newObjective] = await db
      .insert(strategicObjectives)
      .values({
        ...objective,
        contributingAgents: objective.contributingAgents as string[]
      })
      .returning();
    return newObjective;
  }

  async updateStrategicObjective(id: string, objective: Partial<StrategicObjective>): Promise<StrategicObjective> {
    const [updated] = await db
      .update(strategicObjectives)
      .set(objective)
      .where(eq(strategicObjectives.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Strategic objective with id ${id} not found`);
    }
    return updated;
  }

  // Weekly Reports
  async getWeeklyReports(): Promise<WeeklyReport[]> {
    return await db.select().from(weeklyReports).orderBy(desc(weeklyReports.generatedAt));
  }

  async getWeeklyReport(id: string): Promise<WeeklyReport | undefined> {
    const [report] = await db.select().from(weeklyReports).where(eq(weeklyReports.id, id));
    return report || undefined;
  }

  async createWeeklyReport(report: InsertWeeklyReport): Promise<WeeklyReport> {
    const [newReport] = await db
      .insert(weeklyReports)
      .values({
        ...report,
        strategicAlignment: report.strategicAlignment as Record<string, string[]>,
        recommendations: report.recommendations as string[],
        highlights: report.highlights as string[],
        agentStatuses: report.agentStatuses as Record<string, string>
      })
      .returning();
    return newReport;
  }

  // System Metrics
  async getLatestSystemMetrics(): Promise<SystemMetrics | undefined> {
    const [metrics] = await db.select().from(systemMetrics).orderBy(desc(systemMetrics.timestamp)).limit(1);
    return metrics || undefined;
  }

  async createSystemMetrics(metrics: InsertSystemMetrics): Promise<SystemMetrics> {
    const [newMetrics] = await db
      .insert(systemMetrics)
      .values(metrics)
      .returning();
    return newMetrics;
  }

  // Agent Communications
  async getRecentAgentCommunications(limit: number): Promise<AgentCommunication[]> {
    return await db.select().from(agentCommunications).orderBy(desc(agentCommunications.timestamp)).limit(limit);
  }

  async getAgentCommunications(agentId: string, limit: number): Promise<AgentCommunication[]> {
    return await db.select().from(agentCommunications)
      .where(eq(agentCommunications.fromAgent, agentId))
      .orderBy(desc(agentCommunications.timestamp))
      .limit(limit);
  }

  async createAgentCommunication(communication: InsertAgentCommunication): Promise<AgentCommunication> {
    const [newCommunication] = await db
      .insert(agentCommunications)
      .values(communication)
      .returning();
    return newCommunication;
  }

  // Performance History
  async getPerformanceHistory(agentId: string, days: number): Promise<PerformanceHistory[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await db.select().from(performanceHistory)
      .where(eq(performanceHistory.agentId, agentId))
      .orderBy(desc(performanceHistory.date));
  }

  async createPerformanceHistory(history: InsertPerformanceHistory): Promise<PerformanceHistory> {
    const [newHistory] = await db
      .insert(performanceHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  // Conflict Predictions
  async getConflictPredictions(): Promise<ConflictPrediction[]> {
    return await db.select().from(conflictPredictions).orderBy(desc(conflictPredictions.createdAt));
  }

  async createConflictPrediction(prediction: InsertConflictPrediction): Promise<ConflictPrediction> {
    const [newPrediction] = await db
      .insert(conflictPredictions)
      .values({
        ...prediction,
        agents: prediction.agents as string[],
        suggestedActions: prediction.suggestedActions as string[]
      })
      .returning();
    return newPrediction;
  }

  async updateConflictPrediction(id: string, prediction: Partial<ConflictPrediction>): Promise<ConflictPrediction> {
    const [updated] = await db
      .update(conflictPredictions)
      .set(prediction)
      .where(eq(conflictPredictions.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Conflict prediction with id ${id} not found`);
    }
    return updated;
  }

  // Agent Workloads
  async getAgentWorkloads(): Promise<AgentWorkload[]> {
    return await db.select().from(agentWorkloads).orderBy(desc(agentWorkloads.lastUpdated));
  }

  async getAgentWorkload(agentId: string): Promise<AgentWorkload | undefined> {
    const [workload] = await db.select().from(agentWorkloads).where(eq(agentWorkloads.agentId, agentId));
    return workload || undefined;
  }

  async createAgentWorkload(workload: InsertAgentWorkload): Promise<AgentWorkload> {
    const [newWorkload] = await db
      .insert(agentWorkloads)
      .values(workload)
      .returning();
    return newWorkload;
  }

  async updateAgentWorkload(agentId: string, workload: Partial<AgentWorkload>): Promise<AgentWorkload> {
    const [updated] = await db
      .update(agentWorkloads)
      .set(workload)
      .where(eq(agentWorkloads.agentId, agentId))
      .returning();
    if (!updated) {
      throw new Error(`Agent workload for ${agentId} not found`);
    }
    return updated;
  }

  // Smart Recommendations
  async getSmartRecommendations(status?: string): Promise<SmartRecommendation[]> {
    if (status) {
      return await db.select().from(smartRecommendations)
        .where(eq(smartRecommendations.status, status))
        .orderBy(desc(smartRecommendations.createdAt));
    }
    return await db.select().from(smartRecommendations).orderBy(desc(smartRecommendations.createdAt));
  }

  async createSmartRecommendation(recommendation: InsertSmartRecommendation): Promise<SmartRecommendation> {
    const [newRecommendation] = await db
      .insert(smartRecommendations)
      .values({
        ...recommendation,
        affectedAgents: recommendation.affectedAgents as string[]
      })
      .returning();
    return newRecommendation;
  }

  async updateSmartRecommendation(id: string, recommendation: Partial<SmartRecommendation>): Promise<SmartRecommendation> {
    const [updated] = await db
      .update(smartRecommendations)
      .set(recommendation)
      .where(eq(smartRecommendations.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Smart recommendation with id ${id} not found`);
    }
    return updated;
  }

  // AI Questions
  async getRecentAiQuestions(limit: number): Promise<AiQuestion[]> {
    return await db.select().from(aiQuestions).orderBy(desc(aiQuestions.askedAt)).limit(limit);
  }

  async getAiQuestionsByCategory(category: string): Promise<AiQuestion[]> {
    return await db.select().from(aiQuestions)
      .where(eq(aiQuestions.category, category))
      .orderBy(desc(aiQuestions.askedAt));
  }

  async createAiQuestion(question: InsertAiQuestion): Promise<AiQuestion> {
    const [newQuestion] = await db
      .insert(aiQuestions)
      .values({
        ...question,
        relatedData: question.relatedData as string[]
      })
      .returning();
    return newQuestion;
  }
}

export const storage = new DatabaseStorage();
