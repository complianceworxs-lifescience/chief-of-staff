import type { 
  CampaignBrief, 
  InsertCampaignBrief, 
  BrandAsset, 
  InsertBrandAsset, 
  ContentAsset, 
  InsertContentAsset 
} from "@shared/schema";
import type { IStorage } from "../storage";

export class ContentManager {
  constructor(private storage: IStorage) {}

  // 1. Strategic Brief Ingestion & Deconstruction
  async processStrategicBrief(brief: InsertCampaignBrief): Promise<CampaignBrief> {
    // Create campaign brief from Chief of Staff directive
    const campaignBrief = await this.storage.createCampaignBrief({
      ...brief,
      briefingAgent: "chief-of-staff",
      assignedAgent: "content",
      status: "in_progress"
    });

    // Auto-generate initial content assets based on brief
    await this.generateContentAssetsForBrief(campaignBrief.id);
    
    return campaignBrief;
  }

  // 2. Knowledge Base Integration
  async getBrandVoiceAndTone(): Promise<BrandAsset | undefined> {
    const brandAssets = await this.storage.getBrandAssets("voice_tone");
    return brandAssets.find(asset => asset.isActive);
  }

  async getProductInformation(category?: string): Promise<BrandAsset[]> {
    const allAssets = await this.storage.getBrandAssets("product_info");
    if (category) {
      return allAssets.filter(asset => 
        asset.category === category && asset.isActive
      );
    }
    return allAssets.filter(asset => asset.isActive);
  }

  async getProofPoints(): Promise<BrandAsset[]> {
    return this.storage.getBrandAssets("proof_point");
  }

  async getCaseStudies(): Promise<BrandAsset[]> {
    return this.storage.getBrandAssets("case_study");
  }

  // 3. Multi-Format Content Generation
  async generateContentAssetsForBrief(briefId: string): Promise<ContentAsset[]> {
    const brief = await this.storage.getCampaignBrief(briefId);
    if (!brief) throw new Error("Campaign brief not found");

    const brandVoice = await this.getBrandVoiceAndTone();
    const proofPoints = await this.getProofPoints();
    
    const contentAssets: ContentAsset[] = [];

    // Generate content for each target channel
    for (const channel of brief.targetChannels) {
      switch (channel.toLowerCase()) {
        case "linkedin":
          const linkedinPost = await this.generateLinkedInPost(brief, brandVoice, proofPoints);
          contentAssets.push(linkedinPost);
          break;
        case "email":
          const emailSequence = await this.generateEmailSequence(brief, brandVoice, proofPoints);
          contentAssets.push(emailSequence);
          break;
        case "paid_ads":
          const adCopy = await this.generateAdCopy(brief, brandVoice, proofPoints);
          contentAssets.push(adCopy);
          break;
        case "website":
          const landingPage = await this.generateLandingPageCopy(brief, brandVoice, proofPoints);
          contentAssets.push(landingPage);
          break;
      }
    }

    return contentAssets;
  }

  private async generateLinkedInPost(
    brief: CampaignBrief, 
    brandVoice?: BrandAsset, 
    proofPoints?: BrandAsset[]
  ): Promise<ContentAsset> {
    const proofPoint = proofPoints?.[0]?.content || "significant operational improvements";
    
    const content = `🚀 ${brief.targetPersona}s: Are you tired of ${brief.painPoints[0]}?

Our latest ${brief.coreMessage} has helped compliance teams achieve ${proofPoint}.

${brief.valueProposition}

Want to see how? Comment "INTERESTED" below.

#ComplianceWorxs #Automation #Compliance #Efficiency

[Visual Suggestion: An infographic showing before/after workflow comparison with clear metrics]`;

    return this.storage.createContentAsset({
      briefId: brief.id,
      type: "social_post",
      channel: "linkedin",
      title: `LinkedIn Post - ${brief.title}`,
      content,
      visualSuggestions: ["Infographic showing before/after workflow comparison with clear metrics"],
      variations: [
        "Alternative hook: 'What if you could cut compliance tasks by 50%?'",
        "Alternative CTA: 'DM me for a free workflow analysis'"
      ]
    });
  }

  private async generateEmailSequence(
    brief: CampaignBrief, 
    brandVoice?: BrandAsset, 
    proofPoints?: BrandAsset[]
  ): Promise<ContentAsset> {
    const content = `Email Sequence: ${brief.title}

EMAIL 1 - VALUE DELIVERY (Day 0)
Subject: Your ${brief.targetPersona} Workflow Analysis is Ready

Hi [First Name],

As promised, here's your personalized workflow analysis showing how ${brief.coreMessage}.

Key insight: ${brief.painPoints[0]} is costing you approximately 15 hours per week.

[Download Analysis Button]

Best,
The ComplianceWorxs Team

EMAIL 2 - PROOF POINT (Day 3)
Subject: How [Company] Reduced Compliance Time by 65%

Hi [First Name],

I wanted to share a quick case study that's directly relevant to your situation.

[Client Company] was facing the exact same challenge: ${brief.painPoints[0]}.

After implementing our solution: ${proofPoints?.[0]?.content || "They saw immediate improvements"}

The key was ${brief.valueProposition}.

Worth a 15-minute conversation?

[Book Call Button]

EMAIL 3 - FINAL VALUE (Day 7)
Subject: Last chance: ${brief.objective}

Hi [First Name],

This is my final email about ${brief.coreMessage}.

If ${brief.objective} matters to your team, let's chat.

Simple question: What would an extra 15 hours per week mean to your team?

[Book Call Button]

[Visual Suggestions: Email template mockups, workflow diagrams for case study]`;

    return this.storage.createContentAsset({
      briefId: brief.id,
      type: "email_sequence",
      channel: "email",
      title: `Email Sequence - ${brief.title}`,
      content,
      visualSuggestions: [
        "Email template mockups showing clean, professional design",
        "Workflow diagrams illustrating the case study improvements"
      ]
    });
  }

  private async generateAdCopy(
    brief: CampaignBrief, 
    brandVoice?: BrandAsset, 
    proofPoints?: BrandAsset[]
  ): Promise<ContentAsset> {
    const content = `Ad Copy Variations - ${brief.title}

HEADLINE OPTION 1:
"Stop Wasting 15 Hours/Week on ${brief.painPoints[0]}"

HEADLINE OPTION 2:
"${brief.targetPersona}s: Cut Compliance Tasks by 65%"

HEADLINE OPTION 3:
"The AI Solution That Finally Solves ${brief.painPoints[0]}"

BODY TEXT A:
${brief.valueProposition} Our AI-powered platform has helped 500+ compliance teams ${proofPoints?.[0]?.content || "achieve remarkable results"}.

BODY TEXT B:
Tired of ${brief.painPoints[0]}? Join 500+ teams who've automated their compliance workflows with ComplianceWorxs.

BODY TEXT C:
${brief.coreMessage} - See how in our free 15-minute demo.

CTA OPTIONS:
- "Get Free Demo"
- "See How It Works"
- "Start Free Trial"
- "Book Strategy Call"

[Visual Suggestion: Clean, minimalist ad creative with workflow automation graphics]`;

    return this.storage.createContentAsset({
      briefId: brief.id,
      type: "ad_copy",
      channel: "paid_ads",
      title: `Ad Copy - ${brief.title}`,
      content,
      visualSuggestions: ["Clean, minimalist ad creative with workflow automation graphics"]
    });
  }

  private async generateLandingPageCopy(
    brief: CampaignBrief, 
    brandVoice?: BrandAsset, 
    proofPoints?: BrandAsset[]
  ): Promise<ContentAsset> {
    const content = `Landing Page Copy - ${brief.title}

HERO SECTION:
Headline: Stop ${brief.painPoints[0]} Forever
Subheadline: ${brief.valueProposition}
CTA: Get Free Demo

PROBLEM SECTION:
Are You Tired Of:
• ${brief.painPoints.join('\n• ')}
• Manual processes that eat up your time
• Compliance bottlenecks that slow everything down

SOLUTION SECTION:
${brief.coreMessage}

Our AI-powered platform eliminates the manual work so you can focus on strategy.

PROOF SECTION:
"${proofPoints?.[0]?.content || 'ComplianceWorxs helped us reduce manual tasks by 65% in just 30 days.'}"
- [Client Name], ${brief.targetPersona}

FEATURES:
✓ Automated workflow generation
✓ Real-time compliance monitoring  
✓ Smart alert system
✓ Integration with existing tools

FINAL CTA SECTION:
Ready to ${brief.objective}?
Book your free strategy session today.

[Book Demo Button]

[Visual Suggestions: Hero image showing clean dashboard interface, before/after workflow comparison chart, client testimonial photos]`;

    return this.storage.createContentAsset({
      briefId: brief.id,
      type: "landing_page",
      channel: "website",
      title: `Landing Page - ${brief.title}`,
      content,
      visualSuggestions: [
        "Hero image showing clean dashboard interface",
        "Before/after workflow comparison chart",
        "Client testimonial photos with quotes"
      ]
    });
  }

  // 4. Content Management & Optimization
  async getContentAssetsByBrief(briefId: string): Promise<ContentAsset[]> {
    return this.storage.getContentAssets(briefId);
  }

  async updateContentAsset(id: string, updates: Partial<InsertContentAsset>): Promise<ContentAsset | undefined> {
    return this.storage.updateContentAsset(id, updates);
  }

  async approveContentAsset(id: string): Promise<ContentAsset | undefined> {
    return this.storage.updateContentAsset(id, { status: "approved" });
  }

  // Initialize default brand assets for the system
  async initializeBrandAssets(): Promise<void> {
    try {
      const existingAssets = await this.storage.getBrandAssets();
      if (existingAssets.length > 0) return;
    } catch (error) {
      console.warn('Database not available during startup, skipping brand asset initialization:', error.message);
      return;
    }

    const defaultAssets: InsertBrandAsset[] = [
      {
        type: "voice_tone",
        title: "ComplianceWorxs Brand Voice & Tone",
        content: "Authoritative yet approachable. We speak with confidence about compliance automation while remaining helpful and human. Avoid jargon, focus on clear value propositions, and always lead with customer outcomes.",
        category: "brand",
        tags: ["voice", "tone", "brand guidelines"]
      },
      {
        type: "product_info",
        title: "Validation Acceleration Agent",
        content: "AI-powered validation automation that reduces compliance cycle time by up to 75%. Automatically generates validation protocols, monitors progress, and ensures regulatory adherence.",
        category: "agents",
        tags: ["validation", "automation", "ai"]
      },
      {
        type: "proof_point",
        title: "Cycle Time Reduction",
        content: "reduced validation cycle time by 75% and eliminated 90% of manual documentation tasks",
        category: "results",
        tags: ["metrics", "results", "validation"]
      },
      {
        type: "case_study",
        title: "Fortune 500 Pharma Company",
        content: "A Fortune 500 pharmaceutical company struggled with 3-month validation cycles. After implementing ComplianceWorxs, they reduced cycles to 3 weeks while maintaining 100% regulatory compliance.",
        category: "pharma",
        tags: ["case study", "pharma", "validation"]
      }
    ];

    for (const asset of defaultAssets) {
      await this.storage.createBrandAsset(asset);
    }
  }
}