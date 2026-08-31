# Human Viewer closure

Close when the installed Repoaxis package can start a loopback-only read-only human surface that follows the current canonical index without introducing a second repository model.

Required evidence:

- `repoaxis view` CLI exists with root/port/no-open controls.
- Viewer binds to `127.0.0.1`.
- Structure tree renders canonical folder/file/class/function containment.
- Dependency view derives imports and imported-by without persisting reverse edges.
- Graph view is bounded for large repositories.
- Inspector exposes source range/signature, Git state, exact last-file commit context, and annotations.
- Viewer API returns fresh default-index state after working-tree changes.
- Viewer exposes no write endpoint or source-file-content endpoint.
- Bundled browser script compiles in CI.
- Full repository `npm run check` and `npm run release:dry-run` pass in PR CI.
