(function (root) {
  const app = root.OAuthConsentDiff || {};
  const normalizer = app.scopeNormalizer;
  function extract(consent) {
    if (!consent) return [];
    return normalizer.normalizeScopes(consent.rawScopes || [], consent.providerId);
  }
  function fingerprint(consent, scopes) {
    const scopeKey = (scopes || []).map((scope) => scope.id).sort();
    return JSON.stringify([
      consent.providerId,
      consent.clientId || consent.appName,
      scopeKey
    ]);
  }
  app.scopeExtractor = {
    extract,
    fingerprint
  };
  root.OAuthConsentDiff = app;
})(typeof globalThis !== "undefined" ? globalThis : window);
