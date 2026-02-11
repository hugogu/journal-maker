# Research: Data Export (Excel/CSV)

**Feature**: 007-data-export
**Date**: 2026-02-09

## R1: Excel Generation Library

**Decision**: Use `exceljs` for server-side Excel (.xlsx) generation.

**Rationale**:
- Mature library with active maintenance, 14k+ GitHub stars
- Supports streaming workbook generation (memory-efficient for large exports)
- Full worksheet, styling, and multi-sheet support out of the box
- TypeScript types included
- Works in Node.js server environment (Nitro/Nuxt API routes)
- Lighter than `xlsx` (SheetJS) for write-only use cases

**Alternatives considered**:
- `xlsx` (SheetJS): Larger bundle, community edition has limited write support, pro version requires license
- `json2csv` + manual XLSX: Would require assembling XLSX format manually — unnecessary complexity
- Client-side generation: Would move large data to the browser; server-side is more efficient and secure

## R2: CSV Generation Approach

**Decision**: Use built-in string concatenation with proper RFC 4180 escaping. No library needed.

**Rationale**:
- CSV is a simple format — field quoting, comma separation, newline handling
- No library overhead for a straightforward task
- Full control over encoding (UTF-8 with BOM for Excel compatibility)
- Existing Node.js string/buffer APIs are sufficient

**Alternatives considered**:
- `papaparse`: Primarily a parser; overkill for generation
- `csv-stringify`: Good library but adds a dependency for trivial functionality
- `json2csv`: Reasonable but adds dependency for something achievable in ~30 lines

## R3: ZIP Bundling for Multi-CSV Export

**Decision**: Use `archiver` for creating ZIP archives when exporting multiple CSV files.

**Rationale**:
- Standard library for ZIP creation in Node.js (5k+ stars)
- Supports streaming (pipe to response)
- Well-documented, stable API
- Needed only for CSV multi-file exports (Excel handles multi-sheet natively)

**Alternatives considered**:
- `jszip`: More commonly used client-side; `archiver` is better for server-side streaming
- `yazl`: Lower-level, requires more manual work
- Tar/gzip: Less universally accessible than ZIP for end users

## R4: Data Source for Export

**Decision**: Query from `journalRules` table (status='confirmed') and join to `accounts` table. Do NOT use the `analysisSubjects`/`analysisEntries` normalized tables.

**Rationale**:
- The `journalRules` table is the canonical storage for rules with a clear `status` enum ('proposal' | 'confirmed')
- The `accounts` table is the canonical chart of accounts with full metadata (code, name, type, direction, isActive)
- The `analysisSubjects`/`analysisEntries` tables are analysis-layer artifacts used for the "confirmed analysis" UI view, but they duplicate data from the primary tables
- Querying `journalRules` directly with `status = 'confirmed'` is the most straightforward and reliable approach
- Account references are resolved via `debitSide`/`creditSide` JSONB fields (which contain `accountCode`) joined to `accounts.code`

**Alternatives considered**:
- Query `analysisEntries` + `analysisSubjects`: These are analysis artifacts, not the ground truth. They may not include all confirmed rules if the analysis flow was bypassed.
- Query both and merge: Over-engineered, creates ambiguity about which is the source of truth.

## R5: JSONB Flattening Strategy

**Decision**: Flatten `debitSide` and `creditSide` JSONB structures into individual rows at the server utility level (in `data-transformer.ts`).

**Rationale**:
- Each rule's `debitSide`/`creditSide` can contain a single entry (legacy format: `{ accountCode, accountName, amountFormula }`) or an array of entries (new format: `{ entries: [...] }`)
- The transformer must handle both formats gracefully
- Each entry line becomes its own row in the export, tagged with "Debit" or "Credit" side
- Rule-level fields (eventName, conditions, etc.) are repeated on each flattened row

**Schema awareness**:
- Legacy format: `debitSide: { accountCode: "1001", accountName: "Cash", amountFormula: "{{amount}}" }`
- New format: `debitSide: { entries: [{ accountCode: "1001", accountId: 5, amountFormula: "{{amount}}" }, ...] }`
- Transformer must detect which format and normalize accordingly

## R6: Filename and Encoding

**Decision**:
- Filenames: Sanitize using a regex that preserves Chinese characters. Pattern: replace control characters and filesystem-unsafe characters only.
- Encoding: UTF-8 with BOM (`\uFEFF` prefix) for CSV files to ensure Excel opens them correctly with Chinese text.

**Rationale**:
- Current export uses `/[^a-zA-Z0-9\-_]/g` which strips Chinese characters — not acceptable for this app
- A safer pattern: `/[<>:"/\\|?*\x00-\x1f]/g` which only removes filesystem-dangerous characters
- BOM is required because Excel defaults to ANSI encoding when opening CSV without BOM

## R7: Bulk Export API Design

**Decision**: New `POST /api/scenarios/export` endpoint accepting an array of scenario IDs in the request body.

**Rationale**:
- GET with query params is awkward for variable-length ID lists
- POST body cleanly expresses `{ scenarioIds: [1, 2, 3], format: 'xlsx' | 'csv' }`
- Reuses the same server-side export utilities as single-scenario export
- Single-scenario export remains at `GET /api/scenarios/:id/export?format=xlsx|csv|json` for backward compatibility

**Alternatives considered**:
- `GET /api/scenarios/export?ids=1,2,3`: URL length limits, awkward parsing
- WebSocket streaming: Over-engineered for this use case
