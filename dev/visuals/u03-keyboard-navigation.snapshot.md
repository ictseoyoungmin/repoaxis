# U03.5 keyboard navigation visual evidence

The actual Repoaxis viewer was captured at 1600×1000 with keyboard input driving the interaction.

Validated flow:

1. `Ctrl+K` opens repository search.
2. Typing `test.mjs` produces indexed repository matches.
3. `ArrowDown` moves the visible keyboard cursor through results.
4. `Enter` activates the current result, closes search, switches to Structure, focuses the selected entity, and opens Inspector.
5. `Escape` closes Inspector after the search navigation completes.

The capture also verifies that search options expose `aria-selected` state and that the selected row remains visibly highlighted while navigating. The final Escape check waits for the 280ms drawer transition and asserts the rendered Inspector width is at most 2px before capture.

Final visual capture:

- branch commit: `da1ea407fc3da13c1ea14101d4f79e2093c7325a`
- GitHub Actions run: `33630876030`
- artifact: `9846747277`
- `u03-keyboard-search.png`
- `u03-keyboard-destination.png`
- `u03-keyboard-escape.png`
- `u03-keyboard-navigation.html`

The temporary Playwright helper, snapshot workflow, and source-normalization workflow were removed before PR creation.
