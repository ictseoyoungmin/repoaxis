# Repoaxis

**Git-aware structural index for coding agents and humans.**

Repoaxis is designed to let coding agents query repository structure before performing broad source scans, while giving humans a local view of the same structural state. Git plus the current working tree are authoritative; `.repoaxis.json` is a rebuildable derived index. `repoaxis build` materializes the deterministic folder/file hierarchy and, for JavaScript (`.js`, `.mjs`, `.cjs`), class/function symbols with canonical containment, source ranges, and signatures. Repository-local JavaScript imports are resolved into directional file-to-file `imports` edges without storing duplicated reverse edges. Current file nodes also carry exact Git working/staged state and current-path last-commit context, while `generated.git_changes` keeps changed paths such as deletions visible even when no current filesystem node exists. Durable user/agent notes live separately under `annotations` and survive generated-index rebuilds.

Default operational commands keep `.repoaxis.json` current on demand. Before answering, Repoaxis compares a compact repository fingerprint and rebuilds when the index is missing or stale. No always-on daemon is required. Passing `--index FILE` explicitly opts into fixed snapshot behavior instead.

## Quick start

```bash
npm install
npm test
node bin/repoaxis doctor
node bin/repoaxis build
node bin/repoaxis context parseConfig
```

When published as the `repoaxis` npm package:

```bash
npx repoaxis doctor
npx repoaxis context parseConfig
npx repoaxis why parseConfig
npx repoaxis note parseConfig "Configuration boundary used by the CLI."
```

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
repoaxis validate
repoaxis summary
repoaxis find
repoaxis show
repoaxis refs
repoaxis parents
repoaxis children
repoaxis changed
repoaxis context
repoaxis why
repoaxis note
repoaxis notes
repoaxis doctor
repoaxis node-id
```

Operational query and annotation commands refresh the default `.repoaxis.json` when Git HEAD/ref or relevant working/staged content changes, then emit compact JSON. `context` combines structural, Git, commit, change, and annotation evidence without embedding source text. `why` reports bounded paths from the canonical graph and does not infer runtime entry points or function calls.

`note` and `notes` provide the persistent memory surface. New notes can only be attached to a current resolved node; rebuilds preserve them. If a node later disappears, the annotation is retained and reported as orphaned until it is explicitly cleared by exact node ID.

Use `--index FILE` on operational commands when you intentionally want to query or mutate an explicit snapshot without automatic refresh.

See `docs/cli.md` and `docs/installation.md`.
