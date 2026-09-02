# U03.5 keyboard navigation visual evidence

The actual Repoaxis viewer is captured at 1600×1000 with keyboard input driving the interaction.

Validated flow:

1. `Ctrl+K` opens repository search.
2. Typing `viewer` produces indexed repository matches.
3. `ArrowDown` moves the visible keyboard cursor through results.
4. `Enter` activates the current result, closes search, switches to Structure, focuses the selected entity, and opens Inspector.
5. `Escape` closes Inspector after the search navigation completes.

The capture also verifies that search options expose `aria-selected` state and that the selected row remains visibly highlighted while navigating.

Final capture run and artifact IDs are recorded after the compact-source verification pass.
