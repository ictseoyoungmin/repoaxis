# Git context boundary

S05 adds exact file-level commit context without copying Git history into the Repoaxis index.

- `file-node.git.last_commit` is derived from `git log -1 -- <current-path>`.
- Stored fields are commit SHA, author name, authored time, committed time, and subject.
- Untracked and never-committed staged additions use `last_commit: null`.
- Uncommitted renames keep `rename_from` from Git state but do not inherit the old path's commit as the new path's history.
- Symbol-level commit attribution is not inferred in this slice; symbols use their containing file as the exact Git context boundary.
- The implementation intentionally prefers semantic exactness over speculative rename/history heuristics.
- Per-file Git subprocess cost remains measurable technical debt for later dogfood/performance hardening rather than being hidden behind a broader history scan.
