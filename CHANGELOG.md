# Changelog

## 0.6.0 — 2026-08-31

- Added exact current-path last-file-commit context for tracked file nodes.
- Added commit SHA, author name, authored time, committed time, and subject without copying full Git history into `.repoaxis.json`.
- Kept untracked and not-yet-committed staged-added paths explicit with `last_commit: null`.
- Kept uncommitted rename semantics exact: the new path does not inherit the old path's commit as if it were already committed.
- Extended schema v1 compatibly with optional `file-node.git.last_commit` validation.
- Added real-Git integration coverage for distinct file histories, dirty tracked files, new staged files, untracked files, renames, and deterministic rebuilds.

## 0.5.0 — 2026-08-31

- Added exact file-level Git state from porcelain v2 for clean, modified, added, deleted, renamed, copied, untracked, staged, type-changed, and conflicted paths.
- Added top-level `file-node.git` data with independent working-tree and staged state instead of encoding status as presentation colors.
- Added `generated.git_changes` so changed paths remain queryable even when a current filesystem node is absent, such as tracked deletions.
- Added rename/copy source path, similarity, and merge-conflict code metadata where Git reports them.
- Kept generated output paths out of Git change projection so rebuilding `.repoaxis.json` remains deterministic even when the output itself is untracked.
- Added real-repository coverage for mixed staged/working changes, renames, deletions, untracked files, conflicts, and deterministic rebuild behavior.

## 0.4.0 — 2026-08-31

- Added canonical file-to-file `imports` edges for repository-local JavaScript dependencies.
- Added static ESM import/re-export, string-literal dynamic `import()`, and best-effort CommonJS `require()` extraction.
- Added deterministic relative resolution for exact paths, common JavaScript/JSON extensions, and directory `index` files.
- Added compact external/unresolved import diagnostics without creating synthetic package nodes.
- Added derived `importsFrom()` / `importedBy()` traversal helpers without persisting reverse edges.
- Added circular-import, duplicate-edge collapse, external/unresolved, and reverse-traversal integration coverage.

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
