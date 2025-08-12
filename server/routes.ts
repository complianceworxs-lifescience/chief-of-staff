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
import { 
  insertConflictSchema, 
  insertStrategicObjectiveSchema,
  insertBusinessGoalSchema,
  insertBusinessMetricSchema,
  insertInitiativeSchema,
  insertAgentDirectiveSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  app.put("/api/agents/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const agent = await agentMonitor.updateAgentStatus(req.params.id, status);
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
      res.json(conflict);
    } catch (error) {
      res.status(500).json({ message: "Failed to resolve conflict" });
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

  app.get("/api/reports/:id/download", async (req, res) => {
    try {
      const report = await storage.getWeeklyReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Create a comprehensive report object with all details
      const fullReport = {
        id: report.id,
        period: report.period,
        generatedAt: report.generatedAt,
        overallScore: report.overallScore,
        grade: report.grade,
        agentStatuses: report.agentStatuses,
        conflictsDetected: report.conflictsDetected,
        conflictsResolved: report.conflictsResolved,
        strategicAlignment: report.strategicAlignment,
        recommendations: report.recommendations,
        highlights: report.highlights,
        metadata: {
          systemVersion: "1.0.0",
          reportType: "Weekly Intelligence Report",
          exportedAt: new Date().toISOString(),
          format: "JSON"
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="Weekly_Intelligence_Report_${report.period.replace(/[^a-zA-Z0-9]/g, '_')}.json"`);
      res.json(fullReport);
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

  // Simulate Agent Data Ingestion (for demo purposes)
  app.post("/api/chief-of-staff/simulate-data", async (req, res) => {
    try {
      await chiefOfStaff.simulateAgentDataIngestion();
      res.json({ message: "Agent data simulation completed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to simulate agent data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
