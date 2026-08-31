# Repoaxis human viewer

`repoaxis view` opens a read-only localhost projection of the current repository index.

```bash
repoaxis view
repoaxis view --port 4400
repoaxis view --no-open
repoaxis view --root ../another-repository
```

## What it shows

The viewer uses the same canonical `.repoaxis.json` data as the CLI. It does not maintain a second repository model.

- **Structure** — folder, file, class, and function containment with Git-state badges and symbol signatures.
- **Dependencies** — repository-local `imports` and derived `imported_by` relationships, plus a bounded reverse-dependency tree.
- **Graph** — file-level canonical import edges. Repositories with more than 80 indexed files use a bounded focus around the selected file rather than trying to draw an unreadable whole-repository graph.
- **Inspector** — deterministic node identity, source range, exact current-file Git state, exact last-file commit context, dependency counts, and stored annotations.

The viewer is read-only. Annotation writes remain explicit CLI operations through `repoaxis note`.

## Freshness

The browser requests `/api/index` periodically while the viewer is open. Each request uses Repoaxis query-time freshness detection. If Git HEAD/ref, staged state, or relevant working-tree content changed, the default index is rebuilt before the response is returned.

This keeps the view current without installing an always-on daemon or introducing another source of truth.

## Local server boundary

The viewer server binds only to `127.0.0.1`.

Endpoints:

- `GET /` — bundled viewer HTML.
- `GET /api/index` — current validated/fresh default index plus refresh metadata.
- `GET /api/health` — minimal loopback health response.

Other routes return 404 and non-GET requests return 405. The server does not expose source-file contents and does not provide write endpoints.

## Graph interpretation

Only canonical `imports` edges are drawn as dependency edges. Reverse relationships are derived from incoming canonical edges. The viewer does not infer function calls, runtime entry points, framework registration, or dead code.

Git badges are presentation only; automation should rely on the exact serialized Git fields exposed by the CLI/index rather than colors or badges in the viewer.
