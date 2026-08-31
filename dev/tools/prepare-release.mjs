import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateReleaseContract } from "./release-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function parseArgs(argv) {
  const options = { tag: null, out: path.join(root, "dist", "release") };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--tag") options.tag = argv[++index] ?? null;
    else if (value === "--out") options.out = path.resolve(argv[++index] ?? "");
    else throw new Error(`unknown argument: ${value}`);
  }
  return options;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function prepareRelease({ tag = null, out } = {}) {
  const contract = validateReleaseContract(root, { tag });
  const output = path.resolve(out ?? path.join(root, "dist", "release"));
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });

  const packedName = execFileSync(
    "npm",
    ["pack", "--ignore-scripts", "--silent", "--pack-destination", output],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  )
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .at(-1);
  if (!packedName?.endsWith(".tgz")) throw new Error("npm pack did not produce a tarball name");

  const tarballPath = path.join(output, packedName);
  const digest = sha256(tarballPath);
  const checksumName = `${packedName}.sha256`;
  fs.writeFileSync(path.join(output, checksumName), `${digest}  ${packedName}\n`, "utf8");
  fs.writeFileSync(path.join(output, "release-notes.md"), `# Repoaxis ${contract.tag}\n\n${contract.notes}\n`, "utf8");
  const manifest = {
    name: contract.name,
    version: contract.version,
    tag: contract.tag,
    repository_url: contract.repository_url,
    tarball: packedName,
    sha256: digest,
  };
  fs.writeFileSync(path.join(output, "release-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { output, ...manifest, checksum: checksumName };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  const result = prepareRelease(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
