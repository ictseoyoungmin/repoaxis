# U08 Graph spacing-first world — actual viewer evidence

## Target

Restore the prototype's spacing-first Graph principle on the real Repoaxis viewer: preserve readable node and cluster spacing even when the graph world exceeds the viewport, and use pan/zoom as navigation rather than compressing the entire projection by default.

## Actual Repoaxis capture

- viewport: 1600 × 1000
- clean indexed repository: `ictseoyoungmin/repoaxis`
- graph projection: bounded 80-file overview
- selected anchor: `skills/repoaxis/lib/indexer.mjs`
- capture commit: `5049745af2aded305f23f0ffc635a3708160a157`
- Actions run: `33646396889`
- artifact: `9852966248`
- artifact digest: `sha256:1195e3d108c56f6f02ea861b958bc505fe5fb8868537acf10c04b2bf16673054`

### Default reading scale

- SVG viewport world: `1800 × 1040`
- actual graph content bounds: `2648 × 1902`
- camera scale: `0.92`
- selected node rendered width: `101.35px`
- graph therefore remains larger than the viewport instead of being implicitly fit.

### Explicit Fit

- camera scale: `0.51948`
- selected node rendered width: `57.23px`
- full graph overview remains available only when the user explicitly requests Fit.

### Reset

- restores camera scale to `0.92`
- restores the selected anchor to the readable graph camera.

### Existing Graph behavior retained

Hovering `indexer.mjs` still yields:

- `indexer.mjs · 12 in · 9 out`
- 21 promoted directional focus edges
- U06 exploratory semantics and U07 routed geometry remain active.

## Visual inspection

The downloaded screenshots were inspected directly. The default Graph no longer appears as a tiny central mass. Node labels are readable at entry scale, the selected file is a clear focal point, and the graph visibly continues beyond the current viewport for pan/zoom exploration. The explicit Fit screenshot intentionally returns to a small whole-projection overview.

Artifacts captured:

- `u08-graph-reading-scale.png`
- `u08-graph-hover.png`
- `u08-graph-fit-overview.png`
- `u08-graph-spacing-first-world.html`

Temporary capture and patch workflows/helpers were removed before PR creation.
