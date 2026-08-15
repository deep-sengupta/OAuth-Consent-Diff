(function (root) {
  const app = root.OAuthConsentDiff || {};
  const normalizer = app.scopeNormalizer;
  const utils = app.utils || {};
  function detect(context) {
    const host = context.host || "";
    if (host !== "accounts.google.com") return 0;
    try {
      const url = new URL(context.url || "");
      const oauthPath = /\/o\/oauth2|\/signin\/oauth|\/oauthchooseaccount|\/approval/.test(url.pathname);
      const hasClientId = url.searchParams.has("client_id");
      const hasScope = url.searchParams.has("scope") || url.searchParams.has("scopes") || url.searchParams.has("requested_scope");
      if (!oauthPath && !hasClientId) return 0;
      let score = oauthPath ? 3 : 0;
      if (hasClientId) score += 2;
      if (hasScope) score += 2;
      return score;
    } catch (error) {
      return 0;
    }
  }
  function appName(documentRef, context) {
    const direct = Array.from(documentRef.querySelectorAll("[data-app-name], h1, h2, strong"))
      .map((node) => utils.normalizeText ? utils.normalizeText(node.textContent) : node.textContent.trim())
      .find((value) => value && value.length < 80 && !/sign in|google|choose an account/i.test(value));
    if (direct) return direct;
    try {
      const url = new URL(context.url);
      return url.searchParams.get("client_id") || "Google OAuth app";
    } catch (error) {
      return "Google OAuth app";
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
  app.providers.register({ id: "google", label: "Google", detect, extractAppName: appName, extractClientId: clientId, extractScopes: scopes });
})(typeof globalThis !== "undefined" ? globalThis : window);
