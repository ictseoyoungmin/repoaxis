import fs from "node:fs";
import path from "node:path";

const EXPECTED_REPOSITORY_URL = "git+https://github.com/ictseoyoungmin/repoaxis.git";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function expectedTag(version) {
  return `v${version}`;
}

export function extractReleaseNotes(changelog, version) {
  const heading = new RegExp(`^## ${escapeRegExp(version)} — \\d{4}-\\d{2}-\\d{2}\\s*$`, "m");
  const match = heading.exec(changelog);
  if (!match) throw new Error(`CHANGELOG.md has no dated section for ${version}`);
  const start = match.index + match[0].length;
  const rest = changelog.slice(start);
  const next = rest.search(/^## /m);
  const body = (next === -1 ? rest : rest.slice(0, next)).trim();
  if (!body) throw new Error(`CHANGELOG.md section for ${version} is empty`);
  return body;
}

export function validateReleaseContract(root, { tag = null } = {}) {
  const pkg = readJson(path.join(root, "package.json"));
  const codex = readJson(path.join(root, ".codex-plugin", "plugin.json"));
  const claude = readJson(path.join(root, ".claude-plugin", "plugin.json"));
  const marketplace = readJson(path.join(root, ".agents", "plugins", "marketplace.json"));
  const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  const workflowPath = path.join(root, ".github", "workflows", "release.yml");
  const workflow = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, "utf8") : "";

  if (pkg.name !== "repoaxis") throw new Error("package name must be repoaxis");
  if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error(`package version is not release semver: ${pkg.version}`);
  if (pkg.repository?.url !== EXPECTED_REPOSITORY_URL) {
    throw new Error(`package repository.url must be ${EXPECTED_REPOSITORY_URL}`);
  }
  if (codex.version !== pkg.version || claude.version !== pkg.version) {
    throw new Error("plugin manifest versions must match package.json");
  }
  const plugin = marketplace.plugins?.find((entry) => entry.name === "repoaxis");
  if (!plugin || plugin.source?.source !== "local" || plugin.source?.path !== "./") {
    throw new Error("marketplace must expose repoaxis from repository root");
  }
  const releaseTag = expectedTag(pkg.version);
  if (tag !== null && tag !== releaseTag) throw new Error(`release tag ${tag} does not match package version ${releaseTag}`);
  const notes = extractReleaseNotes(changelog, pkg.version);
  if (!workflow) throw new Error(".github/workflows/release.yml is missing");
  if (/\bnpm\s+(?:--[^\s]+\s+)*publish\b/.test(workflow)) {
    throw new Error("release workflow must not publish to npm before trusted publishing is enabled");
  }
  if (!workflow.includes("gh release create")) throw new Error("release workflow must create a GitHub Release");

  return { name: pkg.name, version: pkg.version, tag: releaseTag, notes, repository_url: pkg.repository.url };
}
