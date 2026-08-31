# P02 · Release Automation & Publish Contract

Status: REVIEW

## Goal

Create a tag-gated GitHub Release pipeline for the existing `0.12.0` package while keeping npm publication disabled until package ownership and trusted publishing are explicitly configured.

## Contract

- Release tag must equal `v${package.json.version}`.
- Codex and Claude plugin manifest versions must equal the package version.
- `CHANGELOG.md` must contain a dated, non-empty section for the package version.
- `package.json#repository.url` must remain `git+https://github.com/ictseoyoungmin/repoaxis.git`.
- Release tags must point to commits reachable from `main`.
- The tag workflow reruns the full test suite before creating release assets.
- Release assets are the npm tarball, SHA-256 checksum, deterministic manifest metadata, and CHANGELOG-derived notes.
- The release workflow must not contain `npm publish` until trusted publishing is deliberately enabled.

## Verification target

PR CI must pass `npm run check` and `npm run release:dry-run` on the final head. The dry-run must create and validate the real release artifact set in a temporary directory.
