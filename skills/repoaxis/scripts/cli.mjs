#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { buildIndex, REPOAXIS_VERSION } from "../lib/indexer.mjs";
import { gitVersion, resolveGitRoot } from "../lib/git.mjs";
import { makeNodeId } from "../lib/node-id.mjs";
import { summarizeIndex } from "../lib/query.mjs";
import { validateIndex } from "../lib/schema.mjs";

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

function help() {
  return `repoaxis ${REPOAXIS_VERSION}\n\nUsage:\n  repoaxis build [--root PATH] [--output FILE] [--reason TEXT]\n  repoaxis validate [FILE]\n  repoaxis summary [FILE]\n  repoaxis doctor [--root PATH]\n  repoaxis node-id TYPE PATH [QUALIFIED_NAME]\n  repoaxis version\n  repoaxis help\n\nThe repository and current working tree are authoritative. .repoaxis.json is rebuildable derived state.`;
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
