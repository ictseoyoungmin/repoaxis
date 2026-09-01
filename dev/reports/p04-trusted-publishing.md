# P04 · npm Trusted Publishing

Status: CLOSED

## Goal

Move Repoaxis npm releases from interactive/manual publishing to GitHub Actions OIDC trusted publishing without storing a long-lived npm publish token.

## Final contract

- `.github/workflows/release.yml` is the only release workflow and is tag-triggered.
- The release job grants `id-token: write` and runs on a GitHub-hosted runner with Node 24.
- `actions/setup-node@v6` configures `https://registry.npmjs.org` and disables release-job package-manager caching.
- The tested `dist/release/repoaxis-${VERSION}.tgz` is the exact artifact sent to `npm publish --access public`.
- No repository npm publish secret is configured or required; npm authenticates the publish through the configured GitHub Actions Trusted Publisher.
- An already-published exact version is detected with `npm view` and skipped, allowing release reruns.
- Missing versions returned by npm as JSON `E404` are treated as unpublished and proceed to publish.
- GitHub Release asset upload is idempotent through `gh release upload --clobber` when the release already exists.
- The one-time bootstrap path used to create and resume the verification tag was removed after closure.

## Verified release

`repoaxis@0.12.1` verified the complete path on 2026-09-01:

- GitHub Actions release run: `33495170498`
- release job: success
- full repository tests: 38/38 pass
- npm publish: `+ repoaxis@0.12.1`
- GitHub Release: `v0.12.1`
- prepared/public tarball SHA-256: `7027350de28a36482745ca8821541df581dc416520db9e93d89d3c4f38be105a`
- npm reported a signed provenance statement from GitHub Actions
- Sigstore transparency log index: `2674326843`

The npm Trusted Publisher relationship is:

- GitHub: `ictseoyoungmin/repoaxis`
- workflow filename: `release.yml`
- environment: none
- allowed action: `npm publish`

Future releases should require only the normal version/CHANGELOG/manifest bump followed by a matching `v*` tag on `main`; the tag workflow performs tests, artifact preparation, npm publication, provenance generation, and GitHub Release publication.
