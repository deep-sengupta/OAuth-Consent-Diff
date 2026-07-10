(function (root) {
  const app = root.OAuthConsentDiff || {};
  const messages = app.messages;
  let lastFingerprint = "";
  let renderedFingerprint = "";
  let scanTimer = 0;
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
  async function scan() {
    const consent = app.consentDetector.detect(root.document, root.location);
    if (!consent) {
      removeHost();
      return;
    }
    const currentScopes = app.scopeExtractor.extract(consent);
    if (!currentScopes.length) {
      removeHost();
      return;
    }
    const fingerprint = app.scopeExtractor.fingerprint(consent, currentScopes);
    if (isDismissed(fingerprint)) {
      removeHost();
      return;
    }
    const profile = await send(messages.getProfile, consent);
    const previousScopes = profile && profile.lastScopes ? profile.lastScopes : [];
    const analysis = app.riskEngine.analyze({
      providerId: consent.providerId,
      currentScopes,
      previousScopes,
      appName: consent.appName
    });
    if (renderedFingerprint !== fingerprint || !root.document.getElementById("oauth-consent-diff-root")) {
      const shadow = ensureHost();
      app.overlay.render(shadow.querySelector(".ocd-mount"), {
        consent,
        analysis,
        profile,
        onClose: () => markDismissed(fingerprint)
      });
      renderedFingerprint = fingerprint;
    }
    if (fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      await send(messages.saveObservation, {
        context: consent,
        currentScopes,
        analysis,
        observedAt: consent.detectedAt
      });
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
