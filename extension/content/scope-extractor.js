(function (root) {
  const app = root.OAuthConsentDiff || {};
  const normalizer = app.scopeNormalizer;
  function extract(consent) {
    if (!consent) return [];
    return normalizer.normalizeScopes(consent.rawScopes || [], consent.providerId);
  }
  function fingerprint(consent, scopes) {
    const utils = app.utils || {};
    const scopeKey = (scopes || []).map((scope) => scope.id).sort().join("|");
    const base = [consent.providerId, consent.clientId || consent.appName, scopeKey].join("::");
    return utils.hashString ? utils.hashString(base) : base;
  }
  app.scopeExtractor = {
    extract,
    fingerprint
  };
  root.OAuthConsentDiff = app;
})(typeof globalThis !== "undefined" ? globalThis : window);
