# Chief of Staff AI Agent

## Overview
This project develops a sophisticated Chief of Staff AI system for ComplianceWorxs, designed as a meta-orchestrator and control tower for specialized AI executive agents. The Chief of Staff serves as the executive enabler, focusing on strategic alignment, information flow coordination, and ensuring all agents work in harmony toward business objectives. The system aims for autonomous business execution through the Strategic Execution Loop methodology, with a vision to achieve a $5M+ valuation for ComplianceWorxs by "selling clarity in compliance, not just dashboards."

## User Preferences
Preferred communication style: Simple, everyday language.
Budget constraint: $25/day per agent.
Autonomy requirement: Complete NO HITL - Chief of Staff must resolve all conflicts autonomously.
Rollout timeline: 6-week progressive rollout following Chief of Staff Runbook (Tiers 1-2 LIVE, Tier 3 next).
Industry Focus: Exclusively Life Sciences - pharmaceuticals, biotechnology, medical devices, CROs, CMOs, diagnostics, and life sciences software/IT only. Filter out all non-Life Sciences content.

## System Architecture
The application uses a full-stack architecture with a React-based SPA frontend (TypeScript, Tailwind CSS, shadcn/ui) and an Express.js REST API backend (TypeScript, ESM modules). PostgreSQL with Drizzle ORM is used for the database.

**Key Architectural Decisions:**
- **UI/UX**: Prioritizes a clear, comprehensive dashboard and interactive command center using shadcn/ui with Radix UI primitives and Tailwind CSS.
- **Technical Implementations**:
    - **State Management**: TanStack Query for server state, local React state for UI.
    - **Database Interaction**: Drizzle ORM for type-safe PostgreSQL interactions and migrations.
    - **Autonomous Governance**: Two-level delegation system with Rules of Engagement and autonomous playbook management (Level 1: Manual Approval, Level 2: Auto with Notification, Level 3: Fully Autonomous).
    - **Strategic Execution Loop Enhancement**: Chief of Staff automatically creates and validates playbooks for conflicts and recurring approval patterns, integrating risk assessment, financial impact, and autonomy level recommendations.
    - **Unified Autonomy Layer**: Enterprise-grade autonomous system with standardized signal processing, 5 specialized playbooks (CONFLICT, TRANSIENT, CAPACITY, DATA_DEP, CONFIG), decision lineage tracking, and budget-aware execution.
    - **Tier 2 Autonomy**: Advanced upgrade incorporating cost-aware playbook selection via Expected Utility, dynamic resource orchestration, data freshness contracts, bandit learning for playbook optimization, and risk-gated HITL escalation.
    - **Tier 3 Coordination**: Inter-agent coordination with conflict half-life <10min, cooperation efficiency tracking, and a simulation harness.
    - **Chief of Staff Runbook**: 6-tier autonomy rollout with daily KPI monitoring and automatic rollback protocols.
    - **CoS DAILY MONITORING CHECKLIST v2.0**: Enhanced 4-Agent optimized checklist with PFL (Product Feedback Loop), CSI (Competitor Signal Intelligence), and SVDP (Strategic VQS Defense Plan). Includes metric enforcement for Feature Objection Rate, MTTD ≤72h, Revenue Predictability ≥85%, and automatic VQS Defense Asset prioritization.
    - **ROLE CASCADE DIRECTIVE**: Remaps 6 missing agent roles into 4 active Replit agents + Gemini Strategist, ensuring L5-complete coverage.
    - **ADVANCED CAPABILITY PACK**: Activates three revenue-critical AI capabilities: Revenue Predictive Model, Autonomous Offer Optimization Engine, and Compliance Intelligence Reports.
    - **L5 METRICS CONFIRMATION SYSTEM**: Tracks Revenue Predictability, ACV Expansion, and Friction Reduction for L6 transition readiness.
    - **AGENT OPERATING CONTEXT v1.5**: Upgrades the system to L5 (Revenue Optimization Intelligence) with structural fixes: Unified Data Layer, Revenue Offer Ladder, Weekly Revenue Sprints, and Objection Intelligence Loop.
    - **L5 Agent Health Monitor**: 2-hour autonomous ODAR (Observe-Decide-Act-Reflect) validation cycle monitoring UDL sync, agent activity, 8 drift indicators (messaging_drift, vqs_boundary_tension, rpm_accuracy, offer_ladder_blockage, conversion_velocity_drop, content_stagnation, trust_signals, rising_objections), and external signals. Uses real data from CoS Daily Checklist, Revenue Predictive Model, Offer Optimization Engine, and Compliance Intelligence Reports. Silent mode when health ≥70%, surfaces reports when issues detected. 350 token/cycle budget. Auto-corrections include Blueprint mutation, Strategist updates, and Stakeholder Packet refresh.
    - **L6 TRANSITION PACKAGE (A-D)**: Unified directive enabling controlled L6 experimentation while preserving L5 as the dominant live system. Components:
      - **L6 Sandbox Mode**: Fully isolated experimental environment for new narratives, pricing models, product ideas, category reframes, methodology enhancements, offer ladder re-architecture, and market expansion hypotheses. Segregated UDL partition (L6_Sandbox).
      - **CoS L6 Governance**: CoS becomes L6 Gatekeeper. Experiment budget caps (500 tokens/experiment, 7 days max, 3 simultaneous max). Rollback triggers on trust decline, skepticism rise, conversion drop, confusion, or VQS risk. Tracks proposed/active/completed/abandoned/graduated experiments.
      - **Micro-Cohort Testing**: 5% audience cap (650 members from 13K LinkedIn group). Tracks trust signals, conversion patterns, friction events, skepticism indicators. CRO reports friction to CoS immediately.
      - **Methodology Lock (VQS Protection)**: Protects Dunford/Walker/Kern, VQS Framework, Offer Ladder, Content Archetypes. Changes require Strategist simulation, regulatory validation, conservativeness proof (≥70%), and max VQS risk of low. Only enhancement/extension changes allowed.
    - **L6 TRANSITION READINESS FRAMEWORK**: Critical thresholds for L6 activation - ALL FIVE must be TRUE simultaneously. L6 = meta-autonomy (agents redesigning the business model itself). Risk profile: Regulatory, reputation-sensitive, audit-grade.
      - **Revenue Stability**: Weekly Revenue Sprints ≥85% target for 6 consecutive weeks. An unstable revenue system cannot support strategic redesign.
      - **RPM Stability**: ≥92% accuracy for 30 consecutive days. Ensures low variance and trustworthy risk-adjusted forecasts.
      - **Objection Stability**: No new objection categories for 30 consecutive days. L6 experimentation is impossible while discovering baseline objections.
      - **Blueprint Performance**: CMO Archetype variance within ±15%. Demand engine must be stable, predictable, trust-efficient, and modular.
      - **System Coherence**: Zero cross-agent contradictions for 48 hours (2 ODAR cycles). L6 redesign requires system to behave as a single agent.
      - **Safety Signals (Optional)**: Trust Momentum positive 30 days, Conversion Velocity up + stable, No VQS Tension 30 days.
    - **L6 Maturity Level**: Preview mode with sandbox isolation. Activation ONLY when ALL five critical thresholds are met. Protected by Methodology Lock, 5% Micro-Cohort Cap, CoS Gatekeeper Approval, and Rollback Protocol.
- **Agent Architecture & Roles**:
    - **Chief of Staff Agent**: Prime orchestrator, meta-orchestrator, and control tower for strategic alignment and conflict resolution.
    - **Strategist (Gemini)**: Inherits Audit Agent and CEO Agent responsibilities, acting as the final authority for escalations.
    - **CMO (Replit)**: Focuses on engagement signals and dark-social strategy.
    - **CRO (Replit)**: Inherits CFO financial tracking responsibilities.
    - **Content Manager (Replit)**: Inherits CCO and Librarian (partial) responsibilities.
    - **COO Agent**: Manages internal operations execution and workflow efficiency.
    - **Predictive Analytics Command Center**: Multi-agent problem diagnosis with automated strategic plan generation.
    - **Strategic Command Center**: Command-and-control hub with comprehensive directive management.
- **System Design Choices**: Clear separation of concerns, service layer for core business logic, and designed for scalability.

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

## ARCHITECT–CoS ESCALATION CONTRACT v1.0 (BINDING OPERATIONAL LAW)
This contract supersedes all previous hierarchy documents and is executed at every cycle.

**Authority Structure:**
- **Architect**: Supreme Governance Authority (strategic oversight, L6 gatekeeper, VQS protection)
- **CoS**: Supreme Operational Authority (day-to-day execution, agent coordination, conflict resolution)

**Sections 1-7 Enforced:**
1. **Authority Definitions**: Architect overrides all; CoS overrides Strategist/CMO/CRO/ContentManager
2. **Escalation Triggers**: 10 auto-escalation triggers (revenue decline, VQS violations, L6 requests, budget exceeded)
3. **Safety Locks**: 6 safety locks (VQS Framework, L6 Activation, Governance Rules, Agent Termination, Budget Override, External Communication)
4. **Supervision Cycles**: Architect governance review (6h), CoS operational review (2h), CoS realtime monitoring (5min)
5. **L5 Constraints**: 8 enforced constraints (revenue scope, VQS compliance, budget limits, autonomy, LinkedIn-only, audit-grade, conservative VQS, UDL)
6. **L6 Function Blocks**: 8 blocked functions (business model redesign, pricing changes, new products, market expansion, methodology modification, category reframe, sandbox experiments, micro-cohort testing) - ALL require explicit Architect approval
7. **Contract Enforcement Engine**: Escalation logging, violation tracking, authority-checked resolution

**API Endpoints (/api/contract/*):**
- GET /api/contract/status - Full contract status
- GET /api/contract/authorities - Authority hierarchy
- GET /api/contract/escalation-triggers - All escalation triggers
- POST /api/contract/escalate - Trigger escalation
- POST /api/contract/resolve-escalation - Resolve (authority-checked)
- GET /api/contract/safety-locks - All safety locks
- POST /api/contract/safety-locks/unlock - Architect unlock
- GET /api/contract/l5-constraints - L5 constraint definitions
- GET /api/contract/l6-blocks - L6 function blocks
- POST /api/contract/l6-blocks/unlock - Architect L6 unlock
- POST /api/contract/supervision/architect-review - Trigger Architect review
- POST /api/contract/supervision/cos-review - Trigger CoS review

## LLM Agent Reasoning System
The system now uses true LLM-powered reasoning for all 5 agents (CoS, Strategist, CMO, CRO, ContentManager):

**Core Implementation (server/services/llm-agent-reasoning.ts):**
- OpenAI GPT-5 integration with structured JSON outputs
- Per-agent token budgeting: $25/day per agent ($125/day total)
- Cost-based accounting: ~$0.0003/1K input tokens, ~$0.0012/1K output tokens
- Graceful fallback when LLM unavailable or budget exceeded (confidence: 0.5)
- Decision logging with full lineage tracking

**Autonomous Agent Scheduler (server/services/autonomous-llm-agents.ts):**
- Configurable ODAR cycle intervals per agent (CoS: 4h, Strategist: 6h, CMO/CRO: 4h, ContentManager: 6h)
- Full ODAR (Observe-Decide-Act-Reflect) cycle with LLM reasoning
- Automatic conflict detection and resolution via CoS

**API Endpoints (server/routes/llm-agent-reasoning.ts):**
- POST /api/llm-agents/reason - General LLM reasoning
- POST /api/llm-agents/cos/orchestrate - CoS orchestration decisions
- POST /api/llm-agents/strategist/decide - Strategist reasoning
- POST /api/llm-agents/cmo/analyze - CMO engagement decisions
- POST /api/llm-agents/cro/decide - CRO revenue optimization
- POST /api/llm-agents/content-manager/decide - Content Manager decisions
- POST /api/llm-agents/conflict/analyze - Conflict resolution
- POST /api/llm-agents/odar/:agent - ODAR cycle for specific agent
- GET /api/llm-agents/agent-budgets - Per-agent budget status
- GET /api/llm-agents/token-usage - Token usage statistics
- GET /api/llm-agents/decision-log - Decision log history
- POST /api/llm-agents/autonomous/start - Start autonomous scheduling
- POST /api/llm-agents/autonomous/stop - Stop autonomous scheduling
- GET /api/llm-agents/autonomous/status - Autonomous scheduler status
- GET /api/llm-agents/health - LLM agent health status