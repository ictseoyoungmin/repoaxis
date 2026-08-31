# Repoaxis

**Git-aware structural index for coding agents and humans.**

Repoaxis is designed to let coding agents query repository structure before performing broad source scans, while giving humans a local view of the same structural state. Git plus the current working tree are authoritative; `.repoaxis.json` is a rebuildable derived index.

## Quick start

```bash
npm install
npm test
node bin/repoaxis doctor
node bin/repoaxis build
node bin/repoaxis validate
```

When published as the `repoaxis` npm package:

```bash
npx repoaxis doctor
npx repoaxis build
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
repoaxis doctor
repoaxis node-id
```

See `docs/cli.md` and `docs/installation.md`.
