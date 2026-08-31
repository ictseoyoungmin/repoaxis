# Decision 0003 — Refresh is multi-triggered

Git hooks are insufficient for editor saves. The intended refresh boundary combines Git event hooks, staleness checks on CLI use, and a filesystem watcher only while the viewer is active. A permanent daemon is not required by the core format.
