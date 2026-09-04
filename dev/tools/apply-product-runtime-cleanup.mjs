import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';let s=fs.readFileSync(p,'utf8');
const must=(old,next,label)=>{if(!s.includes(old))throw new Error('missing seam: '+label);s=s.replace(old,next)};

// Product shell: no prototype/version identity and no repository-specific content before live data is ready.
must('<html lang="en">','<html lang="en" data-repoaxis-live="loading">','html loading state');
must('<title>Repoaxis — Repository Intelligence Prototype v47</title>','<title>Repoaxis — Repository Intelligence</title>','product title');
must('*{box-sizing:border-box}html,body{height:100%;margin:0;background:var(--bg);color:var(--ink);overflow:hidden}',`*{box-sizing:border-box}html,body{height:100%;margin:0;background:var(--bg);color:var(--ink);overflow:hidden}\nhtml[data-repoaxis-live="loading"] .view-stage,html[data-repoaxis-live="loading"] .repo-pill,html[data-repoaxis-live="loading"] .branch,html[data-repoaxis-live="loading"] .commit{visibility:hidden}`,'loading shell visibility');

// Remove repository fixture data. The synthetic root is presentation infrastructure, not repository content.
const fixture=/const tree=\[[\s\S]*?\];\nconst importEdges=\[[\s\S]*?\];\nconst changes=\[[\s\S]*?\];/;
if(!fixture.test(s))throw new Error('fixture data block not found');
s=s.replace(fixture,`const tree=[{id:'root',parent:null,type:'root',label:'root/',path:'/',language:'—',lines:0,complexity:0,note:'Repository root.'}];\nconst importEdges=[];\nconst changes=[];`);
must("depRoot:'config',depRootHome:'config'","depRoot:'root',depRootHome:'root'",'neutral dependency root');

// Static sample graph/history state must also start empty.
const clusters=/(?:const|let) graphClustersV15=\[[\s\S]*?\];let graphPosV11=\{\};/;
if(!clusters.test(s))throw new Error('sample graph clusters not found');s=s.replace(clusters,'let graphClustersV15=[];let graphPosV11={};');
const history=/const lastCommitChangesV42=\[[\s\S]*?\];\nconst gitStatusPriorityV42=/;
if(!history.test(s))throw new Error('sample last-commit changes not found');s=s.replace(history,'const lastCommitChangesV42=[];\nconst gitStatusPriorityV42=');
const ghostStart=s.indexOf('function appendHistoricalStructureGhostV42(){'),ghostEnd=s.indexOf('\n\ndepSvgCard=function',ghostStart);if(ghostStart<0||ghostEnd<0)throw new Error('historical sample ghost seam not found');s=s.slice(0,ghostStart)+'function appendHistoricalStructureGhostV42(){}'+s.slice(ghostEnd);

// Remove prototype-ID fallbacks. Runtime fallback is always derived from the live file set.
s=s.replaceAll('||byId.config','||files()[0]||null');
s=s.replaceAll("if(!sel||sel.type!=='file')sel=byId.config;","if(!sel||sel.type!=='file')sel=files()[0]||null;if(!sel){$('#graphSvg').innerHTML='';return}");
s=s.replaceAll("if(!containingFile(byId[state.selected]))state.selected='config';","if(!containingFile(byId[state.selected]))state.selected=files()[0]?.id||'root';");
s=s.replace("h==='graph'?'config':'root'","h==='graph'?(files()[0]?.id||'root'):'root'");
s=s.replace('if(initial&&!byId.config)byId.config=initial;','');
if(s.includes('byId.config'))throw new Error('prototype config alias remains');

// Initial product state is neutral. Counts are populated from live projections.
s=s.replace("const viewMeta={structure:['Structure','128','Containment topology','structure'],dependencies:['Dependencies','15','1 root · bounded dependency tree','dependencies'],changes:['Changes','7','','changes'],graph:['Graph','14','Canonical file import edges','graph']};","const viewMeta={structure:['Structure','0','Containment topology','structure'],dependencies:['Dependencies','0','bounded dependency tree','dependencies'],changes:['Changes','0','','changes'],graph:['Graph','0','Canonical file import edges','graph']};");
s=s.replace("badge.innerHTML='<span class=\"card-stat staged\"><b>4</b> Last commit changes</span>';","badge.innerHTML=`<span class=\"card-stat staged\"><b>${lastCommitChangesV42.length}</b> Last commit changes</span>`;");

// No repository render before live hydration. Side-effect renderers are guarded as well.
must("const state={view:'structure'","let repositoryReady=false;\nconst state={view:'structure'",'repository readiness state');
must('renderOverview();renderFocus();renderDependencies();renderChanges();renderGraph();renderDrawer();applyHash();','', 'prototype initial render sequence');
s=s.replace('resizeRAF=requestAnimationFrame(()=>{const r=',"resizeRAF=requestAnimationFrame(()=>{if(!repositoryReady)return;const r=");
s=s.replace('requestAnimationFrame(()=>{updateGitOverlayControlV42();',"requestAnimationFrame(()=>{if(!repositoryReady)return;updateGitOverlayControlV42();");
must('<!-- V47-R01 LIVE DATA WIRING -->','<!-- LIVE REPOSITORY DATA -->','live data marker');

// Boot becomes the first repository render. URL hash remains the product routing authority.
const bootTail="state.selectionProjection=null;installLivePatchesV47();patchLiveIdentityV47();state.view='structure';state.mode='overview';state.drawer=false;$('#structureStage')?.classList.remove('focused');$('#content')?.classList.remove('drawer-open');switchViewUI();renderOverview();renderDrawer();updateGlobalSelectionV10();liveV47.ready=true;document.documentElement.dataset.repoaxisLive='ready';";
const bootNext="state.selectionProjection=null;installLivePatchesV47();patchLiveIdentityV47();state.view='structure';state.mode='overview';state.drawer=false;$('#structureStage')?.classList.remove('focused');$('#content')?.classList.remove('drawer-open');repositoryReady=true;applyHash();updateGlobalSelectionV10();liveV47.ready=true;document.documentElement.dataset.repoaxisLive='ready';";
must(bootTail,bootNext,'live-first boot render');

// Semantic names for identifiers whose numeric suffix removal would collide.
const special={
GRAPH_WORLD_MIN_V27:'GRAPH_WORLD_MIN_BASE',GRAPH_WORLD_MIN_V28:'GRAPH_WORLD_MIN',applyCameraV29Base:'applyCameraBeforeProximity',applyCameraV37Base:'applyCameraBeforeAssistZones',buildGraphBusPlanV26:'buildGraphBusPlanCore',buildGraphBusPlanV27:'buildGraphBusPlan',gitBadgeHtmlV42:'gitBadgeHtmlBase',gitBadgeHtmlV43:'gitBadgeHtml',gitBadgeSvgV42:'gitBadgeSvgBase',gitBadgeSvgV43:'gitBadgeSvg',graphLayoutTemplateV27:'graphLayoutTemplateBase',graphLayoutTemplateV28:'graphLayoutTemplate',graphLayoutV11:'graphLayoutBase',graphLayoutV27:'graphLayoutExpanded',graphLayoutV28:'graphLayout',graphLayoutV22Base:'graphLayoutBeforeLayering',graphLayoutV23Base:'graphLayoutBeforePortPlanning',graphLayoutV241Base:'graphLayoutBeforePortAllocation',graphLayoutV25Base:'graphLayoutBeforeObstacleRouting',graphLayoutV26Base:'graphLayoutBeforeBusRouting',graphPreferredSidesV23:'graphPreferredSidesBasic',graphPreferredSidesV25:'graphPreferredSides',graphRoutedConnectorV16:'graphRoutedConnectorBasic',graphRoutedConnectorV22:'graphRoutedConnectorLayered',graphRoutedConnectorV23:'graphRoutedConnectorWithPorts',graphRoutedConnectorV24:'graphRoutedConnectorMonotone',graphRoutedConnectorV242Base:'graphRoutedConnectorBeforeObstacleRouting',graphRoutedConnectorV25:'graphRoutedConnectorObstacleAware',graphRoutedConnectorV26:'graphRoutedConnector',graphSidePortV22:'graphSidePortBasic',graphSidePortV23:'graphSidePortPlanned',graphSidePortV24:'graphSidePort',openChangeSetGraphR04Base:'openChangeSetGraphBeforeFraming',openChangeSetGraphV21Base:'openChangeSetGraphBeforeTrace',renderFocusR02Base:'renderFocusBeforeBoundedCount',renderFocusV29Base:'renderFocusBeforeProximity',renderFocusV42Base:'renderFocusBeforeGitOverlay',renderGraphV19Base:'renderGraphBeforeAnalysisChrome',renderGraphV21Base:'renderGraphBeforeImpactTrace',renderGraphV22Base:'renderGraphBeforeLayering',renderGraphV26Base:'renderGraphBeforeBusRouting',renderGraphV27Base:'renderGraphBeforeWorldSizing',renderGraphV28Base:'renderGraphBeforeCollisionLayout',renderGraphV29Base:'renderGraphBeforeProximity',renderGraphV42Base:'renderGraphBeforeGitOverlay',renderOverviewR05Base:'renderOverviewBeforeHydrationGuard',renderOverviewV29Base:'renderOverviewBeforeProximity',renderOverviewV33Base:'renderOverviewBeforeHitZones',renderOverviewV37Base:'renderOverviewBeforeAssistZones',renderOverviewV42Base:'renderOverviewBeforeGitOverlay',routeScoreV24:'routeScoreBasic',routeScoreV25:'routeScore',switchViewUIV19Base:'switchViewUIBeforeAnalysisChrome',switchViewUIV29Base:'switchViewUIBeforeProximity',switchViewUIV42Base:'switchViewUIBeforeGitOverlay',dependencyBackRootV9:'dependencyBackRootFromHistory',dependencyHomeRootV9:'dependencyHomeRootInitial',enterStructureFocusV9:'enterStructureFocusBase',focusPosV11:'structureFocusPositions',graphNeighborhoodV11:'graphNeighborhoodSelection',graphPosV11:'graphPositions',graphWorldV27:'graphWorldGeometry',leaveStructureFocusV9:'leaveStructureFocusBase',liveV47:'repositoryRuntime',overviewPosV11:'overviewPositions',proximityV29:'proximityState',renderDependenciesV9:'renderDependenciesBase',renderDrawerV9:'renderDrawerBase',renderGraphV17:'renderGraphBase',selectNodeV9:'selectNodeBase',setDependencyRootV9:'setDependencyRootBase',switchViewUIV9:'switchViewUIBase',viewportV11:'stageViewport'
};
const versionIds=[...new Set([...s.matchAll(/\b[A-Za-z_$][\w$]*(?:V|R)\d+[A-Za-z0-9_$]*\b/g)].map(m=>m[0]))];
const occupied=new Set([...s.matchAll(/\b[A-Za-z_$][\w$]*\b/g)].map(m=>m[0]));const map=new Map();
for(const id of versionIds){let next=special[id];if(!next){next=id.replace(/(?:V|R)\d+/g,'').replace(/_+$/,'');if(!next)throw new Error('empty semantic name for '+id);if(occupied.has(next)&&next!==id)throw new Error(`unmapped naming collision ${id} -> ${next}`)}map.set(id,next)}
for(const [old,next] of [...map.entries()].sort((a,b)=>b[0].length-a[0].length))s=s.replace(new RegExp(`\\b${old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'g'),next);

// Product comments must describe behavior, not internal iteration numbers.
s=s.replace(/\b[vVrR]\d+(?:\.\d+)*\b\s*(?:[—–:-]\s*)?/g,'');
s=s.replace(/\/\*\s+(?:—\s*)?/g,'/* ');
s=s.replace(/\n{3,}/g,'\n\n');

// Semantic live names after the global cleanup.
s=s.replaceAll('bootLive','bootRepository').replaceAll('installLivePatches','installRepositoryPatches').replaceAll('patchLiveIdentity','patchRepositoryIdentity').replaceAll('patchLiveCommit','patchRepositoryCommit').replaceAll('patchLiveCount','patchRepositoryCount').replaceAll('rebuildLiveGraphInputs','rebuildRepositoryGraphInputs').replaceAll('chooseLiveRootFile','chooseRepositoryRootFile').replaceAll('liveTree','repositoryTree').replaceAll('liveImports','repositoryImports').replaceAll('liveChange','repositoryChange').replaceAll('liveHistoryChange','repositoryHistoryChange').replaceAll('liveLanguage','repositoryLanguage').replaceAll('liveGitCode','repositoryGitCode').replaceAll('liveStage','repositoryChangeStage').replaceAll('liveLabel','repositoryLabel').replaceAll('liveFileByPath','repositoryFileByPath').replaceAll('liveTopGroup','repositoryTopGroup').replaceAll('liveGraphScope','repositoryGraphScope');

// Guard against the two prohibited classes before writing.
const internal=/\b(?:[A-Za-z_$][\w$]*(?:V|R)\d+[A-Za-z0-9_$]*|[vVrR]\d+(?:\.\d+)*)\b/;if(internal.test(s))throw new Error('internal version token remains: '+s.match(internal)[0]);
for(const bad of ['byId.config','src/index.js','src/cli.js','src/worker.js','config/default.json','deprecated-loader.js','Repository Intelligence Prototype'])if(s.includes(bad))throw new Error('fixture/prototype residue remains: '+bad);
if(!s.includes('repositoryReady=true;applyHash()'))throw new Error('live-first render contract missing');
fs.writeFileSync(p,s);console.log(JSON.stringify({bytes:s.length,renamedIdentifiers:map.size,fixtureFree:true,versionTokens:false}));
