import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const VIEWER2=fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-2.js",import.meta.url));
const CSS=fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-surfaces.css",import.meta.url));
const viewer=fs.readFileSync(VIEWER2,"utf8"),css=fs.readFileSync(CSS,"utf8");

test("Changes row checkbox matches the canonical prototype component",()=>{
  assert.ok(viewer.includes('const CHANGE_CHECK_SVG='));
  assert.match(viewer,/class="change-select \$\{picked\?'checked':''\}"/);
  assert.match(css,/\.change-select\{appearance:none;width:22px;height:22px;border:1\.5px solid #d3d9e5;border-radius:7px/);
  assert.match(css,/\.change-select:hover\{border-color:#a9a4ff;box-shadow:0 0 0 3px rgba\(98,91,255,\.08\)\}/);
  assert.match(css,/\.change-select:active\{transform:scale\(\.94\)\}/);
  assert.match(css,/\.change-select svg\{width:13px;height:13px;opacity:0/);
  assert.match(css,/\.change-select\.checked\{background:#625bff;border-color:#625bff;box-shadow:0 2px 6px rgba\(98,91,255,\.18\)\}/);
});

test("Changes master checkbox uses prototype checked and indeterminate SVG states",()=>{
  assert.ok(viewer.includes('CHANGE_DASH_SVG'));
  assert.ok(viewer.includes("allPicked?'checked':somePicked?'indeterminate':''"));
  assert.ok(viewer.includes('somePicked?CHANGE_DASH_SVG:CHANGE_CHECK_SVG'));
  assert.match(css,/\.change-select\.indeterminate\{background:#f0efff;border-color:#8c86ff;color:#625bff\}/);
  assert.match(css,/\.change-select\.header\{width:20px;height:20px;border-radius:6px\}/);
});

test("legacy text-checkmark checkbox chrome is removed",()=>{
  assert.doesNotMatch(css,/\.check\.on:after/);
  assert.doesNotMatch(css,/content:"✓"/);
});
