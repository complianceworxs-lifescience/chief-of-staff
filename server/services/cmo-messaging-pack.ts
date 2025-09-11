// CMO Messaging Pack - CTA Matrix and Landing Page Content
// Complete messaging framework for the ComplianceWorxs funnel

import { storage } from '../storage.js';

// CTA Matrix - Asset × Persona → Forward Action
export const CTA_MATRIX = {
  "elsa_playbooks": {
    "rising_leader": {
      "primary_cta": "Calculate your recognition ROI",
      "secondary_cta": "Take the diagnostic quiz",
      "messaging": "Turn compliance wins into career advancement",
      "utm_campaign": "elsa_to_quiz_rl",
      "proof_elements": ["Career advancement stories", "Visibility metrics"],
      "urgency_factors": ["Limited recognition opportunities", "Career plateau risk"]
    },
    "validation_strategist": {
      "primary_cta": "Quantify your time savings",
      "secondary_cta": "Take the diagnostic quiz", 
      "messaging": "Compress validation cycles, reduce rework",
      "utm_campaign": "elsa_to_quiz_vs",
      "proof_elements": ["Cycle time reduction", "Efficiency case studies"],
      "urgency_factors": ["Validation backlogs", "Resource constraints"]
    },
    "compliance_architect": {
      "primary_cta": "Model your enterprise ROI",
      "secondary_cta": "Take the diagnostic quiz",
      "messaging": "Build the board-level business case",
      "utm_campaign": "elsa_to_quiz_ca",
      "proof_elements": ["Board-level reporting", "Enterprise case studies"],
      "urgency_factors": ["Regulatory pressures", "Audit deadlines"]
    }
  },
  "diagnostic_quiz": {
    "rising_leader": {
      "primary_cta": "Calculate your career ROI",
      "secondary_cta": "See recognition opportunities",
      "messaging": "Your compliance impact in dollars and visibility",
      "utm_campaign": "quiz_to_roi_rl",
      "proof_elements": ["Recognition frameworks", "Career impact metrics"],
      "social_proof": "Join 500+ compliance professionals advancing their careers"
    },
    "validation_strategist": {
      "primary_cta": "Calculate your efficiency ROI", 
      "secondary_cta": "Model time savings",
      "messaging": "Your validation optimization potential",
      "utm_campaign": "quiz_to_roi_vs",
      "proof_elements": ["Time savings calculators", "Efficiency benchmarks"],
      "social_proof": "Join 300+ validation experts reducing cycle times"
    },
    "compliance_architect": {
      "primary_cta": "Calculate your strategic ROI",
      "secondary_cta": "Build enterprise case",
      "messaging": "Your compliance architecture value",
      "utm_campaign": "quiz_to_roi_ca",
      "proof_elements": ["Strategic frameworks", "Enterprise value models"],
      "social_proof": "Join 150+ compliance architects driving business value"
    }
  },
  "roi_calculator": {
    "rising_leader": {
      "primary_cta": "Get your Recognition Plan",
      "secondary_cta": "See membership options",
      "messaging": "Turn $*|ROI_VAL|* into career growth",
      "utm_campaign": "roi_to_membership_rl",
      "proof_elements": ["Career advancement testimonials", "Recognition case studies"],
      "objection_handlers": ["Time commitment", "Budget approval", "Implementation support"]
    },
    "validation_strategist": {
      "primary_cta": "Get your Efficiency Plan",
      "secondary_cta": "See membership options",
      "messaging": "Capture $*|ROI_VAL|* in time savings",
      "utm_campaign": "roi_to_membership_vs",
      "proof_elements": ["Efficiency improvement metrics", "Time savings testimonials"],
      "objection_handlers": ["Resource allocation", "Team adoption", "Technical integration"]
    },
    "compliance_architect": {
      "primary_cta": "Get your Enterprise Plan",
      "secondary_cta": "See membership options", 
      "messaging": "Architect $*|ROI_VAL|* in strategic value",
      "utm_campaign": "roi_to_membership_ca",
      "proof_elements": ["Board presentation examples", "Enterprise success stories"],
      "objection_handlers": ["Budget cycles", "Stakeholder buy-in", "Implementation complexity"]
    }
  },
  "membership_calculator": {
    "rising_leader": {
      "primary_cta": "Start your Recognition Journey - $197/month",
      "secondary_cta": "Compare all plans",
      "messaging": "Unlock visibility systems that advance careers",
      "utm_campaign": "membership_to_purchase_rl",
      "scarcity_elements": ["Limited onboarding slots", "Q4 promotion cycles"],
      "risk_reversal": ["30-day satisfaction guarantee", "Cancel anytime"]
    },
    "validation_strategist": {
      "primary_cta": "Start your Efficiency Journey - $297/month",
      "secondary_cta": "Compare all plans",
      "messaging": "Implement systematic validation optimization",
      "utm_campaign": "membership_to_purchase_vs",
      "scarcity_elements": ["Q4 validation planning", "Resource allocation deadlines"],
      "risk_reversal": ["ROI guarantee within 90 days", "Implementation support included"]
    },
    "compliance_architect": {
      "primary_cta": "Start your Strategic Journey - $497/month",
      "secondary_cta": "Compare all plans",
      "messaging": "Deploy enterprise compliance architecture",
      "utm_campaign": "membership_to_purchase_ca",
      "scarcity_elements": ["Enterprise slots limited", "Budget year planning"],
      "risk_reversal": ["Executive presentation guarantee", "White-glove implementation"]
    }
  }
};

// Landing Page Rewrites - Persona-based membership copy
export const LANDING_PAGE_REWRITES = {
  "rising_leader_membership": {
    "hero_headline": "Turn Your Compliance Expertise Into Career Recognition",
    "subheadline": "The systematic approach to making your value visible, measurable, and undeniable",
    "hero_cta": "Calculate Your Recognition ROI",
    "proof_above_fold": {
      "testimonial": "I went from 'compliance person' to 'strategic advisor' in 6 months. Finally have the recognition I deserve.",
      "attribution": "Sarah K., Senior Compliance Manager → Director",
      "metric": "73% of members report increased visibility within 90 days"
    },
    "value_propositions": [
      "Executive Reporting Templates - Turn daily work into boardroom-ready updates",
      "Recognition KPI Framework - Metrics that show your strategic value", 
      "Visibility Playbook - Position yourself as the compliance thought leader",
      "Career Equity Tracker - Document achievements that lead to promotions",
      "Impact Storytelling Tools - Communicate value in business language"
    ],
    "objection_handling": {
      "time": "Templates are plug-and-play. Most members see results with 2 hours/week.",
      "budget": "$197/month investment typically pays for itself through visibility gains within 2-3 months.",
      "recognition": "Our systematic approach has helped 500+ compliance professionals advance their careers."
    },
    "social_proof_section": {
      "headline": "Join 500+ Compliance Professionals Advancing Their Careers",
      "testimonials": [
        "Finally have a systematic way to show my value. Got my first promotion in 3 years. - Mike R.",
        "The recognition framework changed everything. Leadership now sees me as strategic. - Lisa T.",
        "From invisible to indispensable in 6 months. The ROI was immediate. - David M."
      ]
    }
  },
  "validation_strategist_membership": {
    "hero_headline": "Cut Validation Cycles by 30-50% While Improving Quality",
    "subheadline": "The systematic approach to validation efficiency that reduces rework and accelerates timelines",
    "hero_cta": "Calculate Your Efficiency ROI",
    "proof_above_fold": {
      "testimonial": "Reduced our validation cycles from 3 weeks to 2 weeks with 40% fewer deviations. Game changer.",
      "attribution": "Lisa M., Pharma QA Manager",
      "metric": "Average 35% reduction in validation cycle time"
    },
    "value_propositions": [
      "Systematic Validation Templates - Prevent common delays and reduce rework",
      "Early-Warning Metrics - Catch issues before they compound into bigger problems",
      "Stakeholder Communication Framework - Keep everyone aligned and informed",
      "Predictive Analytics Tools - Anticipate bottlenecks and optimize resource allocation",
      "Continuous Improvement Playbook - Turn every validation into a learning opportunity"
    ],
    "objection_handling": {
      "complexity": "Our templates integrate with existing systems. No major process overhauls required.",
      "adoption": "Proven change management approach ensures team buy-in and smooth implementation.",
      "roi": "$297/month investment typically saves 10-15 hours/week, paying for itself many times over."
    },
    "social_proof_section": {
      "headline": "Join 300+ Validation Experts Optimizing Their Processes",
      "testimonials": [
        "35% faster cycles with better quality. The systematic approach works. - David R.",
        "Finally got our validation backlogs under control. Team morale is way up. - Jennifer S.",
        "The predictive analytics saved us from three major delays last quarter. - Mark K."
      ]
    }
  },
  "compliance_architect_membership": {
    "hero_headline": "Architect Compliance Systems That Drive Strategic Business Value",
    "subheadline": "The enterprise framework for positioning compliance as a competitive advantage and board-level asset",
    "hero_cta": "Model Your Strategic ROI",
    "proof_above_fold": {
      "testimonial": "Presented our compliance ROI to the board and got approval for a $2M expansion. ComplianceWorxs framework was key.",
      "attribution": "Robert H., Chief Compliance Officer",
      "metric": "Average enterprise value creation: $500K+ annually"
    },
    "value_propositions": [
      "Strategic Compliance Framework - Position compliance as competitive advantage",
      "Board-Level Reporting Templates - Communicate value in business language",
      "Enterprise Risk Quantification - Turn compliance into measurable business value",
      "Executive Stakeholder Management - Build strategic relationships across the organization",
      "Compliance Architecture Blueprints - Design systems that scale with business growth"
    ],
    "objection_handling": {
      "complexity": "White-glove implementation with dedicated enterprise specialist ensures smooth deployment.",
      "budget": "$497/month is typically 0.1% of the value created through strategic compliance positioning.",
      "stakeholder_buy_in": "Our board presentation templates have helped dozens of CCOs secure strategic mandates."
    },
    "social_proof_section": {
      "headline": "Join 150+ Compliance Architects Driving Enterprise Value",
      "testimonials": [
        "Transformed compliance from cost center to profit driver. Board sees us as strategic now. - Maria L.",
        "The enterprise framework helped us quantify $1.2M in risk mitigation value. - Thomas R.",
        "Finally have the tools to communicate compliance value at the C-level. - Angela K."
      ]
    }
  }
};

// Message Map - Ensures no dead-end content
export const MESSAGE_MAP = {
  "content_paths": {
    "awareness_stage": {
      "entry_points": ["ELSA Playbooks", "SEO Content", "Social Media", "Referrals"],
      "primary_objective": "Education and problem awareness",
      "next_action": "Take Diagnostic Quiz",
      "exit_prevention": ["Multiple CTA placements", "Quiz preview", "Value proposition reinforcement"]
    },
    "consideration_stage": {
      "entry_points": ["Diagnostic Quiz", "ROI Calculator", "Email sequences"],
      "primary_objective": "Value quantification and trust building",
      "next_action": "See Membership Recommendations",
      "exit_prevention": ["Personalized results", "Social proof", "Risk reversal"]
    },
    "decision_stage": {
      "entry_points": ["Membership Calculator", "Tier Landing Pages", "Sales emails"],
      "primary_objective": "Purchase decision and conversion",
      "next_action": "Complete membership purchase",
      "exit_prevention": ["Objection handling", "Guarantees", "Scarcity elements"]
    },
    "onboarding_stage": {
      "entry_points": ["Post-purchase emails", "Member dashboard", "Welcome sequence"],
      "primary_objective": "Value realization and retention",
      "next_action": "Complete initial setup and first wins",
      "exit_prevention": ["Quick wins", "Success milestones", "Community engagement"]
    }
  },
  "dead_end_prevention": {
    "quiz_abandonment": {
      "trigger": "User starts but doesn't complete quiz",
      "intervention": "Email sequence with quiz benefits and social proof",
      "cta": "Complete your compliance assessment in 2 minutes"
    },
    "roi_calculation_drop_off": {
      "trigger": "User views ROI calculator but doesn't engage",
      "intervention": "Persona-specific value demonstration",
      "cta": "See your potential ROI in 60 seconds"
    },
    "membership_consideration_stall": {
      "trigger": "User views membership page but doesn't purchase within 48 hours",
      "intervention": "Objection handling email sequence with testimonials",
      "cta": "Join [persona] members seeing real results"
    }
  }
};

// Brand Consistency Guidelines
export const BRAND_MESSAGING_GUIDELINES = {
  "voice_and_tone": {
    "voice_attributes": ["Credible", "Empathetic", "Strategic", "Practical"],
    "tone_modifiers": {
      "recognition_focused": "Encouraging and empowering",
      "efficiency_focused": "Systematic and results-oriented", 
      "strategic_focused": "Executive and visionary"
    }
  },
  "credibility_elements": {
    "industry_references": ["Veeva", "Gartner", "21 CFR Part 11", "ICH Guidelines"],
    "proof_points": ["FDA audit readiness", "Validation cycle compression", "Risk mitigation ROI"],
    "authority_builders": ["Regulatory expertise", "Industry benchmarks", "Best practice frameworks"]
  },
  "empathy_elements": {
    "pain_point_acknowledgment": ["Unrecognized expertise", "Process inefficiencies", "Regulatory complexity"],
    "peer_to_peer_language": ["We understand", "You're not alone", "Other professionals like you"],
    "before_after_framing": ["From invisible to strategic", "From reactive to proactive", "From cost center to value driver"]
  }
};

export class CMOMessagingService {
  
  async getPersonaCTA(asset: string, persona: string): Promise<any> {
    const ctaData = CTA_MATRIX[asset as keyof typeof CTA_MATRIX];
    if (!ctaData) {
      throw new Error(`Unknown asset: ${asset}`);
    }
    
    const personaCTA = ctaData[persona as keyof typeof ctaData];
    if (!personaCTA) {
      throw new Error(`Unknown persona: ${persona} for asset: ${asset}`);
    }
    
    return {
      asset,
      persona,
      ...personaCTA,
      generated_at: new Date().toISOString()
    };
  }
  
  async getLandingPageContent(persona: string): Promise<any> {
    const landingPageKey = `${persona}_membership` as keyof typeof LANDING_PAGE_REWRITES;
    const content = LANDING_PAGE_REWRITES[landingPageKey];
    
    if (!content) {
      throw new Error(`Unknown persona for landing page: ${persona}`);
    }
    
    return {
      persona,
      ...content,
      generated_at: new Date().toISOString()
    };
  }
  
  async getMessagePath(stage: string): Promise<any> {
    const pathData = MESSAGE_MAP.content_paths[stage as keyof typeof MESSAGE_MAP.content_paths];
    if (!pathData) {
      throw new Error(`Unknown content stage: ${stage}`);
    }
    
    return {
      stage,
      ...pathData,
      dead_end_prevention: MESSAGE_MAP.dead_end_prevention,
      generated_at: new Date().toISOString()
    };
  }
  
  async validateMessageConsistency(content: any): Promise<any> {
    const guidelines = BRAND_MESSAGING_GUIDELINES;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check for credibility elements
    const hasCredibilityElements = guidelines.credibility_elements.industry_references.some(ref => 
      JSON.stringify(content).toLowerCase().includes(ref.toLowerCase())
    );
    
    if (!hasCredibilityElements) {
      issues.push("Missing industry credibility references");
      recommendations.push("Add references to Veeva, Gartner, or regulatory standards");
    }
    
    // Check for empathy elements
    const hasEmpathyElements = guidelines.empathy_elements.pain_point_acknowledgment.some(pain => 
      JSON.stringify(content).toLowerCase().includes(pain.toLowerCase())
    );
    
    if (!hasEmpathyElements) {
      issues.push("Missing empathy and pain point acknowledgment");
      recommendations.push("Include peer-to-peer language and problem recognition");
    }
    
    return {
      content_valid: issues.length === 0,
      issues,
      recommendations,
      consistency_score: Math.max(0, 100 - (issues.length * 20)),
      generated_at: new Date().toISOString()
    };
  }
  
  async generatePersonalizedMessage(persona: string, stage: string, context: any = {}): Promise<any> {
    const ctaMatrix = CTA_MATRIX[stage as keyof typeof CTA_MATRIX];
    const guidelines = BRAND_MESSAGING_GUIDELINES;
    
    if (!ctaMatrix) {
      throw new Error(`Unknown stage: ${stage}`);
    }
    
    const personaData = ctaMatrix[persona as keyof typeof ctaMatrix];
    if (!personaData) {
      throw new Error(`Unknown persona: ${persona} for stage: ${stage}`);
    }
    
    // Generate personalized message based on context
    let personalizedMessage = personaData.messaging;
    
    // Replace context variables
    if (context.roi_value) {
      personalizedMessage = personalizedMessage.replace('$*|ROI_VAL|*', `$${context.roi_value.toLocaleString()}`);
    }
    
    return {
      persona,
      stage,
      message: personalizedMessage,
      primary_cta: personaData.primary_cta,
      secondary_cta: personaData.secondary_cta,
      utm_campaign: personaData.utm_campaign,
      proof_elements: personaData.proof_elements || [],
      social_proof: personaData.social_proof || "",
      generated_at: new Date().toISOString()
    };
  }
}