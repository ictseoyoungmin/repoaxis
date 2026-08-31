#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { agentContext, whyNode } from "../lib/agent-context.mjs";
import { annotationFor, clearAnnotation, listAnnotations, readAnnotationIndex, setAnnotation } from "../lib/annotations.mjs";
import { unreferencedCandidates } from "../lib/candidates.mjs";
import { readOperationalIndex } from "../lib/fresh-index.mjs";
import { buildIndex, REPOAXIS_VERSION } from "../lib/indexer.mjs";
import { gitVersion, resolveGitRoot } from "../lib/git.mjs";
import { makeNodeId } from "../lib/node-id.mjs";
import {
  changedPaths,
  childrenOf,
  findNodes,
  parentsOf,
  refsFor,
  showNode,
  summarizeIndex,
} from "../lib/query.mjs";
import { validateIndex } from "../lib/schema.mjs";
import { startViewer } from "../lib/view-server.mjs";

function print(value) {
  if (typeof value === "string") process.stdout.write(`${value}\n`);
  else process.stdout.write(`${JSON.stringify(value)}\n`);
}

function fail(message, code = 1) {
  process.stderr.write(`${message}\n`);
  process.exitCode = code;
}

function takeOption(args, name, fallback = null) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  if (index + 1 >= args.length) throw new Error(`${name} requires a value`);
  const value = args[index + 1];
  args.splice(index, 2);
  return value;
}

function takeFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return false;
  args.splice(index, 1);
  return true;
}

function readQueryIndex(fileArg = null) {
  return readOperationalIndex({ fileArg }).index;
}

function annotationIndexFile(fileArg = null) {
  return readOperationalIndex({ fileArg }).file;
}

function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || String(parsed) !== String(value)) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function parsePort(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535 || String(parsed) !== String(value)) {
    throw new Error("--port must be an integer from 0 to 65535");
  }
  return parsed;
}

function help() {
  return `repoaxis ${REPOAXIS_VERSION}\n\nUsage:\n  repoaxis build [--root PATH] [--output FILE] [--reason TEXT]\n  repoaxis view [--root PATH] [--port N] [--no-open]\n  repoaxis validate [FILE]\n  repoaxis summary [FILE]\n  repoaxis find QUERY [--index FILE] [--limit N]\n  repoaxis show TARGET [--index FILE]\n  repoaxis refs TARGET [--index FILE]\n  repoaxis parents TARGET [--index FILE]\n  repoaxis children TARGET [--index FILE]\n  repoaxis changed [--staged] [--index FILE]\n  repoaxis unreferenced [--index FILE]\n  repoaxis context TARGET [--index FILE]\n  repoaxis why TARGET [--index FILE] [--max-depth N] [--max-paths N]\n  repoaxis note TARGET [TEXT...] [--clear] [--index FILE]\n  repoaxis notes [--index FILE]\n  repoaxis doctor [--root PATH]\n  repoaxis node-id TYPE PATH [QUALIFIED_NAME]\n  repoaxis version\n  repoaxis help\n\nOperational commands refresh the default .repoaxis.json when Git HEAD or working-tree content changed. Passing --index FILE selects an explicit snapshot and disables automatic refresh. The viewer binds only to 127.0.0.1 and reads the same fresh default index. Unreferenced output is conservative structural evidence, never a dead-code verdict. The repository and current working tree remain authoritative.`;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args.shift() ?? "help";

  if (command === "help" || command === "--help" || command === "-h") return print(help());
  if (command === "version" || command === "--version" || command === "-v") return print(REPOAXIS_VERSION);

  if (command === "build") {
    const root = takeOption(args, "--root", process.cwd());
    const output = takeOption(args, "--output", null);
    const reason = takeOption(args, "--reason", "manual");
    if (args.length) throw new Error(`unexpected arguments: ${args.join(" ")}`);
    const result = buildIndex({ root, output, reason });
    return print({ ok: true, output: result.output, summary: summarizeIndex(result.index) });
  }

  if (command === "view") {
    const root = takeOption(args, "--root", process.cwd());
    const port = parsePort(takeOption(args, "--port", "4173"));
    const noOpen = takeFlag(args, "--no-open");
    if (args.length) throw new Error(`unexpected arguments: ${args.join(" ")}`);
    const viewer = await startViewer({ root, port, open: !noOpen });
    return print({ ok: true, url: viewer.url, root: viewer.root });
  }

  if (command === "validate" || command === "summary") {
    const file = path.resolve(args.shift() ?? ".repoaxis.json");
    if (args.length) throw new Error(`unexpected arguments: ${args.join(" ")}`);
    const index = JSON.parse(fs.readFileSync(file, "utf8"));
    const validation = validateIndex(index);
    if (command === "validate") {
      print(validation);
      if (!validation.ok) process.exitCode = 2;
      return;
    }
    if (!validation.ok) throw new Error(`invalid index: ${validation.errors.join("; ")}`);
    return print(summarizeIndex(index));
  }

  if (command === "find") {
    const indexFile = takeOption(args, "--index", null);
    const limitValue = takeOption(args, "--limit", "20");
    const query = args.shift();
    if (!query || args.length) throw new Error("usage: repoaxis find QUERY [--index FILE] [--limit N]");
    return print(findNodes(readQueryIndex(indexFile), query, { limit: parsePositiveInteger(limitValue, "--limit") }));
  }

  if (["show", "refs", "parents", "children"].includes(command)) {
    const indexFile = takeOption(args, "--index", null);
    const target = args.shift();
    if (!target || args.length) throw new Error(`usage: repoaxis ${command} TARGET [--index FILE]`);
    const index = readQueryIndex(indexFile);
    if (command === "show") return print(showNode(index, target));
    if (command === "refs") return print(refsFor(index, target));
    if (command === "parents") return print(parentsOf(index, target));
    return print(childrenOf(index, target));
  }

  if (command === "changed") {
    const indexFile = takeOption(args, "--index", null);
    const stagedOnly = takeFlag(args, "--staged");
    if (args.length) throw new Error(`unexpected arguments: ${args.join(" ")}`);
    return print(changedPaths(readQueryIndex(indexFile), { stagedOnly }));
  }

  if (command === "unreferenced") {
    const indexFile = takeOption(args, "--index", null);
    if (args.length) throw new Error("usage: repoaxis unreferenced [--index FILE]");
    return print(unreferencedCandidates(readQueryIndex(indexFile)));
  }

  if (command === "context") {
    const indexFile = takeOption(args, "--index", null);
    const target = args.shift();
    if (!target || args.length) throw new Error("usage: repoaxis context TARGET [--index FILE]");
    return print(agentContext(readQueryIndex(indexFile), target));
  }

  if (command === "why") {
    const indexFile = takeOption(args, "--index", null);
    const maxDepth = parsePositiveInteger(takeOption(args, "--max-depth", "8"), "--max-depth");
    const maxPaths = parsePositiveInteger(takeOption(args, "--max-paths", "3"), "--max-paths");
    const target = args.shift();
    if (!target || args.length) throw new Error("usage: repoaxis why TARGET [--index FILE] [--max-depth N] [--max-paths N]");
    return print(whyNode(readQueryIndex(indexFile), target, { maxDepth, maxPaths }));
  }

  if (command === "notes") {
    const indexFile = takeOption(args, "--index", null);
    if (args.length) throw new Error("usage: repoaxis notes [--index FILE]");
    const { index } = readAnnotationIndex(annotationIndexFile(indexFile));
    const annotations = listAnnotations(index);
    return print({ count: annotations.length, annotations });
  }

  if (command === "note") {
    const indexFile = takeOption(args, "--index", null);
    const clear = takeFlag(args, "--clear");
    const target = args.shift();
    if (!target) throw new Error("usage: repoaxis note TARGET [TEXT...] [--clear] [--index FILE]");
    const file = annotationIndexFile(indexFile);
    if (clear) {
      if (args.length) throw new Error("--clear cannot be combined with note text");
      return print(clearAnnotation(file, target));
    }
    if (args.length === 0) {
      const { index } = readAnnotationIndex(file);
      return print(annotationFor(index, target));
    }
    return print(setAnnotation(file, target, args.join(" ")));
  }

  if (command === "doctor") {
    const rootArg = takeOption(args, "--root", process.cwd());
    if (args.length) throw new Error(`unexpected arguments: ${args.join(" ")}`);
    const root = resolveGitRoot(rootArg);
    return print({
      ok: true,
      repoaxis: REPOAXIS_VERSION,
      node: process.version,
      git: gitVersion(),
      git_root: root,
    });
  }

  if (command === "node-id") {
    const [type, repoPath, qualifiedName, ...rest] = args;
    if (!type || !repoPath || rest.length) throw new Error("usage: repoaxis node-id TYPE PATH [QUALIFIED_NAME]");
    return print(makeNodeId(type, repoPath, qualifiedName));
  }

  throw new Error(`unknown command: ${command}`);
}

main().catch((error) => fail(`repoaxis: ${error.message}`));
