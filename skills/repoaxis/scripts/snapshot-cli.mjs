import path from "node:path";
import process from "node:process";
import { writeViewerSnapshot } from "../lib/view-snapshot.mjs";

function takeOption(args, name, fallback = null) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  if (index + 1 >= args.length) throw new Error(`${name} requires a value`);
  const value = args[index + 1];
  args.splice(index, 2);
  return value;
}

const args = process.argv.slice(3);
if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write("Usage: repoaxis snapshot [--root PATH] [--output FILE]\n\nWrite a self-contained frozen HTML projection of the canonical Repoaxis viewer.\n");
} else {
  const root = takeOption(args, "--root", process.cwd());
  const output = takeOption(args, "--output", null);
  if (args.length) throw new Error(`unexpected arguments: ${args.join(" ")}`);
  const result = await writeViewerSnapshot({ root, output: output ? path.resolve(output) : null });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
