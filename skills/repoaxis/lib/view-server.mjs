import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readOperationalIndex } from "./fresh-index.mjs";
import { resolveGitRoot } from "./git.mjs";

const VIEWER_DIR = fileURLToPath(new URL("../viewer/", import.meta.url));
const VIEWER_HTML = path.join(VIEWER_DIR, "repoaxis.html");
const VIEWER_ASSETS = new Map([
  ["/viewer-base.css", ["viewer-base.css", "text/css; charset=utf-8"]],
  ["/viewer-surfaces.css", ["viewer-surfaces.css", "text/css; charset=utf-8"]],
  ["/viewer-0.js", ["viewer-0.js", "text/javascript; charset=utf-8"]],
  ["/viewer-1.js", ["viewer-1.js", "text/javascript; charset=utf-8"]],
  ["/viewer-2.js", ["viewer-2.js", "text/javascript; charset=utf-8"]],
  ["/viewer-3.js", ["viewer-3.js", "text/javascript; charset=utf-8"]],
  ["/viewer-4.js", ["viewer-4.js", "text/javascript; charset=utf-8"]],
]);
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

function git(root, args, { allowFailure = false, trim = true } = {}) {
  try {
    const output = execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return trim ? output.trim() : output;
  } catch (error) {
    if (allowFailure) return null;
    const detail = error?.stderr?.toString?.().trim();
    throw new Error(detail || `git ${args.join(" ")} failed`);
  }
}

function remoteDescriptor(root) {
  const raw = git(root, ["config", "--get", "remote.origin.url"], { allowFailure: true });
  if (!raw) return { display_name: path.basename(root), host_label: "Local Git", web_url: null };

  let host = null;
  let repoPath = null;
  const scp = raw.match(/^(?:[^@]+@)?([^:]+):(.+)$/);
  if (scp && !raw.includes("://")) {
    host = scp[1];
    repoPath = scp[2];
  } else {
    try {
      const url = new URL(raw);
      host = url.hostname;
      repoPath = url.pathname.replace(/^\/+/, "");
    } catch {}
  }
  if (!host || !repoPath) return { display_name: path.basename(root), host_label: "Git remote", web_url: null };

  repoPath = repoPath.replace(/\.git$/, "").replace(/^\/+|\/+$/g, "");
  const parts = repoPath.split("/").filter(Boolean);
  const displayName = parts.length >= 2 ? parts.slice(-2).join("/") : (parts[0] || path.basename(root));
  const webUrl = `https://${host}/${repoPath}`;
  return {
    display_name: displayName,
    host_label: host === "github.com" ? "GitHub" : host,
    web_url: webUrl,
  };
}

function parseHeadChanges(raw) {
  const tokens = String(raw ?? "").split("\0").filter(Boolean);
  const changes = [];
  for (let i = 0; i < tokens.length;) {
    const statusToken = tokens[i++];
    const code = statusToken?.[0];
    if (!code) break;
    if (code === "R" || code === "C") {
      const previousPath = tokens[i++];
      const repoPath = tokens[i++];
      if (!previousPath || !repoPath) break;
      const similarity = Number.parseInt(statusToken.slice(1), 10);
      changes.push({
        path: repoPath,
        previous_path: previousPath,
        status: code,
        ...(Number.isInteger(similarity) ? { similarity } : {}),
      });
      continue;
    }
    const repoPath = tokens[i++];
    if (!repoPath) break;
    changes.push({ path: repoPath, status: code });
  }
  return changes.sort((a, b) => a.path.localeCompare(b.path));
}

function headHistory(root) {
  const sha = git(root, ["rev-parse", "HEAD"], { allowFailure: true });
  if (!sha) return { commit: null, changes: [] };
  const record = git(root, ["log", "-1", "--format=%H%x00%aN%x00%aI%x00%cI%x00%s"], { trim: false })?.replace(/\n$/, "") ?? "";
  const [commitSha, authorName, authoredAt, committedAt, subject] = record.split("\0");
  const rawChanges = git(root, ["diff-tree", "--root", "--no-commit-id", "-r", "-z", "-M", "-C", "--name-status", "HEAD"], { trim: false }) ?? "";
  return {
    commit: commitSha ? {
      sha: commitSha,
      author_name: authorName ?? "",
      authored_at: authoredAt ?? "",
      committed_at: committedAt ?? "",
      subject: subject ?? "",
    } : null,
    changes: parseHeadChanges(rawChanges),
  };
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
    if (VIEWER_ASSETS.has(url.pathname)) {
      const [fileName, contentType] = VIEWER_ASSETS.get(url.pathname);
      return text(res, 200, fs.readFileSync(path.join(VIEWER_DIR, fileName), "utf8"), contentType);
    }
    if (url.pathname === "/api/health") {
      return json(res, 200, { ok: true, repository: ".", host: LOOPBACK_HOST });
    }
    if (url.pathname === "/api/meta") {
      return json(res, 200, { ok: true, ...remoteDescriptor(gitRoot) });
    }
    if (url.pathname === "/api/history") {
      try {
        return json(res, 200, { ok: true, ...headHistory(gitRoot) });
      } catch (error) {
        return json(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
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
