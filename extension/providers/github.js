(function (root) {
  const app = root.OAuthConsentDiff || {};
  const normalizer = app.scopeNormalizer;
  const utils = app.utils || {};
  function detect(context) {
    const host = context.host || "";
    if (!host.endsWith("github.com")) return 0;
    const page = (context.text || "").toLowerCase();
    try {
      const url = new URL(context.url || "");
      const oauthPath = /\/login\/oauth\/authorize|\/oauth\/authorize/.test(url.pathname);
      const hasClientId = url.searchParams.has("client_id");
      const hasScope = url.searchParams.has("scope");
      if (!oauthPath && !hasClientId) return 0;
      let score = oauthPath ? 4 : 0;
      if (hasClientId) score += 2;
      if (hasScope) score += 2;
      if (page.includes("authorize") && page.includes("github")) score += 1;
      return score;
    } catch (error) {
      return 0;
    }
  }
  function appName(documentRef, context) {
    const selectors = [
      ".oauth-application-name",
      ".application-name",
      "[data-oauth-app-name]",
      "h1",
      "h2",
      "strong"
    ];
    const found = selectors.flatMap((selector) => Array.from(documentRef.querySelectorAll(selector)))
      .map((node) => utils.normalizeText ? utils.normalizeText(node.textContent) : node.textContent.trim())
      .find((value) => value && value.length < 80 && !/^authorize|github$/i.test(value));
    if (found) return found;
    const match = (context.text || "").match(/Authorize\s+(.{2,80}?)(?:\s+by|\s*$)/i);
    return match ? utils.normalizeText(match[1]) : "GitHub OAuth app";
  }
  function clientId(context) {
    try {
      return new URL(context.url).searchParams.get("client_id") || "";
    } catch (error) {
      return "";
    }
  }
  function scopes(documentRef, context) {
    const codeScopes = Array.from(documentRef.querySelectorAll("code, tt, .scope, [data-scope]"))
      .flatMap((node) => normalizer.splitScopeText(node.getAttribute("data-scope") || node.textContent || ""))
      .filter((value) => /^[a-z:_-]+$/i.test(value));
    return [
      ...normalizer.extractScopesFromUrl(context.url),
      ...codeScopes,
      ...normalizer.inferScopesFromText(context.text || "", "github")
    ];
  }
  app.providers.register({
    id: "github",
    label: "GitHub",
    detect,
    extractAppName: appName,
    extractClientId: clientId,
    extractScopes: scopes
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
