(function (root) {
  const app = root.OAuthConsentDiff || {};
  const normalizer = app.scopeNormalizer;
  const utils = app.utils || {};
  function detect(context) {
    if ((context.host || "") !== "gitlab.com") return 0;
    try {
      const url = new URL(context.url || "");
      const oauthPath = /\/oauth\/authorize/.test(url.pathname);
      const hasClientId = url.searchParams.has("client_id");
      const hasScope = url.searchParams.has("scope") || url.searchParams.has("scopes");
      if (!oauthPath && !hasClientId) return 0;
      let score = oauthPath ? 4 : 0;
      if (hasClientId) score += 2;
      if (hasScope) score += 2;
      return score;
    } catch (error) {
      return 0;
    }
  }
  function appName(documentRef) {
    const found = Array.from(documentRef.querySelectorAll("h1, h2, strong, .application-name"))
      .map((node) => utils.normalizeText ? utils.normalizeText(node.textContent) : node.textContent.trim())
      .find((value) => value && value.length < 80 && !/^authorize|gitlab$/i.test(value));
    return found || "GitLab OAuth app";
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
  app.providers.register({ id: "gitlab", label: "GitLab", detect, extractAppName: appName, extractClientId: clientId, extractScopes: scopes });
})(typeof globalThis !== "undefined" ? globalThis : window);
