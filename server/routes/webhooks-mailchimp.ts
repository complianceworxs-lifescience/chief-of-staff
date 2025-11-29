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
  
  return crypto.timingSafeEqual(
    Buffer.from(providedSecret),
    Buffer.from(webhookSecret)
  );
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
    console.log(`   Email: ${data.email || 'N/A'}`);

    if (!data.campaign_id) {
      console.log("   ⚠️ No campaign_id - skipping ledger update");
      return res.status(200).json({ received: true, updated: false, reason: "no_campaign_id" });
    }

    const ledgerRows = await db
      .select()
      .from(performanceLedger)
      .where(eq(performanceLedger.campaignId, data.campaign_id));

    if (ledgerRows.length === 0) {
      console.log(`   ⚠️ No ledger rows found for campaign ${data.campaign_id}`);
      return res.status(200).json({ received: true, updated: false, reason: "campaign_not_in_ledger" });
    }

    let updatedCount = 0;

    switch (eventType) {
      case "open":
        for (const row of ledgerRows) {
          await db
            .update(performanceLedger)
            .set({
              opens: sql`${performanceLedger.opens} + 1`,
              updatedAt: new Date()
            })
            .where(eq(performanceLedger.sendId, row.sendId));
          updatedCount++;
        }
        console.log(`   ✅ Incremented opens for ${updatedCount} ledger row(s)`);
        break;

      case "click":
        for (const row of ledgerRows) {
          await db
            .update(performanceLedger)
            .set({
              clicks: sql`${performanceLedger.clicks} + 1`,
              updatedAt: new Date()
            })
            .where(eq(performanceLedger.sendId, row.sendId));
          updatedCount++;
        }
        console.log(`   ✅ Incremented clicks for ${updatedCount} ledger row(s)`);
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
      updated: updatedCount > 0,
      rowsAffected: updatedCount
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
