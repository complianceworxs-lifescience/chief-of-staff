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
  directiveId: text("directive_id"), // Link conflicts to specific directives
  riskScore: integer("risk_score").default(0),
  impactScore: integer("impact_score").default(0),
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
  // New fields for hybrid polling/event-driven architecture
  operations: json("operations").$type<{
    mttr_minutes: number;
    auto_resolve_pct: number;
  }>().notNull(),
  agentBlockers: json("agent_blockers").$type<Record<string, {
    status: string;
    blockers: Array<{ type: "awaiting webhook" | "poll-detected" | "processing" | "none"; description: string; }>;
  }>>().notNull(),
  topFixes: json("top_fixes").$type<Array<{
    priority: number;
    action: string;
    type: "webhook" | "polling" | "configuration" | "monitoring";
    impact: "high" | "medium" | "low";
    agent?: string;
  }>>().notNull(),
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
// Enhanced Directive Conflicts with governance rules
export const directiveConflicts = pgTable("directive_conflicts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  directiveId: text("directive_id").notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  status: text("status").notNull().default("auto_resolved"), // "auto_resolved", "needs_intervention", "intervened", "dismissed"
  
  // Agent information
  primaryAgent: text("primary_agent").notNull(), // e.g., "CRO"
  counterpartyAgent: text("counterparty_agent").notNull(), // e.g., "CMO"  
  otherAgents: json("other_agents").$type<string[]>().default([]),
  
  // Conflict details
  category: text("category").notNull(), // "revenue", "compliance", "strategy", "timeline", "resourcing", "brand", "data_quality", "other"
  trigger: text("trigger").notNull(), // short cause phrase
  
  // Metrics
  impactScore: integer("impact_score").default(0), // 0-100
  effortScore: integer("effort_score").default(0), // 0-100
  revenueRiskUsd: integer("revenue_risk_usd").default(0),
  complianceRiskLevel: text("compliance_risk_level").default("none"), // "none", "low", "medium", "high", "critical"
  
  // Governance decision
  governanceRuleId: text("governance_rule_id"), // "CRO_over_brand", "CCO_over_speed", "CEO_over_scope", "COO_over_method", "tie_breaker"
  governanceReason: text("governance_reason"),
  
  // Decision outcome
  winner: text("winner").notNull(),
  action: text("action").notNull(),
  nextSteps: json("next_steps").$type<string[]>().default([]),
  
  // Summary and notes
  summary: text("summary").notNull(), // 1-2 lines for card display
  notes: text("notes"),
  
  // Intercede functionality
  interceptEnabled: boolean("intercept_enabled").default(false),
  interceptReason: text("intercept_reason"),
  interceptActionId: text("intercept_action_id")
});

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
export const insertDirectiveConflictSchema = createInsertSchema(directiveConflicts).omit({ id: true, detectedAt: true });

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

// 6. Content Synthesis & Generation Agent (CSGA) Tables
export const campaignBriefs = pgTable("campaign_briefs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  objective: text("objective").notNull(), // "Generate 30 trial signups"
  targetPersona: text("target_persona").notNull(), // "Validation Strategist"
  coreMessage: text("core_message").notNull(),
  painPoints: text("pain_points").array().notNull(),
  valueProposition: text("value_proposition").notNull(),
  targetChannels: text("target_channels").array().notNull(), // ["LinkedIn", "Email"]
  briefingAgent: text("briefing_agent").notNull(), // "chief-of-staff"
  assignedAgent: text("assigned_agent").notNull().default("content"), // Content Manager
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const brandAssets = pgTable("brand_assets", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'voice_tone', 'product_info', 'case_study', 'proof_point'
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"), // 'agents', 'compliance', 'automation'
  tags: text("tags").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const contentAssets = pgTable("content_assets", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  briefId: text("brief_id").references(() => campaignBriefs.id).notNull(),
  type: text("type").notNull(), // 'social_post', 'email_sequence', 'ad_copy', 'landing_page', 'blog_outline'
  channel: text("channel"), // 'linkedin', 'email', 'paid_ads', 'website'
  title: text("title").notNull(),
  content: text("content").notNull(),
  visualSuggestions: text("visual_suggestions").array(),
  variations: json("variations").$type<string[]>().default([]),
  status: text("status").notNull().default("draft"), // 'draft', 'review', 'approved', 'published'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Chief of Staff Insert Schemas
export const insertBusinessGoalSchema = createInsertSchema(businessGoals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBusinessMetricSchema = createInsertSchema(businessMetrics).omit({ id: true, timestamp: true });
export const insertInitiativeSchema = createInsertSchema(initiatives).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgentDirectiveSchema = createInsertSchema(agentDirectives).omit({ id: true, createdAt: true });
export const insertStrategicBriefSchema = createInsertSchema(strategicBriefs).omit({ id: true, generatedAt: true });

// Content Manager Insert Schemas
export const insertCampaignBriefSchema = createInsertSchema(campaignBriefs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBrandAssetSchema = createInsertSchema(brandAssets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContentAssetSchema = createInsertSchema(contentAssets).omit({ id: true, createdAt: true, updatedAt: true });

// New tables for autonomous governance system
export const rulesOfEngagement = pgTable("rules_of_engagement", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "financial", "autonomy", "conflict", "human_loop", "performance"
  rules: json("rules").$type<Record<string, any>>().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const autonomousPlaybooks = pgTable("autonomous_playbooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  agentId: varchar("agent_id").notNull(),
  triggerCondition: text("trigger_condition").notNull(),
  action: text("action").notNull(),
  autonomyLevel: integer("autonomy_level").notNull(), // 1=Manual Approval, 2=Autonomous with Notification, 3=Fully Autonomous
  status: text("status").notNull().default("proposed"), // "proposed", "active", "suspended", "archived"
  createdBy: text("created_by").notNull().default("chief-of-staff"),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  executionCount: integer("execution_count").default(0).notNull(),
  successRate: integer("success_rate").default(0).notNull(),
  riskLevel: text("risk_level").notNull(), // "low", "medium", "high", "critical"
  financialImpact: integer("financial_impact").default(0), // in dollars
  reasoning: text("reasoning").notNull(),
});

export const playbookExecutions = pgTable("playbook_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playbookId: varchar("playbook_id").notNull(),
  agentId: varchar("agent_id").notNull(),
  trigger: text("trigger").notNull(),
  action: text("action").notNull(),
  result: text("result").notNull(), // "success", "failure", "pending_approval"
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  approvalRequired: boolean("approval_required").default(false).notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  metadata: json("metadata").$type<Record<string, any>>(),
});

export const insertRulesOfEngagementSchema = createInsertSchema(rulesOfEngagement).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAutonomousPlaybookSchema = createInsertSchema(autonomousPlaybooks).omit({ id: true, createdAt: true });
export const insertPlaybookExecutionSchema = createInsertSchema(playbookExecutions).omit({ id: true, executedAt: true });

// New tables for Cognitive Enterprise features

// Market Intelligence Layer
export const marketSignals = pgTable("market_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  source: text("source").notNull(), // "regulatory", "competitor", "financial", "social"
  sourceUrl: text("source_url"),
  summary: text("summary").notNull(),
  impact: text("impact").notNull(), // "high", "medium", "low"
  urgency: text("urgency").notNull(), // "immediate", "near-term", "long-term"
  category: text("category").notNull(), // "regulatory", "competitive", "market", "technology"
  rawData: json("raw_data").$type<Record<string, any>>(),
  tags: json("tags").$type<string[]>().default([]),
  analysisNotes: text("analysis_notes"),
  flaggedAt: timestamp("flagged_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  actionTaken: boolean("action_taken").default(false),
  assignedAgent: text("assigned_agent"),
});

// Generative Strategy Plans  
export const strategicPlans = pgTable("strategic_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("draft"), // "draft", "active", "completed", "cancelled"
  priority: text("priority").notNull(), // "critical", "high", "medium", "low"
  generatedBy: text("generated_by").notNull(), // "chief-of-staff"
  problemDiagnosis: text("problem_diagnosis").notNull(),
  solution: json("solution").$type<any>().notNull(),
  timeline: json("timeline").$type<any>().notNull(),
  assignedAgents: json("assigned_agents").$type<string[]>().notNull(),
  subGoals: json("sub_goals").$type<any[]>().notNull(),
  successMetrics: json("success_metrics").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  progressScore: integer("progress_score").default(0),
});

// Partner & Skills Database
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "EDP", "AIP", "contractor"
  email: text("email").notNull(),
  skills: json("skills").$type<string[]>().notNull(),
  availability: text("availability").notNull(), // "available", "busy", "unavailable"
  performanceRating: integer("performance_rating").notNull().default(85),
  currentWorkload: integer("current_workload").default(0), // percentage
  hourlyRate: integer("hourly_rate"),
  totalProjectsCompleted: integer("total_projects_completed").default(0),
  avgCompletionTime: integer("avg_completion_time").default(0), // hours
  specializations: json("specializations").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Project Management
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "assigned", "in_progress", "completed", "cancelled"
  priority: text("priority").notNull(), // "urgent", "high", "medium", "low"
  budget: integer("budget"), // in cents
  estimatedHours: integer("estimated_hours"),
  requiredSkills: json("required_skills").$type<string[]>().notNull(),
  assignedPartnerId: text("assigned_partner_id"),
  requestedBy: text("requested_by").notNull(), // agent that requested
  strategicPlanId: text("strategic_plan_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  assignedAt: timestamp("assigned_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
});

// A/B Testing Framework
export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  hypothesis: text("hypothesis").notNull(),
  testType: text("test_type").notNull(), // "marketing", "product", "content", "pricing"
  status: text("status").notNull().default("draft"), // "draft", "running", "completed", "stopped"
  variants: json("variants").$type<any[]>().notNull(),
  targetMetric: text("target_metric").notNull(),
  currentResults: json("current_results").$type<Record<string, any>>().default({}),
  statisticalSignificance: integer("statistical_significance").default(0),
  sampleSize: integer("sample_size"),
  trafficSplit: json("traffic_split").$type<Record<string, number>>().default({}),
  winningVariant: text("winning_variant"),
  createdBy: text("created_by").notNull(), // "chief-of-staff"
  managedBy: text("managed_by"), // which agent is running it
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for new tables
export const insertMarketSignalSchema = createInsertSchema(marketSignals).omit({ id: true, flaggedAt: true });
export const insertStrategicPlanSchema = createInsertSchema(strategicPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPartnerSchema = createInsertSchema(partners).omit({ id: true, lastActive: true, joinedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertAbTestSchema = createInsertSchema(abTests).omit({ id: true, createdAt: true });

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

// Autonomous governance types
export type RulesOfEngagement = typeof rulesOfEngagement.$inferSelect;
export type InsertRulesOfEngagement = z.infer<typeof insertRulesOfEngagementSchema>;
export type AutonomousPlaybook = typeof autonomousPlaybooks.$inferSelect;
export type InsertAutonomousPlaybook = z.infer<typeof insertAutonomousPlaybookSchema>;
export type PlaybookExecution = typeof playbookExecutions.$inferSelect;
export type InsertPlaybookExecution = z.infer<typeof insertPlaybookExecutionSchema>;

// Cognitive Enterprise types
export type MarketSignal = typeof marketSignals.$inferSelect;
export type InsertMarketSignal = z.infer<typeof insertMarketSignalSchema>;
export type StrategicPlan = typeof strategicPlans.$inferSelect;
export type InsertStrategicPlan = z.infer<typeof insertStrategicPlanSchema>;
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type AbTest = typeof abTests.$inferSelect;
export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
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

// Content Manager Types
export type CampaignBrief = typeof campaignBriefs.$inferSelect;
export type InsertCampaignBrief = z.infer<typeof insertCampaignBriefSchema>;
export type BrandAsset = typeof brandAssets.$inferSelect;
export type InsertBrandAsset = z.infer<typeof insertBrandAssetSchema>;
export type ContentAsset = typeof contentAssets.$inferSelect;
export type InsertContentAsset = z.infer<typeof insertContentAssetSchema>;
