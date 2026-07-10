(function (root) {
  const current = root.OAuthConsentDiff || {};
  const messages = {
    getProfile: "OCD_GET_PROFILE",
    saveObservation: "OCD_SAVE_OBSERVATION",
    listRecent: "OCD_LIST_RECENT",
    getStats: "OCD_GET_STATS",
    clearHistory: "OCD_CLEAR_HISTORY",
    getSettings: "OCD_GET_SETTINGS",
    saveSettings: "OCD_SAVE_SETTINGS"
  };
  const riskLevels = {
    low: { id: "low", label: "Low", score: 1 },
    medium: { id: "medium", label: "Medium", score: 2 },
    high: { id: "high", label: "High", score: 3 },
    critical: { id: "critical", label: "Critical", score: 4 }
  };
  const providerNames = {
    google: "Google",
    github: "GitHub",
    gitlab: "GitLab",
    generic: "OAuth"
  };
  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === "") return [];
    return [value];
  }
  function uniqueSorted(values) {
    return Array.from(new Set(toArray(values).filter(Boolean).map(String))).sort((a, b) => a.localeCompare(b));
  }
  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function compactKey(value) {
    return normalizeText(value)
      .toLowerCase()
      .replace(/https?:\/\//g, "")
      .replace(/[^a-z0-9:_./-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180);
  }
  function hashString(value) {
    const text = String(value || "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }
  function domainFromUrl(value) {
    try {
      return new URL(value).hostname;
    } catch (error) {
      return "";
    }
  }
  function nowIso() {
    return new Date().toISOString();
  }
  function formatTime(value) {
    if (!value) return "Never";
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(value));
    } catch (error) {
      return String(value);
    }
  }
  function visibleText(documentRef) {
    const body = documentRef && documentRef.body;
    if (!body) return "";
    return normalizeText(body.innerText || body.textContent || "").slice(0, 6000);
  }
  root.OAuthConsentDiff = Object.assign(current, {
    version: "0.1.0",
    messages,
    riskLevels,
    providerNames,
    utils: Object.assign(current.utils || {}, {
      toArray,
      uniqueSorted,
      normalizeText,
      compactKey,
      hashString,
      domainFromUrl,
      nowIso,
      formatTime,
      visibleText
    })
  });
  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.OAuthConsentDiff;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
