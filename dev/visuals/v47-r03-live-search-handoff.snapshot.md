# V47-R03 — live search → Graph/Structure handoff

Status: CLOSED candidate

## Scope

Validate the canonical v47 search against the live Repoaxis index, then verify that a search-selected live file remains visually reacquirable when handed off to Graph and Structure.

No index/schema/import/contains authority changes are in this slice. The canonical v47 search UI, Graph layout/routing, Structure renderer, drawer, and cross-view actions remain intact.

## Live target

`file:dev/tests/integration/annotations.test.mjs`

Search query: `annotations.test.mjs`

## Baseline browser probe

- run: `33794293299`
- artifact: `9908552374` (`v47-r03-search-probe`)
- digest: `sha256:b7bcb4f6dd111dbb39b169d2321525f7208766be1bc6acd71864ddee11a0f36f`
- viewport: 1600×1000 Chromium

Observed:

- Ctrl/Cmd+K opened the canonical search overlay.
- live file result plus indexed function results were shown with paths/locations.
- Enter selected the live file and opened Inspector.
- selection identity and Inspector remained correct through Graph and Structure handoff.
- browser/page errors: 0.

Reopened visual defect:

- Graph handoff preserved state but the selected `annotations.test.mjs` graph node landed outside the initial usable viewport, under the far-right live graph extent. The Inspector and selected chip were correct, but the actual graph node was not readily reacquirable.

## Correction

`frameGraphSelectionR03(id)` reconciles only the Graph camera after canonical `navigateSelectedTo('graph')` finishes rendering:

- measure the selected graph node, Graph stage, SVG rect, and viewBox;
- convert pixel delta to SVG user units;
- offset `state.cameras.graph` so the selected node arrives near the usable Graph-stage center;
- keep projection, file positions, edges, routes, neighborhood semantics, and canonical selection logic unchanged.

## Final browser probe

- run: `33794675984`
- artifact: `9908696338` (`v47-r03-search-probe`)
- digest: `sha256:58d58c1f8c61ca306afc854a7be74f57e2ad786d7e23e6167e1054f626f04a87`
- viewport: 1600×1000 Chromium

Final observations:

- search overlay clearly separates the file result from symbol results and shows repository paths.
- Enter selects `dev/tests/integration/annotations.test.mjs` in bounded Structure focus with 23 visible nodes.
- Graph handoff keeps the same selected file and Inspector, with 53 live graph nodes.
- the selected graph node is now visible in the working viewport with the violet selected outline and teal selected-import route.
- Structure handoff returns to the same selected file in the R02 bounded 23-node context.
- browser/page errors: 0.

## Validation

The apply path passed both:

- `npm run check`
- `npm run release:dry-run`

A regression contract in `dev/tests/integration/viewer.test.mjs` protects the R03 framing hook while preserving the canonical single-file v47 shell boundary.

Temporary Playwright probe/apply workflows and helper tools were removed before PR.
