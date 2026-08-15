(function (root) {
  const app = root.OAuthConsentDiff || {};
  const normalizer = app.scopeNormalizer;
  const utils = app.utils || {};
  function detect(context) {
    try {
      const url = new URL(context.url || "");
      const oauthPath = /(?:^|\/)authorize(?:\/|$)|(?:^|\/)oauth(?:\/|$)|(?:^|\/)consent(?:\/|$)/.test(url.pathname);
      const hasClientId = url.searchParams.has("client_id");
      const hasScope = url.searchParams.has("scope") || url.searchParams.has("scopes") || url.searchParams.has("requested_scope");
      if (!hasClientId || (!hasScope && !oauthPath)) return 0;
      let score = 2;
      if (hasScope) score += 2;
      if (oauthPath) score += 2;
      return score;
    } catch (error) {
      return 0;
    }
  }
  function appName(documentRef, context) {
    const found = Array.from(documentRef.querySelectorAll("h1, h2, strong"))
      .map((node) => utils.normalizeText ? utils.normalizeText(node.textContent) : node.textContent.trim())
      .find((value) => value && value.length < 80 && !/^authorize|consent$/i.test(value));
    if (found) return found;
    try {
      const url = new URL(context.url);
      return url.searchParams.get("client_id") || context.host || "OAuth app";
    } catch (error) {
      return "OAuth app";
    }
  }
  function clientId(context) {
    try {
      return new URL(context.url).searchParams.get("client_id") || "";
    } catch (error) {
      return "";
    }
  }
  function scopes(documentRef, context) {
    return normalizer.extractScopesFromUrl(context.url);
  }
  app.providers.register({ id: "generic", label: "OAuth", detect, extractAppName: appName, extractClientId: clientId, extractScopes: scopes });
})(typeof globalThis !== "undefined" ? globalThis : window);
