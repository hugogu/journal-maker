# Research: Multi-Accounting System Support

**Feature**: Multi-Accounting System Support  
**Date**: 2026-03-26  
**Phase**: Phase 0 - Research & Outline

## Research Questions

### Q1: How should accounts and rules relate to accounting systems?

**Context**: Accounts and journal rules need to be scoped to specific systems, but some may be shared (e.g., common accounts like Cash).

**Decision**: Many-to-many relationship with system-scoped analysis

**Rationale**:
- Accounts can belong to multiple systems (e.g., "Cash" exists in both Financial and Management reporting)
- Rules are system-specific (different recognition criteria)
- Analysis results must reference the specific system used
- This allows flexibility while maintaining data integrity

**Implementation approach**:
- Junction tables: `system_accounts` and `system_rules`
- Analysis entries include `system_id` reference
- Queries filter by selected system context

**Alternatives considered**:
- Option A: Separate account tables per system (rejected - duplication, harder to maintain shared accounts)
- Option B: Single table with JSON system assignments (rejected - harder to query, no referential integrity)
- Option C: Many-to-many with full separation (selected - best balance of flexibility and integrity)

---

### Q2: How to integrate system context into AI prompts?

**Context**: AI needs to know which accounting system is active to generate appropriate journal entries and rules.

**Decision**: Include system context in conversation thread and rule generation prompts

**Rationale**:
- System selection is made before analysis starts
- Context must persist through the conversation
- AI should use only accounts from the selected system
- Constitution requires structured AI responses

**Implementation approach**:
- Add `system_id` to conversation metadata
- Prompt template includes: "You are analyzing for [System Name] accounting system. Available accounts: [...]"
- Filter account list by system membership before sending to AI
- Cache system context in conversation state

**Alternatives considered**:
- Option A: Global system setting (rejected - users may compare multiple systems)
- Option B: System context only at start (rejected - context needed throughout conversation)
- Option C: Per-message system parameter (selected - most flexible, allows comparison)

---

### Q3: How to implement cross-system comparison?

**Context**: Users need to compare how the same event is treated differently across systems.

**Decision**: Side-by-side diff view with visual highlighting

**Rationale**:
- Constitution requires visualization-first approach
- Differences in accounts, amounts, and timing need clear presentation
- Side-by-side allows direct comparison
- Mermaid.js can show flowchart differences

**Implementation approach**:
- Store analysis results per system per scenario
- Comparison endpoint accepts two system IDs
- Frontend uses split-pane layout
- Diff highlighting: green (added), red (removed), yellow (modified)
- Show rule/preference that caused each difference

**Alternatives considered**:
- Option A: Tab-based switching (rejected - harder to compare)
- Option B: Overlay comparison (rejected - too complex for journal entries)
- Option C: Side-by-side with diff (selected - clearest visualization)

---

### Q4: Database schema design for system-aware entities?

**Context**: Need to add system support to existing accounts and rules tables.

**Decision**: Add `systems` table with junction tables for many-to-many relationships

**Schema design**:
```sql
-- Core system table
CREATE TABLE accounting_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('builtin', 'custom')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction: Systems <-> Accounts
CREATE TABLE system_accounts (
  system_id UUID REFERENCES accounting_systems(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (system_id, account_id)
);

-- Junction: Systems <-> Rules  
CREATE TABLE system_rules (
  system_id UUID REFERENCES accounting_systems(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES journal_rules(id) ON DELETE CASCADE,
  PRIMARY KEY (system_id, rule_id)
);

-- Analysis results reference system
ALTER TABLE analysis_entries ADD COLUMN system_id UUID REFERENCES accounting_systems(id);
```

**Rationale**:
- Junction tables provide clean many-to-many relationships
- System type (builtin/custom) protects built-in systems from deletion
- Analysis entries track which system was used
- Foreign keys ensure referential integrity

---

### Q5: UI component strategy for system selection?

**Context**: System selector needs to appear in multiple places (analysis page, admin pages).

**Decision**: Reusable `SystemSelector` component with global state

**Implementation approach**:
- Component: `components/accounting/SystemSelector.vue`
- Props: `modelValue` (selected system), `allowCreate` (show "+ New System" option)
- Emits: `update:modelValue`, `create`
- Global state via Pinia store: `stores/system.ts`
- Persist selection in localStorage for user preference

**Placement**:
- Analysis page: Prominent header position, system name + icon
- Admin pages: System management dropdown
- Account/Rule management: Filter by system selector

**Rationale**:
- Constitution emphasizes component reusability
- Consistent UX across pages
- Global state prevents prop drilling
- LocalStorage persistence improves UX

---

## Research Summary

All technical questions resolved through analysis of:
1. Existing codebase patterns (Drizzle ORM, Nuxt 3)
2. Constitution principles (lightweight, visualization-first)
3. Domain requirements (financial vs management reporting)

**No NEEDS CLARIFICATION items remain**.

**Key architectural decisions**:
- Many-to-many relationships via junction tables
- System context in AI prompts via conversation metadata
- Side-by-side comparison with diff visualization
- Reusable SystemSelector component with global state

**Next phase readiness**: ✓ Ready for Phase 1 (Design & Contracts)
