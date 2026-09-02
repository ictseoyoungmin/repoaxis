# U12 — Responsive Geometry Reconciliation

Actual Repoaxis viewer evidence captured from `feat/u12-responsive-geometry-reconciliation`.

## Final capture

- Workflow run: `33687424928`
- Artifact: `u12-responsive-geometry-final4` (`9868688428`)
- Artifact digest: `sha256:e7b5a8668fe25dfc94834f9d657982c8e68c9167ad22ae33ac632b3f36e4a8e3`
- Desktop viewport: `1600 × 1000`
- Responsive viewport: `1280 × 820`
- Browser interaction validation: passed
- Repository check at capture: `99/99` tests passed

## Observed invariants

### Structure

- Whole topology rendered `27` macro nodes and every macro node remained inside the initial usable viewport.
- Initial usable host: `1458 × 846`.
- Opening the `404px` Inspector reduced the host to `1054 × 846` without recomputing the topology scale.
- Selected `skills/` target stayed effectively constant: `103.695 × 24.797px` before and `103.695 × 24.797px` after drawer opening.
- Inspect-first semantics remained `Repository topology`; opening the Inspector did not force Structure focus mode.

### Dependencies

- Dependency canvas used the actual `.dep-tree` viewport rather than the whole host.
- Root card stayed centered and unchanged at about `221.8 × 51.8px` while the dependency canvas changed from `1412 × 692` to `1008 × 692` after Inspector opening.
- Explicit dependency root semantics and bounded traversal were preserved.

### Graph

- Selected graph card stayed about `126.92 × 40.44px` while the host changed from `1458 × 846` to `1054 × 846` after Inspector opening.
- The spacing-first graph world was not auto-fit or shrunk when usable width changed.

### Browser resize

- At `1280 × 820`, the usable graph host actually shrank to `1138 × 666`.
- `document.documentElement.scrollWidth = 1280` and `window.innerWidth = 1280`: no horizontal document overflow remained.
- The topbar collapsed the secondary selection context at this width.
- The selected graph card remained `126.92 × 40.44px` and stayed inside the usable viewport.
- Graph SVG viewBox matched the live host (`1138 × 666`).

## Visual review

The final PNGs were manually inspected after capture. Structure preserves a complete macro overview, Inspector transitions shift the usable camera without shrinking readable entities, Dependencies keeps its explicit root readable, and the `1280 × 820` Graph view fits the actual browser width without the previous right-side crop.
