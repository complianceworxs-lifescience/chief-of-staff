import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { agentMonitor } from "./services/agent-monitor";
import { conflictResolver } from "./services/conflict-resolver";
import { reportGenerator } from "./services/report-generator";
import { insertConflictSchema, insertStrategicObjectiveSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
