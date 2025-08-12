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
    agents.forEach(agent => {
      agentStatuses[agent.name] = agent.status;
    });

    // Calculate strategic alignment
    const strategicAlignment: Record<string, string[]> = {};
    objectives.forEach(objective => {
      const contributingAgentNames = objective.contributingAgents
        .map(id => agents.find(a => a.id === id)?.name)
        .filter(Boolean) as string[];
      strategicAlignment[objective.title] = contributingAgentNames;
    });

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (conflicts.filter(c => c.status === "active").length > 0) {
      recommendations.push("Resolve active conflicts to improve system alignment");
    }
    
    const delayedAgents = agents.filter(a => a.status === "delayed");
    if (delayedAgents.length > 0) {
      recommendations.push(`Address sync delays for ${delayedAgents.map(a => a.name).join(", ")}`);
    }
    
    const lowAlignmentObjectives = objectives.filter(o => o.progress < 60);
    if (lowAlignmentObjectives.length > 0) {
      recommendations.push("Focus on underperforming strategic objectives");
    }

    if (recommendations.length === 0) {
      recommendations.push("System operating optimally - maintain current performance");
    }

    // Generate highlights
    const highlights: string[] = [];
    const resolvedConflicts = conflicts.filter(c => c.status === "resolved").length;
    const totalConflicts = conflicts.length;
    
    if (resolvedConflicts > 0) {
      highlights.push(`${resolvedConflicts} conflicts resolved this period`);
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
      conflictsResolved: resolvedConflicts,
      strategicAlignment,
      recommendations,
      highlights
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
