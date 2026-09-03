# U17 Cross-view selection continuity

Prototype contract restored from `repoaxis_saas_prototype_v47.html`:

- preserve the original selected source when a symbol is projected to its containing file for Dependencies or Graph;
- keep the Inspector open across the jump;
- expose the projection reason in the global selection context;
- make the destination visually reacquirable with a 1400ms arrival highlight;
- keep Structure jumps exact while Dependencies/Graph operate on canonical file-level nodes;
- clear stale projection context on ordinary direct node selection.

Implementation boundary:

- `viewer-5.js` is a compatibility layer over the existing U04–U16 runtime rather than a rewrite of established renderers;
- existing dependency root history is reused through `dependencyPushRoot`;
- Graph cross-view jumps clear transient impact/neighborhood projections before entering the canonical file graph;
- Changes navigation is accepted only when the file is present in the active Git projection;
- no index/schema/Git semantics/routing/impact traversal changes.

Validation is enforced by `viewer-cross-view-continuity.test.mjs` and the repository CI suite.
