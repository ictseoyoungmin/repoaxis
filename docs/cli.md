# Repoaxis CLI

## Index selection

Structural query commands read the current index snapshot. By default Repoaxis resolves the Git root from the current directory and reads `<git-root>/.repoaxis.json`. Use `--index FILE` to query another index. Query commands do not refresh the index automatically.

## Commands

### `repoaxis doctor`
Checks that Repoaxis, Node.js, Git, and the current Git repository can be resolved.

### `repoaxis build`
Creates or rebuilds `.repoaxis.json` at the Git root. The command indexes the current folder/file hierarchy, extracts JavaScript class/function symbols from `.js`, `.mjs`, and `.cjs` files, preserves valid annotations already stored in the target file, and respects standard Git ignore rules. Parse failures are recorded on the file node without aborting the build.

Options:

- `--root PATH` — resolve the Git repository from another path.
- `--output FILE` — write to a different index path.
- `--reason TEXT` — record the refresh trigger.

### `repoaxis validate [FILE]`
Validates the Repoaxis v1 outer contract and graph invariants supported by the installed version.

### `repoaxis summary [FILE]`
Prints schema, Git HEAD context, graph counts, and annotation count.

### `repoaxis find QUERY [--index FILE] [--limit N]`
Searches node IDs, repository paths, qualified names, and `path:qualified_name` forms. Matching is case-insensitive and deterministic: exact matches rank before prefix and substring matches. The default result limit is 20.

### `repoaxis show TARGET [--index FILE]`
Resolves a node and prints its full indexed record plus its persistent annotation, if present.

### `repoaxis refs TARGET [--index FILE]`
Lists canonical graph edges directly touching the resolved node. Each record includes edge type, incoming/outgoing direction, and a compact neighboring node. This is structural adjacency; it does not infer function calls.

### `repoaxis parents TARGET [--index FILE]`
Lists direct incoming `contains` parents only.

### `repoaxis children TARGET [--index FILE]`
Lists direct outgoing `contains` children only.

### `repoaxis changed [--staged] [--index FILE]`
Lists `generated.git_changes`. `--staged` keeps only paths with a staged change. Deleted paths remain visible even when no current file node exists.

### `repoaxis node-id TYPE PATH [QUALIFIED_NAME]`
Produces the canonical deterministic node ID for a folder, file, class, or function.

## Target resolution

Commands that accept `TARGET` try an exact node ID first. They then accept an exact repository path, an exact qualified name or `path:qualified_name` symbol form, and finally a unique structural search match. When multiple nodes remain plausible, Repoaxis returns an ambiguity error rather than choosing one.

Examples:

```bash
repoaxis find parseConfig
repoaxis show file:src/config.js
repoaxis show src/config.js:parseConfig
repoaxis refs src/config.js
repoaxis parents src/config.js:parseConfig
repoaxis children src/config.js
repoaxis changed --staged
```
