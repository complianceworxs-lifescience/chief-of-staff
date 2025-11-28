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