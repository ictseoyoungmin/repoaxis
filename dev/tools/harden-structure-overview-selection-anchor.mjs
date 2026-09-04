import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
let s=fs.readFileSync(p,'utf8');
const old="function renderOverviewSelectionCard(){\n  const graph=$('#overviewGraph'),n=byId[state.selected],p=overviewPositions?.[state.selected];";
const next="function overviewSelectionAnchor(id){\n  let n=byId[id];\n  while(n&&!overviewPositions?.[n.id])n=n.parent?byId[n.parent]:null;\n  return n?.id||'root';\n}\nfunction renderOverviewSelectionCard(){\n  const graph=$('#overviewGraph'),n=byId[state.selected],anchorId=overviewSelectionAnchor(state.selected),p=overviewPositions?.[anchorId];";
if(!s.includes(old)) throw new Error('overview selection card seam not found');
s=s.replace(old,next);
fs.writeFileSync(p,s);
