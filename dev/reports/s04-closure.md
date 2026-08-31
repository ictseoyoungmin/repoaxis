# S04 Closure Report — Git State

Date: 2026-08-31

## Capability closed

- Current file nodes carry exact top-level Git state with independent working-tree and staged dimensions.
- Porcelain v2 parsing covers modified, added, deleted, renamed, copied, type-changed, untracked, staged, and conflicted records.
- Rename/copy source paths and similarity values are preserved when Git reports them.
- Unmerged records preserve conflict state and the two-character conflict code.
- Deleted tracked paths remain outside the current filesystem graph and stay visible through `generated.git_changes`.
- The generated index path is excluded from Git changes, preserving deterministic rebuilds when `.repoaxis.json` is untracked.
- Schema version 1 remains compatible: Git state fields are validated when present but are not required on older v1 indexes.

## Verification

Focused local tests exercised real temporary Git repositories for working-only, staged-only, mixed staged+working, deletion, rename, untracked, and merge-conflict cases. All focused tests passed. Repository integration coverage additionally checks node projection, absent deletion records, output exclusion, validation, and byte-stable rebuild behavior.

## Scope boundary

Last-commit metadata and historical projections remain outside this closure. Folder-level Git aggregation and UI colors are derived views rather than stored Git authority.
