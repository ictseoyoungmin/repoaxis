# S03 Closure Report — Canonical Import Graph

Date: 2026-08-31

## Capability closed

- JavaScript repository-local dependencies are represented as canonical file-to-file `imports` edges.
- Static ESM import/re-export, literal dynamic `import()`, and best-effort literal `require()` are recognized.
- Relative targets resolve deterministically against indexed files with exact, extension, and directory-index candidates.
- Multiple import sites between the same file pair collapse to one edge with deterministic metadata.
- External package names and unresolved relative specifiers do not create graph nodes.
- Reverse dependency traversal is derived through `importedBy()`; no `imported_by` edge type is persisted.
- Circular imports preserve both real source directions.
- Existing filesystem, symbol, annotation, and byte-stability behavior remains covered.

## Scope boundary

Package-export maps, TypeScript path aliases, bundler aliases, framework-specific resolution, call graphs, Git status/history, structural CLI commands, watcher refresh, and richer viewer behavior remain outside this closure.
