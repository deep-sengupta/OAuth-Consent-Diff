(function (root) {
  const app = root.OAuthConsentDiff || {};
  const normalizer = app.scopeNormalizer;
  const levelScore = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };
  const expansionWeight = {
    low: 1,
    medium: 2,
    high: 4,
    critical: 7
  };
  function byRisk(scopes) {
    const groups = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    for (const scope of scopes || []) {
      groups[scope.risk || "low"].push(scope);
    }
    return groups;
  }
  function maxRisk(scopes) {
    let max = "low";
    for (const scope of scopes || []) {
      if ((levelScore[scope.risk] || 1) > levelScore[max]) max = scope.risk;
    }
    return max;
  }
  function chooseLevel(currentScopes, addedScopes, previousScopes) {
    const inherent = maxRisk(currentScopes);
    const hasHistory = previousScopes.length > 0;
    const expansionScore = addedScopes.reduce((sum, scope) => sum + (expansionWeight[scope.risk] || 1), 0);
    if (addedScopes.some((scope) => scope.risk === "critical")) return "critical";
    if (hasHistory && expansionScore >= 7) return "critical";
    if (inherent === "critical") return "critical";
    if (addedScopes.some((scope) => scope.risk === "high")) return "high";
    if (hasHistory && expansionScore >= 4) return "high";
    if (inherent === "high") return "high";
    if (addedScopes.some((scope) => scope.risk === "medium")) return "medium";
    if (inherent === "medium") return "medium";
    return "low";
  }
  function summarizeScopes(scopes) {
    return (scopes || []).slice(0, 4).map((scope) => scope.label).join(", ");
  }
  function uniqueCategories(scopes) {
    return Array.from(new Set((scopes || []).map((scope) => scope.category))).filter(Boolean);
  }
  function analyze(input) {
    const providerId = input.providerId || input.provider || "generic";
    const currentScopes = normalizer.normalizeScopes(input.currentScopes || input.scopes || [], providerId);
    const previousScopes = normalizer.normalizeScopes(input.previousScopes || [], providerId);
    const diff = normalizer.compareScopeSets(currentScopes, previousScopes);
    const level = chooseLevel(currentScopes, diff.added, previousScopes);
    const hasHistory = previousScopes.length > 0;
    const unusualExpansion = hasHistory && diff.added.length > 0;
    const categories = uniqueCategories(diff.added.length ? diff.added : currentScopes);
    const reasons = [];
    if (!hasHistory) reasons.push("First local record for this app");
    if (diff.added.length === 1) reasons.push("Requests 1 new permission compared with local history");
    if (diff.added.length > 1) reasons.push("Requests " + diff.added.length + " new permissions compared with local history");
    if (diff.removed.length > 0) reasons.push("Drops " + diff.removed.length + " previously requested permissions");
    if (diff.added.some((scope) => scope.risk === "critical")) reasons.push("Adds a critical permission");
    if (diff.added.some((scope) => scope.risk === "high")) reasons.push("Adds a high-impact permission");
    if (!reasons.length) reasons.push("No expansion from the last local record");
    const plain = [];
    if (diff.added.length) plain.push("New: " + summarizeScopes(diff.added));
    if (diff.unchanged.length) plain.push("Still requested: " + summarizeScopes(diff.unchanged));
    if (diff.removed.length) plain.push("Removed: " + summarizeScopes(diff.removed));
    if (!plain.length) plain.push("No readable scopes were found on this screen.");
    const recommendations = [];
    if (level === "critical") recommendations.push("Approve only if you expected broad account control.");
    if (level === "high") recommendations.push("Check whether this app truly needs this data now.");
    if (unusualExpansion) recommendations.push("This request is larger than the last local record for this app.");
    if (!hasHistory) recommendations.push("Future requests from this app will be compared against this baseline.");
    if (!recommendations.length) recommendations.push("The request matches the last local record.");
    return {
      level,
      riskScore: levelScore[level],
      unusualExpansion,
      hasHistory,
      currentScopes,
      previousScopes,
      added: diff.added,
      removed: diff.removed,
      unchanged: diff.unchanged,
      groups: byRisk(currentScopes),
      addedGroups: byRisk(diff.added),
      categories,
      reasons,
      plain,
      recommendations,
      observedScopeCount: currentScopes.length
    };
  }
  app.riskEngine = {
    analyze,
    byRisk,
    maxRisk,
    levelScore
  };
  root.OAuthConsentDiff = app;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = app.riskEngine;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
