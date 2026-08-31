# P01 — First-run & Distribution Readiness

## Bottleneck

A correct V1 engine is not yet a usable product if a new user cannot install it, run it against their own repository, or import the plugin without hand-editing local marketplace state.

## Scope

- keep the V1 runtime architecture unchanged
- make the README first-run commands operate from the target Git repository
- add a repository-level `.agents/plugins/marketplace.json`
- make the npm tarball carry the marketplace and canonical plugin/skill surfaces
- run the installed tarball binary against a fresh Git repository, not only against Repoaxis fixtures
- align installation docs with GitHub marketplace import

## First-run proof

The package-install integration test must perform this sequence using only the binary from the packed and reinstalled npm artifact:

1. create a fresh Git repository
2. `repoaxis doctor`
3. `repoaxis build`
4. `repoaxis summary`
5. `repoaxis find parseConfig`
6. `repoaxis context parseConfig`
7. `repoaxis why parseConfig`
8. `repoaxis unreferenced`
9. `repoaxis note parseConfig ...`
10. delete `.repoaxis.json`
11. `repoaxis context parseConfig` and prove automatic rebuild plus note recovery

## Distribution proof

The installed package must contain:

- `.agents/plugins/marketplace.json`
- `.codex-plugin/plugin.json`
- `.claude-plugin/plugin.json`
- `skills/repoaxis/SKILL.md`
- `bin/repoaxis`

It must not contain `dev/`.

## Non-goals

- npm publish
- GitHub Release/tag creation
- new language support
- call graph/data flow
- semantic search or embeddings
- persistent daemon
- viewer redesign

## Close when

P01 is CLOSED when the branch passes the normal CI and `release:dry-run`, the packed-artifact first-run test passes, and README/install docs describe the same path the test executes.
