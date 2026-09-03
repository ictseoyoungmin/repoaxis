# Repoaxis human viewer

`repoaxis view` opens Repoaxis' read-only localhost product surface for the current Git repository.

```bash
repoaxis view
repoaxis view --port 4400
repoaxis view --no-open
repoaxis view --root ../another-repository
```

## Frozen snapshot export

`repoaxis snapshot` writes the same canonical product viewer as a self-contained HTML artifact with a frozen copy of the current Repoaxis index, repository display metadata, and HEAD history.

```bash
repoaxis snapshot
repoaxis snapshot --output artifacts/repoaxis.html
repoaxis snapshot --root ../another-repository --output ./snapshot.html
```

The default output is `repoaxis-snapshot.html` at the selected repository root. The command starts the normal loopback viewer on an ephemeral port, reads its exact HTML/CSS/JS and the same `/api/index`, `/api/meta`, and `/api/history` responses, then closes the server and inlines those resources into one HTML file. Snapshot mode therefore does not maintain a second viewer implementation or a second repository model.

A frozen snapshot is read-only and does not refresh after capture. Opening it later does not require a Repoaxis server and does not fetch repository data over the network. Repository links derived from the captured Git remote may still open the corresponding web host when the user explicitly follows them.

## Canonical data boundary

The viewer is a projection of the same live Repoaxis index used by the CLI. Git plus the working tree remain authoritative; `.repoaxis.json` remains the rebuildable derived index. The browser does not maintain a second repository model and the viewer contains no repository fixture data.

The loopback server supplies three read-only data surfaces:

- `GET /api/index` — the current fresh Repoaxis index and refresh metadata.
- `GET /api/meta` — display-only repository remote metadata derived from the current Git checkout.
- `GET /api/history` — the current HEAD commit and its file-change set for the Last commit overlay.

No endpoint serves source-file contents and no endpoint mutates the repository or annotations.

## Product surfaces

- **Structure** — progressive containment exploration for folders, files, classes, and functions. The whole-repository projection stays intentionally macro and label-light so selecting a node can inspect it without forcing a drill-in. Focus mode opens a bounded two-level subtree with labels, breadcrumbs, hidden-descendant counts, source symbols, Git overlay badges, search, and pan/zoom. Root/folder Git marks summarize changed descendants rather than pretending that a folder has one file status.
- **Dependencies** — one explicit file root projected as a bounded dependency tree. `Imported by` answers impact direction and `Imports` answers requirements direction. Inspecting another node does not silently change the root; `Use selected as root` promotes the current file/symbol explicitly, while `Back`, `Initial root`, and the root trail preserve investigation history. Repeated routes are collapsed into `already shown` references and cycles are marked instead of recursively duplicating nodes.
- **Changes** — the complete `generated.git_changes` projection. Working-tree, staged, mixed, untracked, conflicted, renamed/copied, and deleted paths remain distinct. Deleted paths remain visible without inventing a current filesystem node. Current changed files expose direct checkbox selection, a checked/indeterminate master selector, Staged/Working/All presets, and combined `Analyze impact` / `View in Graph` actions. Mixed staged-plus-working files remain one explicit `S+W` presentation backed by the independent serialized Git lanes.
- **Graph** — the canonical N:N file import surface. Folder scopes supply containment context only. Whole-repository rendering uses spacing-first world geometry and a readable camera instead of shrinking dense repositories to fit. Neighborhood focus remains bounded; change-set impact mode shows the upstream union and can explain an affected file with a concrete canonical propagation path. Routes use directional, side-aware orthogonal geometry with shared-port spreading and obstacle avoidance. Entering an impact projection frames all projected roots rather than centering only one selected root.
- **Inspector** — deterministic node identity, real indexed source range/signature, exact file Git state, exact last-file commit context, relation counts, durable annotation text, and links derived from the actual Git remote when available. Current state and indexed facts lead the Overview; durable identity remains available in Metrics and exact source metadata remains available in Source.

## Cross-view continuity

Structure, Dependencies, Changes, and Graph are projections of one repository selection, not four unrelated navigation states.

When a class or function moves from Structure into a file-level surface such as Dependencies or Graph, Repoaxis explicitly projects the symbol to its containing file. The original symbol remains recorded as the source of the transition, the Inspector stays open, and the global selection context explains the mapping (for example, `symbol → containing file · graph projection`). The destination node receives a short 1.4-second arrival highlight so the user can immediately reacquire the object after the surface changes.

Moving to Structure restores exact containment context. An ordinary node selection clears stale cross-view projection context so previous navigation explanations do not leak into a new investigation. Changes only accepts a cross-view jump when the projected file is actually present in the active changed-file projection.

## Search and transient UI

Repository search is available from the header and with `Ctrl/Cmd+K`. Arrow Up/Down moves one active search cursor, Enter activates it, and activation lands in Structure with the Inspector visible. Escape unwinds transient UI in order — search, filters, dependency root picker — before it closes the Inspector.

## Spatial viewport behavior

Structure, Dependencies, and Graph reconcile their camera with the actual usable viewer host. Opening/closing the Inspector or resizing the browser therefore changes the viewport without shifting the logical world center unexpectedly. Structure chooses a readable macro overview once, Dependencies centers its explicit root once, and Graph preserves its spacing-first world while using the current host as the camera viewport.

## Git overlay

The header Git switch has two factual projections:

- **Working tree** — `generated.git_changes` plus each current file node's serialized Git state.
- **Last commit** — the current HEAD commit and its actual file changes from Git history.

Changing the overlay changes presentation only; it does not alter the canonical index or Git history.

## Freshness

The browser requests `/api/index` periodically while the live viewer is open. Each request uses Repoaxis query-time freshness detection. If HEAD/ref, staged state, or relevant working-tree content changes, the default index is rebuilt before the response is returned. If HEAD changes, `/api/meta` and `/api/history` are refreshed as well.

Frozen snapshot exports capture one result of this same freshness path and intentionally stop there; they never claim to remain current after capture.

This keeps the live viewer current without an always-on daemon or another source of truth while making exported evidence deterministic.

## Local server boundary

The live server binds only to `127.0.0.1`. Static viewer assets are served only from the packaged `skills/repoaxis/viewer/` directory. Unknown routes return 404 and non-GET requests return 405.

The four main surfaces can be deep-linked with `#structure`, `#dependencies`, `#changes`, and `#graph`. The same hash navigation works in a frozen snapshot because all viewer assets are inlined.

## Interpretation limits

Only canonical `contains` and repository-local `imports` relations are visualized. Reverse import relationships and impact paths are derived from those canonical edges. Repoaxis does not infer function calls, runtime entry points, framework registration, data flow, or dead code in this viewer.

Git badges, arrival emphasis, and graph geometry are presentation aids. Automation should rely on the exact serialized fields exposed by the index/CLI rather than UI color or geometry.
