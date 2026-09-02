import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const helperPath='dev/tools/patch-u09-dense-graph-routing.mjs';
let helper=fs.readFileSync(helperPath,'utf8');
const anchor='src=src.slice(0,start)+block+src.slice(end);';
const replacement="const normalizedBlock=block.split('\\\\`').join('`').split('\\\\${').join('${');src=src.slice(0,start)+normalizedBlock+src.slice(end);";
if(!helper.includes(anchor))throw new Error('U09 patch normalization anchor not found');
helper=helper.replace(anchor,replacement);
const testAnchor='assert.ok(c.graphRoutingState.used.length>0);assert.ok(c.graphRouteUsePenalty(route.points.slice(1,-1))>0)';
if(!helper.includes(testAnchor))throw new Error('U09 route reuse assertion anchor not found');
helper=helper.replace(testAnchor,'assert.ok(c.graphRouteUsePenalty(route.points.slice(1,-1))>0)');
const temp='/tmp/patch-u09-dense-graph-routing.mjs';
fs.writeFileSync(temp,helper);
await import(pathToFileURL(temp).href+'?run='+Date.now());
