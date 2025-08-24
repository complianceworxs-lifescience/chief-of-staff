import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, CheckCircle2, TriangleAlert, FileText, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WeeklyReport } from "@shared/schema";

/**
 * Executive Intelligence Report - Revenue-Focused Business Dashboard
 */

const sampleExecutiveReport = {
  meta: {
    period_start: "2025-08-24",
    period_end: "2025-08-30", 
    generated_at: new Date().toISOString(),
    system_version: "2.1.0",
  },
  revenue: {
    mrr_by_tier: [
      { tier: "Rising Leader", current: 4900, last_week: 4700 },
      { tier: "Validation Strategist", current: 7200, last_week: 6900 },
      { tier: "Compliance Architect", current: 11200, last_week: 10700 },
    ],
    totals: {
      mrr_current: 23300,
      mrr_last_week: 22300,
      delta_abs: 1000,
      delta_pct: (1000 / 22300) * 100,
      new_members: 28,
      lost_members: 11,
    },
    activation_rate: {
      value_pct: 78.0,
      definition: "% of new members who complete onboarding step 1→4 within 7 days",
    },
    churn: {
      weekly_churn_pct: (11 / (28 + 11)) * 100,
      retention_4wk_pct: 74.0,
      top_reasons: [
        "Onboarding step 3 form error",
        "Low early perceived value for Rising Leader tier",
      ],
    },
    upsell: { rl_to_vs_pct: 6.0, vs_to_ca_pct: 3.0 },
  },
  agents: [
    {
      name: "CRO Agent", 
      owner: "Revenue",
      execution_score: 68,
      tasks_assigned: 19,
      tasks_done: 13,
      mttr_minutes: 7.1,
      auto_resolve_pct: 77,
      blockers: ["Stripe webhook retry failures"],
      business_impact: "Attribution gaps; delayed upsell triggers",
    },
    {
      name: "CCO Agent",
      owner: "Customer Success", 
      execution_score: 89,
      tasks_assigned: 9,
      tasks_done: 8,
      mttr_minutes: 2.8,
      auto_resolve_pct: 93,
      blockers: [],
      business_impact: "Retention programs performing at 89% effectiveness",
    },
    {
      name: "CMO Agent",
      owner: "Marketing",
      execution_score: 74,
      tasks_assigned: 15,
      tasks_done: 11,
      mttr_minutes: 5.3,
      auto_resolve_pct: 84,
      blockers: ["Email sequence v3 missing step 5"],
      business_impact: "Content reach reduced by ~12%",
    },
    {
      name: "COO Agent",
      owner: "Operations",
      execution_score: 71,
      tasks_assigned: 14, 
      tasks_done: 10,
      mttr_minutes: 3.9,
      auto_resolve_pct: 88,
      blockers: ["Onboarding step 3 error"],
      business_impact: "Activation capped at ~78%",
    },
  ],
  objectives: [
    {
      objective: "Increase Monthly Revenue by $50K",
      target: "+$50,000 MRR",
      progress_value: "+$14.2K",
      progress_pct: 28.4,
      pace_vs_plan: "behind",
      owner_agents: ["CRO Agent"],
      notes: "Attribution fix + CRO playbook v2 needed",
    },
    {
      objective: "Improve Customer Retention by 15%",
      target: "+15% retention",
      progress_value: "+0%",
      progress_pct: 0,
      pace_vs_plan: "at_risk",
      owner_agents: ["CCO Agent"],
      notes: "Onboarding bug blocks progress",
    },
    {
      objective: "Expand Content Marketing Reach by 40%",
      target: "+40% reach",
      progress_value: "+12%",
      progress_pct: 30,
      pace_vs_plan: "on_track",
      owner_agents: ["CMO Agent"],
      notes: "LinkedIn carousel tests working",
    },
    {
      objective: "Increase Tier 3 MRR by 20%",
      target: "+20% CA MRR",
      progress_value: "+5%",
      progress_pct: 25,
      pace_vs_plan: "on_track",
      owner_agents: ["CRO Agent"],
      notes: "Early partner interest",
    },
  ],
  operations: {
    conflicts: 1280,
    mttr_minutes: 4.6,
    auto_resolve_pct: 92,
    hotspots: ["CRO attribution pipeline", "COO onboarding step 3"],
  },
  opportunities: {
    emerging: [
      "Consulting partner referrals up 18%",
      "Architect tier interest via AI Exchange",
    ],
    risks: ["Replit compute spikes on weekend runs", "Soft bounce uptick"],
    cost_flags: [
      "Token usage +22% on Market Intel Agent; review sampling rate",
    ],
  },
  actions: {
    top_fixes: [
      "Patch onboarding step 3 form error within 48h (COO)",
      "Repair Stripe webhook retries and reprocess backlog (CRO)",
      "Publish email sequence v3 step 5 (CMO)",
    ],
    top_wins: [
      "Auto-resolve rate sustained >90%",
      "New partner pipeline unlocked two CA prospects",
      "Carousel content doubled share rate",
    ],
    decisions_needed: [
      {
        question: "Approve 10% promo for RL→VS upgrade?",
        owner: "CEO",
        deadline: "2025-08-29",
        options: ["Yes, 7 days", "Yes, 14 days", "No"],
      },
      {
        question: "Adopt lower-cost inference for Market Intel?",
        owner: "COO", 
        deadline: "2025-08-30",
        options: ["Switch weekdays only", "Keep current", "A/B test 1 week"],
      },
    ],
  },
};

const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="flex flex-col">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-2xl font-semibold">{value}</span>
    {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
  </div>
);

const Delta = ({ value }: { value: number }) => {
  const sign = value >= 0 ? "+" : "";
  return (
    <div className={`text-sm ${value >= 0 ? "text-green-600" : "text-red-600"}`}>
      {sign}{value.toFixed(1)}%
    </div>
  );
};

const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n * 100) / 100));

function ExecutiveIntelligenceReport({ report = sampleExecutiveReport, onDownload }: { report?: any; onDownload?: () => void }) {
  const { meta, revenue, agents, objectives, operations, opportunities, actions } = report;
  const deltaPct = revenue?.totals?.delta_pct ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weekly Executive Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            {meta?.period_start} → {meta?.period_end} · v{meta?.system_version}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onDownload} className="rounded-2xl">Export Report</Button>
        </div>
      </div>

      {/* Revenue & Growth */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Revenue & Growth</h2>
            <Delta value={deltaPct} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat label="MRR" value={`$${revenue.totals.mrr_current.toLocaleString()}`} sub={`LW $${revenue.totals.mrr_last_week.toLocaleString()} (${deltaPct.toFixed(1)}%)`} />
            <Stat label="New Members" value={revenue.totals.new_members} />
            <Stat label="Lost Members" value={revenue.totals.lost_members} />
            <Stat label="Activation" value={`${pct(revenue.activation_rate.value_pct)}%`} sub="7‑day onboarding completion" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {revenue.mrr_by_tier.map((t) => {
              const tierDelta = ((t.current - t.last_week) / t.last_week) * 100;
              return (
                <div key={t.tier} className="p-4 border rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{t.tier}</div>
                    <Delta value={tierDelta} />
                  </div>
                  <div className="text-sm text-muted-foreground">${t.current.toLocaleString()} (LW ${t.last_week.toLocaleString()})</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>


      {/* Agent Performance */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Agent Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((a) => (
              <div key={a.name} className="p-4 border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-sm text-muted-foreground">Owner: {a.owner}</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Exec Score" value={`${pct(a.execution_score)}%`} />
                  <Stat label="Done" value={`${a.tasks_done}/${a.tasks_assigned}`} />
                  <Stat label="MTTR" value={`${a.mttr_minutes}m`} />
                </div>
                <div className="mt-1">
                  <Progress value={pct(a.auto_resolve_pct)} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">Auto-resolve {pct(a.auto_resolve_pct)}%</div>
                </div>
                {a.blockers?.length > 0 ? (
                  <div className="flex items-start gap-2 text-amber-700 text-sm"><AlertTriangle className="w-4 h-4 mt-0.5"/> {a.blockers.join(" · ")}</div>
                ) : (
                  <div className="flex items-center gap-2 text-green-700 text-sm"><CheckCircle2 className="w-4 h-4"/> No blockers</div>
                )}
                <div className="text-sm text-muted-foreground">Impact: {a.business_impact}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operations Health */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2"><TriangleAlert className="w-5 h-5"/> Operations Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat label="Conflicts" value={operations.conflicts} />
            <Stat label="MTTR" value={`${operations.mttr_minutes}m`} />
            <Stat label="Auto-resolve" value={`${pct(operations.auto_resolve_pct)}%`} />
            <Stat label="Hotspots" value={operations.hotspots.length} sub={operations.hotspots.join(", ")} />
          </div>
        </CardContent>
      </Card>

      {/* Opportunities & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6 space-y-2">
            <h3 className="font-semibold">Emerging Opportunities</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {opportunities.emerging.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6 space-y-2">
            <h3 className="font-semibold">Risks</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {opportunities.risks.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6 space-y-2">
            <h3 className="font-semibold">Cost Flags</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {opportunities.cost_flags.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Next Actions */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Next Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 border rounded-xl">
              <h4 className="font-semibold mb-2">Top Fixes</h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {actions.top_fixes.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
            <div className="p-4 border rounded-xl">
              <h4 className="font-semibold mb-2">Top Wins</h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {actions.top_wins.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
            <div className="p-4 border rounded-xl">
              <h4 className="font-semibold mb-2">Decisions Needed</h4>
              <ul className="space-y-2 text-sm">
                {actions.decisions_needed.map((d, i) => (
                  <li key={i} className="p-3 border rounded-lg">
                    <div className="font-medium">{d.question}</div>
                    <div className="text-xs text-muted-foreground">Owner: {d.owner} · Deadline: {d.deadline}</div>
                    <div className="text-xs mt-1">Options: {d.options.join(" / ")}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center pt-2">
        Generated {new Date(meta.generated_at).toLocaleString()} · Schema v{meta.system_version}
      </div>
    </div>
  );
}

export function WeeklyReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery<WeeklyReport[]>({
    queryKey: ["/api/reports"]
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reports/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report Generated",
        description: "Executive intelligence report has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  });

  const latestReport = reports[0];

  const downloadReport = async (reportId: string, period: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      const blob = await response.blob();
      const fileName = `Executive_Intelligence_Report_${period.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Download Complete",
        description: `${fileName} has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: `Failed to download report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Show full executive report if we have latest report data
  if (latestReport) {
    return <ExecutiveIntelligenceReport report={sampleExecutiveReport} onDownload={() => downloadReport(latestReport.id, latestReport.period)} />;
  }

  return (
    <div className="space-y-6">
      {/* Executive Report Generation */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Executive Intelligence Reports</CardTitle>
          <p className="text-muted-foreground">Revenue-focused business intelligence with actionable insights</p>
        </CardHeader>
        <CardContent className="text-center py-8">
          <TrendingUp className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">Generate your first executive intelligence report to see revenue metrics, agent performance, and strategic objective tracking.</p>
          <Button
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending}
            className="bg-primary hover:bg-primary/90"
            size="lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Executive Report
          </Button>
        </CardContent>
      </Card>

      {/* Preview of Executive Report Structure */}
      <ExecutiveIntelligenceReport report={sampleExecutiveReport} onDownload={() => toast({ title: "Generate Report First", description: "Please generate a report to enable downloads." })} />
    </div>
  );
}
