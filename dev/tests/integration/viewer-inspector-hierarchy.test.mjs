import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const VIEWER = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-4.js", import.meta.url));
const source = fs.readFileSync(VIEWER, "utf8");

test("Overview prioritizes current state and indexed facts before provenance and notes", () => {
  assert.match(source, /if\(state\.tab==='overview'\)body=current\+facts\+lastCommit\+note/);
  for (const label of ["Current state", "Indexed facts", "Last file commit", "Agent note"]) {
    assert.ok(source.includes(label));
  }
});

test("redundant identity details move out of Overview but remain available in Metrics", () => {
  assert.match(source, /identity=`<div class="section"><div class="section-title">Canonical identity<\/div>/);
  assert.match(source, /if\(state\.tab==='metrics'\)body=identity\+facts/);
  assert.doesNotMatch(source, /if\(state\.tab==='overview'\)body=identity/);
});

test("symbol Overview exposes containing-file context and precise source range", () => {
  assert.match(source, /Source range/);
  assert.match(source, /File context/);
  assert.match(source, /L\$\{n\.source\.start_line\}–L\$\{n\.source\.end_line\}/);
});
