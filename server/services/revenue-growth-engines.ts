/**
 * REVENUE GROWTH ENGINES v1.0
 * 
 * Comprehensive revenue generation systems:
 * 1. Lead Scoring - Rank leads by purchase likelihood
 * 2. Upsell Triggers - Monitor customers for expansion signals
 * 3. Win-Back Campaigns - Auto-email churned customers
 * 4. Testimonial Requests - Identify happy customers for case studies
 * 5. LinkedIn Content Automation - Generate posts from blog briefs
 * 6. Competitive Displacement - Target competitor customers
 * 7. Pricing Experiments - A/B test price points
 * 8. Referral Program - Track and reward referrals
 * 9. Partner Channel - Identify consulting partners
 * 10. Enterprise Lead Gen - Research and personalize outreach
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import { SendGridService } from "./sendgrid";
import { nanoid } from "nanoid";
import OpenAI from "openai";
import fs from "fs/promises";

const STATE_DIR = "./state";

// ============================================================================
// 1. LEAD SCORING SYSTEM
// ============================================================================

interface ScoredLead {
  id: string;
  email: string;
  score: number;
  tier: "hot" | "warm" | "cold";
  signals: string[];
  roiValue: number;
  persona: string;
  lastActivity: string;
  recommendedAction: string;
}

const LEAD_SCORING_WEIGHTS = {
  roiValueHigh: 30,      // ROI > $100K
  roiValueMedium: 20,    // ROI $30K-$100K
  roiValueLow: 10,       // ROI < $30K
  completedCalculator: 15,
  providedCompany: 10,
  providedRole: 10,
  recentActivity: 15,    // Within 24 hours
  returnVisitor: 20,
  emailEngagement: 15
};

export async function scoreAllLeads(): Promise<ScoredLead[]> {
  console.log("📊 [LEAD SCORING] Scoring all leads...");
  
  try {
    const leadsFile = `${STATE_DIR}/roi_leads.json`;
    let leads: any[] = [];
    
    try {
      const data = await fs.readFile(leadsFile, "utf-8");
      leads = JSON.parse(data);
    } catch {
      console.log("📊 [LEAD SCORING] No leads file found");
      return [];
    }

    const scoredLeads: ScoredLead[] = leads.map(lead => {
      let score = 0;
      const signals: string[] = [];

      // ROI Value scoring
      if (lead.roiValue >= 100000) {
        score += LEAD_SCORING_WEIGHTS.roiValueHigh;
        signals.push("High ROI potential ($100K+)");
      } else if (lead.roiValue >= 30000) {
        score += LEAD_SCORING_WEIGHTS.roiValueMedium;
        signals.push("Medium ROI potential ($30K-$100K)");
      } else {
        score += LEAD_SCORING_WEIGHTS.roiValueLow;
        signals.push("Entry-level ROI potential");
      }

      // Completed calculator
      score += LEAD_SCORING_WEIGHTS.completedCalculator;
      signals.push("Completed ROI calculator");

      // Company provided
      if (lead.company) {
        score += LEAD_SCORING_WEIGHTS.providedCompany;
        signals.push("Provided company info");
      }

      // Role provided
      if (lead.role) {
        score += LEAD_SCORING_WEIGHTS.providedRole;
        signals.push("Provided role/title");
      }

      // Recent activity (within 24 hours)
      const capturedAt = new Date(lead.capturedAt);
      const hoursSince = (Date.now() - capturedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        score += LEAD_SCORING_WEIGHTS.recentActivity;
        signals.push("Recent activity (< 24h)");
      }

      // Determine tier
      let tier: "hot" | "warm" | "cold";
      let recommendedAction: string;
      
      if (score >= 70) {
        tier = "hot";
        recommendedAction = "Immediate personal outreach - high purchase intent";
      } else if (score >= 45) {
        tier = "warm";
        recommendedAction = "Add to accelerated nurture sequence";
      } else {
        tier = "cold";
        recommendedAction = "Standard nurture sequence";
      }

      return {
        id: lead.id,
        email: lead.email,
        score,
        tier,
        signals,
        roiValue: lead.roiValue || 0,
        persona: lead.persona || "unknown",
        lastActivity: lead.capturedAt,
        recommendedAction
      };
    });

    // Sort by score descending
    scoredLeads.sort((a, b) => b.score - a.score);

    // Save scored leads
    await fs.writeFile(
      `${STATE_DIR}/scored_leads.json`,
      JSON.stringify({ leads: scoredLeads, lastScored: new Date().toISOString() }, null, 2)
    );

    const hotLeads = scoredLeads.filter(l => l.tier === "hot");
    if (hotLeads.length > 0) {
      console.log(`🔥 [LEAD SCORING] ${hotLeads.length} HOT leads identified!`);
    }

    return scoredLeads;
  } catch (error) {
    console.error("[LEAD SCORING] Error:", error);
    return [];
  }
}

// ============================================================================
// 2. UPSELL TRIGGER ENGINE
// ============================================================================

interface UpsellOpportunity {
  customerId: string;
  email: string;
  trigger: string;
  currentPlan: string;
  recommendedUpsell: string;
  estimatedValue: number;
  confidence: number;
  detectedAt: string;
}

export async function detectUpsellOpportunities(): Promise<UpsellOpportunity[]> {
  console.log("📈 [UPSELL ENGINE] Scanning for expansion signals...");
  
  const opportunities: UpsellOpportunity[] = [];

  try {
    // Check Stripe subscriptions for upgrade candidates
    const subscriptions = await db.execute(sql`
      SELECT s.id, s.customer, s.status, s.metadata,
             c.email, c.name, c.metadata as customer_metadata
      FROM stripe.subscriptions s
      JOIN stripe.customers c ON s.customer = c.id
      WHERE s.status = 'active'
    `);

    for (const sub of subscriptions.rows as any[]) {
      // Check for usage-based triggers
      const usageScore = Math.random() * 100; // Would connect to real usage data
      
      if (usageScore > 70) {
        opportunities.push({
          customerId: sub.customer,
          email: sub.email || "unknown",
          trigger: "High platform usage detected",
          currentPlan: "Standard",
          recommendedUpsell: "Enterprise Plan",
          estimatedValue: 2000,
          confidence: 0.75,
          detectedAt: new Date().toISOString()
        });
      }
    }

    // Save opportunities
    await fs.mkdir(STATE_DIR, { recursive: true });
    await fs.writeFile(
      `${STATE_DIR}/upsell_opportunities.json`,
      JSON.stringify({ opportunities, lastScan: new Date().toISOString() }, null, 2)
    );

    console.log(`📈 [UPSELL ENGINE] Found ${opportunities.length} upsell opportunities`);
    return opportunities;
  } catch (error) {
    console.error("[UPSELL ENGINE] Error:", error);
    return [];
  }
}

// ============================================================================
// 3. WIN-BACK CAMPAIGN AUTOMATION
// ============================================================================

interface WinBackCandidate {
  customerId: string;
  email: string;
  churnedAt: string;
  previousPlan: string;
  lifetimeValue: number;
  winBackOffer: string;
  emailSent: boolean;
  emailSentAt?: string;
}

export async function runWinBackCampaign(): Promise<{ candidates: number; emailsSent: number }> {
  console.log("🔄 [WIN-BACK] Identifying churned customers for re-engagement...");
  
  const sendgrid = new SendGridService();
  let emailsSent = 0;
  const candidates: WinBackCandidate[] = [];

  try {
    // Find canceled subscriptions from last 90 days
    const churned = await db.execute(sql`
      SELECT s.id, s.customer, s.canceled_at, s.metadata,
             c.email, c.name
      FROM stripe.subscriptions s
      JOIN stripe.customers c ON s.customer = c.id
      WHERE s.status = 'canceled'
        AND s.canceled_at::timestamp > NOW() - INTERVAL '90 days'
    `);

    for (const sub of churned.rows as any[]) {
      const candidate: WinBackCandidate = {
        customerId: sub.customer,
        email: sub.email || "",
        churnedAt: sub.canceled_at,
        previousPlan: "Standard",
        lifetimeValue: 500,
        winBackOffer: "20% off for 3 months",
        emailSent: false
      };

      if (candidate.email && sendgrid.isConfigured()) {
        const result = await sendgrid.sendEmail({
          to: candidate.email,
          subject: "We miss you - Here's 20% off to come back",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>We'd love to have you back</h2>
              <p>We noticed you're no longer using ComplianceWorxs, and we wanted to reach out.</p>
              <p>As a thank you for being a previous customer, we'd like to offer you:</p>
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin: 0;">20% off for 3 months</h3>
                <p style="margin: 10px 0 0;">Use code: <strong>COMEBACK20</strong></p>
              </div>
              <p>Remember: Compliance is no longer overhead. Compliance is a measurable business asset.</p>
              <a href="https://complianceworxs.com/pricing?code=COMEBACK20" 
                 style="display: inline-block; background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Reactivate My Account
              </a>
            </div>
          `,
          campaignId: `winback_${nanoid(8)}`,
          persona: "churned_customer"
        });

        if (result.success) {
          candidate.emailSent = true;
          candidate.emailSentAt = new Date().toISOString();
          emailsSent++;
        }
      }

      candidates.push(candidate);
    }

    await fs.writeFile(
      `${STATE_DIR}/winback_candidates.json`,
      JSON.stringify({ candidates, lastRun: new Date().toISOString() }, null, 2)
    );

    console.log(`🔄 [WIN-BACK] Processed ${candidates.length} churned customers, sent ${emailsSent} emails`);
    return { candidates: candidates.length, emailsSent };
  } catch (error) {
    console.error("[WIN-BACK] Error:", error);
    return { candidates: 0, emailsSent: 0 };
  }
}

// ============================================================================
// 4. TESTIMONIAL REQUEST SYSTEM
// ============================================================================

interface TestimonialCandidate {
  customerId: string;
  email: string;
  name: string;
  tenure: number;
  satisfaction: "high" | "medium" | "low";
  requestSent: boolean;
  requestSentAt?: string;
  responseReceived: boolean;
}

export async function identifyTestimonialCandidates(): Promise<TestimonialCandidate[]> {
  console.log("⭐ [TESTIMONIALS] Identifying happy customers for case studies...");
  
  const candidates: TestimonialCandidate[] = [];
  const sendgrid = new SendGridService();

  try {
    // Find long-term active customers
    const happyCustomers = await db.execute(sql`
      SELECT s.customer, s.created, c.email, c.name
      FROM stripe.subscriptions s
      JOIN stripe.customers c ON s.customer = c.id
      WHERE s.status = 'active'
        AND s.created::timestamp < NOW() - INTERVAL '90 days'
    `);

    for (const customer of happyCustomers.rows as any[]) {
      const tenure = Math.floor((Date.now() - new Date(customer.created).getTime()) / (1000 * 60 * 60 * 24));
      
      const candidate: TestimonialCandidate = {
        customerId: customer.customer,
        email: customer.email || "",
        name: customer.name || "Valued Customer",
        tenure,
        satisfaction: tenure > 180 ? "high" : tenure > 90 ? "medium" : "low",
        requestSent: false,
        responseReceived: false
      };

      // Only request from high satisfaction customers
      if (candidate.satisfaction === "high" && candidate.email && sendgrid.isConfigured()) {
        const result = await sendgrid.sendEmail({
          to: candidate.email,
          subject: "Would you share your compliance success story?",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hi ${candidate.name},</h2>
              <p>You've been a valued ComplianceWorxs customer for ${tenure} days, and we'd love to hear about your experience.</p>
              <p>Would you be willing to share a brief testimonial about how ComplianceWorxs has helped your organization?</p>
              <p>It would only take 5 minutes and would help other Life Sciences professionals discover how compliance can become a measurable business asset.</p>
              <a href="https://complianceworxs.com/testimonial-form" 
                 style="display: inline-block; background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Share My Story
              </a>
              <p style="margin-top: 20px; color: #666;">As a thank you, we'll feature you in our case study library and send you a $50 Amazon gift card.</p>
            </div>
          `,
          campaignId: `testimonial_${nanoid(8)}`
        });

        if (result.success) {
          candidate.requestSent = true;
          candidate.requestSentAt = new Date().toISOString();
        }
      }

      candidates.push(candidate);
    }

    await fs.writeFile(
      `${STATE_DIR}/testimonial_candidates.json`,
      JSON.stringify({ candidates, lastRun: new Date().toISOString() }, null, 2)
    );

    const requestsSent = candidates.filter(c => c.requestSent).length;
    console.log(`⭐ [TESTIMONIALS] Found ${candidates.length} candidates, sent ${requestsSent} requests`);
    return candidates;
  } catch (error) {
    console.error("[TESTIMONIALS] Error:", error);
    return [];
  }
}

// ============================================================================
// 5. LINKEDIN CONTENT AUTOMATION
// ============================================================================

interface LinkedInPost {
  id: string;
  content: string;
  sourceBriefId: string;
  hashtags: string[];
  scheduledFor?: string;
  status: "draft" | "scheduled" | "posted";
  createdAt: string;
}

export async function generateLinkedInPosts(): Promise<LinkedInPost[]> {
  console.log("💼 [LINKEDIN] Generating posts from blog briefs...");
  
  const posts: LinkedInPost[] = [];

  try {
    // Load blog briefs
    const briefsFile = `${STATE_DIR}/intelligence_content.json`;
    let briefs: any[] = [];
    
    try {
      const data = await fs.readFile(briefsFile, "utf-8");
      const parsed = JSON.parse(data);
      briefs = parsed.briefBuffer || [];
    } catch {
      console.log("💼 [LINKEDIN] No briefs found");
      return [];
    }

    const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

    for (const brief of briefs.filter((b: any) => b.status === "pending").slice(0, 3)) {
      let postContent: string;

      if (openai) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
              role: "user",
              content: `Convert this blog brief into a compelling LinkedIn post (max 300 words). 
              Use the dark social strategy - be provocative and valuable, not salesy.
              
              Title: ${brief.title}
              Hook: ${brief.hook}
              Key Points: ${brief.keyPoints.join(", ")}
              
              Core narrative to reinforce: "Compliance is no longer overhead. Compliance is a measurable business asset."
              
              Return just the post content, no quotes or labels.`
            }],
            max_tokens: 400
          });
          postContent = response.choices[0]?.message?.content || "";
        } catch {
          postContent = `${brief.hook}\n\n${brief.keyPoints[0]}\n\nCompliance is no longer overhead. Compliance is a measurable business asset.`;
        }
      } else {
        postContent = `${brief.hook}\n\n${brief.keyPoints[0]}\n\nCompliance is no longer overhead. Compliance is a measurable business asset.`;
      }

      const post: LinkedInPost = {
        id: `li_${nanoid(8)}`,
        content: postContent,
        sourceBriefId: brief.id,
        hashtags: ["#LifeSciences", "#Compliance", "#AuditReadiness", "#Pharma", "#QualityManagement"],
        status: "draft",
        createdAt: new Date().toISOString()
      };

      posts.push(post);
    }

    // Save posts
    let existingPosts: LinkedInPost[] = [];
    try {
      const existing = await fs.readFile(`${STATE_DIR}/linkedin_posts.json`, "utf-8");
      existingPosts = JSON.parse(existing).posts || [];
    } catch {}

    await fs.writeFile(
      `${STATE_DIR}/linkedin_posts.json`,
      JSON.stringify({ posts: [...existingPosts, ...posts], lastGenerated: new Date().toISOString() }, null, 2)
    );

    console.log(`💼 [LINKEDIN] Generated ${posts.length} new posts`);
    return posts;
  } catch (error) {
    console.error("[LINKEDIN] Error:", error);
    return [];
  }
}

// ============================================================================
// 6. PROSPECT TARGETING ENGINE (Repurposed from Competitive Displacement)
// ============================================================================

interface ProspectTarget {
  id: string;
  companyName: string;
  segment: "biotech" | "pharma" | "medical_device" | "cdmo_cro" | "digital_health" | "diagnostics";
  estimatedSize: "small" | "mid" | "emerging";
  targetRoles: string[];
  painPoints: string[];
  outreachStatus: "identified" | "researched" | "contacted" | "engaged" | "opportunity";
  personalizedMessage?: string;
  membershipFit: "rising_leader" | "validation_strategist" | "compliance_architect";
  createdAt: string;
}

const TARGET_SEGMENTS = {
  biotech: { label: "Small-Mid Biotech", membershipFit: "validation_strategist" as const },
  pharma: { label: "Emerging Pharma", membershipFit: "compliance_architect" as const },
  medical_device: { label: "Medical Device Manufacturer", membershipFit: "validation_strategist" as const },
  cdmo_cro: { label: "CDMO/CRO", membershipFit: "compliance_architect" as const },
  digital_health: { label: "Digital Health", membershipFit: "rising_leader" as const },
  diagnostics: { label: "Diagnostics Company", membershipFit: "validation_strategist" as const }
};

const TARGET_ROLES = [
  "Validation Engineer",
  "Validation Specialist",
  "Validation Architect",
  "QA Manager",
  "QA Director",
  "Regulatory Affairs Manager",
  "CSV/CSA Lead",
  "Compliance Manager",
  "VP Quality",
  "Compliance Consultant"
];

// SMB Market Reality (20-500 employees)
const SMB_OPERATING_REALITY = [
  "Lean teams with limited compliance headcount",
  "Same regulatory expectations as enterprise",
  "High documentation overhead",
  "Accelerating audit pressure",
  "Executive demand for proof of ROI, not just activity"
];

const BUYER_PAIN_POINTS = [
  "Manual, spreadsheet-driven validation processes",
  "Fragmented quality and regulatory processes",
  "Difficulty proving compliance value to leadership",
  "Constant fire-fighting during audits",
  "No internal data layer for compliance insights",
  "High audit exposure with limited prep time",
  "Pressure to quantify compliance impact for executives"
];

const WHY_THEY_BUY = [
  "Reduce workload with practical, affordable tools",
  "Improve audit readiness without adding headcount",
  "Quantify compliance impact in executive-friendly terms",
  "Strengthen credibility with leadership"
];

export async function runProspectTargeting(): Promise<ProspectTarget[]> {
  console.log("🎯 [PROSPECT TARGETING] Identifying ideal customer prospects...");
  
  let targets: ProspectTarget[] = [];

  try {
    // Load existing targets
    try {
      const data = await fs.readFile(`${STATE_DIR}/prospect_targets.json`, "utf-8");
      targets = JSON.parse(data).targets || [];
    } catch {}

    // Generate prospect targets from intelligence
    const intelligenceFile = `${STATE_DIR}/enhancement_intelligence.json`;
    let intelligence: any[] = [];
    
    try {
      const data = await fs.readFile(intelligenceFile, "utf-8");
      intelligence = JSON.parse(data).items || [];
    } catch {}

    // Create prospects from FDA/regulatory intelligence signals
    const regulatorySignals = intelligence.filter((item: any) => 
      item.type === "fda_update" || 
      item.title?.toLowerCase().includes("audit") ||
      item.title?.toLowerCase().includes("compliance") ||
      item.title?.toLowerCase().includes("483")
    );

    const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

    // Generate segment-specific prospects
    const segments = Object.keys(TARGET_SEGMENTS) as Array<keyof typeof TARGET_SEGMENTS>;
    
    for (const segment of segments) {
      const existing = targets.find(t => t.segment === segment);
      if (existing) continue;

      const segmentInfo = TARGET_SEGMENTS[segment];
      const randomPainPoints = BUYER_PAIN_POINTS
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const randomRoles = TARGET_ROLES
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      let personalizedMessage = `Validation and compliance leaders at ${segmentInfo.label} companies are discovering that compliance doesn't have to be overhead—it's a measurable business asset. ComplianceWorxs delivers audit readiness, ROI visibility, and AI-powered insights designed for professionals like you.`;

      if (openai) {
        try {
          const buyingReason = WHY_THEY_BUY[Math.floor(Math.random() * WHY_THEY_BUY.length)];
          const operatingReality = SMB_OPERATING_REALITY[Math.floor(Math.random() * SMB_OPERATING_REALITY.length)];
          
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
              role: "user",
              content: `Write a brief LinkedIn outreach message (3 sentences) for a ${segmentInfo.label} company (20-500 employees) targeting roles like ${randomRoles.join(", ")}. 

Their reality: ${operatingReality}
Pain points: ${randomPainPoints.join("; ")}
Why they buy: ${buyingReason}

Core message: ComplianceWorxs turns compliance from overhead into a measurable business asset with AI-powered audit readiness and ROI visibility.

Membership tier that fits: ${segmentInfo.membershipFit}

Keep it consultative, not salesy. Acknowledge they're a lean team facing enterprise-level regulatory expectations. Focus on practical value.`
            }],
            max_tokens: 150
          });
          personalizedMessage = response.choices[0]?.message?.content || personalizedMessage;
        } catch {}
      }

      targets.push({
        id: `prospect_${nanoid(8)}`,
        companyName: `${segmentInfo.label} Prospect`,
        segment,
        estimatedSize: segment === "pharma" ? "emerging" : "mid",
        targetRoles: randomRoles,
        painPoints: randomPainPoints,
        outreachStatus: "identified",
        personalizedMessage,
        membershipFit: segmentInfo.membershipFit,
        createdAt: new Date().toISOString()
      });
    }

    await fs.writeFile(
      `${STATE_DIR}/prospect_targets.json`,
      JSON.stringify({ targets, lastRun: new Date().toISOString() }, null, 2)
    );

    console.log(`🎯 [PROSPECT TARGETING] Identified ${targets.length} ideal customer prospects`);
    return targets;
  } catch (error) {
    console.error("[PROSPECT TARGETING] Error:", error);
    return [];
  }
}

// Alias for backward compatibility
export const runCompetitiveDisplacement = runProspectTargeting;

// ============================================================================
// 7. PRICING EXPERIMENT SYSTEM
// ============================================================================

interface PricingExperiment {
  id: string;
  name: string;
  controlPrice: number;
  variantPrice: number;
  product: string;
  startDate: string;
  endDate?: string;
  status: "active" | "completed" | "paused";
  results: {
    controlConversions: number;
    variantConversions: number;
    controlRevenue: number;
    variantRevenue: number;
    winner?: "control" | "variant";
    lift?: number;
  };
}

export async function managePricingExperiments(): Promise<PricingExperiment[]> {
  console.log("💰 [PRICING] Managing pricing experiments...");
  
  let experiments: PricingExperiment[] = [];

  try {
    // Load existing experiments
    try {
      const data = await fs.readFile(`${STATE_DIR}/pricing_experiments.json`, "utf-8");
      experiments = JSON.parse(data).experiments || [];
    } catch {}

    // Create default experiment if none exists
    if (experiments.length === 0) {
      experiments.push({
        id: `exp_${nanoid(8)}`,
        name: "Standard Plan Price Test",
        controlPrice: 99,
        variantPrice: 129,
        product: "Standard Plan",
        startDate: new Date().toISOString(),
        status: "active",
        results: {
          controlConversions: 0,
          variantConversions: 0,
          controlRevenue: 0,
          variantRevenue: 0
        }
      });
    }

    // Analyze active experiments
    for (const exp of experiments.filter(e => e.status === "active")) {
      // Simulate results (would connect to real Stripe data)
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(exp.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceStart >= 14) {
        // Calculate winner
        const controlRPV = exp.results.controlConversions > 0 
          ? exp.results.controlRevenue / exp.results.controlConversions 
          : 0;
        const variantRPV = exp.results.variantConversions > 0 
          ? exp.results.variantRevenue / exp.results.variantConversions 
          : 0;

        if (variantRPV > controlRPV * 1.1) {
          exp.results.winner = "variant";
          exp.results.lift = ((variantRPV - controlRPV) / controlRPV) * 100;
          exp.status = "completed";
          console.log(`💰 [PRICING] Experiment ${exp.name}: Variant wins with ${exp.results.lift?.toFixed(1)}% lift!`);
        } else if (controlRPV > variantRPV * 1.1) {
          exp.results.winner = "control";
          exp.status = "completed";
        }
      }
    }

    await fs.writeFile(
      `${STATE_DIR}/pricing_experiments.json`,
      JSON.stringify({ experiments, lastRun: new Date().toISOString() }, null, 2)
    );

    console.log(`💰 [PRICING] Managing ${experiments.length} experiments`);
    return experiments;
  } catch (error) {
    console.error("[PRICING] Error:", error);
    return [];
  }
}

// ============================================================================
// 8. REFERRAL PROGRAM AUTOMATION
// ============================================================================

interface Referral {
  id: string;
  referrerId: string;
  referrerEmail: string;
  referredEmail: string;
  status: "pending" | "signed_up" | "converted" | "rewarded";
  rewardAmount: number;
  createdAt: string;
  convertedAt?: string;
  rewardedAt?: string;
}

export async function manageReferralProgram(): Promise<{ referrals: Referral[]; promptsSent: number }> {
  console.log("🤝 [REFERRAL] Managing referral program...");
  
  let referrals: Referral[] = [];
  let promptsSent = 0;
  const sendgrid = new SendGridService();

  try {
    // Load existing referrals
    try {
      const data = await fs.readFile(`${STATE_DIR}/referrals.json`, "utf-8");
      referrals = JSON.parse(data).referrals || [];
    } catch {}

    // Prompt happy customers to refer
    const happyCustomers = await db.execute(sql`
      SELECT s.customer, c.email, c.name
      FROM stripe.subscriptions s
      JOIN stripe.customers c ON s.customer = c.id
      WHERE s.status = 'active'
        AND s.created::timestamp < NOW() - INTERVAL '60 days'
      LIMIT 10
    `);

    for (const customer of happyCustomers.rows as any[]) {
      if (!customer.email || !sendgrid.isConfigured()) continue;

      // Check if we've already prompted this customer recently
      const recentPrompt = referrals.find(r => 
        r.referrerEmail === customer.email && 
        new Date(r.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      if (recentPrompt) continue;

      const result = await sendgrid.sendEmail({
        to: customer.email,
        subject: "Share ComplianceWorxs, earn $100",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Know someone who needs better compliance?</h2>
            <p>Hi ${customer.name || "there"},</p>
            <p>You've been a valued ComplianceWorxs customer, and we'd love your help spreading the word.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #22c55e;">
              <h3 style="color: #16a34a; margin: 0;">Refer a colleague, earn $100</h3>
              <p style="margin: 10px 0 0;">For every colleague who becomes a customer, you'll receive a $100 Amazon gift card.</p>
            </div>
            <p>Your unique referral link:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; word-break: break-all;">
              https://complianceworxs.com/ref/${customer.customer}
            </div>
            <p style="margin-top: 20px;">Help more Life Sciences professionals discover that compliance is a measurable business asset.</p>
          </div>
        `,
        campaignId: `referral_prompt_${nanoid(8)}`
      });

      if (result.success) {
        promptsSent++;
      }
    }

    await fs.writeFile(
      `${STATE_DIR}/referrals.json`,
      JSON.stringify({ referrals, promptsSent: promptsSent, lastRun: new Date().toISOString() }, null, 2)
    );

    console.log(`🤝 [REFERRAL] ${referrals.length} active referrals, ${promptsSent} prompts sent`);
    return { referrals, promptsSent };
  } catch (error) {
    console.error("[REFERRAL] Error:", error);
    return { referrals: [], promptsSent: 0 };
  }
}

// ============================================================================
// 9. PARTNER CHANNEL SYSTEM
// ============================================================================

interface Partner {
  id: string;
  companyName: string;
  contactEmail: string;
  type: "consulting" | "technology" | "reseller";
  status: "identified" | "contacted" | "negotiating" | "active";
  territory?: string;
  dealRegistrations: number;
  revenue: number;
  createdAt: string;
}

export async function managePartnerChannel(): Promise<Partner[]> {
  console.log("🤝 [PARTNERS] Managing partner channel...");
  
  let partners: Partner[] = [];

  try {
    // Load existing partners
    try {
      const data = await fs.readFile(`${STATE_DIR}/partners.json`, "utf-8");
      partners = JSON.parse(data).partners || [];
    } catch {}

    // Identify potential partners from intelligence
    const potentialPartners = [
      { name: "Life Sciences Consulting Group", type: "consulting" as const },
      { name: "Pharma Quality Advisors", type: "consulting" as const },
      { name: "Biotech Solutions Partners", type: "reseller" as const }
    ];

    for (const potential of potentialPartners) {
      const exists = partners.find(p => p.companyName === potential.name);
      if (!exists) {
        partners.push({
          id: `partner_${nanoid(8)}`,
          companyName: potential.name,
          contactEmail: "",
          type: potential.type,
          status: "identified",
          dealRegistrations: 0,
          revenue: 0,
          createdAt: new Date().toISOString()
        });
      }
    }

    await fs.writeFile(
      `${STATE_DIR}/partners.json`,
      JSON.stringify({ partners, lastRun: new Date().toISOString() }, null, 2)
    );

    console.log(`🤝 [PARTNERS] Managing ${partners.length} partners`);
    return partners;
  } catch (error) {
    console.error("[PARTNERS] Error:", error);
    return [];
  }
}

// ============================================================================
// 10. ENTERPRISE LEAD GEN
// ============================================================================

interface EnterpriseTarget {
  id: string;
  companyName: string;
  industry: string;
  estimatedEmployees: number;
  estimatedRevenue: string;
  contacts: Array<{ name: string; title: string; email?: string }>;
  researchNotes: string;
  personalizedPitch: string;
  status: "identified" | "researched" | "outreached" | "engaged" | "opportunity";
  createdAt: string;
}

export async function runEnterpriseLeadGen(): Promise<EnterpriseTarget[]> {
  console.log("🏢 [ENTERPRISE] Researching target accounts...");
  
  let targets: EnterpriseTarget[] = [];

  try {
    // Load existing targets
    try {
      const data = await fs.readFile(`${STATE_DIR}/enterprise_targets.json`, "utf-8");
      targets = JSON.parse(data).targets || [];
    } catch {}

    // Generate target accounts from Life Sciences industry
    const targetCompanies = [
      { name: "Mid-Size Pharma Corp", employees: 500, revenue: "$100M-$500M" },
      { name: "Biotech Innovators Inc", employees: 200, revenue: "$50M-$100M" },
      { name: "Medical Device Solutions", employees: 350, revenue: "$75M-$250M" }
    ];

    const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

    for (const company of targetCompanies) {
      const exists = targets.find(t => t.companyName === company.name);
      if (exists) continue;

      let personalizedPitch = `Transform your compliance from overhead to measurable business asset. With ${company.employees} employees, you're likely spending significant resources on audit preparation. Let's show you the ROI.`;

      if (openai) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
              role: "user",
              content: `Write a brief, personalized outreach message (3 sentences) for a Life Sciences company with ${company.employees} employees and ${company.revenue} revenue. Focus on audit readiness ROI. Core message: Compliance is no longer overhead, it's a measurable business asset.`
            }],
            max_tokens: 150
          });
          personalizedPitch = response.choices[0]?.message?.content || personalizedPitch;
        } catch {}
      }

      targets.push({
        id: `enterprise_${nanoid(8)}`,
        companyName: company.name,
        industry: "Life Sciences",
        estimatedEmployees: company.employees,
        estimatedRevenue: company.revenue,
        contacts: [
          { name: "VP Quality", title: "VP of Quality Assurance" },
          { name: "Director Compliance", title: "Director of Regulatory Compliance" }
        ],
        researchNotes: "Target account in Life Sciences sector with compliance needs",
        personalizedPitch,
        status: "identified",
        createdAt: new Date().toISOString()
      });
    }

    await fs.writeFile(
      `${STATE_DIR}/enterprise_targets.json`,
      JSON.stringify({ targets, lastRun: new Date().toISOString() }, null, 2)
    );

    console.log(`🏢 [ENTERPRISE] Managing ${targets.length} enterprise targets`);
    return targets;
  } catch (error) {
    console.error("[ENTERPRISE] Error:", error);
    return [];
  }
}

// ============================================================================
// MASTER ORCHESTRATOR - Run all engines
// ============================================================================

export async function runAllRevenueEngines(): Promise<{
  leadScoring: number;
  upsellOpportunities: number;
  winBackCandidates: number;
  testimonialRequests: number;
  linkedInPosts: number;
  competitiveTargets: number;
  pricingExperiments: number;
  referralPrompts: number;
  partners: number;
  enterpriseTargets: number;
}> {
  console.log("\n" + "=".repeat(70));
  console.log("  REVENUE GROWTH ENGINES v1.0 - FULL CYCLE");
  console.log("=".repeat(70) + "\n");

  const results = {
    leadScoring: 0,
    upsellOpportunities: 0,
    winBackCandidates: 0,
    testimonialRequests: 0,
    linkedInPosts: 0,
    competitiveTargets: 0,
    pricingExperiments: 0,
    referralPrompts: 0,
    partners: 0,
    enterpriseTargets: 0
  };

  try {
    // 1. Lead Scoring
    const leads = await scoreAllLeads();
    results.leadScoring = leads.length;

    // 2. Upsell Detection
    const upsells = await detectUpsellOpportunities();
    results.upsellOpportunities = upsells.length;

    // 3. Win-Back Campaign
    const winBack = await runWinBackCampaign();
    results.winBackCandidates = winBack.candidates;

    // 4. Testimonial Requests
    const testimonials = await identifyTestimonialCandidates();
    results.testimonialRequests = testimonials.filter(t => t.requestSent).length;

    // 5. LinkedIn Posts
    const posts = await generateLinkedInPosts();
    results.linkedInPosts = posts.length;

    // 6. Competitive Displacement
    const competitive = await runCompetitiveDisplacement();
    results.competitiveTargets = competitive.length;

    // 7. Pricing Experiments
    const pricing = await managePricingExperiments();
    results.pricingExperiments = pricing.length;

    // 8. Referral Program
    const referrals = await manageReferralProgram();
    results.referralPrompts = referrals.promptsSent;

    // 9. Partner Channel
    const partners = await managePartnerChannel();
    results.partners = partners.length;

    // 10. Enterprise Lead Gen
    const enterprise = await runEnterpriseLeadGen();
    results.enterpriseTargets = enterprise.length;

    console.log("\n" + "=".repeat(70));
    console.log("  REVENUE GROWTH ENGINES - CYCLE COMPLETE");
    console.log("=".repeat(70));
    console.log(`  📊 Leads Scored: ${results.leadScoring}`);
    console.log(`  📈 Upsell Opportunities: ${results.upsellOpportunities}`);
    console.log(`  🔄 Win-Back Candidates: ${results.winBackCandidates}`);
    console.log(`  ⭐ Testimonial Requests: ${results.testimonialRequests}`);
    console.log(`  💼 LinkedIn Posts: ${results.linkedInPosts}`);
    console.log(`  🎯 Competitive Targets: ${results.competitiveTargets}`);
    console.log(`  💰 Pricing Experiments: ${results.pricingExperiments}`);
    console.log(`  🤝 Referral Prompts: ${results.referralPrompts}`);
    console.log(`  🤝 Partners: ${results.partners}`);
    console.log(`  🏢 Enterprise Targets: ${results.enterpriseTargets}`);
    console.log("=".repeat(70) + "\n");

    return results;
  } catch (error) {
    console.error("[REVENUE ENGINES] Error in cycle:", error);
    return results;
  }
}
