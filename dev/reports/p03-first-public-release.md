# P03 · First Public Release & npm Bootstrap

Status: REVIEW

## Goal

Create Repoaxis's first public GitHub Release for `v0.12.0` without requiring a manual tag operation, while keeping npm publication disabled until registry ownership is explicitly established.

## Bootstrap contract

- Normal future releases remain tag-triggered through `.github/workflows/release.yml`.
- The first release adds one guarded main-push path scoped only to `dev/reports/p03-release-request.json`.
- On that one-time path, the workflow derives `v${package.json.version}`, refuses to overwrite an existing tag, tags the merge commit, and creates the release in the same workflow run.
- The release commit must be reachable from `main`.
- Full tests run again before release asset creation.
- `npm publish` remains absent.

## Closure target

1. PR CI is green on the final head.
2. Merge triggers the guarded bootstrap run.
3. `v0.12.0` is created on the P03 main merge commit.
4. GitHub Release `v0.12.0` exists with the npm tarball, SHA-256 file, and release manifest.
5. npm registry status is recorded separately; lack of package ownership must not block the GitHub Release.
