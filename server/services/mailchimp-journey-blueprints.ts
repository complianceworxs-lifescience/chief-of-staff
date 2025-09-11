// Mailchimp Customer Journey Blueprints - Ready-to-Build Implementation
// Production specifications for COO Agent operational automation pipeline

export const MAILCHIMP_SETUP = {
  "merge_fields": {
    "PERSONA": "text", // RL/VS/CA
    "ROI_VAL": "number",
    "TIER_REC": "text", // RL/VS/CA
    "SRC": "text",
    "TXN_ID": "text"
  },
  "tags": [
    "Rising Leader",
    "Validation Strategist", 
    "Compliance Architect",
    "ROI_Engaged",
    "MC_Recommended",
    "Member"
  ],
  "custom_events": [
    "QuizCompleted",
    "ROICalculated", 
    "MembershipRecommended",
    "MembershipPurchased"
  ],
  "suppression_rules": {
    "member_tag_suppression": "Contacts with tag Member skip all pre-purchase journeys",
    "persona_matching": "Each persona journey only accepts contacts with matching PERSONA",
    "reentry": "Allow re-entry every 30 days unless tag Member present"
  },
  "link_targets": {
    "membership_calculator": "/membership-calculator?utm_source=mailchimp&utm_medium=email&utm_campaign=roi_to_membership",
    "rising_leader_lp": "/membership/rising-leader?utm_source=mc&utm_medium=email&utm_campaign=offer_rl",
    "validation_strategist_lp": "/membership/validation-strategist?utm_source=mc&utm_medium=email&utm_campaign=offer_vs",
    "compliance_architect_lp": "/membership/compliance-architect?utm_source=mc&utm_medium=email&utm_campaign=offer_ca"
  }
};

export const JOURNEY_BLUEPRINTS = {
  "ROI_RisingLeader_Journey": {
    "starting_point": {
      "event_trigger": "ROICalculated where persona == RL",
      "entry_actions": [
        "Update Merge → PERSONA = RL, ROI_VAL = {{roi_value}}",
        "Add Tag → ROI_Engaged"
      ]
    },
    "nodes": {
      "node_a": {
        "type": "email",
        "name": "Make Your Impact Visible",
        "subject": "Your compliance ROI: turn numbers into recognition",
        "body_angle": "You've got the ROI. Here's how to use it for visibility and promotion.",
        "primary_cta": "Membership Calculator",
        "delay": "2 days"
      },
      "node_b": {
        "type": "conditional",
        "name": "If Clicked MC?",
        "rule": "If user clicked Membership Calculator link in Email #1",
        "yes_path": "Node C",
        "no_path": "Node B2"
      },
      "node_b2": {
        "type": "email",
        "name": "Nudge Email",
        "subject": "Still thinking? Convert your ROI into a concrete plan",
        "cta": "Membership Calculator",
        "delay": "2 days → then to Node C"
      },
      "node_c": {
        "type": "goal_wait",
        "name": "Wait for MembershipRecommended",
        "wait_for": "MembershipRecommended (persona=RL)",
        "timeout": "5 days",
        "on_goal_hit": "Node D",
        "on_timeout": "Node C2"
      },
      "node_c2": {
        "type": "email",
        "name": "Fallback",
        "subject": "What's the fastest way to capture your ROI?",
        "cta": "Membership Calculator",
        "delay": "2 days → back to Goal wait (2 more days)"
      },
      "node_d": {
        "type": "offer",
        "name": "Offer Path (Tier RL)",
        "actions": ["Update Merge → TIER_REC = RL"],
        "email": {
          "subject": "Rising Leader Plan: unlock visibility + momentum",
          "body": "bullet benefits; recognition-first framing",
          "cta": "Tier RL LP"
        },
        "delay": "3 days"
      },
      "node_e": {
        "type": "conditional",
        "name": "If Purchased?",
        "rule": "If MembershipPurchased (tier=RL) occurs within 7 days",
        "yes_path": "Exit & Handoff to Post-Purchase Journeys",
        "no_path": "Email #3a (Objection Handler)"
      }
    },
    "sla": "First email within 120 seconds of event trigger"
  },
  
  "ROI_ValidationStrategist_Journey": {
    "starting_point": {
      "event_trigger": "ROICalculated where persona == VS",
      "entry_actions": ["Update merge fields", "add ROI_Engaged tag"]
    },
    "nodes": {
      "node_a": {
        "type": "email",
        "name": "Cut Validation Time, Not Corners",
        "subject": "Your ROI shows time on the table — here's how to reclaim it",
        "angle": "time savings in validation; fewer deviations; cycle compression",
        "cta": "Membership Calculator",
        "delay": "2 days"
      },
      "node_b": {
        "type": "conditional",
        "name": "Click Split",
        "if_mc_clicked": "Node C",
        "else": "Email #1a (case example: How Strategists compress validation by 30–50%) → Delay 2 days → Node C"
      },
      "node_c": {
        "type": "goal_wait",
        "name": "Goal Wait: MembershipRecommended (VS)",
        "wait_time": "up to 5 days",
        "fallback": "Email #2 (See the plan that captures your ROI) → Delay 2 days → re-wait 2 days"
      },
      "node_d": {
        "type": "offer",
        "name": "Offer (Tier VS)",
        "actions": ["Update TIER_REC = VS"],
        "email": {
          "subject": "Validation Strategist Plan: faster cycles, fewer headaches",
          "cta": "Tier VS LP"
        },
        "delay": "3 days"
      },
      "node_e": {
        "type": "conditional",
        "name": "Purchase Split",
        "if_purchased": "MembershipPurchased (tier=VS) within 7 days → Exit to Post-Purchase",
        "else": "Email #3a (Proof pack: KPI gains + testimonial snippet) → Delay 4 days → End"
      }
    },
    "sla": "First email within 120 seconds of event trigger"
  },

  "ROI_ComplianceArchitect_Journey": {
    "starting_point": {
      "event_trigger": "ROICalculated where persona == CA",
      "entry_actions": ["Update merge", "tag ROI_Engaged"]
    },
    "nodes": {
      "node_a": {
        "type": "email", 
        "name": "Turn Compliance ROI into Board-Level Clarity",
        "subject": "Your projected ROI → the enterprise case",
        "angle": "audit readiness KPIs, risk reduction, enterprise ROI",
        "cta": "Membership Calculator",
        "delay": "2 days"
      },
      "node_b": {
        "type": "conditional",
        "name": "If MC Clicked?",
        "yes": "Node C",
        "no": "Email #1a: From ROI to strategy: the architecture of value (executive framing) → Delay 2 days → Node C"
      },
      "node_c": {
        "type": "goal_wait",
        "name": "Goal Wait: MembershipRecommended (CA)",
        "wait_time": "up to 5 days",
        "fallback": "Email #2 (Model the board case in 10 minutes) → Delay 2 days → re-wait 2 days"
      },
      "node_d": {
        "type": "offer",
        "name": "Offer (Tier CA)",
        "actions": ["Update TIER_REC = CA"],
        "email": {
          "subject": "Compliance Architect Plan: enterprise KPIs + audit-ready dashboards",
          "cta": "Tier CA LP"
        },
        "delay": "3 days"
      },
      "node_e": {
        "type": "conditional",
        "name": "If Purchased?",
        "yes": "tier=CA within 7 days → Exit to Post-Purchase",
        "no": "Email #3a (Executive objection handler: budget, timing, risk) → Delay 4 days → End"
      }
    },
    "sla": "First email within 120 seconds of event trigger"
  },

  "PostPurchase_AllTiers": {
    "starting_point": {
      "event_trigger": "MembershipPurchased (any tier; Member tag applied)"
    },
    "tier_specific_welcome": {
      "timing": "within 1 hour",
      "rising_leader": "Welcome_RisingLeader — Your first 3 wins this week",
      "validation_strategist": "Welcome_ValidationStrategist — Ship your first cycle-time win", 
      "compliance_architect": "Welcome_ComplianceArchitect — Instrument your KPIs + audit traceability"
    },
    "day_2_activation": {
      "email": "Activation Email",
      "checklist": "how to access dashboards, connect to the widget, where to find ELSA docs",
      "cta": "book a 10-min orientation (optional)"
    },
    "day_5_ai_agent_upsell": {
      "email": "Automate the next win with AI Agents",
      "segment_logic": {
        "rising_leader": "CMO/COO lite use cases (personal productivity, recognition)",
        "validation_strategist": "CCO/COO use cases (validation cycle compression)",
        "compliance_architect": "CEO/CRO use cases (KPI governance, audit readiness)"
      },
      "cta": "Agent Upsell page"
    },
    "suppressions": [
      "Suppress all pre-purchase journeys once Member tag exists",
      "Deduplicate if TXN_ID repeats"
    ]
  }
};

export const DYNAMIC_CONTENT_RULES = {
  "roi_value_thresholds": {
    "executive_case": "If ROI_VAL >= 100000: show Executive case block (CA emphasis)",
    "operational_efficiency": "If ROI_VAL 30000–99999: show Operational efficiency block (VS emphasis)", 
    "career_recognition": "If ROI_VAL < 30000: show Career recognition + quick wins block (RL emphasis)"
  },
  "personalization": {
    "headline_merge": "Your ROI: $*|ROI_VAL|* — here's how to capture it",
    "persona_bullets": "Include persona-specific bullets using IF PERSONA == RL/VS/CA"
  }
};

export const EMAIL_COPY_STARTERS = {
  "rising_leader": {
    "email_1": {
      "subject": "Your compliance ROI: turn numbers into recognition",
      "preheader": "Next step: make your wins visible",
      "cta": "Calculate your best-fit plan"
    },
    "offer_email": {
      "subject": "Rising Leader Plan: stand out with measurable wins"
    }
  },
  "validation_strategist": {
    "email_1": {
      "subject": "Your ROI shows time on the table",
      "preheader": "Let's compress your next validation cycle", 
      "cta": "See your fastest path"
    },
    "offer_email": {
      "subject": "Strategist Plan: deliver faster validation cycles"
    }
  },
  "compliance_architect": {
    "email_1": {
      "subject": "From ROI to board-level clarity",
      "preheader": "Model the enterprise case in minutes",
      "cta": "Build the plan"
    },
    "offer_email": {
      "subject": "Architect Plan: instrument KPIs + audit readiness"
    }
  }
};

export const IMPLEMENTATION_CHECKLIST = [
  "Create/verify merge fields and tags",
  "Create custom events (or confirm your collector sends them)",
  "Build the three persona journeys exactly as specified",
  "Build Post-Purchase journey",
  "Paste the email copy starters and set dynamic blocks by PERSONA and ROI_VAL",
  "Set goals, exit, re-entry, and suppression rules",
  "Run QA Matrix (3 test contacts → 3 persona paths)",
  "Flip to live with canary (10% audience for 2 hours), then 100%",
  "Report status in the Automations Status Report with pass/fail on each node"
];

export const ERROR_HANDLING_ROLLBACK = {
  "triggers": "If events stop appearing for 30+ minutes",
  "steps": [
    "Pause affected Journey(s)",
    "Switch GTM to prior container version", 
    "Re-run E2E tests for each persona with test contacts",
    "Re-enable with 10% canary for 2 hours; then full release"
  ]
};

// JSON Specification for Programmatic Journey Creation
export const JOURNEY_JSON_SPEC = {
  "journeys": [
    {
      "name": "ROI_RisingLeader_Journey",
      "start": { 
        "type": "event", 
        "event_name": "ROICalculated", 
        "condition": "persona == RL" 
      },
      "nodes": [
        { "type": "action.update_merge", "fields": { "PERSONA": "RL", "ROI_VAL": "{{roi_value}}" } },
        { "type": "action.add_tag", "value": "ROI_Engaged" },
        { "type": "action.send_email", "template": "RL_Email_1" },
        { "type": "delay", "duration_hours": 48 },
        { "type": "rule.link_clicked", "link": "membership_calculator_url", "yes_to": "goal_wait", "no_to": "nudge" },
        { "id": "nudge", "type": "action.send_email", "template": "RL_Email_1a" },
        { "type": "delay", "duration_hours": 48 },
        { "id": "goal_wait", "type": "goal.wait_for_event", "event_name": "MembershipRecommended", "timeout_hours": 120, "on_timeout_to": "fallback" },
        { "id": "fallback", "type": "action.send_email", "template": "RL_Email_2" },
        { "type": "delay", "duration_hours": 48 },
        { "type": "goal.wait_for_event", "event_name": "MembershipRecommended", "timeout_hours": 48 },
        { "type": "action.update_merge", "fields": { "TIER_REC": "RL" } },
        { "type": "action.send_email", "template": "RL_Offer_Email_3" },
        { "type": "delay", "duration_hours": 72 },
        { "type": "rule.event_occurs", "event_name": "MembershipPurchased", "condition": "tier == RL", "yes_to": "exit", "no_to": "objection" },
        { "id": "objection", "type": "action.send_email", "template": "RL_Email_3a" },
        { "type": "delay", "duration_hours": 96 },
        { "id": "exit", "type": "journey.end" }
      ],
      "reentry": { "allowed": true, "cooldown_days": 30 },
      "suppression": { "has_tag": "Member" }
    }
  ]
};

export interface MailchimpJourneyImplementor {
  setupMergeFields(): Promise<boolean>;
  createCustomEvents(): Promise<boolean>;
  buildPersonaJourneys(): Promise<boolean>;
  buildPostPurchaseJourney(): Promise<boolean>;
  setupDynamicContent(): Promise<boolean>;
  runQAMatrix(): Promise<boolean>;
  enableCanaryRelease(): Promise<boolean>;
  reportImplementationStatus(): Promise<any>;
}