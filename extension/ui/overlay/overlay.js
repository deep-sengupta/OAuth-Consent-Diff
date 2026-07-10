(function (root) {
  const app = root.OAuthConsentDiff || {};
  const utils = app.utils || {};
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function scopeItem(scope) {
    return '<div class="ocd-scope"><i class="ocd-dot ocd-dot-' + escapeHtml(scope.risk) + '"></i><div><span class="ocd-scope-title">' + escapeHtml(scope.label) + '</span><span class="ocd-scope-copy">' + escapeHtml(scope.description || scope.category) + '</span></div></div>';
  }
  function list(items) {
    return (items || []).map((item) => "<li>" + escapeHtml(item) + "</li>").join("");
  }
  function render(rootNode, model) {
    const analysis = model.analysis;
    const consent = model.consent;
    const added = analysis.added || [];
    const current = analysis.currentScopes || [];
    const primaryScopes = added.length ? added : current.slice(0, 4);
    const riskClass = "ocd-risk-" + analysis.level;
    rootNode.innerHTML = [
      '<article class="ocd-card" data-minimized="false">',
      '<header class="ocd-top">',
      '<div>',
      '<h2 class="ocd-title">' + escapeHtml(consent.appName) + '</h2>',
      '<p class="ocd-subtitle">' + escapeHtml(consent.providerLabel || consent.providerId) + ' permission request</p>',
      '</div>',
      '<div class="ocd-actions">',
      '<button class="ocd-icon" type="button" title="Minimize" data-action="minimize">−</button>',
      '<button class="ocd-icon" type="button" title="Close" data-action="close">×</button>',
      '</div>',
      '</header>',
      '<div class="ocd-body">',
      '<div class="ocd-status">',
      '<span class="ocd-badge ' + riskClass + '">' + escapeHtml(analysis.level.toUpperCase()) + '</span>',
      '<span class="ocd-badge ocd-chip">' + escapeHtml(analysis.observedScopeCount + ' scopes') + '</span>',
      analysis.unusualExpansion ? '<span class="ocd-badge ocd-chip">New expansion</span>' : '<span class="ocd-badge ocd-chip">Local baseline</span>',
      '</div>',
      '<ul class="ocd-summary">' + list(analysis.reasons) + '</ul>',
      '<section class="ocd-section">',
      '<div class="ocd-section-title">' + escapeHtml(added.length ? "Changed permissions" : "Requested permissions") + '</div>',
      primaryScopes.map(scopeItem).join(""),
      '</section>',
      '<section class="ocd-section ocd-details" data-open="false">',
      '<div class="ocd-section-title">Plain English diff</div>',
      '<ul class="ocd-summary">' + list(analysis.plain) + '</ul>',
      '<div class="ocd-section-title">What to check</div>',
      '<ul class="ocd-summary">' + list(analysis.recommendations) + '</ul>',
      '</section>',
      '</div>',
      '<footer class="ocd-footer">',
      '<button class="ocd-button secondary" type="button" data-action="details">Details</button>',
      '<button class="ocd-button" type="button" data-action="baseline">Saved locally</button>',
      '</footer>',
      '</article>'
    ].join("");
    const card = rootNode.querySelector(".ocd-card");
    const details = rootNode.querySelector(".ocd-details");
    const detailsButton = rootNode.querySelector('[data-action="details"]');
    rootNode.querySelector('[data-action="close"]').addEventListener("click", () => {
      if (typeof model.onClose === "function") model.onClose();
      rootNode.getRootNode().host.remove();
    });
    rootNode.querySelector('[data-action="minimize"]').addEventListener("click", () => {
      const next = card.getAttribute("data-minimized") !== "true";
      card.setAttribute("data-minimized", String(next));
    });
    detailsButton.addEventListener("click", () => {
      const next = details.getAttribute("data-open") !== "true";
      details.setAttribute("data-open", String(next));
      detailsButton.textContent = next ? "Hide" : "Details";
    });
  }
  app.overlay = {
    render,
    escapeHtml,
    formatTime: utils.formatTime
  };
  root.OAuthConsentDiff = app;
})(typeof globalThis !== "undefined" ? globalThis : window);
