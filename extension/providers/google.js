(function (root) {
  const app = root.OAuthConsentDiff || {};
  const normalizer = app.scopeNormalizer;
  const utils = app.utils || {};
  function text(context) {
    return (context.text || "").toLowerCase();
  }
  function detect(context) {
    const host = context.host || "";
    if (host !== "accounts.google.com") return 0;
    const page = text(context);
    let score = 0;
    const url = context.url || "";
    const oauthPath = /\/o\/oauth2|\/signin\/oauth|\/oauthchooseaccount|\/approval/.test(url);
    const hasClientId = url.includes("client_id=");
    if (!oauthPath && !hasClientId && !page.includes("wants access to your google account")) return 0;
    if (oauthPath) score += 3;
    if (hasClientId) score += 2;
    if (page.includes("wants access to your google account")) score += 4;
    if (page.includes("choose an account") && hasClientId) score += 2;
    return score;
  }
  function appName(documentRef, context) {
    const page = context.text || "";
    const direct = Array.from(documentRef.querySelectorAll("[data-app-name], h1, h2, strong"))
      .map((node) => utils.normalizeText ? utils.normalizeText(node.textContent) : node.textContent.trim())
      .find((value) => value && value.length < 80 && !/sign in|google|choose an account/i.test(value));
    if (direct) return direct;
    const match = page.match(/(.{2,80}?) wants access to your google account/i);
    if (match) return utils.normalizeText(match[1]);
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
    const page = context.text || "";
    return [
      ...normalizer.extractScopesFromUrl(context.url),
      ...normalizer.inferScopesFromText(page, "google")
    ];
  }
  app.providers.register({
    id: "google",
    label: "Google",
    detect,
    extractAppName: appName,
    extractClientId: clientId,
    extractScopes: scopes
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
