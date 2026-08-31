# Changelog

## 0.3.0 — 2026-08-31

- Added JavaScript symbol indexing for `.js`, `.mjs`, and `.cjs` files.
- Added canonical class/function nodes for declarations, methods, class-field functions, variable-bound functions, and nested named functions.
- Added deterministic qualified names, parent links, source ranges, and compact signatures.
- Added graceful file-level parse diagnostics so malformed JavaScript does not abort repository builds.
- Added a pinned vendored Acorn 8.15.0 parser and its MIT license notice for reproducible parsing without runtime dependency drift.
- Added symbol extraction, containment, parse-failure, and regression coverage.

## 0.2.0 — 2026-08-31

- Added deterministic folder/file indexing rooted at `folder:.`.
- Added canonical `contains` edges for the current filesystem hierarchy.
- Added Git-aware discovery of tracked and visible untracked files while respecting standard ignore rules.
- Excluded deleted tracked paths from the current working-tree projection.
- Added deterministic file metadata for byte size, extension, and symlink state.
- Added filesystem hierarchy, ignore, untracked-file, and deleted-file integration coverage.

## 0.1.0 — 2026-08-31

- Added npm CLI entrypoint and plugin manifests for Codex and Claude Code.
- Added Repoaxis schema version 1 with explicit generated/annotation ownership.
- Added deterministic node ID encoding and repository-relative path normalization.
- Added rebuildable bootstrap index generation with annotation preservation.
- Added index validation, summary, environment doctor, and minimal HTML index viewer.
- Added deterministic fixture tests and distribution-surface validation.
