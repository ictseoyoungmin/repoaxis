import fs from 'node:fs';
const p='dev/tools/apply-product-runtime-cleanup.mjs';let s=fs.readFileSync(p,'utf8');
const oldComments="s=s.replace(/\\b[vVrR]\\d+(?:\\.\\d+)*\\b\\s*(?:[—–:-]\\s*)?/g,'');\ns=s.replace(/\\/\\*\\s+(?:—\\s*)?/g,'/* ');";
const nextComments="s=s.replace(/\\/\\*\\s*[vVrR]\\d+(?:\\.\\d+)*\\s*(?:[—–:-]\\s*)?/g,'/* ');\ns=s.replace(/\\/\\/\\s*[vVrR]\\d+(?:\\.\\d+)*\\s*(?:[—–:-]\\s*)?/g,'// ');\ns=s.replace(/<!--\\s*[vVrR]\\d+(?:\\.\\d+)*\\s*(?:[—–:-]\\s*)?/g,'<!-- ');\ns=s.replace(/\\/\\*\\s+(?:—\\s*)?/g,'/* ');";
if(!s.includes(oldComments))throw new Error('comment cleanup seam missing');s=s.replace(oldComments,nextComments);
const oldGuard="const internal=/\\b(?:[A-Za-z_$][\\w$]*(?:V|R)\\d+[A-Za-z0-9_$]*|[vVrR]\\d+(?:\\.\\d+)*)\\b/;if(internal.test(s))throw new Error('internal version token remains: '+s.match(internal)[0]);";
const nextGuard="const internal=/\\b[A-Za-z_$][\\w$]*(?:V|R)\\d+[A-Za-z0-9_$]*\\b/;const taggedComment=/(?:\\/\\*|\\/\\/|<!--)\\s*[vVrR]\\d+(?:\\.\\d+)*\\b/;if(internal.test(s))throw new Error('internal version identifier remains: '+s.match(internal)[0]);if(taggedComment.test(s))throw new Error('internal iteration comment remains: '+s.match(taggedComment)[0]);";
if(!s.includes(oldGuard))throw new Error('guard seam missing');s=s.replace(oldGuard,nextGuard);fs.writeFileSync(p,s);console.log('scoped cleanup policy');
