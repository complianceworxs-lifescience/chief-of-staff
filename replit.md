# Chief of Staff AI Agent

## Overview
This project develops a Chief of Staff AI system for ComplianceWorxs, acting as a meta-orchestrator and control tower for specialized AI executive agents. Its primary purpose is executive enablement, strategic alignment, and coordinating information flow to ensure agents work cohesively towards business objectives. The system aims for autonomous business execution through the Strategic Execution Loop methodology, with a vision to achieve a $5M+ valuation by "selling clarity in compliance, not just dashboards," specifically targeting the Life Sciences industry. Key capabilities include autonomous conflict resolution, strategic alignment, and advanced executive insights.

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
- **Tier 2 Autonomy**: Incorporates cost-aware playbook selection, dynamic resource orchestration, data freshness contracts, bandit learning for playbook optimization, and risk-gated HITL escalation.
- **Tier 3 Coordination**: Enables inter-agent coordination with rapid conflict resolution and efficiency tracking.
- **Chief of Staff Runbook**: Defines a 6-tier autonomy rollout with daily KPI monitoring and automatic rollback protocols.
- **Agent Roles**: Includes Chief of Staff (prime orchestrator, meta-orchestrator, control tower, and SCOPED L6 Revenue Commander), Strategist, CMO, CRO, Content Manager, and COO.
- **LLM Agent Reasoning System**: Integrates OpenAI GPT-5 for all 5 agents with structured JSON outputs, per-agent token budgeting, and full lineage tracking.
- **Autonomous Agent Scheduler**: Manages configurable Observe-Decide-Act-Reflect (ODAR) cycle intervals per agent, including automatic conflict detection and resolution.
- **Critical Infrastructure Config**: Enforces a robust infrastructure foundation for L5 autonomous operation, including runtime persistence, secrets management, scheduled loops, persistent state, structured logging, and networked API connectivity, handling transient errors with automatic retries.
- **ARCHITECT_STRATEGIST_COMM_PROTOCOL**: Defines structured message routing and governance locks for communication between Architect and Strategist agents.
- **L5_UPGRADE_BUNDLE_V2**: Integrates revenue-protection modules like Conversion-Stage Friction Map, L6 Drift Detector, and Daily RPM Stress Test Engine, all enforcing VQS methodology lock and L6 prohibition.
- **OPERATION REVENUE PRIME (CoS L6)**: A scoped L6 authority directive enabling CoS to operate as Revenue Commander with autonomous resource allocation authority within VQS governance constraints, including a Revenue Filter Decision Matrix and Black Swan Defense System.
- **L6 EXECUTIVE COUNCIL**: An autonomous execution system using a consensus protocol with three independent voting engines (Governance, Revenue, Coherence) to replace human-in-the-loop decisions.
- **POST-LAUNCH MONITORING PROTOCOL**: Provides L6/L5 integrated revenue telemetry with pulse checks for Email Open Velocity, Checkout Recovery Success, and Revenue Attribution.
- **L7 EVOLUTION PROTOCOL**: Defines the transition to Evolutionary Autonomy (L7) with self-running, self-correcting, and self-capitalizing operations, including engines for Evolutionary Adaptation, Autonomous Strategic Recombination, Self-Capitalization, and Self-Governing Safety.
- **CONSTITUTION VALIDATOR ROUTINE v1.0**: L5 Action Loop middleware that validates every action before execution, with guards for Prestige, Liability, Financial, and Domain.
- **CEE (Constitution Enforcement Engine) v1.0**: Single authority interpreting Constitution.json for action decisions across various action types with four defined guards.
- **CONSTITUTION CI TEST SUITE**: Structured test cases that block deployment on any failure, covering domain, liability, financial, and specific domain fences.
- **GUARANTEED SUCCESS ENGINE v2.0**: Implements 8 closed-loop, self-correcting processes to achieve mechanically predictable revenue, focusing on predictable demand, conversion, revenue, and retention, with continuous self-improvement. It includes daily monitoring, asset-to-sales loop enforcement, predictive revenue modeling, continuous offer optimization, audit-readiness narrative enforcement, failure-mode detection, closed-loop retention, and executive oversight feedback.
- **EDITORIAL FIREWALL + MESSAGE BUS v1.0**: Provides content governance with domain anchors, prohibited terms, pillar alignment, and persona lock, alongside an inter-agent communication system for routing content creation through staged validation.
- **COS ORCHESTRATOR MANDATE (Enhanced v1.1)**: Implements a formal governance system for the Chief of Staff agent with immutable constraints (REJECT_UNMEASURABLE_TACTICS, REJECT_ENGINE_VIOLATIONS, REJECT_VANITY_OPTIMIZATION, REQUIRE_REVENUE_MAPPING), an enterprise-wide arbitration layer, and an agent feedback loop for vetoes and iterative refinement. This mandate intercepts all agent actions in the execution pipeline.
- **AGENT INSTALLATION DIRECTIVES v1.0**: 4 CoS-issued sub-directives that map cleanly to the Guaranteed-Success architecture:
  - **CMO Directive**: Daily demand monitoring, message reinforcement loop, asset routing enforcement, 14-day spear-tip optimization, demand stability reporting.
  - **CRO Directive**: Predictive revenue modeling (7/14/30 day), conversion optimization loop, retention engine activation, offer clarity enforcement, revenue stability reporting.
  - **Strategist Directive**: Spear-tip calibration, competitive intelligence loop, positioning enforcement, strategy override protocol (24h correction), weekly strategic summary.
  - **Content Agent Directive**: Asset eligibility rule, content-to-sales loop, high-precision style enforcement, asset replacement protocol (24h), daily output summary.
  - API endpoints at `/api/directives/*` with state files persisted to `state/` directory.
- **DIRECTIVE ENHANCEMENTS v1.0**: 5 high-impact improvements for Agent Installation Directives:
  - **Real-Time Conversion Tracking**: Connects CRO to actual Stripe checkout events, payment data, MRR/ARR calculations.
  - **Inter-Directive Signal Routing**: Feedback loops between CMO→Content, CRO→CMO, Strategist→ALL, Content→CRO.
  - **Retention Engine with Real Data**: Database-driven churn scoring using actual user activity and subscription status.
  - **AI-Powered Asset Generation**: OpenAI GPT-4o generates content assets when gaps detected, enforces spear-tip scoring.
  - **Automated Intelligence Scraping**: Gathers FDA regulatory updates, industry news, competitor activity with relevance scoring.
  - API endpoints at `/api/enhancements/*` with enhancement state files in `state/enhancement_*.json`.

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