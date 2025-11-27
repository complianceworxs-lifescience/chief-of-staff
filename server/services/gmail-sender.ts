/**
 * Gmail Email Sender Service
 * Integration: Gmail (google-mail connector)
 * 
 * Uses the Gmail API to send emails from the connected account.
 */

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Create a base64 encoded email message
 */
function createMessage(to: string, subject: string, body: string): string {
  const messageParts = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body
  ];
  
  const message = messageParts.join('\n');
  
  // Base64 encode with URL-safe characters
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send an email using Gmail API
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const encodedMessage = createMessage(to, subject, htmlBody);
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    return {
      success: true,
      messageId: response.data.id || undefined
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email'
    };
  }
}

/**
 * Send the Pipeline Flush Report email
 */
export async function sendPipelineFlushReport(
  to: string,
  flushReport: {
    flushId: string;
    executedAt: string;
    totalTasksProcessed: number;
    p1DirectRevenue: {
      count: number;
      tasks: Array<{ id: string; description: string; estimatedValue: number }>;
      estimatedTotalValue: number;
    };
    p2Nurture: {
      count: number;
      tasks: Array<{ id: string; description: string }>;
    };
    p3SupportAdmin: {
      killed: Array<{ id: string; description: string }>;
      automated: Array<{ id: string; description: string }>;
      totalTerminated: number;
    };
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const subject = `🚨 PIPELINE FLUSH REPORT | ${flushReport.flushId} | $${flushReport.p1DirectRevenue.estimatedTotalValue.toLocaleString()} P1 Queue`;
  
  const p1TaskRows = flushReport.p1DirectRevenue.tasks
    .sort((a, b) => b.estimatedValue - a.estimatedValue)
    .map(t => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e40af;">${t.id}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${t.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #059669;">$${t.estimatedValue.toLocaleString()}</td>
      </tr>
    `).join('');
  
  const p2TaskList = flushReport.p2Nurture.tasks
    .map(t => `<li style="margin-bottom: 8px;"><strong>${t.id}:</strong> ${t.description}</li>`)
    .join('');
  
  const p3KilledList = flushReport.p3SupportAdmin.killed
    .map(t => `<li style="margin-bottom: 8px; color: #dc2626;">✖ <strong>${t.id}:</strong> ${t.description}</li>`)
    .join('');
  
  const p3AutomatedList = flushReport.p3SupportAdmin.automated
    .map(t => `<li style="margin-bottom: 8px; color: #7c3aed;">→ <strong>${t.id}:</strong> ${t.description}</li>`)
    .join('');
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 32px; text-align: center;">
      <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800;">🚨 PIPELINE FLUSH REPORT</h1>
      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Chief of Staff (Revenue Commander) | SCOPED L6 AUTHORITY</p>
    </div>
    
    <!-- Metadata -->
    <div style="background-color: #f1f5f9; padding: 16px 32px; border-bottom: 1px solid #e2e8f0;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td><strong>Flush ID:</strong> ${flushReport.flushId}</td>
          <td style="text-align: right;"><strong>Executed:</strong> ${new Date(flushReport.executedAt).toLocaleString()}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Total Tasks Processed:</strong> ${flushReport.totalTasksProcessed}</td>
        </tr>
      </table>
    </div>
    
    <!-- Summary Cards -->
    <div style="padding: 24px 32px; display: flex; gap: 16px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 36px; font-weight: 800;">${flushReport.p1DirectRevenue.count}</div>
        <div style="font-size: 14px; opacity: 0.9;">P1 Revenue Tasks</div>
        <div style="font-size: 20px; font-weight: 700; margin-top: 8px;">$${flushReport.p1DirectRevenue.estimatedTotalValue.toLocaleString()}</div>
      </div>
      <div style="flex: 1; min-width: 200px; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 36px; font-weight: 800;">${flushReport.p2Nurture.count}</div>
        <div style="font-size: 14px; opacity: 0.9;">P2 Nurture (Paused)</div>
        <div style="font-size: 14px; margin-top: 8px;">HOLDING QUEUE</div>
      </div>
      <div style="flex: 1; min-width: 200px; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 36px; font-weight: 800;">${flushReport.p3SupportAdmin.totalTerminated}</div>
        <div style="font-size: 14px; opacity: 0.9;">P3 Tasks Killed</div>
        <div style="font-size: 14px; margin-top: 8px;">TERMINATED</div>
      </div>
    </div>
    
    <!-- P1 Queue Table -->
    <div style="padding: 0 32px 24px;">
      <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 16px;">
        💰 P1 QUEUE - DIRECT REVENUE (CRITICAL PRIORITY)
      </h2>
      <table style="width: 100%; border-collapse: collapse; background-color: #f0fdf4; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #059669; color: white;">
            <th style="padding: 12px; text-align: left;">Task ID</th>
            <th style="padding: 12px; text-align: left;">Description</th>
            <th style="padding: 12px; text-align: right;">Est. Value</th>
          </tr>
        </thead>
        <tbody>
          ${p1TaskRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #dcfce7; font-weight: 700;">
            <td colspan="2" style="padding: 12px;">TOTAL ESTIMATED VALUE</td>
            <td style="padding: 12px; text-align: right; color: #059669; font-size: 18px;">$${flushReport.p1DirectRevenue.estimatedTotalValue.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <!-- P2 Nurture Section -->
    <div style="padding: 0 32px 24px;">
      <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-bottom: 16px;">
        ⏸️ P2 QUEUE - NURTURE (PAUSED)
      </h2>
      <ul style="background-color: #fffbeb; padding: 16px 16px 16px 32px; border-radius: 8px; margin: 0;">
        ${p2TaskList}
      </ul>
    </div>
    
    <!-- P3 Killed Section -->
    <div style="padding: 0 32px 24px;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 8px; margin-bottom: 16px;">
        🗑️ P3 - KILLED (${flushReport.p3SupportAdmin.killed.length} tasks)
      </h2>
      <ul style="background-color: #fef2f2; padding: 16px 16px 16px 32px; border-radius: 8px; margin: 0;">
        ${p3KilledList}
      </ul>
    </div>
    
    <!-- P3 Automated Section -->
    <div style="padding: 0 32px 24px;">
      <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; margin-bottom: 16px;">
        🤖 P3 - AUTOMATED (${flushReport.p3SupportAdmin.automated.length} tasks)
      </h2>
      <ul style="background-color: #f5f3ff; padding: 16px 16px 16px 32px; border-radius: 8px; margin: 0;">
        ${p3AutomatedList}
      </ul>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #1e3a8a; color: white; padding: 24px 32px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-weight: 600;">RESOURCE ALLOCATION: 100% → P1 DIRECT REVENUE</p>
      <p style="margin: 0; font-size: 12px; opacity: 0.8;">
        Generated by Chief of Staff AI | ComplianceWorxs Revenue Prime System
      </p>
    </div>
    
  </div>
</body>
</html>
  `;
  
  return sendEmail(to, subject, htmlBody);
}

export const gmailSender = {
  sendEmail,
  sendPipelineFlushReport
};
