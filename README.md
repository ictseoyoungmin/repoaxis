# Repoaxis

**Git-aware structural index for coding agents and humans.**

Repoaxis lets coding agents query repository structure before broad source scans while giving humans a local view of the same structural state. Git plus the current working tree are authoritative; `.repoaxis.json` is a rebuildable derived index.

The index contains deterministic folder/file hierarchy, JavaScript (`.js`, `.mjs`, `.cjs`) class/function symbols, canonical containment, source ranges/signatures, repository-local `imports` edges, exact Git working/staged state, current-path last-file commit context, and changed paths such as deletions. Reverse import relationships are derived instead of stored twice.

Default operational commands keep `.repoaxis.json` current on demand. Repoaxis compares a compact repository fingerprint and rebuilds when the index is missing or stale. No always-on daemon is required. Passing `--index FILE` explicitly opts into fixed snapshot behavior instead.

Durable repository notes are authored separately from generated structure. They are projected into `.repoaxis.json` for consumers and also stored under Git metadata so deleting and rebuilding the derived index does not destroy repository memory.

## Quick start

```bash
npm install
npm test
node bin/repoaxis doctor
node bin/repoaxis context parseConfig
node bin/repoaxis unreferenced
node bin/repoaxis view
```

When published as the `repoaxis` npm package:

```bash
npx repoaxis doctor
npx repoaxis context parseConfig
npx repoaxis why parseConfig
npx repoaxis unreferenced
npx repoaxis note parseConfig "Configuration boundary used by the CLI."
npx repoaxis view
```

`repoaxis unreferenced` lists JavaScript files with no incoming repository-local import. This is a conservative structural candidate list, not a dead-code verdict. CLI entry points, migrations, workers, framework registration, configuration-driven modules, fixtures, and plugins may legitimately appear there.

`repoaxis view` starts a read-only structural viewer on `127.0.0.1`. It shows the canonical folder/file/class/function tree, Git status and last-file commit context, stored annotations, repository-local imports and reverse imports, and a bounded dependency graph. The browser polls the local viewer API while open, and the API reuses Repoaxis freshness checks so the view follows the working tree without an always-on daemon.

A focused agent workflow is:

```text
repoaxis find TARGET       # only when the target is not already known
repoaxis context TARGET    # refreshes the default index first when needed
repoaxis why TARGET        # when dependency provenance matters
read only the indicated source file/range
edit
repoaxis note TARGET ...   # only for durable non-obvious context
```

## Distribution surfaces

- `skills/repoaxis/` — installable agent skill and its runtime source.
- `.claude-plugin/plugin.json` — Claude Code plugin manifest.
- `.codex-plugin/plugin.json` — Codex plugin manifest.
- `bin/repoaxis` — npm/CLI entrypoint.
- `docs/` — user-facing installation and format references.
- `dev/` — repository-only design, fixtures, tests, and release checks.

The runtime implementation exists once under `skills/repoaxis/`; the package entrypoint and plugin manifests route to that same source.

## Current CLI

```text
repoaxis build
repoaxis view
repoaxis validate
repoaxis summary
repoaxis find
repoaxis show
repoaxis refs
repoaxis parents
repoaxis children
repoaxis changed
repoaxis unreferenced
repoaxis context
repoaxis why
repoaxis note
repoaxis notes
repoaxis doctor
repoaxis node-id
```

Operational query and annotation commands refresh the default `.repoaxis.json` when Git HEAD/ref or relevant working/staged content changes, then emit compact JSON. `context` combines structural, Git, commit, change, and annotation evidence without embedding source text. `why` reports bounded paths from the canonical graph and does not infer runtime entry points or function calls.

`note` and `notes` provide the persistent memory surface. New notes can only be attached to a current resolved node. Default repository notes are stored under Git metadata and projected into the current index, so deleting `.repoaxis.json` does not delete them. If a node later disappears, the annotation is retained and reported as orphaned until it is explicitly cleared by exact node ID.

Use `--index FILE` on operational commands when you intentionally want to query or mutate an explicit snapshot without automatic refresh. The human viewer intentionally follows only the default current repository index and is read-only.

See `docs/cli.md`, `docs/viewer.md`, and `docs/installation.md`.
