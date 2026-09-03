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
  assert.ok(viewer.includes("somePicked?'partial'"));
  assert.ok(viewer.includes('state.changeSet=new Set(allPicked?[]:currentIds)'));
  assert.match(css,/\.check\.partial/);
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
