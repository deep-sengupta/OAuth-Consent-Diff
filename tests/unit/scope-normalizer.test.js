const test = require("node:test");
const assert = require("node:assert/strict");

require("../../extension/shared/constants.js");
const normalizer = require("../../extension/scopes/scope-normalizer.js");

test("normalizes provider URL scopes", () => {
  const scopes = normalizer.normalizeScopes([
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/userinfo.email"
  ], "google");
  assert.equal(scopes.length, 2);
  assert.equal(scopes.find((scope) => scope.id === "google.drive").risk, "critical");
  assert.equal(scopes.find((scope) => scope.id === "google.userinfo.email").risk, "low");
});

test("extracts scopes from oauth URL", () => {
  const scopes = normalizer.extractScopesFromUrl("https://github.com/login/oauth/authorize?scope=read:user%20repo");
  assert.deepEqual(scopes, ["read:user", "repo"]);
});

test("infers human consent text", () => {
  const scopes = normalizer.inferScopesFromText("See, edit, create, and delete all of your Google Drive files", "google");
  assert.ok(scopes.includes("google.drive"));
});
