# U07 Graph routing parity visual evidence

Actual Repoaxis branch viewer captured at 1600×1000 after applying routed Graph geometry.

Prototype reference intent retained:

- side-aware node ports rather than one left/right center anchor
- orthogonal middle routing with rounded corners
- compact local routes inside a folder scope
- cross-folder routes through scope gutters
- distinct base and focus edge layers so selected/hover/impact relationships can be promoted without redrawing the neutral graph

The implementation is generalized to Repoaxis's live bounded/focused/impact projections. It does not copy prototype fixture coordinates or static route tables.

Validated on the actual Repoaxis repository:

- 80-file bounded projection
- 93 visible canonical import edges
- 62 local routes
- 31 cross-folder routes
- 93 base paths and 93 matching focus-layer paths
- 0 cubic Bézier routes
- 84 routes with at least one rounded orthogonal corner; straight simplified routes naturally do not require a corner
- hover target: `skills/repoaxis/lib/indexer.mjs`
- hover context: `indexer.mjs · 12 in · 9 out`
- 21 focus-layer relationships promoted during hover
- neutral base edges dim to `0.045` opacity while exploring

Capture provenance:

- branch capture commit: `99d664cd4faf0f1076be85c00da7fa14d7233687`
- GitHub Actions run: `33644398498`
- artifact: `9852157665`
- artifact digest: `sha256:93413557755704123719d998afa193ebd90fe0d5e3224540c708787c16cbe378`
- `u07-graph-routed-overview.png`
- `u07-graph-routed-hover.png`
- `u07-graph-routing-parity.html`

Both PNGs were downloaded and visually inspected. The routed overview keeps long relations in inter-column lanes / inter-scope gutters instead of drawing direct cubic arcs through the graph mass. The hover capture preserves the U06 one-hop exploration layer while routing the promoted violet/teal relationships through the same geometry.

Scope boundary: this slice restores routing geometry and edge-layer parity. It does not claim the prototype's later full obstacle-search or emergency fan-bus heuristics; those should only be added if remaining real-repository clutter materially warrants them.

The temporary Playwright helper and snapshot workflow were removed before PR creation.
