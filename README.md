# Repoaxis

**Git-aware structural index for coding agents and humans.**

Repoaxis lets coding agents query repository structure before broad source scans while giving humans a local view of the same structural state. Git plus the current working tree are authoritative; `.repoaxis.json` is a rebuildable derived index.

The index contains deterministic folder/file hierarchy, JavaScript (`.js`, `.mjs`, `.cjs`) class/function symbols, canonical containment, source ranges/signatures, repository-local `imports` edges, exact Git working/staged state, current-path last-file commit context, and changed paths such as deletions. Reverse import relationships are derived instead of stored twice.

Default operational commands keep `.repoaxis.json` current on demand. Repoaxis compares a compact repository fingerprint and rebuilds when the index is missing or stale. No always-on daemon is required. Passing `--index FILE` explicitly opts into fixed index-snapshot behavior instead.

Durable repository notes are authored separately from generated structure. They are projected into `.repoaxis.json` for consumers and also stored under Git metadata so deleting and rebuilding the derived index does not destroy repository memory.

## First five minutes

Run Repoaxis **from the Git repository you want to inspect**:

```bash
cd /path/to/your-repository
npx -y repoaxis@latest doctor
npx -y repoaxis@latest build
npx -y repoaxis@latest summary
npx -y repoaxis@latest changed
npx -y repoaxis@latest unreferenced
npx -y repoaxis@latest view
```

`build` writes `.repoaxis.json` at the Git root. `summary`, `changed`, and `unreferenced` give useful repository-wide orientation without opening source files, and `view` opens the read-only localhost human surface.

To preserve the current human surface as one portable frozen artifact:

```bash
npx -y repoaxis@latest snapshot --output repoaxis-snapshot.html
```

The snapshot is the same canonical viewer shell with the current index, Git display metadata, and HEAD history embedded at capture time. It opens later without a Repoaxis server and does not refresh repository data after capture.

When you know or can search for a target, narrow before reading source:

```bash
npx -y repoaxis@latest find parseConfig
npx -y repoaxis@latest context parseConfig
npx -y repoaxis@latest why parseConfig
```

Replace `parseConfig` with a symbol or path from your repository. `context` gives the containing file, source range, Git state, imports, reverse imports, and annotations without embedding the source text. `why` gives bounded structural provenance from canonical `imports` and `contains` edges.

`repoaxis unreferenced` lists JavaScript files with no incoming repository-local import. This is a conservative structural candidate list, not a dead-code verdict. CLI entry points, migrations, workers, framework registration, configuration-driven modules, fixtures, and plugins may legitimately appear there.

## Agent workflow

```text
repoaxis find TARGET       # only when the target is not already known
repoaxis context TARGET    # refreshes the default index first when needed
repoaxis why TARGET        # when dependency provenance matters
read only the indicated source file/range
edit
repoaxis note TARGET ...   # only for durable non-obvious context
```

The intended behavior is not “index everything and replace source reading.” Repoaxis should reduce the amount of repository exploration needed before a focused read or edit.

## Plugin distribution

Repoaxis ships a repository-level Codex/ChatGPT marketplace manifest at `.agents/plugins/marketplace.json`, plus standalone Codex and Claude plugin manifests.

For a managed ChatGPT/Codex workspace that supports GitHub marketplace import:

1. Open **Workspace settings → Plugins**.
2. Choose **Add → Import marketplace**.
3. Use `https://github.com/ictseoyoungmin/repoaxis` as the source repository.
4. Leave **Path** empty because the marketplace manifest is at the repository root.
5. Use the default branch for continuously synced updates, or pin a tag/commit when you need a fixed revision.

For local Claude Code development, see `docs/installation.md`. The CLI remains independently usable through npm/npx even when an agent host does not expose plugin executables directly.

## Human viewer

`repoaxis view` starts a read-only structural viewer on `127.0.0.1`. Structure begins with a macro repository topology and drills into bounded labeled subtrees; Dependencies keeps one explicit root with Back/Initial-root/root-trail navigation; Changes supports direct multi-file selection and combined impact analysis; and Graph keeps dense imports readable through bounded/focused projections, spacing-first geometry, directional routing, and impact framing. The Inspector stays attached to the current analysis target across surfaces.

Cross-view navigation preserves why a target moved. A class or function sent to Dependencies or Graph is explicitly projected to its containing file, the original symbol remains visible in the selection context, and the destination receives a short arrival highlight so it can be reacquired immediately. Working/staged Git state, deleted paths, last-file commit context, annotations, canonical imports, search, and viewport-aware pan/zoom continue to use the same live repository index. The browser polls the local viewer API while open so the view follows the working tree without an always-on daemon.

`repoaxis snapshot` exports that same product shell as a self-contained frozen HTML file. The export inlines the shipped viewer assets and the current read-only viewer responses rather than maintaining a separate snapshot UI or repository model. Snapshot mode is intentionally frozen: it preserves the captured Structure, Dependencies, Changes, Graph, Inspector, Git overlays, cross-view continuity, and navigation but never claims to remain current after capture.

## Distribution surfaces

- `.agents/plugins/marketplace.json` — repository-level Codex/ChatGPT marketplace catalog.
- `skills/repoaxis/` — installable agent skill and its runtime source.
- `.claude-plugin/plugin.json` — Claude Code plugin manifest.
- `.codex-plugin/plugin.json` — Codex plugin manifest.
- `bin/repoaxis` — npm/CLI entrypoint.
- `docs/` — user-facing installation and format references.
- `dev/` — repository-only design, fixtures, tests, and release checks; excluded from the npm tarball.

The runtime implementation exists once under `skills/repoaxis/`; the package entrypoint and plugin manifests route to that same source.

## Current CLI

```text
repoaxis build
repoaxis view
repoaxis snapshot
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

Use `--index FILE` on operational commands when you intentionally want to query or mutate an explicit index snapshot without automatic refresh. `repoaxis view` intentionally follows only the default current repository index and is read-only; `repoaxis snapshot` captures one frozen HTML projection of that same viewer state.

See `docs/cli.md`, `docs/viewer.md`, and `docs/installation.md`.
