(function () {
  const app = window.OAuthConsentDiff;
  const messages = app.messages;
  const utils = app.utils;
  const statsNode = document.getElementById("stats");
  const historyNode = document.getElementById("history");
  const historyClearButton = document.getElementById("history-clear");
  const historyRefreshButton = document.getElementById("history-refresh");
  const dismissButton = document.getElementById("dismiss-notice");
  const shellNode = document.querySelector(".shell");
  let activeLoad = null;
  let scrollTimer = 0;
  function send(type, payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, payload }, (response) => {
        if (chrome.runtime.lastError || !response || !response.ok) {
          resolve(null);
          return;
        }
        resolve(response.result);
      });
    });
  }
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function renderStats(stats) {
    const rows = [
      ["Apps", stats.apps || 0],
      ["Requests", stats.observations || 0],
      ["Expansions", stats.unusual || 0],
      ["Critical", stats.critical || 0]
    ];
    statsNode.innerHTML = rows.map(([label, value]) => '<div class="stat"><span class="stat-value">' + escapeHtml(value) + '</span><span class="stat-label">' + escapeHtml(label) + '</span></div>').join("");
  }
  function renderRows(node, rows, emptyText) {
    if (!rows || !rows.length) {
      node.innerHTML = '<div class="empty">' + escapeHtml(emptyText) + '</div>';
      return;
    }
    node.innerHTML = rows.map((row) => {
      const level = row.analysis && row.analysis.level ? row.analysis.level : "low";
      const count = row.scopes ? row.scopes.length : 0;
      const when = utils.formatTime ? utils.formatTime(row.observedAt) : row.observedAt;
      return '<article class="item"><div><span class="item-title">' + escapeHtml(row.appName) + '</span><span class="item-copy">' + escapeHtml(row.providerId + " · " + count + " scopes · " + when) + '</span></div><span class="risk risk-' + escapeHtml(level) + '">' + escapeHtml(level.toUpperCase()) + '</span></article>';
    }).join("");
  }
  function setRefreshLoading(isLoading) {
    historyRefreshButton.classList.toggle("is-loading", isLoading);
    historyRefreshButton.disabled = isLoading;
    historyRefreshButton.setAttribute("aria-busy", String(isLoading));
  }
  async function load() {
    if (activeLoad) return activeLoad;
    const previousScrollTop = shellNode.scrollTop;
    setRefreshLoading(true);
    activeLoad = Promise.all([
      send(messages.getStats, {}),
      send(messages.listRecent, {})
    ])
      .then(([stats, history]) => {
        renderStats(stats || {});
        renderRows(historyNode, history || [], "No local history has been saved yet.");
        requestAnimationFrame(() => {
          shellNode.scrollTop = Math.min(previousScrollTop, Math.max(0, shellNode.scrollHeight - shellNode.clientHeight));
        });
      })
      .finally(() => {
        activeLoad = null;
        setRefreshLoading(false);
      });
    return activeLoad;
  }
  async function clearHistory(button) {
    button.disabled = true;
    await send(messages.clearHistory, {});
    await load();
    button.disabled = false;
  }
  historyClearButton.addEventListener("click", () => clearHistory(historyClearButton));
  historyRefreshButton.addEventListener("click", load);
  shellNode.addEventListener("scroll", () => {
    shellNode.classList.add("is-scrolling");
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      shellNode.classList.remove("is-scrolling");
    }, 700);
  }, { passive: true });
  dismissButton.addEventListener("click", () => {
    dismissButton.closest(".notice").remove();
  });
  load();
})();
