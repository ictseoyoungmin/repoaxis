import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { writeViewerSnapshot } from "../../../skills/repoaxis/lib/view-snapshot.mjs";

const BIN = fileURLToPath(new URL("../../../bin/repoaxis", import.meta.url));

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function createRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-snapshot-"));
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "util.js"), "export const value = 1;\n", "utf8");
  fs.writeFileSync(path.join(root, "src", "main.js"), "import { value } from './util.js';\nexport const result = value;\n", "utf8");
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Repoaxis Snapshot Test");
  git(root, "config", "user.email", "repoaxis@example.invalid");
  git(root, "remote", "add", "origin", "git@github.com:example/repoaxis-snapshot-fixture.git");
  git(root, "add", ".");
  git(root, "commit", "-qm", "snapshot fixture");
  fs.writeFileSync(path.join(root, "src", "util.js"), "export const value = 2;\n", "utf8");
  return root;
}

function embeddedPayload(html) {
  const marker = "window.__REPOAXIS_SNAPSHOT__=";
  const start = html.indexOf(marker);
  assert.notEqual(start, -1);
  const valueStart = start + marker.length;
  const end = html.indexOf(";\nwindow.fetch=async function", valueStart);
  assert.notEqual(end, -1);
  return JSON.parse(html.slice(valueStart, end));
}

test("frozen viewer snapshot reuses the canonical viewer shell and embeds all live data", async () => {
  const root = createRepo();
  const output = path.join(root, "artifacts", "viewer.html");
  const result = await writeViewerSnapshot({ root, output });
  assert.equal(result.ok, true);
  assert.equal(result.output, output);
  assert.ok(result.bytes > 20_000);

  const html = fs.readFileSync(output, "utf8");
  assert.match(html, /<title>Repoaxis — Frozen Snapshot<\/title>/);
  assert.match(html, /data-repoaxis-mode="snapshot"/);
  assert.match(html, /data-repoaxis-asset="viewer-base\.css"/);
  assert.match(html, /data-repoaxis-asset="viewer-surfaces\.css"/);
  for (let part = 0; part <= 4; part += 1) assert.match(html, new RegExp(`data-repoaxis-asset="viewer-${part}\\.js"`));
  assert.doesNotMatch(html, /(?:src|href)="\/viewer-/);

  const payload = embeddedPayload(html);
  assert.equal(payload.format, "repoaxis-viewer-snapshot-v1");
  assert.equal(payload.responses["/api/meta"].display_name, "example/repoaxis-snapshot-fixture");
  assert.equal(payload.responses["/api/meta"].host_label, "Snapshot");
  assert.equal(payload.responses["/api/meta"].source_host_label, "GitHub");
  assert.equal(payload.responses["/api/history"].commit.subject, "snapshot fixture");
  assert.equal(payload.responses["/api/index"].reason, "snapshot");
  assert.equal(payload.responses["/api/index"].refreshed, false);
  assert.equal(payload.responses["/api/index"].index.generated.edges.some((edge) => edge.type === "imports"), true);
  assert.equal(payload.responses["/api/index"].index.generated.git_changes.some((change) => change.path === "src/util.js"), true);
});

test("repoaxis snapshot is a first-class CLI command and writes the standalone artifact", () => {
  const help = execFileSync(process.execPath, [BIN, "help"], { encoding: "utf8" });
  assert.match(help, /repoaxis snapshot \[--root PATH\] \[--output FILE\]/);

  const root = createRepo();
  const output = path.join(root, "snapshot.html");
  const stdout = execFileSync(process.execPath, [BIN, "snapshot", "--root", root, "--output", output], { encoding: "utf8" });
  const result = JSON.parse(stdout.trim());
  assert.equal(result.ok, true);
  assert.equal(result.output, output);
  assert.equal(fs.existsSync(output), true);
  assert.match(fs.readFileSync(output, "utf8"), /window\.__REPOAXIS_SNAPSHOT__/);
});
