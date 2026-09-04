import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
let s=fs.readFileSync(p,'utf8');
const anchor="  svg.addEventListener('click',e=>{";
if(!s.includes(anchor)) throw new Error('overview click authority seam not found');
const code=`  const stopLegacyOverviewPick=e=>{\n    const node=e.target.closest?.('.overview-node');\n    if(!node||!svg.contains(node))return;\n    e.stopImmediatePropagation();\n  };\n  for(const type of ['pointerdown','mousedown','pointerup','mouseup','dblclick'])svg.addEventListener(type,stopLegacyOverviewPick,true);\n`;
s=s.replace(anchor,code+anchor);
fs.writeFileSync(p,s);
