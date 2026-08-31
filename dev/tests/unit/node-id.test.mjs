import test from "node:test";
import assert from "node:assert/strict";
import { makeNodeId, normalizeRepoPath } from "../../../skills/repoaxis/lib/node-id.mjs";

test("normalizes repository paths", () => {
  assert.equal(normalizeRepoPath("./src\\auth/../auth/service.py"), "src/auth/service.py");
  assert.equal(normalizeRepoPath("."), ".");
});

test("creates deterministic file and symbol IDs", () => {
  assert.equal(makeNodeId("file", "./src/auth/service.py"), "file:src/auth/service.py");
  assert.equal(makeNodeId("class", "src/auth/service.py", "AuthService"), "class:src/auth/service.py::AuthService");
  assert.equal(makeNodeId("function", "src/auth/service.py", "AuthService.login"), "function:src/auth/service.py::AuthService.login");
});

test("rejects paths outside the repository", () => {
  assert.throws(() => normalizeRepoPath("../escape.js"), /escapes repository root/);
});
