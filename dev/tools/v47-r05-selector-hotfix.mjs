import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';let s=fs.readFileSync(p,'utf8');
const begin=s.indexOf('/* R05 canonical-root collapse + hydration-safe overview helper geometry. */'),end=s.indexOf('window.__REPOAXIS_LIVE__=liveV47;bootLiveV47();');if(begin<0||end<=begin)throw new Error('R05 block boundary missing');
const old="$('#overviewSvg .overview-node').forEach",next="document.querySelectorAll('#overviewSvg .overview-node').forEach";let block=s.slice(begin,end);const count=block.split(old).length-1;if(count!==3)throw new Error(`expected 3 R05 selector seams, got ${count}`);block=block.replaceAll(old,next);s=s.slice(0,begin)+block+s.slice(end);fs.writeFileSync(p,s);console.log('fixed exactly 3 R05 collection selector seams');
