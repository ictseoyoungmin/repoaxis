# Repoaxis human viewer

`repoaxis view` opens Repoaxis' read-only localhost product surface for the current Git repository.

```bash
repoaxis view
repoaxis view --port 4400
repoaxis view --no-open
repoaxis view --root ../another-repository
```

## Canonical data boundary

The viewer is a projection of the same live Repoaxis index used by the CLI. Git plus the working tree remain authoritative; `.repoaxis.json` remains the rebuildable derived index. The browser does not maintain a second repository model and the viewer contains no repository fixture data.

The loopback server supplies three read-only data surfaces:

- `GET /api/index` — the current fresh Repoaxis index and refresh metadata.
- `GET /api/meta` — display-only repository remote metadata derived from the current Git checkout.
- `GET /api/history` — the current HEAD commit and its file-change set for the Last commit overlay.

No endpoint serves source-file contents and no endpoint mutates the repository or annotations.

## Product surfaces

- **Structure** — adaptive containment topology for folders, files, classes, and functions. The whole-repository overview is intentionally label-light; focus mode exposes labels, breadcrumbs, source symbols, Git overlay badges, search, pan/zoom, and the inspector.
- **Dependencies** — one explicit root file projected as a bounded dependency tree. `Imported by` answers impact direction; `Imports` answers requirements direction. Repeated routes are collapsed into `already shown` references and cycles are marked instead of recursively duplicating nodes.
- **Changes** — the complete `generated.git_changes` projection. Working-tree, staged, mixed, untracked, conflicted, renamed/copied, and deleted paths remain distinct. Deleted paths remain visible without inventing a current filesystem node. Current changed files can be selected as a set and analyzed together.
- **Graph** — the canonical N:N file import surface. Folder scopes supply containment context only. Whole-repository layout is adaptive to the current file set; neighborhood focus remains bounded. Change-set impact mode highlights the upstream union and can explain an affected file with a concrete canonical propagation path to a selected change root.
- **Inspector** — deterministic node identity, real indexed source range/signature, exact file Git state, exact last-file commit context, relation counts, durable annotation text, and links derived from the actual Git remote when available.

The same selection is projected across Structure, Dependencies, Changes, and Graph rather than silently selecting unrelated fixture nodes.

## Git overlay

The header Git switch has two factual projections:

- **Working tree** — `generated.git_changes` plus each current file node's serialized Git state.
- **Last commit** — the current HEAD commit and its actual file changes from Git history.

Changing the overlay changes presentation only; it does not alter the canonical index or Git history.

## Freshness

The browser requests `/api/index` periodically while the viewer is open. Each request uses Repoaxis query-time freshness detection. If HEAD/ref, staged state, or relevant working-tree content changes, the default index is rebuilt before the response is returned. If HEAD changes, `/api/meta` and `/api/history` are refreshed as well.

This keeps the viewer current without an always-on daemon or another source of truth.

## Local server boundary

The server binds only to `127.0.0.1`. Static viewer assets are served only from the packaged `skills/repoaxis/viewer/` directory. Unknown routes return 404 and non-GET requests return 405.

The four main surfaces can be deep-linked with `#structure`, `#dependencies`, `#changes`, and `#graph`.

## Interpretation limits

Only canonical `contains` and repository-local `imports` relations are visualized. Reverse import relationships and impact paths are derived from those canonical edges. Repoaxis does not infer function calls, runtime entry points, framework registration, data flow, or dead code in this viewer.

Git badges and visual emphasis are presentation aids. Automation should rely on the exact serialized fields exposed by the index/CLI rather than UI color or geometry.
