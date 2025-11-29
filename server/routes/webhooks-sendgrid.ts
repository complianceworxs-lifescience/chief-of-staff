import { Router, Request, Response } from "express";
import { db } from "../db";
import { performanceLedger } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

interface SendGridEvent {
  event: string;
  email: string;
  timestamp: number;
  send_id?: string;
  campaign_id?: string;
  sg_event_id?: string;
  sg_message_id?: string;
  ip?: string;
  url?: string;
  useragent?: string;
  category?: string[];
}

function verifySendGridSignature(req: Request): boolean {
  const webhookKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY;
  
  if (!webhookKey) {
    const fallbackSecret = process.env.SENDGRID_WEBHOOK_SECRET;
    if (!fallbackSecret) {
      console.warn("⚠️ No SendGrid webhook security configured - accepting all requests");
      return true;
    }
    const providedSecret = req.headers["x-sendgrid-webhook-secret"] as string;
    if (!providedSecret) {
      console.error("❌ Missing X-SendGrid-Webhook-Secret header");
      return false;
    }
    try {
      return crypto.timingSafeEqual(Buffer.from(providedSecret), Buffer.from(fallbackSecret));
    } catch {
      return false;
    }
  }

  const signature = req.headers["x-twilio-email-event-webhook-signature"] as string;
  const timestamp = req.headers["x-twilio-email-event-webhook-timestamp"] as string;

  if (!signature || !timestamp) {
    console.error("❌ Missing SendGrid signature headers");
    return false;
  }

  try {
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      console.error("❌ Raw body not available for signature verification");
      return false;
    }
    
    const payload = timestamp + rawBody;
    
    const publicKey = crypto.createPublicKey({
      key: `-----BEGIN PUBLIC KEY-----\n${webhookKey}\n-----END PUBLIC KEY-----`,
      format: 'pem'
    });
    
    const verifier = crypto.createVerify('sha256');
    verifier.update(payload);
    
    return verifier.verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error("❌ SendGrid signature verification failed:", error);
    return false;
  }
}

router.post("/", async (req: Request, res: Response) => {
  try {
    if (!verifySendGridSignature(req)) {
      console.error("❌ SENDGRID WEBHOOK: Invalid signature");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const events: SendGridEvent[] = Array.isArray(req.body) ? req.body : [req.body];
    
    console.log(`📧 SENDGRID WEBHOOK: Received ${events.length} event(s)`);

    let processedCount = 0;
    let updatedCount = 0;

    for (const event of events) {
      processedCount++;
      const sendId = event.send_id;
      const eventType = event.event;

      console.log(`   Event: ${eventType} | send_id: ${sendId || 'N/A'} | email: ${event.email?.substring(0, 3) || ''}***`);

      if (!sendId) {
        console.log(`   ⚠️ No send_id in custom_args - skipping ledger update`);
        continue;
      }

      const ledgerRow = await db
        .select()
        .from(performanceLedger)
        .where(eq(performanceLedger.sendId, sendId))
        .limit(1);

      if (ledgerRow.length === 0) {
        console.log(`   ⚠️ No ledger row found for send_id ${sendId}`);
        continue;
      }

      switch (eventType) {
        case "open":
          await db
            .update(performanceLedger)
            .set({
              opens: sql`${performanceLedger.opens} + 1`,
              updatedAt: new Date()
            })
            .where(eq(performanceLedger.sendId, sendId));
          updatedCount++;
          console.log(`   ✅ Incremented opens for ${sendId}`);
          break;

        case "click":
          await db
            .update(performanceLedger)
            .set({
              clicks: sql`${performanceLedger.clicks} + 1`,
              updatedAt: new Date()
            })
            .where(eq(performanceLedger.sendId, sendId));
          updatedCount++;
          console.log(`   ✅ Incremented clicks for ${sendId}`);
          break;

        case "delivered":
          console.log(`   ℹ️ Email delivered for ${sendId}`);
          break;

        case "bounce":
        case "dropped":
        case "deferred":
          console.log(`   ⚠️ Email ${eventType} for ${sendId}`);
          break;

        case "spamreport":
        case "unsubscribe":
          console.log(`   🚨 ${eventType} for ${sendId}`);
          break;

        default:
          console.log(`   ℹ️ Unhandled event type: ${eventType}`);
      }
    }

    return res.status(200).json({
      received: true,
      eventsProcessed: processedCount,
      ledgerUpdates: updatedCount
    });

  } catch (error) {
    console.error("❌ SENDGRID WEBHOOK ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", (req: Request, res: Response) => {
  console.log("📧 SENDGRID WEBHOOK: Verification request received");
  return res.status(200).json({ status: "ok", service: "sendgrid-webhook" });
});

export default router;
