const test = require("node:test");
const assert = require("node:assert/strict");

require("../../extension/shared/constants.js");
require("../../extension/scopes/scope-normalizer.js");
const riskEngine = require("../../extension/risk/risk-engine.js");

test("classifies an untrusted first request as new", () => {
  const analysis = riskEngine.analyze({
    providerId: "github",
    currentScopes: ["read:user", "repo"]
  });
  assert.equal(analysis.baselineState, "new");
  assert.equal(analysis.hasHistory, false);
  assert.deepEqual(analysis.added.map((scope) => scope.id).sort(), ["github.read:user", "github.repo"]);
});

test("matches an approved trusted baseline as known", () => {
  const analysis = riskEngine.analyze({
    providerId: "github",
    trustedScopes: ["read:user", "repo"],
    currentScopes: ["repo", "read:user"]
  });
  assert.equal(analysis.baselineState, "known");
  assert.equal(analysis.unusualExpansion, false);
  assert.equal(analysis.added.length, 0);
  assert.equal(analysis.removed.length, 0);
});

test("detects permission drift from the trusted baseline", () => {
  const analysis = riskEngine.analyze({
    providerId: "github",
    trustedScopes: ["read:user"],
    currentScopes: ["read:user", "repo", "workflow"]
  });
  assert.equal(analysis.baselineState, "changed");
  assert.equal(analysis.unusualExpansion, true);
  assert.equal(analysis.level, "critical");
  assert.deepEqual(analysis.added.map((scope) => scope.id).sort(), ["github.repo", "github.workflow"]);
});

test("explains GitHub repository capabilities", () => {
  const analysis = riskEngine.analyze({
    providerId: "github",
    trustedScopes: ["read:user"],
    currentScopes: ["read:user", "repo"]
  });
  const semantic = analysis.semantic.find((item) => item.id === "github.repo");
  assert.ok(semantic);
  assert.equal(semantic.risk, "high");
  assert.deepEqual(semantic.capabilities, [
    "Read private repositories",
    "Modify repository contents",
    "Access repository metadata"
  ]);
});

test("explains Google Drive capabilities", () => {
  const analysis = riskEngine.analyze({
    providerId: "google",
    trustedScopes: ["https://www.googleapis.com/auth/userinfo.email"],
    currentScopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/drive"
    ]
  });
  const semantic = analysis.semantic.find((item) => item.id === "google.drive");
  assert.ok(semantic);
  assert.equal(semantic.risk, "critical");
  assert.ok(semantic.capabilities.includes("Delete Drive files"));
});
