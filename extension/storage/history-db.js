(function (root) {
  const app = root.OAuthConsentDiff || {};
  const utils = app.utils || {};
  const DB_NAME = "oauth_consent_diff";
  const DB_VERSION = 2;
  const PROFILES = "profiles";
  const OBSERVATIONS = "observations";
  const SETTINGS = "settings";
  let openPromise;
  function openDB() {
    if (!root.indexedDB) return Promise.reject(new Error("IndexedDB is not available"));
    if (openPromise) return openPromise;
    openPromise = new Promise((resolve, reject) => {
      const request = root.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PROFILES)) db.createObjectStore(PROFILES, { keyPath: "key" });
        if (!db.objectStoreNames.contains(OBSERVATIONS)) {
          const store = db.createObjectStore(OBSERVATIONS, { keyPath: "id" });
          store.createIndex("profileKey", "profileKey", { unique: false });
          store.createIndex("observedAt", "observedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("IndexedDB upgrade was blocked"));
    });
    return openPromise;
  }
  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function getStoreValue(storeName, key) {
    const db = await openDB();
    return requestToPromise(db.transaction(storeName, "readonly").objectStore(storeName).get(key));
  }
  async function putStoreValue(storeName, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  async function getAll(storeName) {
    const db = await openDB();
    return requestToPromise(db.transaction(storeName, "readonly").objectStore(storeName).getAll());
  }
  function authorizationContext(input) {
    const value = input || {};
    try {
      const url = new URL(value.url || "");
      return url.origin + url.pathname;
    } catch (error) {
      return value.host || "unknown-endpoint";
    }
  }
  function appKey(input) {
    const value = input || {};
    const providerId = value.providerId || value.provider || "generic";
    const clientId = value.clientId || value.appId || "unknown-client";
    const endpoint = authorizationContext(value);
    const identity = providerId + "\u0000" + clientId + "\u0000" + endpoint;
    return "oauth-profile:" + encodeURIComponent(identity);
  }
  function consentFingerprint(input, scopes) {
    const value = input || {};
    const providerId = value.providerId || value.provider || "generic";
    const clientIdentity = value.clientId || value.appName || "";
    const scopeKey = (scopes || []).map((scope) => scope && scope.id ? scope.id : "").sort();
    return JSON.stringify([providerId, clientIdentity, authorizationContext(value), scopeKey]);
  }
  function uniqueScopeRecords(records) {
    const map = new Map();
    for (const scope of records || []) if (scope && scope.id && !map.has(scope.id)) map.set(scope.id, scope);
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }
  function emptyProfile(input) {
    const key = typeof input === "string" ? input : appKey(input);
    const source = typeof input === "string" ? {} : input || {};
    return {
      key,
      providerId: source.providerId || source.provider || "generic",
      appName: source.appName || "Unknown app",
      clientId: source.clientId || "",
      host: source.host || "",
      authorizationEndpoint: authorizationContext(source),
      firstSeen: null,
      lastSeen: null,
      observations: 0,
      knownScopes: [],
      lastScopes: [],
      trustedScopes: [],
      lastApprovedScopes: [],
      lastApprovedAt: null,
      lastDecision: null,
      lastDecisionAt: null,
      decisionCounts: { approved: 0, rejected: 0, ignored: 0 },
      maxRisk: "low"
    };
  }
  async function getProfile(input) {
    const key = typeof input === "string" ? input : appKey(input);
    const stored = await getStoreValue(PROFILES, key);
    if (!stored) return emptyProfile(input);
    return Object.assign(emptyProfile(stored), stored, {
      trustedScopes: stored.trustedScopes || [],
      lastApprovedScopes: stored.lastApprovedScopes || [],
      decisionCounts: Object.assign({ approved: 0, rejected: 0, ignored: 0 }, stored.decisionCounts || {})
    });
  }
  async function saveObservation(input) {
    const context = input.context || input;
    const key = appKey(context);
    const existing = await getProfile(Object.assign({}, context, { key }));
    const now = input.observedAt || (utils.nowIso ? utils.nowIso() : new Date().toISOString());
    const currentScopes = uniqueScopeRecords(input.currentScopes || input.scopes || []);
    const knownScopes = uniqueScopeRecords([...(existing.knownScopes || []), ...currentScopes]);
    const analysis = input.analysis || {};
    const observationId = input.observationId || (now + "-" + Math.random().toString(36).slice(2));
    const profile = Object.assign({}, existing, {
      key,
      providerId: context.providerId || existing.providerId || "generic",
      appName: context.appName || existing.appName || "Unknown app",
      clientId: context.clientId || existing.clientId || "",
      host: context.host || existing.host || "",
      authorizationEndpoint: authorizationContext(context),
      firstSeen: existing.firstSeen || now,
      lastSeen: now,
      observations: (existing.observations || 0) + 1,
      knownScopes,
      lastScopes: currentScopes,
      maxRisk: (analysis.level && (analysis.level === "critical" || existing.maxRisk === "critical" || analysis.level === "high" || existing.maxRisk === "high")) ? (analysis.level === "critical" || existing.maxRisk === "critical" ? "critical" : "high") : (analysis.level || existing.maxRisk || "low")
    });
    const observation = {
      id: observationId,
      profileKey: key,
      providerId: profile.providerId,
      appName: profile.appName,
      clientId: profile.clientId,
      host: profile.host,
      authorizationEndpoint: profile.authorizationEndpoint,
      url: context.url || "",
      observedAt: now,
      decision: input.decision || "observed",
      scopes: currentScopes,
      analysis: {
        level: analysis.level || "low",
        baselineState: analysis.baselineState || "new",
        unusualExpansion: Boolean(analysis.unusualExpansion),
        added: analysis.added || [],
        removed: analysis.removed || [],
        reasons: analysis.reasons || [],
        semantic: analysis.semantic || []
      }
    };
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([PROFILES, OBSERVATIONS], "readwrite");
      tx.objectStore(PROFILES).put(profile);
      tx.objectStore(OBSERVATIONS).put(observation);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return { profile, observation };
  }
  async function recordDecision(input) {
    const context = input.context || input;
    const decision = String(input.decision || "").toLowerCase();
    if (!["approved", "rejected", "ignored"].includes(decision)) throw new Error("Invalid baseline decision");
    const key = appKey(context);
    const existing = await getProfile(Object.assign({}, context, { key }));
    const now = input.decidedAt || (utils.nowIso ? utils.nowIso() : new Date().toISOString());
    const currentScopes = uniqueScopeRecords(input.currentScopes || input.scopes || []);
    const observationId = input.observationId || "";
    const counts = Object.assign({ approved: 0, rejected: 0, ignored: 0 }, existing.decisionCounts || {});
    if (!input.fingerprint) throw new Error("Consent fingerprint required");
    if (input.fingerprint !== consentFingerprint(context, currentScopes)) throw new Error("Consent fingerprint mismatch");
    if (!observationId) throw new Error("Observation required for decision");
    const observation = await getStoreValue(OBSERVATIONS, observationId);
    if (!observation || observation.profileKey !== key) throw new Error("Invalid consent observation");
    if (observation.observedAt !== existing.lastSeen) throw new Error("Consent state is stale");
    if (input.fingerprint !== consentFingerprint(observation, observation.scopes || [])) throw new Error("Consent observation mismatch");
    counts[decision] += 1;
    const profile = Object.assign({}, existing, { lastDecision: decision, lastDecisionAt: now, decisionCounts: counts });
    if (decision === "approved" && (!(existing.trustedScopes || []).length || input.updateBaseline === true)) {
      const trustedScopes = uniqueScopeRecords([...(existing.trustedScopes || []), ...currentScopes]);
      profile.trustedScopes = trustedScopes;
      profile.lastApprovedScopes = currentScopes;
      profile.lastApprovedAt = now;
    }
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([PROFILES, OBSERVATIONS], "readwrite");
      tx.objectStore(PROFILES).put(profile);
      const store = tx.objectStore(OBSERVATIONS);
      const request = store.get(observationId);
      request.onsuccess = () => {
        const currentObservation = request.result;
        if (currentObservation && currentObservation.profileKey === key) {
          currentObservation.decision = decision;
          currentObservation.decidedAt = now;
          store.put(currentObservation);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return profile;
  }
  async function listRecent(limit) {
    const rows = await getAll(OBSERVATIONS);
    const sorted = rows.sort((a, b) => String(b.observedAt).localeCompare(String(a.observedAt)));
    return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  }
  async function getStats() {
    const profiles = await getAll(PROFILES);
    const observations = await getAll(OBSERVATIONS);
    const unusual = observations.filter((row) => row.analysis && row.analysis.unusualExpansion).length;
    const critical = observations.filter((row) => row.analysis && row.analysis.level === "critical").length;
    return { apps: profiles.length, observations: observations.length, unusual, critical, trusted: profiles.filter((profile) => (profile.trustedScopes || []).length > 0).length, lastSeen: observations.sort((a, b) => String(b.observedAt).localeCompare(String(a.observedAt)))[0] || null };
  }
  async function clearAll() {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([PROFILES, OBSERVATIONS, SETTINGS], "readwrite");
      tx.objectStore(PROFILES).clear();
      tx.objectStore(OBSERVATIONS).clear();
      tx.objectStore(SETTINGS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return true;
  }
  async function getSettings() {
    const stored = await getStoreValue(SETTINGS, "main");
    return stored || { key: "main", overlayEnabled: true, compactMode: false };
  }
  async function saveSettings(settings) {
    const current = await getSettings();
    return putStoreValue(SETTINGS, Object.assign({}, current, settings || {}, { key: "main" }));
  }
  app.historyDB = { openDB, appKey, getProfile, saveObservation, recordDecision, listRecent, getStats, clearAll, getSettings, saveSettings };
  root.OAuthConsentDiff = app;
  if (typeof module !== "undefined" && module.exports) module.exports = app.historyDB;
})(typeof globalThis !== "undefined' ? globalThis : self);
