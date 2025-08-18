# Chief of Staff AI Agent

## Overview
This project develops a sophisticated Chief of Staff AI system for ComplianceWorxs, designed to strategically orchestrate an entire team of AI executive agents. Its core purpose is to enable "Orchestrated Execution" through a proprietary "Strategic Execution Loop," automating the achievement of business goals by coordinating AI teamwork. The system features an "Auto-Remediation Mode," providing true autonomy by detecting, classifying, and resolving agent conflicts, errors, and performance issues without human intervention. The Strategic Execution Loop involves four steps: Goal setting, Orchestration by the Chief of Staff, Execution by specialized Executive Agents, and continuous Learning & Refinement based on results. This system aims to provide a cohesive, intelligent platform for automated business goal attainment, distinguishing ComplianceWorxs in the market.

## User Preferences
Preferred communication style: Simple, everyday language.
Budget constraint: $25/day per agent (updated from $1000/day on August 18, 2025).

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
    - **Auto-Remediation**: Legacy system maintained for backward compatibility, now integrated with the Unified Autonomy Layer.
- **Feature Specifications**:
    - **Agent Orchestration**: Monitors, aligns, and resolves conflicts among specialized Executive Agents (e.g., CRO, CFO, COO, CCO, CEO, CMO, Content Manager, Market Intelligence Agent).
    - **Content Manager**: Enhanced capabilities for content synthesis and generation, acting as a bridge between strategic directives and campaign execution.
    - **Market Intelligence Agent**: Specializes in regulatory, competitive, and market signal monitoring, integrating web scraping and NLP analysis.
    - **Generative Strategist**: Provides multi-agent problem diagnosis and automated strategic plan generation based on cross-agent intelligence correlation.
    - **Predictive Analytics Command Center**: Transforms diagnostics into actionable controls, featuring a Priority Rule Engine, interactive conflict prediction with drill-down, one-click resolution actions, and escalation controls.
    - **Strategic Command Center**: Evolves directives into a command-and-control hub with actions like Reassign, Pause/Resume/Cancel, Escalate, Clone & Split directives, and integrated conflict resolution.
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