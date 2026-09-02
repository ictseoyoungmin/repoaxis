import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const PROJECTION_VIEWER = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-2.js", import.meta.url));
const GRAPH_VIEWER = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-3.js", import.meta.url));
const projectionSource = fs.readFileSync(PROJECTION_VIEWER, "utf8");
const graphSource = fs.readFileSync(GRAPH_VIEWER, "utf8");

function makeContext({ count = 90, selected = "file:f0.js", graphNeighborhood = false, graphDepth = 1, impact = null, pairs = [] } = {}) {
  const nodes = {};
  for (let i = 0; i < count; i++) nodes[`file:f${i}.js`] = { id: `file:f${i}.js`, type: "file", repoPath: `src/f${String(i).padStart(2, "0")}.js`, label: `f${i}.js` };
  const edges = pairs.map(([a, b]) => [`file:f${a}.js`, `file:f${b}.js`]);
  const state = { selected, graphNeighborhood, graphDepth, impact, gitOverlay: "working", changeSet: new Set() };
  const files = () => Object.values(nodes);
  const imports = (id) => edges.filter(([a]) => a === id).map(([, b]) => nodes[b]).filter(Boolean);
  const importedBy = (id) => edges.filter(([, b]) => b === id).map(([a]) => nodes[a]).filter(Boolean);
  const context = vm.createContext({
    nodes,
    edges,
    state,
    files,
    imports,
    importedBy,
    containingFile: (node) => node?.type === "file" ? node : null,
    mostConnectedFile: () => nodes["file:f0.js"] ?? null,
  });
  vm.runInContext(projectionSource, context);
  return context;
}

test("large repositories expose an explicit bounded overview instead of claiming to be whole", () => {
  const context = makeContext({ pairs: [[0, 1], [1, 2], [2, 3], [3, 4]] });
  const projection = context.graphProjection();
  assert.equal(projection.mode, "bounded");
  assert.equal(projection.total, 90);
  assert.equal(projection.list.length, 80);
  assert.equal(projection.omitted, 10);
  assert.equal(projection.localCount, 5);
});

test("focused graph is a true neighborhood projection and identifies isolated files", () => {
  const context = makeContext({ selected: "file:f89.js", graphNeighborhood: true, pairs: [[0, 1], [1, 2]] });
  const projection = context.graphProjection();
  assert.equal(projection.mode, "focused");
  assert.deepEqual(projection.list.map((file) => file.id), ["file:f89.js"]);
  assert.equal(projection.isolated, true);
  assert.equal(projection.omitted, 89);
});

test("impact mode renders only the bounded impact set", () => {
  const impact = { mode: "impact", depth: 2, roots: new Set(["file:f0.js"]), nodes: new Set(["file:f0.js", "file:f1.js", "file:f2.js"]), edges: new Set(["file:f1.js>file:f0.js", "file:f2.js>file:f1.js"]) };
  const context = makeContext({ impact, pairs: [[1, 0], [2, 1], [50, 51]] });
  const projection = context.graphProjection();
  assert.equal(projection.mode, "impact");
  assert.deepEqual(projection.list.map((file) => file.id), ["file:f0.js", "file:f1.js", "file:f2.js"]);
});

test("changing impact depth preserves impact mode", () => {
  const context = makeContext({ pairs: [[1, 0], [2, 1]] });
  const impact = context.aggregateImpact(["file:f0.js"], 1, "impact");
  assert.equal(impact.mode, "impact");
  assert.equal(impact.depth, 1);
  assert.deepEqual([...impact.nodes].sort(), ["file:f0.js", "file:f1.js"]);
});

test("graph chrome names bounded, focused, and empty states explicitly", () => {
  assert.match(graphSource, /Bounded overview/);
  assert.match(graphSource, /Focused \$\{projection\.depth\}-hop/);
  assert.match(graphSource, /No repository-local imports/);
  assert.match(graphSource, /No upstream impact within this depth/);
  assert.match(graphSource, /View graph overview/);
  assert.doesNotMatch(graphSource, /highlighted in the full graph/);
});
