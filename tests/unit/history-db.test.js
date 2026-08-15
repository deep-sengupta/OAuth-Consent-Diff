const test = require("node:test");
const assert = require("node:assert/strict");

require("../../extension/shared/constants.js");
const historyDB = require("../../extension/storage/history-db.js");

test("trusted baseline key binds client identity to authorization endpoint", () => {
  const first = historyDB.appKey({ providerId: "generic", clientId: "same-client", url: "https://auth.example.com/oauth/authorize?client_id=same-client&scope=read" });
  const second = historyDB.appKey({ providerId: "generic", clientId: "same-client", url: "https://other.example.com/oauth/authorize?client_id=same-client&scope=read" });
  assert.notEqual(first, second);
});

test("trusted baseline key remains stable for the same authorization endpoint", () => {
  const first = historyDB.appKey({ providerId: "github", clientId: "client-1", url: "https://github.com/login/oauth/authorize?client_id=client-1&scope=read:user" });
  const second = historyDB.appKey({ providerId: "github", clientId: "client-1", url: "https://github.com/login/oauth/authorize?client_id=client-1&scope=repo" });
  assert.equal(first, second);
});
