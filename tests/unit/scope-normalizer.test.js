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

test("does not expose page-text scope inference as an extraction API", () => {
  assert.equal(normalizer.inferScopesFromText, undefined);
});

test("unknown scopes are not classified by misleading keyword names", () => {
  const scopes = normalizer.normalizeScopes(["admin_like_but_unknown_scope", "read_like_but_unknown_scope"], "generic");
  assert.equal(scopes.length, 2);
  assert.ok(scopes.every((scope) => scope.known === false));
  assert.ok(scopes.every((scope) => scope.risk === "medium"));
});
