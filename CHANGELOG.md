# Changelog

## 0.13.0 — 2026-09-02

- Replaced the MVP human viewer with the new Repoaxis product shell while keeping Git plus the working tree as the only authority and `.repoaxis.json` as the rebuildable canonical index projection.
- Removed repository fixtures, hard-coded repository/branch/commit values, fake LOC/complexity metrics, prototype source previews, and non-functional Settings/Help/More controls from the shipped viewer.
- Connected Structure, Dependencies, Changes, Graph, global search, cross-view selection continuity, the inspector, working-tree/last-commit overlays, change-set impact analysis, and propagation tracing to live Repoaxis/Git data.
- Added adaptive containment and file-graph layouts, a meaningful default dependency/graph root chosen from actual connectivity, bounded dependency traversal with repeated-route/cycle markers, and large-repository graph bounding.
- Added read-only `GET /api/meta` and `GET /api/history` loopback endpoints for actual Git remote display metadata and the current HEAD commit/change set; source contents and mutation endpoints remain absent.
- Expanded viewer integration tests to compile the split browser runtime, verify every packaged viewer asset, exercise the new read-only APIs, reject fixture/placeholder regressions, and preserve automatic freshness after working-tree edits.
- Visually dogfooded Structure, Dependencies, Changes, and Graph in a clean representative Git repository using headless Chrome, including staged, working, untracked, and deleted paths.

## 0.12.2 — 2026-09-01

- Hardened the human viewer after public-registry dogfooding exposed a Git-state projection gap.
- Added a read-only **Changes** surface backed directly by `generated.git_changes`, including deleted paths that no longer have current filesystem nodes.
- Structure badges now distinguish working-tree changes from staged changes instead of collapsing them into one generic modified badge.
- Added `#structure`, `#dependencies`, `#changes`, and `#graph` deep links for the local viewer.
- Verified the public npm first-run path in a clean external Git repository using `npx -y repoaxis@0.12.1`, covering CLI queries, refresh, durable annotations, index recreation, and live viewer capture.
- Updated public onboarding examples to use non-interactive `npx -y repoaxis@latest` for agent-friendly first runs.

## 0.12.1 — 2026-09-01

- Enabled npm Trusted Publishing through the existing tag-triggered GitHub Actions release workflow using OIDC (`id-token: write`) instead of a long-lived npm publish token.
- Publish the exact tested `dist/release/repoaxis-${VERSION}.tgz` artifact to npm so GitHub Release and npm consume the same prepared package.
- Added release preflight/tests that require the npm registry URL and OIDC permission while rejecting `NPM_TOKEN`, `NODE_AUTH_TOKEN`, and npm publish secrets.
- Added safe rerun behavior: already-published npm versions are skipped and existing GitHub Release assets are replaced with `gh release upload --clobber`.
- Added operator documentation for configuring the `ictseoyoungmin/repoaxis` + `release.yml` Trusted Publisher relationship.

## 0.12.0 — 2026-08-31

- Added `repoaxis unreferenced` as a conservative JavaScript file projection for nodes with no incoming repository-local `imports` edge; the output explicitly warns that candidates are not dead-code findings.
- Moved default-repository annotation durability under Git metadata (`repoaxis/annotations.json` resolved through `git rev-parse --git-path`) while continuing to project notes into `.repoaxis.json` for consumers.
- Deleting and rebuilding `.repoaxis.json` now preserves repository annotations instead of coupling authored memory to disposable generated state.
- Added a 38-file representative JavaScript dogfood repository with CLI/server entry paths, circular imports, package-script runtime entries, workers, and realistic service/repository/storage layers.
- Added end-to-end dogfood coverage proving `context` / `why` narrow a target to a small provenance path instead of broad repository reads, then remain correct through modified, staged, untracked, and deleted working-tree states.
- Added viewer dogfood against the representative repository and verified annotations remain visible after refresh and index recreation.
- Added packed npm installation coverage that installs the produced tarball, runs the installed CLI, verifies Codex/Claude skill surfaces, and confirms `dev/` assets are excluded from distribution.

## 0.11.0 — 2026-08-31

- Added `repoaxis view` as a read-only localhost human surface bound to `127.0.0.1`.
- Replaced the original file-upload summary page with a live structural viewer for folder/file/class/function containment, Git state, source signatures, annotations, imports, reverse imports, and a bounded file dependency graph.
- Reused query-time freshness through `/api/index` so the open viewer follows HEAD and working-tree changes without an always-on daemon or second repository model.
- Added a bounded reverse-dependency tree and a focused graph fallback for repositories with more than 80 indexed files instead of drawing an unreadable whole-repository graph.
- Kept all viewer endpoints read-only; annotation mutation remains explicit through the existing CLI.
- Added loopback server tests, fresh-index integration coverage, non-GET/404 checks, and compile-time validation of the bundled browser script.
- Added `docs/viewer.md` and distribution validation for the viewer runtime/template.

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
- Added rename/copy source path, similarity, and merge-conflict code metadata where Git reports it.
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
