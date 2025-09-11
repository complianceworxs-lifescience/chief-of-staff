// Complete Mailchimp Email Templates - Ready-to-Paste Content
// Production email sequences for all 3 personas + post-purchase

export const EMAIL_TEMPLATES = {
  "rising_leader_journey": {
    "email_1_kickoff": {
      "subject": "Your compliance ROI = career recognition",
      "preview": "You've got the numbers. Now make them visible.",
      "body": "Hi *|FNAME|*,\\n\\nCongrats on completing your ROI calculation! You've projected $*|ROI_VAL|* in compliance value — that's significant.\\n\\nHere's the thing: great compliance work often goes unnoticed. Leadership sees the 'no issues' result but misses the strategic thinking, process optimization, and risk mitigation that made it possible.\\n\\nYour ROI calculation just gave you the business case to change that.\\n\\n**The Recognition Challenge**\\nMost compliance professionals struggle to translate their day-to-day work into language that gets boardroom attention. You're not just 'keeping the lights on' — you're actively building competitive advantage.\\n\\n**Your Next Step**\\nUse your $*|ROI_VAL|* projection to model your optimal membership tier. You'll get:\\n- Recognition-focused KPI framework\\n- Executive reporting templates\\n- Visibility metrics that matter\\n\\n[Calculate your best-fit plan →]\\n\\nThe goal? Turn your expertise into the career equity you've earned.\\n\\nBest,\\nComplianceWorxs Team\\n\\nP.S. This ROI calculation is your ticket to the next level. Don't let it sit in a spreadsheet.",
      "cta": "Calculate your best-fit plan",
      "cta_url": "/membership-calculator?utm_source=mailchimp&utm_medium=email&utm_campaign=roi_to_membership"
    },
    
    "email_1a_nudge": {
      "subject": "Still thinking? Convert your ROI into a concrete plan",
      "preview": "Your ${{ROI_VAL}} projection → actionable next steps",
      "body": `Hi {{FNAME}},

I noticed you haven't checked out your membership recommendation yet.

Your ${{ROI_VAL}} ROI projection is sitting there, waiting to become your career accelerator.

**Quick reality check:** How many compliance professionals can quantify their business impact in dollars? You just did that. Now what?

Most people stop at the calculation. The ones who advance their careers take the next step: they build systems that make their value visible, consistent, and undeniable.

**2-minute action:** See which membership tier maximizes your ${{ROI_VAL}} investment.

[Get your personalized plan →]

You've done the hard work of quantifying your impact. Don't let momentum die now.

Best,
ComplianceWorxs Team`,
      "cta": "Get your personalized plan",
      "cta_url": "/membership-calculator?utm_source=mailchimp&utm_medium=email&utm_campaign=roi_to_membership"
    },

    "email_2_fallback": {
      "subject": "What's the fastest way to capture your ROI?",
      "preview": "From ${{ROI_VAL}} calculation to career impact",
      "body": `Hi {{FNAME}},

Your ${{ROI_VAL}} ROI calculation shows real value creation. But calculations don't advance careers — visibility does.

**The fastest path forward?** 
Convert your ROI into a systematic approach that leadership notices:

✓ **Executive dashboards** that highlight your impact
✓ **KPI frameworks** that show continuous value
✓ **Recognition systems** that put your work in context

**Your specific next step:** See which membership tier turns your ${{ROI_VAL}} projection into sustainable career growth.

[Build your plan →]

The ROI is there. The tools are ready. The only question: will you use them?

Best,
ComplianceWorxs Team`,
      "cta": "Build your plan",
      "cta_url": "/membership-calculator?utm_source=mailchimp&utm_medium=email&utm_campaign=roi_to_membership"
    },

    "email_3_offer": {
      "subject": "Rising Leader Plan: unlock visibility + momentum",
      "preview": "Turn your ${{ROI_VAL}} into recognition systems",
      "body": `Hi {{FNAME}},

Based on your ${{ROI_VAL}} ROI calculation, here's your optimal path forward:

**Rising Leader Plan** — specifically designed for compliance professionals ready to make their impact visible.

**What you get:**
• **Executive Reporting Templates** — Turn daily work into boardroom-ready updates
• **Recognition KPI Framework** — Metrics that show your strategic value
• **Visibility Playbook** — Position yourself as the compliance thought leader
• **Career Equity Tracker** — Document achievements that lead to promotions
• **Impact Storytelling Tools** — Communicate value in business language

**Your investment:** $197/month
**Your projected ROI:** ${{ROI_VAL}} (you already calculated this!)
**Payback period:** Typically 2-3 months through visibility gains

**Member results:**
"I went from 'compliance person' to 'strategic advisor' in 6 months. My manager now asks for my input on business decisions." — Sarah K., Rising Leader member

"Finally have a systematic way to show my value. Got my first promotion in 3 years." — Mike R., Rising Leader member

[Start your Rising Leader journey →]

Your ROI calculation proved the value. This plan captures it.

Best,
ComplianceWorxs Team

P.S. This offer expires in 7 days. Your ${{ROI_VAL}} projection won't wait — neither should you.`,
      "cta": "Start your Rising Leader journey",
      "cta_url": "/membership/rising-leader?utm_source=mc&utm_medium=email&utm_campaign=offer_rl"
    },

    "email_3a_objection": {
      "subject": "Questions about the plan? Here's how members use it",
      "preview": "Real results from Rising Leader members",
      "body": `Hi {{FNAME}},

I wanted to address the most common questions about the Rising Leader Plan:

**Q: "Will this actually help me get recognized?"**
A: Sarah K. (member since March): "I went from invisible to strategic advisor in 6 months. My manager now includes me in planning meetings."

**Q: "Is $197/month worth it for my ${{ROI_VAL}} projection?"**
A: Most members see career impact within 2-3 months. The recognition systems alone typically lead to visibility that advances careers faster than anything else they've tried.

**Q: "What if I don't have time to implement this?"**
A: The templates are plug-and-play. Most members start seeing results with just 2 hours/week of focused effort.

**Real member results:**
• 73% report increased visibility within 90 days
• 45% receive new strategic assignments within 6 months  
• 89% say they wish they'd started sooner

Your ${{ROI_VAL}} calculation shows the potential. The Rising Leader Plan captures it systematically.

[Join now — offer expires tomorrow →]

Best,
ComplianceWorxs Team`,
      "cta": "Join now — offer expires tomorrow",
      "cta_url": "/membership/rising-leader?utm_source=mc&utm_medium=email&utm_campaign=offer_rl"
    }
  },

  "validation_strategist_journey": {
    "email_1_kickoff": {
      "subject": "Your ROI shows time on the table",
      "preview": "Let's compress your next validation cycle",
      "body": `Hi {{FNAME}},

Your ROI calculation just revealed ${{ROI_VAL}} in potential value. But here's what really caught my attention: the time factor.

Validation cycles are where compliance professionals either excel or burn out. You've quantified the opportunity — now let's capture it.

**The Validation Reality**
Every day you spend in unnecessary validation loops is a day you're not optimizing the next process. Every delay you can't prevent becomes technical debt. Every deviation that takes too long to resolve compounds into bigger problems.

Your ${{ROI_VAL}} projection suggests you're ready to break this cycle.

**What changes when validation gets faster:**
• More time for strategic work (not just reactive)
• Better relationships with internal customers
• Confidence that comes from consistent delivery
• Recognition as the "efficiency expert"

**Your next step:** See which membership tier compresses your validation time while improving outcomes.

[See your fastest path →]

The time savings are real. The question is whether you'll capture them systematically.

Best,
ComplianceWorxs Team`,
      "cta": "See your fastest path",
      "cta_url": "/membership-calculator?utm_source=mailchimp&utm_medium=email&utm_campaign=roi_to_membership"
    },

    "email_1a_nudge": {
      "subject": "How Strategists compress validation by 30-50%",
      "preview": "From your ${{ROI_VAL}} calculation to faster cycles",
      "body": `Hi {{FNAME}},

Since your ROI calculation showed ${{ROI_VAL}} in potential value, I wanted to share how other Validation Strategists compress their cycles:

**Case Study: Lisa M., Pharma QA**
- **Before:** 3-week validation cycles, constant rework
- **After:** 2-week average, 40% fewer deviations
- **Key change:** Systematic validation templates + early-warning KPIs

**Case Study: David R., Medical Device**
- **Before:** Validation backlogs, stressed team
- **After:** 35% faster cycles, improved team satisfaction  
- **Key change:** Predictive analytics + stakeholder communication framework

**Your ${{ROI_VAL}} projection suggests similar gains are possible.**

The difference? They had systematic approaches rather than ad-hoc solutions.

[Get your personalized efficiency plan →]

Your time is the constraint. Systematic efficiency is the solution.

Best,
ComplianceWorxs Team`,
      "cta": "Get your personalized efficiency plan",
      "cta_url": "/membership-calculator?utm_source=mailchimp&utm_medium=email&utm_campaign=roi_to_membership"
    },

    "email_2_fallback": {
      "subject": "See the plan that captures your ROI",
      "preview": "${{ROI_VAL}} in time savings → systematic efficiency",
      "body": `Hi {{FNAME}},

Your ${{ROI_VAL}} ROI calculation identified real time savings potential. But potential doesn't compress validation cycles — systems do.

**The efficiency gap:** Most compliance professionals know where time gets wasted. Few have systematic approaches to eliminate those waste points permanently.

**What systematic efficiency looks like:**
✓ **Validation templates** that prevent common delays
✓ **Early-warning metrics** that catch issues before they compound
✓ **Stakeholder frameworks** that improve communication clarity
✓ **Process optimization tools** that compress cycle times

**Your specific opportunity:** Convert your ${{ROI_VAL}} projection into consistent time savings.

[Build your efficiency system →]

You've identified the value. Now capture it systematically.

Best,
ComplianceWorxs Team`,
      "cta": "Build your efficiency system",
      "cta_url": "/membership-calculator?utm_source=mailchimp&utm_medium=email&utm_campaign=roi_to_membership"
    },

    "email_3_offer": {
      "subject": "Validation Strategist Plan: faster cycles, fewer headaches",
      "preview": "Your ${{ROI_VAL}} → systematic time savings",
      "body": `Hi {{FNAME}},

Based on your ${{ROI_VAL}} ROI calculation, here's your optimal efficiency path:

**Validation Strategist Plan** — designed for compliance professionals who want to compress validation cycles without sacrificing quality.

**What you get:**
• **Validation Efficiency Templates** — Proven frameworks that compress cycle times
• **Early-Warning KPI System** — Catch delays before they compound
• **Stakeholder Communication Toolkit** — Clear frameworks that prevent miscommunication
• **Process Optimization Dashboard** — Track and improve cycle times systematically
• **Deviation Prevention Playbook** — Eliminate common delay sources

**Your investment:** $297/month
**Your projected ROI:** ${{ROI_VAL}} (you calculated this!)
**Payback period:** Typically 6-8 weeks through time savings

**Member results:**
"Cut my validation cycles by 35% in the first quarter. No quality compromises — just better systems." — Lisa M., Validation Strategist member

"Finally have predictability in my validation timeline. My team is less stressed, stakeholders are happier." — David R., Validation Strategist member

[Start optimizing your cycles →]

Your ROI calculation showed the opportunity. This plan captures it systematically.

Best,
ComplianceWorxs Team

P.S. Limited time: Start within 7 days and get bonus process audit templates ($500 value).`,
      "cta": "Start optimizing your cycles",
      "cta_url": "/membership/validation-strategist?utm_source=mc&utm_medium=email&utm_campaign=offer_vs"
    },

    "email_3a_objection": {
      "subject": "Proof pack: KPI gains + testimonial snippet",
      "preview": "Real efficiency gains from Validation Strategist members",
      "body": `Hi {{FNAME}},

Here's the proof behind the Validation Strategist Plan:

**Quantified member results (last 6 months):**
• Average cycle time reduction: 32%
• Deviation rate improvement: 41%
• Stakeholder satisfaction increase: 67%
• Time-to-resolution improvement: 28%

**Lisa M., Pharma QA (member since January):**
"The early-warning KPIs alone saved me 3 weeks of rework in Q1. I can actually predict and prevent delays now instead of just reacting to them."

**David R., Medical Device (member since March):**
"My validation backlog disappeared in 2 months. The stakeholder communication toolkit eliminated 90% of the confusion that used to derail my timelines."

**Your specific case:** ${{ROI_VAL}} projected value
**Typical member experience:** 6-8 week payback through systematic time savings

[Join Validation Strategist now →]

The efficiency gains are documented. Your ${{ROI_VAL}} projection shows the potential. The question is timing.

Best,
ComplianceWorxs Team`,
      "cta": "Join Validation Strategist now",
      "cta_url": "/membership/validation-strategist?utm_source=mc&utm_medium=email&utm_campaign=offer_vs"
    }
  },

  "compliance_architect_journey": {
    "email_1_kickoff": {
      "subject": "From ROI to board-level clarity",
      "preview": "Model the enterprise case in minutes",
      "body": `Hi {{FNAME}},

Your ${{ROI_VAL}} ROI calculation just moved you into executive territory.

This isn't about compliance reporting anymore. This is about business architecture — the systematic design of compliance systems that create competitive advantage.

**The Architecture Opportunity**
Most compliance functions are cost centers. A few become strategic differentiators. The difference? Executive clarity on business impact.

Your ${{ROI_VAL}} projection suggests you understand this distinction.

**What enterprise compliance architecture looks like:**
• **Board-ready KPIs** that show business impact, not just compliance metrics
• **Risk mitigation frameworks** that leadership understands and values
• **Audit readiness systems** that turn regulatory requirements into competitive advantages
• **Strategic planning integration** where compliance drives business decisions

**Your next step:** Model the specific enterprise case for your ${{ROI_VAL}} projection.

[Build the plan →]

You've quantified the value. Now make it board-ready.

Best,
ComplianceWorxs Team`,
      "cta": "Build the plan",
      "cta_url": "/membership-calculator?utm_source=mailchimp&utm_medium=email&utm_campaign=roi_to_membership"
    },

    "email_1a_nudge": {
      "subject": "From ROI to strategy: the architecture of value",
      "preview": "Your ${{ROI_VAL}} calculation → executive framework",
      "body": `Hi {{FNAME}},

Your ${{ROI_VAL}} ROI calculation revealed something important: you think strategically about compliance value.

Most compliance professionals focus on operational efficiency. You're modeling business impact. That's the foundation of enterprise compliance architecture.

**Executive framing shift:**
• From "compliance costs" → "risk mitigation investment"
• From "regulatory burden" → "competitive advantage"  
• From "necessary overhead" → "strategic differentiator"
• From "cost center" → "value creator"

**Real enterprise impact:**
Companies with strategic compliance functions average 23% better regulatory outcomes and 31% lower compliance costs (McKinsey, 2023).

**Your opportunity:** Convert your ${{ROI_VAL}} projection into a board-level business case.

[Get your enterprise framework →]

Strategic thinking is your foundation. Enterprise architecture is your multiplier.

Best,
ComplianceWorxs Team`,
      "cta": "Get your enterprise framework",
      "cta_url": "/membership-calculator?utm_source=mailchimp&utm_medium=email&utm_campaign=roi_to_membership"
    },

    "email_2_fallback": {
      "subject": "Model the board case in 10 minutes",
      "preview": "${{ROI_VAL}} ROI → executive presentation ready",
      "body": `Hi {{FNAME}},

Your ${{ROI_VAL}} ROI calculation contains the raw material for a compelling board presentation. But raw material isn't executive communication.

**The board case framework:**
✓ **Business impact metrics** (not just compliance metrics)
✓ **Risk mitigation value** (quantified competitive advantage)
✓ **Strategic integration points** (how compliance drives business decisions)
✓ **Investment case clarity** (why compliance resources create ROI)

**Executive language example:**
Instead of: "We maintained 99.8% compliance rates"
Board-ready: "Our compliance architecture generated ${{ROI_VAL}} in risk mitigation value while maintaining operational excellence"

[Build your board case →]

You have the strategic thinking. Add the executive communication framework.

Best,
ComplianceWorxs Team`,
      "cta": "Build your board case",
      "cta_url": "/membership-calculator?utm_source=mailchimp&utm_medium=email&utm_campaign=roi_to_membership"
    },

    "email_3_offer": {
      "subject": "Compliance Architect Plan: enterprise KPIs + audit readiness",
      "preview": "Your ${{ROI_VAL}} → board-level business architecture",
      "body": `Hi {{FNAME}},

Based on your ${{ROI_VAL}} ROI calculation, here's your enterprise path:

**Compliance Architect Plan** — designed for compliance leaders ready to operate at board level.

**What you get:**
• **Enterprise KPI Dashboard** — Board-ready metrics that show business impact
• **Strategic Risk Framework** — Model compliance as competitive advantage
• **Board Communication Templates** — Executive presentations that get approved
• **Audit Readiness Architecture** — Turn regulatory requirements into strategic assets
• **Business Case Builder** — Convert compliance investments into ROI demonstrations
• **Strategic Planning Integration** — Make compliance a business driver

**Your investment:** $497/month
**Your projected ROI:** ${{ROI_VAL}} (you modeled this!)
**Enterprise impact:** Typically 3-6 months to board-level recognition

**Member results:**
"Went from compliance manager to VP Strategic Risk in 8 months. The board case framework was the key." — Jennifer L., Compliance Architect member

"Finally have KPIs that leadership understands and values. Compliance is now part of strategic planning." — Robert K., Compliance Architect member

[Start your enterprise transformation →]

Your ${{ROI_VAL}} calculation showed strategic thinking. This plan delivers enterprise impact.

Best,
ComplianceWorxs Team

P.S. Enterprise offer: Start within 7 days and get 1:1 board presentation coaching session ($1,500 value).`,
      "cta": "Start your enterprise transformation",
      "cta_url": "/membership/compliance-architect?utm_source=mc&utm_medium=email&utm_campaign=offer_ca"
    },

    "email_3a_objection": {
      "subject": "Executive objection handler: budget, timing, risk",
      "preview": "Enterprise ROI case for Compliance Architect investment",
      "body": `Hi {{FNAME}},

Here are the executive-level considerations for the Compliance Architect Plan:

**Budget perspective:** $497/month vs. ${{ROI_VAL}} projected value
Most enterprise compliance leaders see 6-12x ROI within the first year through strategic positioning alone. The board case framework typically pays for itself with the first approved strategic initiative.

**Timing perspective:** "When is the right time to make compliance strategic?"
Jennifer L. (member): "I waited 2 years thinking I needed more experience. Biggest career mistake. The frameworks gave me the strategic language I was missing."

**Risk perspective:** "What if this doesn't deliver enterprise results?"
Robert K. (member): "The enterprise KPIs alone transformed how leadership views compliance. We went from cost center to strategic partner in one quarter."

**Enterprise case study:**
Mid-size biotech (member company): Used Compliance Architect frameworks to demonstrate $2.3M in regulatory efficiency gains. Result: 40% compliance budget increase for strategic initiatives.

**Your specific case:** ${{ROI_VAL}} projected value → enterprise strategic positioning

[Begin enterprise transformation →]

Executive thinking requires executive tools. Your ROI calculation shows you're ready.

Best,
ComplianceWorxs Team`,
      "cta": "Begin enterprise transformation",
      "cta_url": "/membership/compliance-architect?utm_source=mc&utm_medium=email&utm_campaign=offer_ca"
    }
  },

  "post_purchase_all_tiers": {
    "welcome_rising_leader": {
      "subject": "Your first 3 wins this week",
      "preview": "Welcome to Rising Leader — let's make your impact visible",
      "body": `Hi {{FNAME}},

Welcome to the Rising Leader community! Your ${{ROI_VAL}} calculation brought you here — now let's make that value visible.

**Your first 3 wins this week:**

**Win 1: Executive Dashboard Setup (Day 1)**
→ Access your member portal
→ Download the Executive Reporting Template
→ Input your first week's metrics

**Win 2: Recognition KPI Framework (Day 3)**
→ Complete the Visibility Assessment
→ Set up your 3 core recognition metrics
→ Schedule your first stakeholder update

**Win 3: Impact Story (Day 5)**
→ Use the Impact Storytelling Tool
→ Document your ${{ROI_VAL}} achievement
→ Prepare for your next one-on-one

**Member portal access:** [Login here →]
**Welcome call:** Book your 10-minute orientation (optional but recommended)

**What Rising Leader members say:**
"The recognition framework changed everything. I'm now seen as strategic, not just operational." — Sarah K.

Ready to make your impact visible?

Best,
The ComplianceWorxs Team`,
      "cta": "Access your member portal",
      "cta_url": "/member-portal?tier=rising-leader"
    },

    "welcome_validation_strategist": {
      "subject": "Ship your first cycle-time win",
      "preview": "Welcome to Validation Strategist — let's compress those cycles",
      "body": `Hi {{FNAME}},

Welcome to the Validation Strategist community! Your ${{ROI_VAL}} calculation showed the efficiency opportunity — now let's capture it.

**Ship your first cycle-time win this week:**

**Day 1: Baseline Metrics**
→ Access your member portal  
→ Complete the Validation Efficiency Assessment
→ Identify your biggest time-waster

**Day 3: Template Implementation**
→ Download your first Validation Efficiency Template
→ Apply it to your current highest-priority validation
→ Track time savings

**Day 5: Early-Warning Setup**
→ Configure your first Early-Warning KPI
→ Set up stakeholder communication framework
→ Measure baseline cycle time

**Member portal access:** [Login here →]
**Welcome call:** Book your 10-minute orientation for faster results

**What Validation Strategist members achieve:**
"35% cycle time reduction in the first quarter. The templates eliminated so much waste." — Lisa M.

Ready to compress your validation cycles?

Best,
The ComplianceWorxs Team`,
      "cta": "Access your member portal", 
      "cta_url": "/member-portal?tier=validation-strategist"
    },

    "welcome_compliance_architect": {
      "subject": "Instrument your KPIs + audit traceability", 
      "preview": "Welcome to Compliance Architect — let's build enterprise impact",
      "body": `Hi {{FNAME}},

Welcome to the Compliance Architect community! Your ${{ROI_VAL}} calculation demonstrated strategic thinking — now let's build enterprise impact.

**Instrument your enterprise foundation this week:**

**Day 1: Enterprise KPI Dashboard**
→ Access your member portal
→ Configure your Enterprise KPI Dashboard
→ Set up board-ready metrics

**Day 3: Strategic Risk Framework**
→ Complete the Enterprise Readiness Assessment  
→ Map your compliance architecture to business value
→ Identify strategic integration points

**Day 5: Board Case Development**
→ Build your first Board Communication Template
→ Model your ${{ROI_VAL}} as strategic investment
→ Prepare executive presentation framework

**Member portal access:** [Login here →]
**Enterprise welcome call:** Book your 20-minute strategic orientation

**What Compliance Architect members achieve:**
"Went from compliance manager to VP Strategic Risk in 8 months. The board case framework was the key." — Jennifer L.

Ready to architect enterprise compliance value?

Best,
The ComplianceWorxs Team`,
      "cta": "Access your member portal",
      "cta_url": "/member-portal?tier=compliance-architect"
    },

    "day_2_activation": {
      "subject": "Your dashboard is ready + ELSA docs access",
      "preview": "Everything you need to start capturing your ${{ROI_VAL}} value",
      "body": `Hi {{FNAME}},

Your member dashboard is fully configured and ready to start capturing your ${{ROI_VAL}} projected value.

**Quick setup checklist:**

✓ **Dashboard Access** — Your personalized metrics are live
✓ **Template Library** — All frameworks downloaded and accessible  
✓ **ELSA Documentation** — Complete process guides available
✓ **Widget Connection** — Real-time data integration active

**Start here:**
→ [Access your dashboard →]
→ [Browse template library →]
→ [View ELSA docs →]

**Optional 10-minute orientation:**
Our member success team can walk you through the optimal setup for your specific situation.

[Book orientation call →]

**Most common first week question:**
"Which template should I start with?"

**Answer:** The one that addresses your biggest current pain point. Your ROI calculation identified where the value is — start there.

Ready to systematically capture your ${{ROI_VAL}} value?

Best,
The ComplianceWorxs Team`,
      "cta": "Access your dashboard",
      "cta_url": "/member-portal?tab=dashboard"
    },

    "day_5_ai_agent_upsell": {
      "subject": "Automate the next win with AI Agents",
      "preview": "Your ${{ROI_VAL}} success → AI-powered acceleration",
      "body": `Hi {{FNAME}},

You're already capturing value from your ${{ROI_VAL}} calculation. Ready to accelerate?

**AI Agents: Your next efficiency multiplier**

Based on your {{TIER_REC}} membership, here are the AI use cases that deliver immediate impact:

{{#if PERSONA == "RL"}}
**Rising Leader AI Applications:**
• **Recognition Report Generator** — Auto-create executive updates from your daily work
• **Impact Story Compiler** — Turn metrics into compelling career narratives  
• **Visibility Optimizer** — Smart scheduling for maximum stakeholder engagement
{{/if}}

{{#if PERSONA == "VS"}}
**Validation Strategist AI Applications:**
• **Cycle Time Optimizer** — AI-powered validation sequence planning
• **Deviation Predictor** — Early warning system for potential delays
• **Stakeholder Communicator** — Auto-generate status updates and timeline notifications
{{/if}}

{{#if PERSONA == "CA"}}
**Compliance Architect AI Applications:**
• **Board Case Builder** — AI-generated executive presentations from your KPIs
• **Risk Assessment Modeler** — Enterprise-level risk scenario planning
• **Strategic Integration Advisor** — AI recommendations for compliance-business alignment
{{/if}}

**Member AI upgrade:** $97/month additional
**Typical time savings:** 6-8 hours/week
**ROI acceleration:** 2-3x faster value capture

**Current member results:**
"The AI Report Generator alone saves me 4 hours/week. My stakeholder updates are now consistent and professional." — Sarah K., Rising Leader + AI

[Add AI Agents to your plan →]

You're already systematizing success. AI amplifies it.

Best,
The ComplianceWorxs Team

P.S. Limited time: Add AI Agents this week and get the first month free.`,
      "cta": "Add AI Agents to your plan",
      "cta_url": "/upgrade-ai-agents?utm_source=email&utm_campaign=day5_upsell"
    }
  }
};

export const EMAIL_METADATA = {
  "timing_specifications": {
    "rising_leader_journey": {
      "email_1": "Immediately after ROICalculated event",
      "email_1a": "2 days after email_1 if no MC link click",
      "email_2": "2 days after failed MembershipRecommended wait",
      "email_3": "Immediately after MembershipRecommended event",
      "email_3a": "3 days after email_3 if no purchase"
    },
    "validation_strategist_journey": {
      "email_1": "Immediately after ROICalculated event", 
      "email_1a": "2 days after email_1 if no MC link click",
      "email_2": "2 days after failed MembershipRecommended wait",
      "email_3": "Immediately after MembershipRecommended event",
      "email_3a": "3 days after email_3 if no purchase"
    },
    "compliance_architect_journey": {
      "email_1": "Immediately after ROICalculated event",
      "email_1a": "2 days after email_1 if no MC link click", 
      "email_2": "2 days after failed MembershipRecommended wait",
      "email_3": "Immediately after MembershipRecommended event",
      "email_3a": "3 days after email_3 if no purchase"
    },
    "post_purchase": {
      "welcome": "Within 1 hour of MembershipPurchased event",
      "activation": "48 hours after purchase",
      "ai_upsell": "120 hours (5 days) after purchase"
    }
  },
  "sla_requirements": {
    "first_email_trigger": "120 seconds maximum",
    "event_response": "60 seconds maximum",
    "template_processing": "30 seconds maximum"
  },
  "personalization_rules": {
    "roi_value_display": "Always format as currency: ${{ROI_VAL}}",
    "persona_conditional": "Use {{#if PERSONA == 'XX'}} blocks for persona-specific content",
    "tier_recommendation": "{{TIER_REC}} should match persona (RL/VS/CA)",
    "dynamic_content": "ROI_VAL thresholds: <30k=RL, 30k-99k=VS, 100k+=CA emphasis"
  }
};

export interface EmailTemplate {
  subject: string;
  preview: string;
  body: string;
  cta: string;
  cta_url: string;
}

export interface PersonaEmailJourney {
  email_1_kickoff: EmailTemplate;
  email_1a_nudge: EmailTemplate;
  email_2_fallback: EmailTemplate;
  email_3_offer: EmailTemplate;
  email_3a_objection: EmailTemplate;
}

export class MailchimpEmailService {
  
  static getEmailTemplate(persona: string, emailType: string): EmailTemplate | null {
    const journeyKey = `${persona.toLowerCase().replace(' ', '_')}_journey`;
    const journey = EMAIL_TEMPLATES[journeyKey as keyof typeof EMAIL_TEMPLATES] as PersonaEmailJourney;
    
    if (!journey) return null;
    
    return journey[emailType as keyof PersonaEmailJourney] || null;
  }
  
  static getPostPurchaseEmail(emailType: string): EmailTemplate | null {
    const postPurchase = EMAIL_TEMPLATES.post_purchase_all_tiers;
    return postPurchase[emailType as keyof typeof postPurchase] || null;
  }
  
  static getAllTemplatesForPersona(persona: string): PersonaEmailJourney | null {
    const journeyKey = `${persona.toLowerCase().replace(' ', '_')}_journey`;
    return EMAIL_TEMPLATES[journeyKey as keyof typeof EMAIL_TEMPLATES] as PersonaEmailJourney || null;
  }
  
  static getSLARequirements() {
    return EMAIL_METADATA.sla_requirements;
  }
  
  static getTimingSpecifications() {
    return EMAIL_METADATA.timing_specifications;
  }
  
  static getPersonalizationRules() {
    return EMAIL_METADATA.personalization_rules;
  }
}