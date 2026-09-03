# V47-R00 — Canonical viewer reset

Date: 2026-09-03

- UI/UX authority is the supplied `repoaxis_saas_prototype_v47(2).html` as one canonical source file.
- Canonical SHA-256: `74378ad9bb5b1c5304b989174454d71a38cd1f9c7538a4bff410f35469a01507`.
- `skills/repoaxis/viewer/` contains only `repoaxis.html`; the split `viewer-*.js` / `viewer-*.css` reconstruction has been removed.
- R00 intentionally does not wire live repository data into the prototype yet. Its fixture arrays and existing v47 interaction state machine remain byte-identical.
- The loopback `/api/index`, `/api/meta`, `/api/history`, and `/api/health` backend contracts remain available for R01+ wiring.
- `repoaxis snapshot` freezes those API payloads into the already self-contained canonical HTML rather than inlining a second viewer asset graph.
- Split-viewer implementation tests were removed and replaced with single-file authority/server/snapshot boundary tests.

No index schema, Git semantics, query semantics, release workflow, or canonical repository analysis logic changed in R00.
