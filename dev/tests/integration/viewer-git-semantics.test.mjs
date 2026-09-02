import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const VIEWER = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-0.js", import.meta.url));
const source = fs.readFileSync(VIEWER, "utf8");

function loadViewer0() {
  const elements = new Map();
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, { innerHTML: "", classList: { toggle() {} } });
      return elements.get(selector);
    },
    querySelectorAll() { return []; },
  };
  const context = vm.createContext({
    document,
    location: { hash: "" },
    window: { open() {} },
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout,
    clearTimeout,
  });
  vm.runInContext(source, context);
  return context;
}

test("mixed staged and working state has one canonical mixed presentation", () => {
  const context = loadViewer0();
  const change = { tracked: true, staged: "renamed", working: "modified", conflicted: false, rename_from: "old.js", similarity: 100 };
  assert.equal(context.changeCode(change), "mixed");
  assert.equal(context.statusLabel("mixed"), "S+W");
  assert.equal(context.stageText(change), "Staged + working");
  assert.match(context.changeMeta(change), /staged renamed/);
  assert.match(context.changeMeta(change), /working modified/);
  assert.match(context.changeMeta(change), /from old\.js/);
  assert.match(context.badgeSvg("mixed", 0, 0), />S\+W<\/text>/);
  assert.equal(context.nodeGitText({ type: "file", git: change }), "staged renamed · working modified");
});

test("conflict presentation stays compact while retaining exact conflict detail", () => {
  const context = loadViewer0();
  const change = { tracked: true, staged: "conflicted", working: "conflicted", conflicted: true, conflict_code: "UU" };
  assert.equal(context.changeCode(change), "conflict");
  assert.equal(context.statusLabel("conflict"), "!");
  assert.equal(context.stageText(change), "Conflicted");
  assert.equal(context.changeMeta(change), "conflict UU");
  assert.match(context.badgeSvg("conflict", 0, 0), />!<\/text>/);
  assert.match(context.nodeGitText({ type: "file", git: change }), /conflict UU/);
});

test("single-lane changes retain their operation code and exact lane detail", () => {
  const context = loadViewer0();
  const staged = { tracked: true, staged: "renamed", working: "clean", conflicted: false, rename_from: "old.js" };
  const working = { tracked: true, staged: false, working: "untracked", conflicted: false };
  assert.equal(context.changeCode(staged), "R");
  assert.equal(context.changeMeta(staged), "staged renamed · from old.js");
  assert.equal(context.changeCode(working), "U");
  assert.equal(context.changeMeta(working), "working untracked");
});
