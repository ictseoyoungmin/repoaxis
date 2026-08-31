# Human viewer design boundary

The human surface is a projection of the same canonical index used by agent queries.

- `repoaxis view` runs only while requested and binds to `127.0.0.1`.
- `/api/index` reuses query-time freshness rather than maintaining another index or watcher-specific model.
- The viewer is read-only; mutation remains in explicit CLI commands.
- Structure is derived from `contains`; dependency/reverse-dependency views are derived from canonical `imports`.
- Graph rendering is bounded. Small repositories show all indexed files; larger repositories show a selected-file neighborhood capped at 80 files.
- Git colors/badges are presentation only. Exact status data remains serialized in the index.
- No source contents are served by the viewer API.
