# API Contract: Data Export

**Feature**: 007-data-export
**Date**: 2026-02-09

## Endpoints

### 1. Single Scenario Export

**Endpoint**: `GET /api/scenarios/:id/export`

Enhances the existing endpoint to support xlsx and csv formats in addition to json.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| format | `"json" \| "xlsx" \| "csv"` | No | `"json"` | Export file format |

**Response (format=xlsx)**:
- Status: `200 OK`
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="{scenario-name}-export.xlsx"`
- Body: Binary XLSX file

**Response (format=csv, single scenario)**:
- Status: `200 OK`
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="{scenario-name}-export.zip"`
- Body: ZIP archive containing:
  - `accounts.csv` — Referenced accounts
  - `rules.csv` — Confirmed journal rules (flattened)

**Response (format=json)**:
- Unchanged from current behavior

**Error Responses**:

| Status | Condition |
|--------|-----------|
| 400 | Invalid format parameter |
| 404 | Scenario not found |
| 200 | Empty export: `{ success: true, data: null, message: "No confirmed rules found" }` (json only) |

For xlsx/csv with no confirmed rules, returns:
- Status: `200 OK`
- Content-Type: `application/json`
- Body: `{ success: false, message: "No confirmed rules to export for this scenario" }`

---

### 2. Bulk Scenario Export

**Endpoint**: `POST /api/scenarios/export`

New endpoint for exporting confirmed data from multiple scenarios at once.

**Request Body**:

```json
{
  "scenarioIds": [1, 2, 3],
  "format": "xlsx"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| scenarioIds | `number[]` | Yes | Array of scenario IDs (1-50) |
| format | `"xlsx" \| "csv"` | Yes | Export format (json not supported for bulk) |

**Response (format=xlsx)**:
- Status: `200 OK`
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="scenarios-export-{YYYY-MM-DD}.xlsx"`
- Body: Binary XLSX file with:
  - "Accounts" worksheet — All referenced accounts (deduplicated)
  - "{Scenario Name}" worksheet per scenario — Confirmed rules (flattened)

**Response (format=csv)**:
- Status: `200 OK`
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="scenarios-export-{YYYY-MM-DD}.zip"`
- Body: ZIP archive containing:
  - `accounts.csv` — All referenced accounts (deduplicated)
  - `{scenario-name}-rules.csv` per scenario — Confirmed rules

**Error Responses**:

| Status | Condition |
|--------|-----------|
| 400 | Missing or empty scenarioIds, invalid format, more than 50 IDs |
| 400 | `{ success: false, message: "No confirmed rules found in any selected scenario" }` |
| 404 | One or more scenario IDs not found or not accessible |

---

## Request Validation Schemas

### Single Export Query (Zod)

```typescript
const exportQuerySchema = z.object({
  format: z.enum(['json', 'xlsx', 'csv']).default('json'),
})
```

### Bulk Export Body (Zod)

```typescript
const bulkExportSchema = z.object({
  scenarioIds: z.array(z.number().int().positive()).min(1).max(50),
  format: z.enum(['xlsx', 'csv']),
})
```

---

## Excel Workbook Structure

### Single Scenario Export

| Worksheet | Description |
|-----------|-------------|
| Accounts | Referenced accounts with columns: Code, Name, Type, Direction, Description, Active |
| Rules | Flattened rule rows with columns: Event Name, Event Description, Rule Key, Side, Account Code, Account Name, Amount Formula, Conditions, Trigger Type |

### Multi-Scenario Export

| Worksheet | Description |
|-----------|-------------|
| Accounts | Union of all referenced accounts (deduplicated by code) |
| {Scenario 1 Name} | Flattened rules for scenario 1 |
| {Scenario 2 Name} | Flattened rules for scenario 2 |
| ... | One worksheet per scenario with confirmed rules |

Worksheet names are truncated to 31 characters (Excel limit) with a numeric suffix for duplicates.

---

## CSV File Structure

### accounts.csv

```csv
Account Code,Account Name,Account Type,Normal Direction,Description,Active
1001,Cash,asset,debit,"Company cash account",Yes
2201,VAT Payable,liability,credit,"Value-added tax payable",Yes
```

### rules.csv / {scenario-name}-rules.csv

```csv
Scenario,Event Name,Event Description,Rule Key,Side,Account Code,Account Name,Amount Formula,Conditions,Trigger Type
Purchase Order,Goods Receipt,Receive goods from supplier,GR-001,Debit,1401,Inventory,"{{amount}}","{}",automatic
Purchase Order,Goods Receipt,Receive goods from supplier,GR-001,Credit,2201,Accounts Payable,"{{amount}}","{}",automatic
```

All CSV files:
- UTF-8 encoding with BOM (`\uFEFF` prefix)
- RFC 4180 compliant (fields containing commas, quotes, or newlines are double-quoted)
- Header row included
