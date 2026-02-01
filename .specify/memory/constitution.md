# AccountFlow Constitution
<!--
  Sync Impact Report:
  Version change: N/A → 1.0.0
  Modified principles: New constitution (all new)
  Added sections: All sections (Core Principles, Technology Stack, Development Workflow, Governance)
  Removed sections: None
  Templates requiring updates: None (initial creation)
  Follow-up TODOs: None
-->

## Core Principles

### I. Lightweight Architecture (MUST)
Every component must justify its existence. Prefer proven libraries over custom implementations. Docker Compose single-command local deployment is mandatory. Database schema changes must be reversible. YAGNI applies to all features.

**Rationale**: The tool is meant for quick analysis sessions, not enterprise complexity. Over-engineering kills adoption.

### II. AI-Human Collaboration (MUST)
AI assists, humans decide. All AI-generated rules require explicit user confirmation before persistence. Prompts are versioned and auditable. AI responses must be structured (JSON/Tables) for machine parsing and visualization.

**Rationale**: Accounting rules are legally binding; AI provides draft, human owns final decision.

### III. Component Reusability (MUST)
Vue components must be domain-agnostic when possible. Accounting-specific logic isolated in composables. No copy-paste UI code across admin/product views. Shared科目 (account) management accessible to all roles.

**Rationale**: Two user roles share 80% of UI patterns. DRY reduces maintenance burden.

### IV. Visualization-First Communication (MUST)
Every analytical result requires visual representation: flowcharts for information/capital flow, tables for journal entries, graphs for relationships. Raw text only as fallback.

**Rationale**: Accounting concepts are abstract; visual representation reduces cognitive load and errors.

### V. Scenario-Centric Context (MUST)
Each analysis session binds to a specific business scenario. Global company settings inherited, scenario-specific overrides allowed. Complete audit trail: who, when, what changed in each scenario.

**Rationale**: Enables comparative analysis across scenarios and regulatory audit requirements.

## Technology Stack

### Mandatory Choices
- **Framework**: Nuxt 3 (Vue 3 + SSR/SSG flexibility)
- **Database**: PostgreSQL 15+ (JSONB for flexible AI conversation storage)
- **AI Integration**: OpenAI-compatible API (configurable endpoint + key)
- **Visualization**: Mermaid.js for flowcharts, TanStack Table for data grids
- **Deployment**: Docker + Docker Compose, single `docker-compose up` startup

### Prohibited Patterns
- No microservices (single Nuxt app with API routes)
- No ORM overhead (use `postgres` driver directly or lightweight `drizzle-orm`)
- No external auth (simple role-based, session in JWT or DB)
- No real-time WebSockets (polling sufficient for analysis sessions)

## Development Workflow

### Phase 0: Scenario Definition
Product user describes business scenario → System validates against existing科目 → AI asks clarifying questions → Structured scenario metadata stored.

### Phase 1: AI Analysis
Background AI session initiated automatically → Existing科目 + template rules provided as context → AI proposes科目 mappings and journal entries → Real-time flowchart generation → User iterates via chat interface.

### Phase 2: Rule Finalization
User confirms/modifies AI proposal → System generates sample transaction with full journal entries → Final rules persisted with version → Exportable formats (JSON, Excel, PDF report).

### Code Quality Gates
- TypeScript strict mode enabled
- Component props fully typed
- API routes validated with Zod schemas
- Database migrations tested on clean Postgres instance

## Governance

### Amendment Procedure
Constitution changes require: (1) Impact analysis on existing scenarios, (2) Version bump following semver, (3) Migration plan for in-flight analyses, (4) Documentation update in `.specify/templates/`.

### Versioning Policy
`MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes to data models or AI prompt contracts
- MINOR: New visualization types, additional export formats, new AI provider support
- PATCH: UI refinements, bug fixes, performance optimizations

### Compliance Review
Before each release: verify Docker compose works on fresh machine, verify AI prompts produce consistent structured output, verify科目 changes don't break existing scenario rules.

**Version**: 1.0.0 | **Ratified**: 2025-02-01 | **Last Amended**: 2025-02-01
