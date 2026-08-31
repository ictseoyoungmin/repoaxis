# S09 Refresh Automation closure

## Scope

Keep the default derived index current at query time without introducing an always-on daemon.

## Closed behavior

- Missing default index triggers an on-demand build before an operational query.
- Tool-version, HEAD, branch-ref, working-tree, repeated dirty-content, and staged-index changes make the default index stale.
- Dirty/untracked file content and staged index records participate in the freshness fingerprint.
- `.repoaxis.json` is excluded from its own freshness fingerprint.
- `--index FILE` is explicit snapshot mode and does not auto-refresh.
- Invalid indexes fail instead of being silently replaced.
- Rebuilds preserve annotations and generated index writes use atomic replacement.
- No persistent daemon is introduced.

## Verification

- Integration coverage added for missing index, fresh no-op queries, repeated dirty saves, repeated staging, HEAD changes, explicit snapshot mode, CLI-triggered refresh, and self-output exclusion.
- Repository CI runs `npm run check` and `npm run release:dry-run` on pull requests and main pushes.

## Explicit non-goals

- No filesystem watcher yet.
- No always-on background process.
- No incremental AST/dependency rebuild; stale detection currently rebuilds the derived index as one operation.
- No cross-process write lock beyond atomic file replacement.
