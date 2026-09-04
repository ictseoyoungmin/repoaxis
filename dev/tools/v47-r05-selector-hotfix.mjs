import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';let s=fs.readFileSync(p,'utf8');
const old="$('#overviewSvg .overview-node').forEach";const count=s.split(old).length-1;if(count!==3)throw new Error(`expected 3 R05 selector seams, got ${count}`);
s=s.replaceAll(old,"document.querySelectorAll('#overviewSvg .overview-node').forEach");fs.writeFileSync(p,s);console.log('fixed 3 R05 collection selector seams');
