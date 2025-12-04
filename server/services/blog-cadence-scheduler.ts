/**
 * ====================================================
 * BLOG CADENCE SCHEDULER
 * ====================================================
 * 
 * Chief of Staff Scheduling Directive – Blog Cadence
 * 
 * Frequency: 2 posts per week
 * Days: Monday and Thursday
 * Time: 15:00 UTC
 * 
 * This scheduler automatically triggers RUN_BLOG_PUBLISH_PIPELINE
 * at the configured times.
 */

import { blogPublishPipeline } from './blog-publish-pipeline.js';
import * as fs from 'fs';

interface SchedulerState {
  enabled: boolean;
  lastRun: string | null;
  nextScheduledRun: string | null;
  executionHistory: Array<{
    timestamp: string;
    day: string;
    success: boolean;
    pipelineId?: string;
    postUrl?: string;
    error?: string;
  }>;
}

class BlogCadenceScheduler {
  private schedulerInterval: NodeJS.Timeout | null = null;
  private stateFilePath = 'state/blog_scheduler_state.json';
  private state: SchedulerState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): SchedulerState {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        return JSON.parse(fs.readFileSync(this.stateFilePath, 'utf-8'));
      }
    } catch (error) {
      console.log('📅 Blog Scheduler: Initializing fresh state');
    }
    
    return {
      enabled: true,
      lastRun: null,
      nextScheduledRun: null,
      executionHistory: []
    };
  }

  private saveState(): void {
    try {
      const dir = 'state';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('❌ Blog Scheduler: Failed to save state:', error);
    }
  }

  getScheduleConfig(): { days: string[]; time_utc: string; enabled: boolean } {
    try {
      const directive = JSON.parse(fs.readFileSync('state/L7_MASTER_DIRECTIVE.json', 'utf-8'));
      const scheduler = directive.SCHEDULER?.BLOG_CADENCE;
      
      if (scheduler) {
        return {
          days: scheduler.days || ['MON', 'THU'],
          time_utc: scheduler.time_utc || '15:00',
          enabled: scheduler.enabled !== false
        };
      }
    } catch {
      // Default config
    }
    
    return {
      days: ['MON', 'THU'],
      time_utc: '15:00',
      enabled: true
    };
  }

  private getDayName(date: Date): string {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getUTCDay()];
  }

  private isScheduledTime(): boolean {
    const config = this.getScheduleConfig();
    const now = new Date();
    const currentDay = this.getDayName(now);
    const [scheduleHour, scheduleMinute] = config.time_utc.split(':').map(Number);

    // Check if it's a scheduled day
    if (!config.days.includes(currentDay)) {
      return false;
    }

    // Check if it's within 5 minutes of scheduled time
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    if (currentHour !== scheduleHour) return false;
    if (Math.abs(currentMinute - scheduleMinute) > 5) return false;

    // Check if we already ran today
    if (this.state.lastRun) {
      const lastRun = new Date(this.state.lastRun);
      const isSameDay = lastRun.toISOString().split('T')[0] === now.toISOString().split('T')[0];
      if (isSameDay) return false;
    }

    return true;
  }

  getNextScheduledRun(): string {
    const config = this.getScheduleConfig();
    const now = new Date();
    const [scheduleHour, scheduleMinute] = config.time_utc.split(':').map(Number);

    // Find next scheduled day
    for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
      const checkDate = new Date(now);
      checkDate.setUTCDate(checkDate.getUTCDate() + daysAhead);
      checkDate.setUTCHours(scheduleHour, scheduleMinute, 0, 0);

      const dayName = this.getDayName(checkDate);
      
      if (config.days.includes(dayName)) {
        // If it's today, check if the time has passed
        if (daysAhead === 0 && checkDate <= now) {
          continue;
        }
        return checkDate.toISOString();
      }
    }

    return 'Unknown';
  }

  async runPipeline(): Promise<void> {
    if (!this.state.enabled) {
      console.log('📅 Blog Scheduler: Scheduler is disabled');
      return;
    }

    const config = this.getScheduleConfig();
    if (!config.enabled) {
      console.log('📅 Blog Scheduler: Blog cadence is disabled in L7 directive');
      return;
    }

    console.log('\n📅 Blog Scheduler: Triggering RUN_BLOG_PUBLISH_PIPELINE');
    
    const now = new Date();
    const currentDay = this.getDayName(now);
    
    try {
      const result = await blogPublishPipeline.runBlogPublishPipeline();
      
      this.state.lastRun = now.toISOString();
      this.state.nextScheduledRun = this.getNextScheduledRun();
      this.state.executionHistory.unshift({
        timestamp: now.toISOString(),
        day: currentDay,
        success: result.success,
        pipelineId: result.pipelineId,
        postUrl: result.wordpress?.postUrl,
        error: result.error
      });

      // Keep last 50 executions
      if (this.state.executionHistory.length > 50) {
        this.state.executionHistory = this.state.executionHistory.slice(0, 50);
      }

      this.saveState();

      if (result.success) {
        console.log(`✅ Blog Scheduler: Post published successfully at ${result.wordpress?.postUrl}`);
      } else {
        console.log(`⚠️ Blog Scheduler: Pipeline completed with issues - ${result.error}`);
      }
    } catch (error: any) {
      console.error('❌ Blog Scheduler: Pipeline execution failed:', error.message);
      
      this.state.executionHistory.unshift({
        timestamp: now.toISOString(),
        day: currentDay,
        success: false,
        error: error.message
      });
      this.saveState();
    }
  }

  start(): void {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       BLOG CADENCE SCHEDULER STARTED                             ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    
    const config = this.getScheduleConfig();
    console.log(`   📅 Schedule: ${config.days.join(', ')} at ${config.time_utc} UTC`);
    console.log(`   🔄 Status: ${config.enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   ⏰ Next run: ${this.getNextScheduledRun()}`);

    // Check every minute
    this.schedulerInterval = setInterval(() => {
      if (this.isScheduledTime()) {
        this.runPipeline();
      }
    }, 60000);

    // Also check immediately on start
    setTimeout(() => {
      if (this.isScheduledTime()) {
        this.runPipeline();
      }
    }, 5000);
  }

  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    console.log('📅 Blog Scheduler: Stopped');
  }

  enable(): void {
    this.state.enabled = true;
    this.saveState();
    console.log('📅 Blog Scheduler: Enabled');
  }

  disable(): void {
    this.state.enabled = false;
    this.saveState();
    console.log('📅 Blog Scheduler: Disabled');
  }

  getStatus(): {
    enabled: boolean;
    lastRun: string | null;
    nextScheduledRun: string;
    schedule: { days: string[]; time_utc: string };
    recentExecutions: SchedulerState['executionHistory'];
  } {
    const config = this.getScheduleConfig();
    return {
      enabled: this.state.enabled && config.enabled,
      lastRun: this.state.lastRun,
      nextScheduledRun: this.getNextScheduledRun(),
      schedule: {
        days: config.days,
        time_utc: config.time_utc
      },
      recentExecutions: this.state.executionHistory.slice(0, 10)
    };
  }

  async triggerManualRun(): Promise<any> {
    console.log('📅 Blog Scheduler: Manual trigger requested');
    await this.runPipeline();
    return this.getStatus();
  }
}

export const blogCadenceScheduler = new BlogCadenceScheduler();
