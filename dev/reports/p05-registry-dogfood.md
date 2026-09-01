# P05 · Registry Install & Public Onboarding

Status: CLOSED

## External dogfood

GitHub Actions run `33499292847` executed Repoaxis from a clean temporary Git repository using only the public npm package:

```bash
npx -y repoaxis@0.12.1 ...
```

The fixture did not execute the Repoaxis checkout. The run verified registry metadata, `doctor`, `build`, `summary`, `find`, `context`, `why`, `unreferenced`, durable `note`, query-time refresh, `.repoaxis.json` deletion/recovery, and the read-only viewer API.

Observed final fixture state:

- 18 indexed nodes
- 24 canonical edges
- 4 Git change records
- 1 durable annotation
- modified `src/config.js`
- staged-modified `src/service.js`
- untracked `src/untracked.js`
- staged-deleted `src/unused-tool.js`

The workflow captured the real public-package viewer through headless Chrome and uploaded both a PNG and rendered HTML snapshot.

## Human-surface finding

The registry dogfood exposed a viewer projection gap rather than an index/CLI defect:

1. The tree collapsed staged-only and unstaged modifications into the same `modified` badge.
2. A deleted tracked path was present in `generated.git_changes` but invisible in the current structure tree because no current filesystem node exists.

## Hardening

P05 adds:

- distinct working-tree and staged badges in the structure tree;
- a read-only **Changes** surface driven directly by `generated.git_changes`;
- visibility for deleted paths with no current node;
- `#structure`, `#dependencies`, `#changes`, and `#graph` viewer deep links;
- browser-free integration assertions for the new surface.

No new repository model or mutation path is introduced. The viewer remains a projection of the canonical index.

## Closure gate

P05 hardening passed full repository CI and merged in PR #21. Release 0.12.2 publishes that hardened viewer so a registry-only follow-up can capture the complete `#changes` surface from the public package.
