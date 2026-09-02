# U11 Structure Git aggregation — visual evidence

## Slice
Structure Whole-topology folder/root Git aggregation.

## Problem
Folder/root macro nodes previously had no Git state because exact status lookup only resolved files or symbols to their containing file. Deleted tracked paths can also disappear from the current containment tree, so ancestor scope aggregation must still account for them without inventing a synthetic file operation for the folder itself.

## Construction
- derive folder/root scope state in the viewer from the active Git overlay
- working tree: count changed files, staged lanes, working lanes, and conflicts independently
- a mixed file contributes to both staged and working counts
- deleted ghost paths contribute through repository-path prefix scope matching
- last commit: report changed-file count only, with no staged/working fiction
- Whole topology: render scope marks as a secondary line (`S n`, `W n`, `! n`, or `HEAD n`)
- Inspector: render the exact scope summary under `Working tree in scope` / `Last commit in scope`
- preserve exact file/symbol Git operation semantics

## Actual Repoaxis fixture
The final capture injected a temporary dirty state only after the regression suite completed:

- `skills/repoaxis/viewer/viewer-1.js`: staged modification followed by working modification (`MM`)
- `skills/repoaxis/viewer/viewer-base.css`: working-only modification
- `dev/tests/integration/viewer-structure-interaction.test.mjs`: staged deletion, absent from the current tree

Expected scope results:

- `skills/`: 2 changed files, `S 1`, `W 2`
- `dev/`: `S 1` from the staged deleted path

The dirty fixture was not committed.

## Final validation
- capture head: `b60f94f3d943a2b07b0dd876d4e3ff1d51352c12`
- Actions run: `33682704380`
- artifact: `9866887945`
- digest: `sha256:bc9a0a97bc43ddd9778f33fb7161661b9938cd3842be9d18787457d461d49689`
- regression suite before fixture injection: 92/92 passing
- browser assertion: `skills/` scope marks = `S 1`, `W 2`
- browser assertion: `dev/` scope marks = `S 1`
- selecting `skills/` keeps Whole topology and opens a 404 px Inspector
- Inspector: `Working tree in scope` → `2 changed files · 1 staged · 2 working`
- Structure legend: `Git marks = overlay state`

## Visual review
Both 1600×1000 PNGs were downloaded and inspected directly.

- Whole topology remains structurally dominant; Git scope marks stay secondary and do not turn folders into synthetic file-status badges.
- `skills/` and `dev/` scope marks are visible in context.
- Inspector gives the precise readable scope summary without losing the U10 inspect-first flow.
- No visual correction remained necessary after the legend wording update.
