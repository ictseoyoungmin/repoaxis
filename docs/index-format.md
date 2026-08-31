# Repoaxis index format

`.repoaxis.json` is derived state. Git plus the current working tree remain authoritative.

```json
{
  "schema_version": 1,
  "tool": { "name": "repoaxis", "version": "0.9.0" },
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
        "git": {
          "tracked": true,
          "working": "modified",
          "staged": false,
          "conflicted": false,
          "last_commit": {
            "sha": "0123456789abcdef0123456789abcdef01234567",
            "author_name": "Example Author",
            "authored_at": "2026-08-30T10:00:00+09:00",
            "committed_at": "2026-08-30T10:02:00+09:00",
            "subject": "Update service"
          }
        },
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
    "git_changes": [
      {
        "path": "src/service.js",
        "tracked": true,
        "working": "modified",
        "staged": false,
        "conflicted": false
      },
      {
        "path": "src/removed.js",
        "tracked": true,
        "working": "deleted",
        "staged": false,
        "conflicted": false
      }
    ],
    "refresh": { "reason": "manual" }
  },
  "annotations": {
    "function:src/service.js::greet": {
      "agent_note": "Registered by the CLI bootstrap path."
    }
  }
}
```

## Ownership boundary

`generated` is rebuildable derived state. `annotations` is durable user/agent-authored memory. A rebuild may replace generated nodes, edges, Git projections, and refresh metadata, but it preserves valid annotations separately.

An annotation key is a canonical node ID and the current V1 writable field is `agent_note`. Repoaxis does not require every annotation key to have a current node: when a node disappears, its note remains as an orphan until the user or agent explicitly clears it. This prevents source edits, temporary deletions, or index rebuilds from silently destroying authored memory.

New notes can only be attached through the CLI to a node that resolves in the current index. Orphaned notes can be read and cleared by their exact stored node ID.

## Filesystem projection

The filesystem graph contains a `folder:.` root, repository-relative folder/file nodes, and canonical `contains` edges. Repoaxis asks Git for tracked files plus visible untracked files and respects standard Git ignore rules. Tracked paths that no longer exist in the working tree are not emitted as filesystem nodes.

File metadata contains deterministic filesystem facts: byte size, extension, and whether the path is a symbolic link.

## Git state projection

Current file nodes may include a top-level `git` object. Repoaxis reads Git porcelain v2 and stores state as data rather than presentation:

```json
{
  "tracked": true,
  "working": "clean",
  "staged": "modified",
  "conflicted": false
}
```

`working` describes the current working-tree side and is one of `clean`, `modified`, `added`, `deleted`, `renamed`, `copied`, `type-changed`, `untracked`, or `conflicted`. `staged` is `false` when the index has no change for the path, otherwise it records the staged change kind. This separation preserves cases where a file is staged and then modified again.

Rename/copy records can additionally include `rename_from` or `copy_from` plus Git's `similarity` percentage. Unmerged files include `conflicted: true` and may include a two-character `conflict_code` such as `UU`.

`generated.git_changes` contains the non-clean path records for the repository. It intentionally includes changed paths with no current filesystem node, especially deleted tracked files. The generated Repoaxis output path is excluded from this projection so an untracked `.repoaxis.json` cannot make a rebuild change itself.

Colors and badges are UI projections only. Consumers should use the serialized Git fields for decisions.

## File commit context

For each current file node, `git.last_commit` records the exact last Git commit that mentions the file's current repository path:

```json
{
  "sha": "0123456789abcdef0123456789abcdef01234567",
  "author_name": "Example Author",
  "authored_at": "2026-08-30T10:00:00+09:00",
  "committed_at": "2026-08-30T10:02:00+09:00",
  "subject": "Update service"
}
```

The lookup is current-path based and does not duplicate repository history. A tracked file that has never been committed, such as a newly staged addition, has `last_commit: null`. Untracked files also have `last_commit: null`.

An uncommitted rename keeps its exact working-tree rename data but the new path receives `last_commit: null` until Git contains a commit for that path. Repoaxis does not silently attribute the old path's history to the new path. Symbol nodes do not carry inferred commit history; consumers can use their containing file's exact context.

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

## JavaScript import projection

For `.js`, `.mjs`, and `.cjs` files, Repoaxis records repository-local dependencies as canonical file-to-file `imports` edges:

```json
{
  "type": "imports",
  "from": "file:src/main.js",
  "to": "file:src/service.js",
  "meta": {
    "specifiers": ["./service.js"],
    "kinds": ["import"]
  }
}
```

Supported source forms are static ESM imports, ESM re-exports with a source, string-literal dynamic `import()`, and best-effort string-literal CommonJS `require()`. Relative resolution checks indexed files only and is bounded to the repository. Exact paths are preferred, followed by common JavaScript/JSON extensions and directory `index` candidates.

Bare package specifiers and unresolved relative specifiers do not create synthetic nodes. JavaScript file metadata records deterministic counts plus unique `external_specifiers` and `unresolved_specifiers` for inspection.

Several import sites between the same two files collapse to one canonical edge with sorted metadata. `imported_by` is not stored; reverse dependency traversal is derived from incoming `imports` edges.
