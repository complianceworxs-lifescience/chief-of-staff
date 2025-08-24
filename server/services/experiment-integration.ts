import fs from "fs";
import path from "path";

// Types for experiment data structures
export interface ExperimentDefinition {
  id: string;
  page_slug: string;
  hypothesis: string;
  variants: Record<string, any>;
  run_until?: {
    min_sessions?: number;
    min_days?: number;
  };
  created_at?: string;
}

export interface ExperimentReport {
  id: string;
  page: string;
  hypothesis: string;
  summary: Record<string, {
    sessions: number;
    clicks: number;
    purchases: number;
    revenue: number;
    purchase_rate: number;
    ctr: number;
  }>;
}

export interface ExperimentAlert {
  ts: string;
  exp: string;
  variant: string;
  msg: string;
}

export class ExperimentIntegrationService {
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(process.cwd(), "data");
    this.ensureDataDirectory();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    
    // Initialize default files if they don't exist
    const files = {
      experiments: path.join(this.dataPath, "experiments.json"),
      ledger: path.join(this.dataPath, "attribution_ledger.json"),
      playbook: path.join(this.dataPath, "playbook.md"),
      alerts: path.join(this.dataPath, "alerts.json")
    };

    for (const [key, filePath] of Object.entries(files)) {
      if (!fs.existsSync(filePath)) {
        if (key === "playbook") {
          fs.writeFileSync(filePath, "# ComplianceWorxs Growth Playbook\n\n");
        } else {
          fs.writeFileSync(filePath, "[]");
        }
      }
    }
  }

  private readJSON(filename: string): any[] {
    const filePath = path.join(this.dataPath, filename);
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      return [];
    }
  }

  private writeJSON(filename: string, data: any): void {
    const filePath = path.join(this.dataPath, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // Thompson-sampling helpers
  private ensurePosteriors(exp: any) {
    exp.post = exp.post || {};
    for (const key of Object.keys(exp.variants)) {
      if (!exp.post[key]) {
        exp.post[key] = { 
          alpha: 1, 
          beta: 1, 
          revenue: 0, 
          purchases: 0, 
          clicks: 0, 
          sessions: 0 
        };
      }
    }
    return exp;
  }

  async createExperiment(experiment: ExperimentDefinition): Promise<any> {
    const experiments = this.readJSON("experiments.json");
    experiment.created_at = experiment.created_at || new Date().toISOString();
    
    const existingIndex = experiments.findIndex((e: any) => e.id === experiment.id);
    if (existingIndex >= 0) {
      experiments[existingIndex] = { ...experiments[existingIndex], ...experiment };
    } else {
      experiments.push(experiment);
    }
    
    this.writeJSON("experiments.json", experiments);
    return { ok: true, experiment };
  }

  async getExperimentReport(experimentId: string): Promise<ExperimentReport> {
    const experiments = this.readJSON("experiments.json");
    const exp = experiments.find((e: any) => e.id === experimentId);
    
    if (!exp) {
      throw new Error("Experiment not found");
    }

    const post = exp.post || {};
    const summary = Object.fromEntries(
      Object.entries(post).map(([k, v]: [string, any]) => [
        k,
        {
          sessions: v.sessions || 0,
          clicks: v.clicks || 0,
          purchases: v.purchases || 0,
          revenue: v.revenue || 0,
          purchase_rate: v.sessions ? (v.purchases / v.sessions) : 0,
          ctr: v.sessions ? (v.clicks / v.sessions) : 0
        }
      ])
    );

    return {
      id: exp.id,
      page: exp.page_slug,
      hypothesis: exp.hypothesis,
      summary
    };
  }

  async listExperiments(): Promise<any[]> {
    const experiments = this.readJSON("experiments.json");
    return experiments.map((e: any) => ({
      id: e.id,
      page: e.page_slug,
      created_at: e.created_at,
      variants: Object.keys(e.variants || {})
    }));
  }

  async promoteWinner(experimentId: string, winner: string): Promise<any> {
    const experiments = this.readJSON("experiments.json");
    const exp = experiments.find((e: any) => e.id === experimentId);
    
    if (!exp) {
      throw new Error("Experiment not found");
    }
    
    if (!exp.post || !exp.post[winner]) {
      throw new Error("Invalid winner variant");
    }

    const w = exp.post[winner];
    const playbookEntry = `## ${experimentId}
- Page: /${exp.page_slug}
- Winner: **${winner} – ${exp.variants[winner]?.label || ""}**
- Revenue: $${(w.revenue || 0).toFixed(2)} | Purchases: ${w.purchases} | CTR: ${(w.clicks / (w.sessions || 1) * 100).toFixed(1)}%
- Hypothesis: ${exp.hypothesis || ""}
- Next: iterate on message/placement that drove uplift.
\n`;

    const playbookPath = path.join(this.dataPath, "playbook.md");
    fs.appendFileSync(playbookPath, playbookEntry);
    
    return { ok: true, appended_to_playbook: true };
  }

  async getAlerts(): Promise<ExperimentAlert[]> {
    return this.readJSON("alerts.json");
  }

  async checkHealth(): Promise<any> {
    return { 
      status: "healthy", 
      service: "experiment-os-integrated", 
      timestamp: new Date().toISOString() 
    };
  }

  // Integration methods for autonomous agent system
  async createAbTestFromStrategy(plan: any): Promise<void> {
    // Automatically create A/B tests for strategies involving marketing
    if (plan.assignedAgents && plan.assignedAgents.includes('cmo') && plan.priority === 'high') {
      const experimentDef: ExperimentDefinition = {
        id: `auto_${plan.id}`,
        page_slug: "strategy-implementation",
        hypothesis: `Implementation of ${plan.title} will improve key performance metrics`,
        variants: {
          "control": { 
            label: "Current Approach", 
            description: "Continue with existing strategy" 
          },
          "strategic": { 
            label: "Strategic Plan", 
            description: plan.description 
          }
        }
      };
      
      await this.createExperiment(experimentDef);
      console.log(`🧪 Auto-created experiment for strategic plan: ${plan.title}`);
    }
  }

  // CMO Agent integration for marketing campaigns
  async createMarketingExperiment(campaign: any): Promise<string> {
    const experimentDef: ExperimentDefinition = {
      id: `marketing_${campaign.id}_${Date.now()}`,
      page_slug: campaign.targetPage || "homepage",
      hypothesis: `${campaign.hypothesis} will increase ${campaign.targetMetric}`,
      variants: campaign.variants || {
        "control": { label: "Original", description: "Current version" },
        "test": { label: "Optimized", description: campaign.description }
      }
    };

    await this.createExperiment(experimentDef);
    return experimentDef.id;
  }

  // Revenue attribution for CRO Agent
  async getRevenueAttribution(timeframe: string = "30d"): Promise<any> {
    const ledger = this.readJSON("attribution_ledger.json");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (timeframe === "30d" ? 30 : 7));

    const recentEvents = ledger.filter((event: any) => 
      new Date(event.ts) > cutoff && event.event === "purchase"
    );

    const byExperiment = recentEvents.reduce((acc: any, event: any) => {
      if (!acc[event.exp]) {
        acc[event.exp] = { revenue: 0, purchases: 0, variants: {} };
      }
      acc[event.exp].revenue += event.value || 0;
      acc[event.exp].purchases += 1;
      
      if (!acc[event.exp].variants[event.variant]) {
        acc[event.exp].variants[event.variant] = { revenue: 0, purchases: 0 };
      }
      acc[event.exp].variants[event.variant].revenue += event.value || 0;
      acc[event.exp].variants[event.variant].purchases += 1;
      
      return acc;
    }, {});

    return {
      timeframe,
      totalRevenue: Object.values(byExperiment).reduce((sum: number, exp: any) => sum + exp.revenue, 0),
      totalPurchases: Object.values(byExperiment).reduce((sum: number, exp: any) => sum + exp.purchases, 0),
      byExperiment
    };
  }
}

export const experimentIntegration = new ExperimentIntegrationService();