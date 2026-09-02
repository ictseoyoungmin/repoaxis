# U05 Dependency navigation continuity visual evidence

Actual Repoaxis branch viewer captured at 1600×1000.

Validated flow:

- Entering Dependencies establishes `skills/repoaxis/lib/indexer.mjs` as the explicit initial root.
- Selecting `skills/repoaxis/lib/fresh-index.mjs` opens its Inspector while the root remains `indexer.mjs`.
- `Use selected as root` promotes `fresh-index.mjs` explicitly rather than silently rerooting during inspection.
- The promoted view preserves a clickable root trail: `indexer.mjs › fresh-index.mjs`.
- The promoted root retains real dependency context: 7 reachable, 3 repeated routes, and 4 / 4 direct in / out relationships in the captured direction.
- Back returns to `indexer.mjs` and disables itself once the initial root is restored.
- Initial root remains available as a direct escape while traversing a deeper root trail.

Visual capture:

- branch capture commit: `230c9ff04f1c23cafb12c122c3bd2fa19dab5346`
- GitHub Actions run: `33639505491`
- artifact: `9850217526`
- artifact digest: `sha256:555ab747f155dc9ebe7559e129b62f315705486c6d3dd35f90fa029e0c8e5101`
- `u05-dependency-inspect.png`
- `u05-dependency-reroot.png`
- `u05-dependency-back.png`
- `u05-dependency-navigation.html`

The temporary Playwright helper and snapshot workflow were removed before PR creation.
