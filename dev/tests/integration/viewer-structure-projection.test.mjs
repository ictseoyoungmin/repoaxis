import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const VIEWER = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-1.js", import.meta.url));
const source = fs.readFileSync(VIEWER, "utf8");
const structureSource = source.slice(0, source.indexOf("function depProjection"));

function makeContext() {
  const nodes = {
    root: { id: "root", type: "root", parent: null, label: "repo/", repoPath: "." },
    "folder:src": { id: "folder:src", type: "folder", parent: "root", label: "src/", repoPath: "src" },
    "folder:dev": { id: "folder:dev", type: "folder", parent: "root", label: "dev/", repoPath: "dev" },
    "folder:src/core": { id: "folder:src/core", type: "folder", parent: "folder:src", label: "core/", repoPath: "src/core" },
    "folder:src/features": { id: "folder:src/features", type: "folder", parent: "folder:src", label: "features/", repoPath: "src/features" },
    "file:README.md": { id: "file:README.md", type: "file", parent: "root", label: "README.md", repoPath: "README.md" },
    "file:src/core/a.js": { id: "file:src/core/a.js", type: "file", parent: "folder:src/core", label: "a.js", repoPath: "src/core/a.js" },
    "file:src/core/b.js": { id: "file:src/core/b.js", type: "file", parent: "folder:src/core", label: "b.js", repoPath: "src/core/b.js" },
    "function:src/core/a.js::run": { id: "function:src/core/a.js::run", type: "function", parent: "file:src/core/a.js", label: "run", repoPath: "src/core/a.js" },
  };
  for (let i = 0; i < 130; i++) {
    nodes[`file:dev/f${i}.js`] = { id: `file:dev/f${i}.js`, type: "file", parent: "folder:dev", label: `f${i}.js`, repoPath: `dev/f${i}.js` };
  }
  const rank = { root: -1, folder: 0, file: 1, class: 2, function: 3 };
  const state = { structureFocus: false, structureRoot: "root", selected: "root" };
  const context = vm.createContext({
    nodes,
    state,
    ROOT: "root",
    children(id) {
      return Object.values(nodes).filter(n => n.parent === id).sort((a,b)=>(rank[a.type]-rank[b.type])||a.repoPath.localeCompare(b.repoPath));
    },
    containingFile(n) {
      let x=n;
      while(x?.parent){x=nodes[x.parent];if(x?.type==="file")return x}
      return n?.type==="file"?n:null;
    },
    statusFor: () => null,
    colorFor: () => ["#fff","#ddd","#333"],
    badgeSvg: () => "",
    esc: String,
    $: () => ({ hidden:false, textContent:"", setAttribute(){}, innerHTML:"", querySelectorAll(){return []} }),
    bindNodes: () => {},
    applyCamera: () => {},
    applyFilter: () => {},
    resetCamera: () => {},
    renderDrawer: () => {},
    updateSelection: () => {},
  });
  vm.runInContext(structureSource, context);
  return context;
}

test("overview projects macro topology instead of every indexed node", () => {
  const c = makeContext();
  const p = c.structureOverviewProjection();
  assert.equal(p.mode, "overview");
  assert.ok(p.visible.has("folder:src"));
  assert.ok(p.visible.has("folder:src/core"));
  assert.ok(p.visible.has("file:README.md"));
  assert.ok(!p.visible.has("file:src/core/a.js"));
  assert.ok(p.visible.size < p.total / 4);
});

test("focused structure is a bounded two-level subtree", () => {
  const c = makeContext();
  const p = c.structureFocusProjection("folder:dev");
  assert.equal(p.mode, "focus");
  assert.equal(p.root, "folder:dev");
  assert.ok(p.visible.size <= 96);
  assert.ok(p.hidden > 0);
});

test("symbol focus resolves to its containing file", () => {
  const c = makeContext();
  assert.equal(c.structureFocusTarget("function:src/core/a.js::run"), "file:src/core/a.js");
});

test("selection inside an existing focused subtree does not silently re-root it", () => {
  const c = makeContext();
  c.state.structureFocus = true;
  c.state.structureRoot = "folder:src";
  c.state.selected = "file:src/core/a.js";
  const p = c.structureProjection();
  assert.equal(p.root, "folder:src");
});
