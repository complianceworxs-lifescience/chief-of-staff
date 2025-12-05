import { SendGridService } from './sendgrid';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface AbandonedCheckout {
  sessionId: string;
  customerId: string;
  customerEmail: string;
  productName: string;
  amount: number;
  currency: string;
  abandonedAt: Date;
  recoveryEmailSent: boolean;
  recoveredAt?: Date;
}

interface CheckoutSession {
  id: string;
  customer: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  status: string;
  created: number;
  expires_at: number;
  metadata?: Record<string, string>;
}

const RECOVERY_EMAIL_TEMPLATES = {
  initial: {
    subject: "You left something behind - Complete your audit readiness journey",
    getHtml: (data: { firstName: string; productName: string; amount: string; recoveryUrl: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a365d;">Hi ${data.firstName || 'there'},</h2>
        
        <p>I noticed you started checking out <strong>${data.productName}</strong> but didn't complete your purchase.</p>
        
        <p>Here's the thing: every day without a systematic compliance framework is another day of:</p>
        <ul style="color: #4a5568;">
          <li>Unpredictable audit outcomes</li>
          <li>Time spent on manual processes that could be automated</li>
          <li>Missed opportunities to demonstrate ROI to leadership</li>
        </ul>
        
        <p><strong>Your cart is still waiting:</strong></p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;"><strong>${data.productName}</strong></p>
          <p style="margin: 5px 0 0; color: #2d3748;">${data.amount}</p>
        </div>
        
        <a href="${data.recoveryUrl}" style="display: inline-block; background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
          Complete Your Purchase →
        </a>
        
        <p style="margin-top: 20px; color: #718096; font-size: 14px;">
          Questions? Just reply to this email. We're here to help you transform compliance from overhead to business asset.
        </p>
        
        <p style="color: #4a5568;">Best,<br>ComplianceWorxs Team</p>
      </div>
    `
  },
  
  followUp: {
    subject: "Last chance: Your compliance transformation is waiting",
    getHtml: (data: { firstName: string; productName: string; amount: string; recoveryUrl: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a365d;">Hi ${data.firstName || 'there'},</h2>
        
        <p>This is a gentle reminder that your cart with <strong>${data.productName}</strong> is still waiting.</p>
        
        <p><strong>What members are saying:</strong></p>
        <blockquote style="border-left: 3px solid #3182ce; padding-left: 15px; margin: 20px 0; color: #4a5568; font-style: italic;">
          "The ROI calculator alone helped me justify a 40% increase in our compliance budget. My leadership finally sees compliance as a strategic asset."
          <br><strong>— Sarah K., Quality Director, Pharma</strong>
        </blockquote>
        
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;"><strong>${data.productName}</strong></p>
          <p style="margin: 5px 0 0; color: #2d3748;">${data.amount}</p>
        </div>
        
        <a href="${data.recoveryUrl}" style="display: inline-block; background: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
          Complete Purchase Now →
        </a>
        
        <p style="margin-top: 20px; color: #718096; font-size: 14px;">
          <strong>Note:</strong> Your cart will expire soon. Don't miss your chance to transform compliance into a measurable business asset.
        </p>
        
        <p style="color: #4a5568;">Best,<br>ComplianceWorxs Team</p>
      </div>
    `
  }
};

class AbandonedCheckoutRecoveryService {
  private sendgrid: SendGridService;
  private abandonedCheckouts: Map<string, AbandonedCheckout> = new Map();
  private recoveryInterval: NodeJS.Timer | null = null;
  
  constructor() {
    this.sendgrid = new SendGridService();
  }

  async initialize() {
    console.log('🛒 Abandoned Checkout Recovery System initialized');
    this.startRecoveryLoop();
  }

  private startRecoveryLoop() {
    this.recoveryInterval = setInterval(() => {
      this.processAbandonedCheckouts();
    }, 30 * 60 * 1000);
    
    console.log('🔄 Recovery loop started - checking every 30 minutes');
  }

  async trackCheckoutSession(session: CheckoutSession) {
    if (session.status === 'complete') {
      this.abandonedCheckouts.delete(session.id);
      console.log(`✅ Checkout ${session.id} completed - removed from recovery queue`);
      return;
    }

    if (session.status === 'expired' || session.status === 'open') {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      
      if (expiresAt < now || session.status === 'expired') {
        await this.markAsAbandoned(session);
      }
    }
  }

  private async markAsAbandoned(session: CheckoutSession) {
    if (this.abandonedCheckouts.has(session.id)) {
      return;
    }

    const productName = await this.getProductName(session);
    
    const abandoned: AbandonedCheckout = {
      sessionId: session.id,
      customerId: session.customer,
      customerEmail: session.customer_email,
      productName,
      amount: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
      abandonedAt: new Date(),
      recoveryEmailSent: false
    };

    this.abandonedCheckouts.set(session.id, abandoned);
    console.log(`🛒 ABANDONED: ${session.customer_email} abandoned checkout for ${productName}`);
    
    setTimeout(() => {
      this.sendRecoveryEmail(abandoned, 'initial');
    }, 60 * 60 * 1000);
  }

  private async getProductName(session: CheckoutSession): Promise<string> {
    try {
      const result = await db.execute(sql`
        SELECT cs.line_items, p.name as product_name
        FROM stripe.checkout_sessions cs
        LEFT JOIN stripe.products p ON cs.metadata->>'product_id' = p.id
        WHERE cs.id = ${session.id}
        LIMIT 1
      `);
      
      if (result.rows[0]?.product_name) {
        return result.rows[0].product_name as string;
      }
      return 'ComplianceWorxs Membership';
    } catch {
      return 'ComplianceWorxs Membership';
    }
  }

  async handleStripeWebhook(event: any) {
    const eventType = event.type;
    const session = event.data?.object;

    console.log(`📧 Checkout Recovery Webhook: ${eventType}`);

    switch (eventType) {
      case 'checkout.session.completed':
        if (this.abandonedCheckouts.has(session.id)) {
          const abandoned = this.abandonedCheckouts.get(session.id)!;
          abandoned.recoveredAt = new Date();
          console.log(`🎉 RECOVERED: ${session.customer_email} completed checkout!`);
          this.abandonedCheckouts.delete(session.id);
          
          await this.recordRecovery(abandoned);
        }
        break;

      case 'checkout.session.expired':
        await this.trackCheckoutSession(session);
        break;

      case 'checkout.session.async_payment_failed':
        await this.markAsAbandoned(session);
        break;
    }
  }

  private async sendRecoveryEmail(abandoned: AbandonedCheckout, templateType: 'initial' | 'followUp') {
    if (!this.sendgrid.isConfigured()) {
      console.warn('⚠️ SendGrid not configured - cannot send recovery email');
      return;
    }

    if (abandoned.recoveryEmailSent && templateType === 'initial') {
      return;
    }

    const template = RECOVERY_EMAIL_TEMPLATES[templateType];
    const recoveryUrl = `${process.env.REPLIT_DEV_DOMAIN || 'https://complianceworxs.com'}/checkout/recover?session=${abandoned.sessionId}&utm_source=recovery&utm_medium=email&utm_campaign=abandoned_cart`;
    
    const firstName = abandoned.customerEmail.split('@')[0].split('.')[0];
    const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    
    const html = template.getHtml({
      firstName: formattedName,
      productName: abandoned.productName,
      amount: `$${abandoned.amount.toFixed(2)} ${abandoned.currency}`,
      recoveryUrl
    });

    const result = await this.sendgrid.sendEmail({
      to: abandoned.customerEmail,
      subject: template.subject,
      html,
      campaignId: `recovery_${templateType}_${abandoned.sessionId}`,
      sendId: `recovery_${nanoid(8)}`
    });

    if (result.success) {
      console.log(`📧 Recovery email (${templateType}) sent to ${abandoned.customerEmail}`);
      abandoned.recoveryEmailSent = true;
      
      if (templateType === 'initial') {
        setTimeout(() => {
          this.sendRecoveryEmail(abandoned, 'followUp');
        }, 24 * 60 * 60 * 1000);
      }
    }
  }

  private async processAbandonedCheckouts() {
    const now = new Date();
    let processed = 0;
    let emailsSent = 0;

    const entries = Array.from(this.abandonedCheckouts.entries());
    for (const [sessionId, abandoned] of entries) {
      const hoursSinceAbandoned = (now.getTime() - abandoned.abandonedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceAbandoned > 72) {
        this.abandonedCheckouts.delete(sessionId);
        continue;
      }

      if (!abandoned.recoveryEmailSent && hoursSinceAbandoned >= 1) {
        await this.sendRecoveryEmail(abandoned, 'initial');
        emailsSent++;
      }

      processed++;
    }

    if (processed > 0) {
      console.log(`🔄 Recovery cycle: ${processed} abandoned checkouts processed, ${emailsSent} emails sent`);
    }
  }

  private async recordRecovery(abandoned: AbandonedCheckout) {
    console.log(`📊 REVENUE RECOVERED: $${abandoned.amount} from ${abandoned.customerEmail}`);
  }

  getStats() {
    const stats = {
      totalAbandoned: this.abandonedCheckouts.size,
      pendingRecovery: 0,
      emailsSent: 0,
      recovered: 0
    };

    const values = Array.from(this.abandonedCheckouts.values());
    for (const abandoned of values) {
      if (abandoned.recoveryEmailSent) {
        stats.emailsSent++;
      } else {
        stats.pendingRecovery++;
      }
      if (abandoned.recoveredAt) {
        stats.recovered++;
      }
    }

    return stats;
  }

  async getRecentAbandoned(limit = 10): Promise<AbandonedCheckout[]> {
    const abandoned = Array.from(this.abandonedCheckouts.values());
    return abandoned
      .sort((a, b) => b.abandonedAt.getTime() - a.abandonedAt.getTime())
      .slice(0, limit);
  }
}

export const abandonedCheckoutRecovery = new AbandonedCheckoutRecoveryService();
