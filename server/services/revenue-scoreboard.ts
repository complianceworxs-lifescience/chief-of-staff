import fs from 'fs/promises';
import path from 'path';

const SCOREBOARD_PATH = path.join(process.cwd(), 'server', 'data', 'revenue-scoreboard.json');
const RESEARCH_STATE_PATH = path.join(process.cwd(), 'state', 'RESEARCH_MANDATE.json');

const CORE_NARRATIVE = {
  core: "Compliance is no longer overhead. Compliance is a measurable business asset.",
  hook: "Why Validation Teams Are Abandoning Traditional CSV",
  outcomes: ["Time Reclaimed", "Proof of ROI", "Professional Equity"],
  positioning: "We sell clarity in compliance, not just dashboards.",
  customerJourney: {
    step1: "Get a free tool (Compliance Velocity Scorecard)",
    step2: "Join the paid platform (Core Intelligence Platform)", 
    step3: "Let agents run core compliance + revenue insights"
  }
};

export interface RevenueMetrics {
  mrr: { current: number; target: number; trend: string; lastUpdated: string | null };
  arr: { current: number; target: number; trajectory: number; runway_months: number };
  cac: { current: number; target: number; payback_months: number };
  activation: { rate: number; target: number; step1_to_step2_conversion: number };
  churn: { monthly_rate: number; target: number; risk_accounts: string[]; at_risk_revenue: number };
  velocity: { leads_per_week: number; demos_per_week: number; trials_per_week: number; deals_closed_per_week: number; avg_deal_cycle_days: number };
  pipeline: { total_value: number; weighted_value: number; stages: { awareness: number; consideration: number; decision: number; negotiation: number } };
}

export interface RevenueScoreboard {
  version: string;
  lastUpdated: string;
  narrative: typeof CORE_NARRATIVE;
  metrics: RevenueMetrics;
  tiers: {
    clarity: { subscribers: number; mrr_contribution: number; avg_revenue_per_user: number };
    velocity: { subscribers: number; mrr_contribution: number; avg_revenue_per_user: number };
    asset: { subscribers: number; mrr_contribution: number; avg_revenue_per_user: number };
  };
  agentContributions: Record<string, { lastAction: string | null; revenueImpact: number }>;
  researchInsights: {
    icp: any | null;
    costOfInaction: any | null;
    alternatives: any | null;
    clarityHook: any | null;
    tierIIIJustification: any | null;
    lastSynced: string | null;
  };
}

class RevenueScoreboardService {
  private scoreboard: RevenueScoreboard | null = null;

  async load(): Promise<RevenueScoreboard> {
    try {
      const data = await fs.readFile(SCOREBOARD_PATH, 'utf-8');
      this.scoreboard = JSON.parse(data);
      return this.scoreboard!;
    } catch (error) {
      this.scoreboard = this.getDefaultScoreboard();
      await this.save();
      return this.scoreboard;
    }
  }

  async save(): Promise<void> {
    if (this.scoreboard) {
      this.scoreboard.lastUpdated = new Date().toISOString();
      await fs.writeFile(SCOREBOARD_PATH, JSON.stringify(this.scoreboard, null, 2));
    }
  }

  private getDefaultScoreboard(): RevenueScoreboard {
    return {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      narrative: CORE_NARRATIVE,
      metrics: {
        mrr: { current: 0, target: 41667, trend: "flat", lastUpdated: null },
        arr: { current: 0, target: 500000, trajectory: 0, runway_months: 12 },
        cac: { current: 0, target: 150, payback_months: 0 },
        activation: { rate: 0, target: 0.25, step1_to_step2_conversion: 0 },
        churn: { monthly_rate: 0, target: 0.02, risk_accounts: [], at_risk_revenue: 0 },
        velocity: { leads_per_week: 0, demos_per_week: 0, trials_per_week: 0, deals_closed_per_week: 0, avg_deal_cycle_days: 0 },
        pipeline: { total_value: 0, weighted_value: 0, stages: { awareness: 0, consideration: 0, decision: 0, negotiation: 0 } }
      },
      tiers: {
        clarity: { subscribers: 0, mrr_contribution: 0, avg_revenue_per_user: 0 },
        velocity: { subscribers: 0, mrr_contribution: 0, avg_revenue_per_user: 0 },
        asset: { subscribers: 0, mrr_contribution: 0, avg_revenue_per_user: 0 }
      },
      agentContributions: {
        cos: { lastAction: null, revenueImpact: 0 },
        strategist: { lastAction: null, revenueImpact: 0 },
        cmo: { lastAction: null, revenueImpact: 0 },
        cro: { lastAction: null, revenueImpact: 0 },
        contentManager: { lastAction: null, revenueImpact: 0 }
      },
      researchInsights: {
        icp: null,
        costOfInaction: null,
        alternatives: null,
        clarityHook: null,
        tierIIIJustification: null,
        lastSynced: null
      }
    };
  }

  async syncResearchInsights(): Promise<void> {
    await this.load();
    
    try {
      const researchData = await fs.readFile(RESEARCH_STATE_PATH, 'utf-8');
      const research = JSON.parse(researchData);
      
      if (research.synthesizedInsights) {
        this.scoreboard!.researchInsights = {
          icp: research.synthesizedInsights.icpProfile || null,
          costOfInaction: research.synthesizedInsights.costOfInaction || null,
          alternatives: research.synthesizedInsights.competitiveAlternatives || null,
          clarityHook: research.synthesizedInsights.clarityToolHook || null,
          tierIIIJustification: research.synthesizedInsights.tierIIIPriceJustification || null,
          lastSynced: new Date().toISOString()
        };
        await this.save();
        console.log('📊 REVENUE SCOREBOARD: Research insights synced successfully');
      }
    } catch (error) {
      console.log('📊 REVENUE SCOREBOARD: No research insights to sync yet');
    }
  }

  async updateMetric(category: keyof RevenueMetrics, updates: Partial<any>): Promise<void> {
    await this.load();
    if (this.scoreboard?.metrics[category]) {
      Object.assign(this.scoreboard.metrics[category], updates, { lastUpdated: new Date().toISOString() });
      await this.save();
    }
  }

  async recordAgentAction(agent: string, action: string, revenueImpact: number): Promise<void> {
    await this.load();
    if (this.scoreboard?.agentContributions[agent]) {
      this.scoreboard.agentContributions[agent] = {
        lastAction: action,
        revenueImpact: (this.scoreboard.agentContributions[agent].revenueImpact || 0) + revenueImpact
      };
      await this.save();
    }
  }

  async updateFromStripe(stripeData: { mrr?: number; subscribers?: Record<string, number> }): Promise<void> {
    await this.load();
    
    if (stripeData.mrr !== undefined) {
      const previousMrr = this.scoreboard!.metrics.mrr.current;
      this.scoreboard!.metrics.mrr.current = stripeData.mrr;
      this.scoreboard!.metrics.mrr.trend = stripeData.mrr > previousMrr ? 'up' : stripeData.mrr < previousMrr ? 'down' : 'flat';
      this.scoreboard!.metrics.mrr.lastUpdated = new Date().toISOString();
      this.scoreboard!.metrics.arr.current = stripeData.mrr * 12;
      this.scoreboard!.metrics.arr.trajectory = (stripeData.mrr * 12) / this.scoreboard!.metrics.arr.target;
    }
    
    if (stripeData.subscribers) {
      Object.entries(stripeData.subscribers).forEach(([tier, count]) => {
        const tierKey = tier.toLowerCase() as 'clarity' | 'velocity' | 'asset';
        if (this.scoreboard!.tiers[tierKey]) {
          this.scoreboard!.tiers[tierKey].subscribers = count;
        }
      });
    }
    
    await this.save();
    console.log('📊 REVENUE SCOREBOARD: Stripe data synced');
  }

  async getScoreboard(): Promise<RevenueScoreboard> {
    return await this.load();
  }

  async getNarrative(): Promise<typeof CORE_NARRATIVE> {
    return CORE_NARRATIVE;
  }

  async getAgentBrief(agent: string): Promise<{narrative: typeof CORE_NARRATIVE; metrics: RevenueMetrics; insights: any}> {
    await this.load();
    return {
      narrative: CORE_NARRATIVE,
      metrics: this.scoreboard!.metrics,
      insights: this.scoreboard!.researchInsights
    };
  }

  async calculateHealthScore(): Promise<{score: number; breakdown: Record<string, number>}> {
    await this.load();
    const metrics = this.scoreboard!.metrics;
    
    const mrrProgress = Math.min(100, (metrics.mrr.current / metrics.mrr.target) * 100);
    const activationHealth = Math.min(100, (metrics.activation.rate / metrics.activation.target) * 100);
    const churnHealth = Math.max(0, 100 - ((metrics.churn.monthly_rate / metrics.churn.target) * 100));
    const velocityScore = Math.min(100, metrics.velocity.leads_per_week * 10);
    
    const score = Math.round((mrrProgress + activationHealth + churnHealth + velocityScore) / 4);
    
    return {
      score,
      breakdown: {
        mrr_progress: Math.round(mrrProgress),
        activation_health: Math.round(activationHealth),
        churn_health: Math.round(churnHealth),
        velocity_score: Math.round(velocityScore)
      }
    };
  }
}

export const revenueScoreboard = new RevenueScoreboardService();
