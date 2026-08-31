# S05 closure

Scope: exact current-path file commit context.

Closed behavior:
- tracked current files receive exact `git.last_commit` metadata;
- dirty tracked files keep the last committed context independently from working/staged state;
- newly staged additions and untracked files use `last_commit: null`;
- uncommitted renames do not receive fabricated inherited commit context;
- schema version remains 1 with a backward-compatible optional field;
- no full Git history, symbol-history inference, co-change, ownership, or historical projection is stored.

Verification evidence:
- focused real-Git prototype passed for distinct per-file commit histories, dirty tracked state, staged additions, and untracked files;
- repository integration tests cover exact SHAs/timestamps/subjects, current-path rename semantics, validation, and byte-stable rebuilds;
- PR diff must remain restricted to Git context, schema, tests, documentation, and 0.6.0 release metadata.

Performance note: current-path exactness uses one bounded `git log -1` query per tracked file. This is intentionally left visible for S11 dogfood/performance measurement rather than replaced with a semantically broader history scan before evidence exists.
