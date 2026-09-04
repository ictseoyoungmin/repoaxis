# V47-R05 — Canonical root + overview hydration hardening

## Trigger

Two viewer defects were observed during live Repoaxis use:

1. Structure focus showed `root/ → ./ → ...`, even though `./` is the repository's canonical filesystem root rather than a real child folder.
2. During initial Structure overview hydration, a very large rounded violet acquisition/hover rectangle appeared transiently around a small node.

## P0 — duplicate canonical root

The index intentionally contains the repository root as a folder node with `path: "."`. The live v47 adapter also creates its own presentation root `root/`. Previously `liveTreeV47()` rendered both.

R05 keeps the index node as authority but collapses it at the presentation boundary:

- detect raw folder `.` / `./` as the canonical index root;
- do not render that raw root as a separate Structure node;
- remap its direct children to the synthetic viewer root `root`;
- preserve all other containment IDs and edges.

The final Chromium focus screenshot therefore has one root only. Its direct children include `.agents/`, `.claude-plugin/`, `.codex-plugin/`, `.github/`, `bin/`, `dev/`, `docs/`, `skills/` and root files, with no `./` intermediary.

## P1 — oversized overview helper geometry

The canonical v47 interaction stack installs three helper geometries around overview nodes:

- `.overview-hit-zone`
- `.overview-hover-ring`
- `.overview-assist-zone`

Older installers measured the whole overview node group with `getBBox()`. Because helper rectangles live inside the same group, a later installer could measure an earlier helper instead of only the real node glyph. Async live hydration also re-renders the overview while older `requestAnimationFrame()` callbacks can still be pending.

R05 hardens only that helper seam:

- `overviewVisibleBBoxR05()` computes bounds from real direct node children and excludes all helper classes;
- hit-zone and assist-zone installation use the same helper-free bbox authority;
- each overview render increments `overviewGenerationR05` and stale deferred callbacks are ignored;
- live tree replacement clears pending pointer/acquisition state before `tree.splice(...)`;
- R05 collection iteration uses `document.querySelectorAll(...).forEach` explicitly.

No canonical layout, surface DOM, style system, import authority, Git authority, dependency traversal or Graph semantics were redesigned.

## Browser stress validation

Final workflow run: `33849417568`

Head: `edf0a5414817dee18deff0e1cf3ed476d17ebe86`

Artifact: `9927765434` (`v47-r05-hydration-probe`)

Artifact digest: `sha256:41c26d1a102067c748953a7258507bec868cb9468a6c366ffb2060c3601be4a8`

The probe deliberately delayed `/api/index`, `/api/meta`, and `/api/history` by different amounts to force prototype render → live hydration overlap. Four independent Chromium pages alternated 1600×1000 and 1280×820, sampled helper rectangles throughout hydration, resized after hydration, and hovered a live overview node.

Final results:

- 4 / 4 iterations reached `repoaxisLive=ready`;
- live adapter errors: 0;
- browser/page errors: 0;
- rendered canonical `.` / `./` folder nodes: 0;
- direct synthetic-root children in the tested repository: 15;
- worst measured helper width/height through hydration, resize and hover: `58.0001220703125 px`;
- failure threshold: 120 px;
- no oversized acquisition rectangle reproduced;
- final overview and root-focus screenshots were manually inspected.

## Closure

P0 is closed by collapsing the index's canonical `.` root into the existing v47 presentation root.

P1 is closed by making helper geometry derive only from the real node glyph, cancelling stale hydration-era deferred installation, and clearing acquisition state at live tree replacement.
