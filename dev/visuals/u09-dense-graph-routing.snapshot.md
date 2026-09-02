# U09 Dense Graph Routing — actual viewer evidence

## Target

Harden U07/U08 routed Graph geometry only where edge density creates a material collision problem. Preserve the spacing-first world and exploratory semantics while preventing canonical import edges from crossing unrelated file nodes. Prefer a clear simple orthogonal route; use a more complex detour only when an obstacle actually requires it.

## Construction and correction loop

The first obstacle-aware implementation passed its collision checks but was rejected during visual inspection. On the real Repoaxis 80-file projection it produced 37 complex detours across 93 visible edges. Although every route was technically clear, the extra long corridors made the overview visually worse than U08.

The router was therefore reopened and corrected to:

- search clear simple orthogonal candidates before any complex detour,
- treat route-reuse cost as a mild tie-break instead of a reason to create long paths,
- keep alternate node sides expensive unless the physical side is saturated,
- retain complex detours as a real fallback, covered by a synthetic obstacle regression test.

## Final actual Repoaxis capture

- viewport: 1600 × 1000
- clean indexed repository: `ictseoyoungmin/repoaxis`
- bounded projection: 80 files
- visible canonical import edges: 93
- selected anchor: `skills/repoaxis/lib/indexer.mjs`
- Graph SVG viewport: `1800 × 1040`
- camera scale: `0.92`
- capture head: `d2903636bc8d84c10e95c027ca6db0f11dfa70ed`
- Actions run: `33655625541`
- artifact: `9856596510`
- artifact digest: `sha256:d2cb99bde2a1392ead33ad731419f4df4270913878aa242501c9b4af709986ce`

### Final routing metrics

- 93 / 93 visible edges: clear
- 0 blocked fallback routes
- 93 simple orthogonal routes
- 0 complex detours in this real projection
- 0 foreign-node edge collisions
- 11,779 route samples checked against unrelated file-node rectangles

The zero-detour result does not remove detour capability. `viewer-graph-dense-routing.test.mjs` includes an intervening-node fixture that requires and validates obstacle avoidance; complex candidates remain available when no clear simple route exists.

### Existing Graph behavior retained

Hovering `indexer.mjs` still yields:

- `indexer.mjs · 12 in · 9 out`
- 21 promoted directional focus edges
- violet incoming and teal outgoing context
- U08 spacing-first camera behavior

## Visual inspection

Both final PNGs were downloaded and inspected directly, including comparison against the U08 reading-scale capture. The rejected 37-detour version was not accepted merely because its collision metrics passed. The corrected version keeps the overview in the same visual complexity class as U08 while moving routes away from unrelated file cards. Hover remains readable and the selected file stays the clear focal point.

Artifacts captured:

- `u09-graph-dense-overview.png`
- `u09-graph-dense-hover.png`
- `u09-dense-graph-routing.html`

Temporary patch, tuning, and capture helpers/workflows are removed before PR creation.
