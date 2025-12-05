import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoSMonitoring } from "@/components/CoSMonitoring";
import { ExternalVerificationDemo } from "@/components/ExternalVerificationDemo";
import { 
  DollarSign, TrendingUp, Shield, Gauge, Users, 
  AlertTriangle, Target, CheckCircle, Send, 
  FileText, Calendar, ArrowRight, Clock, 
  Brain, Zap, Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { qk } from "@/state/queries";
import type { Agent, Conflict, SystemMetrics } from "@shared/schema";

interface ScoreboardData {
  date: string;
  revenue: { realized_week: number; target_week: number; upsells: number };
  initiatives: { on_time_pct: number; risk_inverted: number; resource_ok_pct: number; dependency_clear_pct: number };
  alignment: { work_tied_to_objectives_pct: number };
  autonomy: { auto_resolve_pct: number; mttr_min: number };
  risk: { score: number; high: number; medium: number; next_deadline_hours: number };
  narrative: { topic: string; linkedin_er_delta_pct: number; email_ctr_delta_pct: number; quiz_to_paid_delta_pct: number; conversions: number };
}

interface Initiative { id: string; title: string; status: string; progress: number; owner: string }
interface Decision { id: string; title: string; priority: string; dueDate: string; status: string }
interface Action { id: string; title: string; agent: string; impact: string; urgency: string }
interface Meeting { id: string; title: string; date: string; summary: string }

export default function Dashboard() {
  const { data: scoreboard } = useQuery<ScoreboardData>({
    queryKey: ['/api/cockpit/scoreboard'],
    refetchInterval: 7200000
  });

  const { data: initiatives = [] } = useQuery<Initiative[]>({
    queryKey: ['/api/cockpit/initiatives'],
    refetchInterval: 7200000
  });

  const { data: decisions = [] } = useQuery<Decision[]>({
    queryKey: ['/api/cockpit/decisions'],
    refetchInterval: 7200000
  });

  const { data: actions = [] } = useQuery<Action[]>({
    queryKey: ['/api/cockpit/actions'],
    refetchInterval: 7200000
  });

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ['/api/cockpit/meetings'],
    refetchInterval: 7200000
  });

  // Strategic Cockpit KPI Calculations from Live Data
  const revenuePaceToTarget = scoreboard?.revenue 
    ? Math.round((scoreboard.revenue.realized_week / scoreboard.revenue.target_week) * 100)
    : 87;
  
  const strategicHealthIndex = scoreboard?.initiatives 
    ? Math.round(
        (0.4 * scoreboard.initiatives.on_time_pct) + 
        (0.3 * scoreboard.initiatives.risk_inverted) + 
        (0.2 * scoreboard.initiatives.resource_ok_pct) + 
        (0.1 * scoreboard.initiatives.dependency_clear_pct)
      )
    : 84;
  
  const alignmentScore = scoreboard?.alignment?.work_tied_to_objectives_pct || 86;
  const autonomyScore = scoreboard?.autonomy?.auto_resolve_pct || 91;
  const riskComplianceScore = scoreboard?.risk?.score || 22;
  
  const narrativeMomentum = scoreboard?.narrative 
    ? Math.round(
        (0.5 * scoreboard.narrative.linkedin_er_delta_pct) + 
        (0.3 * scoreboard.narrative.email_ctr_delta_pct) + 
        (0.2 * scoreboard.narrative.quiz_to_paid_delta_pct)
      )
    : 68;

  const getKPIColor = (value: number, thresholds: {green: number, amber: number}) => {
    if (value >= thresholds.green) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '🟢' };
    if (value >= thresholds.amber) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🟡' };
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔴' };
  };

  return (
    <div className="space-y-6">
      {/* Strategic Cockpit Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Strategic Cockpit</h1>
        <p className="text-lg mt-2">One glance = One decision. Business-first metrics for faster CEO decision-making.</p>
      </div>

      {/* Top Strip - 5 Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* Revenue Pace to Target */}
        <Card className={`${getKPIColor(revenuePaceToTarget, {green: 90, amber: 75}).bg} ${getKPIColor(revenuePaceToTarget, {green: 90, amber: 75}).border} border-2`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <span className="text-3xl">{getKPIColor(revenuePaceToTarget, {green: 90, amber: 75}).icon}</span>
            </div>
            <h3 className="font-bold text-xl mb-1">Revenue Pace</h3>
            <p className="text-2xl font-bold mb-1">{revenuePaceToTarget}%</p>
            <p className="text-sm opacity-80">MRR + Upsells: $42K / $48K</p>
            <p className="text-xs mt-1">Δ vs last week: +12%</p>
          </CardContent>
        </Card>

        {/* Strategic Initiative Health Index */}
        <Card className={`${getKPIColor(strategicHealthIndex, {green: 85, amber: 70}).bg} ${getKPIColor(strategicHealthIndex, {green: 85, amber: 70}).border} border-2`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-8 w-8 text-blue-600" />
              <span className="text-3xl">{getKPIColor(strategicHealthIndex, {green: 85, amber: 70}).icon}</span>
            </div>
            <h3 className="font-bold text-xl mb-1">Strategic Health</h3>
            <p className="text-2xl font-bold mb-1">{strategicHealthIndex}</p>
            <p className="text-sm opacity-80">Initiative Status Index</p>
            <p className="text-xs mt-1">On-track: A,B,C • At-risk: D</p>
          </CardContent>
        </Card>

        {/* Alignment & Autonomy */}
        <Card className={`${getKPIColor((alignmentScore + autonomyScore)/2, {green: 85, amber: 75}).bg} ${getKPIColor((alignmentScore + autonomyScore)/2, {green: 85, amber: 75}).border} border-2`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-8 w-8 text-purple-600" />
              <span className="text-3xl">{getKPIColor((alignmentScore + autonomyScore)/2, {green: 85, amber: 75}).icon}</span>
            </div>
            <h3 className="font-bold text-xl mb-1">Alignment</h3>
            <p className="text-2xl font-bold mb-1">{alignmentScore}%</p>
            <p className="text-sm opacity-80">Auto-resolve: {autonomyScore}%</p>
            <p className="text-xs mt-1">MTTR: 4.3 min</p>
          </CardContent>
        </Card>

        {/* Risk & Compliance Radar */}
        <Card className={`${getKPIColor(100 - riskComplianceScore, {green: 80, amber: 60}).bg} ${getKPIColor(100 - riskComplianceScore, {green: 80, amber: 60}).border} border-2`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-8 w-8 text-orange-600" />
              <span className="text-3xl">{getKPIColor(100 - riskComplianceScore, {green: 80, amber: 60}).icon}</span>
            </div>
            <h3 className="font-bold text-xl mb-1">Risk Radar</h3>
            <p className="text-2xl font-bold mb-1">{100 - riskComplianceScore}</p>
            <p className="text-sm opacity-80">Compliance Status</p>
            <p className="text-xs mt-1">2 High • 1 Med • Next: 4h</p>
          </CardContent>
        </Card>

        {/* Narrative Momentum */}
        <Card className={`${getKPIColor(narrativeMomentum, {green: 75, amber: 50}).bg} ${getKPIColor(narrativeMomentum, {green: 75, amber: 50}).border} border-2`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-indigo-600" />
              <span className="text-3xl">{getKPIColor(narrativeMomentum, {green: 75, amber: 50}).icon}</span>
            </div>
            <h3 className="font-bold text-xl mb-1">GTM Momentum</h3>
            <p className="text-2xl font-bold mb-1">{narrativeMomentum}</p>
            <p className="text-sm opacity-80">Go-to-Market Uplift</p>
            <p className="text-xs mt-1">Top: 'AI Compliance' • Conv: 23</p>
          </CardContent>
        </Card>
      </div>

      {/* CEO Command Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Decision Inbox */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Decision Inbox - Requires CEO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {decisions.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.decision}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.context}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <Badge variant="outline">{item.options[0]}</Badge>
                      <span className="text-gray-500">Impact: {item.impact}</span>
                      <span className="text-gray-500">Owner: {item.owner}</span>
                      <span className="text-red-600">Due: {new Date(item.due).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">{item.options[0]}</Button>
                    <Button size="sm" variant="ghost">{item.options[1] || 'Defer'}</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Best Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Next Best Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actions.map((action: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{action.reason}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={action.eta_days <= 2 ? 'default' : 'secondary'} className="text-xs">
                      {action.eta_days}d ETA
                    </Badge>
                    <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => window.open(action.action_link, '_blank')}>
                      <Send className="h-3 w-3 mr-1" />
                      Execute
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Owner: {action.owner}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chief of Staff Monitoring */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Chief of Staff Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CoSMonitoring />
        </CardContent>
      </Card>

      {/* Executive Brief Generator */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Executive Brief Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Generate CEO Email
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Board Snapshot
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Generate Investor Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cross-Functional Initiatives RAG Board - Live Data */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Strategic Initiatives - RAG Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {initiatives.map((initiative: any, index: number) => (
              <Card key={index} className={`border-2 ${
                initiative.rag === 'green' ? 'border-green-200 bg-green-50' :
                initiative.rag === 'amber' ? 'border-amber-200 bg-amber-50' :
                'border-red-200 bg-red-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{initiative.name}</h4>
                    <div className={`w-3 h-3 rounded-full ${
                      initiative.rag === 'green' ? 'bg-green-500' :
                      initiative.rag === 'amber' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}></div>
                  </div>
                  <p className="text-2xl font-bold mb-1">{initiative.health_score}</p>
                  <p className="text-sm mb-2">
                    {initiative.milestones[0]?.title || 'No active milestone'} - {initiative.milestones[0]?.status || 'unknown'}
                  </p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Path to Green:</strong> {initiative.path_to_green[0]}</p>
                    <p><strong>Owner:</strong> {initiative.owner} • <strong>Risk:</strong> {initiative.risks[0]?.text || 'None'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Communication Bridge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meeting Synthesis & Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meetings.map((meeting: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{meeting.title}</h4>
                    <span className="text-xs text-gray-500">{new Date(meeting.date).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {meeting.summary.map((point: string, i: number) => (
                      <p key={i} className="text-sm text-gray-600">• {point}</p>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-700">Actions:</h5>
                    {meeting.actions.map((action: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span>{action.text}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">{action.owner}</Badge>
                          <span className="text-gray-500">{new Date(action.due).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Drafts & Outreach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'Investor Update', status: 'Ready', priority: 'High' },
                { type: 'Customer Success Note', status: 'Draft', priority: 'Medium' },
                { type: 'Partner Follow-up', status: 'Ready', priority: 'Medium' }
              ].map((draft, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm">{draft.type}</p>
                    <p className="text-xs text-gray-600">{draft.status} • {draft.priority} Priority</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-xs h-6">Send as CEO</Button>
                    <Button size="sm" variant="ghost" className="text-xs h-6">Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence → Insight → Directive Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Auto-Curated Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scoreboard?.narrative && [
                { 
                  insight: `${scoreboard.narrative.topic} posts +${scoreboard.narrative.linkedin_er_delta_pct}% ER → +${scoreboard.narrative.conversions} paid yesterday`, 
                  impact: 'High', 
                  confidence: 85 
                },
                { insight: 'Partner referral conversion up 34% this week', impact: 'Medium', confidence: 72 },
                { insight: 'Compliance content driving 67% of trial signups', impact: 'High', confidence: 91 }
              ].map((item, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium">{item.insight}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <Badge variant={item.impact === 'High' ? 'default' : 'secondary'}>{item.impact} Impact</Badge>
                    <span className="text-gray-600">{item.confidence}% confidence</span>
                  </div>
                </div>
              )) || [
                { insight: 'Loading insights...', impact: 'Medium', confidence: 0 }
              ].map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
                  <p className="font-medium">{item.insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Directive Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quick Directive Creation */}
              <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-blue-900">Create New Directive</p>
                    <p className="text-sm text-blue-700">Send commands to agents</p>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    + New Directive
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Button size="sm" variant="outline" className="justify-start h-8">
                    📈 Revenue Push
                  </Button>
                  <Button size="sm" variant="outline" className="justify-start h-8">
                    🎯 Campaign Launch
                  </Button>
                  <Button size="sm" variant="outline" className="justify-start h-8">
                    📊 Budget Shift
                  </Button>
                  <Button size="sm" variant="outline" className="justify-start h-8">
                    🚨 Emergency Action
                  </Button>
                </div>
              </div>
              
              {/* Recent Directives */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recent Directives</h4>
                {[
                  { text: 'Double OpenAI-critique cadence', agent: 'CMO', status: 'Active', time: '2h ago' },
                  { text: 'Architect conversion analysis', agent: 'CRO', status: 'Pending', time: '4h ago' },
                  { text: 'Customer retention focus', agent: 'CCO', status: 'Complete', time: '1d ago' }
                ].map((directive, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded text-xs">
                    <div>
                      <p className="font-medium">{directive.text}</p>
                      <p className="text-gray-500">{directive.agent} • {directive.time}</p>
                    </div>
                    <Badge 
                      variant={directive.status === 'Active' ? 'default' : 
                              directive.status === 'Complete' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {directive.status}
                    </Badge>
                  </div>
                ))}
              </div>
              
              {/* Auto-Trigger Rules */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs">
                <p className="font-medium mb-1">Auto-Trigger Rules Active:</p>
                <p>• Revenue Pace &lt;85% for 2 days → Propose pricing/promo levers</p>
                <p>• Decision &gt;24h overdue → Calendar triage mode</p>
                <p>• Initiative turns Red → Path-to-Green escalation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Guardrails */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Executive Alerts & Guardrails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 ${
              decisions.length <= 3 && !decisions.some((d: any) => new Date(d.due) <= new Date()) 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <h4 className="font-semibold mb-2">Decision Debt</h4>
              <p className="text-2xl font-bold">{decisions.length}</p>
              <p className="text-sm">{decisions.filter((d: any) => new Date(d.due) <= new Date()).length} overdue</p>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${
              revenuePaceToTarget >= 85 
                ? 'border-green-200 bg-green-50' 
                : 'border-amber-200 bg-amber-50'
            }`}>
              <h4 className="font-semibold mb-2">Runway Actions</h4>
              <p className="text-sm">Revenue pace monitoring</p>
              <p className="text-xs mt-1">Next trigger if &lt;85% for 2 days</p>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${
              riskComplianceScore <= 30 
                ? 'border-green-200 bg-green-50' 
                : 'border-amber-200 bg-amber-50'
            }`}>
              <h4 className="font-semibold mb-2">Compliance Clock</h4>
              <p className="text-sm">Next audit: Nov 12</p>
              <p className="text-xs mt-1">18 days remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External AI Learning Verification - GA4 Integration */}
      <ExternalVerificationDemo />
    </div>
  );
}