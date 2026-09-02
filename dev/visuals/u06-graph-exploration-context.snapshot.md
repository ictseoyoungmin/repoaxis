# U06 Graph exploratory context visual evidence

Actual Repoaxis branch viewer captured at 1600×1000 on top of the merged U05 dependency-navigation state.

Validated states:

- Default Graph remains the existing bounded overview and preserves current analytical behavior.
- Hovering the most connected rendered file, `skills/repoaxis/lib/indexer.mjs`, isolates its visible 1-hop relation without changing selection or graph projection.
- Hover context reports `indexer.mjs · 12 in · 9 out`.
- 21 directional edges are promoted in the hover state.
- Incoming edges use the violet relation treatment; outgoing edges use the teal relation treatment.
- Unrelated graph nodes, edges, and folder scopes are dimmed while the two participating scopes remain visible.
- Click, impact, bounded projection, dependency-navigation, and Inspector semantics remain unchanged.

Visual capture:

- branch capture commit: `240155ade754abafe2948f29c74b66c043c9b018`
- GitHub Actions run: `33641794248`
- artifact: `9851132662`
- artifact digest: `sha256:e504559671d4031f70663fd9fc6384131262e0c033a40d4c6c9d7e35639f5ead`
- `u06-graph-overview.png`
- `u06-graph-hover-context.png`
- `u06-graph-exploration-context.html`

Both PNGs were visually inspected after download. The temporary patch/capture helpers and workflows were removed before PR creation.
