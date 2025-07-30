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
  type InsertSystemMetrics
} from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private agents: Map<string, Agent> = new Map();
  private conflicts: Map<string, Conflict> = new Map();
  private strategicObjectives: Map<string, StrategicObjective> = new Map();
  private weeklyReports: Map<string, WeeklyReport> = new Map();
  private systemMetrics: SystemMetrics[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize default agents
    const defaultAgents: Agent[] = [
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

    defaultAgents.forEach(agent => this.agents.set(agent.id, agent));

    // Initialize default conflicts
    const defaultConflicts: Conflict[] = [
      {
        id: randomUUID(),
        title: "Pricing Strategy Conflict - Tier 2",
        area: "Pricing Tier 2",
        agents: ["cro", "cmo"],
        positions: {
          "cro": "Increase Tier 2 pricing by 15% to improve margins",
          "cmo": "Price sensitivity analysis suggests maintaining current pricing"
        },
        status: "active",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resolvedAt: null,
        resolution: null
      },
      {
        id: randomUUID(),
        title: "Resource Allocation Dispute",
        area: "Budget Allocation",
        agents: ["coo", "content"],
        positions: {
          "coo": "Allocate 60% of Q3 budget to compliance automation",
          "content": "Requires 40% budget allocation for content strategy expansion"
        },
        status: "active",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        resolvedAt: null,
        resolution: null
      }
    ];

    defaultConflicts.forEach(conflict => this.conflicts.set(conflict.id, conflict));

    // Initialize strategic objectives
    const defaultObjectives: StrategicObjective[] = [
      {
        id: randomUUID(),
        title: "Increase Tier 3 MRR by 20%",
        progress: 78,
        contributingAgents: ["ceo", "cro"],
        lastUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        quarter: "Q3 2025"
      },
      {
        id: randomUUID(),
        title: "Improve Customer Retention by 15%",
        progress: 65,
        contributingAgents: ["coo", "content", "lexi"],
        lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        quarter: "Q3 2025"
      },
      {
        id: randomUUID(),
        title: "Expand Content Marketing Reach by 40%",
        progress: 45,
        contributingAgents: ["cmo", "content"],
        lastUpdate: new Date(Date.now() - 3 * 60 * 60 * 1000),
        quarter: "Q3 2025"
      }
    ];

    defaultObjectives.forEach(objective => this.strategicObjectives.set(objective.id, objective));

    // Initialize system metrics
    this.systemMetrics.push({
      id: randomUUID(),
      timestamp: new Date(),
      systemHealth: 92,
      activeAgents: 6,
      totalAgents: 6,
      activeConflicts: 2,
      strategicAlignmentScore: 85
    });
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const newAgent: Agent = {
      ...agent,
      lastActive: new Date()
    };
    this.agents.set(agent.id, newAgent);
    return newAgent;
  }

  async updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
    const existing = this.agents.get(id);
    if (!existing) {
      throw new Error(`Agent with id ${id} not found`);
    }
    const updated = { ...existing, ...agent };
    this.agents.set(id, updated);
    return updated;
  }

  // Conflicts
  async getConflicts(): Promise<Conflict[]> {
    return Array.from(this.conflicts.values());
  }

  async getActiveConflicts(): Promise<Conflict[]> {
    return Array.from(this.conflicts.values()).filter(c => c.status === "active");
  }

  async getConflict(id: string): Promise<Conflict | undefined> {
    return this.conflicts.get(id);
  }

  async createConflict(conflict: InsertConflict): Promise<Conflict> {
    const id = randomUUID();
    const newConflict: Conflict = {
      id,
      ...conflict,
      createdAt: new Date(),
      resolvedAt: null,
      resolution: null
    };
    this.conflicts.set(id, newConflict);
    return newConflict;
  }

  async updateConflict(id: string, conflict: Partial<Conflict>): Promise<Conflict> {
    const existing = this.conflicts.get(id);
    if (!existing) {
      throw new Error(`Conflict with id ${id} not found`);
    }
    const updated = { ...existing, ...conflict };
    this.conflicts.set(id, updated);
    return updated;
  }

  // Strategic Objectives
  async getStrategicObjectives(): Promise<StrategicObjective[]> {
    return Array.from(this.strategicObjectives.values());
  }

  async getStrategicObjective(id: string): Promise<StrategicObjective | undefined> {
    return this.strategicObjectives.get(id);
  }

  async createStrategicObjective(objective: InsertStrategicObjective): Promise<StrategicObjective> {
    const id = randomUUID();
    const newObjective: StrategicObjective = {
      id,
      ...objective,
      lastUpdate: new Date()
    };
    this.strategicObjectives.set(id, newObjective);
    return newObjective;
  }

  async updateStrategicObjective(id: string, objective: Partial<StrategicObjective>): Promise<StrategicObjective> {
    const existing = this.strategicObjectives.get(id);
    if (!existing) {
      throw new Error(`Strategic objective with id ${id} not found`);
    }
    const updated = { ...existing, ...objective };
    this.strategicObjectives.set(id, updated);
    return updated;
  }

  // Weekly Reports
  async getWeeklyReports(): Promise<WeeklyReport[]> {
    return Array.from(this.weeklyReports.values()).sort((a, b) => 
      b.generatedAt.getTime() - a.generatedAt.getTime()
    );
  }

  async getWeeklyReport(id: string): Promise<WeeklyReport | undefined> {
    return this.weeklyReports.get(id);
  }

  async createWeeklyReport(report: InsertWeeklyReport): Promise<WeeklyReport> {
    const id = randomUUID();
    const newReport: WeeklyReport = {
      id,
      ...report,
      generatedAt: new Date()
    };
    this.weeklyReports.set(id, newReport);
    return newReport;
  }

  // System Metrics
  async getLatestSystemMetrics(): Promise<SystemMetrics | undefined> {
    return this.systemMetrics[this.systemMetrics.length - 1];
  }

  async createSystemMetrics(metrics: InsertSystemMetrics): Promise<SystemMetrics> {
    const newMetrics: SystemMetrics = {
      id: randomUUID(),
      ...metrics,
      timestamp: new Date()
    };
    this.systemMetrics.push(newMetrics);
    return newMetrics;
  }
}

export const storage = new MemStorage();
