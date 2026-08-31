# Installation

## npm / npx

Run Repoaxis from the Git repository you want to inspect.

Without a permanent install:

```bash
cd /path/to/your-repository
npx repoaxis doctor
npx repoaxis build
npx repoaxis summary
```

Or install globally:

```bash
npm install -g repoaxis
cd /path/to/your-repository
repoaxis doctor
repoaxis build
```

A successful first run creates `.repoaxis.json` at the Git root. Operational queries refresh that default index automatically when Git HEAD or relevant working-tree state changes.

For a focused target:

```bash
repoaxis find parseConfig
repoaxis context parseConfig
repoaxis why parseConfig
```

Replace `parseConfig` with a symbol or path from the repository being inspected.

## ChatGPT / Codex workspace marketplace

Repoaxis includes `.agents/plugins/marketplace.json`, so a workspace that supports GitHub plugin marketplace import can use this repository directly.

1. Open **Workspace settings → Plugins**.
2. Choose **Add → Import marketplace**.
3. Use `https://github.com/ictseoyoungmin/repoaxis` as **Source**.
4. Leave **Path** empty; the marketplace is rooted in this repository.
5. Leave **Branch/tag/commit** empty to follow the default branch, or pin a revision when you need a fixed plugin version.
6. Import the marketplace, review the Repoaxis plugin, then set the workspace installation policy appropriate for your users.

GitHub marketplace sync supplies plugin content. Workspace policy still controls who can install or use the plugin.

## Local Codex development

The repository also contains a repo-level `.agents/plugins/marketplace.json` whose Repoaxis entry resolves to the repository root and its `.codex-plugin/plugin.json` / `skills/` surfaces. This keeps local plugin development and the GitHub-imported marketplace on the same source tree instead of maintaining a copied plugin bundle.

The CLI is distributed independently through npm, so `npx repoaxis ...` remains available when an agent host does not expose plugin executables directly.

## Claude Code plugin

Claude Code recognizes the repository root as a plugin because it contains `.claude-plugin/plugin.json` and `skills/repoaxis/SKILL.md`.

For a local checkout:

```bash
git clone https://github.com/ictseoyoungmin/repoaxis.git
claude --plugin-dir /absolute/path/to/repoaxis
```

Claude Code exposes executables from the plugin root `bin/` directory to Bash while the plugin is enabled.

## Contributor checkout

To work on Repoaxis itself:

```bash
git clone https://github.com/ictseoyoungmin/repoaxis.git
cd repoaxis
npm ci
npm run check
npm run release:dry-run
```

`release:dry-run` validates the installable skill/package surfaces, runs the full test suite, and inspects the npm tarball without publishing it.
