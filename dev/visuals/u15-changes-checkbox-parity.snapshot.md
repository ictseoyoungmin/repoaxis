# U15 Changes checkbox visual parity evidence

## Why this slice

U13 added correct change-set selection semantics, but the visual checkbox component remained a simplified implementation: 20px boxes with a CSS text `✓`, no canonical hover halo/press response, and a non-prototype partial treatment. U15 restores the canonical v47 checkbox component without changing selection semantics.

## Prototype contract

Canonical Changes checkbox behavior:

- row selector: 22×22px, 1.5px border, 7px radius;
- header master selector: 20×20px, 6px radius;
- 13px SVG checkmark rather than a text glyph;
- hover violet border + 3px halo;
- pressed `scale(.94)` response;
- checked violet fill + subtle shadow;
- indeterminate master uses a dedicated dash SVG on pale violet chrome.

## Construction

- `viewer-2.js` now emits reusable check/dash SVG markup for Changes selectors.
- row selectors use `.change-select.checked` while preserving the existing `data-check` event contract.
- the master selector uses `.change-select.header` and explicit `checked` / `indeterminate` states.
- `viewer-surfaces.css` replaces the legacy `.check` + `content:"✓"` chrome with the prototype component styling.
- U13 change-set, quick preset, Analyze impact, and View in Graph semantics are unchanged.

## Regression validation

Final capture run executed `npm run check` before injecting any visual fixture:

- tests: 107
- pass: 107
- fail: 0

New regression coverage verifies:

- 22×22 row selector and 20×20 header selector;
- hover halo and pressed transform contract;
- checked shadow and 13px SVG icon;
- dedicated SVG dash for indeterminate master state;
- removal of legacy text `✓` pseudo-element chrome.

## Actual browser validation

Capture-only dirty fixture after the regression suite passed:

- `viewer-0.js`: mixed staged + working;
- `viewer-3.js`: staged-only;
- `viewer-surfaces.css`: working-only.

Normal Changes interaction was used to exercise these states:

1. off — no selector SVG visible;
2. hover — violet border and 3px halo after the 150ms transition settled;
3. one row checked — row check SVG visible and header master becomes indeterminate with dash SVG `M6 12h12`;
4. pressed — mouse-down on the checked row must produce a non-`none` transform from `scale(.94)`;
5. all checked — master and all three rows show check SVG `M6 12.5l4 4L18 8`;
6. 1280×820 — all checked state remains intact and `scrollWidth == innerWidth`.

Final measured checked state:

- row: 22×22px, radius 7px, `rgb(98, 91, 255)` fill/border, 13px SVG visible, violet 2px/6px shadow;
- master: 20×20px, radius 6px, same checked treatment;
- selected current rows: 3/3.

All six PNGs were downloaded and visually inspected. The new selectors read as the same component family as the canonical prototype rather than the former text-checkmark approximation.

## Capture provenance

- capture head: `fe372c9472e81d46b8457aad29248e72aca0fa8c`
- GitHub Actions run: `33734613816`
- artifact: `9885238781`
- artifact digest: `sha256:2a75300b99a16265cc96b3f65c0af65ab02c587e3976e7c216165ba93bcc9c41`
- artifacts:
  - `u15-checkbox-off.png`
  - `u15-checkbox-hover.png`
  - `u15-checkbox-partial.png`
  - `u15-checkbox-pressed.png`
  - `u15-checkbox-all-checked.png`
  - `u15-checkbox-1280.png`
  - `u15-checkbox-metrics.json`
  - `u15-changes-checkbox-parity.html`

## Boundary

No Git/index/schema, change-set selection, impact traversal, routing, version, or release change in this slice.
