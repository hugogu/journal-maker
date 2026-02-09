# Data Model: Data Export (Excel/CSV)

**Feature**: 007-data-export
**Date**: 2026-02-09

## Overview

This feature does not introduce new database tables or schema changes. It reads from existing tables and transforms the data into flat export formats. This document describes the data shapes involved in the export pipeline.

## Source Entities (Existing — Read Only)

### Scenario

**Table**: `scenarios`

| Field | Type | Notes |
|-------|------|-------|
| id | serial (PK) | |
| companyId | integer (FK → company_profile) | |
| name | varchar(100) | Used in worksheet name and filename |
| description | text | |
| status | enum: draft, confirmed, archived | |
| createdAt | timestamp | |

### Account

**Table**: `accounts`

| Field | Type | Notes |
|-------|------|-------|
| id | serial (PK) | |
| companyId | integer (FK → company_profile) | |
| code | varchar(20) | Unique per company. Export key for dedup. |
| name | varchar(100) | |
| type | enum: asset, liability, equity, revenue, expense | |
| direction | enum: debit, credit, both | Normal balance direction |
| description | text | |
| parentId | integer (FK → accounts, nullable) | Not exported (flat export) |
| isActive | boolean | Exported as status column |

### Journal Rule

**Table**: `journal_rules`

| Field | Type | Notes |
|-------|------|-------|
| id | serial (PK) | |
| scenarioId | integer (FK → scenarios) | |
| eventId | integer (FK → accounting_events, nullable) | |
| ruleKey | varchar(50) | |
| eventName | varchar(100) | |
| eventDescription | text | |
| debitSide | jsonb | See JSONB structure below |
| creditSide | jsonb | See JSONB structure below |
| conditions | jsonb | Serialized as string in export |
| amountFormula | text | Rule-level formula (legacy) |
| triggerType | varchar(50) | |
| status | enum: proposal, confirmed | Filter: confirmed only |

### Accounting Event

**Table**: `accounting_events`

| Field | Type | Notes |
|-------|------|-------|
| id | serial (PK) | |
| scenarioId | integer (FK → scenarios) | |
| eventName | varchar(100) | |
| description | text | |
| eventType | varchar(50) | |

## JSONB Structures

### debitSide / creditSide

Two formats exist in the database:

**Legacy (single entry)**:
```json
{
  "accountCode": "1001",
  "accountName": "Cash",
  "amountFormula": "{{amount}}"
}
```

**Normalized (multi-entry)**:
```json
{
  "entries": [
    {
      "accountCode": "1001",
      "accountId": 5,
      "amountFormula": "{{amount}}",
      "description": "Cash receipt"
    },
    {
      "accountCode": "2201",
      "accountId": 12,
      "amountFormula": "{{amount}} * 0.13",
      "description": "VAT payable"
    }
  ]
}
```

### conditions

Free-form JSONB. Serialized to string in export (e.g., `JSON.stringify(conditions)`).

## Export Data Shapes (New — Output Only)

### ExportRuleRow

Flat row representing one debit or credit entry line from a journal rule.

| Column | Source | Type |
|--------|--------|------|
| Scenario | `scenarios.name` | string |
| Event Name | `journal_rules.eventName` or `accounting_events.eventName` | string |
| Event Description | `journal_rules.eventDescription` or `accounting_events.description` | string |
| Rule Key | `journal_rules.ruleKey` | string |
| Side | Derived: "Debit" or "Credit" | string |
| Account Code | `debitSide/creditSide → accountCode` | string |
| Account Name | `debitSide/creditSide → accountName` or joined from `accounts.name` | string |
| Amount Formula | `debitSide/creditSide → amountFormula` or `journal_rules.amountFormula` | string |
| Conditions | `JSON.stringify(journal_rules.conditions)` | string |
| Trigger Type | `journal_rules.triggerType` | string |

### ExportAccountRow

Flat row representing one account entry.

| Column | Source | Type |
|--------|--------|------|
| Account Code | `accounts.code` | string |
| Account Name | `accounts.name` | string |
| Account Type | `accounts.type` | string |
| Normal Direction | `accounts.direction` | string |
| Description | `accounts.description` | string |
| Active | `accounts.isActive` → "Yes" / "No" | string |

## Data Flow

```
Request (scenario IDs + format)
  ↓
Query: journal_rules WHERE status='confirmed' AND scenarioId IN (...)
  ↓
Query: accounts WHERE code IN (extracted account codes from rules) AND companyId = ...
  ↓
Transform: Flatten debitSide/creditSide JSONB → ExportRuleRow[]
Transform: Map accounts → ExportAccountRow[] (deduplicate by code)
  ↓
Build: Excel workbook (multi-sheet) OR CSV files (+ ZIP if multiple)
  ↓
Response: Binary file download with Content-Disposition header
```

## Validation Rules

- **scenarioId**: Must exist and belong to the requesting user's company
- **format**: Must be one of: `json`, `xlsx`, `csv`
- **scenarioIds** (bulk): Array of 1-50 integers, all must belong to same company
- **No write operations**: Export is strictly read-only
