# P04 · npm Trusted Publishing

Status: REVIEW

## Goal

Move future Repoaxis npm releases from interactive/manual publishing to GitHub Actions OIDC trusted publishing without storing a long-lived npm publish token.

## Implemented contract

- `.github/workflows/release.yml` remains the only release workflow and stays tag-triggered.
- The release job grants `id-token: write` and runs on a GitHub-hosted runner with Node 24.
- `actions/setup-node@v6` configures `https://registry.npmjs.org` and disables release-job package-manager caching.
- The tested `dist/release/repoaxis-${VERSION}.tgz` is the exact artifact sent to `npm publish --access public`.
- No `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or npm publish secret is allowed by release preflight.
- An already-published exact version is detected with `npm view` and skipped, allowing release reruns.
- GitHub Release asset upload is idempotent through `gh release upload --clobber` when the release already exists.
- Trusted publishing provenance is supplied automatically by npm once the package-side trust relationship is configured.

## External one-time prerequisite

The already-created `repoaxis` package must configure this trusted publisher on npm:

- GitHub: `ictseoyoungmin/repoaxis`
- workflow filename: `release.yml`
- environment: none
- allowed action: `npm publish`

Authenticated npm CLI equivalent:

```bash
npm trust github repoaxis --file release.yml --repo ictseoyoungmin/repoaxis --allow-publish -y
```

P04 is fully CLOSED only after a new patch release is published by this workflow without an npm token and npm shows provenance for that release.
