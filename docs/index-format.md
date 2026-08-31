# Repoaxis index format

`.repoaxis.json` is derived state. Git plus the current working tree remain authoritative.

```json
{
  "schema_version": 1,
  "tool": { "name": "repoaxis", "version": "0.1.0" },
  "authority": "git+working-tree",
  "repository": {
    "root": ".",
    "head_sha": "...",
    "head_ref": "main"
  },
  "generated": {
    "nodes": {},
    "edges": [],
    "refresh": { "reason": "manual" }
  },
  "annotations": {}
}
```

The graph is canonical. Reverse relationships are projections rather than duplicated edges. Paths are repository-relative and use `/` separators.
