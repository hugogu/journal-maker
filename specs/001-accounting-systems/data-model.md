# Data Model: Multi-Accounting System Support

**Feature**: Multi-Accounting System Support  
**Date**: 2026-03-26  
**Phase**: Phase 1 - Design & Contracts

## Entity Relationship Diagram

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  accounting_systems │     │   system_accounts    │     │      accounts       │
├─────────────────────┤     ├──────────────────────┤     ├─────────────────────┤
│ id (PK)             │◄────┤ system_id (FK)       │     │ id (PK)             │
│ name (unique)       │     │ account_id (FK)      ├────►│ code                │
│ description         │     └──────────────────────┘     │ name                │
│ type                │                                  │ type                │
│ status              │     ┌──────────────────────┐     │ parent_id           │
│ created_at          │     │   system_rules       │     │ created_at          │
│ updated_at          │     ├──────────────────────┤     └─────────────────────┘
└─────────────────────┘     │ system_id (FK)       │
         ▲                  │ rule_id (FK)         │     ┌─────────────────────┐
         │                  └──────────────────────┘     │   journal_rules     │
         │                           │                   ├─────────────────────┤
         │                           └──────────────────►│ id (PK)             │
         │                                               │ name                │
         │                                               │ description         │
         │                                               │ conditions          │
         │                                               │ debit_account_id    │
         │                                               │ credit_account_id   │
         │                                               │ created_at          │
         │                                               └─────────────────────┘
         │
         │                  ┌──────────────────────┐
         │                  │  analysis_entries    │
         │                  ├──────────────────────┤
         └──────────────────┤ system_id (FK)       │
                            │ id (PK)              │
                            │ scenario_id (FK)     │◄────┐
                            │ subject_id           │     │
                            │ journal_entries      │     │
                            │ applied_rules        │     │
                            │ created_at           │     │
                            └──────────────────────┘     │
                                                         │
                            ┌──────────────────────┐     │
                            │      scenarios       │     │
                            ├──────────────────────┤     │
                            │ id (PK)              ├─────┘
                            │ description          │     (Shared across all systems)
                            │ status               │
                            │ created_at           │
                            └──────────────────────┘
```

## Entities

### accounting_systems

Core entity representing an accounting framework.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-gen | Unique identifier |
| name | VARCHAR(255) | NOT NULL, UNIQUE | System name (e.g., "Financial Reporting") |
| description | TEXT | nullable | System description |
| type | VARCHAR(50) | NOT NULL | 'builtin' or 'custom' |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'active' | 'active' or 'archived' |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Business Rules**:
- Built-in systems cannot be deleted (type = 'builtin')
- Name must be unique across all systems
- Archiving prevents new analyses but preserves historical data

### system_accounts (Junction)

Many-to-many relationship between systems and accounts.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| system_id | UUID | FK → accounting_systems, CASCADE | System reference |
| account_id | UUID | FK → accounts, CASCADE | Account reference |

**Business Rules**:
- Composite PK: (system_id, account_id)
- One account can belong to multiple systems
- Deleting a system removes all its account associations

### system_rules (Junction)

Many-to-many relationship between systems and journal rules.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| system_id | UUID | FK → accounting_systems, CASCADE | System reference |
| rule_id | UUID | FK → journal_rules, CASCADE | Rule reference |

**Business Rules**:
- Composite PK: (system_id, rule_id)
- Rules can be shared across systems (though typically system-specific)
- Deleting a system removes all its rule associations

### accounts (Existing - Extended)

Chart of accounts. Already exists; no schema changes needed for this feature.

**Related to this feature**:
- Accounts can belong to 0, 1, or many systems via `system_accounts`
- When analyzing for a system, only accounts linked to that system are available

### journal_rules (Existing - Extended)

Journal entry rules. Already exists; no schema changes needed for this feature.

**Related to this feature**:
- Rules can belong to 0, 1, or many systems via `system_rules`
- When analyzing for a system, only rules linked to that system are applied

### analysis_entries (Existing - Extended)

Analysis results. Extended with system reference.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| system_id | UUID | FK → accounting_systems, SET NULL | System used for analysis |

**Business Rules**:
- Each analysis entry is associated with exactly one system
- If system is deleted, analysis entries retain NULL reference (preserved for audit)
- Same scenario can have multiple analysis entries (one per system)

### system_preferences (New)

Configuration settings specific to an accounting system.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-gen | Unique identifier |
| system_id | UUID | FK → accounting_systems, CASCADE | System reference |
| key | VARCHAR(255) | NOT NULL | Preference key |
| value | JSONB | NOT NULL | Preference value (flexible structure) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Business Rules**:
- Unique constraint: (system_id, key)
- Common keys: 'recognition_criteria', 'timing_rules', 'policy_flags'
- Value stored as JSON for flexibility

## State Transitions

### Accounting System Lifecycle

```
┌─────────┐    create     ┌─────────┐    archive    ┌──────────┐
│  NONE   │ ─────────────►│ ACTIVE  │ ────────────►│ ARCHIVED │
└─────────┘               └─────────┘              └──────────┘
                               │
                               │ delete (custom only,
                               │ no analyses)
                               ▼
                          ┌─────────┐
                          │ DELETED │
                          └─────────┘
```

**Transitions**:
- **create**: New system created with status 'active'
- **archive**: System no longer available for new analyses
- **delete**: Permanently remove custom system (only if no associated analyses)
- **reactivate**: Change archived system back to active

## Validation Rules

1. **System Name Uniqueness**: Names must be unique (case-insensitive)
2. **Built-in Protection**: Systems with type='builtin' cannot be deleted
3. **Deletion Constraint**: Custom systems can only be deleted if no analysis_entries reference them
4. **Account Assignment**: When creating/editing accounts, at least one system must be selected
5. **Analysis System Requirement**: Analysis entries must reference an active system

## Indexes

```sql
-- Fast lookups by name
CREATE INDEX idx_systems_name ON accounting_systems(name);

-- Filter by type and status
CREATE INDEX idx_systems_type_status ON accounting_systems(type, status);

-- Filter accounts by system
CREATE INDEX idx_system_accounts_system ON system_accounts(system_id);
CREATE INDEX idx_system_accounts_account ON system_accounts(account_id);

-- Filter rules by system  
CREATE INDEX idx_system_rules_system ON system_rules(system_id);
CREATE INDEX idx_system_rules_rule ON system_rules(rule_id);

-- Filter analyses by system
CREATE INDEX idx_analysis_system ON analysis_entries(system_id);

-- Filter preferences by system
CREATE INDEX idx_preferences_system ON system_preferences(system_id);
```

## Data Integrity

### Referential Integrity
- All foreign keys use CASCADE for junction tables
- Analysis entries use SET NULL for system_id (preserve history)

### Application-Level Constraints
- Check for existing analyses before allowing system deletion
- Validate at least one system selected for accounts
- Prevent duplicate system names (case-insensitive check)

## Migration Strategy

### Step 1: Create tables
Create `accounting_systems`, `system_accounts`, `system_rules`, `system_preferences`

### Step 2: Seed built-in systems
Insert "Financial Reporting" and "Management Reporting" as builtin systems

### Step 3: Link existing data
Associate all existing accounts and rules with both built-in systems (migration assumption: existing data belongs to both frameworks)

### Step 4: Update analysis_entries
Add system_id column and populate with default system (Financial Reporting)

### Step 5: Application updates
Deploy code changes to use system-aware queries
