# Filesystem indexing

The filesystem projection is derived from Git's view of tracked files plus visible untracked files:

```text
git ls-files -z --cached --others --exclude-standard
```

Repoaxis then filters out paths that do not exist as files or symbolic links in the current working tree. This deliberately gives the working tree priority over stale tracked paths while preserving standard Git ignore behavior.

The canonical filesystem graph has one `folder:.` root. Direct containment is represented only by `contains` edges. Folder nodes are inferred from visible file paths, so empty directories are not represented.

File metadata stays cheap and deterministic: `size_bytes`, `extension`, and `symlink`. Content-derived metrics are deferred until they demonstrate enough query value to justify their read cost.
