# Codebase Analysis & Next Steps

> Generated 2026-02-09 based on full codebase review.
> Goal: Internal tool for Product/Engineering to design accounting rules with AI, producing professional output for Finance team communication.

## Current State Summary

### What's Built & Working
- **Core AI Analysis Workflow**: Create scenario → Chat with AI (streaming) → Extract structured artifacts (subjects, rules, diagrams) → Confirm results
- **Multi-Provider AI**: OpenAI, Azure, Ollama, custom endpoints with factory pattern
- **Dual-Pane Analysis UI**: Chat on left, confirmed state (grouped by event) on right
- **Prompt Management**: Template versioning, variable substitution, scenario-type routing
- **Chart of Accounts**: Full CRUD with hierarchy, type filtering, search
- **Conversation Features**: DB persistence, export (JSON/Markdown), share links, request/response logging
- **Admin Panel**: AI provider CRUD, model discovery, company profile, prompt editor

### What's Incomplete
- **Spec 006 (Accounting Events)**: ~60% done — schema exists, UI groups by event, but event CRUD/merge and auto-creation from AI are missing
- **Authentication**: Stubbed (`userId = 1` everywhere), no session middleware
- **Prompt Editor Page**: `/admin/prompts/new` is empty scaffold
- **Toast Notifications**: Uses `alert()` instead of proper notification system
- **Test Coverage**: Only 3 test files (schemas, function-calling, one E2E)

### Tech Stack
Nuxt 3 + Vue 3 + TypeScript (strict) | Tailwind CSS | PostgreSQL + Drizzle ORM | OpenAI SDK | Zod validation | Mermaid.js | TanStack Vue Table

---

## Recommended Next Steps (Priority Order)

### 1. Standardized Professional Export
**Impact: High | Effort: Medium**

Current export is raw JSON/Markdown. Finance teams need:
- **Accounting Policy Document**: Structured document per scenario with event descriptions, journal rules (debit/credit with account codes), conditions, flow diagrams, chart of accounts summary
- **Excel/CSV Export**: Tabular journal rules — Event, Condition, Debit Account (Code+Name), Credit Account (Code+Name), Amount Formula, Notes
- **Diagram-as-image**: Render Mermaid flowcharts as static images for presentations

*Rationale: Directly serves the Finance communication goal. The tool's value is only realized when output can be shared professionally.*

### 2. Guided Analysis Mode
**Impact: High | Effort: Medium**

Non-accounting users face a blank chat with no guidance:
- **Industry/Type Templates**: Pre-built scenario starters (SaaS Revenue, E-commerce Orders, Loan Disbursement) with descriptions and suggested questions
- **Guided Question Flow**: After scenario creation, suggest a sequence of prompts ("What triggers this event?", "What are the financial impacts?", "Timing differences?")
- **Accounting Glossary/Tooltips**: Inline explanations for accounting terms in AI responses

*Rationale: Removes the primary adoption barrier — users don't know what to ask or how to evaluate AI output.*

### 3. Complete Accounting Events (Spec 006)
**Impact: Medium | Effort: Low**

Infrastructure exists but workflow is incomplete:
- Implement event CRUD endpoints (create, update, delete)
- Auto-create events during AI response parsing
- Event merge UI completion
- Link all rules/entries to events during confirmation

*Rationale: Events are how Finance thinks about accounting. Clean event grouping makes output professional.*

### 4. Rule Review & Validation Workflow
**Impact: High | Effort: Higher**

Current flow lacks quality gates:
- **Status tracking**: Draft → Under Review → Approved, with attribution
- **Inline rule editing**: Modify AI-proposed rules before confirming
- **Balance validation**: Every entry must have balancing debits and credits
- **Cross-scenario comparison**: Side-by-side rule comparison for related scenarios

*Rationale: Builds trust in AI output before sharing with Finance.*

### 5. Multi-Scenario Dashboard
**Impact: Medium | Effort: Medium**

As content grows, users need:
- Coverage matrix (which scenarios analyzed, status)
- Account usage map across scenarios
- Cross-scenario search

### 6. Authentication & Multi-User
**Impact: Necessary | Effort: Medium**

Required for team adoption:
- Session-based auth (SSO or simple password)
- Track who created/confirmed/modified what
- Role separation (admin vs. user)

---

## Deprioritized Items
- E2E test suite (feature set still evolving)
- Ollama/custom provider polish (OpenAI/Azure cover practical needs)
- Advanced prompt generation UI (existing versioning is sufficient)
- CORS/CSRF/rate limiting (internal tool)

---

## Architecture Notes for Future Work

### Key Files to Understand
| Area | Files |
|------|-------|
| AI Integration | `src/server/utils/ai-service.ts`, `src/server/utils/ai-adapters/` |
| Response Parsing | `src/server/utils/ai-response-parser.ts` |
| Chat Streaming | `src/server/api/scenarios/[id]/chat.stream.ts` |
| Analysis State | `src/composables/useConfirmedAnalysis.ts`, `src/components/analysis/StatePane.vue` |
| Database Schema | `src/server/db/schema.ts` |
| Validation | `src/server/utils/schemas.ts` |

### Patterns to Follow
- **Factory pattern** for new adapters/exporters
- **Composable pattern** for new frontend state
- **Zod schemas** for all new API input validation
- **Drizzle queries** in dedicated files under `server/db/queries/`
