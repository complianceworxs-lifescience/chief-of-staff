import { Router, Request, Response } from "express";
import { db } from "../db";
import { performanceLedger } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

interface MailchimpWebhookData {
  type: string;
  fired_at: string;
  data: {
    id?: string;
    email?: string;
    email_id?: string;
    campaign_id?: string;
    list_id?: string;
    ip_opt?: string;
    url?: string;
    reason?: string;
  };
}

function verifyWebhookSecret(req: Request): boolean {
  const webhookSecret = process.env.MAILCHIMP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("⚠️ MAILCHIMP_WEBHOOK_SECRET not configured - webhook verification disabled");
    return true;
  }
  
  const providedSecret = req.headers["x-mailchimp-webhook-secret"] as string;
  if (!providedSecret) {
    console.error("❌ Missing X-Mailchimp-Webhook-Secret header");
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedSecret),
      Buffer.from(webhookSecret)
    );
  } catch {
    return false;
  }
}

function hashEmail(email: string): string {
  return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
}

router.post("/", async (req: Request, res: Response) => {
  try {
    if (!verifyWebhookSecret(req)) {
      console.error("❌ MAILCHIMP WEBHOOK: Invalid or missing secret");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const webhookData: MailchimpWebhookData = req.body;
    const eventType = webhookData.type;
    const data = webhookData.data;

    console.log(`📬 MAILCHIMP WEBHOOK: Received ${eventType} event`);
    console.log(`   Campaign ID: ${data.campaign_id || 'N/A'}`);
    console.log(`   Email: ${data.email ? data.email.substring(0, 3) + '***' : 'N/A'}`);

    if (!data.campaign_id) {
      console.log("   ⚠️ No campaign_id - skipping ledger update");
      return res.status(200).json({ received: true, updated: false, reason: "no_campaign_id" });
    }

    if (!data.email) {
      console.log("   ⚠️ No email - skipping ledger update");
      return res.status(200).json({ received: true, updated: false, reason: "no_email" });
    }

    const emailHash = hashEmail(data.email);

    const ledgerRow = await db
      .select()
      .from(performanceLedger)
      .where(
        and(
          eq(performanceLedger.campaignId, data.campaign_id),
          eq(performanceLedger.recipientEmailHash, emailHash)
        )
      )
      .limit(1);

    if (ledgerRow.length === 0) {
      console.log(`   ⚠️ No ledger row found for campaign ${data.campaign_id} + email hash ${emailHash.substring(0, 8)}...`);
      return res.status(200).json({ received: true, updated: false, reason: "send_not_in_ledger" });
    }

    const targetSendId = ledgerRow[0].sendId;
    let updated = false;

    switch (eventType) {
      case "open":
        await db
          .update(performanceLedger)
          .set({
            opens: sql`${performanceLedger.opens} + 1`,
            updatedAt: new Date()
          })
          .where(eq(performanceLedger.sendId, targetSendId));
        updated = true;
        console.log(`   ✅ Incremented opens for send ${targetSendId}`);
        break;

      case "click":
        await db
          .update(performanceLedger)
          .set({
            clicks: sql`${performanceLedger.clicks} + 1`,
            updatedAt: new Date()
          })
          .where(eq(performanceLedger.sendId, targetSendId));
        updated = true;
        console.log(`   ✅ Incremented clicks for send ${targetSendId}`);
        break;

      case "subscribe":
      case "unsubscribe":
      case "profile":
      case "cleaned":
      case "campaign":
        console.log(`   ℹ️ Event type ${eventType} logged but not tracked in ledger`);
        break;

      default:
        console.log(`   ℹ️ Unknown event type: ${eventType}`);
    }

    return res.status(200).json({
      received: true,
      eventType,
      campaignId: data.campaign_id,
      updated,
      sendId: updated ? targetSendId : null
    });

  } catch (error) {
    console.error("❌ MAILCHIMP WEBHOOK ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", (req: Request, res: Response) => {
  console.log("📬 MAILCHIMP WEBHOOK: Verification request received");
  return res.status(200).send("OK");
});

router.head("/", (req: Request, res: Response) => {
  console.log("📬 MAILCHIMP WEBHOOK: HEAD verification request");
  return res.status(200).send();
});

export default router;
