# Repoaxis index format

`.repoaxis.json` is derived state. Git plus the current working tree remain authoritative.

```json
{
  "schema_version": 1,
  "tool": { "name": "repoaxis", "version": "0.3.0" },
  "authority": "git+working-tree",
  "repository": {
    "root": ".",
    "head_sha": "...",
    "head_ref": "main"
  },
  "generated": {
    "nodes": {
      "folder:.": { "id": "folder:.", "type": "folder", "path": "." },
      "file:src/service.js": {
        "id": "file:src/service.js",
        "type": "file",
        "path": "src/service.js",
        "meta": {
          "size_bytes": 120,
          "extension": ".js",
          "symlink": false,
          "symbols": {
            "language": "javascript",
            "parser": "acorn",
            "parser_version": "8.15.0",
            "status": "ok",
            "count": 1
          }
        }
      },
      "function:src/service.js::greet": {
        "id": "function:src/service.js::greet",
        "type": "function",
        "path": "src/service.js",
        "qualified_name": "greet",
        "parent_id": "file:src/service.js",
        "source": {
          "start_line": 3,
          "start_column": 7,
          "end_line": 5,
          "end_column": 1,
          "signature": "function greet(name)"
        },
        "meta": {
          "language": "javascript",
          "declaration_kind": "function",
          "symbol_name": "greet",
          "async": false,
          "generator": false,
          "export_default": false
        }
      }
    },
    "edges": [
      { "type": "contains", "from": "folder:src", "to": "file:src/service.js" },
      { "type": "contains", "from": "file:src/service.js", "to": "function:src/service.js::greet" }
    ],
    "refresh": { "reason": "manual" }
  },
  "annotations": {}
}
```

## Filesystem projection

The filesystem graph contains a `folder:.` root, repository-relative folder/file nodes, and canonical `contains` edges. Repoaxis asks Git for tracked files plus visible untracked files and respects standard Git ignore rules. Tracked paths that no longer exist in the working tree are not emitted as filesystem nodes.

File metadata contains deterministic filesystem facts: byte size, extension, and whether the path is a symbolic link.

## JavaScript symbol projection

JavaScript files with `.js`, `.mjs`, or `.cjs` extensions are parsed for structural symbols. Repoaxis emits `class` and `function` nodes for named declarations and stable bindings, including class methods, class-field functions, variable-bound arrow/function expressions, nested named functions, and anonymous default class/function exports.

Symbol nodes contain:

- `qualified_name` — stable repository-local symbol identity within the file.
- `parent_id` — the canonical file/class/function node that directly contains the symbol.
- `source` — zero-based columns, one-based lines, and a compact declaration signature.
- `meta` — language and declaration-kind facts such as async/generator/static/get/set state.

Methods normally use `Class.method`. Static methods add `#static`; getters/setters add `#get` or `#set` when required to avoid identity collisions.

If JavaScript parsing fails, Repoaxis keeps the file node, emits no symbols from that file, and records a deterministic parser diagnostic under `file.meta.symbols`. A malformed source file therefore does not abort the repository build.

Symbolic links are not parsed for symbols, so building an index never follows a symlink to read source outside the repository path.

The graph is canonical. Reverse relationships are projections rather than duplicated edges. Paths use `/` separators and never serialize an absolute repository path.
