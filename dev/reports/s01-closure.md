# S01 Closure Report — Filesystem Index

Date: 2026-08-31

## Capability closed

- `repoaxis build` emits a canonical folder/file graph instead of an empty bootstrap graph.
- `folder:.` is the portable repository root node.
- Folder and file IDs remain deterministic repository-relative POSIX identities.
- Direct hierarchy is represented by canonical `contains` edges.
- Standard Git ignore rules are respected through `git ls-files --cached --others --exclude-standard`.
- Visible untracked files are included.
- Deleted tracked files are absent from the current filesystem projection.
- File nodes expose cheap deterministic metadata: byte size, extension, and symlink state.
- Generated state remains byte-stable for the same repository state and preserves annotations.

## Scope boundary

Symbol extraction, import edges, Git working-tree status metadata, last-commit metadata, structural query commands, watcher refresh, and interactive graph behavior are not part of this closure.
