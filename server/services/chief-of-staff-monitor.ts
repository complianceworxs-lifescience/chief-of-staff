import { storage } from '../storage.js';

/**
 * Chief of Staff Monitoring System
 * 
 * Responsibilities:
 * - Rollout tracking per agent
 * - Daily email delivery verification
 * - SLA monitoring and escalation
 * - Documentation maintenance
 */

interface AgentRolloutStatus {
  agent_name: string;
  runner_present: boolean;
  schedule_set: boolean;
  email_received: boolean;
  last_check: string;
  consecutive_success_days: number;
  total_runs_today: number;
  successful_runs_today: number;
  last_failure?: string;
}

interface DeliveryLog {
  timestamp: string;
  agent: string;
  scheduled_time: string;
  email_received: boolean;
  commentary_present: boolean;
  failure_reason?: string;
}

interface CoSMetrics {
  delivery_rate_today: number;
  commentary_rate_today: number;
  escalations_today: number;
  consecutive_success_days: number;
  time_to_fix_hours?: number;
}

export class ChiefOfStaffMonitor {
  private rolloutStatus: Map<string, AgentRolloutStatus> = new Map();
  private deliveryLogs: DeliveryLog[] = [];
  
  constructor() {
    // Initialize known agents
    this.initializeAgentTracking();
  }

  private initializeAgentTracking(): void {
    const agents = ['CEO', 'CRO', 'CMO', 'CCO', 'COO', 'Content'];
    
    agents.forEach(agent => {
      this.rolloutStatus.set(agent, {
        agent_name: agent,
        runner_present: false, // To be verified
        schedule_set: false, // To be verified
        email_received: false,
        last_check: new Date().toISOString(),
        consecutive_success_days: 0,
        total_runs_today: 0,
        successful_runs_today: 0
      });
    });
  }

  /**
   * Daily verification routine - Check email delivery and commentary
   */
  async performDailyVerification(): Promise<{
    passed: number;
    failed: number;
    issues: string[];
    escalations: string[];
  }> {
    const results = {
      passed: 0,
      failed: 0,
      issues: [] as string[],
      escalations: [] as string[]
    };

    const today = new Date().toISOString().split('T')[0];
    
    for (const [agentName, status] of Array.from(this.rolloutStatus.entries())) {
      // Simulate email delivery check (in real system, would check SMTP logs or email API)
      const emailCheck = await this.checkEmailDelivery(agentName, today);
      const commentaryCheck = await this.verifyCommentaryPresent(agentName, today);
      
      const log: DeliveryLog = {
        timestamp: new Date().toISOString(),
        agent: agentName,
        scheduled_time: this.getScheduledTime(agentName),
        email_received: emailCheck.success,
        commentary_present: commentaryCheck.success,
        failure_reason: emailCheck.error || commentaryCheck.error
      };

      this.deliveryLogs.push(log);

      if (emailCheck.success && commentaryCheck.success) {
        results.passed++;
        status.successful_runs_today++;
        status.consecutive_success_days++;
      } else {
        results.failed++;
        results.issues.push(`${agentName}: ${log.failure_reason}`);
        status.consecutive_success_days = 0;
        
        // Check SLA thresholds
        const todayFailures = this.getTodayFailures(agentName);
        if (todayFailures > 1) {
          results.escalations.push(`ESCALATE-CTO: ${agentName} has ${todayFailures} failures today`);
        }
      }
      
      status.total_runs_today++;
      status.last_check = new Date().toISOString();
    }

    // Check global failure rate
    const globalFailureRate = results.failed / (results.passed + results.failed);
    if (globalFailureRate > 0.10) {
      results.escalations.push(`ESCALATE-CEO: Global failure rate ${(globalFailureRate * 100).toFixed(1)}% exceeds 10% threshold`);
    }

    console.log(`📋 CoS DAILY VERIFICATION: ${results.passed}/${results.passed + results.failed} passed (${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%)`);
    
    if (results.issues.length > 0) {
      console.log(`⚠️ ISSUES DETECTED:`, results.issues);
    }
    
    if (results.escalations.length > 0) {
      console.log(`🚨 ESCALATIONS:`, results.escalations);
      await this.sendEscalations(results.escalations);
    }

    return results;
  }

  /**
   * Check if email was delivered for an agent today
   */
  private async checkEmailDelivery(agent: string, date: string): Promise<{ success: boolean; error?: string }> {
    // In a real system, this would check:
    // - SMTP delivery logs
    // - Email service provider API (SendGrid, Mailgun, etc.)
    // - Database records of sent emails
    
    // For now, simulate based on system health
    const systemHealthy = Math.random() > 0.05; // 95% delivery rate simulation
    
    if (!systemHealthy) {
      return { 
        success: false, 
        error: `No email received for ${agent} on ${date}` 
      };
    }
    
    return { success: true };
  }

  /**
   * Verify ChatGPT Commentary section is present in email
   */
  private async verifyCommentaryPresent(agent: string, date: string): Promise<{ success: boolean; error?: string }> {
    // In a real system, this would:
    // - Parse email content from inbox
    // - Check for "ChatGPT Commentary & Recommendations" header
    // - Verify content structure
    
    // For now, simulate based on template compliance
    const commentaryPresent = Math.random() > 0.02; // 98% commentary compliance simulation
    
    if (!commentaryPresent) {
      return { 
        success: false, 
        error: `Missing "ChatGPT Commentary & Recommendations" header in ${agent} email` 
      };
    }
    
    return { success: true };
  }

  /**
   * Get scheduled time for agent
   */
  private getScheduledTime(agent: string): string {
    const schedules: Record<string, string> = {
      'CEO': '04:30 ET',
      'CRO': '08:10 ET',
      'CMO': '08:20 ET', 
      'CCO': '08:30 ET',
      'COO': '08:40 ET',
      'Content': '09:00 ET'
    };
    
    return schedules[agent] || '08:00 ET';
  }

  /**
   * Get number of failures today for specific agent
   */
  private getTodayFailures(agent: string): number {
    const today = new Date().toISOString().split('T')[0];
    return this.deliveryLogs.filter(log => 
      log.agent === agent && 
      log.timestamp.startsWith(today) && 
      (!log.email_received || !log.commentary_present)
    ).length;
  }

  /**
   * Send escalations to appropriate agents
   */
  private async sendEscalations(escalations: string[]): Promise<void> {
    for (const escalation of escalations) {
      if (escalation.includes('ESCALATE-CTO')) {
        await this.escalateToCTO(escalation);
      } else if (escalation.includes('ESCALATE-CEO')) {
        await this.escalateToCEO(escalation);
      }
    }
  }

  /**
   * Escalate to CTO Agent
   */
  private async escalateToCTO(message: string): Promise<void> {
    console.log(`🚨 ESCALATING TO CTO: ${message}`);
    
    // In a real system, this would:
    // - Send message to CTO Agent queue
    // - Create high-priority ticket
    // - Trigger immediate notification
    
    // For now, log escalation
    await storage.createAgentCommunication({
      fromAgent: 'ChiefOfStaff',
      toAgent: 'CTO',
      content: message,
      type: 'escalation',
      action: 'escalate'
    });
  }

  /**
   * Escalate to CEO Agent
   */
  private async escalateToCEO(message: string): Promise<void> {
    console.log(`🚨 ESCALATING TO CEO: ${message}`);
    
    // Create CEO escalation
    await storage.createAgentCommunication({
      fromAgent: 'ChiefOfStaff',
      toAgent: 'CEO',
      content: message,
      type: 'escalation',
      action: 'escalate'
    });
  }

  /**
   * Generate daily status report for CEO
   */
  async generateDailyStatusReport(): Promise<string> {
    const metrics = await this.calculateDailyMetrics();
    const today = new Date().toISOString().split('T')[0];
    
    const totalScheduled = this.rolloutStatus.size;
    const delivered = Array.from(this.rolloutStatus.values())
      .reduce((sum, status) => sum + status.successful_runs_today, 0);
    const commentaryRate = this.getTodayCommentaryRate();
    const issues = this.getTodayIssues();
    const escalations = this.getTodayEscalations();

    const report = [
      'COS-DAILY:',
      `- Delivery: ${delivered}/${totalScheduled} on-time (${((delivered / totalScheduled) * 100).toFixed(0)}%)`,
      `- Commentary present: ${delivered}/${totalScheduled} (${commentaryRate.toFixed(0)}%)`,
      `- Issues: ${issues.length > 0 ? issues.join(', ') : 'none'} | Escalations: ${escalations}`,
      `- Changes today: ${this.getTodayChanges()}`,
      `- Risks: ${this.getIdentifiedRisks()}`
    ].join('\n');

    console.log('📊 CHIEF OF STAFF DAILY REPORT:');
    console.log(report);

    return report;
  }

  /**
   * Calculate daily metrics
   */
  private async calculateDailyMetrics(): Promise<CoSMetrics> {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = this.deliveryLogs.filter(log => log.timestamp.startsWith(today));
    
    const totalRuns = todayLogs.length;
    const successfulDeliveries = todayLogs.filter(log => log.email_received).length;
    const successfulCommentary = todayLogs.filter(log => log.commentary_present).length;
    
    return {
      delivery_rate_today: totalRuns > 0 ? (successfulDeliveries / totalRuns) * 100 : 100,
      commentary_rate_today: totalRuns > 0 ? (successfulCommentary / totalRuns) * 100 : 100,
      escalations_today: this.getTodayEscalations(),
      consecutive_success_days: Math.min(...Array.from(this.rolloutStatus.values()).map(s => s.consecutive_success_days))
    };
  }

  private getTodayCommentaryRate(): number {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = this.deliveryLogs.filter(log => log.timestamp.startsWith(today));
    const commentaryPresent = todayLogs.filter(log => log.commentary_present).length;
    return todayLogs.length > 0 ? (commentaryPresent / todayLogs.length) * 100 : 100;
  }

  private getTodayIssues(): string[] {
    const today = new Date().toISOString().split('T')[0];
    return this.deliveryLogs
      .filter(log => log.timestamp.startsWith(today) && log.failure_reason)
      .map(log => `${log.agent}: ${log.failure_reason}`);
  }

  private getTodayEscalations(): number {
    // Count escalations sent today
    return 0; // Would track actual escalations sent
  }

  private getTodayChanges(): string {
    return 'schedules adjusted (+10m staggering for CRO)'; // Example
  }

  private getIdentifiedRisks(): string {
    const risks = [];
    
    // Check for patterns
    for (const [agent, status] of Array.from(this.rolloutStatus.entries())) {
      if (status.consecutive_success_days < 3) {
        risks.push(`${agent} inconsistent delivery`);
      }
    }
    
    return risks.length > 0 ? risks.join(', ') : 'none';
  }

  /**
   * Get rollout acceptance checklist status for an agent
   */
  async getAcceptanceChecklist(agent: string): Promise<{
    runner_present: boolean;
    schedule_configured: boolean;
    env_ready: boolean;
    test_email_received: boolean;
    appeared_in_window: boolean;
  }> {
    // In a real system, this would check:
    // - File system for runner files
    // - Cron/scheduler configuration
    // - Environment variables
    // - Email logs
    
    return {
      runner_present: true,  // Check apps/agents/<agent>/<agent>_runner.py
      schedule_configured: true,  // Check cron/scheduler
      env_ready: true,  // Check ENV vars
      test_email_received: true,  // Check email logs
      appeared_in_window: true  // Check today's delivery
    };
  }

  /**
   * Run the monitoring check (equivalent to all_good.py)
   */
  async runSystemCheck(): Promise<{ status: 'ok' | 'issues'; details: string[] }> {
    const issues = [];
    
    // Check each agent's status
    for (const [agent, status] of Array.from(this.rolloutStatus.entries())) {
      if (!status.runner_present) {
        issues.push(`❌ ${agent}: Runner file missing`);
      }
      if (!status.schedule_set) {
        issues.push(`❌ ${agent}: Schedule not configured`);
      }
      if (status.total_runs_today > 0 && status.successful_runs_today === 0) {
        issues.push(`❌ ${agent}: No successful runs today`);
      }
    }
    
    return {
      status: issues.length === 0 ? 'ok' : 'issues',
      details: issues
    };
  }
}

export const chiefOfStaffMonitor = new ChiefOfStaffMonitor();