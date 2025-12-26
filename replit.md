# Chief of Staff AI Agent

## Overview
This project develops a Chief of Staff AI system for ComplianceWorxs, acting as a meta-orchestrator and control tower for specialized AI executive agents. Its primary purpose is executive enablement, strategic alignment, and coordinating information flow to ensure agents work cohesively towards business objectives. The system aims for autonomous business execution through the Strategic Execution Loop methodology, with a vision to achieve a $5M+ valuation by "selling clarity in compliance, not just dashboards," specifically targeting the Life Sciences industry. Key capabilities include autonomous conflict resolution, strategic alignment, and advanced executive insights. ComplianceWorxs is an AI-powered compliance intelligence platform for life-science companies, offering automated compliance analysis, dashboards, reporting, and AI agents to provide audit readiness, operational clarity, and measurable business impact, transforming compliance from a cost center into a driver of ROI.

## User Preferences
Preferred communication style: Simple, everyday language.
Budget constraint: $25/day per agent.
Autonomy requirement: Complete NO HITL - Chief of Staff must resolve all conflicts autonomously.
Rollout timeline: 6-week progressive rollout following Chief of Staff Runbook (Tiers 1-2 LIVE, Tier 3 next).
Industry Focus: Exclusively Life Sciences - pharmaceuticals, biotechnology, medical devices, CROs, CMOs, diagnostics, and life sciences software/IT only. Filter out all non-Life Sciences content.

## System Architecture
The application employs a full-stack architecture with a React-based SPA frontend (TypeScript, Tailwind CSS, shadcn/ui) and an Express.js REST API backend (TypeScript, ESM modules). PostgreSQL with Drizzle ORM handles database operations.

**UI/UX Decisions:**
The design prioritizes a clear, comprehensive dashboard and interactive command center, leveraging shadcn/ui with Radix UI primitives and Tailwind CSS.

**Routing Architecture (Decoupled Sites):**
- **Marketing Site (Public)**: Root-level routes for lead acquisition
  - `/` and `/overview` → OverviewPage (landing)
  - `/pricing` → PricingPage (tiers: $299, $899, Custom)
  - `/blog` and `/blog/:id` → BlogPage, BlogPostPage
  - `/faq` → FAQPage
  - `/signup` and `/login` → Authentication (redirects to /app/dashboard)
  - `/roi-calculator` → ROICalculator (lead magnet)
- **Operations Portal (Private)**: `/app/*` prefix for authenticated members
  - `/app` and `/app/dashboard` → ComplianceDashboard
  - `/app/command` → ExecutiveCommand (Chief of Staff)
  - `/app/analytics` → AnalyticsPage
  - `/app/goals`, `/app/initiatives`, `/app/directives` → Strategic management
  - `/app/governance`, `/app/governance/dashboard` → Governance views
  - `/app/market-intelligence`, `/app/ai-assistant` → Intelligence tools
  - `/app/coo`, `/app/cro`, `/app/executive` → Agent dashboards
- **Session Persistence**: localStorage-based with "cw_user" key
- **Lead-to-Member Flow**: /signup → auth → /app/dashboard
- **Portal-to-Public**: Logo links to /overview, Logout clears session and redirects to /

**Technical Implementations:**
- **State Management**: TanStack Query for server state and local React state for UI components.
- **Database Interaction**: Drizzle ORM provides type-safe PostgreSQL interactions and migrations.
- **Autonomous Governance**: Implements a two-level delegation system with Rules of Engagement and autonomous playbook management (risk assessment, financial impact, autonomy level recommendations). The Chief of Staff autonomously creates and validates playbooks for conflict resolution and recurring approvals.
- **Unified Autonomy Layer**: An enterprise-grade autonomous system with standardized signal processing, 5 specialized playbooks (CONFLICT, TRANSIENT, CAPACITY, DATA_DEP, CONFIG), decision lineage tracking, and budget-aware execution.
- **Tiered Autonomy**: Tier 2 incorporates cost-aware playbook selection, dynamic resource orchestration, data freshness contracts, bandit learning, and risk-gated HITL escalation. Tier 3 enables inter-agent coordination with rapid conflict resolution.
- **Chief of Staff Runbook**: Defines a 6-tier autonomy rollout with daily KPI monitoring and automatic rollback protocols.
- **Agent Roles**: Chief of Staff (prime orchestrator, meta-orchestrator, control tower, SCOPED L6 Revenue Commander), Strategist, CMO, CRO, Content Manager, and COO.
- **LLM Agent Reasoning System**: Integrates OpenAI GPT-5 for all 5 agents with structured JSON outputs, per-agent token budgeting, and full lineage tracking.
- **Autonomous Agent Scheduler**: Manages configurable Observe-Decide-Act-Reflect (ODAR) cycle intervals per agent, including automatic conflict detection and resolution.
- **Critical Infrastructure Config**: Ensures a robust infrastructure foundation for L5 autonomous operation, including runtime persistence, secrets management, scheduled loops, persistent state, structured logging, and networked API connectivity with transient error handling.
- **L5/L6/L7 Protocols**: Includes ARCHITECT_STRATEGIST_COMM_PROTOCOL, L5_UPGRADE_BUNDLE_V2 (revenue-protection modules), OPERATION REVENUE PRIME (CoS L6 Revenue Commander), L6 EXECUTIVE COUNCIL (consensus protocol for autonomous decisions), POST-LAUNCH MONITORING PROTOCOL (L6/L5 revenue telemetry), and L7 EVOLUTION PROTOCOL (Evolutionary Autonomy with self-running, self-correcting, self-capitalizing operations).
- **Constitution Validation**: CONSTITUTION VALIDATOR ROUTINE v1.0 (L5 Action Loop middleware with guards for Prestige, Liability, Financial, Domain), CEE (Constitution Enforcement Engine) v1.0 (single authority interpreting Constitution.json), and CONSTITUTION CI TEST SUITE (structured test cases for deployment blockage).
- **Guaranteed Success Engine v2.0**: Implements 8 closed-loop, self-correcting processes for mechanically predictable revenue, focusing on demand, conversion, revenue, and retention.
- **Editorial Firewall + Message Bus v1.0**: Provides content governance with domain anchors, prohibited terms, pillar alignment, persona lock, and an inter-agent communication system for routing content creation through staged validation.
- **CoS Orchestrator Mandate (Enhanced v1.1)**: Formal governance system for the Chief of Staff agent with immutable constraints (REJECT_UNMEASURABLE_TACTICS, REJECT_ENGINE_VIOLATIONS, REJECT_VANITY_OPTIMIZATION, REQUIRE_REVENUE_MAPPING), an arbitration layer, and an agent feedback loop.
- **Agent Installation Directives v1.0**: Four CoS-issued sub-directives (CMO, CRO, Strategist, Content Agents) mapping to the Guaranteed-Success architecture, with API endpoints at `/api/directives/*` and state files persisted to `state/` directory.
- **Directive Enhancements v1.0**: Five high-impact improvements to Agent Installation Directives, including Real-Time Conversion Tracking, Inter-Directive Signal Routing, Retention Engine with Real Data, AI-Powered Asset Generation, and Automated Intelligence Scraping, with API endpoints at `/api/enhancements/*` and state files in `state/enhancement_*.json`.
- **Revenue Acceleration Package v1.0**: Three features to close revenue gaps: Abandoned Checkout Recovery (Stripe, SendGrid), ROI Calculator Lead Magnet (interactive calculator, Mailchimp integration), and Intelligence-to-Content Automation (OpenAI GPT-4o for blog brief generation). API endpoints at `/api/revenue-acceleration/*` and `/api/intelligence-content/*`.

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
- **SendGrid**: For email automation.
- **OpenAI**: GPT-5 integration for LLM-powered autonomous agent reasoning.