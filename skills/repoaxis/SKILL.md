---
name: repoaxis
description: Use Repoaxis to build, validate, and query a local Git-aware repository structural index before broad repository exploration. Use when locating code, inspecting structural relationships, checking Git working-tree state or file commit context, preparing focused repository context, and preserving non-obvious repository knowledge for later coding-agent sessions.
---

# Repoaxis

Repoaxis provides a local, rebuildable structural index for a Git repository. Treat the repository and current working tree as authoritative; treat `.repoaxis.json` as derived state.

## Operating rules

1. Prefer Repoaxis before broad repository scans when an index is available.
2. Start a focused coding task with `context TARGET` when the target is known; use `find` first when it is not.
3. Use `why TARGET` when dependency provenance matters, then open only the source ranges or files the structural evidence identifies.
4. Never treat `.repoaxis.json` as the source of truth for code or Git state.
5. Record durable, non-obvious architectural or runtime knowledge with `note TARGET ...`; do not put transient scratch thoughts in annotations.
6. Clear a stale annotation explicitly rather than editing generated graph data or allowing a rebuild to silently discard it.
7. Do not classify an unreferenced node as dead code without runtime or framework evidence.
8. Treat `refs` and `why` as canonical graph evidence only; they do not imply function-call or runtime-entry analysis.
9. Read only the source needed to answer the current task after structural context narrows the scope.
10. Use only commands exposed by `repoaxis help` for the installed version.

## Core commands

```bash
repoaxis build
repoaxis find parseConfig
repoaxis context src/config.js:parseConfig
repoaxis why src/config.js:parseConfig
repoaxis show src/config.js:parseConfig
repoaxis refs src/config.js
repoaxis parents src/config.js:parseConfig
repoaxis children src/config.js
repoaxis changed
repoaxis changed --staged
repoaxis note src/config.js:parseConfig "Configuration boundary used by the CLI entry path."
repoaxis note src/config.js:parseConfig
repoaxis notes
repoaxis note src/config.js:parseConfig --clear
repoaxis validate
repoaxis summary
repoaxis doctor
```

`repoaxis build` writes `.repoaxis.json` at the Git root unless another output path is supplied. It indexes the current folder/file hierarchy using standard Git ignore behavior, extracts JavaScript class/function symbols with source ranges and signatures, records repository-local JavaScript dependencies as canonical `imports` edges, attaches exact Git working/staged state to current file nodes, and records the exact last commit that mentions each current tracked file path. Changes whose paths are absent from the current working tree, such as deletions, remain visible through `generated.git_changes`. The generated index is rebuildable; annotations are preserved across rebuilds.

Operational query and annotation commands automatically refresh the default `.repoaxis.json` when the index is missing, the installed Repoaxis version changed, Git HEAD/ref changed, or relevant working-tree/staged content changed. Passing `--index FILE` explicitly selects a snapshot and disables automatic refresh for that command.

## Focused context workflow

When a target is already known:

```text
repoaxis context TARGET
        ↓
repoaxis why TARGET        # when dependency provenance is relevant
        ↓
read only the indicated source file/range
        ↓
edit
        ↓
repoaxis note TARGET ...   # only when durable non-obvious context was learned
```

`context` combines the resolved node, source location when available, containment path, immediate children, containing-file Git state and last commit, matching working-tree change, annotations, repository-local imports, and imported-by relationships. It does not copy source text into the index response.

`why` returns bounded paths composed only from indexed `imports` and `contains` edges. A path may begin at a file with no incoming indexed imports, but that file is not inferred to be a runtime entry point.

## Annotation workflow

Annotations are durable agent/user-authored memory and are separate from generated structure.

- `repoaxis note TARGET "..."` sets or replaces the target's `agent_note`.
- `repoaxis note TARGET` reads the annotation for one target.
- `repoaxis notes` lists annotations and marks entries whose node is no longer present as orphaned.
- `repoaxis note NODE_ID --clear` can remove an orphaned annotation by its exact stored node ID.
- A new note can only be attached to a node that resolves in the current index.
- Rebuilding the index preserves valid annotations; it does not treat them as generated data.

Keep annotations concise and factual. Prefer facts that will materially reduce future repository exploration, such as framework registration, runtime entry behavior, compatibility constraints, or a non-obvious architectural boundary.

## Target resolution

Commands that accept `TARGET` recognize, in order, an exact node ID, an exact repository path, a `path:qualified_name` symbol target, or a unique structural search match. Ambiguous names fail instead of selecting an arbitrary node.

## Index contract

- Authority: Git repository + current working tree.
- Derived index: `.repoaxis.json`.
- Canonical graph: `generated.nodes` + `generated.edges`.
- Current file Git state: `file-node.git`.
- Exact current-path file commit context: `file-node.git.last_commit`.
- Changed paths, including absent deletions: `generated.git_changes`.
- Refresh fingerprint: `generated.refresh.fingerprint`.
- Persistent notes: `annotations`.
- Canonical edge directions are stored once; reverse relationships such as imported-by are derived by consumers.
- Paths in the index use repository-relative POSIX form.
- Git state is data; any color or badge is a UI projection of that data.
- `last_commit` is current-path history only. Repoaxis does not invent commit history for an uncommitted rename, and it does not duplicate full Git history into the index.

## Node identity

Node IDs are deterministic for the same repository-relative identity.

```text
file:src/auth/service.py
class:src/auth/service.py::AuthService
function:src/auth/service.py::AuthService.login
```

Use `repoaxis node-id` when another tool needs the canonical encoding rather than constructing IDs ad hoc.

## Output handling

`find`, `refs`, `parents`, `children`, and `changed` return compact projections intended for agents and shell tools. `show` returns the full indexed node plus its persistent annotation. `context` returns a focused agent packet without source text, and `why` returns bounded structural evidence paths. `note` and `notes` mutate or inspect only the annotation section of a validated index. Validate the index before relying on it if the file may have been edited manually. Use `--index FILE` when you intentionally need a fixed historical or test snapshot instead of current repository state.
