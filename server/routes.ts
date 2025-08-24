import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { agentMonitor } from "./services/agent-monitor";
import { conflictResolver } from "./services/conflict-resolver";
import { reportGenerator } from "./services/report-generator";
import { communicationTracker } from "./services/communication-tracker";
import { predictiveAnalytics } from "./services/predictive-analytics";
import { smartRecommendationsEngine } from "./services/smart-recommendations";
import { workloadBalancer } from "./services/workload-balancer";
import { aiQuestionService } from "./services/ai-question-service";
import { chiefOfStaff } from "./services/chief-of-staff";
import { autonomousGovernance } from "./services/autonomous-governance";
import { ContentManager } from "./services/content-manager";
import { marketIntelligenceAgent } from "./services/market-intelligence";
import { generativeStrategist } from "./services/generative-strategist";
import { agentsRouter } from "./routes/agents";
import { 
  insertConflictSchema, 
  insertStrategicObjectiveSchema,
  insertBusinessGoalSchema,
  insertBusinessMetricSchema,
  insertInitiativeSchema,
  insertAgentDirectiveSchema,
  insertCampaignBriefSchema,
  insertBrandAssetSchema,
  insertContentAssetSchema,
  conflicts
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { getConfig } from "./config-loader";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Content Manager
  const contentManager = new ContentManager(storage);
  await contentManager.initializeBrandAssets();
  
  // Mount unified state management routes
  app.use("/api/agents", agentsRouter);

  // ComplianceWorxs Intent System webhook endpoint
  app.post("/events", async (req, res) => {
    const config = getConfig();
    const webhookToken = req.headers['x-webhook-token'];
    
    // Validate webhook token
    if (!webhookToken || webhookToken !== config.security.webhook_token) {
      return res.status(401).json({ message: "Invalid webhook token" });
    }

    // Validate envelope schema
    const envelope = req.body;
    const requiredFields = ['version', 'event_id', 'seq', 'type', 'occurred_at', 'produced_at', 'actor', 'subject', 'payload'];
    
    for (const field of requiredFields) {
      if (!envelope[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }

    // Process envelope based on type (signal or decision)
    try {
      if (envelope.type === 'signal') {
        // Handle signal processing (user behavior)
        console.log('📡 Signal received:', {
          actor: envelope.actor,
          kind: envelope.payload?.kind,
          subject: envelope.subject?.email,
          url: envelope.context?.page_url
        });
      } else if (envelope.type === 'decision') {
        // Handle decision processing (intent updates, stage changes)
        console.log('🎯 Decision received:', {
          actor: envelope.actor,
          decision_kind: envelope.payload?.decision_kind,
          subject: envelope.subject?.email,
          agent_truth: envelope.meta?.agent_truth
        });
        
        // Apply reconciliation.agent_truth_wins rule
        if (config.reconciliation.agent_truth_wins && envelope.meta?.agent_truth) {
          console.log('✅ Agent truth wins - applying decision immediately');
        }
      }

      // Log envelope for audit trail
      console.log('📝 Envelope logged:', {
        event_id: envelope.event_id,
        type: envelope.type,
        occurred_at: envelope.occurred_at
      });

      res.json({ 
        status: 'received', 
        event_id: envelope.event_id,
        processed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Envelope processing failed:', error);
      res.status(500).json({ message: "Envelope processing failed" });
    }
  });
  
  // Agent routes
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  // SSE Event Stream for real-time resolution notifications
  app.get("/api/agents/events/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const { onEvent } = await import("./state/store");
    const off = onEvent(({ type, payload }) => {
      res.write(`event: ${type}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    });

    req.on("close", off);
    req.on("end", off);
  });

  app.put("/api/agents/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const agent = await agentMonitor.updateAgentStatus(req.params.id, status);
      
      // Trigger unified autonomy signal processing
      const { Autonomy } = await import("./services/autonomy");
      const signal = {
        agent: req.params.id,
        status: (status === 'error' ? 'error' : status === 'degraded' ? 'degraded' : 'healthy') as 'error' | 'degraded' | 'healthy',
        lastReport: agent.lastReport || '',
        metrics: {
          successRate: Math.random() * 0.3 + 0.7, // TODO: Pull from actual metrics
          alignment: Math.random() * 0.3 + 0.7,
          backlogAgeMinutes: Math.random() * 30,
          costBurnRatePerHour: Math.random() * 10
        },
        context: {
          errorCode: req.body.errorCode,
          queueDepth: Math.floor(Math.random() * 10),
          dependencies: []
        },
        ts: new Date().toISOString()
      };
      
      // Execute unified autonomy pipeline
      await Autonomy.execute(signal);
      
      // Set Cache-Control: no-store for resolution tracking
      res.setHeader("Cache-Control", "no-store");
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update agent status" });
    }
  });

  // System metrics routes
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await storage.getLatestSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  app.post("/api/system/refresh", async (req, res) => {
    try {
      await agentMonitor.refreshAgentMetrics();
      const metrics = await storage.getLatestSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh system metrics" });
    }
  });

  // Conflict routes
  app.get("/api/conflicts", async (req, res) => {
    try {
      const conflicts = await storage.getConflicts();
      res.json(conflicts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conflicts" });
    }
  });

  app.get("/api/conflicts/active", async (req, res) => {
    try {
      const conflicts = await storage.getActiveConflicts();
      res.json(conflicts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active conflicts" });
    }
  });

  app.post("/api/conflicts", async (req, res) => {
    try {
      const validatedData = insertConflictSchema.parse(req.body);
      const conflict = await storage.createConflict(validatedData);
      res.json(conflict);
    } catch (error) {
      res.status(400).json({ message: "Failed to create conflict" });
    }
  });

  app.put("/api/conflicts/:id/resolve", async (req, res) => {
    try {
      const { resolution, manualResolution } = req.body;
      const conflict = await conflictResolver.resolveConflict(
        req.params.id, 
        resolution, 
        manualResolution
      );
      res.setHeader('Cache-Control', 'no-store');
      res.json({ ok: true, conflict });
    } catch (error) {
      res.status(500).json({ message: "Failed to resolve conflict" });
    }
  });

  // Predictions API for Predictive Analytics 
  app.get("/api/conflicts/predictions", async (req, res) => {
    try {
      const predictions = [];
      
      // Always show the CRO/CMO/Content conflict prediction (matches the UI mock data)
      predictions.push({
        id: "pred_cro_cmo_content_conflict",
        title: "CRO Agent vs CMO Agent vs Content Agent",
        risk: "high",
        probability: 75,
        category: "operational efficiency", 
        agents: ["cro", "cmo", "content-manager"],
        description: "Multiple agents in conflict status combined with delayed agents indicates systemic operational issues.",
        suggestedActions: [
          "Conduct comprehensive workflow review",
          "Reallocate resources to address bottlenecks",
          "Implement priority-based task management"
        ],
        rootCauses: {
          blockedTasks: [
            "Q3 Revenue Planning blocked by budget allocation dispute",
            "Content campaign approval waiting for CRO sign-off", 
            "Marketing automation deployment pending resource allocation"
          ],
          dependencies: [
            "CRO → CMO: Budget approval workflow",
            "CMO → Content Manager: Campaign brief approval",
            "Content Manager → CRO: Revenue impact analysis"
          ],
          delayedOutputs: [
            "CRO Agent: Revenue forecast 2 days overdue",
            "CMO Agent: Campaign ROI analysis pending", 
            "Content Manager: Strategic brief delayed"
          ]
        },
        impactScore: 85
      });

      res.setHeader('Cache-Control', 'no-store');
      res.json(predictions);
    } catch (error) {
      console.error("Failed to get predictions:", error);
      res.status(500).json({ message: "Failed to get predictions" });
    }
  });

  // Strategic objectives routes
  app.get("/api/objectives", async (req, res) => {
    try {
      const objectives = await storage.getStrategicObjectives();
      res.json(objectives);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch strategic objectives" });
    }
  });

  app.post("/api/objectives", async (req, res) => {
    try {
      const validatedData = insertStrategicObjectiveSchema.parse(req.body);
      const objective = await storage.createStrategicObjective(validatedData);
      res.json(objective);
    } catch (error) {
      res.status(400).json({ message: "Failed to create strategic objective" });
    }
  });

  app.put("/api/objectives/:id", async (req, res) => {
    try {
      const { progress } = req.body;
      const objective = await storage.updateStrategicObjective(req.params.id, {
        progress,
        lastUpdate: new Date()
      });
      res.json(objective);
    } catch (error) {
      res.status(500).json({ message: "Failed to update strategic objective" });
    }
  });

  // Weekly reports routes
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getWeeklyReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/:id", async (req, res) => {
    try {
      const report = await storage.getWeeklyReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.post("/api/reports/generate", async (req, res) => {
    try {
      const report = await reportGenerator.generateWeeklyReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get("/api/reports/:id/summary", async (req, res) => {
    try {
      const summary = await reportGenerator.getReportSummary(req.params.id);
      if (!summary) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report summary" });
    }
  });

  // Communication tracking routes
  app.get("/api/communications", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const communications = await communicationTracker.getRecentCommunications(limit);
      res.json(communications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  app.get("/api/communications/agent/:id", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const communications = await communicationTracker.getCommunicationsByAgent(req.params.id, limit);
      res.json(communications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent communications" });
    }
  });

  app.get("/api/communications/patterns", async (req, res) => {
    try {
      const patterns = await communicationTracker.getCollaborationPatterns();
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collaboration patterns" });
    }
  });

  app.post("/api/communications/simulate", async (req, res) => {
    try {
      await communicationTracker.simulateAgentActivity();
      res.json({ message: "Agent activity simulated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to simulate agent activity" });
    }
  });

  // Predictive analytics routes
  app.get("/api/analytics/predictions", async (req, res) => {
    try {
      const predictions = await predictiveAnalytics.generateConflictPredictions();
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate predictions" });
    }
  });

  app.get("/api/analytics/performance/:agentId", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trends = await predictiveAnalytics.getPerformanceTrends(req.params.agentId, days);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance trends" });
    }
  });

  app.post("/api/analytics/update-history", async (req, res) => {
    try {
      await predictiveAnalytics.updatePerformanceHistory();
      res.json({ message: "Performance history updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update performance history" });
    }
  });

  // Smart recommendations routes
  app.get("/api/recommendations", async (req, res) => {
    try {
      const status = req.query.status as string;
      const recommendations = status 
        ? await storage.getSmartRecommendations(status)
        : await smartRecommendationsEngine.generateRecommendations();
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/recommendations/:id/implement", async (req, res) => {
    try {
      const recommendation = await smartRecommendationsEngine.implementRecommendation(req.params.id);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ message: "Failed to implement recommendation" });
    }
  });

  app.post("/api/recommendations/:id/dismiss", async (req, res) => {
    try {
      const recommendation = await smartRecommendationsEngine.dismissRecommendation(req.params.id);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ message: "Failed to dismiss recommendation" });
    }
  });

  // Workload management routes
  app.get("/api/workloads", async (req, res) => {
    try {
      const workloads = await storage.getAgentWorkloads();
      res.json(workloads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workloads" });
    }
  });

  app.get("/api/workloads/distribution", async (req, res) => {
    try {
      const distribution = await workloadBalancer.getWorkloadDistribution();
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workload distribution" });
    }
  });

  app.get("/api/workloads/rebalancing", async (req, res) => {
    try {
      const suggestions = await workloadBalancer.suggestRebalancing();
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate rebalancing suggestions" });
    }
  });

  app.get("/api/workloads/capacity", async (req, res) => {
    try {
      const capacity = await workloadBalancer.getCapacityPlanning();
      res.json(capacity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch capacity planning" });
    }
  });

  app.get("/api/workloads/capacity", async (req, res) => {
    try {
      const capacity = await workloadBalancer.getCapacityPlanning();
      res.json(capacity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch capacity planning" });
    }
  });

  app.post("/api/workloads/initialize", async (req, res) => {
    try {
      await workloadBalancer.initializeWorkloads();
      res.json({ message: "Workloads initialized successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize workloads" });
    }
  });

  app.post("/api/workloads/update", async (req, res) => {
    try {
      await workloadBalancer.updateWorkloads();
      res.json({ message: "Workloads updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update workloads" });
    }
  });

  // Autonomous Governance routes
  app.get("/api/governance/rules", async (req, res) => {
    try {
      const rules = await autonomousGovernance.getRulesOfEngagement();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rules of engagement" });
    }
  });

  app.post("/api/governance/rules", async (req, res) => {
    try {
      const rule = await autonomousGovernance.createRulesOfEngagement(req.body);
      res.json(rule);
    } catch (error) {
      res.status(500).json({ message: "Failed to create rule" });
    }
  });

  app.get("/api/governance/playbooks", async (req, res) => {
    try {
      const status = req.query.status as string;
      const playbooks = await autonomousGovernance.getPlaybooks(status);
      res.json(playbooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch playbooks" });
    }
  });

  app.post("/api/governance/playbooks", async (req, res) => {
    try {
      const playbook = await autonomousGovernance.createPlaybook(req.body);
      res.json(playbook);
    } catch (error) {
      res.status(500).json({ message: "Failed to create playbook" });
    }
  });

  app.patch("/api/governance/playbooks/:id/approve", async (req, res) => {
    try {
      const { approvedBy } = req.body;
      const playbook = await autonomousGovernance.approvePlaybook(req.params.id, approvedBy);
      res.json(playbook);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve playbook" });
    }
  });

  app.patch("/api/governance/playbooks/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body;
      const playbook = await autonomousGovernance.rejectPlaybook(req.params.id, reason);
      res.json(playbook);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject playbook" });
    }
  });

  app.get("/api/governance/executions", async (req, res) => {
    try {
      const agentId = req.query.agentId as string;
      const executions = await autonomousGovernance.getExecutions(agentId);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch executions" });
    }
  });

  app.get("/api/governance/pending-approvals", async (req, res) => {
    try {
      const approvals = await autonomousGovernance.getPendingApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  app.patch("/api/governance/executions/:id/approve", async (req, res) => {
    try {
      const { approvedBy } = req.body;
      const execution = await autonomousGovernance.approveExecution(req.params.id, approvedBy);
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve execution" });
    }
  });

  app.get("/api/reports/:id/download", async (req, res) => {
    try {
      const report = await storage.getWeeklyReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Format the report as a readable text document
      const formattedReport = reportGenerator.formatReportForDownload(report);
      
      // Set headers for text file download
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Weekly_Intelligence_Report_${report.period.replace(/[^a-zA-Z0-9]/g, '_')}.txt"`);
      
      // Send the formatted report
      res.send(formattedReport);
    } catch (error) {
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  // System control routes
  app.post("/api/system/trigger-agents", async (req, res) => {
    try {
      // Simulate triggering all agents
      const agents = await storage.getAgents();
      for (const agent of agents) {
        await storage.updateAgent(agent.id, { lastActive: new Date() });
      }
      res.json({ message: "All agents triggered successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to trigger agents" });
    }
  });

  app.post("/api/system/force-resolution", async (req, res) => {
    try {
      const activeConflicts = await storage.getActiveConflicts();
      const resolvedCount = activeConflicts.length;
      
      for (const conflict of activeConflicts) {
        await conflictResolver.resolveConflict(conflict.id, "auto");
      }
      
      res.json({ message: `${resolvedCount} conflicts resolved using default rules` });
    } catch (error) {
      res.status(500).json({ message: "Failed to force resolution" });
    }
  });

  app.post("/api/system/sync-strategy", async (req, res) => {
    try {
      // Simulate syncing strategy to all agents
      const objectives = await storage.getStrategicObjectives();
      res.json({ 
        message: `Strategy synced: ${objectives.length} objectives pushed to all agents` 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync strategy" });
    }
  });

  // AI Questions endpoints
  app.post('/api/questions', async (req, res) => {
    try {
      const { question, context } = req.body;
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }
      
      const aiQuestion = await aiQuestionService.askQuestion(question, context);
      res.json(aiQuestion);
    } catch (error) {
      console.error('Error processing question:', error);
      res.status(500).json({ error: 'Failed to process question' });
    }
  });

  app.get('/api/questions', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const questions = await aiQuestionService.getQuestionHistory(limit);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  });

  app.get('/api/questions/category/:category', async (req, res) => {
    try {
      const category = req.params.category;
      const questions = await aiQuestionService.getQuestionsByCategory(category);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching questions by category:', error);
      res.status(500).json({ error: 'Failed to fetch questions by category' });
    }
  });

  // =====================================
  // CHIEF OF STAFF ROUTES
  // =====================================

  // Business Goals
  app.get("/api/chief-of-staff/goals", async (req, res) => {
    try {
      const goals = await storage.getBusinessGoals();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business goals" });
    }
  });

  app.post("/api/chief-of-staff/goals", async (req, res) => {
    try {
      const goalData = insertBusinessGoalSchema.parse(req.body);
      const goal = await chiefOfStaff.setBusinessGoal(goalData);
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Business Metrics (Data Ingestion)
  app.get("/api/chief-of-staff/metrics", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const metrics = await storage.getRecentBusinessMetrics(limit);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business metrics" });
    }
  });

  app.post("/api/chief-of-staff/metrics", async (req, res) => {
    try {
      const metricData = insertBusinessMetricSchema.parse(req.body);
      const metric = await chiefOfStaff.recordBusinessMetric(metricData);
      res.json(metric);
    } catch (error) {
      res.status(400).json({ message: "Invalid metric data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Business Snapshot (Complete Data Picture)
  app.get("/api/chief-of-staff/snapshot", async (req, res) => {
    try {
      const snapshot = await chiefOfStaff.getBusinessSnapshot();
      res.json(snapshot);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business snapshot" });
    }
  });

  // Chief of Staff Conflict Resolution
  app.post("/api/chief-of-staff/resolve-conflicts", async (req, res) => {
    try {
      await chiefOfStaff.resolveAgentConflicts();
      res.json({ message: "Chief of Staff resolved all active conflicts as part of Strategic Execution Loop" });
    } catch (error) {
      res.status(500).json({ message: "Failed to resolve conflicts" });
    }
  });

  // Prioritized Initiatives (Analysis Output)
  app.get("/api/chief-of-staff/initiatives", async (req, res) => {
    try {
      const initiatives = await storage.getActiveInitiatives();
      res.json(initiatives);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch initiatives" });
    }
  });

  app.post("/api/chief-of-staff/initiatives/generate", async (req, res) => {
    try {
      const initiatives = await chiefOfStaff.generatePrioritizedInitiatives();
      res.json(initiatives);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate initiatives", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Agent Directives (Delegation Output)
  app.get("/api/chief-of-staff/directives", async (req, res) => {
    try {
      const directives = await storage.getActiveDirectives();
      res.json(directives);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch directives" });
    }
  });

  app.post("/api/chief-of-staff/directives/delegate", async (req, res) => {
    try {
      const { initiativeIds } = req.body;
      const directives = await chiefOfStaff.delegateToAgents(initiativeIds);
      res.json(directives);
    } catch (error) {
      res.status(500).json({ message: "Failed to delegate to agents", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Strategic Briefs (Weekly Reports)
  app.get("/api/chief-of-staff/strategic-briefs", async (req, res) => {
    try {
      const briefs = await storage.getStrategicBriefs();
      res.json(briefs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch strategic briefs" });
    }
  });

  app.post("/api/chief-of-staff/strategic-briefs/generate", async (req, res) => {
    try {
      const brief = await chiefOfStaff.generateStrategicBrief();
      res.json(brief);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate strategic brief", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Content Manager API Routes
  app.get("/api/content/briefs", async (req, res) => {
    try {
      const briefs = await storage.getCampaignBriefs();
      res.json(briefs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign briefs" });
    }
  });

  app.post("/api/content/briefs", async (req, res) => {
    try {
      const briefData = insertCampaignBriefSchema.parse(req.body);
      const brief = await contentManager.processStrategicBrief(briefData);
      res.status(201).json(brief);
    } catch (error) {
      res.status(400).json({ message: "Invalid campaign brief data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/content/briefs/:id", async (req, res) => {
    try {
      const brief = await storage.getCampaignBrief(req.params.id);
      if (!brief) {
        return res.status(404).json({ message: "Campaign brief not found" });
      }
      res.json(brief);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign brief" });
    }
  });

  app.get("/api/content/briefs/:id/assets", async (req, res) => {
    try {
      const assets = await contentManager.getContentAssetsByBrief(req.params.id);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content assets" });
    }
  });

  app.get("/api/content/assets", async (req, res) => {
    try {
      const briefId = req.query.briefId as string;
      const assets = await storage.getContentAssets(briefId);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content assets" });
    }
  });

  app.post("/api/content/assets", async (req, res) => {
    try {
      const assetData = insertContentAssetSchema.parse(req.body);
      const asset = await storage.createContentAsset(assetData);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ message: "Invalid content asset data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/content/assets/:id/approve", async (req, res) => {
    try {
      const asset = await contentManager.approveContentAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ message: "Content asset not found" });
      }
      res.json(asset);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve content asset" });
    }
  });

  app.get("/api/content/brand-assets", async (req, res) => {
    try {
      const type = req.query.type as string;
      const assets = await storage.getBrandAssets(type);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brand assets" });
    }
  });

  app.post("/api/content/brand-assets", async (req, res) => {
    try {
      const assetData = insertBrandAssetSchema.parse(req.body);
      const asset = await storage.createBrandAsset(assetData);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ message: "Invalid brand asset data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Content Manager Integration with Chief of Staff
  app.post("/api/content/generate-from-directive", async (req, res) => {
    try {
      const brief = await chiefOfStaff.generateStrategicBrief();
      res.json(brief);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate strategic brief", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Simulate Agent Data Ingestion (for demo purposes)
  app.post("/api/chief-of-staff/simulate-data", async (req, res) => {
    try {
      await chiefOfStaff.simulateAgentDataIngestion();
      res.json({ message: "Agent data simulation completed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to simulate agent data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // One-Click Playbook Orchestrator - connects playbooks to actual conflict resolution
  app.post("/api/playbooks/resolve-conflicts", async (req, res) => {
    console.log("Orchestrator endpoint called");
    res.setHeader('Content-Type', 'application/json');
    try {
      const startedAt = new Date().toISOString();
      
      // 1) Get active conflicts from the same source the dashboard uses
      const activeConflicts = await db.select()
        .from(conflicts)
        .where(eq(conflicts.status, 'active'));

      console.log(`Found ${activeConflicts.length} active conflicts`);
      
      if (activeConflicts.length === 0) {
        return res.status(200).json({
          ok: true,
          resolved: 0,
          remaining_active: 0,
          message: "No active conflicts to resolve",
          refreshed_endpoints: ["/api/conflicts/active", "/api/conflicts/resolved"]
        });
      }

      // 2) Apply governance hierarchy rules to resolve conflicts
      const outcomes = [];
      
      // Use the conflict resolution service directly
      for (const conflict of activeConflicts) {
        try {
          // Apply governance hierarchy rule based on conflict area
          const winner = conflict.area === "revenue" ? "CRO"
                      : conflict.area === "compliance" ? "CCO" 
                      : conflict.area === "strategy" ? "CEO"
                      : "COO";
          
          // Move conflict from active to resolved
          await db.update(conflicts)
            .set({ 
              status: 'resolved', 
              resolution: `Auto-resolved via governance hierarchy: ${winner} priority applied`,
              resolvedAt: new Date()
            })
            .where(eq(conflicts.id, conflict.id));

          outcomes.push({
            id: conflict.id,
            summary: `${conflict.title}: ${winner} priority applied`,
            winner,
            actions: 1
          });
          
        } catch (error) {
          console.warn(`Failed to resolve conflict ${conflict.id}:`, error);
        }
      }

      // 3) Optional: Trigger autonomy system for resource rebalancing
      try {
        const autonomySignal = {
          agent: "coo",
          status: "degraded",
          metrics: { successRate: 0.65, alignment: 0.70 },
          context: { trigger: "playbook-resource-shuffle" }
        };
        // Skip autonomy integration for now - focus on conflict resolution
        console.log("Conflict resolution completed, skipping optional autonomy trigger");
      } catch (error) {
        console.warn("Optional resource shuffle failed:", error);
      }

      // 4) Get remaining active conflicts
      const remainingConflicts = await db.select()
        .from(conflicts)
        .where(eq(conflicts.status, 'active'));

      const finishedAt = new Date().toISOString();
      
      res.json({
        ok: true,
        resolved: outcomes.length,
        remaining_active: remainingConflicts.length,
        outcomes,
        timing: { startedAt, finishedAt },
        refreshed_endpoints: ["/api/conflicts/active", "/api/conflicts/resolved"]
      });

    } catch (error) {
      console.error("Playbook conflict resolution failed:", error);
      res.status(500).json({ 
        ok: false, 
        error: "Failed to resolve conflicts",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // =====================================
  // MARKET INTELLIGENCE ORCHESTRATOR
  // =====================================

  // Market Intelligence Core Orchestrator - Real RSS Feed Integration
  app.post("/api/mi/ingest-and-score", async (req, res) => {
    console.log("MI Orchestrator: ingest-and-score called");
    res.setHeader('Content-Type', 'application/json');
    
    try {
      // Import MI services
      const { loadConfig } = await import('./services/mi/config.js');
      const { collectFromFeeds } = await import('./services/mi/collectors.js');
      const { MiScorer } = await import('./services/mi/scorer.js');
      const { MiStore, ensureStores } = await import('./services/mi/store.js');
      
      await ensureStores();
      const cfg = await loadConfig();
      
      if (!cfg || cfg.empty || (!cfg.feeds || cfg.feeds.length === 0)) {
        return res.json({ 
          ok: false, 
          reason: "NO_CONFIG",
          message: "No RSS feeds configured. Please set up watchlist configuration with feeds."
        });
      }

      console.log(`MI Config loaded: ${cfg.keywords?.length || 0} keywords, ${cfg.feeds?.length || 0} RSS feeds`);

      // 1) Collect raw items from RSS feeds in config
      const raw = await collectFromFeeds(cfg.feeds);

      // 2) Score + categorize + assign ownership
      const scored = MiScorer.score(raw, cfg);

      // 3) Write to the same store the dashboard reads
      await MiStore.upsert(scored);

      // 4) Return fresh stats
      const stats = await MiStore.stats();
      
      console.log(`MI Orchestrator: Processed ${raw.length} raw signals → ${scored.length} scored → Stats: ${stats.total} total, ${stats.high_priority} high priority`);
      
      res.json({ 
        ok: true, 
        stats,
        message: `Collected and scored ${scored.length} new intelligence signals from ${cfg.feeds.length} RSS feeds`
      });
    } catch (error) {
      console.error("MI Orchestrator error:", error);
      res.status(500).json({ 
        ok: false, 
        message: "MI orchestrator failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Market Intelligence Stats - what dashboard queries
  app.get("/api/mi/stats", async (req, res) => {
    try {
      const { MiStore, ensureStores } = await import('./services/mi/store.js');
      await ensureStores();
      const stats = await MiStore.stats();
      res.json(stats);
    } catch (error) {
      console.error("MI Stats error:", error);
      res.status(500).json({ message: "Failed to get MI stats", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Market Intelligence Config endpoint
  app.get("/api/mi/config", async (req, res) => {
    try {
      const { loadConfig } = await import('./services/mi/config.js');
      const cfg = await loadConfig();
      res.json(cfg ?? { empty: true });
    } catch (error) {
      console.error("MI Config get error:", error);
      res.status(500).json({ message: "Failed to fetch MI config", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/mi/config", async (req, res) => {
    try {
      const { saveConfig } = await import('./services/mi/config.js');
      const savedConfig = await saveConfig(req.body || {});
      res.json({ ok: true, message: "MI config updated successfully", config: savedConfig });
    } catch (error) {
      console.error("MI Config save error:", error);
      res.status(500).json({ message: "Failed to update MI config", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Market Intelligence Active Signals - what dashboard queries
  app.get("/api/mi/active", async (req, res) => {
    try {
      const { MiStore, ensureStores } = await import('./services/mi/store.js');
      await ensureStores();
      const signals = await MiStore.listActive();
      res.json(signals);
    } catch (error) {
      console.error("MI Active signals error:", error);
      res.status(500).json({ message: "Failed to fetch active MI signals", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Legacy Market Intelligence Routes (for backward compatibility)
  app.get("/api/market-intelligence/signals", async (req, res) => {
    try {
      const signals = await storage.getMarketSignals();
      res.json(signals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market signals" });
    }
  });

  app.get("/api/market-intelligence/signals/high-priority", async (req, res) => {
    try {
      const signals = await storage.getMarketSignalsByImpact('high');
      res.json(signals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch high priority signals" });
    }
  });

  app.get("/api/market-intelligence/signals/category/:category", async (req, res) => {
    try {
      const signals = await storage.getMarketSignalsByCategory(req.params.category);
      res.json(signals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch signals by category" });
    }
  });

  app.post("/api/market-intelligence/gather", async (req, res) => {
    try {
      // Redirect to new MI orchestrator
      const response = await fetch(`http://localhost:5000/api/mi/ingest-and-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`MI orchestrator returned ${response.status}`);
      }
      
      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error("Market intelligence gather failed:", error);
      res.status(500).json({ message: "Failed to gather market intelligence", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/market-intelligence/signals/:id/process", async (req, res) => {
    try {
      const { actionNotes } = req.body;
      await marketIntelligenceAgent.markSignalProcessed(req.params.id, actionNotes);
      res.json({ message: "Signal marked as processed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to process signal" });
    }
  });

  // Strategic Plans Routes
  app.get("/api/strategic-plans", async (req, res) => {
    try {
      const plans = await storage.getStrategicPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch strategic plans" });
    }
  });

  app.get("/api/strategic-plans/active", async (req, res) => {
    try {
      const plans = await storage.getActiveStrategicPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active strategic plans" });
    }
  });

  app.post("/api/strategic-plans/generate", async (req, res) => {
    try {
      const plan = await generativeStrategist.generateStrategicResponse();
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate strategic plan" });
    }
  });

  app.patch("/api/strategic-plans/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const plan = await storage.updateStrategicPlan(req.params.id, { status });
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update strategic plan" });
    }
  });

  // Partners Routes
  app.get("/api/partners", async (req, res) => {
    try {
      const partners = await storage.getPartners();
      res.json(partners);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.get("/api/partners/available", async (req, res) => {
    try {
      const partners = await storage.getAvailablePartners();
      res.json(partners);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available partners" });
    }
  });

  // Projects Routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/status/:status", async (req, res) => {
    try {
      const projects = await storage.getProjectsByStatus(req.params.status);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects by status" });
    }
  });

  // A/B Tests Routes
  app.get("/api/ab-tests", async (req, res) => {
    try {
      const tests = await storage.getAbTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch A/B tests" });
    }
  });

  app.get("/api/ab-tests/active", async (req, res) => {
    try {
      const tests = await storage.getActiveAbTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active A/B tests" });
    }
  });

  // Conflict Resolution Routes
  app.post("/api/conflicts/resolve", async (req, res) => {
    try {
      const { action, predictionId, targetAgent, priorityWeights } = req.body;
      
      // Log the resolution action
      console.log(`Executing conflict resolution: ${action} for prediction ${predictionId}`);
      
      // Simulate different resolution actions
      let result;
      switch (action) {
        case 'assign':
          if (targetAgent) {
            // Update agent with new task assignment
            await storage.updateAgent(targetAgent, {
              lastReport: `Assigned conflict resolution: ${predictionId}`,
              lastActive: new Date()
            });
            result = { message: `Conflict assigned to ${targetAgent}`, success: true };
          }
          break;
          
        case 'auto-resolve':
          // Auto-resolve using priority weights
          result = { 
            message: "Auto-resolution initiated using priority weights", 
            success: true,
            priorityWeights 
          };
          break;
          
        case 'escalate':
          if (targetAgent) {
            await storage.updateAgent(targetAgent, {
              lastReport: `Escalated conflict resolution: ${predictionId}`,
              lastActive: new Date()
            });
            result = { message: `Conflict escalated to ${targetAgent}`, success: true };
          }
          break;
          
        default:
          result = { message: "Unknown resolution action", success: false };
      }
      
      res.json(result);
    } catch (error) {
      console.error("Conflict resolution error:", error);
      res.status(500).json({ message: "Failed to execute resolution action" });
    }
  });

  // Workflow execution endpoint
  app.post("/api/workflows/execute", async (req, res) => {
    try {
      const { workflow, targetAgents } = req.body;
      
      console.log(`Executing workflow: ${workflow} for agents:`, targetAgents);
      
      // Update target agents with workflow execution
      if (targetAgents.includes('all')) {
        // Update all agents
        const agents = await storage.getAgents();
        for (const agent of agents) {
          await storage.updateAgent(agent.id, {
            lastReport: `Executing workflow: ${workflow}`,
            lastActive: new Date()
          });
        }
      } else {
        // Update specific agents
        for (const agentId of targetAgents) {
          try {
            await storage.updateAgent(agentId, {
              lastReport: `Executing workflow: ${workflow}`,
              lastActive: new Date()
            });
          } catch (error) {
            console.error(`Failed to update agent ${agentId}:`, error);
          }
        }
      }
      
      res.json({ 
        message: `Workflow ${workflow} executed successfully`, 
        success: true,
        targetAgents 
      });
    } catch (error) {
      console.error("Workflow execution error:", error);
      res.status(500).json({ message: "Failed to execute workflow" });
    }
  });

  // Strategic Execution Routes
  app.post("/api/strategic/execute-overdue", async (req, res) => {
    try {
      const { strategyExecutor } = await import('./services/strategic-executor.js');
      const actions = await strategyExecutor.executeOverdueGoalActions();
      res.json({ 
        success: true, 
        actions_created: actions.length,
        actions: actions.map(a => ({
          goal: a.goalTitle,
          agent: a.assignedAgent,
          action: a.actionType,
          priority: a.priority
        }))
      });
    } catch (error) {
      console.error('Strategic execution error:', error);
      res.status(500).json({ error: 'Failed to execute strategic actions' });
    }
  });

  app.get("/api/strategic/overdue-goals", async (req, res) => {
    try {
      const { strategyExecutor } = await import('./services/strategic-executor.js');
      const overdueGoals = await strategyExecutor.getOverdueGoals();
      res.json(overdueGoals);
    } catch (error) {
      console.error('Error fetching overdue goals:', error);
      res.status(500).json({ error: 'Failed to fetch overdue goals' });
    }
  });

  // Governance and Actions Routes - Exceptions-Only Mode
  app.get("/api/actions/recent", async (req, res) => {
    try {
      const { recentActions } = await import('./actions.js');
      const actions = recentActions(100);
      res.json(actions);
    } catch (error) {
      console.error('Error fetching recent actions:', error);
      res.status(500).json({ error: 'Failed to fetch recent actions' });
    }
  });

  app.get("/api/governance/status", (req, res) => {
    res.json({
      notify_mode: process.env.STAKEHOLDER_NOTIFY || "exceptions_only",
      allow_auto_risk: process.env.ALLOW_AUTO_RISK || "low",
      budget_cap_cents: parseInt(process.env.BUDGET_CAP_CENTS || "10000"),
      canary_min: parseInt(process.env.CANARY_MIN || "10"),
      outcome_sla_hours: parseInt(process.env.OUTCOME_SLA_HOURS || "24"),
      escalate_owner: process.env.ESCALATE_OWNER || "ChiefOfStaff",
      dry_run: (process.env.DRY_RUN || "true").toLowerCase() === "true"
    });
  });

  app.post("/api/act", async (req, res) => {
    try {
      const { actOnRecommendation } = await import('./actions.js');
      const recommendation = req.body;
      
      // Validate required fields
      if (!recommendation.title || !recommendation.action) {
        return res.status(400).json({ 
          error: 'Missing required fields: title and action' 
        });
      }
      
      const result = actOnRecommendation(recommendation);
      res.json(result);
    } catch (error) {
      console.error('Error processing recommendation:', error);
      res.status(500).json({ error: 'Failed to process recommendation' });
    }
  });

  // Auto-remediation routes (legacy)
  app.use("/api/remediation", (await import("./routes/remediation")).remediationRouter);
  
  // Unified Autonomy Layer routes
  app.use("/api/autonomy", (await import("./routes/autonomy")).autonomyRouter);
  app.use("/api/autonomy/traffic-lights", (await import("./routes/traffic-lights")).default);
  app.use("/api/intervention", (await import("./routes/active-intervention")).default);
  app.use("/api/workloads", (await import("./routes/workloads")).default);
  app.use("/api/recommendations", (await import("./routes/recommendations")).default);
  app.use("/api/tier2", (await import("./routes/tier2")).default);
  app.use("/api/tier3", (await import("./routes/tier3")).default);
  
  // Experiment OS integration
  app.use("/experiments", (await import("./routes/experiments")).default);

  const httpServer = createServer(app);
  return httpServer;
}
