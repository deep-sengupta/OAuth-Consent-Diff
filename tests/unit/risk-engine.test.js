const test = require("node:test");
const assert = require("node:assert/strict");

require("../../extension/shared/constants.js");
require("../../extension/scopes/scope-normalizer.js");
const riskEngine = require("../../extension/risk/risk-engine.js");

test("flags unusual expansion against history", () => {
  const analysis = riskEngine.analyze({
    providerId: "github",
    previousScopes: ["read:user"],
    currentScopes: ["read:user", "repo", "workflow"]
  });
  assert.equal(analysis.unusualExpansion, true);
  assert.equal(analysis.level, "critical");
  assert.deepEqual(analysis.added.map((scope) => scope.id).sort(), ["github.repo", "github.workflow"]);
});

test("first record becomes baseline", () => {
  const analysis = riskEngine.analyze({
    providerId: "google",
    previousScopes: [],
    currentScopes: ["https://www.googleapis.com/auth/userinfo.email"]
  });
  assert.equal(analysis.hasHistory, false);
  assert.equal(analysis.level, "low");
  assert.equal(analysis.reasons[0], "First local record for this app");
});
