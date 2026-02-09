# Quickstart: Data Export (Excel/CSV)

**Feature**: 007-data-export
**Date**: 2026-02-09

## Prerequisites

- Node.js 24+ installed
- PostgreSQL 15+ running with seeded data (at least one scenario with confirmed rules)
- Working `apps/accountflow/.env` with `DATABASE_URL`

## Setup

```bash
cd apps/accountflow

# Install new dependencies
npm install exceljs archiver
npm install -D @types/archiver

# Start dev server
npm run dev
```

## Verify

### Single Scenario Export

1. Open `http://localhost:3000/scenarios`
2. Click into a scenario that has confirmed rules
3. Click the "Export Data" button
4. Select "Excel (.xlsx)" from the format selector
5. Verify the downloaded `.xlsx` file opens correctly with:
   - "Accounts" worksheet listing referenced accounts
   - "Rules" worksheet listing confirmed rules (one row per entry line)

### CSV Export

1. Same as above, but select "CSV (.csv)"
2. Verify the downloaded `.zip` contains `accounts.csv` and `rules.csv`
3. Open each CSV in a spreadsheet app — Chinese characters should render correctly

### Bulk Export

1. Go to `http://localhost:3000/scenarios`
2. Check 2+ scenarios using the selection checkboxes
3. Click "Export Selected"
4. Choose a format and download
5. Verify the file includes data from all selected scenarios

### API Testing (curl)

```bash
# Single scenario export (Excel)
curl -o export.xlsx "http://localhost:3000/api/scenarios/1/export?format=xlsx"

# Single scenario export (CSV)
curl -o export.zip "http://localhost:3000/api/scenarios/1/export?format=csv"

# Bulk export
curl -X POST -H "Content-Type: application/json" \
  -d '{"scenarioIds": [1, 2], "format": "xlsx"}' \
  -o bulk-export.xlsx \
  "http://localhost:3000/api/scenarios/export"
```

## Run Tests

```bash
cd apps/accountflow

# Unit tests for export utilities
npm run test -- --run tests/export/

# All tests
npm run test
```

## Key Files

| File | Purpose |
|------|---------|
| `src/server/api/scenarios/[id]/export.get.ts` | Single scenario export endpoint (enhanced) |
| `src/server/api/scenarios/export.post.ts` | Bulk export endpoint (new) |
| `src/server/utils/export/excel-builder.ts` | Excel workbook generation |
| `src/server/utils/export/csv-builder.ts` | CSV generation + ZIP bundling |
| `src/server/utils/export/data-transformer.ts` | DB rows → flat export rows |
| `src/components/export/FormatSelector.vue` | Format selection dialog component |
| `src/composables/useExport.ts` | Client-side export composable |
