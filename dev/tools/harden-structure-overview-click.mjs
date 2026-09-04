import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
let s=fs.readFileSync(p,'utf8');
const anchor="$('#focusBtn').onclick=()=>enterStructureFocus(state.selected||'root');";
if(!s.includes(anchor)) throw new Error('whole-map interaction seam not found');
const code=String.raw`
function installStructureOverviewClickAuthority(){
  const svg=$('#overviewSvg');
  if(!svg||svg.dataset.wholeMapClickAuthority==='true')return;
  svg.dataset.wholeMapClickAuthority='true';
  svg.addEventListener('click',e=>{
    const node=e.target.closest?.('.overview-node');
    if(!node||!svg.contains(node))return;
    const id=node.dataset.id;
    if(!id||!byId[id])return;
    e.preventDefault();
    e.stopImmediatePropagation();
    selectStructureOverview(id,{drawer:true,zoom:true});
  },true);
}
const renderOverviewWithClickAuthority=renderOverview;
renderOverview=function(){const r=renderOverviewWithClickAuthority();installStructureOverviewClickAuthority();return r};
installStructureOverviewClickAuthority();
`;
s=s.replace(anchor,code+'\n'+anchor);
fs.writeFileSync(p,s);
