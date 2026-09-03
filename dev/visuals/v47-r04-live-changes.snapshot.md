# V47-R04 — live Changes / dirty worktree visual evidence

## Scope

Validate the canonical single-file v47 Changes surface against real Git index/worktree state, then verify that bulk current-change analysis remains visually truthful when changed files do not participate in repository-local import edges.

The canonical v47 DOM, styles, Changes interaction model, impact semantics, and Graph routing are unchanged. R04 only adjusts the live Graph input/camera seam.

## Dirty Git fixture

The browser probe created four simultaneous real Git states before starting the Repoaxis viewer:

```text
MM CHANGELOG.md
 M README.md
 D docs/releasing.md
M  docs/viewer.md
```

Expected interpretation:

- `CHANGELOG.md` — staged + working
- `README.md` — working tree only
- `docs/viewer.md` — staged only
- `docs/releasing.md` — deleted in working tree, retained as a deleted-path projection with no current node

## Initial browser result

The canonical Changes surface correctly rendered all four states and its summary reported:

- 4 Changes
- 2 Working
- 2 Staged / mixed
- 1 Deleted

`All current` selected the three current file nodes and intentionally excluded the deleted ghost path. Bulk `Analyze impact` and `View in Graph` became enabled.

The first clean probe exposed a live wiring defect: the three selected files were Markdown files with no import edges. R01's bounded live Graph admitted import-connected files only, so the UI stated `3 changed files` / `3 roots` while none of those roots existed in the rendered Graph.

## Correction

The live Graph input is now the union of:

1. files participating in canonical repository-local import edges, and
2. current changed file nodes from the live Git projection.

Deleted ghost paths remain excluded because no current node exists.

Change-set arrival also reconciles only the Graph camera to the bounding box of the selected roots. It does not modify graph positions, routes, import authority, impact traversal, or the canonical Changes state machine.

A clean repository therefore keeps the same bounded import Graph; only actual current changed files can add isolated Graph roots.

## Final Chromium QA

Viewport: 1600 × 1000.

Final run: `33798606850`

Artifact: `9910174918` (`v47-r04-changes-probe`)

Digest: `sha256:e649fb3632cec3b715402258d9a75f91fb84f721a70e935cc15f065fb348c9a9`

Final observations:

- exact porcelain state remained `MM / M / D / staged-M` as listed above
- Changes count remained 4
- mixed / working-only / staged-only / deleted labels remained correct
- `All current` represented exactly three current roots
- live Graph count increased from the clean 53 import participants to 56 for this dirty fixture
- `CHANGELOG.md`, `README.md`, and `docs/viewer.md` were all rendered as real changed root cards
- Graph change-set view visibly framed all three roots while preserving the full graph
- Impact view visibly framed the same three roots and correctly reported `3 roots · 0 affected`
- the docs-only roots did not invent import edges or affected files
- deleted `docs/releasing.md` remained a non-analyzable deleted path
- browser/page errors: 0

## Reopen loop

1. Dirty Changes rendering passed.
2. Bulk change-set action exposed invisible roots because the bounded Graph contained import participants only.
3. Added current changed file nodes to live Graph input; Graph count became 56, but the isolated roots were outside the initial viewport.
4. Reopened again and added change-set-only camera framing.
5. Final Chromium screenshots showed all three changed roots and truthful `0 affected` impact state.

## Boundary

R04 does not change index/schema authority, Git status derivation, import edge semantics, impact traversal, graph routing, canonical v47 DOM/styles, or deleted-path behavior.
