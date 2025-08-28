import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
// import { parse as parseHtml } from "node-html-parser"; // TODO: Install package if needed

export interface EmailData {
  subject: string;
  body: string;
  from: string;
  received_at: string;
  html?: string;
}

export interface GmailPullResult {
  success: boolean;
  messages_processed: number;
  files_updated: string[];
  errors: string[];
}

interface ParsedEmailData {
  scoreboard?: any;
  initiatives?: any[];
  decisions?: any[];
  actions?: any[];
  meetings?: any[];
  insights?: any[];
}

export class EmailIngestService {
  private dataPath: string;
  private gmailPullScript: string;

  constructor() {
    this.dataPath = path.join(process.cwd(), "server", "data");
    this.gmailPullScript = path.join(process.cwd(), "server", "services", "gmail-pull.py");
  }

  /**
   * Pull emails from Gmail using Python service
   */
  async pullGmailEmails(): Promise<GmailPullResult> {
    console.log("📧 Starting Gmail email pull...");
    
    return new Promise((resolve) => {
      const result: GmailPullResult = {
        success: false,
        messages_processed: 0,
        files_updated: [],
        errors: []
      };

      // Execute Python Gmail puller
      const pythonProcess = spawn("python3", [this.gmailPullScript], {
        env: { ...process.env, PYTHONPATH: process.cwd() },
        cwd: process.cwd()
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        console.log(output.trim());
      });

      pythonProcess.stderr.on("data", (data) => {
        const error = data.toString();
        stderr += error;
        console.error("Gmail pull error:", error.trim());
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          result.success = true;
          
          // Parse output to extract metrics
          const lines = stdout.split("\n");
          for (const line of lines) {
            if (line.includes("Retrieved") && line.includes("messages")) {
              const match = line.match(/(\d+) messages/);
              if (match) result.messages_processed = parseInt(match[1]);
            }
            if (line.includes("Updated") || line.includes("Added")) {
              const fileMatch = line.match(/(scoreboard|actions|meetings|insights|decisions)\.json/);
              if (fileMatch) result.files_updated.push(fileMatch[1]);
            }
          }
          
          console.log(`✅ Gmail pull completed: ${result.messages_processed} messages processed`);
        } else {
          result.success = false;
          result.errors.push(`Gmail pull failed with exit code ${code}`);
          if (stderr) result.errors.push(stderr);
        }

        resolve(result);
      });

      pythonProcess.on("error", (error) => {
        result.success = false;
        result.errors.push(`Failed to start Gmail pull: ${error.message}`);
        resolve(result);
      });
    });
  }

  /**
   * Check Gmail authentication status
   */
  async checkGmailAuth(): Promise<{ authenticated: boolean; mode?: string; error?: string }> {
    const mode = process.env.GMAIL_AUTH_MODE || "service";
    
    if (mode === "service") {
      const gsaJson = process.env.GSA_JSON;
      const impersonate = process.env.GMAIL_IMPERSONATE;
      
      if (!gsaJson || !impersonate) {
        return {
          authenticated: false,
          error: "Missing GSA_JSON or GMAIL_IMPERSONATE environment variables"
        };
      }
      
      try {
        JSON.parse(gsaJson);
        return { authenticated: true, mode: "service" };
      } catch {
        return {
          authenticated: false,
          error: "Invalid GSA_JSON format"
        };
      }
    } else if (mode === "oauth") {
      const clientId = process.env.OAUTH_CLIENT_ID;
      const clientSecret = process.env.OAUTH_CLIENT_SECRET;
      const refreshToken = process.env.OAUTH_REFRESH_TOKEN;
      
      if (!clientId || !clientSecret || !refreshToken) {
        return {
          authenticated: false,
          error: "Missing OAuth environment variables"
        };
      }
      
      return { authenticated: true, mode: "oauth" };
    }
    
    return {
      authenticated: false,
      error: "Invalid GMAIL_AUTH_MODE (must be 'service' or 'oauth')"
    };
  }

  /**
   * Get configuration status for Gmail integration
   */
  getConfigStatus() {
    return {
      gmail_auth_mode: process.env.GMAIL_AUTH_MODE || "not_set",
      gmail_label: process.env.GMAIL_LABEL || "cw/daily-reports",
      gmail_query: process.env.GMAIL_QUERY || 'label:"cw/daily-reports" newer_than:2d',
      data_dir: process.env.DATA_DIR || "server/data",
      has_service_account: !!process.env.GSA_JSON,
      has_oauth_config: !!(process.env.OAUTH_CLIENT_ID && process.env.OAUTH_CLIENT_SECRET && process.env.OAUTH_REFRESH_TOKEN),
      has_impersonation: !!process.env.GMAIL_IMPERSONATE
    };
  }

  async processInboundEmail(emailData: EmailData): Promise<ParsedEmailData> {
    console.log(`Processing email: ${emailData.subject}`);
    
    // Parse email content based on subject patterns
    const parsed = await this.parseEmailContent(emailData);
    
    // Write to appropriate JSON files
    await this.writeDataFiles(parsed);
    
    return parsed;
  }

  private async parseEmailContent(emailData: EmailData): Promise<ParsedEmailData> {
    const { subject, body, html } = emailData;
    const content = html || body;

    // CEO Oversight / Dashboard Summary emails
    if (this.isScoreboardEmail(subject)) {
      return this.parseScoreboardEmail(content);
    }
    
    // Initiative Status Updates
    if (this.isInitiativeEmail(subject)) {
      return this.parseInitiativeEmail(content);
    }
    
    // Decision Request emails
    if (this.isDecisionEmail(subject)) {
      return this.parseDecisionEmail(content);
    }
    
    // Meeting Summaries
    if (this.isMeetingEmail(subject)) {
      return this.parseMeetingEmail(content);
    }

    // Market Intelligence / Insights
    if (this.isInsightEmail(subject)) {
      return this.parseInsightEmail(content);
    }

    // Generic parsing fallback
    return this.parseGenericEmail(content);
  }

  private isScoreboardEmail(subject: string): boolean {
    const patterns = [
      /CEO Oversight/i,
      /Daily Dashboard/i,
      /Morning Scorecard/i,
      /Executive Summary/i,
      /KPI Report/i
    ];
    return patterns.some(pattern => pattern.test(subject));
  }

  private isInitiativeEmail(subject: string): boolean {
    const patterns = [
      /Initiative Update/i,
      /Project Status/i,
      /RAG Report/i,
      /Milestone Update/i
    ];
    return patterns.some(pattern => pattern.test(subject));
  }

  private isDecisionEmail(subject: string): boolean {
    const patterns = [
      /Decision Required/i,
      /Approval Needed/i,
      /Urgent Decision/i,
      /CEO Approval/i
    ];
    return patterns.some(pattern => pattern.test(subject));
  }

  private isMeetingEmail(subject: string): boolean {
    const patterns = [
      /Meeting Summary/i,
      /Standup Notes/i,
      /Action Items/i,
      /Meeting Minutes/i
    ];
    return patterns.some(pattern => pattern.test(subject));
  }

  private isInsightEmail(subject: string): boolean {
    const patterns = [
      /Market Intelligence/i,
      /Competitive Update/i,
      /Industry Insight/i,
      /Regulatory Alert/i
    ];
    return patterns.some(pattern => pattern.test(subject));
  }

  private async parseScoreboardEmail(content: string): Promise<ParsedEmailData> {
    // const doc = parseHtml(content); // TODO: Implement HTML parsing when needed
    
    // Extract KPI metrics from email content
    const revenue = this.extractRevenueData(content);
    const initiatives = this.extractInitiativeMetrics(content);
    const autonomy = this.extractAutonomyMetrics(content);
    const risk = this.extractRiskMetrics(content);

    const scoreboard = {
      date: new Date().toISOString().split('T')[0],
      revenue: revenue || { realized_week: 0, target_week: 50000, upsells: 0 },
      initiatives: initiatives || { on_time_pct: 80, risk_inverted: 75, resource_ok_pct: 85, dependency_clear_pct: 70 },
      alignment: { work_tied_to_objectives_pct: 85 },
      autonomy: autonomy || { auto_resolve_pct: 90, mttr_min: 5.0 },
      risk: risk || { score: 75, high: 1, medium: 2, next_deadline_hours: 24 },
      narrative: this.extractNarrative(content)
    };

    return { scoreboard };
  }

  private extractRevenueData(content: string): any {
    // Look for revenue patterns in email content
    const revenueMatch = content.match(/revenue[:\s]*\$?([0-9,]+)/i);
    const targetMatch = content.match(/target[:\s]*\$?([0-9,]+)/i);
    const upsellMatch = content.match(/upsell[:\s]*\$?([0-9,]+)/i);

    return {
      realized_week: revenueMatch ? parseInt(revenueMatch[1].replace(/,/g, '')) : 0,
      target_week: targetMatch ? parseInt(targetMatch[1].replace(/,/g, '')) : 50000,
      upsells: upsellMatch ? parseInt(upsellMatch[1].replace(/,/g, '')) : 0
    };
  }

  private extractInitiativeMetrics(content: string): any {
    // Extract initiative health percentages
    const onTimeMatch = content.match(/on[- ]?time[:\s]*([0-9]+)%/i);
    const riskMatch = content.match(/risk[- ]?inverted[:\s]*([0-9]+)%/i);
    const resourceMatch = content.match(/resource[:\s]*([0-9]+)%/i);

    return {
      on_time_pct: onTimeMatch ? parseInt(onTimeMatch[1]) : 80,
      risk_inverted: riskMatch ? parseInt(riskMatch[1]) : 75,
      resource_ok_pct: resourceMatch ? parseInt(resourceMatch[1]) : 85,
      dependency_clear_pct: 70
    };
  }

  private extractAutonomyMetrics(content: string): any {
    const autoResolveMatch = content.match(/auto[- ]?resolve[:\s]*([0-9]+)%/i);
    const mttrMatch = content.match(/mttr[:\s]*([0-9.]+)/i);

    return {
      auto_resolve_pct: autoResolveMatch ? parseInt(autoResolveMatch[1]) : 90,
      mttr_min: mttrMatch ? parseFloat(mttrMatch[1]) : 5.0
    };
  }

  private extractRiskMetrics(content: string): any {
    const riskScoreMatch = content.match(/risk[- ]?score[:\s]*([0-9]+)/i);
    const highRiskMatch = content.match(/high[- ]?risk[:\s]*([0-9]+)/i);
    const mediumRiskMatch = content.match(/medium[- ]?risk[:\s]*([0-9]+)/i);

    return {
      score: riskScoreMatch ? parseInt(riskScoreMatch[1]) : 75,
      high: highRiskMatch ? parseInt(highRiskMatch[1]) : 1,
      medium: mediumRiskMatch ? parseInt(mediumRiskMatch[1]) : 2,
      next_deadline_hours: 24
    };
  }

  private extractNarrative(content: string): any {
    // Extract key narrative elements
    return {
      topic: "Email analysis",
      linkedin_er_delta_pct: 0,
      email_ctr_delta_pct: 0,
      quiz_to_paid_delta_pct: 0,
      conversions: 0
    };
  }

  private async parseInitiativeEmail(content: string): Promise<ParsedEmailData> {
    // Parse initiative status updates
    const initiatives = this.extractInitiativesList(content);
    return { initiatives };
  }

  private extractInitiativesList(content: string): any[] {
    // Basic extraction - in production would use more sophisticated parsing
    return [
      {
        name: "Email-derived initiative",
        owner: "CRO",
        health_score: 75,
        rag: "amber",
        milestones: [],
        risks: [],
        path_to_green: ["Review email content", "Extract action items"]
      }
    ];
  }

  private async parseDecisionEmail(content: string): Promise<ParsedEmailData> {
    const decisions = [{
      decision: "Email-based decision required",
      urgency: "medium",
      impact: "operational",
      deadline: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
      context: "Extracted from email content",
      options: ["Approve", "Defer", "Request more info"]
    }];

    return { decisions };
  }

  private async parseMeetingEmail(content: string): Promise<ParsedEmailData> {
    const meetings = [{
      title: "Email Meeting Summary",
      date: new Date().toISOString().split('T')[0],
      attendees: ["CEO"],
      key_decisions: ["Review email content"],
      action_items: ["Process email directives"]
    }];

    return { meetings };
  }

  private async parseInsightEmail(content: string): Promise<ParsedEmailData> {
    const insights = [{
      id: `insight_${Date.now()}`,
      title: "Email Market Intelligence",
      insight: "Market insight extracted from email",
      source: "email",
      confidence: 0.7,
      impact: "medium",
      created_at: new Date().toISOString()
    }];

    return { insights };
  }

  private async parseGenericEmail(content: string): Promise<ParsedEmailData> {
    // Generic email parsing - extract what we can
    const actions = [{
      title: "Process email content",
      owner: "CoS",
      due: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
      priority: "medium",
      kpi_impact: "Email processing efficiency",
      estimated_hours: 1
    }];

    return { actions };
  }

  private async writeDataFiles(parsed: ParsedEmailData): Promise<void> {
    const promises: Promise<void>[] = [];

    if (parsed.scoreboard) {
      promises.push(this.writeJsonFile("scoreboard.json", parsed.scoreboard));
    }

    if (parsed.initiatives) {
      promises.push(this.mergeJsonFile("initiatives.json", parsed.initiatives));
    }

    if (parsed.decisions) {
      promises.push(this.mergeJsonFile("decisions.json", parsed.decisions));
    }

    if (parsed.actions) {
      promises.push(this.mergeJsonFile("actions.json", parsed.actions));
    }

    if (parsed.meetings) {
      promises.push(this.mergeJsonFile("meetings.json", parsed.meetings));
    }

    if (parsed.insights) {
      promises.push(this.mergeJsonFile("insights.json", parsed.insights));
    }

    await Promise.all(promises);
  }

  private async writeJsonFile(filename: string, data: any): Promise<void> {
    const filePath = path.join(this.dataPath, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${filename} with email data`);
  }

  private async mergeJsonFile(filename: string, newData: any[]): Promise<void> {
    const filePath = path.join(this.dataPath, filename);
    
    try {
      const existing = JSON.parse(await fs.readFile(filePath, "utf-8"));
      const merged = Array.isArray(existing) ? [...existing, ...newData] : newData;
      await fs.writeFile(filePath, JSON.stringify(merged, null, 2));
      console.log(`Merged new data into ${filename}`);
    } catch {
      // File doesn't exist, create new
      await fs.writeFile(filePath, JSON.stringify(newData, null, 2));
      console.log(`Created ${filename} with email data`);
    }
  }
}

export const emailIngest = new EmailIngestService();