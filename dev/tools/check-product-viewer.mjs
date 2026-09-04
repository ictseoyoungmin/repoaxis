import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('skills/repoaxis/viewer/repoaxis.html','utf8');let i=0;
for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)){
  i+=1;const src=m[1];
  try{new vm.Script(src,{filename:`repoaxis-inline-${i}.js`})}
  catch(error){console.error(error.stack);const hit=String(error.stack).match(/repoaxis-inline-\d+\.js:(\d+)/),line=Number(hit?.[1]||0),lines=src.split('\n');if(line)console.error(lines.slice(Math.max(0,line-4),line+3).map((x,j)=>`${Math.max(1,line-3)+j}: ${x}`).join('\n'));process.exit(1)}
}
console.log(`viewer scripts: ${i} syntax ok`);
