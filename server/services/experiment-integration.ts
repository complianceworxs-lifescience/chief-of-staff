import fetch from 'node-fetch';

export interface ExperimentDefinition {
  id: string;
  page_slug: string;
  hypothesis: string;
  metric: string;
  variants: Record<string, any>;
  run_until?: {
    min_sessions?: number;
    min_days?: number;
  };
  guardrails?: Record<string, any>;
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

class ExperimentIntegrationService {
  private readonly baseUrl: string;
  private readonly adminToken: string;

  constructor() {
    this.baseUrl = `http://localhost:${process.env.EXP_PORT || 3001}`;
    this.adminToken = process.env.ADMIN_TOKEN || "cw-chief-of-staff-2025";
  }

  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.adminToken}`,
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Experiment OS API error: ${(error as Error).message}`);
      throw error;
    }
  }

  async createExperiment(experiment: ExperimentDefinition): Promise<any> {
    return this.makeRequest('/xp/define', {
      method: 'POST',
      body: JSON.stringify(experiment)
    });
  }

  async getExperimentReport(experimentId: string): Promise<ExperimentReport> {
    return this.makeRequest(`/xp/report?exp=${encodeURIComponent(experimentId)}`) as Promise<ExperimentReport>;
  }

  async listExperiments(): Promise<any[]> {
    return this.makeRequest('/xp/overview') as Promise<any[]>;
  }

  async promoteWinner(experimentId: string, winner: string): Promise<any> {
    return this.makeRequest('/xp/promote', {
      method: 'POST',
      body: JSON.stringify({ exp: experimentId, winner })
    });
  }

  async getAlerts(): Promise<ExperimentAlert[]> {
    return this.makeRequest('/alerts') as Promise<ExperimentAlert[]>;
  }

  async checkHealth(): Promise<any> {
    return this.makeRequest('/health');
  }

  // Auto-create experiment from strategic plan
  async createExperimentFromPlan(plan: any): Promise<string> {
    const experimentId = `exp_${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, '0')}_${plan.title.toLowerCase().replace(/\s+/g, '_')}`;
    
    const experiment: ExperimentDefinition = {
      id: experimentId,
      page_slug: this.inferPageSlug(plan),
      hypothesis: `Implementation of "${plan.title}" will improve key performance metrics`,
      metric: 'revenue',
      variants: {
        A: { label: 'Control', description: 'Current approach' },
        B: { label: 'Strategic Plan', description: plan.description }
      },
      run_until: {
        min_sessions: 120,
        min_days: 7
      },
      guardrails: {
        max_bounce_increase: 0.10,
        max_revenue_decrease: 0.05
      }
    };

    await this.createExperiment(experiment);
    return experimentId;
  }

  private inferPageSlug(plan: any): string {
    // Simple inference based on plan content
    const title = plan.title.toLowerCase();
    if (title.includes('revenue') || title.includes('pricing')) return 'pricing';
    if (title.includes('marketing') || title.includes('content')) return 'home';
    if (title.includes('retention') || title.includes('customer')) return 'dashboard';
    return 'home';
  }
}

export const experimentIntegration = new ExperimentIntegrationService();