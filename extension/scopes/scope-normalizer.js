(function (root) {
  const app = root.OAuthConsentDiff || {};
  const utils = app.utils || {};
  const baseCatalog = {
    openid: ["generic", "Sign you in", "Identity", "low", "Confirms your identity without granting account data access.", ["sign in", "authenticate"]],
    profile: ["generic", "Basic profile", "Identity", "low", "Reads your public profile information.", ["basic profile", "public profile"]],
    email: ["generic", "Email address", "Identity", "low", "Reads your email address.", ["email address"]],
    offline_access: ["generic", "Long-lived access", "Session", "high", "Allows access after you leave the consent screen.", ["offline access", "when you are not using"]],
    "google.userinfo.profile": ["google", "Google profile", "Identity", "low", "Reads your Google profile details.", ["personal info", "basic account info", "profile info"]],
    "google.userinfo.email": ["google", "Google email address", "Identity", "low", "Reads your Google account email address.", ["email address", "primary email"]],
    "google.drive.metadata.readonly": ["google", "Drive file metadata", "Files", "medium", "Sees file names and metadata in Google Drive.", ["view metadata for files", "see information about your google drive files"]],
    "google.drive.file": ["google", "App-created Drive files", "Files", "medium", "Accesses files opened with or created by the app.", ["files you open with this app", "files created by this app"]],
    "google.drive.readonly": ["google", "Read Google Drive files", "Files", "high", "Reads files in Google Drive.", ["view and download all your google drive files", "see and download all your google drive files", "view your google drive files"]],
    "google.drive": ["google", "Full Google Drive access", "Files", "critical", "Sees, edits, creates, and deletes Google Drive files.", ["see, edit, create, and delete all of your google drive files", "manage your google drive files"]],
    "google.gmail.readonly": ["google", "Read Gmail", "Email", "high", "Reads Gmail messages and settings.", ["read your email messages", "view your email messages", "read your gmail"]],
    "google.gmail.send": ["google", "Send Gmail", "Email", "high", "Sends email from your Gmail account.", ["send email on your behalf", "send email as you", "send gmail"]],
    "google.gmail.modify": ["google", "Manage Gmail", "Email", "critical", "Reads, changes, and deletes Gmail messages.", ["read, compose, send, and permanently delete", "manage your mail", "delete all your email"]],
    "google.calendar.readonly": ["google", "Read Google Calendar", "Calendar", "medium", "Reads calendars and events.", ["view your calendars", "see your calendar"]],
    "google.calendar.events": ["google", "Manage calendar events", "Calendar", "high", "Creates and changes calendar events.", ["edit events on all your calendars", "manage your calendars", "create and edit events"]],
    "google.contacts.readonly": ["google", "Read contacts", "Contacts", "medium", "Reads names, email addresses, and contact details.", ["view your contacts", "see and download your contacts"]],
    "google.photoslibrary.readonly": ["google", "Read Google Photos", "Photos", "medium", "Reads your Google Photos library.", ["view your google photos", "google photos library"]],
    "google.cloud-platform": ["google", "Google Cloud platform", "Infrastructure", "critical", "Accesses Google Cloud projects and resources.", ["google cloud platform", "manage your google cloud"]],
    "github.read:user": ["github", "Read GitHub profile", "Identity", "low", "Reads your GitHub profile information.", ["read your profile", "personal user data"]],
    "github.user:email": ["github", "Read GitHub email", "Identity", "low", "Reads your GitHub email addresses.", ["access user email", "email addresses"]],
    "github.public_repo": ["github", "Public repositories", "Code", "medium", "Accesses public repositories.", ["public repositories"]],
    "github.repo": ["github", "Private repositories", "Code", "high", "Reads and writes public and private repositories.", ["private repositories", "full control of private repositories"]],
    "github.workflow": ["github", "GitHub Actions workflows", "Automation", "high", "Updates GitHub Actions workflow files.", ["workflows", "github actions"]],
    "github.gist": ["github", "Gists", "Code", "medium", "Creates and edits gists.", ["gists"]],
    "github.notifications": ["github", "Notifications", "Activity", "low", "Reads notifications.", ["notifications"]],
    "github.read:org": ["github", "Read organizations", "Organizations", "medium", "Reads organization and team membership.", ["organization and team membership", "read org"]],
    "github.admin:org": ["github", "Admin organizations", "Organizations", "critical", "Manages organizations, teams, and membership.", ["admin organization", "manage organization"]],
    "github.delete_repo": ["github", "Delete repositories", "Code", "critical", "Deletes repositories.", ["delete repositories"]],
    "github.read:packages": ["github", "Read packages", "Packages", "low", "Reads GitHub Packages.", ["read packages"]],
    "github.write:packages": ["github", "Publish packages", "Packages", "high", "Publishes and edits GitHub Packages.", ["write packages", "publish packages"]],
    "gitlab.read_user": ["gitlab", "Read GitLab profile", "Identity", "low", "Reads your GitLab profile.", ["read user"]],
    "gitlab.read_api": ["gitlab", "Read GitLab API", "Account", "high", "Reads data through the GitLab API.", ["read api"]],
    "gitlab.api": ["gitlab", "Full GitLab API", "Account", "critical", "Reads and writes data through the GitLab API.", ["complete read and write access", "api access"]],
    "gitlab.read_repository": ["gitlab", "Read repositories", "Code", "high", "Reads Git repositories.", ["read repositories"]],
    "gitlab.write_repository": ["gitlab", "Write repositories", "Code", "high", "Pushes to Git repositories.", ["write repositories"]],
    "gitlab.sudo": ["gitlab", "Act as users", "Administration", "critical", "Performs API actions as another user.", ["sudo"]]
  };
  const catalog = Object.fromEntries(Object.entries(baseCatalog).map(([id, row]) => [id, {
    id,
    provider: row[0],
    label: row[1],
    category: row[2],
    risk: row[3],
    description: row[4],
    phrases: row[5]
  }]));
  const aliases = {
    "https://www.googleapis.com/auth/userinfo.profile": "google.userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email": "google.userinfo.email",
    "https://www.googleapis.com/auth/drive.metadata.readonly": "google.drive.metadata.readonly",
    "https://www.googleapis.com/auth/drive.file": "google.drive.file",
    "https://www.googleapis.com/auth/drive.readonly": "google.drive.readonly",
    "https://www.googleapis.com/auth/drive": "google.drive",
    "https://www.googleapis.com/auth/gmail.readonly": "google.gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send": "google.gmail.send",
    "https://www.googleapis.com/auth/gmail.modify": "google.gmail.modify",
    "https://www.googleapis.com/auth/calendar.readonly": "google.calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events": "google.calendar.events",
    "https://www.googleapis.com/auth/contacts.readonly": "google.contacts.readonly",
    "https://www.googleapis.com/auth/photoslibrary.readonly": "google.photoslibrary.readonly",
    "https://www.googleapis.com/auth/cloud-platform": "google.cloud-platform",
    "read:user": "github.read:user",
    "user:email": "github.user:email",
    public_repo: "github.public_repo",
    repo: "github.repo",
    workflow: "github.workflow",
    gist: "github.gist",
    notifications: "github.notifications",
    "read:org": "github.read:org",
    "admin:org": "github.admin:org",
    delete_repo: "github.delete_repo",
    "read:packages": "github.read:packages",
    "write:packages": "github.write:packages",
    read_user: "gitlab.read_user",
    read_api: "gitlab.read_api",
    api: "gitlab.api",
    read_repository: "gitlab.read_repository",
    write_repository: "gitlab.write_repository",
    sudo: "gitlab.sudo"
  };
  function splitScopeText(value) {
    return String(value || "")
      .split(/[\s,+]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  function decodeScope(value) {
    const raw = String(value || "").trim();
    try {
      return decodeURIComponent(raw).trim();
    } catch (error) {
      return raw;
    }
  }
  function providerPrefix(providerId, value) {
    if (providerId === "github" && aliases[value]) return aliases[value];
    if (providerId === "gitlab" && aliases[value]) return aliases[value];
    if (providerId === "google" && aliases[value]) return aliases[value];
    return value;
  }
  function riskFromUnknown(id) {
    const text = id.toLowerCase();
    if (/(admin|delete|sudo|cloud|full|manage|modify|api)/.test(text)) return "critical";
    if (/(write|repo|drive|gmail|mail|offline|token)/.test(text)) return "high";
    if (/(read|calendar|contact|photo|package|gist)/.test(text)) return "medium";
    return "low";
  }
  function categoryFromUnknown(id) {
    const text = id.toLowerCase();
    if (/(email|gmail|mail)/.test(text)) return "Email";
    if (/(repo|repository|gist|code)/.test(text)) return "Code";
    if (/(drive|file|photo|storage)/.test(text)) return "Files";
    if (/(calendar|event)/.test(text)) return "Calendar";
    if (/(admin|org|organization|team)/.test(text)) return "Administration";
    if (/(profile|user|identity|openid|email)/.test(text)) return "Identity";
    return "General";
  }
  function humanize(id) {
    return String(id || "")
      .replace(/^github\./, "")
      .replace(/^google\./, "")
      .replace(/^gitlab\./, "")
      .replace(/^generic\./, "")
      .replace(/[:._/-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  function normalizeScope(value, providerId) {
    const source = typeof value === "string" ? { raw: value } : Object.assign({}, value || {});
    const decoded = decodeScope(source.id || source.raw || source.label || "");
    const lowered = decoded.toLowerCase();
    let id = aliases[decoded] || aliases[lowered] || providerPrefix(providerId, lowered);
    if (lowered.startsWith("https://www.googleapis.com/auth/")) {
      id = aliases[lowered] || "google." + lowered.replace("https://www.googleapis.com/auth/", "");
    }
    if (providerId === "github" && !id.includes(".") && aliases[id]) id = aliases[id];
    if (providerId === "gitlab" && !id.includes(".") && aliases[id]) id = aliases[id];
    if (!catalog[id] && providerId && providerId !== "generic" && !id.startsWith(providerId + ".") && !["openid", "profile", "email", "offline_access"].includes(id)) {
      id = providerId + "." + id;
    }
    const known = catalog[id];
    if (known) {
      return Object.assign({}, known, {
        raw: source.raw || decoded,
        seenAs: source.seenAs || source.raw || decoded
      });
    }
    const fallbackId = id || "unknown";
    return {
      id: fallbackId,
      raw: source.raw || decoded || fallbackId,
      seenAs: source.seenAs || source.raw || decoded || fallbackId,
      provider: providerId || "generic",
      label: source.label || humanize(fallbackId),
      category: source.category || categoryFromUnknown(fallbackId),
      risk: source.risk || riskFromUnknown(fallbackId),
      description: source.description || "Requests access covered by this OAuth scope."
    };
  }
  function normalizeScopes(values, providerId) {
    const result = new Map();
    for (const item of utils.toArray ? utils.toArray(values) : Array.isArray(values) ? values : [values]) {
      if (!item) continue;
      const record = normalizeScope(item, providerId);
      if (!result.has(record.id)) result.set(record.id, record);
    }
    return Array.from(result.values()).sort((a, b) => a.label.localeCompare(b.label));
  }
  function extractScopesFromUrl(value) {
    try {
      const url = new URL(value);
      const scopes = [];
      for (const key of ["scope", "scopes", "requested_scope"]) {
        const scoped = url.searchParams.get(key);
        if (scoped) scopes.push(...splitScopeText(scoped));
      }
      return scopes;
    } catch (error) {
      return [];
    }
  }
  function inferScopesFromText(value, providerId) {
    const text = String(value || "").toLowerCase();
    const hits = [];
    for (const record of Object.values(catalog)) {
      if (record.provider !== providerId && providerId !== "generic") continue;
      if ((record.phrases || []).some((phrase) => text.includes(phrase))) hits.push(record.id);
    }
    return hits;
  }
  function compareScopeSets(current, previous) {
    const currentRecords = normalizeScopes(current);
    const previousRecords = normalizeScopes(previous);
    const previousIds = new Set(previousRecords.map((scope) => scope.id));
    const currentIds = new Set(currentRecords.map((scope) => scope.id));
    return {
      added: currentRecords.filter((scope) => !previousIds.has(scope.id)),
      removed: previousRecords.filter((scope) => !currentIds.has(scope.id)),
      unchanged: currentRecords.filter((scope) => previousIds.has(scope.id))
    };
  }
  app.scopeNormalizer = {
    catalog,
    aliases,
    normalizeScope,
    normalizeScopes,
    extractScopesFromUrl,
    inferScopesFromText,
    compareScopeSets,
    splitScopeText
  };
  root.OAuthConsentDiff = app;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = app.scopeNormalizer;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
