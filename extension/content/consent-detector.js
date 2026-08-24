(function (root) {
  const app = root.OAuthConsentDiff || {};
  const utils = app.utils || {};
  function contextFromPage(documentRef, locationRef, includeText) {
    return {
      url: locationRef.href,
      host: locationRef.hostname,
      title: documentRef.title || "",
      text: includeText === false ? "" : utils.visibleText ? utils.visibleText(documentRef) : (documentRef.body && documentRef.body.innerText) || ""
    };
  }
  function shouldInspect(context) {
    const host = context.host || "";
    const url = String(context.url || "").toLowerCase();
    if (host === "accounts.google.com") return true;
    if (host === "gitlab.com") return true;
    if (host === "github.com" || host.endsWith(".github.com")) return true;
    return /oauth|authorize|authorization|consent|approval|client_id=|scope=|scopes=|response_type=/.test(url);
  }
  function detect(documentRef, locationRef) {
    const doc = documentRef || root.document;
    const loc = locationRef || root.location;
    if (!doc || !loc || !app.providers) return null;
    const context = contextFromPage(doc, loc, false);
    if (!shouldInspect(context)) return null;
    context.text = utils.visibleText ? utils.visibleText(doc) : (doc.body && doc.body.innerText) || "";
    const provider = app.providers.find(context);
    if (!provider) return null;
    const rawScopes = provider.extractScopes ? provider.extractScopes(doc, context) : [];
    if (!rawScopes.length && provider.id !== "generic") return null;
    const clientId = provider.extractClientId ? provider.extractClientId(context) : "";
    if (provider.id !== "generic" && !clientId) return null;
    return {
      providerId: provider.id,
      providerLabel: provider.label,
      appName: provider.extractAppName ? provider.extractAppName(doc, context) : "OAuth app",
      clientId,
      url: context.url,
      host: context.host,
      title: context.title,
      rawScopes,
      detectedAt: utils.nowIso ? utils.nowIso() : new Date().toISOString()
    };
  }
  app.consentDetector = {
    detect,
    contextFromPage,
    shouldInspect
  };
  root.OAuthConsentDiff = app;
})(typeof globalThis !== "undefined" ? globalThis : window);
