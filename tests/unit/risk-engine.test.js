const test = require("node:test");
const assert = require("node:assert/strict");

require("../../extension/shared/constants.js");
require("../../extension/scopes/scope-normalizer.js");
const riskEngine = require("../../extension/risk/risk-engine.js");

test("flags unusual expansion against a trusted baseline", () => {
  const analysis = riskEngine.analyze({
    providerId: "github",
    trustedScopes: ["read:user"],
    currentScopes: ["read:user", "repo", "workflow"]
  });
  assert.equal(analysis.unusualExpansion, true);
  assert.equal(analysis.baselineState, "changed");
  assert.equal(analysis.level, "critical");
  assert.deepEqual(analysis.added.map((scope) => scope.id).sort(), ["github.repo", "github.workflow"]);
});

test("first record has no trusted baseline", () => {
  const analysis = riskEngine.analyze({
    providerId: "google",
    currentScopes: ["https://www.googleapis.com/auth/userinfo.email"]
  });
  assert.equal(analysis.hasHistory, false);
  assert.equal(analysis.baselineState, "new");
  assert.equal(analysis.level, "low");
  assert.equal(analysis.reasons[0], "No trusted baseline exists for this app");
});
