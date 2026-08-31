# S11 dogfood and hardening closure

## Representative repository

The dogfood fixture materializes 38 files with two explicit entry paths, one circular import pair, indirect package-script/worker entry files, and layered application dependencies.

## Agent-first evidence

For `parseConfig`, `context` resolves directly to `src/config/parse.js`. `why` returns bounded import/containment provenance from multiple entry paths and every returned provenance path touches at most five files, materially below the repository's 30+ indexed file nodes.

No source text is added to the context packet; the output narrows the next source read instead of replacing it with another broad dump.

## Candidate evidence

`repoaxis unreferenced` is derived only from missing incoming repository-local imports for JavaScript file nodes. It includes known legitimate runtime candidates such as `src/cli.js`, `src/server.js`, and `scripts/migrate.js` and explicitly warns that the result is not a dead-code finding.

## Durable memory evidence

A note is attached to `scripts/migrate.js`, the generated `.repoaxis.json` is deleted, and the index is rebuilt. The generated projection is deterministic for the same repository state and the annotation survives through the Git metadata store.

## Change / refresh evidence

The same fixture is then mutated into modified, staged, deleted, and untracked states. Query-time refresh detects the change and preserves the durable annotation in the refreshed index.

## Human surface evidence

The localhost viewer is started against the representative repository. Its API returns the fresh graph with 40+ structural nodes, canonical import edges, Git state, and the durable annotation.

## Distribution evidence

The npm artifact is packed and installed into an isolated temporary project. The installed `repoaxis` binary reports the expected version, Codex/Claude manifests and `skills/repoaxis/SKILL.md` are present, and `dev/` is absent from the installed package.

## Closure rule

Close only when the final PR head passes the complete GitHub Actions `npm run check` and `npm run release:dry-run` workflows with the dogfood and packed-install tests enabled, and the PR contains no call graph, semantic-search, database, always-on daemon, ownership/co-change, or framework-inference expansion.
