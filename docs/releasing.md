# Releasing Repoaxis

Repoaxis uses one tag-triggered release workflow for GitHub Release assets and npm publication.

## Release flow

A release is created only by pushing a version tag that matches `package.json` exactly:

```bash
npm run check
npm run release:dry-run
git tag v0.12.1
git push origin v0.12.1
```

The workflow verifies that the tagged commit is on `main`, reruns the full test suite, validates package/plugin/CHANGELOG version alignment, and prepares:

- `repoaxis-<version>.tgz`
- `repoaxis-<version>.tgz.sha256`
- `release-manifest.json`
- release notes extracted from `CHANGELOG.md`

The same prepared `.tgz` is then published to npm with GitHub Actions OIDC trusted publishing. No long-lived npm publish token is stored in this repository. For this public repository/public package combination, npm trusted publishing automatically creates provenance attestations.

If the exact npm version already exists, the workflow skips `npm publish` so a rerun can still recover GitHub Release assets. GitHub Release upload is also rerunnable with `--clobber`.

A tag such as `v0.12.2` is rejected while `package.json` still says `0.12.1`.

## Trusted Publisher configuration

The npm package must trust exactly this GitHub workflow:

- GitHub user/organization: `ictseoyoungmin`
- Repository: `repoaxis`
- Workflow filename: `release.yml`
- Environment: none
- Allowed action: `npm publish`

With npm CLI 11.5.1 or later and account-level 2FA enabled, the relationship can be configured from an authenticated terminal:

```bash
npm trust github repoaxis \
  --file release.yml \
  --repo ictseoyoungmin/repoaxis \
  --allow-publish \
  -y
```

The equivalent setting is available on npmjs.com under the `repoaxis` package settings → Trusted Publisher → GitHub Actions. Enter only `release.yml` for the workflow filename, not `.github/workflows/release.yml`.

After trusted publishing has been verified with a real release, npm recommends restricting traditional package publishing access to require 2FA and disallow tokens.

## Supply-chain boundary

`package.json#repository.url` is pinned to:

```text
git+https://github.com/ictseoyoungmin/repoaxis.git
```

That value must continue to match the publishing GitHub repository. The release workflow requires `id-token: write`, uses a GitHub-hosted runner with Node 24, points npm at `https://registry.npmjs.org`, and must not contain `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or an npm publish secret.

## Local artifact preparation

To inspect the same release assets without creating a tag, GitHub Release, or npm publish:

```bash
npm run release:dry-run
npm run release:prepare -- --tag v0.12.0 --out dist/release
```

`release:dry-run` creates the artifact set in a temporary directory and removes it after validation. `release:prepare` writes the assets to the requested output directory.
