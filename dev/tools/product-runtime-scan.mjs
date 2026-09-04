import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
const s=fs.readFileSync(p,'utf8');
const ids=[...new Set([...s.matchAll(/\b[A-Za-z_$][\w$]*(?:V|R)\d+[A-Za-z0-9_$]*\b/g)].map(m=>m[0]))].sort();
const snippets={};
for(const name of ['tree','importEdges','changes','workingChangesV42','lastCommitChangesV42']){
  const re=new RegExp(`(?:const|let|var)\\s+${name}\\s*=`, 'g');
  const m=re.exec(s); if(m) snippets[name]=s.slice(Math.max(0,m.index-300),Math.min(s.length,m.index+1800));
}
const bootNeedles=['renderOverview();','renderDependencies();','renderChanges();','renderGraph();','renderDrawer();','switchViewUI();','bootLiveV47();'];
const bootHits=bootNeedles.map(needle=>({needle,indexes:[...s.matchAll(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))].map(m=>m.index)}));
console.log(JSON.stringify({bytes:s.length,count:ids.length,versionIdentifiers:ids,snippets,bootHits,tail:s.slice(-9000)},null,2));
