import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const VIEWER = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-3.js", import.meta.url));
const source = fs.readFileSync(VIEWER, "utf8");

function makeContext({ selected = "file:a.js", depRoot = "file:b.js", view = "structure" } = {}) {
  const nodes = {
    "file:a.js": { id: "file:a.js", type: "file", repoPath: "a.js", label: "a.js" },
    "file:b.js": { id: "file:b.js", type: "file", repoPath: "b.js", label: "b.js" },
    "function:a.js::run": { id: "function:a.js::run", type: "function", repoPath: "a.js", label: "run", parent: "file:a.js" },
    "folder:src": { id: "folder:src", type: "folder", repoPath: "src", label: "src/" },
  };
  const state = {
    selected,
    depRoot,
    view,
    impact: null,
    trace: null,
    filter: "all",
  };
  const context = vm.createContext({
    nodes,
    state,
    location: { hash: "" },
    $: () => null,
    $$: () => [],
    containingFile(node) {
      if (!node) return null;
      if (node.type === "file") return node;
      return node.parent ? nodes[node.parent] ?? null : null;
    },
    mostConnectedFile: () => nodes["file:b.js"],
    files: () => [nodes["file:a.js"], nodes["file:b.js"]],
    renderDrawer: () => {},
  });
  vm.runInContext(source, context);
  context.renderCurrent = () => {};
  context.renderDrawer = () => {};
  context.updateSelection = () => {};
  context.updateChrome = () => {};
  return context;
}

test("entering Dependencies roots the tree at the selected file", () => {
  const context = makeContext({ selected: "file:a.js", depRoot: "file:b.js" });
  context.switchView("dependencies");
  assert.equal(context.state.depRoot, "file:a.js");
  assert.equal(context.state.selected, "file:a.js");
});

test("entering Dependencies from a symbol uses its containing file as the explicit root", () => {
  const context = makeContext({ selected: "function:a.js::run", depRoot: "file:b.js" });
  context.switchView("dependencies");
  assert.equal(context.state.depRoot, "file:a.js");
  assert.equal(context.state.selected, "file:a.js");
});

test("entering Dependencies from a non-file selection falls back to the current explicit file root", () => {
  const context = makeContext({ selected: "folder:src", depRoot: "file:b.js" });
  context.switchView("dependencies");
  assert.equal(context.state.depRoot, "file:b.js");
  assert.equal(context.state.selected, "file:b.js");
});

test("selection inside Dependencies does not silently re-root the tree", () => {
  const context = makeContext({ selected: "file:b.js", depRoot: "file:a.js", view: "dependencies" });
  context.switchView("dependencies");
  assert.equal(context.state.depRoot, "file:a.js");
  assert.equal(context.state.selected, "file:b.js");
});
