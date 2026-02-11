# Implementation Plan: Data Export (Excel/CSV)

**Branch**: `007-data-export` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-data-export/spec.md`

## Summary

Add Excel (.xlsx) and CSV export capability for confirmed accounting rules and their referenced accounts. Enhances the existing JSON-only export endpoint to support multiple formats, adds a format selection UI on the scenario detail page, and introduces bulk export with scenario selection on the scenario list page. Uses `exceljs` for Excel generation and `archiver` for ZIP bundling of CSV exports.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 24, Vue 3
**Primary Dependencies**: Nuxt 3, Drizzle ORM, exceljs (new), archiver (new)
**Storage**: PostgreSQL 15+ (existing — read-only for this feature)
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Web (server-side generation, browser download)
**Project Type**: Nuxt 3 fullstack monorepo (`apps/accountflow/`)
**Performance Goals**: Export of 50 rules completes in under 5 seconds
**Constraints**: Export must handle Unicode (Chinese characters in account names/descriptions), JSONB flattening of debit/credit entry lines
**Scale/Scope**: Typical scenario has 5-20 confirmed rules; bulk export covers up to ~10 scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Requirement | Status |
|------|-------------|--------|
| I. Lightweight Architecture | Prefer proven libraries, YAGNI | **PASS** — `exceljs` is a mature, widely-used library. No custom implementations. Only features requested. |
| II. AI-Human Collaboration | AI assists, humans decide | **PASS** — Export only touches confirmed (user-approved) rules. No AI involvement in export. |
| III. Component Reusability | No copy-paste UI code | **PASS** — Format selection dialog will be a reusable component. Export logic encapsulated in a server utility. |
| IV. Visualization-First | Every result needs visual representation | **N/A** — Export is a data extraction feature, not an analytical result. |
| V. Scenario-Centric Context | Bound to business scenario | **PASS** — Export is scenario-scoped. Multi-scenario export bundles by scenario. |
| Prohibited: No microservices | Single Nuxt app | **PASS** — Export is a Nuxt API route. |
| Prohibited: No ORM overhead | Use Drizzle or direct SQL | **PASS** — Uses existing Drizzle query patterns. |
| Phase 2 Workflow | Exportable formats (JSON, Excel, PDF) | **PASS** — Constitution explicitly lists Excel as an expected export format. |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/007-data-export/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── export-api.md    # API contract for export endpoints
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/accountflow/
├── src/
│   ├── components/
│   │   └── export/
│   │       └── FormatSelector.vue          # Reusable format selection dialog
│   ├── composables/
│   │   └── useExport.ts                    # Export composable (format selection, download trigger)
│   ├── pages/
│   │   └── scenarios/
│   │       ├── index.vue                   # Modified: add selection checkboxes + bulk export
│   │       └── [id]/
│   │           └── index.vue               # Modified: enhance export button with format selection
│   └── server/
│       ├── api/
│       │   ├── scenarios/
│       │   │   ├── [id]/
│       │   │   │   └── export.get.ts       # Modified: add xlsx/csv format support
│       │   │   └── export.post.ts          # New: bulk export for multiple scenario IDs
│       │   └── ...
│       └── utils/
│           ├── export/
│           │   ├── excel-builder.ts        # Excel workbook generation logic
│           │   ├── csv-builder.ts          # CSV generation logic
│           │   ├── data-transformer.ts     # Transform DB rows → flat export rows
│           │   └── types.ts                # Export-specific TypeScript types
│           └── schemas.ts                  # Modified: add csv to export format enum
├── tests/
│   └── export/
│       ├── data-transformer.test.ts        # Unit tests for row flattening
│       ├── excel-builder.test.ts           # Unit tests for Excel generation
│       └── csv-builder.test.ts             # Unit tests for CSV generation
└── package.json                            # Modified: add exceljs, archiver dependencies
```

**Structure Decision**: Follows existing Nuxt 3 monorepo structure. New export utilities go under `server/utils/export/` to keep export logic self-contained. A new `components/export/` directory holds the reusable format selector. Tests mirror the source structure under `tests/`.

## Complexity Tracking

No constitution violations. Table omitted.
