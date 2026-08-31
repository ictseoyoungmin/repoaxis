# Decision 0002 — Store one canonical graph

Repoaxis stores canonical directional relations once. Views such as containment trees, reverse dependency trees, and deduplicated graphs are projections. Reverse edges such as `imported_by` are derived from `imports` rather than duplicated.
