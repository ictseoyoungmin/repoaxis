# P03 · First Public Release & npm Bootstrap

Status: CLOSED

## Result

Repoaxis `v0.12.0` was released publicly from main commit `9ea8fb600aaa50f4c63792f300cf5edbd8a816a1`.

- Git tag: `v0.12.0`
- GitHub Release: `https://github.com/ictseoyoungmin/repoaxis/releases/tag/v0.12.0`
- Release assets: `repoaxis-0.12.0.tgz`, `repoaxis-0.12.0.tgz.sha256`, `release-manifest.json`
- Tarball SHA-256: `1c9a65e0120a1ef1ef9a36467a5245d67d3b16fed063bd28ee66e38ffeb34919`
- The public release artifact digest matches the reviewed P02 dry-run digest.
- Full release workflow completed successfully before publication.

## Bootstrap cleanup

The temporary main-push bootstrap path was removed after the first release. Future releases use the normal guarded `vX.Y.Z` tag-triggered workflow only.

## npm boundary

No npm publication was performed.

Current public searches do not expose an existing `repoaxis` package, and npm trusted publishing cannot be configured until the package already exists in the registry. The first npm publication therefore requires a one-time authenticated npm-owner action. After the package exists, configure GitHub Actions as a Trusted Publisher and enable tokenless OIDC publication with provenance for later releases.

This npm ownership bootstrap is external account administration, not a Repoaxis runtime or release-pipeline defect, and does not block the completed GitHub Release.
