import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readOperationalIndex } from "./fresh-index.mjs";
import { resolveGitRoot } from "./git.mjs";

const VIEWER_HTML = fileURLToPath(new URL("../viewer/repoaxis.html", import.meta.url));
const LOOPBACK_HOST = "127.0.0.1";

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
    "x-content-type-options": "nosniff",
  });
  res.end(body);
}

function text(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
    "x-content-type-options": "nosniff",
  });
  res.end(body);
}

function openBrowser(url) {
  const command = process.platform === "darwin"
    ? ["open", [url]]
    : process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : ["xdg-open", [url]];
  try {
    const child = spawn(command[0], command[1], { detached: true, stdio: "ignore" });
    child.unref();
    child.on("error", () => {});
  } catch {}
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("viewer port must be an integer from 0 to 65535");
  return port;
}

export async function startViewer({ root = process.cwd(), port = 4173, open = true } = {}) {
  const gitRoot = resolveGitRoot(root);
  const viewerHtml = fs.readFileSync(VIEWER_HTML, "utf8");
  const requestedPort = parsePort(port);

  const server = http.createServer((req, res) => {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", `http://${LOOPBACK_HOST}`);
    if (method !== "GET") return json(res, 405, { ok: false, error: "method-not-allowed" });

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return text(res, 200, viewerHtml, "text/html; charset=utf-8");
    }
    if (url.pathname === "/api/health") {
      return json(res, 200, { ok: true, repository: ".", host: LOOPBACK_HOST });
    }
    if (url.pathname === "/api/index") {
      try {
        const state = readOperationalIndex({ cwd: gitRoot });
        return json(res, 200, {
          ok: true,
          refreshed: state.refreshed,
          reason: state.reason,
          index: state.index,
        });
      } catch (error) {
        return json(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    }
    return json(res, 404, { ok: false, error: "not-found" });
  });

  await new Promise((resolve, reject) => {
    const onError = (error) => { server.off("listening", onListening); reject(error); };
    const onListening = () => { server.off("error", onError); resolve(); };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(requestedPort, LOOPBACK_HOST);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("could not resolve viewer address");
  }
  const url = `http://${LOOPBACK_HOST}:${address.port}/`;
  if (open) openBrowser(url);
  return { server, url, host: LOOPBACK_HOST, port: address.port, root: path.resolve(gitRoot) };
}
