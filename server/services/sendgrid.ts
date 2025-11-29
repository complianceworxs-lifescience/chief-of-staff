import fetch from 'node-fetch';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { db } from '../db';
import { performanceLedger } from '@shared/schema';

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  sendId?: string;
  campaignId?: string;
  persona?: string;
  segment?: string;
  problemAngle?: string;
  metricFocus?: string;
  toneStyle?: string;
  ctaType?: string;
  doctrineScore?: number;
  validatorPass?: boolean;
  vqsBand?: string;
  batchId?: string;
}

interface SendGridPersonalization {
  to: { email: string }[];
  custom_args?: Record<string, string>;
}

interface SendGridMessage {
  personalizations: SendGridPersonalization[];
  from: { email: string; name: string };
  subject: string;
  content: { type: string; value: string }[];
  tracking_settings?: {
    click_tracking?: { enable: boolean };
    open_tracking?: { enable: boolean };
  };
}

export class SendGridService {
  private config: SendGridConfig;
  private baseUrl = 'https://api.sendgrid.com/v3';

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@complianceworxs.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'ComplianceWorxs';

    if (!apiKey) {
      console.warn('⚠️ SENDGRID_API_KEY not configured - SendGrid service disabled');
    }

    this.config = { apiKey: apiKey || '', fromEmail, fromName };
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; sendId: string; error?: string }> {
    if (!this.isConfigured()) {
      console.warn('⚠️ SendGrid not configured - email not sent');
      return { success: false, sendId: '', error: 'SendGrid not configured' };
    }

    const sendId = options.sendId || `sg_${nanoid(12)}`;

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      
      const message: SendGridMessage = {
        personalizations: [{
          to: recipients.map(email => ({ email })),
          custom_args: {
            send_id: sendId,
            campaign_id: options.campaignId || '',
            persona: options.persona || '',
            segment: options.segment || ''
          }
        }],
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        subject: options.subject,
        content: [
          ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          { type: 'text/html', value: options.html }
        ],
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true }
        }
      };

      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ SendGrid API error (${response.status}): ${errorText}`);
        return { success: false, sendId, error: errorText };
      }

      if (options.campaignId) {
        const primaryRecipient = Array.isArray(options.to) ? options.to[0] : options.to;
        await this.recordInLedger(sendId, options, primaryRecipient);
      }

      console.log(`✅ SendGrid: Email sent successfully (send_id: ${sendId})`);
      return { success: true, sendId };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ SendGrid send error: ${errorMessage}`);
      return { success: false, sendId, error: errorMessage };
    }
  }

  private async recordInLedger(sendId: string, options: EmailOptions, recipientEmail?: string): Promise<void> {
    try {
      const subjectHash = this.hashString(options.subject);
      const bodyHash = this.hashString(options.html);
      const recipientEmailHash = recipientEmail 
        ? crypto.createHash('md5').update(recipientEmail.toLowerCase().trim()).digest('hex')
        : undefined;

      await db.insert(performanceLedger).values({
        sendId,
        campaignId: options.campaignId || 'unknown',
        recipientEmailHash,
        persona: options.persona || 'unknown',
        segment: options.segment,
        problemAngle: options.problemAngle,
        metricFocus: options.metricFocus,
        toneStyle: options.toneStyle,
        ctaType: options.ctaType,
        doctrineScore: options.doctrineScore,
        validatorPass: options.validatorPass ?? false,
        vqsBand: options.vqsBand,
        subjectLine: options.subject,
        subjectHash,
        bodyHash,
        batchId: options.batchId,
        opens: 0,
        clicks: 0,
        replies: 0,
        positiveReplies: 0,
        bookedCalls: 0,
        pipelineValueEst: 0,
        revenueAttribEst: 0
      }).onConflictDoNothing();

      console.log(`📊 L6 LEDGER: Recorded send ${sendId} for campaign ${options.campaignId}`);
    } catch (error) {
      console.error(`⚠️ Failed to record in ledger: ${error}`);
    }
  }

  private hashString(str: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  async sendBulkEmails(
    emails: Array<{ to: string; subject: string; html: string; text?: string }>,
    campaignOptions: Omit<EmailOptions, 'to' | 'subject' | 'html' | 'text'>
  ): Promise<{ sent: number; failed: number; sendIds: string[] }> {
    const results = { sent: 0, failed: 0, sendIds: [] as string[] };
    const batchId = `batch_${nanoid(8)}`;

    for (const email of emails) {
      const result = await this.sendEmail({
        ...email,
        ...campaignOptions,
        batchId
      });

      if (result.success) {
        results.sent++;
        results.sendIds.push(result.sendId);
      } else {
        results.failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📧 SendGrid Bulk: ${results.sent} sent, ${results.failed} failed (batch: ${batchId})`);
    return results;
  }
}

export const sendgrid = new SendGridService();
