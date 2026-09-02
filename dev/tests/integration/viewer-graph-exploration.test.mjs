import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const VIEWER=fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-3.js",import.meta.url));
const source=fs.readFileSync(VIEWER,"utf8"),start=source.indexOf("function graphScopeKey"),end=source.indexOf("function renderGraphNotice"),slice=source.slice(start,end);
function makeContext(){const nodes={"file:src/a.js":{id:"file:src/a.js",repoPath:"src/a.js",label:"a.js"},"file:src/b.js":{id:"file:src/b.js",repoPath:"src/b.js",label:"b.js"},"file:test/c.js":{id:"file:test/c.js",repoPath:"test/c.js",label:"c.js"},"file:other/d.js":{id:"file:other/d.js",repoPath:"other/d.js",label:"d.js"}},edges=[["file:src/b.js","file:src/a.js"],["file:src/a.js","file:test/c.js"],["file:other/d.js","file:src/a.js"]],context=vm.createContext({nodes,edges,$:()=>null,CSS:{escape:String}});vm.runInContext(slice,context);return context}
test("hover context derives visible incoming and outgoing neighbors",()=>{const c=makeContext(),x=c.graphExploreContext("file:src/a.js",new Set(["file:src/a.js","file:src/b.js","file:test/c.js"]));assert.deepEqual([...x.inbound],["file:src/b.js"]);assert.deepEqual([...x.outbound],["file:test/c.js"]);assert.deepEqual([...x.neighbors].sort(),["file:src/a.js","file:src/b.js","file:test/c.js"].sort())});
test("hover context keeps only participating visible scopes",()=>{const c=makeContext(),x=c.graphExploreContext("file:src/a.js",new Set(["file:src/a.js","file:src/b.js","file:test/c.js"]));assert.deepEqual([...x.scopes].sort(),["src","test"])});
test("graph rendering exposes directional edge and scope metadata",()=>{assert.match(source,/data-from=/);assert.match(source,/data-to=/);assert.match(source,/class=\"graph-scope\" data-scope=/);assert.match(source,/bindGraphExploration\(projection,visible\)/)});
