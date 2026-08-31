# Git state projection

Repoaxis reads `git status --porcelain=v2 -z --untracked-files=all --find-renames=50%` so file state is independent of localized CLI output and user rename-detection configuration.

Current filesystem nodes receive top-level `git` data with independent working-tree and staged state. This preserves mixed states such as a staged modification followed by another working-tree edit.

Deleted tracked paths remain absent from the filesystem graph. They are represented in `generated.git_changes` instead of being reintroduced as tombstone file nodes. Rename/copy records keep the current path as the node identity and preserve the source path in `rename_from` / `copy_from`.

The index output path is filtered from Git changes using the same exclusion passed to filesystem indexing. This prevents `.repoaxis.json` from becoming a self-observed untracked change on the next build.

Git state remains data. Viewer colors, badges, and grouping are derived presentation and must not become serialized authority.
