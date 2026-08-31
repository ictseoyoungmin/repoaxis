# Releasing Repoaxis

Repoaxis separates GitHub release creation from npm publication.

## GitHub Release

A release is created only by pushing a version tag that matches `package.json` exactly:

```bash
npm run check
npm run release:dry-run
git tag v0.12.0
git push origin v0.12.0
```

The tag-triggered workflow verifies that the tagged commit is on `main`, reruns the full test suite, validates package/plugin/CHANGELOG version alignment, and prepares:

- `repoaxis-<version>.tgz`
- `repoaxis-<version>.tgz.sha256`
- `release-manifest.json`
- release notes extracted from `CHANGELOG.md`

The workflow then creates the GitHub Release from those assets. A tag such as `v0.12.1` is rejected while `package.json` still says `0.12.0`.

## npm publication boundary

The release workflow intentionally does **not** run `npm publish`.

Before automated npm publishing is enabled, the `repoaxis` package must be owned on npm and GitHub Actions trusted publishing must be configured for this repository and the exact publish workflow. npm currently recommends OIDC trusted publishing instead of long-lived automation tokens. For a public package from this public GitHub repository, trusted publishing also supplies provenance automatically.

The package repository URL is pinned to:

```text
git+https://github.com/ictseoyoungmin/repoaxis.git
```

That value must continue to match the publishing GitHub repository.

After package ownership exists, configure a trusted publisher on npm for `ictseoyoungmin/repoaxis` and the future publish workflow. Do not add a long-lived `NPM_TOKEN` to this repository merely to bypass that setup.

## Local artifact preparation

To inspect the same release assets without creating a tag or GitHub Release:

```bash
npm run release:dry-run
npm run release:prepare -- --tag v0.12.0 --out dist/release
```

`release:dry-run` creates the artifact set in a temporary directory and removes it after validation. `release:prepare` writes the assets to the requested output directory.
