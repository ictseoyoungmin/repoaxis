import fs from 'node:fs';

const viewerPath='skills/repoaxis/viewer/viewer-2.js';
let viewer=fs.readFileSync(viewerPath,'utf8');
for(const selector of ['[data-check]','[data-impact]','[data-graph]','[data-quick]']){
  const wrong=`$('${selector}').forEach`;
  const right=`$$('${selector}').forEach`;
  if(!viewer.includes(wrong))throw new Error(`Missing collapsed binder: ${selector}`);
  viewer=viewer.replace(wrong,right);
}
fs.writeFileSync(viewerPath,viewer);

const testPath='dev/tests/integration/viewer-changes-interaction.test.mjs';
let test=fs.readFileSync(testPath,'utf8');
test += `\ntest("Changes binds every repeated action with querySelectorAll",()=>{\n  assert.ok(viewer.includes("$$('[data-check]').forEach"));\n  assert.ok(viewer.includes("$$('[data-impact]').forEach"));\n  assert.ok(viewer.includes("$$('[data-graph]').forEach"));\n  assert.ok(viewer.includes("$$('[data-quick]').forEach"));\n});\n`;
fs.writeFileSync(testPath,test);
