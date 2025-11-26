/**
 * COMPLIANCEWORXS — ADVANCED CAPABILITY PACK v1.0 (Compressed)
 * Token-optimized directive for machine ingestion
 * 35-50% more token-efficient than full version
 */

export interface CompressedDirective {
  version: string;
  purpose: string;
  capabilities: CapabilityDirective[];
  integrationRules: string[];
  cosEnforcement: string[];
}

export interface CapabilityDirective {
  id: string;
  name: string;
  owners: string[];
  mandates: string[];
  output: string;
  successCriteria: string;
}

export interface ExecutionMilestone {
  id: string;
  agent: string;
  task: string;
  phase: '0-24h' | '24-48h' | '48-72h';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  startedAt?: string;
  completedAt?: string;
  blockedReason?: string;
}

export interface ExecutionPlan {
  sprintId: string;
  startedAt: string;
  endsAt: string;
  currentPhase: '0-24h' | '24-48h' | '48-72h';
  milestones: ExecutionMilestone[];
  phaseObjectives: {
    phase: string;
    objective: string;
  }[];
}

class CompressedDirectiveService {
  private directive: CompressedDirective;
  private executionPlan: ExecutionPlan | null = null;
  private sprintStartTime: Date | null = null;

  constructor() {
    this.directive = {
      version: "ACP-v1.0-COMPRESSED",
      purpose: "Activate three capabilities inside v1.5",
      capabilities: [
        {
          id: "rpm",
          name: "Revenue Predictive Model",
          owners: ["Strategist", "Librarian"],
          mandates: [
            "Librarian:build_RPM_Layer→signals,micro-offers,CTAs,objections,VQS_deltas,committee_friction,campaign_data",
            "Strategist:define_risk_adjusted_prediction_logic",
            "Output@24h:7day_forecast,confidence_score,bottlenecks,interventions"
          ],
          output: "Daily risk-adjusted 7-day revenue forecast",
          successCriteria: "Continuous forecast drives CRO+CoS decisions"
        },
        {
          id: "aoo",
          name: "Autonomous Offer Optimization",
          owners: ["CRO", "CMO"],
          mandates: [
            "CRO:continuous_AB_tests→Tier1/2_offers,RR_messages,CTA_timing,sequence_order",
            "CMO:log_dark_social+LinkedIn_engagement→Unified_Data_Layer",
            "Librarian:log_variants+results",
            "Strategist:enforce_VQS_bounds",
            "Output@weekly:best_variant,remove_failures,next_tests,projected_lift"
          ],
          output: "Weekly Offer Optimization Report",
          successCriteria: "New winning variant every 7 days"
        },
        {
          id: "cir",
          name: "Compliance Intelligence Reports",
          owners: ["Content Manager", "Librarian"],
          mandates: [
            "Librarian:synthesize→audit_risk,doc_gap_rates,operator_benchmarks,objections,workload_deltas,ecosystem_engagement",
            "ContentManager:produce→monthly_report,subscription_product,LinkedIn_teaser,dark_social_asset",
            "Strategist:validate_VQS_safety",
            "CoS:add_to_monthly_cycle"
          ],
          output: "Monthly intelligence report + subscription product",
          successCriteria: "Recurring revenue intelligence asset"
        }
      ],
      integrationRules: [
        "USE:Unified_Data_Layer",
        "USE:VQS_safe_metrics",
        "FEED:Weekly_Revenue_Sprints",
        "UPDATE:CoS_Dashboard",
        "USE:Objection_Loop",
        "RUN:autonomous(no_human_prompting)"
      ],
      cosEnforcement: [
        "ACTIVATE:all_three_immediately",
        "ASSIGN:ODAR_cycles→all_owners",
        "INITIATE:72h_integration_sprint",
        "CONFIRM:'ACP_v1.0_Activated'",
        "ADD:weekly/monthly/quarterly_cycles",
        "TRACK:L5_maturity_markers"
      ]
    };
  }

  getDirective(): CompressedDirective {
    return this.directive;
  }

  getTokenCount(): number {
    const json = JSON.stringify(this.directive);
    return Math.ceil(json.length / 4);
  }

  initiate72HourSprint(): ExecutionPlan {
    const now = new Date();
    const endsAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    this.sprintStartTime = now;

    this.executionPlan = {
      sprintId: `sprint_${Date.now()}`,
      startedAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      currentPhase: '0-24h',
      phaseObjectives: [
        { phase: '0-24h', objective: 'INSTALL + LINK DATA' },
        { phase: '24-48h', objective: 'EXECUTE + TEST' },
        { phase: '48-72h', objective: 'OPTIMIZE + SYNTHESIZE' }
      ],
      milestones: this.generateMilestones()
    };

    console.log(`🚀 72-HOUR SPRINT INITIATED: ${this.executionPlan.sprintId}`);
    console.log(`   Start: ${now.toISOString()}`);
    console.log(`   End: ${endsAt.toISOString()}`);

    return this.executionPlan;
  }

  private generateMilestones(): ExecutionMilestone[] {
    return [
      // Phase 0-24h: INSTALL + LINK DATA
      { id: 'm1', agent: 'CoS', task: 'Trigger activation of ACP v1.0', phase: '0-24h', status: 'completed' },
      { id: 'm2', agent: 'CoS', task: 'Assign ODAR cycles to all capability owners', phase: '0-24h', status: 'completed' },
      { id: 'm3', agent: 'CoS', task: 'Require first RPM+AOO+CIR status check-in', phase: '0-24h', status: 'in_progress' },
      { id: 'm4', agent: 'Librarian', task: 'Build RPM Layer in Unified Data Layer', phase: '0-24h', status: 'in_progress' },
      { id: 'm5', agent: 'Librarian', task: 'Start logging: offer variants, micro-offers, objections, signals', phase: '0-24h', status: 'in_progress' },
      { id: 'm6', agent: 'Librarian', task: 'Validate schema integrity', phase: '0-24h', status: 'pending' },
      { id: 'm7', agent: 'Strategist', task: 'Load risk-adjusted prediction logic (VQS-safe)', phase: '0-24h', status: 'in_progress' },
      { id: 'm8', agent: 'Strategist', task: 'Approve initial A/B test parameters', phase: '0-24h', status: 'pending' },
      { id: 'm9', agent: 'Strategist', task: 'Provide Offer Ladder constraints', phase: '0-24h', status: 'pending' },
      { id: 'm10', agent: 'CRO', task: 'Identify 3 micro-offers for A/B rotation', phase: '0-24h', status: 'pending' },
      { id: 'm11', agent: 'CRO', task: 'Load Tier 2 accelerator for testing', phase: '0-24h', status: 'pending' },
      { id: 'm12', agent: 'CRO', task: 'Register baseline conversion map with Librarian', phase: '0-24h', status: 'pending' },
      { id: 'm13', agent: 'CMO', task: 'Tag last 7 days of engagement for RPM ingestion', phase: '0-24h', status: 'pending' },
      { id: 'm14', agent: 'CMO', task: 'Set signal detection rules (lurkers→engagers)', phase: '0-24h', status: 'pending' },
      { id: 'm15', agent: 'Content Manager', task: 'Prepare CIR template skeleton (monthly+teaser+dark-social)', phase: '0-24h', status: 'pending' },

      // Phase 24-48h: EXECUTE + TEST
      { id: 'm16', agent: 'CRO', task: 'Launch A/B test #1 (Tier 1 micro-offer)', phase: '24-48h', status: 'pending' },
      { id: 'm17', agent: 'CRO', task: 'Launch A/B test #2 (Risk-Reversal message variant)', phase: '24-48h', status: 'pending' },
      { id: 'm18', agent: 'CRO', task: 'Begin 72-hour CTA window for Sprint', phase: '24-48h', status: 'pending' },
      { id: 'm19', agent: 'CMO', task: 'Publish Proof→Insight pair to stimulate engagement divergence', phase: '24-48h', status: 'pending' },
      { id: 'm20', agent: 'CMO', task: 'Log incoming signals in Unified Data Layer', phase: '24-48h', status: 'pending' },
      { id: 'm21', agent: 'Librarian', task: 'Begin ingestion of live A/B results', phase: '24-48h', status: 'pending' },
      { id: 'm22', agent: 'Librarian', task: 'Cluster objections for Strategist review', phase: '24-48h', status: 'pending' },
      { id: 'm23', agent: 'Strategist', task: 'Run first RPM forecast', phase: '24-48h', status: 'pending' },
      { id: 'm24', agent: 'Strategist', task: 'Identify friction hotspots affecting CRO tests', phase: '24-48h', status: 'pending' },
      { id: 'm25', agent: 'Strategist', task: 'Approve next-step experimental branches', phase: '24-48h', status: 'pending' },
      { id: 'm26', agent: 'Content Manager', task: 'Generate draft CIR: audit risk, workload benchmarks, objection summary', phase: '24-48h', status: 'pending' },

      // Phase 48-72h: OPTIMIZE + SYNTHESIZE
      { id: 'm27', agent: 'CRO', task: 'Evaluate A/B results with Librarian', phase: '48-72h', status: 'pending' },
      { id: 'm28', agent: 'CRO', task: 'Select provisional winner', phase: '48-72h', status: 'pending' },
      { id: 'm29', agent: 'CRO', task: 'Prepare for iteration #2', phase: '48-72h', status: 'pending' },
      { id: 'm30', agent: 'CRO', task: 'Feed updated data into Revenue Sprint pipeline', phase: '48-72h', status: 'pending' },
      { id: 'm31', agent: 'CMO', task: 'Run signal density boost post', phase: '48-72h', status: 'pending' },
      { id: 'm32', agent: 'CMO', task: 'Engage 5 high-intent operators for pattern testing', phase: '48-72h', status: 'pending' },
      { id: 'm33', agent: 'Librarian', task: 'Produce unified 72h data block for RPM+CIR', phase: '48-72h', status: 'pending' },
      { id: 'm34', agent: 'Strategist', task: 'Produce updated RPM forecast for CoS', phase: '48-72h', status: 'pending' },
      { id: 'm35', agent: 'Strategist', task: 'Prioritize interventions for next 7 days', phase: '48-72h', status: 'pending' },
      { id: 'm36', agent: 'Strategist', task: 'Flag any VQS violations', phase: '48-72h', status: 'pending' },
      { id: 'm37', agent: 'Content Manager', task: 'Finalize CIR v1 draft', phase: '48-72h', status: 'pending' },
      { id: 'm38', agent: 'Content Manager', task: 'Produce LinkedIn teaser + dark-social asset', phase: '48-72h', status: 'pending' },
      { id: 'm39', agent: 'Content Manager', task: 'Coordinate with CMO for controlled release', phase: '48-72h', status: 'pending' },
      { id: 'm40', agent: 'CoS', task: 'Ensure all capabilities feed into CoS Dashboard', phase: '48-72h', status: 'pending' },
      { id: 'm41', agent: 'CoS', task: 'Reallocate resources based on bottlenecks', phase: '48-72h', status: 'pending' },
      { id: 'm42', agent: 'CoS', task: 'Complete 72h activation review', phase: '48-72h', status: 'pending' },
      { id: 'm43', agent: 'CoS', task: 'Issue Week 1 optimization brief', phase: '48-72h', status: 'pending' }
    ];
  }

  getExecutionPlan(): ExecutionPlan | null {
    if (!this.executionPlan) {
      this.initiate72HourSprint();
    }
    return this.executionPlan;
  }

  getCurrentPhase(): '0-24h' | '24-48h' | '48-72h' | 'completed' {
    if (!this.sprintStartTime) return '0-24h';
    
    const now = new Date();
    const hoursElapsed = (now.getTime() - this.sprintStartTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursElapsed < 24) return '0-24h';
    if (hoursElapsed < 48) return '24-48h';
    if (hoursElapsed < 72) return '48-72h';
    return 'completed';
  }

  updateMilestoneStatus(milestoneId: string, status: ExecutionMilestone['status'], blockedReason?: string): ExecutionMilestone | null {
    if (!this.executionPlan) return null;
    
    const milestone = this.executionPlan.milestones.find(m => m.id === milestoneId);
    if (!milestone) return null;

    milestone.status = status;
    if (status === 'in_progress') {
      milestone.startedAt = new Date().toISOString();
    } else if (status === 'completed') {
      milestone.completedAt = new Date().toISOString();
    } else if (status === 'blocked') {
      milestone.blockedReason = blockedReason;
    }

    console.log(`📋 MILESTONE ${milestoneId}: ${milestone.agent} → ${status}`);
    return milestone;
  }

  getSprintProgress(): {
    phase: string;
    hoursElapsed: number;
    hoursRemaining: number;
    completedMilestones: number;
    totalMilestones: number;
    percentComplete: number;
    byAgent: Record<string, { completed: number; total: number; inProgress: number; blocked: number }>;
    byPhase: Record<string, { completed: number; total: number }>;
  } {
    const plan = this.getExecutionPlan();
    if (!plan || !this.sprintStartTime) {
      return {
        phase: '0-24h',
        hoursElapsed: 0,
        hoursRemaining: 72,
        completedMilestones: 0,
        totalMilestones: 43,
        percentComplete: 0,
        byAgent: {},
        byPhase: {}
      };
    }

    const now = new Date();
    const hoursElapsed = Math.round((now.getTime() - this.sprintStartTime.getTime()) / (1000 * 60 * 60) * 10) / 10;
    const hoursRemaining = Math.max(0, 72 - hoursElapsed);

    const completed = plan.milestones.filter(m => m.status === 'completed').length;
    const total = plan.milestones.length;

    const byAgent: Record<string, { completed: number; total: number; inProgress: number; blocked: number }> = {};
    const byPhase: Record<string, { completed: number; total: number }> = {};

    for (const m of plan.milestones) {
      if (!byAgent[m.agent]) {
        byAgent[m.agent] = { completed: 0, total: 0, inProgress: 0, blocked: 0 };
      }
      byAgent[m.agent].total++;
      if (m.status === 'completed') byAgent[m.agent].completed++;
      if (m.status === 'in_progress') byAgent[m.agent].inProgress++;
      if (m.status === 'blocked') byAgent[m.agent].blocked++;

      if (!byPhase[m.phase]) {
        byPhase[m.phase] = { completed: 0, total: 0 };
      }
      byPhase[m.phase].total++;
      if (m.status === 'completed') byPhase[m.phase].completed++;
    }

    return {
      phase: this.getCurrentPhase(),
      hoursElapsed,
      hoursRemaining,
      completedMilestones: completed,
      totalMilestones: total,
      percentComplete: Math.round((completed / total) * 100),
      byAgent,
      byPhase
    };
  }

  getAgentTasks(agent: string): ExecutionMilestone[] {
    const plan = this.getExecutionPlan();
    if (!plan) return [];
    return plan.milestones.filter(m => m.agent === agent);
  }

  getPhaseTasks(phase: '0-24h' | '24-48h' | '48-72h'): ExecutionMilestone[] {
    const plan = this.getExecutionPlan();
    if (!plan) return [];
    return plan.milestones.filter(m => m.phase === phase);
  }

  getBlockedMilestones(): ExecutionMilestone[] {
    const plan = this.getExecutionPlan();
    if (!plan) return [];
    return plan.milestones.filter(m => m.status === 'blocked');
  }

  getExpectedOutcomes(): string[] {
    return [
      "All three capabilities: Activated",
      "All three capabilities: Integrated",
      "All three capabilities: Logging",
      "All three capabilities: Forecasting",
      "All three capabilities: A/B testing",
      "All three capabilities: Producing revenue insights",
      "All three capabilities: Contributing to recurring revenue assets",
      "All three capabilities: Feeding unified CoS dashboard",
      "All three capabilities: Creating lift in emergency revenue campaign"
    ];
  }
}

export const compressedDirective = new CompressedDirectiveService();
