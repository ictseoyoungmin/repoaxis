# Structure semantic zoom visual QA

Scope: restore the original Structure interaction quality after whole-map selection made the repository topology visually unreadable.

## Contract

- Structure keeps repository-level context in the same surface.
- The overview is compact: root plus top-level repository entries are visible as glyphs rather than rendering the entire repository as tiny unreadable nodes.
- Selecting a branch progressively expands the real containment path in-place.
- At semantic-detail zoom, the selected node and its useful neighborhood become readable icon/text/Git-status cards.
- Deep selections use their own real containment node and coordinate. No ancestor-position selection card is used.
- Fit returns the expanded semantic projection to compact glyph presentation.
- `Focus selection` remains an explicit optional bounded/local view.

## Browser authority

QA source: the real Repoaxis checkout, not a synthetic browser fixture.

- Viewport: 1600×1000
- Final Chromium run: `33866737974`
- Artifact: `9934259557`
- Browser/page errors: 0

Observed final sequence:

1. `01-whole-semantic-overview.png` — root-level repository context is readable as a compact glyph topology rather than fitting all ~480 indexed nodes into one compressed world.
2. `02-dev-semantic-detail.png` — selecting `dev/` keeps the root context while `dev/` and its direct children (`benchmarks/`, `design/`, `fixtures/`, `reports/`, `tests/`, `tools/`, `visuals/`) appear as readable cards in the same Structure map.
3. `03-nested-file-semantic-detail.png` — `skills/repoaxis/viewer/repoaxis.html` is selected at its actual containment position with the visible path `skills/ → repoaxis/ → viewer/ → repoaxis.html`; Inspector identity remains the exact file.
4. `04-fit-return.png` — fit compacts the expanded path back to glyph-level presentation without changing the selected entity.
5. `05-explicit-local-focus.png` — bounded local containment still exists only through the explicit Focus action.

## Rejected intermediate

The first semantic-zoom implementation (run `33865898295`) rendered every indexed node in one world. Metrics passed, but visual inspection rejected it because fitting hundreds of nodes compressed the repository into an unreadable strip and moved useful children outside the selected viewport. It was superseded by progressive semantic expansion before this slice was closed.
