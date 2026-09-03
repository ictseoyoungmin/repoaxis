# U14 Graph label / impact framing visual evidence

## Why this slice

U13 interaction QA exposed a Graph rendering defect that should have blocked closure:

- the multi-character `S+W` Git badge used the same fixed 18px width as one-character badges, so its text visibly pushed through the badge boundary;
- small combined-impact projections centered only the first root, allowing another impact root to sit at the viewport edge or be clipped.

U14 fixes only those presentation/framing defects. It does not change indexing, Git semantics, impact traversal, Graph routing, or dependency semantics.

## Construction

- `badgeSvg()` now derives a width from the rendered status label and expands inward from the existing right anchor. Single-character badges remain compact while `S+W` gets explicit horizontal breathing room.
- Git badge groups expose `.git-badge` / `data-label` only to support deterministic browser geometry QA.
- `graphPrepareCamera()` detects impact mode and frames the bounding box of every projected impact file, capped at the existing readable `0.92` scale. Normal whole/bounded/focused Graph camera behavior remains unchanged.

## Correction loop

The first geometry fix technically contained `S+W`, but browser measurement showed only about 0.35px total horizontal spare space around the text. That was rejected as too close to the original defect. Badge width was increased again and the final browser gate now requires at least 1.5px padding on both horizontal sides of every visible Git badge.

## Final actual browser validation

Capture-only dirty fixture after `npm run check`:

- `viewer-0.js`: mixed staged + working -> `S+W`
- `viewer-3.js`: staged-only -> `M`
- `viewer-surfaces.css`: working-only -> `M`

Normal Changes UI interaction selected all three current roots and opened `Analyze impact`.

Automated geometry gates at both 1600x1000 and 1280x820 required:

- every impact `.node[data-id]` bounding box to be fully contained by the Graph SVG viewport;
- every `.git-badge text` bounding box to be contained by its badge rect;
- at least 1.5px measured left and right text padding inside every badge;
- no 1280px shell horizontal overflow.

Final measured `S+W` at 1600px:

- badge rect: 26.68px wide
- text: 22.65px wide
- left padding: 2.24px
- right padding: 1.79px

Final impact nodes at 1600px:

- viewer-0.js: x 593.04..718.16
- viewer-3.js: x 795.44..920.56
- viewer-surfaces.css: x 997.84..1122.96
- Graph viewport: x 129..1587

Final impact nodes at 1280px:

- viewer-0.js: x 433.04..558.16
- viewer-3.js: x 635.44..760.56
- viewer-surfaces.css: x 837.84..962.96
- Graph viewport: x 129..1267

All nodes are fully visible at both widths, with the existing 0.92 readable scale preserved.

## Capture provenance

- final capture head: `29ece48092478c525ed717de858ff49a1c846423`
- GitHub Actions run: `33731325667`
- artifact: `9883975133`
- digest: `sha256:9c0b19240de73017efcce95100e13c968d21d57a5c11fc50fc97a960b3364842`
- artifacts:
  - `u14-impact-framing-1600.png`
  - `u14-impact-framing-1280.png`
  - `u14-framing-metrics.json`
  - `u14-graph-label-framing.html`

Both PNGs were downloaded and visually inspected after the geometry gates passed.

## Boundary

No version bump, npm release, index/schema change, impact traversal change, routing change, mutation API, or source-content API change in this slice.
