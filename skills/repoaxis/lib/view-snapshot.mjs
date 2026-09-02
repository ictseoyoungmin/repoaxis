import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { startViewer } from "./view-server.mjs";

const CSS_ASSETS = ["viewer-base.css", "viewer-surfaces.css"];
const JS_ASSETS = ["viewer-0.js", "viewer-1.js", "viewer-2.js", "viewer-3.js", "viewer-4.js"];

function inlineScript(source) {
  return String(source).replace(/<\/script/gi, "<\\/script");
}

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
    const [shell, baseCss, surfaceCss, ...rest] = await Promise.all([
      fetchText(viewer.url, "/"),
      fetchText(viewer.url, "/viewer-base.css"),
      fetchText(viewer.url, "/viewer-surfaces.css"),
      ...JS_ASSETS.map((asset) => fetchText(viewer.url, `/${asset}`)),
      fetchJson(viewer.url, "/api/index"),
      fetchJson(viewer.url, "/api/meta"),
      fetchJson(viewer.url, "/api/history"),
    ]);
    const jsSources = rest.slice(0, JS_ASSETS.length);
    const indexResponse = rest[JS_ASSETS.length];
    const metaResponse = rest[JS_ASSETS.length + 1];
    const historyResponse = rest[JS_ASSETS.length + 2];
    const capturedAt = new Date().toISOString();
    const frozenMeta = {
      ...metaResponse,
      source_host_label: metaResponse.host_label,
      host_label: "Snapshot",
    };
    const payload = {
      format: "repoaxis-viewer-snapshot-v1",
      captured_at: capturedAt,
      responses: {
        "/api/index": { ...indexResponse, refreshed: false, reason: "snapshot" },
        "/api/meta": frozenMeta,
        "/api/history": historyResponse,
      },
    };

    let html = shell;
    html = html.replace(
      '<link rel="stylesheet" href="/viewer-base.css">',
      `<style data-repoaxis-asset="${CSS_ASSETS[0]}">\n${baseCss}\n</style>`,
    );
    html = html.replace(
      '<link rel="stylesheet" href="/viewer-surfaces.css">',
      `<style data-repoaxis-asset="${CSS_ASSETS[1]}">\n${surfaceCss}\n</style>`,
    );
    html = html.replace(
      '<script src="/viewer-0.js"></script>',
      `${snapshotBootstrap(payload)}\n<script data-repoaxis-asset="viewer-0.js">\n${inlineScript(jsSources[0])}\n</script>`,
    );
    for (let i = 1; i < JS_ASSETS.length; i += 1) {
      html = html.replace(
        `<script src="/${JS_ASSETS[i]}"></script>`,
        `<script data-repoaxis-asset="${JS_ASSETS[i]}">\n${inlineScript(jsSources[i])}\n</script>`,
      );
    }
    html = html.replace("<title>Repoaxis</title>", "<title>Repoaxis — Frozen Snapshot</title>");
    html = html.replace("<body>", `<body data-repoaxis-mode="snapshot" data-repoaxis-captured-at="${capturedAt}">`);

    if (/\b(?:src|href)="\/viewer-/.test(html)) throw new Error("snapshot still contains external viewer assets");
    const outputFile = path.resolve(output ?? path.join(viewer.root, "repoaxis-snapshot.html"));
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, html, "utf8");
    return {
      ok: true,
      output: outputFile,
      root: viewer.root,
      captured_at: capturedAt,
      repository: metaResponse.display_name,
      head_sha: indexResponse.index?.repository?.head_sha ?? null,
      bytes: Buffer.byteLength(html),
    };
  } finally {
    await new Promise((resolve) => viewer.server.close(resolve));
  }
}
