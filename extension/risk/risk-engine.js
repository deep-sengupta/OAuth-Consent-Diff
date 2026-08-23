(function (root) {
  const app = root.OAuthConsentDiff || {};
  const normalizer = app.scopeNormalizer;
  const levelScore = { low: 1, medium: 2, high: 3, critical: 4 };
  const expansionWeight = { low: 1, medium: 2, high: 4, critical: 7 };

  function byRisk(scopes) {
    const groups = { critical: [], high: [], medium: [], low: [] };
    for (const scope of scopes || []) groups[scope.risk || "low"].push(scope);
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

  function semanticForScope(scope, added) {
    const id = String(scope.id || "").toLowerCase();
    const capabilities = Array.isArray(scope.capabilities) ? scope.capabilities.slice() : [];
    if (!capabilities.length) {
      if (id === "github.repo") capabilities.push("Read private repositories", "Modify repository contents", "Access repository metadata");
      else if (id === "github.workflow") capabilities.push("Modify GitHub Actions workflow files", "Change repository automation");
      else if (id === "github.delete_repo") capabilities.push("Delete repositories");
      else if (id === "google.drive") capabilities.push("Read Drive files", "Modify Drive files", "Create Drive files", "Delete Drive files");
      else if (id === "google.drive.readonly") capabilities.push("Read and download Drive files");
      else if (id === "google.drive.file") capabilities.push("Access files opened with or created by the app");
      else if (id === "google.gmail.readonly") capabilities.push("Read Gmail messages", "View Gmail settings");
      else if (id === "google.gmail.send") capabilities.push("Send email on your behalf");
      else if (id === "google.gmail.modify") capabilities.push("Read and change Gmail messages", "Delete Gmail messages");
      else if (id === "github.admin:org") capabilities.push("Manage organizations", "Manage teams and membership");
      else if (id === "gitlab.api") capabilities.push("Read GitLab data", "Modify GitLab data through the API");
      else if (id === "gitlab.sudo") capabilities.push("Perform API actions as another user");
      else if (scope.description) capabilities.push(scope.description);
    }
    return { id: scope.id, label: scope.label, category: scope.category, risk: scope.risk, description: scope.description, capabilities, added: Boolean(added) };
  }

  function semanticAnalysis(currentScopes, addedScopes) {
    const addedIds = new Set(addedScopes.map((scope) => scope.id));
    return currentScopes.filter((scope) => addedIds.has(scope.id)).map((scope) => semanticForScope(scope, true));
  }

  function analyze(input) {
    const providerId = input.providerId || input.provider || "generic";
    const currentScopes = normalizer.normalizeScopes(input.currentScopes || input.scopes || [], providerId);
    const trustedScopes = normalizer.normalizeScopes(input.trustedScopes || input.previousScopes || [], providerId);
    const diff = normalizer.compareScopeSets(currentScopes, trustedScopes);
    const level = chooseLevel(currentScopes, diff.added, trustedScopes);
    const hasBaseline = trustedScopes.length > 0;
    let baselineState = "new";
    if (hasBaseline && diff.added.length === 0 && diff.removed.length === 0) baselineState = "known";
    else if (hasBaseline) baselineState = "changed";
    const unusualExpansion = hasBaseline && diff.added.length > 0;
    const categories = uniqueCategories(diff.added.length ? diff.added : currentScopes);
    const semantic = semanticAnalysis(currentScopes, diff.added);
    const reasons = [];

    if (!hasBaseline) reasons.push("No trusted baseline exists for this app");
    if (baselineState === "known") reasons.push("Matches the trusted permission baseline");
    if (baselineState === "changed" && diff.added.length === 1) reasons.push("Requests 1 permission not present in the trusted baseline");
    if (baselineState === "changed" && diff.added.length > 1) reasons.push("Requests " + diff.added.length + " permissions not present in the trusted baseline");
    if (diff.removed.length > 0) reasons.push("Drops " + diff.removed.length + " permissions from the trusted baseline");
    if (diff.added.some((scope) => scope.risk === "critical")) reasons.push("Adds a critical permission");
    if (diff.added.some((scope) => scope.risk === "high")) reasons.push("Adds a high-impact permission");
    if (!reasons.length) reasons.push("No permission changes detected");

    const plain = [];
    if (diff.added.length) plain.push("New: " + summarizeScopes(diff.added));
    if (diff.unchanged.length) plain.push("Still requested: " + summarizeScopes(diff.unchanged));
    if (diff.removed.length) plain.push("Removed: " + summarizeScopes(diff.removed));
    if (!plain.length) plain.push("No readable scopes were found on this screen.");

    const recommendations = [];
    if (!hasBaseline) recommendations.push("Review the permissions and approve only if you trust this application.");
    if (level === "critical") recommendations.push("Approve only if you expected broad account control.");
    if (level === "high") recommendations.push("Check whether this app truly needs this data now.");
    if (unusualExpansion) recommendations.push("This request is larger than the trusted baseline. Approving it will add these scopes to the trusted baseline.");
    if (baselineState === "known") recommendations.push("The request matches the permissions you previously approved.");

    return {
      level,
      riskScore: levelScore[level],
      baselineState,
      unusualExpansion,
      hasHistory: hasBaseline,
      currentScopes,
      previousScopes: trustedScopes,
      trustedScopes,
      added: diff.added,
      removed: diff.removed,
      unchanged: diff.unchanged,
      groups: byRisk(currentScopes),
      addedGroups: byRisk(diff.added),
      categories,
      semantic,
      reasons,
      plain,
      recommendations,
      observedScopeCount: currentScopes.length
    };
  }

  app.riskEngine = { analyze, byRisk, maxRisk, levelScore, semanticForScope, semanticAnalysis };
  root.OAuthConsentDiff = app;
  if (typeof module !== "undefined" && module.exports) module.exports = app.riskEngine;
})(typeof globalThis !== "undefined" ? globalThis : window);
