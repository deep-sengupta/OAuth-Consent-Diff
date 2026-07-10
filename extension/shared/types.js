(function (root) {
  const app = root.OAuthConsentDiff || {};
  function scopeRecord(value) {
    const raw = typeof value === "string" ? { id: value, raw: value } : Object.assign({}, value || {});
    const id = String(raw.id || raw.raw || "unknown").trim();
    return Object.assign(raw, {
      id,
      raw: String(raw.raw || id),
      label: String(raw.label || id),
      risk: raw.risk || "low",
      category: raw.category || "General",
      provider: raw.provider || "generic"
    });
  }
  function observation(value) {
    const input = Object.assign({}, value || {});
    return Object.assign(input, {
      appName: input.appName || "Unknown app",
      providerId: input.providerId || "generic",
      scopes: (input.scopes || []).map(scopeRecord),
      observedAt: input.observedAt || new Date().toISOString()
    });
  }
  app.types = {
    scopeRecord,
    observation
  };
  root.OAuthConsentDiff = app;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = app.types;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
