---
name: repoaxis
description: Use Repoaxis to build, validate, and query a local Git-aware repository structural index before broad repository exploration. Use when locating code, inspecting structural relationships, checking Git working-tree state or file commit context, and preparing focused repository context for a coding task.
---

# Repoaxis

Repoaxis provides a local, rebuildable structural index for a Git repository. Treat the repository and current working tree as authoritative; treat `.repoaxis.json` as derived state.

## Operating rules

1. Prefer Repoaxis before broad repository scans when an index is available.
2. Start a focused coding task with `context TARGET` when the target is known; use `find` first when it is not.
3. Use `why TARGET` when dependency provenance matters, then open only the source ranges or files the structural evidence identifies.
4. Never treat `.repoaxis.json` as the source of truth for code or Git state.
5. Preserve annotations when rebuilding the generated index.
6. Do not classify an unreferenced node as dead code without runtime or framework evidence.
7. Treat `refs` and `why` as canonical graph evidence only; they do not imply function-call or runtime-entry analysis.
8. Read only the source needed to answer the current task after structural context narrows the scope.
9. Use only commands exposed by `repoaxis help` for the installed version.

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
repoaxis validate
repoaxis summary
repoaxis doctor
```

`repoaxis build` writes `.repoaxis.json` at the Git root unless another output path is supplied. It indexes the current folder/file hierarchy using standard Git ignore behavior, extracts JavaScript class/function symbols with source ranges and signatures, records repository-local JavaScript dependencies as canonical `imports` edges, attaches exact Git working/staged state to current file nodes, and records the exact last commit that mentions each current tracked file path. Changes whose paths are absent from the current working tree, such as deletions, remain visible through `generated.git_changes`. The generated index is rebuildable; annotations are preserved across rebuilds.

Query commands emit compact JSON and read the current index snapshot. They do not automatically rebuild or refresh the index.

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
```

`context` combines the resolved node, source location when available, containment path, immediate children, containing-file Git state and last commit, matching working-tree change, annotations, repository-local imports, and imported-by relationships. It does not copy source text into the index response.

`why` returns bounded paths composed only from indexed `imports` and `contains` edges. A path may begin at a file with no incoming indexed imports, but that file is not inferred to be a runtime entry point.

## Target resolution

Commands that accept `TARGET` recognize, in order, an exact node ID, an exact repository path, a `path:qualified_name` symbol target, or a unique structural search match. Ambiguous names fail instead of selecting an arbitrary node.

## Index contract

- Authority: Git repository + current working tree.
- Derived index: `.repoaxis.json`.
- Canonical graph: `generated.nodes` + `generated.edges`.
- Current file Git state: `file-node.git`.
- Exact current-path file commit context: `file-node.git.last_commit`.
- Changed paths, including absent deletions: `generated.git_changes`.
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

`find`, `refs`, `parents`, `children`, and `changed` return compact projections intended for agents and shell tools. `show` returns the full indexed node plus its persistent annotation. `context` returns a focused agent packet without source text, and `why` returns bounded structural evidence paths. Validate the index before relying on it if the file may have been edited manually.
