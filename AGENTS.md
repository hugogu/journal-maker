# journal-maker Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-26

## Active Technologies

- TypeScript 5.x (strict mode) + Nuxt 3 (Vue 3 + Nitro), Drizzle ORM, OpenAI SDK, Zod, TanStack Vue Table, Mermaid.js (001-accounting-systems)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode): Follow standard conventions

## Recent Changes

- 001-accounting-systems: Added TypeScript 5.x (strict mode) + Nuxt 3 (Vue 3 + Nitro), Drizzle ORM, OpenAI SDK, Zod, TanStack Vue Table, Mermaid.js

<!-- MANUAL ADDITIONS START -->

## Database Schema Design (Critical Business Logic)

### Rules Storage - Two Tables, Different Purposes

**⚠️ IMPORTANT**: There are TWO tables storing rules/entries, but they serve COMPLETELY DIFFERENT purposes. Do NOT confuse them or implement dual-write logic.

#### 1. `journal_rules` - Reusable Rule Library
- **Purpose**: User-created rules or rules "saved" from AI analysis to the library
- **UI Location**: Rule management page (`/journal-rules`)
- **Lifecycle**: Long-term storage, reusable across scenarios
- **Key Fields**: 
  - `debitSide`/`creditSide` (JSONB with structured entries)
  - `status` (proposal/confirmed enum)
  - `amountFormula` (text for calculations)
- **System Association**: Via `system_rules` junction table to `accounting_systems`
- **When to Write**: Only when user explicitly clicks "Save Rules" button in StatePane

#### 2. `analysis_entries` - AI Analysis Archive
- **Purpose**: Snapshot of each AI analysis result
- **UI Location**: Analysis confirmation page (`/scenarios/[id]/analyze`)
- **Lifecycle**: Bound to specific message, for historical reference only
- **Key Fields**:
  - `lines` (JSONB array of entry lines)
  - `isConfirmed` (boolean)
  - `systemId` (direct foreign key)
- **When to Write**: Only when user clicks "Confirm Analysis" button

### Business Logic Flow

```
AI generates rules
    ↓
Displayed in analysis page (temporary state)
    ↓
User action branches:
    ├─ "Confirm Analysis Result" → Save to analysis_entries (historical record)
    └─ "Save to Rule Library" → Save to journal_rules (reusable rules)
```

### Code Implementation Rules

1. **StatePane.vue** "Save All Rules" button calls `/api/journal-rules/batch` with `systemIds` - this is the ONLY path to write to `journal_rules`

2. **Confirmed analysis** API (`confirmed-analysis.post.ts`) ONLY writes to `analysis_entries` via `saveAndConfirmAnalysis()` - NEVER write to `journal_rules` here

3. **Rule management page** (`journal-rules/index.get.ts`) queries `journal_rules` with optional system filtering via `system_rules` junction table

### Anti-Patterns to Avoid

- ❌ Do NOT implement dual-write (writing same data to both tables)
- ❌ Do NOT call `saveRulesToJournalRules()` in `confirmMessage` or confirmed-analysis endpoints
- ❌ Do NOT confuse `analysis_entries.lines` with `journal_rules.debitSide/creditSide` - they have different schemas

### Migration History

Both tables were created in the same initial migration (`0000_init_with_comments.sql`):
- `journal_rules` (line 147): For rule management library
- `analysis_entries` (line 295): For AI analysis archiving

<!-- MANUAL ADDITIONS END -->
