# Structure whole-map default visual QA

Scope: separate Structure selection from local containment focus.

- Branch: `feat/structure-whole-map-default`
- Live source: Repoaxis repository itself; no synthetic browser fixture.
- Browser QA run: `33863678681`
- Artifact: `structure-whole-map-browser-qa` (`9933106733`)
- Viewport: 1600×1000

Verified interaction contract:

1. Clicking a Structure overview node keeps the whole repository topology mounted and visible as the same projection, selects the node, opens Inspector, and frames the selected node by camera zoom/pan.
2. The selected node is promoted to a readable icon/text card without replacing the surrounding topology.
3. `Focus selection` is the explicit opt-in for bounded local containment; the QA selection produced 3 visible focus cards while the original 46-node overview projection remained intact behind the mode switch.
4. `Whole topology` returns to the original overview projection without changing the selected entity.
5. Search and Graph → Structure handoff return to whole-map mode by default.
6. Nested files that are not direct overview projection nodes use their nearest visible containment ancestor only as a placement anchor; the selected file identity remains the real file. The `repoaxis.html` handoff screenshot shows the file card on the whole map while Inspector remains bound to `skills/repoaxis/viewer/repoaxis.html`.
7. Browser/page errors: none.

QA metrics from the final run:

- Overview nodes before selection: 46
- Overview nodes after selection: 46
- Whole-map selection cards: 1
- Whole-map camera scale after direct click: 1.45
- Local focus cards: 3
- Overview nodes retained while local focus is active: 46
- Overview nodes after returning to whole topology: 46

Reviewed screenshots:

- `01-whole-map-selected.png`
- `02-local-focus.png`
- `03-graph-to-whole-map.png`

Temporary patch, scan, Playwright, and workflow files were removed before PR creation.
