# Import graph

Repoaxis stores import relationships once, in source direction:

```text
file:src/a.js --imports--> file:src/b.js
```

`imported_by` is never persisted. Reverse traversal is derived from the canonical `imports` edges.

The JavaScript adapter recognizes static ESM imports and re-exports, string-literal dynamic `import()`, and best-effort string-literal CommonJS `require()`. Only repository-local specifiers that resolve to an indexed file become edges. Bare package specifiers remain external metadata, and unresolved relative specifiers remain diagnostics rather than synthetic graph nodes.

Relative resolution is deterministic and repository-bounded. It checks an exact indexed file first, then `.js`, `.mjs`, `.cjs`, `.json`, followed by `index` files with those extensions. This is a structural repository heuristic, not a claim to reproduce every bundler or runtime resolver.

When several import sites connect the same two files, Repoaxis emits one canonical edge and aggregates its specifiers and import kinds in edge metadata. Real circular imports remain two directed edges because both directions are present in source.
