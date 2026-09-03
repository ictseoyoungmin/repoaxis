import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { startViewer } from "./view-server.mjs";

function snapshotBootstrap(payload) {
  const serialized = JSON.stringify(payload).replace(/</g, "\\u003c");
  return `<script data-repoaxis-snapshot-bootstrap>\nwindow.__REPOAXIS_SNAPSHOT__=${serialized};\nwindow.fetch=async function(input){\n  const raw=typeof input==='string'?input:(input&&input.url)||'';\n  let pathname='';\n  try{pathname=new URL(raw,'http://repoaxis.snapshot').pathname}catch{}\n  const response=window.__REPOAXIS_SNAPSHOT__.responses[pathname];\n  if(!response)throw new Error('Frozen Repoaxis snapshot has no resource for '+(pathname||raw));\n  return new Response(JSON.stringify(response),{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});\n};\n</script>`;
}

async function fetchText(base, pathname) {
  const response = await fetch(new URL(pathname, base));
  if (!response.ok) throw new Error(`${pathname} returned HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(base, pathname) {
  const response = await fetch(new URL(pathname, base));
  const value = await response.json();
  if (!response.ok || value?.ok === false) throw new Error(value?.error || `${pathname} returned HTTP ${response.status}`);
  return value;
}

export async function writeViewerSnapshot({ root = process.cwd(), output = null } = {}) {
  const viewer = await startViewer({ root, port: 0, open: false });
  try {
    const [shell, indexResponse, metaResponse, historyResponse] = await Promise.all([
      fetchText(viewer.url, "/"), fetchJson(viewer.url, "/api/index"), fetchJson(viewer.url, "/api/meta"), fetchJson(viewer.url, "/api/history"),
    ]);
    const capturedAt = new Date().toISOString();
    const payload = { format: "repoaxis-viewer-snapshot-v1", captured_at: capturedAt, responses: {
      "/api/index": { ...indexResponse, refreshed: false, reason: "snapshot" },
      "/api/meta": { ...metaResponse, source_host_label: metaResponse.host_label, host_label: "Snapshot" },
      "/api/history": historyResponse,
    }};
    let outputHtml = shell.replace(/<title>[^<]*<\/title>/, "<title>Repoaxis — Frozen Snapshot</title>");
    outputHtml = outputHtml.replace("</head>", `${snapshotBootstrap(payload)}\n</head>`);
    outputHtml = outputHtml.replace("<body>", `<body data-repoaxis-mode="snapshot" data-repoaxis-captured-at="${capturedAt}">`);
    if (/\b(?:src|href)="\/viewer-/.test(outputHtml)) throw new Error("snapshot contains external viewer assets");
    const outputFile = path.resolve(output ?? path.join(viewer.root, "repoaxis-snapshot.html"));
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, outputHtml, "utf8");
    return { ok: true, output: outputFile, root: viewer.root, captured_at: capturedAt, repository: metaResponse.display_name, head_sha: indexResponse.index?.repository?.head_sha ?? null, bytes: Buffer.byteLength(outputHtml) };
  } finally { await new Promise((resolve) => viewer.server.close(resolve)); }
}
