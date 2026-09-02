import fs from 'node:fs';

const viewer='skills/repoaxis/viewer/viewer-1.js';
let src=fs.readFileSync(viewer,'utf8');
const before="fit=Math.min((vp.w-48)/contentW,(vp.h-48)/contentH),scale=Math.max(.72,Math.min(1,fit)),cx=(minX+maxX)/2";
const after="fit=Math.min((vp.w-48)/contentW,(vp.h-48)/contentH),scale=Math.min(1,fit),cx=(minX+maxX)/2";
if(!src.includes(before))throw new Error('Expected Structure fit clamp not found');
src=src.replace(before,after);
fs.writeFileSync(viewer,src);

const test='dev/tests/integration/viewer-responsive-geometry.test.mjs';
let t=fs.readFileSync(test,'utf8');
const oldAssertion="assert.ok(s1.includes('Math.max(.72,Math.min(1,fit))'));";
const newAssertions="assert.ok(s1.includes('scale=Math.min(1,fit)'));\n  assert.ok(!s1.includes('Math.max(.72,Math.min(1,fit))'));";
if(!t.includes(oldAssertion))throw new Error('Expected old Structure fit assertion not found');
t=t.replace(oldAssertion,newAssertions);
fs.writeFileSync(test,t);
