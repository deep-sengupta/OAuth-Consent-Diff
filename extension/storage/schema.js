(function (root) {
  const app = root.OAuthConsentDiff || {};
  app.storageSchema = {
    dbName: "oauth_consent_diff",
    version: 1,
    stores: {
      profiles: "profiles",
      observations: "observations",
      settings: "settings"
    }
  };
  root.OAuthConsentDiff = app;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = app.storageSchema;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
