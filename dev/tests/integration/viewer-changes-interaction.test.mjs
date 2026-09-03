import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const VIEWER2=fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-2.js",import.meta.url));
const CSS=fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-surfaces.css",import.meta.url));
const viewer=fs.readFileSync(VIEWER2,"utf8"),css=fs.readFileSync(CSS,"utf8");

test("Changes exposes direct change-set selection state",()=>{
  assert.ok(viewer.includes('id="selectAllChanges"'));
  assert.ok(viewer.includes('change-set-picked'));
  assert.ok(viewer.includes("somePicked?'indeterminate'"));
  assert.ok(viewer.includes('state.changeSet=new Set(allPicked?[]:currentIds)'));
  assert.match(css,/\.change-select\.indeterminate/);
  assert.match(css,/\.change-row\.change-set-picked/);
});

test("Changes quick presets expose the active set",()=>{
  assert.ok(viewer.includes("sameSet=ids=>ids.length>0"));
  assert.ok(viewer.includes("preset=sameSet(stagedIds)?'staged'"));
  assert.ok(viewer.includes("preset==='working'"));
  assert.ok(viewer.includes("preset==='all'"));
  assert.ok(viewer.includes('class="set-count"'));
  assert.match(css,/\.set-toolbar \.quick:hover,\.set-toolbar \.quick\.active/);
});

test("Changes binds every repeated action with querySelectorAll",()=>{
  assert.ok(viewer.includes("$$('[data-check]').forEach"));
  assert.ok(viewer.includes("$$('[data-impact]').forEach"));
  assert.ok(viewer.includes("$$('[data-graph]').forEach"));
  assert.ok(viewer.includes("$$('[data-quick]').forEach"));
});

test("mixed staged plus working status gets explicit horizontal breathing room",()=>{
  assert.ok(viewer.includes("mixedStyle=c.status==='mixed'?'min-width:30px;width:auto;padding:0 5px"));
  assert.ok(viewer.includes("statusLabel(c.status)"));
  assert.match(css,/\.status-box\{width:24px;height:24px/);
});
