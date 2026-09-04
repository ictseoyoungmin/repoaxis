import fs from 'node:fs';
const s=fs.readFileSync('skills/repoaxis/viewer/repoaxis.html','utf8');
for(const needle of ['function renderOverview','function enterStructureFocus','function leaveStructureFocus','function navigateSelectedTo','function switchViewUI','structureFocusScope','focused','mode-strip','Focus']){
  const i=s.indexOf(needle);
  console.log(`\n=== ${needle} @ ${i} ===`);
  if(i>=0) console.log(s.slice(Math.max(0,i-1200),i+3600));
}
