# U17.1 — Cross-view arrival visual QA

Date: 2026-09-03

## Scope

Visual verification of the U17 cross-view selection-continuity contract on the real Repoaxis viewer, using the repository's live index in headless Chromium rather than a fixture-only DOM assertion.

The inspected source was the indexed function `materializeDogfoodRepository` in `dev/fixtures/dogfood-js/create-fixture.mjs`. The function was projected to its containing file when entering Dependencies and Graph.

## Browser evidence

Successful GitHub Actions capture run: `33745948855` (`u17-1-visual-qa`, head `4fba3844fdd9be8ea66f2c2030538bc41b67c8b6`).

Artifact: `u17-1-cross-view-arrival`, SHA-256 digest `0e4f8ae95d66f61ecf151bed5f05bc2cd2625f8131772a73abdefe7d92533ea3`.

Captured views:

- `u17-1-structure-symbol.png` — source symbol inspected in Structure with Inspector open.
- `u17-1-dependencies-arrival.png` — symbol projected to `create-fixture.mjs` as the explicit dependency root at 1600×900.
- `u17-1-graph-arrival.png` — same symbol projected to the canonical file node in Graph at 1600×900.
- `u17-1-graph-arrival-1280.png` — Graph arrival with Inspector open at 1280×820.

## Measured contract

- Dependencies arrival target: x=546..766, y=543..593 at 1600×900.
- Graph arrival target: x≈593.44..718.56, y≈494.68..533.32 at 1600×900.
- 1280px Graph arrival target: x≈433.44..558.56, y≈454.68..493.32; fully inside the viewport.
- Selection context remained visible at both widths: 240px wide at 1600 and 190px wide at 1280.
- Document scroll width equaled viewport width at both widths; the arrival state introduced no horizontal page overflow.
- Inspector remained open through both projected transitions.
- `state.crossView.projected` remained true and the destination matched the containing file.
- The arrival class cleared after the intended 1400ms interval.

## Visual review and correction loop

The first successful browser capture exposed a real parity defect that unit/integration tests did not catch: the projection explanation was visually truncated at 1600px and the entire selection-context chip disappeared at 1280px.

U17.1 therefore reopened the visual boundary and corrected it before closure:

1. Reordered the message to begin with `Containing file · …` so the projection reason survives ellipsis.
2. Kept the selection-context visible between 1100px and 1360px while compacting repository/search/branch chrome rather than dropping the analysis context.
3. Added regression coverage for the narrower-desktop selection-context contract.
4. Re-ran the real Chromium capture and visually inspected the final PNGs.

Final review: the violet arrival pulse is clear without obscuring node text; the projected node is immediately reacquirable in Dependencies and Graph; the Inspector remains readable; the projection reason is visible in the topbar at 1600 and 1280; the 1280 layout trades some repository/branch text for ellipsis but preserves analysis context, search, and all primary viewer controls.

## Boundary

No index/schema, Git semantics, dependency traversal, impact traversal, or graph-routing authority changed in U17.1. This slice only hardens the cross-view visual arrival/selection-context presentation and records browser evidence.
