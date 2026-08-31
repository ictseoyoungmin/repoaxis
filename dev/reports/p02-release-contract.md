# P02 · Release Automation & Publish Contract

Status: CLOSED

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

## Verification

Final PR CI passes `npm run check` and `npm run release:dry-run` with 37/37 tests green. The dry-run produces `repoaxis-0.12.0.tgz`, its SHA-256 checksum, `release-manifest.json`, and CHANGELOG-derived release notes in a temporary directory, validates them, then removes the temporary output.

The verified dry-run SHA-256 on the reviewed head was `1c9a65e0120a1ef1ef9a36467a5245d67d3b16fed063bd28ee66e38ffeb34919`. The release workflow uses `actions/checkout@v6` and `actions/setup-node@v6`, disables package-manager caching for the release job, and contains no npm publication step.
