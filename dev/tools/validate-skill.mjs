import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const skillRoot = path.join(root, "skills/repoaxis");
const forbidden = [
  /\bS\d{2}\b/i,
  /\bbottleneck\b/i,
  /\bCLOSED\b/,
  /\bREOPENED\b/,
  /\bdogfood\b/i,
  /\binternal fixture\b/i,
  /\bdevelopment slice\b/i,
  /\bTODO\b/,
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const failures = [];
for (const file of walk(skillRoot)) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of forbidden) if (pattern.test(text)) failures.push(`${path.relative(root, file)} matched ${pattern}`);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("skill surface: ok");
