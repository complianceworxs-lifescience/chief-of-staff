import { storage } from "../storage";
import { type InsertWeeklyReport, type WeeklyReport } from "@shared/schema";

export class ReportGenerator {

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
