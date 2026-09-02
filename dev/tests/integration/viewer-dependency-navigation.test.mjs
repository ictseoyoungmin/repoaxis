import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const VIEWER = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-1.js", import.meta.url));
const source = fs.readFileSync(VIEWER, "utf8");
const start = source.indexOf("function dependencyRootFile");
const end = source.indexOf("function depProjection");
const helpers = source.slice(start, end);

function makeContext() {
  const nodes = {
    "file:a.js": { id: "file:a.js", type: "file", label: "a.js", repoPath: "a.js" },
    "file:b.js": { id: "file:b.js", type: "file", label: "b.js", repoPath: "b.js" },
    "file:c.js": { id: "file:c.js", type: "file", label: "c.js", repoPath: "c.js" },
    "function:b.js::run": { id: "function:b.js::run", type: "function", parent: "file:b.js", label: "run", repoPath: "b.js" },
  };
  const state = { depRoot: null, depInitialRoot: null, depRootTrail: [], selected: "file:a.js" };
  const context = vm.createContext({
    nodes, state,
    containingFile(n) { return n?.type === "function" ? nodes[n.parent] : n?.type === "file" ? n : null; },
  });
  vm.runInContext(helpers, context);
  return context;
}

test("dependency entry establishes an initial root and a one-item trail", () => {
  const c = makeContext();
  assert.equal(c.dependencyResetTrail("file:a.js"), "file:a.js");
  assert.equal(c.state.depRoot, "file:a.js");
  assert.equal(c.state.depInitialRoot, "file:a.js");
  assert.deepEqual([...c.state.depRootTrail], ["file:a.js"]);
});

test("inspecting a child does not change root until it is explicitly promoted", () => {
  const c = makeContext();
  c.dependencyResetTrail("file:a.js");
  c.state.selected = "file:b.js";
  assert.equal(c.state.depRoot, "file:a.js");
  c.dependencyPushRoot(c.state.selected);
  assert.equal(c.state.depRoot, "file:b.js");
  assert.deepEqual([...c.state.depRootTrail], ["file:a.js", "file:b.js"]);
});

test("Back and Initial root restore dependency navigation context", () => {
  const c = makeContext();
  c.dependencyResetTrail("file:a.js");
  c.dependencyPushRoot("file:b.js");
  c.dependencyPushRoot("file:c.js");
  assert.equal(c.dependencyBackRoot(), "file:b.js");
  assert.deepEqual([...c.state.depRootTrail], ["file:a.js", "file:b.js"]);
  assert.equal(c.dependencyReturnInitialRoot(), "file:a.js");
  assert.deepEqual([...c.state.depRootTrail], ["file:a.js"]);
});

test("clicking an earlier root trail node truncates forward history", () => {
  const c = makeContext();
  c.dependencyResetTrail("file:a.js");
  c.dependencyPushRoot("file:b.js");
  c.dependencyPushRoot("file:c.js");
  assert.equal(c.dependencyJumpTrail(1), "file:b.js");
  assert.deepEqual([...c.state.depRootTrail], ["file:a.js", "file:b.js"]);
});

test("symbol selections promote their containing file when used as root", () => {
  const c = makeContext();
  c.dependencyResetTrail("file:a.js");
  assert.equal(c.dependencyPushRoot("function:b.js::run"), "file:b.js");
  assert.equal(c.state.depRoot, "file:b.js");
});
