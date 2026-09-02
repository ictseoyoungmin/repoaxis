import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const VIEWER0 = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-0.js", import.meta.url));
const VIEWER2 = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-2.js", import.meta.url));
const VIEWER3 = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-3.js", import.meta.url));
const VIEWER4 = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-4.js", import.meta.url));
const source = fs.readFileSync(VIEWER0, "utf8");

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
  const mapped = { raw: change };
  assert.equal(context.changeCode(change), "mixed");
  assert.equal(context.statusLabel("mixed"), "S+W");
  assert.equal(context.stageText(change), "Staged + working");
  assert.equal(context.hasStagedState(mapped), true);
  assert.equal(context.hasWorkingState(mapped), true);
  assert.match(context.changeMeta(change), /staged renamed/);
  assert.match(context.changeMeta(change), /working modified/);
  assert.match(context.changeMeta(change), /from old\.js/);
  assert.match(context.badgeSvg("mixed", 0, 0), />S\+W<\/text>/);
  assert.equal(context.nodeGitText({ type: "file", git: change }), "staged renamed · working modified");
});

test("conflict presentation stays compact while retaining exact conflict detail", () => {
  const context = loadViewer0();
  const change = { tracked: true, staged: "conflicted", working: "conflicted", conflicted: true, conflict_code: "UU" };
  const mapped = { raw: change };
  assert.equal(context.changeCode(change), "conflict");
  assert.equal(context.statusLabel("conflict"), "!");
  assert.equal(context.stageText(change), "Conflicted");
  assert.equal(context.hasStagedState(mapped), true);
  assert.equal(context.hasWorkingState(mapped), true);
  assert.equal(context.changeMeta(change), "conflict UU");
  assert.match(context.badgeSvg("conflict", 0, 0), />!<\/text>/);
  assert.equal(context.nodeGitText({ type: "file", git: change }), "conflict UU");
});

test("single-lane changes retain their operation code and exact lane detail", () => {
  const context = loadViewer0();
  const staged = { tracked: true, staged: "renamed", working: "clean", conflicted: false, rename_from: "old.js" };
  const working = { tracked: true, staged: false, working: "untracked", conflicted: false };
  assert.equal(context.changeCode(staged), "R");
  assert.equal(context.changeMeta(staged), "staged renamed · from old.js");
  assert.equal(context.hasStagedState({ raw: staged }), true);
  assert.equal(context.hasWorkingState({ raw: staged }), false);
  assert.equal(context.changeCode(working), "U");
  assert.equal(context.changeMeta(working), "working untracked");
  assert.equal(context.hasStagedState({ raw: working }), false);
  assert.equal(context.hasWorkingState({ raw: working }), true);
});

test("Changes selection, filters, and stats consume structured Git lanes instead of display text", () => {
  const viewer2 = fs.readFileSync(VIEWER2, "utf8");
  const viewer3 = fs.readFileSync(VIEWER3, "utf8");
  const viewer4 = fs.readFileSync(VIEWER4, "utf8");
  assert.match(viewer2, /hasStagedState\(c\)/);
  assert.match(viewer2, /hasWorkingState\(c\)/);
  assert.match(viewer3, /filter\(hasStagedState\)/);
  assert.match(viewer3, /filter\(hasWorkingState\)/);
  assert.match(viewer4, /hasStagedState\(c\)/);
  assert.match(viewer4, /hasWorkingState\(c\)/);
  for (const viewer of [viewer2, viewer3, viewer4]) {
    assert.doesNotMatch(viewer, /stage\.includes\(['"]Working['"]\)/);
    assert.doesNotMatch(viewer, /stage\.includes\(['"]Staged['"]\)/);
  }
});
