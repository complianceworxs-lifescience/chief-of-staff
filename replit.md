# Chief of Staff AI Agent

## Overview
This project develops a Chief of Staff AI system for ComplianceWorxs, designed as a meta-orchestrator and control tower for specialized AI executive agents. The Chief of Staff AI serves as the executive enabler, focusing on strategic alignment and coordinating information flow to ensure agents work cohesively towards business objectives. The system aims for autonomous business execution through the Strategic Execution Loop methodology, with a vision to achieve a $5M+ valuation by "selling clarity in compliance, not just dashboards." Key capabilities include autonomous conflict resolution, strategic alignment, and advanced executive insights.

## User Preferences
Preferred communication style: Simple, everyday language.
Budget constraint: $25/day per agent.
Autonomy requirement: Complete NO HITL - Chief of Staff must resolve all conflicts autonomously.
Rollout timeline: 6-week progressive rollout following Chief of Staff Runbook (Tiers 1-2 LIVE, Tier 3 next).
Industry Focus: Exclusively Life Sciences - pharmaceuticals, biotechnology, medical devices, CROs, CMOs, diagnostics, and life sciences software/IT only. Filter out all non-Life Sciences content.

## System Architecture
The application uses a full-stack architecture with a React-based SPA frontend (TypeScript, Tailwind CSS, shadcn/ui) and an Express.js REST API backend (TypeScript, ESM modules). PostgreSQL with Drizzle ORM is used for the database.

**UI/UX Decisions:**
Prioritizes a clear, comprehensive dashboard and interactive command center using shadcn/ui with Radix UI primitives and Tailwind CSS.

**Technical Implementations:**
- **State Management**: TanStack Query for server state, local React state for UI.
- **Database Interaction**: Drizzle ORM for type-safe PostgreSQL interactions and migrations.
- **Autonomous Governance**: Two-level delegation system with Rules of Engagement and autonomous playbook management (Level 1: Manual Approval, Level 2: Auto with Notification, Level 3: Fully Autonomous). The Chief of Staff automatically creates and validates playbooks for conflicts and recurring approval patterns, integrating risk assessment, financial impact, and autonomy level recommendations.
- **Unified Autonomy Layer**: Enterprise-grade autonomous system with standardized signal processing, 5 specialized playbooks (CONFLICT, TRANSIENT, CAPACITY, DATA_DEP, CONFIG), decision lineage tracking, and budget-aware execution.
- **Tier 2 Autonomy**: Incorporates cost-aware playbook selection via Expected Utility, dynamic resource orchestration, data freshness contracts, bandit learning for playbook optimization, and risk-gated HITL escalation.
- **Tier 3 Coordination**: Enables inter-agent coordination with conflict half-life <10min, cooperation efficiency tracking, and a simulation harness.
- **Chief of Staff Runbook**: 6-tier autonomy rollout with daily KPI monitoring and automatic rollback protocols.
- **CoS DAILY MONITORING CHECKLIST v2.0**: Enhanced 4-Agent optimized checklist with PFL (Product Feedback Loop), CSI (Competitor Signal Intelligence), and SVDP (Strategic VQS Defense Plan), enforcing metrics like Feature Objection Rate, MTTD ≤72h, and Revenue Predictability ≥85%.
- **ROLE CASCADE DIRECTIVE**: Remaps 6 missing agent roles into 4 active Replit agents + Gemini Strategist for L5-complete coverage.
- **ADVANCED CAPABILITY PACK**: Activates three revenue-critical AI capabilities: Revenue Predictive Model, Autonomous Offer Optimization Engine, and Compliance Intelligence Reports.
- **L5 METRICS CONFIRMATION SYSTEM**: Tracks Revenue Predictability, ACV Expansion, and Friction Reduction for L6 transition readiness.
- **AGENT OPERATING CONTEXT v1.5**: Upgrades the system to L5 (Revenue Optimization Intelligence) with structural fixes: Unified Data Layer, Revenue Offer Ladder, Weekly Revenue Sprints, and Objection Intelligence Loop.
- **L5 Agent Health Monitor**: 2-hour autonomous ODAR (Observe-Decide-Act-Reflect) validation cycle monitoring UDL sync, agent activity, 8 drift indicators, and external signals. Auto-corrections include Blueprint mutation, Strategist updates, and Stakeholder Packet refresh.
- **L6 TRANSITION PACKAGE (A-D)**: Unified directive enabling controlled L6 experimentation while preserving L5 as the dominant live system. Includes L6 Sandbox Mode, CoS L6 Governance, Micro-Cohort Testing, and Methodology Lock (VQS Protection).
- **L6 TRANSITION READINESS FRAMEWORK**: Defines critical thresholds (Revenue Stability, RPM Stability, Objection Stability, Blueprint Performance, System Coherence) for L6 activation, emphasizing regulatory, reputation-sensitive, and audit-grade risk profiles. L6 activation is controlled by Methodology Lock, Micro-Cohort Cap, CoS Gatekeeper Approval, and Rollback Protocol.
- **LLM Agent Reasoning System**: Integrates OpenAI GPT-5 for all 5 agents (CoS, Strategist, CMO, CRO, ContentManager) with structured JSON outputs, per-agent token budgeting, cost-based accounting, graceful fallback, and decision logging with full lineage tracking.
- **Autonomous Agent Scheduler**: Configurable ODAR cycle intervals per agent with full Observe-Decide-Act-Reflect (ODAR) cycle using LLM reasoning, including automatic conflict detection and resolution via CoS.
- **L6 ACCELERATION PROTOCOL (7-DAY SPRINT)**: ARCHITECT OVERRIDE DIRECTIVE (BINDING). Activates accelerated L6 readiness sprint with 3 interventions: (1) CoS UDL sync every 30min targeting RPM ≥95%, (2) CMO 3x Benchmark Posts multiplier targeting revenue stability ≥4 weeks, (3) CRO 24h micro-offer backlog sprint. Constraints: L6 simulation allowed, L6 activation prohibited, VQS protected, no agent mutation. Daily Architect reports required.
- **7-DAY ARCHITECT OVERSIGHT MAP**: Structured daily monitoring and decision-making for L6 Acceleration Protocol. Tracks 6 metrics (revenue_stability_weeks, rpm_confidence, udl_freshness_minutes, benchmark_post_volume, micro_offer_backlog, drift_incidents_24h) with alert thresholds. Day-by-day focus areas guide the sprint. Safety guards enforce L6 prohibition, methodology lock, and 5% experiment cap. Architect decision space includes: no_action_required, minor_correction_to_cos, major_correction_request_to_strategist, freeze_specific_agent, reset_specific_metric_window. Day 7 renders verdict: IMPROVING or STALLED.
- **Critical Infrastructure Config v1.0**: Enterprise-grade infrastructure foundation for L5 autonomous operation. Enforces 6 non-negotiable components: (1) Runtime Persistence - 5 agents configured in always-on mode with state persistence across restarts, (2) Secrets Management - validates OPENAI_API_KEY and DATABASE_URL configuration, (3) Scheduled Loops - 5 validation tasks on 2-hour cycles (ODAR, UDL, RPM, Drift, AutoSummary), (4) Persistent State - 7 state files with schema validation (VQS_LOCK, POSITIONING_MATRIX, OFFER_LADDER, OBJECTION_INTEL, RPM_WEIGHTS, CONTRACT, GATEKEEPER), (5) Logging - structured INFO/WARN/ERROR logging with file persistence, (6) Networking - 6 outbound targets configured for API connectivity. Includes transient error classification and automatic retry with exponential backoff. State survives server restarts via `state/INFRA_RUNTIME_STATE.json`.
- **ARCHITECT_STRATEGIST_COMM_PROTOCOL v1.0**: Defines structured message routing between Architect (ChatGPT) and Strategist (Gemini) via Replit transport. Message types: ARCHITECT_DIRECTIVE_PACKET (Architect → Strategist with intent, payload, constraints) and STRATEGIST_DIAGNOSTIC_BRIEF (Strategist → Architect with root_cause_class, recommended_action, projected_impact). Enforces 4 governance locks (VQS, positioning, offer_ladder, L6). Full decision flow: Directive → Strategist → Gatekeeper → CoS Enforcement. Includes transient error retry (1500ms backoff, 2 attempts) and permanent error escalation.
- **L5_UPGRADE_BUNDLE_V2**: Three integrated revenue-protection modules: (1) Conversion-Stage Friction Map (CRO-owned) tracking Tier1→Tier2 drop rate, packet open depth, risk reversal acceptance, and CTA lag with 25% reduction target in 10 days; (2) L6 Drift Detector (Strategist-owned) with pattern matching for 7 drift types (offer ladder mutations, VQS attempts, pricing experimentation, narrative drift, excessive A/B, emergent L6, strategy drift) with immediate blocking; (3) Daily RPM Stress Test Engine (System-owned) running 5 stress scenarios (traffic collapse, objection spike, CRO inactivity, offer ladder friction shock, CMO signal density drop) with automatic corrective action plan generation. All modules enforce VQS methodology lock and L6 prohibition.
- **OPERATION REVENUE PRIME (CoS L6)**: Scoped L6 authority directive enabling CoS to operate as Revenue Commander while remaining within VQS governance constraints. Features: (1) Revenue Filter Decision Matrix with 3-tier prioritization (P1: Direct Revenue → Execute Immediately, P2: Pipeline Velocity → Execute Quickly, P3: Support/Admin → Automate/Defer/Kill), (2) Black Swan Defense System for autonomous resource reallocation when revenue falls below trend, (3) Sub-Agent Command authority over Marketing/CRO/Tech/Content agents, (4) Asset Monetization tracking, (5) Full audit trail logging. Activation requires Architect authorization. Scoped constraints: VQS preserved, audit defensibility required, positioning integrity maintained, all actions logged. API: `/api/revenue-prime/*`.
- **L6 EXECUTIVE COUNCIL (Consensus Protocol v1.0)**: Autonomous execution system replacing human-in-the-loop with three independent voting engines: (A) Governance Engine "The Lawyer" - regulatory compliance, no absolute claims, L5 constraint verification; (B) Revenue Engine "The Accountant" - cost cap, predicted ROI, monetization path; (C) Coherence Engine "The Brand Manager" - Archetype H tone, drift score <15%, professional equity. Execution rule: 3x PASS = AUTO_EXECUTE_AND_LOG, any FAIL = HOLD + Chairman Alert. Monday Launch Queue pre-loaded with 3 approved assets (Stripe Webhook, Abandonment Recovery, Velocity Dashboard). API: `/api/council/*`.
- **POST-LAUNCH MONITORING PROTOCOL (08:00-12:00 EST)**: L6/L5 integrated revenue telemetry with 3 pulse checks every 5 minutes: (A) Email Open Velocity "The Spear" - GREEN ≥22%, YELLOW 12-21%, RED <12%, alert after 30min RED; (B) Checkout Recovery Success "The Safety Net" - GREEN ≥35% click-back + ≥10% conversion, YELLOW 20-34%/5-9%, RED below, alert after 45min RED; (C) Revenue Attribution "The Webhook" - GREEN ≥95% attribution, YELLOW 80-94%, RED <80% or webhook silence >20min, immediate alert. Chairman Watch List defines success criteria. API: `/api/post-launch/*`.
- **L7 EVOLUTION PROTOCOL v1.0**: Transition from L6 (Chairman-Governed Autonomy) to L7 (Evolutionary Autonomy) - self-running, self-correcting, self-capitalizing operations. Human role transitions from Chairman to Beneficial Owner (legal signatory, payment method, monthly P&L, kill switch only). Four capability engines: (1) L7_EAE Evolutionary Adaptation Engine - rewrite modules in sandbox, auto-migrate on API/schema change, self-correct broken integrations; (2) L7_ASR Autonomous Strategic Recombination - generate business models/offers/funnels, create/sunset products on ROI, search profitable paths; (3) L7_SCL Self-Capitalization Layer - autonomous budget allocation with hard limits, profit-dependent ad spend, cost optimization; (4) L7_SGS Self-Governing Safety Layer - L5 locks immutable, continuous audit, drift detection, self-halt capability. Three proof conditions for certification: PC1 Revenue Stability (±10% variance 90 days without intervention), PC2 Legal Shield (zero critical violations), PC3 Financial Autonomy (3 profitable months, ROAS ≥1.2). Sandbox promotion requires unanimous consensus (PASS/PASS/PASS). L7 certification requires all proofs met + sandbox promotion + Black Swan handled + quarter without intervention. API: `/api/l7/*`.

**Agent Architecture & Roles:**
- **Chief of Staff Agent**: Prime orchestrator, meta-orchestrator, and control tower for strategic alignment and conflict resolution. When Revenue Prime is activated, operates at SCOPED L6 as Revenue Commander with autonomous resource allocation authority within VQS constraints.
- **Strategist (Gemini)**: Inherits Audit Agent and CEO Agent responsibilities, acting as the final authority for escalations.
- **CMO (Replit)**: Focuses on engagement signals and dark-social strategy.
- **CRO (Replit)**: Inherits CFO financial tracking responsibilities.
- **Content Manager (Replit)**: Inherits CCO and Librarian (partial) responsibilities.
- **COO Agent**: Manages internal operations execution and workflow efficiency.
- **Predictive Analytics Command Center**: Multi-agent problem diagnosis with automated strategic plan generation.
- **Strategic Command Center**: Command-and-control hub with comprehensive directive management.

**System Design Choices:** Clear separation of concerns, service layer for core business logic, and designed for scalability.

## External Dependencies
- **@neondatabase/serverless**: Driver for PostgreSQL serverless database connections (Neon Database).
- **drizzle-orm**: ORM for database interactions.
- **@tanstack/react-query**: For managing server state.
- **@radix-ui/***: Primitive UI components.
- **wouter**: Lightweight router for React.
- **Vite**: Frontend build tool and development server.
- **TypeScript**: Used across the stack.
- **Tailwind CSS**: Utility-first CSS framework.
- **ESBuild**: Used for bundling backend code in production.
- **MailChimp**: Integrated for email campaign execution.
- **OpenAI**: GPT-5 integration for LLM-powered autonomous agent reasoning.