import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';const s=fs.readFileSync(p,'utf8');
const needles=['byId.config',"'config'",'"config"',"'cli'",'"cli"',"'worker'",'"worker"','src/index.js','src/cli.js','src/worker.js','config/default.json','deprecated-loader.js','acme/infra'];
const report={};for(const needle of needles){const hits=[];let i=0;while((i=s.indexOf(needle,i))>=0){hits.push(s.slice(Math.max(0,i-180),Math.min(s.length,i+needle.length+240)));i+=needle.length}report[needle]={count:hits.length,hits:hits.slice(0,12)}}
console.log(JSON.stringify(report,null,2));
