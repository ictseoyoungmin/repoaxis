import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
const s=fs.readFileSync(p,'utf8');
const ids=[...new Set([...s.matchAll(/\b[A-Za-z_$][\w$]*(?:V|R)\d+[A-Za-z0-9_$]*\b/g)].map(m=>m[0]))].sort();
const normalize=id=>id.replace(/(?:V|R)\d+/g,'').replace(/__+/g,'_');
const groups=new Map();for(const id of ids){const k=normalize(id);(groups.get(k)||groups.set(k,[]).get(k)).push(id)}
const collisions=[...groups.entries()].filter(([,v])=>v.length>1).map(([base,members])=>({base,members}));
const existing=new Set([...s.matchAll(/\b[A-Za-z_$][\w$]*\b/g)].map(m=>m[0]));
const directConflicts=[...groups.entries()].filter(([base,members])=>members.length===1&&existing.has(base)&&base!==members[0]).map(([base,members])=>({base,members}));
console.log(JSON.stringify({count:ids.length,collisions,directConflicts},null,2));
