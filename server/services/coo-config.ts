// Production COO Automation Configuration - JSON Specification Package
export const COO_AUTOMATION_CONFIG = {
  "coo_automation_checklist_v1": {
    "objective": "Implement and verify seamless automations from ELSA → Quiz → ROI Calculator → Membership Calculator → Membership Purchase → AI Agent Upsell using Mailchimp + site tracking.",
    "systems": ["Mailchimp", "Website", "Google Tag Manager", "CRO Dashboard"],
    "personas": ["Rising Leader", "Validation Strategist", "Compliance Architect"],
    "mailchimp": {
      "tags": ["Rising Leader", "Validation Strategist", "Compliance Architect"],
      "journeys": {
        "roi_persona_journeys": {
          "Rising Leader": "ROI_RisingLeader_Journey",
          "Validation Strategist": "ROI_ValidationStrategist_Journey", 
          "Compliance Architect": "ROI_ComplianceArchitect_Journey"
        },
        "membership_offer_flows": {
          "Rising Leader": "Offer_RisingLeader_Flow",
          "Validation Strategist": "Offer_ValidationStrategist_Flow",
          "Compliance Architect": "Offer_ComplianceArchitect_Flow"
        },
        "welcome_flows": {
          "Rising Leader": "Welcome_RisingLeader",
          "Validation Strategist": "Welcome_ValidationStrategist",
          "Compliance Architect": "Welcome_ComplianceArchitect"
        },
        "agent_upsell_flow": "Agent_Upsell_Flow_AllTiers"
      },
      "events_expected": [
        "QuizCompleted",
        "ROICalculated", 
        "MembershipRecommended",
        "MembershipPurchased"
      ]
    },
    "event_schema": {
      "QuizCompleted": {
        "required_properties": ["persona", "quiz_id", "timestamp", "source"],
        "optional_properties": ["score", "utm_campaign", "utm_source", "utm_medium"]
      },
      "ROICalculated": {
        "required_properties": ["persona", "roi_value", "currency", "calc_version", "timestamp"],
        "optional_properties": ["assumptions_hash", "utm_campaign", "utm_source", "utm_medium"]
      },
      "MembershipRecommended": {
        "required_properties": ["persona", "recommended_tier", "roi_value", "timestamp"],
        "optional_properties": ["confidence_score", "utm_campaign", "utm_source", "utm_medium"]
      },
      "MembershipPurchased": {
        "required_properties": ["persona", "tier", "amount", "currency", "timestamp", "transaction_id"],
        "optional_properties": ["coupon", "utm_campaign", "utm_source", "utm_medium"]
      }
    },
    "gtm_datalayer_contract": {
      "push_format": {
        "event": "string",
        "persona": "string", 
        "timestamp": "ISO8601",
        "properties": "object"
      },
      "examples": [
        {
          "event": "QuizCompleted",
          "persona": "Validation Strategist",
          "timestamp": "2025-09-09T14:32:10Z",
          "properties": { "quiz_id": "cw_quiz_v2", "source": "LinkedIn", "score": 8 }
        },
        {
          "event": "ROICalculated", 
          "persona": "Compliance Architect",
          "timestamp": "2025-09-09T14:35:02Z",
          "properties": { "roi_value": 155000, "currency": "USD", "calc_version": "roi_v1_7" }
        }
      ]
    },
    "url_and_utm_standards": {
      "landing_pages": {
        "Rising Leader": "/membership/rising-leader",
        "Validation Strategist": "/membership/validation-strategist", 
        "Compliance Architect": "/membership/compliance-architect"
      },
      "utm_required": ["utm_source", "utm_medium", "utm_campaign"],
      "utm_examples": [
        "?utm_source=linkedin&utm_medium=post&utm_campaign=elsa_to_quiz",
        "?utm_source=site&utm_medium=calculator&utm_campaign=roi_to_membership"
      ]
    },
    "verification_steps": [
      "Create test subscribers for each persona via quiz completion; confirm Mailchimp tag assignment.",
      "Trigger ROICalculated for each persona; verify entry into correct ROI Persona Journey.",
      "Trigger MembershipRecommended; verify correct tier Offer Flow linkage.",
      "Simulate MembershipPurchased; verify Welcome Flow and Agent Upsell Flow enrollment.",
      "Cross-check GTM debug view for all events and properties; confirm ingestion in CRO Dashboard."
    ],
    "monitoring_and_qc": {
      "weekly_e2e_tests": ["Rising Leader", "Validation Strategist", "Compliance Architect"],
      "logs_to_review": ["Mailchimp Journey Activity", "GTM Preview/Debug", "CRO Dashboard Events"],
      "report_output": "Automations_Status_Report.json"
    },
    "sla_thresholds": {
      "tagging_accuracy_pct": 99.0,
      "event_fire_rate_pct": 98.0,
      "journey_entry_success_pct": 97.0,
      "time_to_email_trigger_sec": 120
    },
    "alerting": {
      "conditions": [
        { "metric": "tagging_accuracy_pct", "operator": "<", "value": 99.0, "severity": "high" },
        { "metric": "event_fire_rate_pct", "operator": "<", "value": 98.0, "severity": "high" },
        { "metric": "journey_entry_success_pct", "operator": "<", "value": 97.0, "severity": "high" },
        { "metric": "time_to_email_trigger_sec", "operator": ">", "value": 120, "severity": "medium" }
      ],
      "action": "Notify CEO Agent (SCI) + CMO/CRO with incident summary and remediation checklist."
    },
    "rollback_plan": {
      "triggers": ["spike in drop-offs > 20% at any stage", "journey misrouting", "duplicate sends"],
      "actions": [
        "Pause affected Mailchimp journey(s).",
        "Revert to last known-good journey version (timestamped backup).",
        "Disable new GTM tags firing; restore previous container version.",
        "Run E2E test on staging; re-enable production gradually with canary (10% traffic) for 2 hours."
      ],
      "owner": "COO Agent"
    }
  }
};

// QA Test Matrix from specification
export const QA_TEST_MATRIX = [
  {
    persona: "Rising Leader",
    abbreviation: "RL", 
    path: "Quiz → ROI → Membership Rec → Purchase",
    expected_tag: "Rising Leader",
    journey_entered: "ROI_RisingLeader_Journey",
    next_lp: "/membership/rising-leader",
    events_fired: ["QuizCompleted", "ROICalculated", "MembershipRecommended", "MembershipPurchased"]
  },
  {
    persona: "Validation Strategist",
    abbreviation: "VS",
    path: "Quiz → ROI → Membership Rec → Purchase", 
    expected_tag: "Validation Strategist",
    journey_entered: "ROI_ValidationStrategist_Journey",
    next_lp: "/membership/validation-strategist",
    events_fired: ["QuizCompleted", "ROICalculated", "MembershipRecommended", "MembershipPurchased"]
  },
  {
    persona: "Compliance Architect", 
    abbreviation: "CA",
    path: "Quiz → ROI → Membership Rec → Purchase",
    expected_tag: "Compliance Architect",
    journey_entered: "ROI_ComplianceArchitect_Journey", 
    next_lp: "/membership/compliance-architect",
    events_fired: ["QuizCompleted", "ROICalculated", "MembershipRecommended", "MembershipPurchased"]
  }
];

// Mailchimp merge fields specification
export const MAILCHIMP_MERGE_FIELDS = {
  "PERSONA": "text", // RL / VS / CA
  "ROI_VAL": "number", // latest ROI $
  "TIER_REC": "text", // RL / VS / CA  
  "SRC": "text", // source
  "TXN_ID": "text" // purchase transaction id
};

// Done = Verified checklist
export const VERIFICATION_CHECKLIST = [
  "All 3 persona tags exist in Mailchimp",
  "Quiz → tag applied (3/3 test users)",
  "ROICalculated → correct persona journey (3/3)",
  "MembershipRecommended → correct tier LP (3/3)",
  "MembershipPurchased → welcome + upsell sent (3/3)",
  "GTM events visible w/ required properties (4/4)",
  "CRO dashboard receiving events (4/4)",
  "SLA thresholds met for last 7 days",
  "Rollback backups timestamped (Mailchimp + GTM)"
];

export interface EventValidationResult {
  isValid: boolean;
  missingRequired: string[];
  invalidFields: string[];
  validOptional: string[];
}

export class COOConfigService {
  
  static validateEvent(eventName: string, eventData: any): EventValidationResult {
    const config = COO_AUTOMATION_CONFIG.coo_automation_checklist_v1;
    const schema = config.event_schema[eventName as keyof typeof config.event_schema];
    
    if (!schema) {
      return {
        isValid: false,
        missingRequired: [],
        invalidFields: [`Unknown event type: ${eventName}`],
        validOptional: []
      };
    }
    
    const missingRequired: string[] = [];
    const invalidFields: string[] = [];
    const validOptional: string[] = [];
    
    // Check required properties
    for (const required of schema.required_properties) {
      if (!(required in eventData)) {
        missingRequired.push(required);
      }
    }
    
    // Validate optional properties if present
    for (const optional of schema.optional_properties) {
      if (optional in eventData) {
        validOptional.push(optional);
      }
    }
    
    return {
      isValid: missingRequired.length === 0 && invalidFields.length === 0,
      missingRequired,
      invalidFields,
      validOptional
    };
  }
  
  static getSLAThresholds() {
    return COO_AUTOMATION_CONFIG.coo_automation_checklist_v1.sla_thresholds;
  }
  
  static getAlertingConfig() {
    return COO_AUTOMATION_CONFIG.coo_automation_checklist_v1.alerting;
  }
  
  static getRollbackPlan() {
    return COO_AUTOMATION_CONFIG.coo_automation_checklist_v1.rollback_plan;
  }
  
  static getPersonas() {
    return COO_AUTOMATION_CONFIG.coo_automation_checklist_v1.personas;
  }
  
  static getExpectedEvents() {
    return COO_AUTOMATION_CONFIG.coo_automation_checklist_v1.mailchimp.events_expected;
  }
}