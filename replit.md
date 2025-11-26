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
      - **L6 Sandbox Mode**: Fully isolated experimental environment for new narratives, pricing models, product ideas, category reframes, methodology enhancements, offer ladder re-architecture, and market expansion hypotheses. Segregated UDL partition (L6_Sandbox). Activation requires RPM accuracy ≥85% and no unresolved drift indicators.
      - **CoS L6 Governance**: CoS becomes L6 Gatekeeper. Experiment budget caps (500 tokens/experiment, 7 days max, 3 simultaneous max). Rollback triggers on trust decline, skepticism rise, conversion drop, confusion, or VQS risk. Tracks proposed/active/completed/abandoned/graduated experiments.
      - **Micro-Cohort Testing**: 5% audience cap (650 members from 13K LinkedIn group). Tracks trust signals, conversion patterns, friction events, skepticism indicators. CRO reports friction to CoS immediately.
      - **Methodology Lock (VQS Protection)**: Protects Dunford/Walker/Kern, VQS Framework, Offer Ladder, Content Archetypes. Changes require Strategist simulation, regulatory validation, conservativeness proof (≥70%), and max VQS risk of low. Only enhancement/extension changes allowed.
    - **L6 Maturity Level**: Preview mode with sandbox isolation. Capabilities include new narrative proposals, pricing experiments, product idea validation, category reframe testing, and methodology enhancements. Protected by Methodology Lock, 5% Micro-Cohort Cap, CoS Gatekeeper Approval, and Rollback Protocol.
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