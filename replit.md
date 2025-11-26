# Chief of Staff AI Agent

## Overview
This project develops a sophisticated Chief of Staff AI system for ComplianceWorxs, designed as a meta-orchestrator and control tower for specialized AI executive agents. The Chief of Staff serves as the executive enabler, focusing on strategic alignment, information flow coordination, and ensuring all agents work in harmony toward business objectives. The system operates alongside specialized agents including the COO Agent (operational engine room), CMO, CRO, CCO, Content Manager, and Market Intelligence Agent. The Chief of Staff acts as the "control tower" while the COO Agent manages the "operational engine room" - distinct but coordinated roles that enable true autonomous business execution through the Strategic Execution Loop methodology.

## User Preferences
Preferred communication style: Simple, everyday language.
Budget constraint: $25/day per agent (updated from $1000/day on August 18, 2025).
Autonomy requirement: Complete NO HITL - Chief of Staff must resolve all conflicts autonomously.
Rollout timeline: 6-week progressive rollout following Chief of Staff Runbook (Tiers 1-2 LIVE, Tier 3 next).
Industry Focus: Exclusively Life Sciences - pharmaceuticals, biotechnology, medical devices, CROs, CMOs, diagnostics, and life sciences software/IT only. Filter out all non-Life Sciences content.

## Recent Changes (November 26, 2025)
- **ADVANCED CAPABILITY PACK v1.0 ACTIVATED**: Three revenue-critical AI capabilities deployed
  - **Revenue Predictive Model** (Owners: Strategist + Librarian)
    - Risk-adjusted 7-day revenue forecasting with 24-hour update cycles
    - Integrates: LinkedIn velocity, micro-offer acceptance, CTA conversion windows, committee friction, VQS deltas, objection clusters, MailChimp responses
    - Outputs: Daily Risk-Adjusted Revenue Forecast with predicted delta, confidence score, top 3 bottlenecks, recommended agent interventions
  - **Autonomous Offer Optimization Engine** (Owners: CRO + CMO)
    - Continuous A/B testing on Tier 1-3 offers, risk-reversal messages, CTA timing, offer sequencing
    - Dark-social + LinkedIn engagement data integration (lurker→engager conversions, comment-to-DM patterns)
    - Weekly Offer Optimization Report with best/failing variants, recommended experiments, projected revenue lift
  - **Compliance Intelligence Reports** (Owners: Content Manager + Librarian)
    - Monthly executive-grade intelligence reports as subscription revenue product ($149/$349/$2,999 tiers)
    - Tracks: audit risk trends, documentation gap rates, operator benchmarks, objection patterns, workload deltas
    - Content assets: LinkedIn teasers, dark-social assets, email highlights
  - 72-Hour Integration Sprint initiated with ODAR assignments to all agents
  - New API Endpoints: /api/capabilities/status, /activate, /cos-dashboard, /revenue-model/*, /offer-engine/*, /intel-reports/*
  - Dashboard Section 9 added: Advanced Capability Pack panel with real-time metrics
- **L5 METRICS CONFIRMATION SYSTEM DEPLOYED**: Primary L5 metrics tracking for L6 transition readiness
  - Three Primary L5 Metrics now tracked:
    1. **Revenue Predictability**: Stable MRR lift adhering to Weekly Revenue Sprint targets (Target: 80% achievement)
    2. **ACV Expansion**: Revenue Offer Ladder increases Average Contract Value vs historical baseline (Target: 25%+ increase)
    3. **Friction Reduction**: Decrease in Stakeholder Objection Spikes via Objection Intelligence Loop (Target: 30%+ reduction)
  - L6 Readiness Assessment: System autonomously determines when L5 is confirmed and can forecast/budget for L6 goals
  - L6 Goals (pending L5 confirmation): Proactive Regulatory Influence, Market-Shaping Intelligence, Predictive Compliance Positioning
  - New API Endpoints: /api/operating-context/l5/confirmation, /l5/l6-readiness, /l5/metrics/:metric
  - Dashboard Section 8 added: L5 Metrics Confirmation & L6 Readiness panel
- **AGENT OPERATING CONTEXT v1.5 DEPLOYED**: L5 Revenue Optimization Intelligence upgrade complete
  - System upgraded from L4 (Strategic Autonomy) to L5 (Revenue Optimization Intelligence)
  - Four L5 Structural Fixes now ACTIVE:
    1. **Unified Data Layer**: Librarian Agent owns single source of truth for all agent decisions
    2. **Revenue Offer Ladder**: 3-Tier mandatory progression (Scorecard → Diagnostic → Subscription)
    3. **Weekly Revenue Sprints**: CoS enforces weekly targets with CRO execution and 72-hour CTA loops
    4. **Objection Intelligence Loop**: Librarian extracts → Strategist analyzes → Content updates packets
  - New L5 API Endpoints: /api/operating-context/l5/dashboard, /l5/fixes, /l5/maturity, /l5/offer-ladder, /l5/revenue-sprints, /l5/objection-loop
  - 11 Governance Rules (9 original + 2 new mandatory L5 rules)
  - All agents updated with v1.5 responsibilities
- **AGENT OPERATING CONTEXT vFINAL (Prior)**: Complete, final operating system directive delivered to Chief of Staff (CoS) Agent
  - CoS Agent is now PRIME ORCHESTRATOR - no agent may bypass CoS
  - Strategist Agent is final authority for escalations
  - Strategic Framework: Dunford (Positioning) + Walker (Demand) + Kern (Conversion)
  - VQS (Validated Quantified Statements): 14-28% workload reduction, $18K-$72K cost reduction, 15-35% performance improvement
  - Planning Cycles: Weekly (CoS Operating Brief), Monthly (Intelligence Cycle), Quarterly (Calibration)
  - Revenue Sensitivity Model with 9 financial rigor metrics
  - Output Mandates: Fully autonomous execution without waiting for human commands
- **MULTIMILLION-DOLLAR DIRECTIVE LOADED**: Comprehensive operating directive for $5M+ valuation scale
  - CEO Agent context block with ODAR discipline and $5M growth line tracking
  - CFO Agent: burn/runway monitoring, CAC guardrails, 30/90-day forecasts
  - Success Criteria: ARR 10%+ MoM, Delivery 98%+, CAC <$50, CTR >1%, Conversion >1.5%, Runway ≥12mo
  - Revenue Model: $99→$149→$499 subscription tiers, enterprise accounts, high-margin upsells
  - Brand Positioning: "Selling clarity in compliance, not just dashboards" - the safe bet for regulated industries
- **System-Driven Mindset**: "What systems must I install so ComplianceWorxs compounds into a $5M+ asset — without me in the weeds?"
- **API Endpoints**: 
  - Operating Context: /api/operating-context/complete, /api/operating-context/activate, /api/operating-context/governance, /api/operating-context/escalation, /api/operating-context/maturity
  - Directive: /api/directive/config, /api/directive/success-criteria, /api/directive/revenue-model, /api/directive/brand-positioning
  - CFO: /api/cfo/brief, /api/cfo/forecast/:period

## Previous Changes (October 9, 2025)
- **REAL EXECUTION MODE ENABLED**: System transitioned from DRY_RUN simulation to real business execution (dry_run: false)
- **MailChimp Integration Active**: Real email campaign execution enabled with API credentials configured
- **Strategic Execution Engine Implemented**: Autonomous agent assignment system with Experiment Contracts
- **Exceptions-Only Execution**: Complete governance enforcement with action assignments
- **24-Hour Close Requirement**: All actions must record Outcome within 24h or escalate

## System Architecture
The application follows a modern full-stack architecture. The frontend is a React-based Single Page Application (SPA) using TypeScript, Tailwind CSS, and shadcn/ui components. The backend is an Express.js REST API server built with TypeScript and ESM modules. PostgreSQL serves as the database, managed with Drizzle ORM for type-safe interactions and migrations. Vite is used for frontend bundling and development.

**Key Architectural Decisions:**
- **UI/UX**: Utilizes shadcn/ui with Radix UI primitives for accessibility and Tailwind CSS for styling with custom theming, prioritizing a clear, comprehensive dashboard and interactive command center.
- **Technical Implementations**:
    - **State Management**: TanStack Query for server state, complemented by local React state for UI specifics.
    - **Routing**: Wouter for lightweight client-side routing.
    - **Database Interaction**: Drizzle ORM provides a robust, type-safe interface to PostgreSQL, handling schema definition and migrations.
    - **Error Handling**: Centralized error middleware on the backend ensures consistent error responses.
    - **AI Assistant**: Integrated with a dedicated AI questions database table and service, providing contextual responses about system data.
    - **Autonomous Governance**: Features a two-level delegation system with user-defined Rules of Engagement and autonomous playbook management (Level 1: Manual Approval, Level 2: Auto with Notification, Level 3: Fully Autonomous).
    - **Strategic Execution Loop Enhancement**: The Chief of Staff automatically creates and validates playbooks for conflicts and recurring approval patterns, integrating risk assessment, financial impact analysis, and autonomy level recommendations.
    - **Unified Autonomy Layer**: Enterprise-grade autonomous system implementing the complete implementation pack with standardized signal processing, 5 specialized playbooks (CONFLICT, TRANSIENT, CAPACITY, DATA_DEP, CONFIG), decision lineage tracking, and budget-aware execution. Replaces basic auto-remediation with unified approach across all agents.
    - **Tier 2 Autonomy**: Advanced upgrade adding cost-aware playbook selection via Expected Utility calculations, dynamic resource orchestration with ROI-based slot allocation, data freshness contracts with fallback mechanisms, bandit learning for playbook optimization (epsilon-greedy), and risk-gated HITL escalation. Achieves lower cost/incident, higher throughput, reduced stalls, continuous improvement, and safer autonomous operations.
    - **Tier 3 Coordination**: Inter-agent coordination with conflict half-life <10min, cooperation efficiency tracking, and sim harness for safe testing.
    - **Chief of Staff Runbook**: 6-tier autonomy rollout with daily KPI monitoring (Auto-resolve ≥85%, MTTR <5min, Cost reduction ≥15%, Escalations ≤5/day), progressive tier enablement via environment toggles, and automatic rollback protocol if KPIs regress >5% in 24h.
    - **Auto-Remediation**: Legacy system maintained for backward compatibility, now integrated with the Unified Autonomy Layer.
- **Agent Architecture & Roles**:
    - **Chief of Staff Agent**: Meta-orchestrator and control tower responsible for strategic alignment, information flow coordination, conflict resolution, and ensuring all agents work toward unified objectives. Acts as executive enabler focused on priorities and cross-agent harmony.
    - **COO Agent**: Operational engine room managing internal operations execution, workflow efficiency, productivity metrics, cost management, sprint execution, and operational blockers. Reports operational status to Chief of Staff.
    - **Executive Agents**: Specialized agents (CEO, CMO, CRO, CCO) focused on their functional domains, coordinated by Chief of Staff for strategic alignment.
    - **Content Manager**: Enhanced capabilities for content synthesis and generation, acting as bridge between strategic directives and campaign execution.
    - **Market Intelligence Agent**: Regulatory, competitive, and market signal monitoring with web scraping and NLP analysis capabilities.
    - **Predictive Analytics Command Center**: Multi-agent problem diagnosis with automated strategic plan generation and interactive conflict prediction.
    - **Strategic Command Center**: Command-and-control hub with comprehensive directive management and autonomous conflict resolution.
- **System Design Choices**:
    - **Clear Separation of Concerns**: Distinct `/client`, `/server`, and `/shared` directories.
    - **Service Layer**: Core business logic is encapsulated in services like Agent Monitor, Conflict Resolver, and Report Generator.
    - **Scalability**: Designed for production deployment with separate build processes and environment configurations for development and production.
    - **Data Flow**: Defined processes for agent monitoring, conflict resolution (including automated categorization and resolution attempts), and reporting (collecting system metrics, agent performance, and strategic alignment).

## External Dependencies
- **@neondatabase/serverless**: Driver for PostgreSQL serverless database connections.
- **drizzle-orm**: ORM for database interactions with PostgreSQL.
- **@tanstack/react-query**: For managing server state in the frontend.
- **@radix-ui/***: Primitive UI components for building accessible interfaces.
- **wouter**: A lightweight router for React applications.
- **Vite**: Frontend build tool and development server.
- **TypeScript**: Used across both frontend and backend for type safety.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **ESBuild**: Used for bundling backend code in production.
- **Neon Database**: The specific PostgreSQL-compatible serverless database provider used for data persistence, configured via environment variables.