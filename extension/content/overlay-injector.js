(function (root) {
  const app = root.OAuthConsentDiff || {};
  const messages = app.messages;
  let lastFingerprint = "";
  let renderedFingerprint = "";
  let scanTimer = 0;
  let currentObservationId = "";
  let currentConsent = null;
  let currentScopes = [];
  const dismissedFingerprints = new Set();

  function isDismissed(fingerprint) {
    return dismissedFingerprints.has(fingerprint);
  }

  function markDismissed(fingerprint) {
    dismissedFingerprints.add(fingerprint);
  }

  function removeHost() {
    const host = root.document.getElementById("oauth-consent-diff-root");
    if (host) host.remove();
    renderedFingerprint = "";
  }

  function send(type, payload) {
    return new Promise((resolve) => {
      if (!root.chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        resolve(null);
        return;
      }
      chrome.runtime.sendMessage({ type, payload }, (response) => {
        if (chrome.runtime.lastError || !response || !response.ok) {
          resolve(null);
          return;
        }
        resolve(response.result);
      });
    });
  }

  function ensureHost() {
    let host = root.document.getElementById("oauth-consent-diff-root");
    if (host) return host.shadowRoot;
    host = root.document.createElement("div");
    host.id = "oauth-consent-diff-root";
    const shadow = host.attachShadow({ mode: "open" });
    const link = root.document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("extension/ui/overlay/overlay.css");
    const mount = root.document.createElement("div");
    mount.className = "ocd-mount";
    shadow.append(link, mount);
    root.document.documentElement.appendChild(host);
    return shadow;
  }

  async function decide(decision, fingerprint) {
    const result = await send(messages.recordDecision, {
      context: currentConsent,
      currentScopes,
      observationId: currentObservationId,
      decision
    });
    if (result) {
      markDismissed(fingerprint);
      removeHost();
    }
  }

  async function scan() {
    const consent = app.consentDetector.detect(root.document, root.location);
    if (!consent) {
      removeHost();
      return;
    }
    const scopes = app.scopeExtractor.extract(consent);
    if (!scopes.length) {
      removeHost();
      return;
    }
    const fingerprint = app.scopeExtractor.fingerprint(consent, scopes);
    if (isDismissed(fingerprint)) {
      removeHost();
      return;
    }
    const profile = await send(messages.getProfile, consent);
    const trustedScopes = profile && profile.trustedScopes ? profile.trustedScopes : [];
    const analysis = app.riskEngine.analyze({
      providerId: consent.providerId,
      currentScopes: scopes,
      trustedScopes,
      appName: consent.appName
    });

    if (fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      currentConsent = consent;
      currentScopes = scopes;
      const saved = await send(messages.saveObservation, {
        context: consent,
        currentScopes: scopes,
        analysis,
        observedAt: consent.detectedAt
      });
      currentObservationId = saved && saved.observation ? saved.observation.id : "";
    }

    if (renderedFingerprint !== fingerprint || !root.document.getElementById("oauth-consent-diff-root")) {
      const shadow = ensureHost();
      app.overlay.render(shadow.querySelector(".ocd-mount"), {
        consent,
        analysis,
        profile,
        onClose: () => markDismissed(fingerprint),
        onDecision: (decision) => decide(decision, fingerprint)
      });
      renderedFingerprint = fingerprint;
    }
  }

  function schedule() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 350);
  }

  if (root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }

  const observer = new MutationObserver(schedule);
  observer.observe(root.document.documentElement, { childList: true, subtree: true });
})(typeof globalThis !== "undefined" ? globalThis : window);
