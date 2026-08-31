# S00 Closure Report — Bootstrap & Contract Freeze

Date: 2026-08-31

## Contract closed

- Git + current working tree are authoritative.
- `.repoaxis.json` is rebuildable derived state.
- Schema version 1 fixes the generated/annotation ownership boundary.
- Canonical graph storage is `generated.nodes` + `generated.edges`.
- Deterministic node IDs use repository-relative POSIX paths.
- Rebuilds preserve valid annotations.
- Package surfaces share one runtime source under `skills/repoaxis/`.
- npm, Claude Code plugin, and Codex plugin distribution metadata are present.

## Verification

- `npm run check`: pass.
- Node test runner: 5/5 tests pass.
- Same repository state → byte-identical bootstrap index: pass.
- Annotation preservation across rebuild: pass.
- Skill-surface forbidden-expression scan: pass.
- Package structure validation: pass.
- `npm pack` install into an isolated temporary project: pass.
- Installed package executable resolves `repoaxis version` and `repoaxis node-id`: pass.
- Both plugin manifests parse as JSON: pass.

## Deliberately not implemented here

Filesystem traversal, AST symbol extraction, import graph extraction, Git working-tree status projection, structural queries, watcher refresh, and full graph viewer behavior remain outside this closure.
