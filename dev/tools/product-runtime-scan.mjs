import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
const s=fs.readFileSync(p,'utf8');
const ids=[...new Set([...s.matchAll(/\b[A-Za-z_$][\w$]*(?:V|R)\d+[A-Za-z0-9_$]*\b/g)].map(m=>m[0]))].sort();
const decls=[];
for(const name of ['tree','importEdges','changes','workingChangesV42','lastCommitChangesV42']){
  const re=new RegExp(`(?:const|let|var)\\s+${name}\\s*=`, 'g');
  for(const m of s.matchAll(re)) decls.push({name,index:m.index});
}
const prototypeStrings=[...s.matchAll(/Prototype\s+v\d+|prototype\s+v\d+/g)].map(m=>({text:m[0],index:m.index}));
console.log(JSON.stringify({bytes:s.length,versionIdentifiers:ids,count:ids.length,declarations:decls,prototypeStrings},null,2));
