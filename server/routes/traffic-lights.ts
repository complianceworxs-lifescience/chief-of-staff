// Autonomy Traffic Light KPIs API
import { Router } from "express";

const router = Router();

// Traffic Light KPIs endpoint
router.get("/", (req, res) => {
  // Simulate current KPI data based on our autonomous system performance
  const kpis = [
    {
      id: "auto_resolve_rate",
      title: "Auto-Resolve Rate",
      value: 0.91, // 91% - GREEN
      unit: "ratio",
      thresholds: { green_min: 0.85, yellow_min: 0.70 },
      trend_24h: 0.03,
      detail_href: "/logs/lineage?filter=auto_resolve",
      updated_at: new Date().toISOString()
    },
    {
      id: "mttr_minutes",
      title: "MTTR (min)",
      value: 3.8, // 3.8 minutes - GREEN
      unit: "minutes", 
      thresholds: { green_max: 5, yellow_max: 10 },
      trend_24h: -0.6,
      detail_href: "/logs/lineage?filter=mttr",
      updated_at: new Date().toISOString()
    },
    {
      id: "escalations_per_day",
      title: "Escalations / Day",
      value: 4, // 4 per day - GREEN
      unit: "count",
      thresholds: { green_max: 5, yellow_max: 10 },
      trend_24h: -1,
      detail_href: "/logs/lineage?filter=escalations", 
      updated_at: new Date().toISOString()
    }
  ];

  res.json({ kpis });
});

export default router;