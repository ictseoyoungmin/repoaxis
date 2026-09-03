# U13 Changes direct-manipulation visual evidence

Actual Repoaxis viewer validation used a capture-only Git fixture after the product regression suite completed.

## Why this slice

The baseline Changes surface was already visually stable at 1600×1000 and 1280×820. The remaining material gap was direct change-set manipulation: users could select rows or use quick presets, but the current aggregate scope was not strongly inspectable at a glance and there was no master current-node selection state.

U13 therefore stayed narrow:

- expose `Change set` and an exact selected count;
- expose active `Staged / mixed`, `Working`, or `All current` preset state;
- render selected change-set rows as a subtle aggregate scope;
- add a Current nodes master selector with unchecked / partial / all states;
- preserve deleted paths as Git-only, non-selectable entries;
- preserve the existing combined-impact and Graph semantics.

## Capture-only fixture

After `npm run check`, the capture created:

- `skills/repoaxis/viewer/viewer-2.js`: mixed staged + working modification;
- `skills/repoaxis/viewer/viewer-surfaces.css`: working-only modification;
- `dev/fixtures/u13-staged-added.js`: staged added file;
- `dev/fixtures/u13-working-untracked.js`: untracked working file;
- `dev/tests/integration/viewer-graph-spacing.test.mjs`: staged deletion absent from the current tree.

Observed Changes projection: 4 current nodes + 1 deleted path.

## Browser correction loop

The first implementation passed source-level regressions but failed actual browser interaction: clicking a quick preset left the selection at zero. The temporary patch helper had used JavaScript replacement-string syntax, where `$$` is interpreted as a literal `$`, collapsing the existing multi-element `$$('[data-*]')` binders to single-element `$('[data-*]')` calls.

The slice was not closed. The binders were restored with callback replacement so literal `$$` is preserved, and a regression now requires querySelectorAll-style binding for row checks, Impact, Graph, and quick-preset actions.

A later capture failure was only an evidence-selector mismatch (`.g-node` versus the canonical Graph `.node[data-id]`); Graph had already reached `Combined upstream impact · 3 files · 3 roots · depth ≤ 2`. The capture assertion was aligned to the canonical renderer class and rerun end to end.

## Final actual interaction

Normal Playwright clicks, no forced click:

1. Initial change set: 0 selected.
2. `Staged / mixed`: 2 selected, preset active, master partial.
3. Master Current nodes: 4 selected, `All current` active, master on.
4. Deselect staged-only added file: 3 selected, `Working` active, master partial.
5. `Analyze impact`: Graph opens with 3 files / 3 roots at depth ≤ 2.
6. Return to Changes and resize to 1280×820: `scrollWidth == innerWidth == 1280`.

Regression suite at final capture: **102/102 passed**.

## Capture provenance

- capture head: `50d5b2737f4fcaa3039ab7db6ff52b880ba5dde7`
- GitHub Actions run: `33722034711`
- artifact: `9880580046`
- digest: `sha256:5e5ceeb7f82d80e78991fd133610930983ccd1e6a91aeb7527b04d06fb9a918b`
- screenshots:
  - `u13-changes-staged-selected.png`
  - `u13-changes-all-selected.png`
  - `u13-changes-working-partial.png`
  - `u13-changes-impact-destination.png`
  - `u13-changes-responsive-1280.png`
- self-contained snapshot: `u13-changes-direct-manipulation.html`

All five PNGs were downloaded and visually inspected before closure. The final Changes states keep the existing low-noise table hierarchy while making the aggregate analysis scope directly readable.

## Boundary

No index/schema change, Git-state semantic change, Graph projection change, mutation API, source-content API, version bump, or npm release in this slice.
