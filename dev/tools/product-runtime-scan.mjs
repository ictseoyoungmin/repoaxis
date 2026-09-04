import fs from 'node:fs';
const s=fs.readFileSync('skills/repoaxis/viewer/repoaxis.html','utf8');
for(const pos of [76000,104500,164800,169600,225800,238900,248000,262300])console.log(`\n--- ${pos} ---\n`+s.slice(pos,pos+1800));
