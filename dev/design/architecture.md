# Architecture

Repoaxis treats Git plus the current working tree as authority and `.repoaxis.json` as a rebuildable derived index.

```text
Git + working tree
        |
     indexer
        |
 .repoaxis.json
    /       \
  CLI      viewer
```

The canonical representation is one graph (`nodes` and `edges`). Tree and reverse-dependency representations are projections rather than separately stored structures.

Generated state and persistent annotations have separate ownership. Rebuilding generated state must not erase annotations.
