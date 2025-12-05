import { Router, Request, Response } from "express";
import {
  scoreAllLeads,
  detectUpsellOpportunities,
  runWinBackCampaign,
  identifyTestimonialCandidates,
  generateLinkedInPosts,
  runCompetitiveDisplacement,
  managePricingExperiments,
  manageReferralProgram,
  managePartnerChannel,
  runEnterpriseLeadGen,
  runAllRevenueEngines
} from "../services/revenue-growth-engines";
import fs from "fs/promises";

const router = Router();
const STATE_DIR = "./state";

// Run all engines
router.post("/run-all", async (req: Request, res: Response) => {
  try {
    const results = await runAllRevenueEngines();
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error running all engines:", error);
    res.status(500).json({ success: false, error: "Failed to run engines" });
  }
});

// Lead Scoring
router.get("/leads/scored", async (req: Request, res: Response) => {
  try {
    const leads = await scoreAllLeads();
    res.json({ 
      success: true, 
      data: {
        total: leads.length,
        hot: leads.filter(l => l.tier === "hot").length,
        warm: leads.filter(l => l.tier === "warm").length,
        cold: leads.filter(l => l.tier === "cold").length,
        leads
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to score leads" });
  }
});

// Upsell Opportunities
router.get("/upsell/opportunities", async (req: Request, res: Response) => {
  try {
    const opportunities = await detectUpsellOpportunities();
    res.json({ 
      success: true, 
      data: {
        total: opportunities.length,
        totalValue: opportunities.reduce((sum, o) => sum + o.estimatedValue, 0),
        opportunities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to detect upsells" });
  }
});

// Win-Back Campaign
router.post("/winback/run", async (req: Request, res: Response) => {
  try {
    const result = await runWinBackCampaign();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to run win-back" });
  }
});

router.get("/winback/candidates", async (req: Request, res: Response) => {
  try {
    const data = await fs.readFile(`${STATE_DIR}/winback_candidates.json`, "utf-8");
    res.json({ success: true, data: JSON.parse(data) });
  } catch {
    res.json({ success: true, data: { candidates: [] } });
  }
});

// Testimonials
router.post("/testimonials/request", async (req: Request, res: Response) => {
  try {
    const candidates = await identifyTestimonialCandidates();
    res.json({ 
      success: true, 
      data: {
        total: candidates.length,
        requestsSent: candidates.filter(c => c.requestSent).length,
        candidates
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to request testimonials" });
  }
});

// LinkedIn Posts
router.post("/linkedin/generate", async (req: Request, res: Response) => {
  try {
    const posts = await generateLinkedInPosts();
    res.json({ success: true, data: { generated: posts.length, posts } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to generate posts" });
  }
});

router.get("/linkedin/posts", async (req: Request, res: Response) => {
  try {
    const data = await fs.readFile(`${STATE_DIR}/linkedin_posts.json`, "utf-8");
    res.json({ success: true, data: JSON.parse(data) });
  } catch {
    res.json({ success: true, data: { posts: [] } });
  }
});

// Competitive Displacement
router.post("/competitive/scan", async (req: Request, res: Response) => {
  try {
    const targets = await runCompetitiveDisplacement();
    res.json({ success: true, data: { total: targets.length, targets } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to scan competitors" });
  }
});

router.get("/competitive/targets", async (req: Request, res: Response) => {
  try {
    const data = await fs.readFile(`${STATE_DIR}/competitive_targets.json`, "utf-8");
    res.json({ success: true, data: JSON.parse(data) });
  } catch {
    res.json({ success: true, data: { targets: [] } });
  }
});

// Pricing Experiments
router.get("/pricing/experiments", async (req: Request, res: Response) => {
  try {
    const experiments = await managePricingExperiments();
    res.json({ success: true, data: { total: experiments.length, experiments } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get experiments" });
  }
});

// Referral Program
router.post("/referral/run", async (req: Request, res: Response) => {
  try {
    const result = await manageReferralProgram();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to run referral program" });
  }
});

router.get("/referral/status", async (req: Request, res: Response) => {
  try {
    const data = await fs.readFile(`${STATE_DIR}/referrals.json`, "utf-8");
    res.json({ success: true, data: JSON.parse(data) });
  } catch {
    res.json({ success: true, data: { referrals: [], promptsSent: 0 } });
  }
});

// Partner Channel
router.get("/partners", async (req: Request, res: Response) => {
  try {
    const partners = await managePartnerChannel();
    res.json({ success: true, data: { total: partners.length, partners } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get partners" });
  }
});

// Enterprise Lead Gen
router.post("/enterprise/research", async (req: Request, res: Response) => {
  try {
    const targets = await runEnterpriseLeadGen();
    res.json({ success: true, data: { total: targets.length, targets } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to research enterprise" });
  }
});

router.get("/enterprise/targets", async (req: Request, res: Response) => {
  try {
    const data = await fs.readFile(`${STATE_DIR}/enterprise_targets.json`, "utf-8");
    res.json({ success: true, data: JSON.parse(data) });
  } catch {
    res.json({ success: true, data: { targets: [] } });
  }
});

// Summary endpoint
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const summary: Record<string, any> = {};
    
    const files = [
      { key: "scoredLeads", file: "scored_leads.json" },
      { key: "upsellOpportunities", file: "upsell_opportunities.json" },
      { key: "winbackCandidates", file: "winback_candidates.json" },
      { key: "testimonialCandidates", file: "testimonial_candidates.json" },
      { key: "linkedinPosts", file: "linkedin_posts.json" },
      { key: "competitiveTargets", file: "competitive_targets.json" },
      { key: "pricingExperiments", file: "pricing_experiments.json" },
      { key: "referrals", file: "referrals.json" },
      { key: "partners", file: "partners.json" },
      { key: "enterpriseTargets", file: "enterprise_targets.json" }
    ];

    for (const { key, file } of files) {
      try {
        const data = await fs.readFile(`${STATE_DIR}/${file}`, "utf-8");
        const parsed = JSON.parse(data);
        summary[key] = {
          count: Array.isArray(parsed) ? parsed.length : 
                 parsed.leads?.length || parsed.opportunities?.length || 
                 parsed.candidates?.length || parsed.posts?.length || 
                 parsed.targets?.length || parsed.experiments?.length || 
                 parsed.referrals?.length || parsed.partners?.length || 0,
          lastRun: parsed.lastRun || parsed.lastScored || parsed.lastGenerated
        };
      } catch {
        summary[key] = { count: 0, lastRun: null };
      }
    }

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get summary" });
  }
});

export default router;
