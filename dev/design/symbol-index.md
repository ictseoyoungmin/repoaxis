# JavaScript symbol indexing

The first symbol adapter targets JavaScript files (`.js`, `.mjs`, `.cjs`). The adapter boundary is explicit under `skills/repoaxis/lib/languages/` so additional languages can be introduced without changing the canonical graph contract.

## Parser

Acorn 8.15.0 is vendored and pinned. The index should be deterministic for a given Repoaxis release, so parser behavior must not float with an unconstrained package dependency.

`.mjs` parses as module, `.cjs` as script, and `.js` attempts module then script. If both modes fail, the error that progressed furthest through the source is retained as the file-level diagnostic.

## Symbol policy

Emit structural identities that are useful for repository navigation:

- class declarations and stable class-expression bindings
- function declarations
- variable-bound arrow/function expressions
- class methods, including constructor/static/get/set/private/computed names
- class-field arrow/function values
- nested named declarations
- anonymous default class/function exports as `default`

Do not emit anonymous callback functions merely because an AST node exists. Their lack of a stable source-level binding makes them poor navigation identities and creates graph noise.

## Containment

File → top-level symbol → nested symbol uses the existing canonical `contains` edge. `parent_id` repeats the direct parent identity on symbol nodes for compact consumers; it is not a second relationship type.

## Failure boundary

A parse failure does not fail the repository build. The file node remains canonical and carries `meta.symbols.status = "error"`; no speculative partial symbols are emitted.

Symlinks are deliberately not parsed to avoid following source reads outside the repository path.
