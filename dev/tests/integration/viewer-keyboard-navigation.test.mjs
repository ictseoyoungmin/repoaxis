import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const VIEWER = fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-4.js", import.meta.url));
const source = fs.readFileSync(VIEWER, "utf8");

test("repository search is keyboard-complete", () => {
  assert.match(source, /e\.key==='ArrowDown'/);
  assert.match(source, /e\.key==='ArrowUp'/);
  assert.match(source, /e\.key==='Enter'/);
  assert.match(source, /moveSearchCursor\(1\)/);
  assert.match(source, /moveSearchCursor\(-1\)/);
  assert.match(source, /activateSearchResult\(active\.dataset\.id\)/);
});

test("search result activation lands on Structure with Inspector visible", () => {
  const start = source.indexOf("function activateSearchResult(id)");
  const end = source.indexOf("function search(q)", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const body = source.slice(start, end);
  assert.match(body, /state\.structureFocus=true/);
  assert.match(body, /state\.drawer=true/);
  assert.match(body, /classList\.add\('drawer-open'\)/);
  assert.match(body, /switchView\('structure',id\)/);
});

test("search results expose one keyboard cursor and accessibility selection state", () => {
  assert.match(source, /role="option" aria-selected="false"/);
  assert.match(source, /setSearchCursor\(0\)/);
  assert.match(source, /row\.setAttribute\('aria-selected',active\?'true':'false'\)/);
});

test("Escape unwinds transient UI before closing the Inspector", () => {
  const start = source.indexOf("function handleEscape()");
  const end = source.indexOf("function toast", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const body = source.slice(start, end);
  assert.ok(body.indexOf("searchOverlay") < body.indexOf("filterPop"));
  assert.ok(body.indexOf("filterPop") < body.indexOf("rootMenu"));
  assert.ok(body.indexOf("rootMenu") < body.indexOf("state.drawer"));
  assert.match(body, /closeDrawer\(\)/);
});
