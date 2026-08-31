# S06 closure

Status: CLOSED candidate pending PR merge.

Implemented:

- `find`, `show`, `refs`, `parents`, `children`, and `changed` CLI commands.
- Deterministic compact node projections and exact/unique target resolution.
- Ambiguity errors rather than arbitrary symbol selection.
- Canonical adjacency traversal without reverse-edge persistence or call inference.
- Staged-only changed-path filtering while preserving absent deletions in the normal changed view.
- Default query index resolution from the Git root plus explicit `--index` override.
- Snapshot-only query semantics; no implicit rebuild or refresh.

Verification:

- Focused query prototype: 6/6 tests passed before branch integration.
- CLI smoke prototype passed for `find`, `show`, and `changed` against a validated static index.
- Repository integration coverage added for query functions and CLI output.
