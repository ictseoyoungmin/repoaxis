# Installation

## npm / npx

Run without a permanent install:

```bash
npx repoaxis doctor
npx repoaxis build
```

Or install globally:

```bash
npm install -g repoaxis
repoaxis doctor
```

## Claude Code plugin

Claude Code recognizes the repository root as a plugin because it contains `.claude-plugin/plugin.json` and `skills/repoaxis/SKILL.md`.

For a local checkout:

```bash
claude --plugin-dir /absolute/path/to/repoaxis
```

Claude Code exposes executables from the plugin root `bin/` directory to Bash while the plugin is enabled.

## Codex plugin

Codex recognizes the repository root as a plugin because it contains `.codex-plugin/plugin.json` with `skills: "./skills/"`.

Local Codex plugin discovery is marketplace-based. Copy or symlink the plugin to a local plugin directory such as `~/.codex/plugins/repoaxis`, then add a `repoaxis` entry to `~/.agents/plugins/marketplace.json` that points to that local path. Restart Codex and install Repoaxis from the local marketplace.

Example plugin entry:

```json
{
  "name": "repoaxis",
  "source": {
    "source": "local",
    "path": "./.codex/plugins/repoaxis"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Developer Tools"
}
```

The CLI is distributed independently through npm, so `npx repoaxis ...` remains available even when an agent host does not expose plugin executables directly.
