---
name: repoaxis
description: Use Repoaxis to build, validate, and inspect a local Git-aware repository structural index before broad repository exploration. Use when checking repository structure, index health, or preparing focused repository context for a coding task.
---

# Repoaxis

Repoaxis provides a local, rebuildable structural index for a Git repository. Treat the repository and current working tree as authoritative; treat `.repoaxis.json` as derived state.

## Operating rules

1. Prefer Repoaxis before broad repository scans when an index is available.
2. Never treat `.repoaxis.json` as the source of truth for code or Git state.
3. Preserve annotations when rebuilding the generated index.
4. Do not classify an unreferenced node as dead code without runtime or framework evidence.
5. Read only the source needed to answer the current task after structural context narrows the scope.
6. Use only commands exposed by `repoaxis help` for the installed version.

## Core commands

```bash
repoaxis doctor
repoaxis build
repoaxis validate
repoaxis summary
repoaxis node-id file src/config.js
repoaxis help
```

`repoaxis build` writes `.repoaxis.json` at the Git root unless another output path is supplied. It indexes the current folder/file hierarchy using standard Git ignore behavior. The generated graph is rebuildable; annotations are preserved across rebuilds.

## Index contract

- Authority: Git repository + current working tree.
- Derived index: `.repoaxis.json`.
- Canonical graph: `generated.nodes` + `generated.edges`.
- Persistent notes: `annotations`.
- Canonical edge directions are stored once; reverse relationships are derived by consumers.
- Paths in the index use repository-relative POSIX form.

## Node identity

Node IDs are deterministic for the same repository-relative identity.

```text
file:src/auth/service.py
class:src/auth/service.py::AuthService
func:src/auth/service.py::AuthService.login
```

Use `repoaxis node-id` when another tool needs the canonical encoding rather than constructing IDs ad hoc.

## Output handling

Repoaxis data commands emit compact JSON summaries suitable for shell tools and agents. Validate the index before relying on it if the file may have been edited manually.
