# Decision 0001 — Repository state is authoritative

`.repoaxis.json` is a cache, not a source of truth. Any generated content must be recoverable from Git plus the current working tree. Persistent annotations are stored separately inside the same document so a generated rebuild cannot overwrite their ownership boundary.
