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

**Agent Architecture & Roles:**
- **Chief of Staff Agent**: Prime orchestrator, meta-orchestrator, and control tower for strategic alignment and conflict resolution.
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