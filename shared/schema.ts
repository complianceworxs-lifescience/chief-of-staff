import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth schema for Replit Auth integration
export * from "./models/auth";

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

// Data Sanity Check and Agent Briefing Tables
export const auditReports = pgTable("audit_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditId: text("audit_id").notNull().unique(),
  auditDate: timestamp("audit_date").defaultNow().notNull(),
  sampleSize: integer("sample_size").notNull(),
  customerJourneys: json("customer_journeys").$type<any[]>().notNull(),
  attributionComparison: json("attribution_comparison").$type<any[]>().notNull(),
  dataQualityFlags: json("data_quality_flags").$type<{
    missingTouchpoints: number;
    duplicateEvents: number;
    sessionStitchingErrors: number;
    attributionDiscrepancies: number;
  }>().notNull(),
  recommendations: json("recommendations").$type<string[]>().notNull(),
  overallConfidenceScore: integer("overall_confidence_score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cmoBriefings = pgTable("cmo_briefings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  briefingId: text("briefing_id").notNull().unique(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  dataConfidence: integer("data_confidence").notNull(),
  top5Channels: json("top5_channels").$type<any[]>().notNull(),
  channelRecommendations: json("channel_recommendations").$type<{
    doubleDown: string[];
    investigate: string[];
    pause: string[];
  }>().notNull(),
  contentStrategy: json("content_strategy").$type<{
    highPerformingTopics: string[];
    underperformingAreas: string[];
    gapAnalysis: string[];
  }>().notNull(),
  actionItems: json("action_items").$type<string[]>().notNull(),
  nextBriefingDue: timestamp("next_briefing_due").notNull(),
  auditReportId: text("audit_report_id").notNull(),
});

export const croBriefings = pgTable("cro_briefings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  briefingId: text("briefing_id").notNull().unique(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  dataConfidence: integer("data_confidence").notNull(),
  top3ContentPaths: json("top3_content_paths").$type<any[]>().notNull(),
  conversionOptimization: json("conversion_optimization").$type<{
    highImpactTests: Array<{
      testType: 'landing_page' | 'email' | 'flow';
      description: string;
      expectedImpact: number;
      effort: 'low' | 'medium' | 'high';
    }>;
    quickWins: string[];
    longTermProjects: string[];
  }>().notNull(),
  funnelAnalysis: json("funnel_analysis").$type<{
    dropoffPoints: Array<{
      step: string;
      dropoffRate: number;
      opportunity: number;
    }>;
    improvements: string[];
  }>().notNull(),
  actionItems: json("action_items").$type<string[]>().notNull(),
  nextBriefingDue: timestamp("next_briefing_due").notNull(),
  auditReportId: text("audit_report_id").notNull(),
});

export const ceoBriefings = pgTable("ceo_briefings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  briefingId: text("briefing_id").notNull().unique(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  dataConfidence: integer("data_confidence").notNull(),
  channelROIDashboard: json("channel_roi_dashboard").$type<{
    topPerformers: Array<{
      channel: string;
      spend: number;
      revenue: number;
      roi: number;
      trend: string;
    }>;
    portfolioHealth: {
      diversificationScore: number;
      riskAssessment: string;
      sustainabilityRating: 'high' | 'medium' | 'low';
    };
    competitivePosition: {
      marketShare: number;
      growthRate: number;
      efficiency: number;
    };
  }>().notNull(),
  strategicInsights: json("strategic_insights").$type<{
    opportunities: string[];
    threats: string[];
    recommendations: string[];
  }>().notNull(),
  boardReadyMetrics: json("board_ready_metrics").$type<{
    totalROI: number;
    costPerAcquisition: number;
    customerLifetimeValue: number;
    paybackPeriod: number;
  }>().notNull(),
  actionItems: json("action_items").$type<string[]>().notNull(),
  nextBriefingDue: timestamp("next_briefing_due").notNull(),
  auditReportId: text("audit_report_id").notNull(),
});

export const optimizationCycles = pgTable("optimization_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: text("cycle_id").notNull().unique(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  phase: text("phase").notNull(),
  guardrailsStatus: text("guardrails_status").notNull(), // "compliant", "warning", "violation"
  performanceMetrics: json("performance_metrics").$type<{
    dataQuality: number;
    attributionConfidence: number;
    conversionVolume: number;
    systemHealth: number;
  }>().notNull(),
  optimizationActions: json("optimization_actions").$type<Array<{
    action: string;
    impact: number;
    approved: boolean;
    executedAt?: string;
  }>>().notNull(),
  nextCycleDue: timestamp("next_cycle_due").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const redFlags = pgTable("red_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flagId: text("flag_id").notNull().unique(),
  type: text("type").notNull(), // "data_sparsity", "cookie_loss", "direct_traffic_anomaly", "attribution_error", "collection_failure"
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  description: text("description").notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  affectedData: json("affected_data").$type<string[]>().notNull(),
  recommendedActions: json("recommended_actions").$type<string[]>().notNull(),
  autoResolved: boolean("auto_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  cycleId: text("cycle_id"), // link to optimization cycle
});

// COO Zero-Cost Enhancement Tables
export const zeroCostProposals = pgTable("zero_cost_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: text("proposal_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "workflow_optimization", "duplicate_processing", "idle_cycles", "log_management", "task_sequencing", "function_merging"
  currentInefficiency: json("current_inefficiency").$type<{
    type: string;
    description: string;
    frequency: string;
    estimatedWasteHours: number;
  }>().notNull(),
  proposedSolution: json("proposed_solution").$type<{
    approach: string;
    implementation: string[];
    estimatedEfficiencyGain: number;
  }>().notNull(),
  sandboxTestResults: json("sandbox_test_results").$type<{
    testDate: string;
    baselineMetrics: Record<string, number>;
    testMetrics: Record<string, number>;
    performanceDelta: number;
    reliability: number;
    riskAssessment: string;
  }>(),
  projectedImpact: json("projected_impact").$type<{
    efficiencyImprovement: number;
    timeReduction: number;
    resourceSavings: number;
    reliabilityIncrease: number;
  }>().notNull(),
  priority: text("priority").notNull(), // "low", "medium", "high", "critical"
  status: text("status").notNull().default("proposed"), // "proposed", "testing", "ready_for_approval", "approved", "rejected"
  detectedBy: text("detected_by").notNull().default("COO"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
});

export const zeroCostAdoptions = pgTable("zero_cost_adoptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adoptionId: text("adoption_id").notNull().unique(),
  proposalId: text("proposal_id").references(() => zeroCostProposals.proposalId).notNull(),
  title: text("title").notNull(),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
  deploymentMethod: text("deployment_method").notNull(),
  preDeploymentMetrics: json("pre_deployment_metrics").$type<Record<string, number>>().notNull(),
  postDeploymentMetrics: json("post_deployment_metrics").$type<Record<string, number>>().notNull(),
  actualPerformanceImprovement: json("actual_performance_improvement").$type<{
    efficiencyGain: number;
    timeReduction: number;
    resourceSavings: number;
    reliabilityIncrease: number;
  }>().notNull(),
  revenueAlignment: json("revenue_alignment").$type<{
    ceoApproved: boolean;
    alignmentScore: number;
    revenueImpact: number;
    strategicBenefit: string;
  }>().notNull(),
  complianceCheck: json("compliance_check").$type<{
    ccoValidated: boolean;
    dataIntegrityImpact: string;
    complianceRisk: string;
  }>().notNull(),
  rollbackPlan: json("rollback_plan").$type<{
    canRollback: boolean;
    rollbackSteps: string[];
    rollbackTime: number;
  }>().notNull(),
  monthlyImpact: json("monthly_impact").$type<{
    efficiencyHoursGained: number;
    costSavingsUSD: number;
    systemHealthImprovement: number;
  }>().notNull(),
  createdBy: text("created_by").notNull().default("COO"),
  approvedBy: text("approved_by").notNull(),
});

export const zeroCostAuditLog = pgTable("zero_cost_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditId: text("audit_id").notNull().unique(),
  proposalId: text("proposal_id").references(() => zeroCostProposals.proposalId).notNull(),
  action: text("action").notNull(), // "proposed", "tested", "approved", "deployed", "rejected", "failed", "rolled_back"
  actionBy: text("action_by").notNull(),
  actionAt: timestamp("action_at").defaultNow().notNull(),
  reason: text("reason").notNull(),
  details: json("details").$type<Record<string, any>>().notNull(),
  impact: json("impact").$type<{
    performance: number;
    reliability: number;
    efficiency: number;
  }>(),
  notes: text("notes"),
  traceabilityChain: json("traceability_chain").$type<string[]>().notNull(),
});

// L6 Performance Ledger - Tracks email hypothesis vs business outcomes
export const performanceLedger = pgTable("performance_ledger", {
  sendId: text("send_id").primaryKey(),
  campaignId: text("campaign_id").notNull(),
  variantId: text("variant_id"),
  recipientEmailHash: text("recipient_email_hash"),
  persona: text("persona").notNull(),
  segment: text("segment"),
  problemAngle: text("problem_angle"),
  metricFocus: text("metric_focus"),
  toneStyle: text("tone_style"),
  ctaType: text("cta_type"),
  doctrineScore: integer("doctrine_score"),
  validatorPass: boolean("validator_pass").default(false),
  vqsBand: text("vqs_band"),
  forbiddenFlag: boolean("forbidden_flag").default(false),
  subjectLine: text("subject_line"),
  subjectHash: text("subject_hash"),
  bodyHash: text("body_hash"),
  opens: integer("opens").default(0),
  clicks: integer("clicks").default(0),
  replies: integer("replies").default(0),
  positiveReplies: integer("positive_replies").default(0),
  bookedCalls: integer("booked_calls").default(0),
  pipelineValueEst: integer("pipeline_value_est").default(0),
  revenueAttribEst: integer("revenue_attrib_est").default(0),
  batchId: text("batch_id"),
  sentAt: timestamp("sent_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPerformanceLedgerSchema = createInsertSchema(performanceLedger).omit({ sentAt: true, updatedAt: true });

// Zero-cost enhancement insert schemas
export const insertZeroCostProposalSchema = createInsertSchema(zeroCostProposals).omit({ id: true, createdAt: true });
export const insertZeroCostAdoptionSchema = createInsertSchema(zeroCostAdoptions).omit({ id: true, deployedAt: true });
export const insertZeroCostAuditLogSchema = createInsertSchema(zeroCostAuditLog).omit({ id: true, actionAt: true });

// Insert schemas for new tables
export const insertAuditReportSchema = createInsertSchema(auditReports).omit({ id: true, createdAt: true });
export const insertCMOBriefingSchema = createInsertSchema(cmoBriefings).omit({ id: true, generatedAt: true });
export const insertCROBriefingSchema = createInsertSchema(croBriefings).omit({ id: true, generatedAt: true });
export const insertCEOBriefingSchema = createInsertSchema(ceoBriefings).omit({ id: true, generatedAt: true });
export const insertOptimizationCycleSchema = createInsertSchema(optimizationCycles).omit({ id: true, startDate: true, createdAt: true });
export const insertRedFlagSchema = createInsertSchema(redFlags).omit({ id: true, detectedAt: true });

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

// Data-Driven Agent Briefing Types
export type AuditReport = typeof auditReports.$inferSelect;
export type InsertAuditReport = z.infer<typeof insertAuditReportSchema>;
export type CMOBriefing = typeof cmoBriefings.$inferSelect;
export type InsertCMOBriefing = z.infer<typeof insertCMOBriefingSchema>;
export type CROBriefing = typeof croBriefings.$inferSelect;
export type InsertCROBriefing = z.infer<typeof insertCROBriefingSchema>;
export type CEOBriefing = typeof ceoBriefings.$inferSelect;
export type InsertCEOBriefing = z.infer<typeof insertCEOBriefingSchema>;
export type OptimizationCycle = typeof optimizationCycles.$inferSelect;
export type InsertOptimizationCycle = z.infer<typeof insertOptimizationCycleSchema>;
export type RedFlag = typeof redFlags.$inferSelect;
export type InsertRedFlag = z.infer<typeof insertRedFlagSchema>;

// Zero-Cost Enhancement Types
export type ZeroCostProposal = typeof zeroCostProposals.$inferSelect;
export type InsertZeroCostProposal = z.infer<typeof insertZeroCostProposalSchema>;
export type ZeroCostAdoption = typeof zeroCostAdoptions.$inferSelect;
export type InsertZeroCostAdoption = z.infer<typeof insertZeroCostAdoptionSchema>;
export type ZeroCostAuditLog = typeof zeroCostAuditLog.$inferSelect;
export type InsertZeroCostAuditLog = z.infer<typeof insertZeroCostAuditLogSchema>;

// L6 Performance Ledger Types
export type PerformanceLedger = typeof performanceLedger.$inferSelect;
export type InsertPerformanceLedger = z.infer<typeof insertPerformanceLedgerSchema>;
