import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { startViewer } from "../../../skills/repoaxis/lib/view-server.mjs";

const VIEWER_DIR = fileURLToPath(new URL("../../../skills/repoaxis/viewer/", import.meta.url));
const VIEWER_HTML = path.join(VIEWER_DIR, "repoaxis.html");
const VIEWER_JS = [0, 1, 2, 3, 4].map((part) => path.join(VIEWER_DIR, `viewer-${part}.js`));

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function createRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-viewer-"));
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "util.js"), "export const value = 1;\n", "utf8");
  fs.writeFileSync(path.join(root, "src", "main.js"), "import { value } from './util.js';\nexport function main(){ return value; }\n", "utf8");
  fs.writeFileSync(path.join(root, "src", "legacy.js"), "export const legacy = true;\n", "utf8");
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Repoaxis Viewer Test");
  git(root, "config", "user.email", "repoaxis@example.invalid");
  git(root, "remote", "add", "origin", "git@github.com:example/repoaxis-viewer-fixture.git");
  git(root, "add", ".");
  git(root, "commit", "-qm", "fixture");
  fs.writeFileSync(path.join(root, "src", "util.js"), "export const value = 2;\n", "utf8");
  fs.rmSync(path.join(root, "src", "legacy.js"));
  git(root, "add", "-A");
  git(root, "commit", "-qm", "update util and remove legacy");
  return root;
}

test("viewer client scripts compile without browser execution", () => {
  const source = VIEWER_JS.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.doesNotThrow(() => new Function(source));
});

test("viewer shell is live-data only and retains the canonical four-surface UX", () => {
  const html = fs.readFileSync(VIEWER_HTML, "utf8");
  const client = [html, ...VIEWER_JS.map((file) => fs.readFileSync(file, "utf8"))].join("\n");
  assert.match(html, /data-view="structure"/);
  assert.match(html, /data-view="dependencies"/);
  assert.match(html, /data-view="changes"/);
  assert.match(html, /data-view="graph"/);
  assert.match(client, /function mapIndex\(index\)/);
  assert.match(client, /\/api\/meta/);
  assert.match(client, /\/api\/history/);
  assert.match(client, /generated\.refresh\?\.fingerprint/);
  assert.match(client, /Source contents are intentionally not served/);
  assert.doesNotMatch(client, /ictseoyoungmin\/repoaxis/);
  assert.doesNotMatch(client, /a1b2c3d/);
  assert.doesNotMatch(client, /src\/config\.js/);
  assert.doesNotMatch(client, /deprecated-loader/);
  assert.doesNotMatch(client, /Prototype preview only/);
  assert.doesNotMatch(client, /GitHub link opened in prototype/);
  assert.doesNotMatch(client, /<span>Settings<\/span>/);
  assert.doesNotMatch(client, /<span>Help<\/span>/);
  assert.doesNotMatch(client, /title="More"/);
});

test("viewer serves live repository metadata, HEAD history, and a fresh read-only index over loopback", async () => {
  const root = createRepo();
  const viewer = await startViewer({ root, port: 0, open: false });
  try {
    assert.equal(viewer.host, "127.0.0.1");
    assert.match(viewer.url, /^http:\/\/127\.0\.0\.1:\d+\/$/);

    const page = await fetch(viewer.url);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Repoaxis/);
    assert.match(html, /data-view="structure"/);
    assert.match(html, /data-view="dependencies"/);
    assert.match(html, /data-view="changes"/);
    assert.match(html, /data-view="graph"/);
    assert.doesNotMatch(html, /type="file"/);
    for (const asset of ["/viewer-base.css", "/viewer-surfaces.css", "/viewer-0.js", "/viewer-1.js", "/viewer-2.js", "/viewer-3.js", "/viewer-4.js"]) {
      const response = await fetch(new URL(asset, viewer.url));
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") ?? "", asset.endsWith(".css") ? /text\/css/ : /text\/javascript/);
      assert.ok((await response.text()).length > 100);
    }

    const first = await fetch(new URL("/api/index", viewer.url)).then((response) => response.json());
    assert.equal(first.ok, true);
    assert.equal(first.refreshed, true);
    assert.equal(first.reason, "index-missing");
    assert.equal(first.index.generated.edges.some((edge) => edge.type === "imports"), true);

    const meta = await fetch(new URL("/api/meta", viewer.url)).then((response) => response.json());
    assert.deepEqual(meta, {
      ok: true,
      display_name: "example/repoaxis-viewer-fixture",
      host_label: "GitHub",
      web_url: "https://github.com/example/repoaxis-viewer-fixture",
    });

    const history = await fetch(new URL("/api/history", viewer.url)).then((response) => response.json());
    assert.equal(history.ok, true);
    assert.equal(history.commit.subject, "update util and remove legacy");
    assert.equal(history.commit.author_name, "Repoaxis Viewer Test");
    assert.equal(history.changes.some((change) => change.path === "src/util.js" && change.status === "M"), true);
    assert.equal(history.changes.some((change) => change.path === "src/legacy.js" && change.status === "D"), true);

    const health = await fetch(new URL("/api/health", viewer.url)).then((response) => response.json());
    assert.deepEqual(health, { ok: true, repository: ".", host: "127.0.0.1" });

    fs.writeFileSync(path.join(root, "src", "util.js"), "export const value = 3;\n", "utf8");
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
    for (const endpoint of ["/api/index", "/api/meta", "/api/history"]) {
      const post = await fetch(new URL(endpoint, viewer.url), { method: "POST" });
      assert.equal(post.status, 405);
    }
    const missing = await fetch(new URL("/missing", viewer.url));
    assert.equal(missing.status, 404);
  } finally {
    await new Promise((resolve) => viewer.server.close(resolve));
  }
});
