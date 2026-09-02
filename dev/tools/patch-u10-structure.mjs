import fs from 'node:fs';

function replaceOrFail(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Missing patch anchor: ${label}`);
  return source.replace(before, after);
}

const viewerPath='skills/repoaxis/viewer/viewer-1.js';
let viewer=fs.readFileSync(viewerPath,'utf8');
viewer=replaceOrFail(viewer,
`    return\`<g class="node \${state.selected===n.id?'selected':''}" data-id="\${esc(n.id)}"><title>\${esc(n.label)} · \${desc} descendant\${desc===1?'':'s'}</title><circle cx="\${x}" cy="\${y}" r="\${r.toFixed(1)}" fill="\${code?colorFor(code)[0]:'#fff'}" stroke="\${state.selected===n.id?'#625bff':(n.type==='root'||n.type==='folder'?'#817aff':'#cdd3df')}" stroke-width="\${state.selected===n.id?2:1.25}"/><circle cx="\${x}" cy="\${y}" r="\${Math.max(22,r+10)}" fill="transparent"/></g>\``,
`    const label=n.label.length>18?n.label.slice(0,17)+'…':n.label;
    return\`<g class="node macro-node \${state.selected===n.id?'selected':''}" data-id="\${esc(n.id)}" role="button" tabindex="0" aria-label="Inspect \${esc(n.label)}; \${desc} descendant\${desc===1?'':'s'}"><title>\${esc(n.label)} · \${desc} descendant\${desc===1?'':'s'} · select to inspect · double-click to explore</title><circle class="macro-dot" cx="\${x}" cy="\${y}" r="\${r.toFixed(1)}" fill="\${code?colorFor(code)[0]:'#fff'}" stroke="\${state.selected===n.id?'#625bff':(n.type==='root'||n.type==='folder'?'#817aff':'#cdd3df')}" stroke-width="\${state.selected===n.id?2:1.25}"/><circle class="macro-hit" cx="\${x}" cy="\${y}" r="\${Math.max(22,r+10)}"/><text class="macro-label" x="\${x+24}" y="\${y+4}">\${esc(label)}\${desc?\`<tspan class="macro-count" dx="6">\${desc}</tspan>\`:''}</text></g>\``,
'structure overview card');
viewer=replaceOrFail(viewer,
`function leaveStructureFocus(){
  state.structureFocus=false;state.structureRoot=ROOT;resetCamera();renderStructure()
}
function renderStructure(){`,
`function leaveStructureFocus(){
  state.structureFocus=false;state.structureRoot=ROOT;resetCamera();renderStructure()
}
function structureOverviewInspectState(id){
  if(!nodes[id])return false;state.selected=id;state.drawer=true;return true
}
function inspectStructureOverview(id){
  if(!structureOverviewInspectState(id))return;$('#content').classList.add('drawer-open');renderStructure();renderDrawer();updateSelection()
}
function renderStructure(){`,
'overview inspect helper');
viewer=replaceOrFail(viewer,
`  $('#structureMode').textContent=projection.mode==='focus'?\`\${root?.repoPath==='.'||root?.id===ROOT?'Repository':root?.repoPath||root?.label} · \${projection.visible.size}/\${projection.total} nodes\`:\`Repository topology · \${projection.visible.size} macro nodes\`;
  $('#wholeBtn').hidden=projection.mode!=='focus';$('#labelsBtn').hidden=projection.mode==='focus';
  renderBreadcrumbs();
  if(projection.mode==='overview'){
    svg.querySelectorAll('.node[data-id]').forEach(el=>el.onclick=()=>enterStructureFocus(el.dataset.id))
  }else bindNodes(svg);`,
`  $('#structureMode').textContent=projection.mode==='focus'?\`\${root?.repoPath==='.'||root?.id===ROOT?'Repository':root?.repoPath||root?.label} · \${projection.visible.size}/\${projection.total} nodes\`:\`Repository topology · \${projection.visible.size} macro nodes · select to inspect\`;
  $('#wholeBtn').hidden=projection.mode!=='focus';$('#labelsBtn').hidden=projection.mode==='focus';
  if(projection.mode==='overview'){const selected=nodes[state.selected];$('#labelsBtn').textContent=state.selected===ROOT?'Explore repository':'Explore selected';$('#labelsBtn').title=\`Open \${selected?.repoPath||selected?.label||'selected node'} as focused structure\`}
  renderBreadcrumbs();
  if(projection.mode==='overview'){
    svg.querySelectorAll('.node[data-id]').forEach(el=>{el.onclick=()=>inspectStructureOverview(el.dataset.id);el.ondblclick=()=>enterStructureFocus(el.dataset.id);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspectStructureOverview(el.dataset.id)}}})
  }else bindNodes(svg);`,
'overview direct interaction');
fs.writeFileSync(viewerPath,viewer);

const cssPath='skills/repoaxis/viewer/viewer-base.css';
let css=fs.readFileSync(cssPath,'utf8');
const anchor='.node text{fill:#353c4b;font-size:11px;font-weight:620;pointer-events:none}';
const extra=`.node text{fill:#353c4b;font-size:11px;font-weight:620;pointer-events:none}.structure-svg .macro-node .macro-hit{fill:transparent;stroke:transparent;stroke-width:1.2;vector-effect:non-scaling-stroke;transition:fill .14s,stroke .14s}.structure-svg .macro-node:hover .macro-hit,.structure-svg .macro-node.selected .macro-hit{fill:rgba(98,91,255,.065);stroke:#d8d5ff}.structure-svg .macro-node .macro-label{fill:#667085;font-size:10px;font-weight:650;opacity:.82;transition:fill .14s,opacity .14s}.structure-svg .macro-node:hover .macro-label,.structure-svg .macro-node.selected .macro-label{fill:#4f47d9;opacity:1}.structure-svg .macro-node .macro-count{fill:#98a2b3;font-size:8.5px;font-weight:600}.structure-svg .macro-node.selected .macro-dot{filter:drop-shadow(0 0 5px rgba(98,91,255,.18))}`;
css=replaceOrFail(css,anchor,extra,'macro direct-manipulation styles');
fs.writeFileSync(cssPath,css);
