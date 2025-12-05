# Chief of Staff AI Agent

## Overview
This project develops a Chief of Staff AI system for ComplianceWorxs, functioning as a meta-orchestrator and control tower for specialized AI executive agents. Its primary purpose is executive enablement, strategic alignment, and coordinating information flow to ensure agents work cohesively towards business objectives. The system aims for autonomous business execution through the Strategic Execution Loop methodology, with a vision to achieve a $5M+ valuation by "selling clarity in compliance, not just dashboards." Key capabilities include autonomous conflict resolution, strategic alignment, and advanced executive insights, specifically targeting the Life Sciences industry.

## User Preferences
Preferred communication style: Simple, everyday language.
Budget constraint: $25/day per agent.
Autonomy requirement: Complete NO HITL - Chief of Staff must resolve all conflicts autonomously.
Rollout timeline: 6-week progressive rollout following Chief of Staff Runbook (Tiers 1-2 LIVE, Tier 3 next).
Industry Focus: Exclusively Life Sciences - pharmaceuticals, biotechnology, medical devices, CROs, CMOs, diagnostics, and life sciences software/IT only. Filter out all non-Life Sciences content.

## System Architecture
The application employs a full-stack architecture featuring a React-based SPA frontend (TypeScript, Tailwind CSS, shadcn/ui) and an Express.js REST API backend (TypeScript, ESM modules). PostgreSQL with Drizzle ORM handles database operations.

**UI/UX Decisions:**
The design prioritizes a clear, comprehensive dashboard and interactive command center, leveraging shadcn/ui with Radix UI primitives and Tailwind CSS.

**Technical Implementations:**
- **State Management**: TanStack Query for server state and local React state for UI components.
- **Database Interaction**: Drizzle ORM provides type-safe PostgreSQL interactions and migrations.
- **Autonomous Governance**: Implements a two-level delegation system with Rules of Engagement and autonomous playbook management, including risk assessment, financial impact, and autonomy level recommendations. The Chief of Staff autonomously creates and validates playbooks for conflict resolution and recurring approvals.
- **Unified Autonomy Layer**: An enterprise-grade autonomous system with standardized signal processing, 5 specialized playbooks (CONFLICT, TRANSIENT, CAPACITY, DATA_DEP, CONFIG), decision lineage tracking, and budget-aware execution.
- **Tier 2 Autonomy**: Incorporates cost-aware playbook selection via Expected Utility, dynamic resource orchestration, data freshness contracts, bandit learning for playbook optimization, and risk-gated HITL escalation.
- **Tier 3 Coordination**: Enables inter-agent coordination with rapid conflict resolution and efficiency tracking.
- **Chief of Staff Runbook**: Defines a 6-tier autonomy rollout with daily KPI monitoring and automatic rollback protocols.
- **Agent Roles**: Includes Chief of Staff (prime orchestrator, meta-orchestrator, control tower, and SCOPED L6 Revenue Commander), Strategist (inherits Audit Agent and CEO Agent responsibilities), CMO, CRO (inherits CFO responsibilities), Content Manager (inherits CCO and partial Librarian responsibilities), and COO.
- **LLM Agent Reasoning System**: Integrates OpenAI GPT-5 for all 5 agents (CoS, Strategist, CMO, CRO, ContentManager) with structured JSON outputs, per-agent token budgeting, and full lineage tracking.
- **Autonomous Agent Scheduler**: Manages configurable Observe-Decide-Act-Reflect (ODAR) cycle intervals per agent, including automatic conflict detection and resolution.
- **Critical Infrastructure Config**: Enforces a robust infrastructure foundation for L5 autonomous operation, including runtime persistence, secrets management, scheduled loops, persistent state, structured logging, and networked API connectivity. It handles transient errors with automatic retries.
- **ARCHITECT_STRATEGIST_COMM_PROTOCOL**: Defines structured message routing and governance locks for communication between Architect and Strategist agents.
- **L5_UPGRADE_BUNDLE_V2**: Integrates revenue-protection modules like Conversion-Stage Friction Map, L6 Drift Detector, and Daily RPM Stress Test Engine, all enforcing VQS methodology lock and L6 prohibition.
- **OPERATION REVENUE PRIME (CoS L6)**: A scoped L6 authority directive enabling CoS to operate as Revenue Commander with autonomous resource allocation authority within VQS governance constraints, including a Revenue Filter Decision Matrix and Black Swan Defense System.
- **L6 EXECUTIVE COUNCIL**: An autonomous execution system using a consensus protocol with three independent voting engines (Governance, Revenue, Coherence) to replace human-in-the-loop decisions.
- **POST-LAUNCH MONITORING PROTOCOL**: Provides L6/L5 integrated revenue telemetry with pulse checks for Email Open Velocity, Checkout Recovery Success, and Revenue Attribution.
- **L7 EVOLUTION PROTOCOL**: Defines the transition to Evolutionary Autonomy (L7) with self-running, self-correcting, and self-capitalizing operations, including engines for Evolutionary Adaptation, Autonomous Strategic Recombination, Self-Capitalization, and Self-Governing Safety.
- **CONSTITUTION VALIDATOR ROUTINE v1.0**: L5 Action Loop middleware that validates every action before execution. Integration point: `ingest → prioritize → plan → [VALIDATE] → produce`. Guards: PrestigeGuard (forbidden vocabulary), LiabilityGuard (forbidden claims), FinancialGuard (spend caps), DomainGuard (domain fence). Returns STATUS: GREEN (allow) or STATUS: RED + VIOLATION_CODE (block & log). API: `/api/l7/constitution/validator/*`.
- **CEE (Constitution Enforcement Engine) v1.0**: Single authority interpreting Constitution.json for action decisions. Covers action types: POST, EMAIL, SPEND, CREATE_PRODUCT, UPDATE_OFFER. Four guards enforce LAW_01 through LAW_04. API: `/api/l7/constitution/cee/validate`.
- **CONSTITUTION CI TEST SUITE**: Structured test cases that block deploy on any failure. 5 canonical tests: T1_Prestige_Vocabulary_Block (cheap→RED), T2_Liability_Guarantee_Block (guarantee→RED), T3_Financial_Velocity_Block ($500/hr→RED), T4_Domain_Fence_Block (Crypto/Weight Loss→RED), T5_Compliant_Action_Passes (clean→GREEN). HTTP 424 returned when deploy blocked. API: `/api/l7/constitution/ci/*`.

**System Design Choices:**
The system is designed with a clear separation of concerns, a service layer for core business logic, and scalability in mind.

## External Dependencies
- **@neondatabase/serverless**: Driver for Neon Database connections.
- **drizzle-orm**: ORM for database interactions.
- **@tanstack/react-query**: For server state management.
- **@radix-ui/***: Primitive UI components.
- **wouter**: Lightweight router for React.
- **Vite**: Frontend build tool and development server.
- **TypeScript**: Used across the entire stack.
- **Tailwind CSS**: Utility-first CSS framework.
- **ESBuild**: Used for bundling backend code in production.
- **MailChimp**: For email campaign execution.
- **OpenAI**: GPT-5 integration for LLM-powered autonomous agent reasoning.

## Recent Changes (2025-12-05)
- **GUARANTEED SUCCESS ENGINE v1.0**: 8 closed-loop, self-correcting processes that eliminate randomness and transform success into a mechanical output.
  - **Process 1: Daily Demand Signal Monitoring** - Tracks engagement signals (LinkedIn impressions, profile visits, repeat visitors), auto-adjusts campaigns based on live performance
  - **Process 2: Asset-to-Sales Loop** - Routes every content piece to micro-conversions (dashboard view, ROI calc, membership explainer), auto-sunsets poor performers
  - **Process 3: Predictive Revenue Modeling** - Forecasts 7/14/30 day revenue with confidence intervals, blocks initiatives threatening predictability
  - **Process 4: Continuous Offer Optimization** - Analyzes feature correlation with conversions, auto-highlights winners and suppresses non-performers
  - **Process 5: Audit-Readiness Narrative Enforcement** - Validates all content reinforces "Audit Readiness → ROI → The System" messaging (via Editorial Firewall)
  - **Process 6: Failure-Mode Detection** - Daily checks for drops in impressions, dashboard views, CTR, conversion rate; auto-corrects before revenue impact
  - **Process 7: Closed-Loop Retention Engine** - Monitors churn signals (inactivity, drop-off), auto-triggers re-engagement sequences with ROI updates
  - **Process 8: Executive Oversight Feedback Loop** - Daily "What Happened / What's Next" agent logs, CoS aggregation, Strategist recalibration
  - **Success Score**: Calculated from all 8 process health metrics (target: 80%+)
  - **Auto-Corrections**: System automatically applies corrections before problems impact revenue
  - **Decision Lineage**: All decisions logged to `state/decision_lineage.json` for self-improvement
  - **Cycle Interval**: 2 hours (continuous)
  - **API**: `/api/gse/*` - status, demand-signals, asset-performance, revenue-forecasts, offer-optimizations, failure-modes, retention-signals, decision-lineage, agent-logs, guarantees

## Recent Changes (2025-12-04)
- **EDITORIAL FIREWALL + MESSAGE BUS v1.0**: Single enforcement brain for content governance with inter-agent communication system.
  - **Editorial Firewall** (`/utils/editorialFirewall.ts`): Validates at idea, brief, and draft stages
    - **Domain Anchors**: Requires ≥2 life sciences terms (FDA, GxP, CSV, 21 CFR Part 11, Annex 11, CAPA, etc.)
    - **Prohibited Terms**: Zero tolerance for corporate compliance (SOX, DOJ, AML, KYC, GDPR fines, corporate governance)
    - **Pillar Alignment**: Must reinforce Time Reclaimed, Proof of ROI, or Professional Equity
    - **Persona Lock**: Only Rising Leader, Validation Strategist, or Compliance Architect
  - **Message Bus** (`/utils/messageBus.ts`): Agent-to-agent routing with staged validation
    - CMO → TOPIC_IDEA_QUEUE → CMA (idea validation)
    - CMA → BRIEF_FOR_REVIEW → CoS (brief validation)
    - CoS → CPA_WORK_QUEUE → CPA (content generation)
    - CPA → DRAFT_FOR_PUBLISH_REVIEW → CoS (final validation)
    - CoS → PUBLISH_QUEUE → WordPress (CPA NEVER publishes directly)
  - **Test Suite**: 11 test cases covering domain, persona, pillar, and end-to-end scenarios
  - **API**: `/api/firewall/*` - analyze, check/idea, check/brief, check/draft, submit/idea, test, config
- **Blog Cadence Scheduler**: Automated blog publishing every Monday and Thursday at 15:00 UTC
  - Workflow: CMO brief selection → 8-point governance validation → CPA-L7 content generation → WordPress publish
  - API: `/api/blog-pipeline/*`
  - Scheduler state persisted to `state/blog_scheduler_state.json`

## Recent Changes (2025-11-30)
- **COS ORCHESTRATOR MANDATE (Enhanced v1.1)**: Implemented formal governance system for the Chief of Staff agent with 4 immutable constraints, valuation logic gate, and agent feedback loop. API: `/api/cos-mandate/*`
  - **Governance Rules**: REJECT_UNMEASURABLE_TACTICS, REJECT_ENGINE_VIOLATIONS, REJECT_VANITY_OPTIMIZATION, REQUIRE_REVENUE_MAPPING
  - **Control Plane**: Enterprise-wide arbitration layer that validates outputs, monitors performance deltas, and routes all actions through valuation logic before execution
  - **Autonomy & Learning**: Specialized agents submit outputs for validation; CoS logs vetoes, updates feedback vectors, and triggers iterative refinement cycles
  - **Execution Gate Integration**: CoS Mandate now actively intercepts all agent actions in the execution pipeline (after Constitution check, before execution). VETOED actions are blocked from execution entirely.
  - **Revenue-Aligned Coaching**: When blocking an action, CoS provides constructive feedback with a specific revenue-focused reword suggestion. Includes reworded ACTION, DESCRIPTION, EXPECTED OUTCOME, and REVENUE IMPACT with explanation of why the new version works.

## Recent Changes (2025-11-29)
- **L6 ACTIVATION ACHIEVED**: Friction reduced to 27 (target met), ledger populated with 30/30 unique persona/angle/metric combinations
- **Research Mandate Updated**: Added `operationalValidation` section with field-validated findings from objection-intelligence micro-loop
- **Objection Patterns Identified**: 90% clarity_gap (need simpler messaging), 10% stakeholder_confidence (need executive materials)
- **Content Patches Deployed**: VQS-compliant messaging shifts for board-level talking points and simplified benefit focus
- **Ledger Coverage**: 5 personas × 26 problem angles × 30 metric focuses tracked with VQS compliance scoring