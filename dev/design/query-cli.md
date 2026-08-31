# S06 Query CLI design

- Query behavior is a projection over the existing canonical index; it must not add new analysis data.
- `find` ranks exact, prefix, then substring matches deterministically across node ID, path, qualified name, and path-qualified symbol form.
- Exact repository paths prefer the current file/folder node over symbols that share the same `path` field.
- Ambiguous targets fail with candidate IDs instead of selecting arbitrarily.
- `refs` exposes direct canonical edge adjacency only. It must not imply call-graph coverage.
- `parents` and `children` traverse direct `contains` edges only.
- `changed --staged` filters the existing Git changed-set and does not invoke Git directly.
- Query commands read the current snapshot without refresh; staleness behavior belongs to the later refresh slice.
