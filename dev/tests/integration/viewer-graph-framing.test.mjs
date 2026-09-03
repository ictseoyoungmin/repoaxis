import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const V0=fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-0.js",import.meta.url));
const V3=fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-3.js",import.meta.url));
const v0=fs.readFileSync(V0,"utf8"),v3=fs.readFileSync(V3,"utf8");

test("Git badges widen inward for multi-character labels",()=>{
  assert.ok(v0.includes("actualW=Math.max(w,14+label.length*5)"));
  assert.ok(v0.includes("drawX=x+w-actualW"));
  assert.ok(v0.includes('class="git-badge"'));
});

test("impact Graph entry frames all projected roots instead of only the selected root",()=>{
  assert.ok(v3.includes("projection.mode==='impact'&&projection.list?.length"));
  assert.ok(v3.includes("projection.list.map(f=>L.pos[f.id]).filter(Boolean)"));
  assert.ok(v3.includes("cx=(minX+maxX)/2,cy=(minY+maxY)/2"));
  assert.ok(v3.includes("fit=Math.min(s0,(L.viewW-160)/contentW,(L.viewH-150)/contentH)"));
});
