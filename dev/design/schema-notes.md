# Schema notes

Schema version 1 establishes the outer contract before repository structure extraction is added.

- `schema_version`: format compatibility boundary.
- `authority`: fixed to `git+working-tree`.
- `repository`: portable repository identity and HEAD context; no absolute path is serialized.
- `generated.nodes` / `generated.edges`: canonical graph storage.
- `generated.refresh`: describes why the index was rebuilt without embedding wall-clock time.
- `annotations`: persistent, non-generated notes keyed by deterministic node ID.

The bootstrap index can contain an empty graph and remains valid. This lets structural extraction evolve without changing the ownership boundary.
