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
  type BusinessGoal,
  type InsertBusinessGoal,
  type BusinessMetric,
  type InsertBusinessMetric,
  type Initiative,
  type InsertInitiative,
  type AgentDirective,
  type InsertAgentDirective,
  type StrategicBrief,
  type InsertStrategicBrief,
  type CampaignBrief,
  type InsertCampaignBrief,
  type BrandAsset,
  type InsertBrandAsset,
  type ContentAsset,
  type InsertContentAsset,
  type MarketSignal,
  type InsertMarketSignal,
  type StrategicPlan,
  type InsertStrategicPlan,
  type Partner,
  type InsertPartner,
  type Project,
  type InsertProject,
  type AbTest,
  type InsertAbTest,
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
  aiQuestions,
  businessGoals,
  businessMetrics,
  initiatives,
  agentDirectives,
  strategicBriefs,
  campaignBriefs,
  brandAssets,
  contentAssets,
  marketSignals,
  strategicPlans,
  partners,
  projects,
  abTests
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

  // Chief of Staff Storage Methods
  createBusinessGoal(goal: InsertBusinessGoal): Promise<BusinessGoal>;
  getBusinessGoals(): Promise<BusinessGoal[]>;
  getBusinessGoal(id: string): Promise<BusinessGoal | undefined>;
  updateBusinessGoal(id: string, updates: Partial<InsertBusinessGoal>): Promise<BusinessGoal | undefined>;
  
  createBusinessMetric(metric: InsertBusinessMetric): Promise<BusinessMetric>;
  getRecentBusinessMetrics(limit: number): Promise<BusinessMetric[]>;
  getBusinessMetricsForGoal(goalId: string): Promise<BusinessMetric[]>;
  
  createInitiative(initiative: InsertInitiative): Promise<Initiative>;
  getActiveInitiatives(): Promise<Initiative[]>;
  getInitiative(id: string): Promise<Initiative | undefined>;
  updateInitiative(id: string, updates: Partial<InsertInitiative>): Promise<Initiative | undefined>;
  
  createAgentDirective(directive: InsertAgentDirective): Promise<AgentDirective>;
  getActiveDirectives(): Promise<AgentDirective[]>;
  getDirectivesForAgent(agentId: string): Promise<AgentDirective[]>;
  updateDirective(id: string, updates: Partial<InsertAgentDirective>): Promise<AgentDirective | undefined>;
  
  createStrategicBrief(brief: InsertStrategicBrief): Promise<StrategicBrief>;
  getLatestStrategicBrief(): Promise<StrategicBrief | undefined>;
  getStrategicBriefs(): Promise<StrategicBrief[]>;

  // Content Manager Storage Methods
  createCampaignBrief(brief: InsertCampaignBrief): Promise<CampaignBrief>;
  getCampaignBriefs(): Promise<CampaignBrief[]>;
  getCampaignBrief(id: string): Promise<CampaignBrief | undefined>;
  updateCampaignBrief(id: string, updates: Partial<InsertCampaignBrief>): Promise<CampaignBrief | undefined>;
  
  createBrandAsset(asset: InsertBrandAsset): Promise<BrandAsset>;
  getBrandAssets(type?: string): Promise<BrandAsset[]>;
  getBrandAsset(id: string): Promise<BrandAsset | undefined>;
  updateBrandAsset(id: string, updates: Partial<InsertBrandAsset>): Promise<BrandAsset | undefined>;
  
  createContentAsset(asset: InsertContentAsset): Promise<ContentAsset>;
  getContentAssets(briefId?: string): Promise<ContentAsset[]>;
  getContentAsset(id: string): Promise<ContentAsset | undefined>;
  updateContentAsset(id: string, updates: Partial<InsertContentAsset>): Promise<ContentAsset | undefined>;

  // Market Intelligence
  createMarketSignal(signal: InsertMarketSignal): Promise<MarketSignal>;
  getMarketSignals(): Promise<MarketSignal[]>;
  getMarketSignalsByImpact(impact: string): Promise<MarketSignal[]>;
  getMarketSignalsByCategory(category: string): Promise<MarketSignal[]>;
  updateMarketSignal(id: string, updates: Partial<MarketSignal>): Promise<MarketSignal>;

  // Strategic Plans
  createStrategicPlan(plan: InsertStrategicPlan): Promise<StrategicPlan>;
  getStrategicPlans(): Promise<StrategicPlan[]>;
  getActiveStrategicPlans(): Promise<StrategicPlan[]>;
  updateStrategicPlan(id: string, updates: Partial<StrategicPlan>): Promise<StrategicPlan>;

  // Partners
  createPartner(partner: InsertPartner): Promise<Partner>;
  getPartners(): Promise<Partner[]>;
  getAvailablePartners(): Promise<Partner[]>;
  getPartnersBySkills(skills: string[]): Promise<Partner[]>;
  updatePartner(id: string, updates: Partial<Partner>): Promise<Partner>;

  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProjects(): Promise<Project[]>;
  getProjectsByStatus(status: string): Promise<Project[]>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;

  // A/B Tests
  createAbTest(test: InsertAbTest): Promise<AbTest>;
  getAbTests(): Promise<AbTest[]>;
  getActiveAbTests(): Promise<AbTest[]>;
  updateAbTest(id: string, updates: Partial<AbTest>): Promise<AbTest>;
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
        name: "Content Manager",
        status: "healthy",
        lastActive: new Date(Date.now() - 10 * 60 * 1000),
        lastReport: "Content Strategy Brief",
        successRate: 92,
        strategicAlignment: 85,
        icon: "fas fa-pen-fancy",
        color: "bg-teal-600"
      },
      {
        id: "cco",
        name: "CCO Agent",
        status: "healthy",
        lastActive: new Date(Date.now() - 7 * 60 * 1000),
        lastReport: "Customer Success Review",
        successRate: 95,
        strategicAlignment: 88,
        icon: "fas fa-users",
        color: "bg-blue-600"
      },
      {
        id: "chief-of-staff",
        name: "Chief of Staff",
        status: "healthy",
        lastActive: new Date(Date.now() - 2 * 60 * 1000),
        lastReport: "Strategic Coordination",
        successRate: 98,
        strategicAlignment: 95,
        icon: "fas fa-chess-king",
        color: "bg-gray-800"
      },
      {
        id: "market-intelligence",
        name: "Market Intelligence Agent",
        status: "healthy",
        lastActive: new Date(Date.now() - 15 * 60 * 1000),
        lastReport: "Market Analysis Update",
        successRate: 93,
        strategicAlignment: 87,
        icon: "fas fa-chart-bar",
        color: "bg-orange-600"
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

    await db.insert(conflicts).values(defaultConflicts);

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
        contributingAgents: ["coo", "content"],
        quarter: "Q3 2025"
      },
      {
        title: "Expand Content Marketing Reach by 40%",
        progress: 45,
        contributingAgents: ["cmo", "content"],
        quarter: "Q3 2025"
      }
    ];

    await db.insert(strategicObjectives).values(defaultObjectives);

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

  // =====================================
  // CHIEF OF STAFF STORAGE IMPLEMENTATIONS
  // =====================================

  // Business Goals
  async createBusinessGoal(goal: InsertBusinessGoal): Promise<BusinessGoal> {
    const [result] = await db.insert(businessGoals).values(goal).returning();
    return result;
  }

  async getBusinessGoals(): Promise<BusinessGoal[]> {
    return await db.select().from(businessGoals).orderBy(desc(businessGoals.createdAt));
  }

  async getBusinessGoal(id: string): Promise<BusinessGoal | undefined> {
    const [result] = await db.select().from(businessGoals).where(eq(businessGoals.id, id));
    return result;
  }

  async updateBusinessGoal(id: string, updates: Partial<InsertBusinessGoal>): Promise<BusinessGoal | undefined> {
    const [result] = await db.update(businessGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businessGoals.id, id))
      .returning();
    return result;
  }

  // Business Metrics
  async createBusinessMetric(metric: InsertBusinessMetric): Promise<BusinessMetric> {
    const [result] = await db.insert(businessMetrics).values(metric).returning();
    return result;
  }

  async getRecentBusinessMetrics(limit: number): Promise<BusinessMetric[]> {
    return await db.select().from(businessMetrics)
      .orderBy(desc(businessMetrics.timestamp))
      .limit(limit);
  }

  async getBusinessMetricsForGoal(goalId: string): Promise<BusinessMetric[]> {
    return await db.select().from(businessMetrics)
      .where(eq(businessMetrics.goalId, goalId))
      .orderBy(desc(businessMetrics.timestamp));
  }

  // Initiatives
  async createInitiative(initiative: InsertInitiative): Promise<Initiative> {
    const [result] = await db.insert(initiatives).values(initiative).returning();
    return result;
  }

  async getActiveInitiatives(): Promise<Initiative[]> {
    return await db.select().from(initiatives)
      .where(eq(initiatives.status, 'active'))
      .orderBy(initiatives.priorityRank);
  }

  async getInitiative(id: string): Promise<Initiative | undefined> {
    const [result] = await db.select().from(initiatives).where(eq(initiatives.id, id));
    return result;
  }

  async updateInitiative(id: string, updates: Partial<InsertInitiative>): Promise<Initiative | undefined> {
    const [result] = await db.update(initiatives)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(initiatives.id, id))
      .returning();
    return result;
  }

  // Agent Directives
  async createAgentDirective(directive: InsertAgentDirective): Promise<AgentDirective> {
    const [result] = await db.insert(agentDirectives).values(directive).returning();
    return result;
  }

  async getActiveDirectives(): Promise<AgentDirective[]> {
    return await db.select().from(agentDirectives)
      .where(eq(agentDirectives.status, 'assigned'))
      .orderBy(agentDirectives.priority);
  }

  async getDirectivesForAgent(agentId: string): Promise<AgentDirective[]> {
    return await db.select().from(agentDirectives)
      .where(eq(agentDirectives.targetAgent, agentId))
      .orderBy(desc(agentDirectives.createdAt));
  }

  async updateDirective(id: string, updates: Partial<InsertAgentDirective>): Promise<AgentDirective | undefined> {
    const [result] = await db.update(agentDirectives)
      .set(updates)
      .where(eq(agentDirectives.id, id))
      .returning();
    return result;
  }

  // Strategic Briefs
  async createStrategicBrief(brief: InsertStrategicBrief): Promise<StrategicBrief> {
    const [result] = await db.insert(strategicBriefs).values(brief).returning();
    return result;
  }

  async getLatestStrategicBrief(): Promise<StrategicBrief | undefined> {
    const [result] = await db.select().from(strategicBriefs)
      .orderBy(desc(strategicBriefs.generatedAt))
      .limit(1);
    return result;
  }

  async getStrategicBriefs(): Promise<StrategicBrief[]> {
    return await db.select().from(strategicBriefs)
      .orderBy(desc(strategicBriefs.generatedAt));
  }

  // Content Manager Implementation
  async createCampaignBrief(brief: InsertCampaignBrief): Promise<CampaignBrief> {
    const [result] = await db.insert(campaignBriefs).values(brief).returning();
    return result;
  }

  async getCampaignBriefs(): Promise<CampaignBrief[]> {
    return await db.select().from(campaignBriefs)
      .orderBy(desc(campaignBriefs.createdAt));
  }

  async getCampaignBrief(id: string): Promise<CampaignBrief | undefined> {
    const [result] = await db.select().from(campaignBriefs)
      .where(eq(campaignBriefs.id, id));
    return result;
  }

  async updateCampaignBrief(id: string, updates: Partial<InsertCampaignBrief>): Promise<CampaignBrief | undefined> {
    const [result] = await db.update(campaignBriefs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaignBriefs.id, id))
      .returning();
    return result;
  }

  async createBrandAsset(asset: InsertBrandAsset): Promise<BrandAsset> {
    const [result] = await db.insert(brandAssets).values(asset).returning();
    return result;
  }

  async getBrandAssets(type?: string): Promise<BrandAsset[]> {
    if (type) {
      return await db.select().from(brandAssets)
        .where(eq(brandAssets.type, type))
        .orderBy(desc(brandAssets.createdAt));
    }
    return await db.select().from(brandAssets)
      .orderBy(desc(brandAssets.createdAt));
  }

  async getBrandAsset(id: string): Promise<BrandAsset | undefined> {
    const [result] = await db.select().from(brandAssets)
      .where(eq(brandAssets.id, id));
    return result;
  }

  async updateBrandAsset(id: string, updates: Partial<InsertBrandAsset>): Promise<BrandAsset | undefined> {
    const [result] = await db.update(brandAssets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(brandAssets.id, id))
      .returning();
    return result;
  }

  async createContentAsset(asset: InsertContentAsset): Promise<ContentAsset> {
    const [result] = await db.insert(contentAssets).values(asset).returning();
    return result;
  }

  async getContentAssets(briefId?: string): Promise<ContentAsset[]> {
    if (briefId) {
      return await db.select().from(contentAssets)
        .where(eq(contentAssets.briefId, briefId))
        .orderBy(desc(contentAssets.createdAt));
    }
    return await db.select().from(contentAssets)
      .orderBy(desc(contentAssets.createdAt));
  }

  async getContentAsset(id: string): Promise<ContentAsset | undefined> {
    const [result] = await db.select().from(contentAssets)
      .where(eq(contentAssets.id, id));
    return result;
  }

  async updateContentAsset(id: string, updates: Partial<InsertContentAsset>): Promise<ContentAsset | undefined> {
    const [result] = await db.update(contentAssets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentAssets.id, id))
      .returning();
    return result;
  }

  // Market Intelligence Methods
  async createMarketSignal(signal: InsertMarketSignal): Promise<MarketSignal> {
    const [result] = await db.insert(marketSignals).values(signal).returning();
    return result;
  }

  async getMarketSignals(): Promise<MarketSignal[]> {
    return await db.select().from(marketSignals)
      .orderBy(desc(marketSignals.flaggedAt));
  }

  async getMarketSignalsByImpact(impact: string): Promise<MarketSignal[]> {
    return await db.select().from(marketSignals)
      .where(eq(marketSignals.impact, impact))
      .orderBy(desc(marketSignals.flaggedAt));
  }

  async getMarketSignalsByCategory(category: string): Promise<MarketSignal[]> {
    return await db.select().from(marketSignals)
      .where(eq(marketSignals.category, category))
      .orderBy(desc(marketSignals.flaggedAt));
  }

  async updateMarketSignal(id: string, updates: Partial<MarketSignal>): Promise<MarketSignal> {
    const [result] = await db.update(marketSignals)
      .set(updates)
      .where(eq(marketSignals.id, id))
      .returning();
    return result;
  }

  // Strategic Plans Methods
  async createStrategicPlan(plan: InsertStrategicPlan): Promise<StrategicPlan> {
    const [result] = await db.insert(strategicPlans).values(plan).returning();
    return result;
  }

  async getStrategicPlans(): Promise<StrategicPlan[]> {
    return await db.select().from(strategicPlans)
      .orderBy(desc(strategicPlans.createdAt));
  }

  async getActiveStrategicPlans(): Promise<StrategicPlan[]> {
    return await db.select().from(strategicPlans)
      .where(eq(strategicPlans.status, 'active'))
      .orderBy(desc(strategicPlans.createdAt));
  }

  async updateStrategicPlan(id: string, updates: Partial<StrategicPlan>): Promise<StrategicPlan> {
    const [result] = await db.update(strategicPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(strategicPlans.id, id))
      .returning();
    return result;
  }

  // Partners Methods
  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [result] = await db.insert(partners).values(partner).returning();
    return result;
  }

  async getPartners(): Promise<Partner[]> {
    return await db.select().from(partners)
      .where(eq(partners.isActive, true))
      .orderBy(desc(partners.joinedAt));
  }

  async getAvailablePartners(): Promise<Partner[]> {
    return await db.select().from(partners)
      .where(eq(partners.availability, 'available'))
      .orderBy(desc(partners.performanceRating));
  }

  async getPartnersBySkills(skills: string[]): Promise<Partner[]> {
    // Simplified skill matching - in production would use more sophisticated querying
    return await db.select().from(partners)
      .where(eq(partners.isActive, true))
      .orderBy(desc(partners.performanceRating));
  }

  async updatePartner(id: string, updates: Partial<Partner>): Promise<Partner> {
    const [result] = await db.update(partners)
      .set(updates)
      .where(eq(partners.id, id))
      .returning();
    return result;
  }

  // Projects Methods
  async createProject(project: InsertProject): Promise<Project> {
    const [result] = await db.insert(projects).values(project).returning();
    return result;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects)
      .orderBy(desc(projects.createdAt));
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.status, status))
      .orderBy(desc(projects.createdAt));
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const [result] = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return result;
  }

  // A/B Tests Methods
  async createAbTest(test: InsertAbTest): Promise<AbTest> {
    const [result] = await db.insert(abTests).values(test).returning();
    return result;
  }

  async getAbTests(): Promise<AbTest[]> {
    return await db.select().from(abTests)
      .orderBy(desc(abTests.createdAt));
  }

  async getActiveAbTests(): Promise<AbTest[]> {
    return await db.select().from(abTests)
      .where(eq(abTests.status, 'running'))
      .orderBy(desc(abTests.createdAt));
  }

  async updateAbTest(id: string, updates: Partial<AbTest>): Promise<AbTest> {
    const [result] = await db.update(abTests)
      .set(updates)
      .where(eq(abTests.id, id))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
