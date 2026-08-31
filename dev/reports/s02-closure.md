# S02 Closure Report — JavaScript Symbol Index

Date: 2026-08-31

## Capability closed

- JavaScript is the first explicit language adapter (`.js`, `.mjs`, `.cjs`).
- `class` and `function` nodes are emitted into the same canonical graph as filesystem nodes.
- Qualified names distinguish nested functions, class methods, static methods, getters, and setters.
- Symbol nodes include direct `parent_id`, one-based line ranges, zero-based columns, and compact signatures.
- Variable-bound arrow/function expressions and class-field functions receive stable binding-based identities.
- Anonymous default function/class exports receive the stable `default` identity.
- Malformed JavaScript degrades to deterministic file-level diagnostics instead of aborting the build.
- Symlink source is not followed for symbol extraction.
- Acorn 8.15.0 is vendored and pinned with its MIT license text.
- Existing filesystem and byte-stability behavior remains covered after symbol nodes are introduced.

## Verification target

- complete repository check passes
- release package structure passes
- isolated packed install can build/validate/summarize an index containing JavaScript symbols
- output remains byte-stable for the same Git working-tree state

## Scope boundary

Import resolution, reverse dependencies, call graph, TypeScript/JSX parsing, Git working-tree status metadata, historical metadata, and structural query commands remain outside this closure.
