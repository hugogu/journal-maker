# Research: AI辅助会计规则分析工具技术决策

**Feature**: AI辅助会计规则分析工具 MVP  
**Date**: 2025-02-01  
**Status**: Phase 0 Complete

---

## Technology Decisions

### 1. Framework: Nuxt 3

**Decision**: Use Nuxt 3.15+ as the application framework

**Rationale**:
- Constitution mandates Nuxt 3 for Vue 3 + SSR/SSG flexibility
- Server API routes enable secure AI API calls (keys stay server-side)
- File-based routing reduces boilerplate
- Built-in TypeScript support
- Hot Module Replacement for fast development

**Alternatives considered**:
- **Next.js**: Good option but team preference for Vue ecosystem
- **SvelteKit**: Lightweight but smaller ecosystem for visualization libraries
- **Pure Vue 3 + Express**: More setup, loses Nuxt conventions and auto-imports

---

### 2. Database: PostgreSQL 15+ with drizzle-orm

**Decision**: PostgreSQL 15+ with drizzle-orm 0.30+

**Rationale**:
- Constitution requires PostgreSQL for JSONB flexible storage
- drizzle-orm is lightweight (Constitution prohibits "ORM overhead")
- Type-safe SQL with TypeScript inference
- Migration support via drizzle-kit
- JSONB columns for AI conversation and flowchart data (semi-structured)

**Schema approach**:
- Relational tables for core entities (accounts, scenarios, users)
- JSONB for: conversation messages, flowchart node positions, AI raw responses
- Enums for: account types, scenario status, user roles

**Alternatives considered**:
- **Prisma**: Too heavy, generates large client
- **Raw postgres driver**: No type safety, manual migration handling
- **MongoDB**: Constitution specifies PostgreSQL

---

### 3. AI Integration: OpenAI SDK with Streaming

**Decision**: OpenAI SDK 4.x with streaming support

**Rationale**:
- Constitution requires OpenAI-compatible API
- Server-side calls only (API key in `.env`, never exposed to client)
- Streaming responses for real-time chat feel
- Structured output via function calling or constrained prompts

**AI Architecture**:
- **System Prompt Template**: Versioned in database, variables replaced at runtime
- **Context Assembly**: Company info + Accounts list + Example scenario (if exists) + Current scenario
- **Response Parsing**: Zod schemas validate AI structured output
- **Fallback**: Raw text display if parsing fails (Constitution IV - text fallback)

**Prompt Engineering Strategy**:
- Use XML/JSON tags to constrain output format
- Multi-turn conversation for clarification questions
- Separate prompt for sample transaction generation (background job)

**Alternatives considered**:
- **Vercel AI SDK**: Nice abstractions but adds dependency, Nuxt server routes sufficient
- **LangChain**: Too heavy for our use case, Constitution says lightweight

---

### 4. Visualization: Mermaid.js + TanStack Table

**Decision**: Mermaid 11.x for flowcharts, @tanstack/vue-table for data grids

**Rationale**:
- Constitution mandates Mermaid.js for flowcharts
- Text-based flowchart definition (Mermaid syntax) stores efficiently
- TanStack Table for accounting tables (sorting, filtering, exporting built-in)
- Both are proven, well-maintained libraries

**Flowchart Implementation**:
- AI generates Mermaid syntax in structured output
- Client-side rendering with `mermaid.render()`
- Pan/zoom with CSS transforms or mermaid panZoom plugin
- Node click events mapped to accounting entries

**Data Tables**:
- Account management table (CRUD inline)
- Journal entry rules table
- Sample transaction timeline table

**Alternatives considered**:
- **D3.js**: Too low-level, more code
- **Cytoscape.js**: Good for graphs but Mermaid simpler for flowcharts
- **Vue Good Table**: Less feature-rich than TanStack

---

### 5. Export: JSON + Excel

**Decision**: Native JSON + xlsx library for Excel export

**Rationale**:
- Constitution requires JSON and Excel export
- `xlsx` (SheetJS) is standard, can generate from browser
- JSON export is trivial with `JSON.stringify`
- File naming: `{scenario_name}_v{version}_{date}.{ext}`

**Export Contents**:
- **JSON**: Complete scenario object with accounts, mappings, rules, sample transaction
- **Excel**: Multiple sheets (科目表, 分录规则, 示例交易)

**Alternatives considered**:
- **CSV**: Excel can open, but loses formatting and multiple sheets
- **PDF**: Nice for reports but harder to parse, not required for MVP

---

### 6. Testing Strategy

**Decision**: Vitest + Playwright + MSW

**Rationale**:
- Vitest: Fast, Vite-native, Jest-compatible API
- Playwright: E2E testing for critical user flows (scenario creation, AI analysis)
- MSW: Mock AI API responses for offline development

**Test Coverage**:
- **Unit**: AI response parser, flowchart generator, export utilities
- **E2E**: Complete user journeys (admin setup, product analysis, export)
- **Contract**: API route validation

**Mock AI Mode**:
- Environment variable `MOCK_AI=true`
- Pre-recorded responses for common scenarios
- Enables offline development and CI testing

---

### 7. Deployment: Docker Compose

**Decision**: Single `docker-compose.yml` with Nuxt + Postgres

**Rationale**:
- Constitution mandates Docker single-command deployment
- Multi-stage Dockerfile (build + production)
- Postgres in separate container with volume persistence
- Environment variables for AI config

**Services**:
- `app`: Nuxt app, port 3000, depends on db
- `db`: Postgres 15, port 5432, volume for data persistence

**Development**:
- `docker-compose up` starts both services
- Local Node.js dev server also supported (direct Postgres connection)

---

## Open Questions Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| How to handle AI API failures? | Retry 3x with exponential backoff, then show error with raw response | Graceful degradation, user can retry |
| Where to store API keys? | Server-side only in database (encrypted), never client-side | Security, Constitution II |
| How to version prompts? | Database table with version field, active version flag | Audit trail, rollback capability |
| Real-time flowchart updates? | Parse each AI chunk, update if valid Mermaid syntax | Streaming feel without WebSockets |
| Offline development? | MSW mocks for AI endpoints, seed data for scenarios | Constitution: lightweight dev setup |

---

## Phase 0 Complete

All technical decisions made. Proceeding to Phase 1: Data Model Design.
