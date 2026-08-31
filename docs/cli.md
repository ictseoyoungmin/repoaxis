# Repoaxis CLI

## Commands

### `repoaxis doctor`
Checks that Repoaxis, Node.js, Git, and the current Git repository can be resolved.

### `repoaxis build`
Creates or rebuilds `.repoaxis.json` at the Git root. The command preserves valid annotations already stored in the target file.

Options:

- `--root PATH` — resolve the Git repository from another path.
- `--output FILE` — write to a different index path.
- `--reason TEXT` — record the refresh trigger.

### `repoaxis validate [FILE]`
Validates the Repoaxis v1 outer contract and graph invariants supported by the installed version.

### `repoaxis summary [FILE]`
Prints schema, Git HEAD context, graph counts, and annotation count.

### `repoaxis node-id TYPE PATH [QUALIFIED_NAME]`
Produces the canonical deterministic node ID for a folder, file, class, or function.
