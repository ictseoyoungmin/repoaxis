# Repoaxis index format

`.repoaxis.json` is derived state. Git plus the current working tree remain authoritative.

```json
{
  "schema_version": 1,
  "tool": { "name": "repoaxis", "version": "0.2.0" },
  "authority": "git+working-tree",
  "repository": {
    "root": ".",
    "head_sha": "...",
    "head_ref": "main"
  },
  "generated": {
    "nodes": {
      "folder:.": { "id": "folder:.", "type": "folder", "path": "." },
      "file:src/index.js": {
        "id": "file:src/index.js",
        "type": "file",
        "path": "src/index.js",
        "meta": { "size_bytes": 120, "extension": ".js", "symlink": false }
      }
    },
    "edges": [
      { "type": "contains", "from": "folder:src", "to": "file:src/index.js" }
    ],
    "refresh": { "reason": "manual" }
  },
  "annotations": {}
}
```

## Filesystem projection

The filesystem graph contains a `folder:.` root, repository-relative folder/file nodes, and canonical `contains` edges. Repoaxis asks Git for tracked files plus visible untracked files and respects standard Git ignore rules. Tracked paths that no longer exist in the working tree are not emitted as filesystem nodes.

File metadata currently contains deterministic filesystem facts only: byte size, extension, and whether the path is a symbolic link.

The graph is canonical. Reverse relationships are projections rather than duplicated edges. Paths use `/` separators and never serialize an absolute repository path.
