import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const VIEWER5=fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-5.js",import.meta.url));
const HTML=fileURLToPath(new URL("../../../skills/repoaxis/viewer/repoaxis.html",import.meta.url));
const viewer=fs.readFileSync(VIEWER5,"utf8"),html=fs.readFileSync(HTML,"utf8");

test("viewer loads the cross-view continuity layer after the existing viewer runtime",()=>{
  assert.ok(html.includes('<script src="/viewer-4.js"></script>\n<script src="/viewer-5.js"></script>'));
});

test("cross-view navigation preserves source and projected target context",()=>{
  assert.ok(viewer.includes('function navigateSelectionTo(view){'));
  assert.ok(viewer.includes('sourceId:source.id,targetId:target.id'));
  assert.ok(viewer.includes('projected,projectionReason:projected?\'Containing file projection\':\'Exact selection\''));
  assert.ok(viewer.includes('state.crossView=projectionContextU17(source,target,view)'));
});

test("symbol projection is explicit for Dependencies and Graph",()=>{
  assert.ok(viewer.includes("`${n.label} → containing file · becomes root`"));
  assert.ok(viewer.includes("`${n.label} → containing file · file-level graph`"));
  assert.ok(viewer.includes("`${source.label} → containing file ${target.label} · ${role}`"));
});

test("arrival feedback covers every surface and lasts for the prototype interval",()=>{
  assert.ok(viewer.includes('const ARRIVAL_MS=1400'));
  assert.ok(viewer.includes("if(view==='structure')return $('#structureSvg')"));
  assert.ok(viewer.includes("if(view==='dependencies')return $('#depSvg')"));
  assert.ok(viewer.includes("if(view==='graph')return $('#graphSvg')"));
  assert.ok(viewer.includes("if(view==='changes')return $('#changesShell')"));
  assert.ok(viewer.includes("el.classList.add('arrival-target')"));
  assert.ok(viewer.includes('.node.arrival-target .bg'));
  assert.ok(viewer.includes('.change-row.arrival-target'));
});

test("drawer jumps use canonical navigation and preserve the inspector",()=>{
  assert.ok(viewer.includes('b.onclick=()=>navigateSelectionTo(b.dataset.v)'));
  assert.ok(viewer.includes("state.drawer=true;$('#content').classList.add('drawer-open')"));
  assert.ok(viewer.includes('renderDrawer();updateSelection();applyCrossViewSelectionContextU17()'));
});

test("ordinary node selection clears stale cross-view projection context",()=>{
  assert.ok(viewer.includes('select=function(id){state.crossView=null;return selectU16(id)}'));
});
