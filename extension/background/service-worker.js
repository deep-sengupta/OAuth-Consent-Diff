importScripts("../shared/constants.js", "../storage/schema.js", "../storage/history-db.js");

const app = self.OAuthConsentDiff;
const db = app.historyDB;
const messages = app.messages;

async function handleMessage(message) {
  const payload = message.payload || {};
  if (message.type === messages.getProfile) return db.getProfile(payload);
  if (message.type === messages.saveObservation) return db.saveObservation(payload);
  if (message.type === messages.recordDecision) return db.recordDecision(payload);
  if (message.type === messages.listRecent) return db.listRecent(payload.limit);
  if (message.type === messages.getStats) return db.getStats();
  if (message.type === messages.clearHistory) return db.clearAll();
  if (message.type === messages.getSettings) return db.getSettings();
  if (message.type === messages.saveSettings) return db.saveSettings(payload);
  throw new Error("Unknown message type");
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender || sender.id !== chrome.runtime.id) {
    sendResponse({ ok: false, error: "Unauthorized sender" });
    return false;
  }
  handleMessage(message || {})
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => sendResponse({ ok: false, error: error && error.message ? error.message : String(error) }));
  return true;
});
