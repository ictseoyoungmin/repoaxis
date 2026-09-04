# Responsive zoom controls visual QA

Scope: compact viewer containment after the product-runtime cleanup.

- Branch: `fix/viewer-responsive-zoom-controls`
- Live source: Repoaxis repository itself; no synthetic browser fixture.
- Browser QA: Chromium at 1280×820 and 1600×900.
- Surfaces checked at both sizes: Structure, Dependencies, Changes, Graph.
- Assertions: document/body width equals viewport, visible zoom cluster remains fully inside `.view-host`, all zoom buttons remain exposed, console errors are empty.
- Artifact source: GitHub Actions run `33856516413`, artifact `responsive-viewer-browser-qa` (`9930403337`).
- Visual result: at 1280px the Structure and Graph zoom clusters render fully inside the card instead of clipping at the right edge. Header repository/branch labels collapse with ellipsis rather than widening the application beyond the viewport.

The QA-only workflow and Playwright helper were removed before PR creation.
