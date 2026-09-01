import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { expectedTag, validateReleaseContract } from "../../tools/release-contract.mjs";
import { prepareRelease } from "../../tools/prepare-release.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

test("release contract pins package, manifests, changelog, and tag", () => {
  const contract = validateReleaseContract(repositoryRoot);
  assert.equal(contract.name, "repoaxis");
  assert.equal(contract.tag, expectedTag(contract.version));
  assert.ok(contract.notes.trim().length > 0, "current release notes must be non-empty");
  assert.throws(
    () => validateReleaseContract(repositoryRoot, { tag: "v999.0.0" }),
    /does not match package version/,
  );
});

test("release workflow uses tokenless OIDC trusted publishing", () => {
  const workflow = fs.readFileSync(
    path.join(repositoryRoot, ".github/workflows/release.yml"),
    "utf8",
  );

  assert.match(workflow, /^\s*id-token:\s*write\s*$/m);
  assert.match(workflow, /registry-url:\s*['\"]https:\/\/registry\.npmjs\.org['\"]/);
  assert.match(workflow, /npm publish "dist\/release\/repoaxis-\$\{VERSION\}\.tgz" --access public/);
  assert.match(workflow, /npm view "\$\{NAME\}@\$\{VERSION\}" version/);
  assert.doesNotMatch(workflow, /NPM_TOKEN|NODE_AUTH_TOKEN|secrets\.NPM/i);
  assert.match(workflow, /gh release upload .*--clobber/s);
});

test("release preparation emits tarball, checksum, manifest, and notes", () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-release-test-"));
  try {
    const result = prepareRelease({ out: output });
    const tarball = path.join(output, result.tarball);
    const checksum = path.join(output, result.checksum);
    const manifest = JSON.parse(fs.readFileSync(path.join(output, "release-manifest.json"), "utf8"));
    const notes = fs.readFileSync(path.join(output, "release-notes.md"), "utf8");

    assert.equal(fs.existsSync(tarball), true);
    assert.equal(fs.existsSync(checksum), true);
    assert.equal(manifest.tag, `v${manifest.version}`);
    assert.equal(manifest.sha256, sha256(tarball));
    assert.equal(fs.readFileSync(checksum, "utf8"), `${manifest.sha256}  ${result.tarball}\n`);
    assert.match(notes, new RegExp(`^# Repoaxis v${manifest.version}`, "m"));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
