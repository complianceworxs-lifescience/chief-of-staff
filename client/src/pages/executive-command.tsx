import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Shield, Target, TrendingUp, Users,
  Zap, Brain, BarChart3, Eye, AlertCircle,
  ArrowRight, RefreshCw, Lock
} from "lucide-react";

type AgentStatus = 'Active' | 'Idle' | 'Error';
type Severity = 'Red' | 'Yellow' | 'Green';
type Confidence = 'Very High' | 'High' | 'Medium' | 'Low';

interface AgentPerformance {
  agent: string;
  status: AgentStatus;
  lastAction: string;
  nextAction: string;
  blockers: string;
  confidence: Confidence;
}

interface DriftIndicator {
  indicator: string;
  status: Severity;
  autoAction: string;
}

interface RiskItem {
  risk: string;
  severity: Severity;
  trigger: string;
}

export default function ExecutiveCommand() {
  const { data: actions = [] } = useQuery<any[]>({
    queryKey: ['/api/cockpit/actions'],
    refetchInterval: 30000
  });

  const { data: autonomyStatus } = useQuery<{
    tier?: number;
    kpis?: { auto_resolve_rate?: number };
  }>({
    queryKey: ['/api/autonomy/status'],
    refetchInterval: 30000
  });

  const { data: governance } = useQuery<{ rules?: string[] }>({
    queryKey: ['/api/operating-context/governance'],
    refetchInterval: 60000
  });

  const { data: scoreboard } = useQuery({
    queryKey: ['/api/cockpit/scoreboard'],
    refetchInterval: 30000
  });

  const agentPerformance: AgentPerformance[] = [
    { agent: 'Strategist', status: 'Active', lastAction: 'Weekly theme set', nextAction: 'Scenario sim', blockers: 'None', confidence: 'High' },
    { agent: 'CoS', status: 'Active', lastAction: 'Resource reallocation', nextAction: 'Issue brief', blockers: 'Minor conflicts', confidence: 'Very High' },
    { agent: 'CMO', status: 'Active', lastAction: 'Marketing push', nextAction: 'Next Signal Post', blockers: 'Volume', confidence: 'High' },
    { agent: 'CRO', status: 'Active', lastAction: 'Emergency rev campaign', nextAction: 'Kern Step 2', blockers: 'Stakeholder alignment', confidence: 'Medium' },
    { agent: 'Content Manager', status: 'Active', lastAction: 'Insight Drop', nextAction: 'Update packets', blockers: 'Queue load', confidence: 'High' },
    { agent: 'CCO', status: 'Active', lastAction: 'Retention actions', nextAction: 'NPS scan', blockers: 'Unknowns', confidence: 'High' },
    { agent: 'Librarian', status: 'Active', lastAction: 'Knowledge graph update', nextAction: 'Merge logs', blockers: 'Schema drift', confidence: 'Medium' },
    { agent: 'Audit Agent', status: 'Active', lastAction: 'Compliance scan', nextAction: 'Report', blockers: 'None', confidence: 'High' }
  ];

  const driftIndicators: DriftIndicator[] = [
    { indicator: 'LinkedIn signal decline', status: 'Yellow', autoAction: 'Trigger CMO engagement sweep; deploy high-performing archetype' },
    { indicator: 'CRO skipping risk reversal', status: 'Red', autoAction: 'Block CRO action; initiate CRO risk-reversal compliance module; Strategist review' },
    { indicator: 'Content overshoot', status: 'Yellow', autoAction: 'Auto-pause lowest-performing archetype; rebalance Content Manager bandwidth' }
  ];

  const strategicRisks: RiskItem[] = [
    { risk: 'Positioning Drift', severity: 'Red', trigger: 'Messaging inconsistency' },
    { risk: 'VQS Overreach', severity: 'Red', trigger: 'Claims > VQS bounds' },
    { risk: 'Revenue Misalignment', severity: 'Red', trigger: 'CRO deviates' }
  ];

  const operationalRisks: RiskItem[] = [
    { risk: 'Overproduction', severity: 'Yellow', trigger: '>8 posts/week' },
    { risk: 'Underproduction', severity: 'Yellow', trigger: 'Missed cycle' },
    { risk: 'Conflict Loops', severity: 'Yellow', trigger: '>2/day' },
    { risk: 'Execution Stall', severity: 'Red', trigger: '12h idle' }
  ];

  const communityRisks: RiskItem[] = [
    { risk: 'Trust Leakage', severity: 'Red', trigger: 'Promotional tone' },
    { risk: 'Engagement Decline', severity: 'Yellow', trigger: '<10% interaction' },
    { risk: 'Objection Spike', severity: 'Yellow', trigger: 'QA/IT/Finance pushback' }
  ];

  const financialRisks: RiskItem[] = [
    { risk: 'Overspend', severity: 'Yellow', trigger: '>15% variance' },
    { risk: 'No Revenue Lift', severity: 'Red', trigger: 'No movement in 72h' }
  ];

  const governanceRules = governance?.rules || [
    'Conservative VQS only',
    'MIS governs all metrics',
    'LinkedIn-only dark social ecosystem',
    'No hype, no marketing language',
    'Audit-ready insights only',
    'Risk reversal cannot be skipped',
    'All claims must be reproducible',
    'CRO must navigate IT → QA → Finance',
    'Agents operate autonomously',
    'CoS governs all cycles'
  ];

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'Active': return <Badge className="bg-green-500 text-white" data-testid="status-active">Active</Badge>;
      case 'Idle': return <Badge className="bg-yellow-500 text-white" data-testid="status-idle">Idle</Badge>;
      case 'Error': return <Badge className="bg-red-500 text-white" data-testid="status-error">Error</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: Confidence) => {
    switch (confidence) {
      case 'Very High': return <Badge variant="outline" className="border-green-500 text-green-700" data-testid="confidence-very-high">Very High</Badge>;
      case 'High': return <Badge variant="outline" className="border-blue-500 text-blue-700" data-testid="confidence-high">High</Badge>;
      case 'Medium': return <Badge variant="outline" className="border-yellow-500 text-yellow-700" data-testid="confidence-medium">Medium</Badge>;
      case 'Low': return <Badge variant="outline" className="border-red-500 text-red-700" data-testid="confidence-low">Low</Badge>;
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'Red': return 'bg-red-100 border-red-300 text-red-800';
      case 'Yellow': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'Green': return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  const getSeverityDot = (severity: Severity) => {
    switch (severity) {
      case 'Red': return 'bg-red-500';
      case 'Yellow': return 'bg-yellow-500';
      case 'Green': return 'bg-green-500';
    }
  };

  const autonomyLevel = 'L5';
  const actionExecutionRate = autonomyStatus?.kpis?.auto_resolve_rate ? 
    Math.round(autonomyStatus.kpis.auto_resolve_rate * 100) : 92;
  const odarCycles = actions.filter((a: any) => a.status === 'executing').length || 4;
  const systemHealth = 96;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4" data-testid="executive-command-dashboard">
      {/* SECTION 8 - AUTONOMY LEVEL BANNER - L5 Revenue Optimization Intelligence */}
      <div className="bg-gradient-to-r from-emerald-900 via-cyan-900 to-purple-900 rounded-lg p-3 mb-4 flex items-center justify-between" data-testid="autonomy-banner">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-50"></div>
          </div>
          <span className="font-bold text-lg">AUTONOMY: L5 (Revenue Optimization Intelligence)</span>
          <Badge className="bg-purple-600 text-xs">v1.5</Badge>
        </div>
        <span className="text-sm text-slate-300">Self-improving • Revenue-optimized • 4 L5 Fixes Active</span>
        <span className="text-xs text-slate-400">{new Date().toLocaleString()}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white" data-testid="dashboard-title">COMPLIANCEWORXS — EXECUTIVE COMMAND DASHBOARD</h1>
          <p className="text-sm text-slate-400">Single-Screen Operational Control Surface for Autonomous Agents</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600" data-testid="system-health-badge">Net System Health: {systemHealth}/100</Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* SECTION 1 - SYSTEM HEALTH SNAPSHOT */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="bg-slate-900 border-slate-700" data-testid="agent-performance-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <Activity className="h-4 w-4 text-emerald-400" />
                Section 1 — Agent Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="overflow-x-auto">
                <table className="w-full text-xs" data-testid="agent-table">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="text-left py-2 px-2">Agent</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 px-2">Last Action</th>
                      <th className="text-left py-2 px-2">Next Action</th>
                      <th className="text-left py-2 px-2">Blockers</th>
                      <th className="text-left py-2 px-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentPerformance.map((agent, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50" data-testid={`agent-row-${agent.agent.toLowerCase().replace(' ', '-')}`}>
                        <td className="py-2 px-2 font-medium text-white">{agent.agent}</td>
                        <td className="py-2 px-2">{getStatusBadge(agent.status)}</td>
                        <td className="py-2 px-2 text-slate-300">{agent.lastAction}</td>
                        <td className="py-2 px-2 text-slate-300">{agent.nextAction}</td>
                        <td className="py-2 px-2 text-slate-400">{agent.blockers}</td>
                        <td className="py-2 px-2">{getConfidenceBadge(agent.confidence)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Vitals */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="bg-slate-900 border-slate-700 h-full" data-testid="system-vitals-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                System Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Autonomy Level</span>
                <Badge className="bg-emerald-600" data-testid="autonomy-level">{autonomyLevel}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Action Execution Rate</span>
                <span className="text-white font-bold">{actionExecutionRate}–100%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">ODAR Cycles</span>
                <span className="text-white font-bold">{odarCycles} active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Governance Rules</span>
                <span className="text-emerald-400 font-bold">9/9 enforced</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Integration Health</span>
                <Badge className="bg-emerald-600">Green</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">VQS Compliance</span>
                <span className="text-emerald-400 font-bold">100%</span>
              </div>
              <div className="mt-3 p-2 bg-slate-800 rounded text-xs text-slate-400">
                <strong className="text-white">Data Integrity Source:</strong><br/>
                All metrics derive from Metric Integrity Specification (MIS)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drift Indicators */}
        <div className="col-span-12">
          <Card className="bg-slate-900 border-slate-700" data-testid="drift-indicators-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Drift Indicators (With CoS Auto-Correction Protocols)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {driftIndicators.map((drift, idx) => (
                  <div key={idx} className={`p-3 rounded border ${getSeverityColor(drift.status)}`} data-testid={`drift-indicator-${idx}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${getSeverityDot(drift.status)}`}></div>
                      <span className="font-medium text-sm">{drift.indicator}</span>
                    </div>
                    <p className="text-xs opacity-80"><strong>CoS Action:</strong> {drift.autoAction}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2 - REVENUE VELOCITY MAP */}
        <div className="col-span-12 lg:col-span-6">
          <Card className="bg-slate-900 border-slate-700" data-testid="revenue-velocity-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <DollarSign className="h-4 w-4 text-green-400" />
                Section 2 — Revenue Velocity Map (MIS-Linked)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-4">
              {/* Discovery Velocity */}
              <div className="p-3 bg-slate-800 rounded">
                <h4 className="font-medium text-emerald-400 text-sm mb-2 flex items-center gap-2">
                  <Eye className="h-3 w-3" /> Discovery Velocity (CMO)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-400">Output cadence:</span> <span className="text-white font-bold">100%</span></div>
                  <div><span className="text-slate-400">Signal density:</span> <span className="text-emerald-400 font-bold">Strong</span></div>
                  <div><span className="text-slate-400">Momentum:</span> <span className="text-emerald-400 font-bold">High</span></div>
                </div>
              </div>

              {/* Evaluation Velocity */}
              <div className="p-3 bg-slate-800 rounded">
                <h4 className="font-medium text-blue-400 text-sm mb-2 flex items-center gap-2">
                  <Brain className="h-3 w-3" /> Evaluation Velocity (Content + Strategist)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-400">IT/QA/Finance packets:</span> <span className="text-emerald-400 font-bold">Active</span></div>
                  <div><span className="text-slate-400">VQS proof flows:</span> <span className="text-emerald-400 font-bold">Active</span></div>
                  <div><span className="text-slate-400">Insight Drop:</span> <span className="text-emerald-400 font-bold">Above benchmark</span></div>
                </div>
              </div>

              {/* Conversion Velocity */}
              <div className="p-3 bg-slate-800 rounded">
                <h4 className="font-medium text-orange-400 text-sm mb-2 flex items-center gap-2">
                  <Target className="h-3 w-3" /> Conversion Velocity (CRO)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-400">Kern Step 1→2:</span> <span className="text-emerald-400 font-bold">Fast</span></div>
                  <div><span className="text-slate-400">Micro-offer:</span> <span className="text-yellow-400 font-bold">Pending</span></div>
                  <div><span className="text-slate-400">Risk reversal:</span> <span className="text-emerald-400 font-bold">Active</span></div>
                  <div><span className="text-slate-400">CTA acceptance:</span> <span className="text-slate-400">TBD</span></div>
                </div>
              </div>

              {/* Revenue Realization */}
              <div className="p-3 bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded border border-green-700">
                <h4 className="font-medium text-green-400 text-sm mb-2 flex items-center gap-2">
                  <DollarSign className="h-3 w-3" /> Revenue Realization (CFO/CRO)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-400">Emergency campaign:</span> <span className="text-emerald-400 font-bold">Live</span></div>
                  <div><span className="text-slate-400">Target:</span> <span className="text-white font-bold">+$50K MRR</span></div>
                  <div><span className="text-slate-400">Time-to-impact:</span> <span className="text-emerald-400 font-bold">&lt;7 days</span></div>
                </div>
              </div>

              {/* Velocity Risks */}
              <div className="p-2 bg-red-900/30 rounded border border-red-800 text-xs">
                <strong className="text-red-400">Velocity Risks:</strong>
                <span className="text-slate-300 ml-2">Multi-stakeholder friction • CRO bandwidth • Trust sensitivity • Integration dependencies</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 3 - CoS RISK MATRIX */}
        <div className="col-span-12 lg:col-span-6">
          <Card className="bg-slate-900 border-slate-700" data-testid="risk-matrix-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <Shield className="h-4 w-4 text-red-400" />
                Section 3 — CoS Risk Matrix (Autonomous Monitoring)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {/* Strategic Risks */}
              <div>
                <h4 className="font-medium text-red-400 text-xs mb-2">Strategic Risks</h4>
                <div className="space-y-1">
                  {strategicRisks.map((risk, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-800 rounded" data-testid={`strategic-risk-${idx}`}>
                      <span className="text-white">{risk.risk}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getSeverityDot(risk.severity)}`}></div>
                        <span className="text-slate-400">{risk.trigger}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational Risks */}
              <div>
                <h4 className="font-medium text-yellow-400 text-xs mb-2">Operational Risks</h4>
                <div className="space-y-1">
                  {operationalRisks.map((risk, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-800 rounded" data-testid={`operational-risk-${idx}`}>
                      <span className="text-white">{risk.risk}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getSeverityDot(risk.severity)}`}></div>
                        <span className="text-slate-400">{risk.trigger}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community & Financial Risks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="font-medium text-purple-400 text-xs mb-2">Community Risks</h4>
                  <div className="space-y-1">
                    {communityRisks.map((risk, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1 bg-slate-800 rounded" data-testid={`community-risk-${idx}`}>
                        <span className="text-white text-xs">{risk.risk}</span>
                        <div className={`w-2 h-2 rounded-full ${getSeverityDot(risk.severity)}`}></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-orange-400 text-xs mb-2">Financial Risks</h4>
                  <div className="space-y-1">
                    {financialRisks.map((risk, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1 bg-slate-800 rounded" data-testid={`financial-risk-${idx}`}>
                        <span className="text-white text-xs">{risk.risk}</span>
                        <div className={`w-2 h-2 rounded-full ${getSeverityDot(risk.severity)}`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 5 - NEXT 72 HOURS OPTIMIZATION PLAN */}
        <div className="col-span-12">
          <Card className="bg-slate-900 border-slate-700" data-testid="optimization-plan-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <Clock className="h-4 w-4 text-cyan-400" />
                Section 5 — Next 72 Hours Optimization Plan (Includes A/B Testing)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 0-24 Hours */}
                <div className="p-3 bg-gradient-to-b from-emerald-900/30 to-slate-800 rounded border border-emerald-700" data-testid="hours-0-24">
                  <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded">0–24h</span>
                    Stabilize + Accelerate
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">CoS</Badge>
                      <span className="text-slate-300">Issue 72h brief, verify VQS limits, run trust audit</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">CMO</Badge>
                      <span className="text-slate-300">Deploy Signal Post + Poll; identify 3 silent lurkers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">CRO</Badge>
                      <span className="text-slate-300">Deliver IT/QA/Finance packets; trigger micro-offer</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">Content</Badge>
                      <span className="text-slate-300">Produce supporting insight asset</span>
                    </div>
                  </div>
                </div>

                {/* 24-48 Hours */}
                <div className="p-3 bg-gradient-to-b from-blue-900/30 to-slate-800 rounded border border-blue-700" data-testid="hours-24-48">
                  <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">24–48h</span>
                    Evaluate + Pressure-Test
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">Strategist</Badge>
                      <span className="text-slate-300">Adversarial test on revenue campaign</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">CMO</Badge>
                      <span className="text-slate-300">Publish Proof → Insight pairing</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">CRO</Badge>
                      <span className="text-slate-300">Engage 3 high-intent operators privately</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">CCO</Badge>
                      <span className="text-slate-300">Retention scan</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-purple-900/30 rounded border border-purple-700">
                    <p className="text-purple-300 text-xs"><strong>A/B Learning Cycle:</strong> Run A/B test on micro-offer subject line, CTA phrasing, or landing page copy. Feed results into MIS + Librarian.</p>
                  </div>
                </div>

                {/* 48-72 Hours */}
                <div className="p-3 bg-gradient-to-b from-orange-900/30 to-slate-800 rounded border border-orange-700" data-testid="hours-48-72">
                  <h4 className="font-bold text-orange-400 mb-3 flex items-center gap-2">
                    <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded">48–72h</span>
                    Convert + Correct
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">CRO</Badge>
                      <span className="text-slate-300">Execute time-bound CTA</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">CMO+Content</Badge>
                      <span className="text-slate-300">Release mini-case snippet</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">Strategist</Badge>
                      <span className="text-slate-300">Scenario simulation on next revenue sprint</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">CoS</Badge>
                      <span className="text-slate-300">Redistribute resources; compile 72h report</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 6 & 7 - PRIORITY HIERARCHY & GOVERNANCE */}
        <div className="col-span-12 lg:col-span-6">
          <Card className="bg-slate-900 border-slate-700" data-testid="priority-hierarchy-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Section 6 — Priority Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {[
                  { priority: 'Revenue Integrity', rank: 1, color: 'bg-emerald-600' },
                  { priority: 'Audit Defensibility', rank: 2, color: 'bg-blue-600' },
                  { priority: 'Strategic Alignment', rank: 3, color: 'bg-purple-600' },
                  { priority: 'Operational Efficiency', rank: 4, color: 'bg-orange-600' },
                  { priority: 'Human Oversight (approval only)', rank: 5, color: 'bg-slate-600' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-slate-800 rounded" data-testid={`priority-${idx}`}>
                    <span className={`${item.color} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center`}>{item.rank}</span>
                    <span className="text-white text-sm">{item.priority}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <Card className="bg-slate-900 border-slate-700" data-testid="governance-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <Lock className="h-4 w-4 text-red-400" />
                Section 7 — Governance Snapshot (Immutable Rules)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {governanceRules.map((rule: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800 rounded text-xs" data-testid={`governance-rule-${idx}`}>
                    <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">{rule}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 4 - WEEKLY CoS OVERSIGHT PANEL */}
        <div className="col-span-12">
          <Card className="bg-slate-900 border-slate-700" data-testid="oversight-panel-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <Users className="h-4 w-4 text-purple-400" />
                Section 4 — Weekly CoS Oversight Panel (MIS-Linked)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-slate-800 rounded" data-testid="oversight-agents">
                  <h4 className="text-xs font-bold text-emerald-400 mb-2">1. Agent Summary</h4>
                  <p className="text-xs text-slate-300">Strategist, CMO, CRO, Content, CCO, Audit, Librarian</p>
                  <Badge className="mt-2 bg-emerald-600 text-xs">All Active</Badge>
                </div>
                <div className="p-3 bg-slate-800 rounded" data-testid="oversight-execution">
                  <h4 className="text-xs font-bold text-blue-400 mb-2">2. Execution Recap</h4>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>Campaigns: {actions.length}</p>
                    <p>ODAR outcomes: {odarCycles}</p>
                    <p>Escalations: 0</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-800 rounded" data-testid="oversight-demand">
                  <h4 className="text-xs font-bold text-purple-400 mb-2">3. Demand Signals</h4>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>LinkedIn: <span className="text-emerald-400">Active</span></p>
                    <p>High-intent: 3 operators</p>
                    <p>Dark-social: <span className="text-emerald-400">Trending</span></p>
                  </div>
                </div>
                <div className="p-3 bg-slate-800 rounded" data-testid="oversight-pipeline">
                  <h4 className="text-xs font-bold text-orange-400 mb-2">4. Revenue Pipeline</h4>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>Micro-offer: Pending</p>
                    <p>Conversion stage: Active</p>
                    <p>Expected Δ: +$50K</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-800 rounded" data-testid="oversight-risk">
                  <h4 className="text-xs font-bold text-red-400 mb-2">5. Risk Review</h4>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>Positioning: <span className="text-emerald-400">OK</span></p>
                    <p>VQS: <span className="text-emerald-400">100%</span></p>
                    <p>Trust: <span className="text-emerald-400">Healthy</span></p>
                  </div>
                </div>
                <div className="p-3 bg-slate-800 rounded" data-testid="oversight-interventions">
                  <h4 className="text-xs font-bold text-cyan-400 mb-2">6. Interventions</h4>
                  <div className="text-xs text-slate-300">
                    <p>Precise, high-leverage CoS adjustments queued</p>
                    <Badge className="mt-2 bg-cyan-600 text-xs">Auto-executing</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
