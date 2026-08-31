# Repoaxis CLI

## Index selection and freshness

Operational query and annotation commands use the default `<git-root>/.repoaxis.json` as a live derived index. Before reading it, Repoaxis checks a fingerprint built from the installed tool version, Git HEAD/ref, dirty/untracked file content, staged index state, and Git working-tree status. If the index is missing or stale, Repoaxis rebuilds it before answering.

Use `--index FILE` to select an explicit snapshot. An explicit index is validated but is not automatically refreshed; this keeps fixtures, exported snapshots, and historical comparisons reproducible.

`validate` and `summary` are diagnostic commands and never rebuild their input.

## Commands

### `repoaxis doctor`
Checks that Repoaxis, Node.js, Git, and the current Git repository can be resolved.

### `repoaxis build`
Creates or rebuilds `.repoaxis.json` at the Git root. The command indexes the current folder/file hierarchy, extracts JavaScript class/function symbols from `.js`, `.mjs`, and `.cjs` files, projects durable repository annotations, and respects standard Git ignore rules. Parse failures are recorded on the file node without aborting the build.

Options:

- `--root PATH` — resolve the Git repository from another path.
- `--output FILE` — write to a different index path.
- `--reason TEXT` — record the refresh trigger.

### `repoaxis view [--root PATH] [--port N] [--no-open]`
Starts the read-only Repoaxis human viewer on `127.0.0.1`.

The viewer renders the canonical structure tree, Git state and last-file commit context, source ranges/signatures, annotations, repository-local imports and reverse imports, and a bounded file dependency graph. It requests the default current index through the local server, so freshness checks still apply while the viewer is open.

Options:

- `--root PATH` — resolve another Git repository.
- `--port N` — choose the loopback port. Default: `4173`; `0` asks the OS for a free port.
- `--no-open` — start the server without launching a browser.

The viewer is read-only. Annotation changes remain explicit `note` CLI operations. See `docs/viewer.md` for the server and graph boundaries.

### `repoaxis validate [FILE]`
Validates the Repoaxis v1 outer contract and graph invariants supported by the installed version.

### `repoaxis summary [FILE]`
Prints schema, Git HEAD context, graph counts, and annotation count.

### `repoaxis find QUERY [--index FILE] [--limit N]`
Searches node IDs, repository paths, qualified names, and `path:qualified_name` forms. Matching is case-insensitive and deterministic: exact matches rank before prefix and substring matches. The default result limit is 20.

### `repoaxis show TARGET [--index FILE]`
Resolves a node and prints its full indexed record plus its persistent annotation, if present.

### `repoaxis refs TARGET [--index FILE]`
Lists canonical graph edges directly touching the resolved node. Each record includes edge type, incoming/outgoing direction, and a compact neighboring node. This is structural adjacency; it does not infer function calls.

### `repoaxis parents TARGET [--index FILE]`
Lists direct incoming `contains` parents only.

### `repoaxis children TARGET [--index FILE]`
Lists direct outgoing `contains` children only.

### `repoaxis changed [--staged] [--index FILE]`
Lists `generated.git_changes`. `--staged` keeps only paths with a staged change. Deleted paths remain visible even when no current file node exists.

### `repoaxis unreferenced [--index FILE]`
Lists JavaScript file nodes that have no incoming repository-local `imports` edge.

The output basis is `no-incoming-repository-imports`. It is intentionally a conservative candidate projection, not a dead-code analysis. Runtime entry points, CLI scripts, migrations, workers, framework registration, configuration-driven modules, fixtures, plugins, and other indirect entry mechanisms may appear in the result.

Use additional runtime or framework evidence before removing a candidate. A durable annotation is appropriate when a candidate has a non-obvious runtime role.

### `repoaxis context TARGET [--index FILE]`
Builds one focused packet for a coding agent without copying source text. It includes the resolved node, source line/column range when available, containment path, immediate children, containing-file Git state and exact last commit, matching working-tree change, target/file annotations, and repository-local `imports` / `imported_by` projections.

Use `context` before broad source reads when a target is already known.

### `repoaxis why TARGET [--index FILE] [--max-depth N] [--max-paths N]`
Explains bounded structural provenance using only indexed `imports` and `contains` edges. The default import depth is 8 and the default path count is 3.

A path may start at an indexed file with no incoming `imports` edge. Repoaxis reports that as a structural origin rule only; it does not infer that the file is a runtime entry point. Cycles or depth limits can produce no complete upstream path, in which case direct `imported_by` evidence remains available.

### `repoaxis note TARGET [TEXT...] [--clear] [--index FILE]`
Reads, writes, or clears one durable `agent_note`.

- With no text, reads the current annotation for `TARGET`.
- With text, resolves a current node and sets or replaces its note. New notes are trimmed and limited to 8192 characters.
- With `--clear`, removes the note. An orphaned annotation can be cleared by supplying its exact stored node ID.
- Setting a note requires a currently resolvable, unambiguous node. Missing or ambiguous targets fail instead of creating detached memory.

For the default repository index, Repoaxis writes authored notes to Git metadata at `repoaxis/annotations.json` (resolved with `git rev-parse --git-path`) and projects the same notes into `.repoaxis.json`. This keeps generated structure disposable: deleting `.repoaxis.json` and rebuilding does not delete repository notes. The durable annotation file lives under Git metadata, not the working tree.

Explicit non-default snapshot files keep their own annotation state and do not become the repository's durable note store.

### `repoaxis notes [--index FILE]`
Lists all stored annotations in deterministic node-ID order. Each entry includes `orphaned: true` when its node no longer exists in the current generated graph.

Orphaned notes are preserved intentionally so a rebuild or temporary structural change cannot silently destroy user/agent-authored memory. Review and clear them explicitly when they are stale.

### `repoaxis node-id TYPE PATH [QUALIFIED_NAME]`
Produces the canonical deterministic node ID for a folder, file, class, or function.

## Refresh behavior

The generated index stores `generated.refresh.fingerprint`. Default operational commands compare it against current repository state. Refresh reasons are recorded as `query:index-missing`, `query:tool-version-changed`, `query:head-changed`, `query:head-ref-changed`, or `query:working-tree-changed`.

Repoaxis hashes content only for paths Git already reports as changed or untracked, and hashes staged index records for staged/conflicted paths. Clean tracked files are represented by Git HEAD plus status, avoiding a full-repository content hash on every query. The generated index path itself is excluded so rebuilding or editing annotations does not cause self-triggered refresh loops.

There is no always-on background daemon in this behavior. `repoaxis view` is a foreground localhost process; when it exits, no viewer process remains.

## Target resolution

Commands that accept `TARGET` try an exact node ID first. They then accept an exact repository path, an exact qualified name or `path:qualified_name` symbol form, and finally a unique structural search match. When multiple nodes remain plausible, Repoaxis returns an ambiguity error rather than choosing one.

Examples:

```bash
repoaxis view
repoaxis find parseConfig
repoaxis context src/config.js:parseConfig
repoaxis why src/config.js:parseConfig
repoaxis show file:src/config.js
repoaxis refs src/config.js
repoaxis parents src/config.js:parseConfig
repoaxis children src/config.js
repoaxis changed --staged
repoaxis unreferenced
repoaxis note src/config.js:parseConfig "Configuration boundary used by the CLI."
repoaxis note src/config.js:parseConfig
repoaxis notes
repoaxis note function:src/config.js::parseConfig --clear
```
