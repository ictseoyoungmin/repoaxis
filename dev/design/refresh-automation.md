# Refresh automation boundary

- Git + current working tree remain authority; refresh metadata is cache state only.
- Default operational commands refresh on demand. No always-on daemon is introduced.
- Freshness uses tool version, HEAD/ref, Git non-clean state, dirty/untracked content hashes, and staged index-state hashes.
- The generated index output path is excluded from freshness computation.
- Explicit `--index FILE` means snapshot mode and never auto-refreshes.
- Invalid indexes fail validation instead of being silently overwritten.
- Refresh rebuilds preserve annotations through the existing generated/annotation ownership boundary.
