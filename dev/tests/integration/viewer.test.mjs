import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { startViewer } from "../../../skills/repoaxis/lib/view-server.mjs";

const VIEWER_HTML = fileURLToPath(new URL("../../../skills/repoaxis/viewer/repoaxis.html", import.meta.url));

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function createRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-viewer-"));
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "util.js"), "export const value = 1;\n", "utf8");
  fs.writeFileSync(path.join(root, "src", "main.js"), "import { value } from './util.js';\nexport function main(){ return value; }\n", "utf8");
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Repoaxis Viewer Test");
  git(root, "config", "user.email", "repoaxis@example.invalid");
  git(root, "add", ".");
  git(root, "commit", "-qm", "fixture");
  return root;
}

test("viewer client script compiles without browser execution", () => {
  const html = fs.readFileSync(VIEWER_HTML, "utf8");
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, "viewer script block is missing");
  assert.doesNotThrow(() => new Function(match[1]));
});

test("viewer serves the structural UI and a fresh read-only index over loopback", async () => {
  const root = createRepo();
  const viewer = await startViewer({ root, port: 0, open: false });
  try {
    assert.equal(viewer.host, "127.0.0.1");
    assert.match(viewer.url, /^http:\/\/127\.0\.0\.1:\d+\/$/);

    const page = await fetch(viewer.url);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Repoaxis/);
    assert.match(html, /data-tab="structure"/);
    assert.match(html, /data-tab="dependencies"/);
    assert.match(html, /data-tab="graph"/);
    assert.doesNotMatch(html, /type="file"/);

    const first = await fetch(new URL("/api/index", viewer.url)).then((response) => response.json());
    assert.equal(first.ok, true);
    assert.equal(first.refreshed, true);
    assert.equal(first.reason, "index-missing");
    assert.equal(first.index.generated.edges.some((edge) => edge.type === "imports"), true);

    const health = await fetch(new URL("/api/health", viewer.url)).then((response) => response.json());
    assert.deepEqual(health, { ok: true, repository: ".", host: "127.0.0.1" });

    fs.writeFileSync(path.join(root, "src", "util.js"), "export const value = 2;\n", "utf8");
    const second = await fetch(new URL("/api/index", viewer.url)).then((response) => response.json());
    assert.equal(second.ok, true);
    assert.equal(second.refreshed, true);
    assert.equal(second.reason, "working-tree-changed");
    assert.equal(second.index.generated.nodes["file:src/util.js"].git.working, "modified");
  } finally {
    await new Promise((resolve) => viewer.server.close(resolve));
  }
});

test("viewer rejects non-GET requests and unknown routes", async () => {
  const root = createRepo();
  const viewer = await startViewer({ root, port: 0, open: false });
  try {
    const post = await fetch(new URL("/api/index", viewer.url), { method: "POST" });
    assert.equal(post.status, 405);
    const missing = await fetch(new URL("/missing", viewer.url));
    assert.equal(missing.status, 404);
  } finally {
    await new Promise((resolve) => viewer.server.close(resolve));
  }
});
