import { storage } from "../storage";
import { type InsertWeeklyReport, type WeeklyReport } from "@shared/schema";

export class ReportGenerator {

  // Format report for download
  formatReportForDownload(report: WeeklyReport): string {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    return `CHIEF OF STAFF - WEEKLY INTELLIGENCE REPORT
${'='.repeat(60)}

REPORT PERIOD: ${report.period}
GENERATED: ${formatDate(new Date(report.generatedAt))}
OVERALL PERFORMANCE: ${report.grade} (${report.overallScore}%)

EXECUTIVE SUMMARY
${'-'.repeat(20)}
This weekly intelligence report provides a comprehensive analysis of agent performance, 
conflict resolution, and strategic alignment within the ComplianceWorxs AI executive team.

AGENT STATUS OVERVIEW
${'-'.repeat(25)}
${Object.entries(report.agentStatuses).map(([agent, status]) => 
  `• ${agent.padEnd(20)} ${status.toUpperCase()}`
).join('\n')}

CONFLICT MANAGEMENT
${'-'.repeat(20)}
• Conflicts Detected: ${report.conflictsDetected}
• Conflicts Resolved: ${report.conflictsResolved}
• Resolution Rate: ${report.conflictsDetected > 0 ? Math.round((report.conflictsResolved / report.conflictsDetected) * 100) : 100}%

STRATEGIC ALIGNMENT TRACKING
${'-'.repeat(30)}
${Object.entries(report.strategicAlignment).map(([objective, agents]) => 
  `• ${objective}\n  Contributing Agents: ${agents.join(', ')}`
).join('\n\n')}

KEY HIGHLIGHTS
${'-'.repeat(15)}
${report.highlights.map(highlight => `• ${highlight}`).join('\n')}

RECOMMENDATIONS
${'-'.repeat(17)}
${report.recommendations.map(rec => `• ${rec}`).join('\n')}

OPERATIONS METRICS (Hybrid Polling/Event-Driven)
${'-'.repeat(50)}
• Mean Time To Resolution: ${report.operations.mttr_minutes} minutes
• Autonomous Resolution Rate: ${report.operations.auto_resolve_pct}%
• Polling Interval: 150 minutes (10/day baseline)
• Webhook Coverage: ${Object.values(report.agentBlockers).filter(agent => 
  agent.blockers.some(b => b.type === "awaiting webhook")
).length} agents awaiting webhook integration

AGENT BLOCKERS ANALYSIS
${'-'.repeat(25)}
${Object.entries(report.agentBlockers).map(([agent, data]) => {
  const blockerSummary = data.blockers.map(b => `${b.type}: ${b.description}`).join('\n    ');
  return `• ${agent.padEnd(15)} Status: ${data.status.toUpperCase()}\n    ${blockerSummary}`;
}).join('\n\n')}

TOP RECOMMENDED FIXES (Prioritized)
${'-'.repeat(35)}
${report.topFixes.map((fix, index) => 
  `${index + 1}. [${fix.impact.toUpperCase()} IMPACT] ${fix.action}\n   Type: ${fix.type.toUpperCase()}${fix.agent ? ` | Agent: ${fix.agent}` : ''}`
).join('\n')}

SYSTEM HEALTH METRICS
${'-'.repeat(22)}
• Strategic Alignment Score: ${report.overallScore}%
• Active Conflicts: ${report.conflictsDetected - report.conflictsResolved}
• System Grade: ${report.grade}

${'='.repeat(60)}
ComplianceWorxs Chief of Staff System
Report Generated: ${formatDate(new Date(report.generatedAt))}
System Version: 2.0.0 - Strategic Execution Loop
${'='.repeat(60)}`;
  }

  async generateWeeklyReport(): Promise<WeeklyReport> {
    const agents = await storage.getAgents();
    const conflicts = await storage.getConflicts();
    const objectives = await storage.getStrategicObjectives();
    const systemMetrics = await storage.getLatestSystemMetrics();

    // Calculate overall score
    const healthScore = systemMetrics?.systemHealth || 0;
    const alignmentScore = systemMetrics?.strategicAlignmentScore || 0;
    const conflictPenalty = Math.min(conflicts.filter(c => c.status === "active").length * 5, 20);
    const overallScore = Math.max(Math.round((healthScore + alignmentScore) / 2 - conflictPenalty), 0);

    // Determine grade
    let grade = "F";
    if (overallScore >= 90) grade = "A+";
    else if (overallScore >= 85) grade = "A";
    else if (overallScore >= 80) grade = "A-";
    else if (overallScore >= 75) grade = "B+";
    else if (overallScore >= 70) grade = "B";
    else if (overallScore >= 65) grade = "B-";
    else if (overallScore >= 60) grade = "C";

    // Generate agent statuses summary
    const agentStatuses: Record<string, string> = {};
    const agentBlockers: Record<string, {
      status: string;
      blockers: Array<{ type: "awaiting webhook" | "poll-detected" | "processing" | "none"; description: string; }>;
    }> = {};
    
    agents.forEach(agent => {
      agentStatuses[agent.name] = agent.status;
      
      // Determine blockers based on status and agent type
      const blockers: Array<{ type: "awaiting webhook" | "poll-detected" | "processing" | "none"; description: string; }> = [];
      
      if (agent.status === "delayed") {
        // Check if this is a revenue-critical agent that should use webhooks
        if (['CRO', 'COO'].includes(agent.name)) {
          blockers.push({
            type: "awaiting webhook",
            description: `${agent.name} delayed - missing webhook integration for real-time updates`
          });
        } else {
          blockers.push({
            type: "poll-detected",
            description: `${agent.name} delayed - detected during 150-minute polling cycle`
          });
        }
      } else if (agent.status === "conflict") {
        blockers.push({
          type: "processing",
          description: `${agent.name} resolving conflicts - autonomous intervention in progress`
        });
      } else if (agent.status === "healthy") {
        blockers.push({
          type: "none",
          description: `${agent.name} operating normally`
        });
      } else if (agent.status === "error") {
        // Error status agents - prioritize webhook solutions for revenue-critical agents
        if (['CRO', 'COO'].includes(agent.name)) {
          blockers.push({
            type: "awaiting webhook",
            description: `${agent.name} error - needs webhook integration to reduce 150-minute detection latency`
          });
        } else {
          blockers.push({
            type: "poll-detected",
            description: `${agent.name} error - detected during polling cycle, needs investigation`
          });
        }
      }
      
      agentBlockers[agent.name] = {
        status: agent.status,
        blockers
      };
    });

    // Calculate strategic alignment
    const strategicAlignment: Record<string, string[]> = {};
    objectives.forEach(objective => {
      const contributingAgentNames = objective.contributingAgents
        .map(id => agents.find(a => a.id === id)?.name)
        .filter(Boolean) as string[];
      strategicAlignment[objective.title] = contributingAgentNames;
    });

    // Calculate operations metrics for hybrid polling/event-driven architecture
    const resolvedConflicts = conflicts.filter(c => c.status === "resolved");
    const avgResolutionTime = resolvedConflicts.length > 0 
      ? resolvedConflicts.reduce((sum, conflict) => {
          const created = new Date(conflict.createdAt);
          const resolved = new Date(conflict.resolvedAt || new Date());
          return sum + (resolved.getTime() - created.getTime());
        }, 0) / resolvedConflicts.length / (1000 * 60) // Convert to minutes
      : 90; // Default 90 minutes for 10 polls/day baseline

    const totalConflictsThisWeek = conflicts.length;
    const autoResolveCount = conflicts.filter(c => c.resolution?.includes("Automatically")).length;
    const autoResolvePct = totalConflictsThisWeek > 0 ? (autoResolveCount / totalConflictsThisWeek) * 100 : 85;

    const operations = {
      mttr_minutes: Math.round(avgResolutionTime),
      auto_resolve_pct: Math.round(autoResolvePct)
    };

    // Generate top fixes prioritizing webhooks over polling increases
    const topFixes: Array<{
      priority: number;
      action: string;
      type: "webhook" | "polling" | "configuration" | "monitoring";
      impact: "high" | "medium" | "low";
      agent?: string;
    }> = [];

    // Priority 1: Enable webhooks for revenue-critical agents
    const delayedRevenueAgents = agents.filter(a => 
      a.status === "delayed" && ["CRO", "COO"].includes(a.name)
    );
    delayedRevenueAgents.forEach(agent => {
      topFixes.push({
        priority: 1,
        action: `Enable Stripe/MemberPress webhooks for ${agent.name}`,
        type: "webhook",
        impact: "high",
        agent: agent.name
      });
    });

    // Priority 2: Enable webhooks for marketing agents
    const delayedMarketingAgents = agents.filter(a => 
      a.status === "delayed" && ["CMO", "ContentManager"].includes(a.name)
    );
    delayedMarketingAgents.forEach(agent => {
      topFixes.push({
        priority: 2,
        action: `Enable MailerLite/WordPress webhooks for ${agent.name}`,
        type: "webhook",
        impact: "medium",
        agent: agent.name
      });
    });

    // Priority 3: Configuration improvements
    if (operations.auto_resolve_pct < 80) {
      topFixes.push({
        priority: 3,
        action: "Improve autonomous conflict resolution rules",
        type: "configuration",
        impact: "medium"
      });
    }

    // Priority 4: Only suggest polling increases as last resort
    const criticallyDelayedAgents = agents.filter(a => a.status === "delayed");
    if (criticallyDelayedAgents.length > 2 && topFixes.length === 0) {
      topFixes.push({
        priority: 4,
        action: "Increase polling frequency for critical agents (budget impact: +$5/day)",
        type: "polling",
        impact: "low"
      });
    }

    // Priority 5: Monitoring improvements
    if (operations.mttr_minutes > 120) {
      topFixes.push({
        priority: 5,
        action: "Add predictive conflict detection to reduce MTTR",
        type: "monitoring",
        impact: "medium"
      });
    }

    // Sort by priority and take top 5
    topFixes.sort((a, b) => a.priority - b.priority);
    const finalTopFixes = topFixes.slice(0, 5);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (conflicts.filter(c => c.status === "active").length > 0) {
      recommendations.push("Resolve active conflicts to improve system alignment");
    }
    
    const delayedAgents = agents.filter(a => a.status === "delayed");
    if (delayedAgents.length > 0) {
      const webhookAgents = delayedAgents.filter(a => ["CRO", "COO", "CMO"].includes(a.name));
      if (webhookAgents.length > 0) {
        recommendations.push(`Enable webhooks for ${webhookAgents.map(a => a.name).join(", ")} to reduce 150-minute polling latency`);
      } else {
        recommendations.push(`Address sync delays for ${delayedAgents.map(a => a.name).join(", ")}`);
      }
    }
    
    const lowAlignmentObjectives = objectives.filter(o => o.progress < 60);
    if (lowAlignmentObjectives.length > 0) {
      recommendations.push("Focus on underperforming strategic objectives");
    }

    if (operations.mttr_minutes > 150) {
      recommendations.push("MTTR exceeds polling interval - consider webhook implementation for faster resolution");
    }

    if (recommendations.length === 0) {
      recommendations.push("System operating optimally - maintain current hybrid polling/event-driven architecture");
    }

    // Generate highlights
    const highlights: string[] = [];
    const resolvedConflictsCount = conflicts.filter(c => c.status === "resolved").length;
    const totalConflicts = conflicts.length;
    
    if (resolvedConflictsCount > 0) {
      highlights.push(`${resolvedConflictsCount} conflicts resolved this period`);
    }

    if (operations.mttr_minutes < 90) {
      highlights.push(`Excellent MTTR of ${operations.mttr_minutes} minutes - webhooks performing well`);
    } else if (operations.mttr_minutes > 150) {
      highlights.push(`MTTR of ${operations.mttr_minutes} minutes indicates webhook opportunities exist`);
    }

    if (operations.auto_resolve_pct > 90) {
      highlights.push(`Outstanding autonomous resolution rate: ${operations.auto_resolve_pct}%`);
    }
    
    const avgAlignment = Math.round(agents.reduce((sum, a) => sum + a.strategicAlignment, 0) / agents.length);
    if (avgAlignment > 80) {
      highlights.push(`Strong strategic alignment maintained at ${avgAlignment}%`);
    }
    
    const healthyAgents = agents.filter(a => a.status === "healthy").length;
    if (healthyAgents === agents.length) {
      highlights.push("All agents operating in healthy status");
    }

    if (highlights.length === 0) {
      highlights.push("Standard operational metrics maintained");
    }

    const report: InsertWeeklyReport = {
      period: this.getCurrentWeekPeriod(),
      overallScore,
      grade,
      agentStatuses,
      conflictsDetected: totalConflicts,
      conflictsResolved: resolvedConflictsCount,
      strategicAlignment,
      recommendations,
      highlights,
      operations,
      agentBlockers,
      topFixes: finalTopFixes
    };

    return await storage.createWeeklyReport(report);
  }

  private getCurrentWeekPeriod(): string {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const formatDate = (date: Date) => 
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `Week of ${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  }

  async getReportSummary(reportId: string): Promise<{
    title: string;
    summary: string;
    grade: string;
  } | null> {
    const report = await storage.getWeeklyReport(reportId);
    if (!report) return null;

    return {
      title: report.period,
      summary: `${Object.keys(report.agentStatuses).length} agents monitored, ${report.conflictsDetected} conflicts, ${report.grade} score`,
      grade: report.grade
    };
  }
}

export const reportGenerator = new ReportGenerator();
