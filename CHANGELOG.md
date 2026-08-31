# Changelog

## 0.10.0 — 2026-08-31

- Added query-time freshness checks for the default `.repoaxis.json` without introducing an always-on daemon.
- Added `generated.refresh.fingerprint` derived from the Repoaxis version, Git HEAD/ref, working-tree status, dirty/untracked file content, and staged index state.
- Default operational query and annotation commands now rebuild automatically when the index is missing or stale.
- Continued edits to an already-modified file are detected by content hash even when Git status text remains unchanged.
- Re-staging different content is detected through staged index-state hashing.
- Passing `--index FILE` now explicitly selects snapshot mode and disables automatic refresh for reproducible fixtures and exported indexes.
- Excluded the generated index path from freshness fingerprints so builds and annotation edits do not cause self-triggered refresh loops.
- Switched generated index writes to atomic replacement and added real-Git integration coverage for HEAD, dirty content, staged content, snapshot mode, and deterministic self-exclusion.

## 0.9.0 — 2026-08-31

- Added `note` to read, set, replace, and explicitly clear durable `agent_note` annotations through the validated index instead of manual JSON editing.
- Added `notes` to list annotations in deterministic node-ID order and identify orphaned memory whose node no longer exists in the generated graph.
- New notes require a current unambiguous target; missing targets do not create detached annotations.
- Orphaned annotations remain readable and clearable by exact stored node ID so rebuilds and temporary source changes cannot silently destroy authored memory.
- Annotation mutations use atomic index-file replacement and leave generated graph data unchanged.
- Kept schema version 1 backward-compatible rather than tightening the existing outer annotation contract for this release.
- Added integration coverage for build → note → rebuild preservation → source removal → orphan inspection → explicit clear.

## 0.8.0 — 2026-08-31

- Added `context` to compose a focused agent packet from the resolved node, source location, containment, file Git state and last commit, matching working-tree change, annotations, and repository-local dependency projections.
- Added `why` to explain bounded structural provenance using only canonical `imports` and `contains` edges.
- Added deterministic upstream path traversal with configurable depth/path limits and explicit ambiguity handling inherited from the query layer.
- Kept source text out of context responses so agents can use structural evidence to narrow the next source read instead of receiving another broad dump.
- Explicitly avoid treating files with no incoming indexed imports as runtime entry points; they are only structural origins for `why` paths.
- Added integration coverage for context composition, Git/change/annotation inclusion, structural path evidence, and CLI JSON output.

## 0.7.0 — 2026-08-31

- Added compact structural query commands: `find`, `show`, `refs`, `parents`, `children`, and `changed`.
- Added deterministic node matching across node IDs, repository paths, qualified names, and `path:qualified_name` targets, with ambiguity errors instead of arbitrary selection.
- Added direct canonical-edge adjacency through `refs` without inventing function call references or persisting reverse edges.
- Added containment-only parent/child traversal and staged-only changed-path filtering.
- Added compact node projections for search/traversal while `show` returns the full indexed node plus its annotation.
- Kept query commands snapshot-based; automatic staleness detection and refresh remain separate behavior.

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
