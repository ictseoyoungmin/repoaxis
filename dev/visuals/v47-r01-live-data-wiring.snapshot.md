# V47-R01 — Live data wiring

Date: 2026-09-04

- The supplied v47 UI/UX remains the canonical shell. The adapter is appended after a protected canonical prefix whose SHA-256 is `f473d2ef3e7945c03ead7ead99d6df72529a1e034111043fd6eb46925c862673`; the pre-apply R00 file is also verified against `74378ad9bb5b1c5304b989174454d71a38cd1f9c7538a4bff410f35469a01507`.
- The single HTML consumes `/api/index`, `/api/meta`, and `/api/history` directly.
- Repoaxis nodes adapt into the existing v47 `tree` shape; canonical `contains` edges establish parentage and the synthetic `root` remains the visual anchor.
- Canonical `imports` edges feed Dependencies and Graph without a second viewer model.
- Working/staged changes and HEAD changes replace prototype Git fixtures.
- Repository name, host, branch, HEAD SHA, commit context, Inspector last-commit context, and Git overlay context become live.
- Graph cluster and normalized-position inputs regenerate from live file containment while retaining the existing renderer, router, interactions, CSS, and DOM.
- R01 adds wiring only; it does not redesign the canonical viewer.
