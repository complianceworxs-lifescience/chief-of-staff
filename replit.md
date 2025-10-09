# Chief of Staff AI Agent

## Overview
This project develops a sophisticated Chief of Staff AI system for ComplianceWorxs, designed as a meta-orchestrator and control tower for specialized AI executive agents. The Chief of Staff serves as the executive enabler, focusing on strategic alignment, information flow coordination, and ensuring all agents work in harmony toward business objectives. The system operates alongside specialized agents including the COO Agent (operational engine room), CMO, CRO, CCO, Content Manager, and Market Intelligence Agent. The Chief of Staff acts as the "control tower" while the COO Agent manages the "operational engine room" - distinct but coordinated roles that enable true autonomous business execution through the Strategic Execution Loop methodology.

## User Preferences
Preferred communication style: Simple, everyday language.
Budget constraint: $25/day per agent (updated from $1000/day on August 18, 2025).
Autonomy requirement: Complete NO HITL - Chief of Staff must resolve all conflicts autonomously.
Rollout timeline: 6-week progressive rollout following Chief of Staff Runbook (Tiers 1-2 LIVE, Tier 3 next).
Industry Focus: Exclusively Life Sciences - pharmaceuticals, biotechnology, medical devices, CROs, CMOs, diagnostics, and life sciences software/IT only. Filter out all non-Life Sciences content.

## Recent Changes (October 9, 2025)
- **REAL EXECUTION MODE ENABLED**: System transitioned from DRY_RUN simulation to real business execution (dry_run: false)
- **MailChimp Integration Active**: Real email campaign execution enabled with API credentials configured (MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AUDIENCE_ID)
- **MailChimp Service Created**: Full-featured service for adding members, creating campaigns, sending emails, managing tags, and tracking audience stats
- **Strategic Execution Engine Implemented**: Autonomous agent assignment system that detects overdue strategic goals and automatically assigns specific agents with action plans, deadlines, and Experiment Contracts
- **Exceptions-Only Execution**: Complete governance enforcement with action assignments for every recommendation including owner, due date, Expected outcome contracts. Auto-executes if risk ≤ low, spend = $0, canary ≥10, within $100/mo budget
- **Action Assignment System**: Critical/Warning items automatically converted to assigned actions with [Owner | KPI | Expected | Outcome | Result | Next Action | Due] tracking
- **Agent Ownership Model**: CCO handles customer retention (30% progress critical), CRO handles revenue goals (25% progress urgent), CMO handles content marketing, COO handles operations
- **Experiment Contract Implementation**: Every action requires Expected outcome with KPI target, time window, success rule, canary description, and confidence percentage before execution
- **24-Hour Close Requirement**: All actions must record Outcome within 24h or escalate to Chief of Staff incident management

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