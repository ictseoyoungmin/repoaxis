# V47-R01 — Live data wiring

Date: 2026-09-04

## Contract

- The supplied v47 UI/UX remains the canonical shell.
- The adapter is appended after a protected canonical prefix whose SHA-256 is `f473d2ef3e7945c03ead7ead99d6df72529a1e034111043fd6eb46925c862673`; the pre-apply R00 file is also verified against `74378ad9bb5b1c5304b989174454d71a38cd1f9c7538a4bff410f35469a01507`.
- R01 changes the data/projection seam only; it does not redesign Structure, Dependencies, Changes, Graph, Inspector, Git overlay, routing, or interaction semantics.

## Live inputs

The canonical single-file viewer consumes:

- `/api/index`
- `/api/meta`
- `/api/history`

Repoaxis nodes adapt into the existing v47 `tree` shape; canonical `contains` edges establish parentage and the synthetic `root` remains the visual anchor. Canonical `imports` edges feed Dependencies and Graph without a second viewer model. Working/staged changes and HEAD changes replace prototype Git fixtures. Repository name, host, branch, HEAD SHA, commit context, Inspector last-commit context, and Git overlay context are live.

## Scale projection seam

The live repository is materially larger than the prototype fixture, so adapter inputs are projected without replacing the canonical renderers:

- Structure Whole topology projects folders plus root-level files; focused Structure still uses the full containment tree.
- Dependencies remains a single-root bounded canonical import projection.
- Graph lays out files participating in canonical imports, grouped by first path scope such as `skills/`, `dev/`, and root scope. Members are degree-ordered so the initial high-connectivity root remains reacquirable in the first viewport.
- Changes uses the actual working-tree projection.

## Final browser evidence

Final Chromium QA before removing the temporary QA harness:

- branch HEAD: `f1728844fd0111b753536607ff5488a7caf2f511`
- workflow run: `33788344631`
- artifact: `9906322905`
- viewport: `1600×1000`

Observed live metrics:

- 473 indexed non-root nodes
- 142 files
- 94 canonical import edges
- Structure Whole topology: 40 rendered nodes including root; header count 39
- Dependencies: 22 rendered dependency nodes; header count 22
- Graph: 53 import-participating files
- Changes: 0 rows on the clean verification branch
- selected dependency/graph root: `skills/repoaxis/lib/indexer.mjs`
- repository identity: `ictseoyoungmin/repoaxis`
- browser/page console errors: 0
- horizontal page overflow: false

Visual review confirmed that Structure no longer collapses into the full-symbol column seen in the first R01 run; Dependencies remains readable; Graph is separated into live path scopes and shows `indexer.mjs` selected in the initial viewport; and Changes renders the canonical clean empty-state surface.

## Regression / packaging

The live adapter, scale projection seam, graph scope finalization, and Dependencies count fix passed:

- `npm run check`
- `npm run release:dry-run`

Temporary patch runners and Chromium QA workflow/tool files were removed before PR preparation.
