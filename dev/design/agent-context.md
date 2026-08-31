# Agent context boundary

`context` is a projection over the existing canonical index, not a new analysis layer. It composes node identity, source location, containment, containing-file Git/change context, annotations, and import relationships without embedding source text.

`why` explains only paths that can be proven from canonical `imports` and `contains` edges. Files with no incoming indexed imports are structural path origins, not inferred runtime entry points.

The projection stays snapshot-based. Staleness detection/refresh, annotation mutation, call graphs, runtime entry-point inference, and unreferenced-candidate classification remain separate concerns.
