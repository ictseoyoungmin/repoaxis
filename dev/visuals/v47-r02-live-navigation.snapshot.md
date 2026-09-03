# V47-R02 — Live navigation / bounded Structure focus

Date: 2026-09-04

## Target

Close the live cross-view navigation bottleneck after R01: a selection that moves through Dependencies → Graph → Structure must remain visually reacquirable, not merely preserved in state.

## Reopen signal

The first real Chromium probe preserved the selected live file and kept the Inspector open, but Graph → Structure rendered the full 473-node containment tree in the focused surface. The SVG fit the entire world, collapsing the tree into an effectively unreadable line. Functional continuity was therefore not sufficient to close the slice.

Initial browser evidence:

- workflow run: `33793026089`
- artifact: `9908089459`
- artifact digest: `sha256:9de8b2a66d6eb2b31f55308089bdc6a44689b81e64ecf655a00845cdc7f69429`

## Correction

The canonical v47 renderer, DOM, styles, and cross-view actions remain unchanged. R02 narrows only the live Structure-focus projection input.

Focused Structure now contains a bounded selected context:

- the selected node's containment ancestry back to `root`
- nearby same-parent siblings for file/symbol selections
- direct children of the selected file/symbol
- bounded two-level descendants for folder selections
- a bounded top-level set when the repository root itself is selected

The focused card count reflects the visible projection rather than the whole live index.

## Final real-browser observation

Chromium 1600×1000 revalidation:

- workflow run: `33793424946`
- artifact: `9908239969`
- artifact digest: `sha256:85adaaf22c6818546932b09baaf70fb0e1278ad5c65b6612af6eddf5df517397`
- selected live target: `file:dev/tests/integration/annotations.test.mjs`
- Dependencies projection: 22 visible nodes
- Graph jump preserved the selected live file and open Inspector
- Structure jump preserved the same selection and open Inspector
- bounded Structure focus: 23 visible nodes
- the selected `annotations.test.mjs` node is visibly outlined and connected to its ancestry, local siblings, and direct symbol children
- Ctrl/Cmd+K search still opens after the cross-view sequence
- browser/page errors: 0

The final screenshot was inspected directly. The previously collapsed 473-node tree is replaced by a readable ancestry chain (`root → ./ → dev/ → tests/ → integration/`) with the selected file and its local context visibly reacquirable.

## Boundary

R02 changes no index/schema/Git/import authority and introduces no second graph or containment model. It changes only the live viewer's focused Structure projection scope; canonical data and canonical v47 interaction/rendering remain authoritative.
