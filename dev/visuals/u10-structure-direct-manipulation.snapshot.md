# U10 — Structure whole-topology direct manipulation visual evidence

## Bottleneck

The Structure whole-topology projection exposed only anonymous macro dots. The actual hit circle was larger than the visible dot, but the user could not identify a target before activating it, and the first click immediately drilled into a focused subtree instead of allowing inspection in context.

Baseline actual Repoaxis capture:
- Actions run: `33679525433`
- artifact: `9865701476`
- whole projection: 27 macro nodes
- visible macro labels: 0
- selected: repository root
- first clicked target: `.agents/`
- first click result: `.agents · 3/3 nodes`
- Inspector after first click: closed

## Construction

The whole-topology interaction was changed to an inspect-first flow:
- every macro node now exposes a visible label and descendant count
- macro nodes are keyboard-focusable `role="button"` targets
- single click / Enter / Space selects the macro node and opens Inspector while preserving whole topology
- `Explore selected` is the explicit focused-subtree transition
- double-click remains a direct explore shortcut
- selected/hovered macro nodes retain a lightweight violet acquisition cue

The focused Structure projection itself was not redesigned.

## Observation / correction loop

### Correction 1 — containment edges intercepted pointer input

The first normal-click browser validation was rejected even though all regression tests passed. A Structure containment `<path class="edge">` crossed the selected macro target and intercepted pointer input.

Correction:
- Structure containment edges are now non-interactive (`pointer-events:none`)
- this is scoped to `.structure-svg .edge`; Graph/Dependencies behavior is untouched

### Correction 2 — visible label and clickable target did not match

The next normal-click validation was also rejected. The edge interception was gone, but the macro label was visually part of the target while the actual hit geometry remained concentrated around the dot. Clicking the visual center could therefore land on the SVG background.

Correction:
- each whole-topology macro node now owns a transparent `184 × 34` rounded `macro-target` capsule behind dot + label
- the visual unit and the pointer acquisition unit now match
- no forced Playwright click was used

## Final actual Repoaxis validation

Capture head: `1d5ee780596e89d0ce4490cc6189f346ddc41fd0`

Actions:
- run: `33680731236`
- artifact: `9866146072`
- artifact digest: `sha256:79e772b89110be0bb5d92999a6ebfe87691e08b0867b9a483dfc12814c68f5f6`

Whole topology before selection:
- 27 macro nodes
- 27 visible labels
- 27 keyboard targets
- mode: `Repository topology · 27 macro nodes · select to inspect`
- explicit action: `Explore repository`

Normal click on `skills/`:
- whole-topology mode preserved
- selected: `folder:skills`
- Inspector open: yes
- rendered Inspector width: 404 px
- Inspector entity: `skills/`
- explicit action changes to `Explore selected`

Explicit explore after inspection:
- mode: `skills · 7/399 nodes`
- `Whole topology` recovery becomes available
- Inspector remains open

Regression suite at final capture: 88/88 passing.

Both final 1600 × 1000 PNGs were downloaded and visually inspected. The final overview is materially more directly manipulable than the anonymous-dot baseline, and the selected-state capture proves the intended inspect-in-context → explicit explore sequence.

## Boundary

U10 does not add folder/root Git aggregation, alter the index/schema, change source APIs, change snapshot format, or redesign the focused Structure projection. Folder/root Git aggregation remains a separate future bottleneck candidate.
