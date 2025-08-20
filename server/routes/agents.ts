import express from "express";
import { getAgent, setAgent, listAgents, onChange, onMetricsChange, calculateMetrics } from "../state/store";
import type { AgentId, AgentState } from "../models/AgentState";

export const agentsRouter = express.Router();

// List all agents
agentsRouter.get("/", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ items: listAgents() });
});

// Get individual agent
agentsRouter.get("/:id", (req, res) => {
  const agent = getAgent(req.params.id as AgentId);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  
  res.setHeader("Cache-Control", "no-store");
  res.json(agent);
});

// Update agent state
agentsRouter.post("/:id", (req, res) => {
  const id = req.params.id as AgentId;
  const current = getAgent(id);
  if (!current) return res.status(404).json({ error: "Agent not found" });
  
  const updates = req.body;
  const updatedAgent = { ...current, ...updates, id };
  setAgent(updatedAgent);
  
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, state: getAgent(id) });
});

// Get system metrics
agentsRouter.get("/system/metrics", (_req, res) => {
  const metrics = calculateMetrics();
  res.setHeader("Cache-Control", "no-store");
  res.json(metrics);
});

// SSE stream for real-time updates
agentsRouter.get("/events/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

  // Send initial state
  res.write(`event: agents:init\n`);
  res.write(`data: ${JSON.stringify({ items: listAgents(), metrics: calculateMetrics() })}\n\n`);

  // Listen for agent updates
  const unsubscribeAgent = onChange((state) => {
    res.write(`event: agent:update\n`);
    res.write(`data: ${JSON.stringify(state)}\n\n`);
  });

  // Listen for metrics updates
  const unsubscribeMetrics = onMetricsChange((metrics) => {
    res.write(`event: metrics:update\n`);
    res.write(`data: ${JSON.stringify(metrics)}\n\n`);
  });

  // Cleanup on client disconnect
  req.on("close", () => {
    unsubscribeAgent();
    unsubscribeMetrics();
  });

  req.on("error", () => {
    unsubscribeAgent();
    unsubscribeMetrics();
  });
});

// Bulk update multiple agents (useful for system-wide operations)
agentsRouter.post("/bulk-update", (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, ...stateUpdates }
    const results = [];

    for (const update of updates) {
      const { id, ...stateUpdates } = update;
      const current = getAgent(id as AgentId);
      if (current) {
        const updatedAgent = { ...current, ...stateUpdates, id };
        setAgent(updatedAgent);
        results.push(getAgent(id as AgentId));
      }
    }

    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, updated: results });
  } catch (error) {
    res.status(500).json({ error: "Bulk update failed" });
  }
});