import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(), // "healthy", "conflict", "delayed", "error"
  lastActive: timestamp("last_active").notNull(),
  lastReport: text("last_report"),
  successRate: integer("success_rate").notNull().default(0),
  strategicAlignment: integer("strategic_alignment").notNull().default(0),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const conflicts = pgTable("conflicts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  area: text("area").notNull(),
  agents: json("agents").$type<string[]>().notNull(),
  positions: json("positions").$type<Record<string, string>>().notNull(),
  status: text("status").notNull().default("active"), // "active", "resolved", "escalated"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
});

export const strategicObjectives = pgTable("strategic_objectives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  progress: integer("progress").notNull().default(0),
  contributingAgents: json("contributing_agents").$type<string[]>().notNull(),
  lastUpdate: timestamp("last_update").defaultNow().notNull(),
  quarter: text("quarter").notNull(),
});

export const weeklyReports = pgTable("weekly_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  period: text("period").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  overallScore: integer("overall_score").notNull(),
  grade: text("grade").notNull(),
  agentStatuses: json("agent_statuses").$type<Record<string, string>>().notNull(),
  conflictsDetected: integer("conflicts_detected").notNull(),
  conflictsResolved: integer("conflicts_resolved").notNull(),
  strategicAlignment: json("strategic_alignment").$type<Record<string, string[]>>().notNull(),
  recommendations: json("recommendations").$type<string[]>().notNull(),
  highlights: json("highlights").$type<string[]>().notNull(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  systemHealth: integer("system_health").notNull(),
  activeAgents: integer("active_agents").notNull(),
  totalAgents: integer("total_agents").notNull(),
  activeConflicts: integer("active_conflicts").notNull(),
  strategicAlignmentScore: integer("strategic_alignment_score").notNull(),
});

// New tables for enhanced features
export const agentCommunications = pgTable("agent_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAgent: text("from_agent").notNull(),
  toAgent: text("to_agent"),
  action: text("action").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").notNull(), // "decision", "collaboration", "update", "conflict"
  relatedObjective: text("related_objective"),
});

export const performanceHistory = pgTable("performance_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: text("agent_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  successRate: integer("success_rate").notNull(),
  tasksCompleted: integer("tasks_completed").notNull(),
  strategicAlignment: integer("strategic_alignment").notNull(),
  collaborationScore: integer("collaboration_score").notNull(),
  responseTime: integer("response_time").notNull(), // in minutes
});

export const conflictPredictions = pgTable("conflict_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agents: json("agents").$type<string[]>().notNull(),
  riskScore: integer("risk_score").notNull(), // 0-100
  area: text("area").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("active"), // "active", "materialized", "resolved"
  suggestedActions: json("suggested_actions").$type<string[]>().notNull(),
});

export const agentWorkloads = pgTable("agent_workloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: text("agent_id").notNull(),
  currentTasks: integer("current_tasks").notNull(),
  capacity: integer("capacity").notNull(),
  utilizationRate: integer("utilization_rate").notNull(), // percentage
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  priority: text("priority").notNull(), // "low", "medium", "high", "critical"
});

export const smartRecommendations = pgTable("smart_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "optimization", "resource", "strategic", "conflict"
  title: text("title").notNull(),
  description: text("description").notNull(),
  impact: text("impact").notNull(), // "low", "medium", "high"
  effort: text("effort").notNull(), // "low", "medium", "high"
  affectedAgents: json("affected_agents").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"), // "pending", "implemented", "dismissed"
});

export const insertAgentSchema = createInsertSchema(agents);
export const insertConflictSchema = createInsertSchema(conflicts).omit({ id: true, createdAt: true });
export const insertStrategicObjectiveSchema = createInsertSchema(strategicObjectives).omit({ id: true, lastUpdate: true });
export const insertWeeklyReportSchema = createInsertSchema(weeklyReports).omit({ id: true, generatedAt: true });
export const insertSystemMetricsSchema = createInsertSchema(systemMetrics).omit({ id: true, timestamp: true });

// New schemas for enhanced features
export const insertAgentCommunicationSchema = createInsertSchema(agentCommunications).omit({ id: true, timestamp: true });
export const insertPerformanceHistorySchema = createInsertSchema(performanceHistory).omit({ id: true, date: true });
export const insertConflictPredictionSchema = createInsertSchema(conflictPredictions).omit({ id: true, createdAt: true });
export const insertAgentWorkloadSchema = createInsertSchema(agentWorkloads).omit({ id: true, lastUpdated: true });
export const insertSmartRecommendationSchema = createInsertSchema(smartRecommendations).omit({ id: true, createdAt: true });

export const aiQuestions = pgTable("ai_questions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  context: text("context"), // relevant context like agent names, objectives, etc.
  response: text("response").notNull(),
  confidence: integer("confidence").notNull(), // 1-100
  relatedData: text("related_data").array(), // IDs of related entities
  category: text("category").notNull(), // 'agent_status', 'conflicts', 'performance', 'strategy', 'general'
  askedAt: timestamp("asked_at").defaultNow().notNull()
});

export const insertAiQuestionSchema = createInsertSchema(aiQuestions).omit({ id: true, askedAt: true });

// Chief of Staff Core Functions Tables

// 1. High-Level Goals (User Input)
export const businessGoals = pgTable("business_goals", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetValue: text("target_value").notNull(), // e.g., "$100,000", "30 signups", "2 partners"
  currentValue: text("current_value").notNull().default("0"),
  deadline: timestamp("deadline").notNull(),
  priority: text("priority").notNull().default("medium"), // 'high', 'medium', 'low'
  status: text("status").notNull().default("active"), // 'active', 'completed', 'paused'
  category: text("category").notNull(), // 'revenue', 'growth', 'partnerships', 'operations'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 2. Real-time Business Data (Agent Inputs)
export const businessMetrics = pgTable("business_metrics", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceAgent: text("source_agent").notNull(), // 'cro', 'cfo', 'coo', 'cco'
  metricType: text("metric_type").notNull(), // 'leads', 'trials', 'revenue', 'capacity', 'compliance'
  metricName: text("metric_name").notNull(),
  value: text("value").notNull(),
  unit: text("unit").notNull(), // 'count', 'dollars', 'percentage', 'hours'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  goalId: text("goal_id").references(() => businessGoals.id),
  metadata: text("metadata") // JSON string for additional context
});

// 3. Prioritized Initiatives (Analysis Output)
export const initiatives = pgTable("initiatives", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  goalId: text("goal_id").references(() => businessGoals.id).notNull(),
  impactScore: integer("impact_score").notNull(), // 1-100
  effortScore: integer("effort_score").notNull(), // 1-100
  priorityRank: integer("priority_rank").notNull(),
  estimatedImpact: text("estimated_impact").notNull(),
  requiredResources: text("required_resources").array().notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'active', 'completed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 4. Agent Directives (Delegation Output)
export const agentDirectives = pgTable("agent_directives", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  initiativeId: text("initiative_id").references(() => initiatives.id).notNull(),
  targetAgent: text("target_agent").notNull(), // 'cro', 'cfo', 'coo', 'cco'
  action: text("action").notNull(),
  goal: text("goal").notNull(),
  deadline: timestamp("deadline").notNull(),
  priority: text("priority").notNull(), // 'p1', 'p2', 'p3'
  status: text("status").notNull().default("assigned"), // 'assigned', 'in_progress', 'completed', 'blocked'
  result: text("result"), // outcome or status update
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});

// 5. Strategic Briefs (Weekly Reports)
export const strategicBriefs = pgTable("strategic_briefs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  weekOf: timestamp("week_of").notNull(),
  executiveSummary: text("executive_summary").notNull(),
  goalProgress: text("goal_progress").notNull(), // JSON string of goal statuses
  topPriorities: text("top_priorities").array().notNull(),
  keyInsights: text("key_insights").array().notNull(),
  nextWeekFocus: text("next_week_focus").notNull(),
  riskFactors: text("risk_factors").array(),
  generatedAt: timestamp("generated_at").defaultNow().notNull()
});

// Chief of Staff Insert Schemas
export const insertBusinessGoalSchema = createInsertSchema(businessGoals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBusinessMetricSchema = createInsertSchema(businessMetrics).omit({ id: true, timestamp: true });
export const insertInitiativeSchema = createInsertSchema(initiatives).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgentDirectiveSchema = createInsertSchema(agentDirectives).omit({ id: true, createdAt: true });
export const insertStrategicBriefSchema = createInsertSchema(strategicBriefs).omit({ id: true, generatedAt: true });

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Conflict = typeof conflicts.$inferSelect;
export type InsertConflict = z.infer<typeof insertConflictSchema>;
export type StrategicObjective = typeof strategicObjectives.$inferSelect;
export type InsertStrategicObjective = z.infer<typeof insertStrategicObjectiveSchema>;
export type WeeklyReport = typeof weeklyReports.$inferSelect;
export type InsertWeeklyReport = z.infer<typeof insertWeeklyReportSchema>;
export type SystemMetrics = typeof systemMetrics.$inferSelect;
export type InsertSystemMetrics = z.infer<typeof insertSystemMetricsSchema>;

// New types for enhanced features
export type AgentCommunication = typeof agentCommunications.$inferSelect;
export type InsertAgentCommunication = z.infer<typeof insertAgentCommunicationSchema>;
export type PerformanceHistory = typeof performanceHistory.$inferSelect;
export type InsertPerformanceHistory = z.infer<typeof insertPerformanceHistorySchema>;
export type ConflictPrediction = typeof conflictPredictions.$inferSelect;
export type InsertConflictPrediction = z.infer<typeof insertConflictPredictionSchema>;
export type AgentWorkload = typeof agentWorkloads.$inferSelect;
export type InsertAgentWorkload = z.infer<typeof insertAgentWorkloadSchema>;
export type SmartRecommendation = typeof smartRecommendations.$inferSelect;
export type InsertSmartRecommendation = z.infer<typeof insertSmartRecommendationSchema>;
export type AiQuestion = typeof aiQuestions.$inferSelect;
export type InsertAiQuestion = z.infer<typeof insertAiQuestionSchema>;

// Chief of Staff Types
export type BusinessGoal = typeof businessGoals.$inferSelect;
export type InsertBusinessGoal = z.infer<typeof insertBusinessGoalSchema>;
export type BusinessMetric = typeof businessMetrics.$inferSelect;
export type InsertBusinessMetric = z.infer<typeof insertBusinessMetricSchema>;
export type Initiative = typeof initiatives.$inferSelect;
export type InsertInitiative = z.infer<typeof insertInitiativeSchema>;
export type AgentDirective = typeof agentDirectives.$inferSelect;
export type InsertAgentDirective = z.infer<typeof insertAgentDirectiveSchema>;
export type StrategicBrief = typeof strategicBriefs.$inferSelect;
export type InsertStrategicBrief = z.infer<typeof insertStrategicBriefSchema>;
