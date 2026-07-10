<p align="center">
  <img src="assets/icons/icon-128.png" width="96" height="96" alt="OAuth Consent Diff extension icon">
</p>

<h1 align="center">OAuth Consent Diff</h1>

<p align="center">
  A local browser extension that watches OAuth consent screens and shows a simple permission diff before you approve access.
</p>

<p align="center">
  It compares the scopes an app asks for now with the scopes it asked for before. If an app suddenly asks for more access, the extension highlights the change and groups permissions by risk.
</p>

<p align="center">
  <a href="#load-the-extension"><img src="https://img.shields.io/badge/Load_Extension-ffffff?style=for-the-badge&labelColor=f3f4f6&color=ffffff" alt="Load Extension"></a>
  <a href="#use-the-extension"><img src="https://img.shields.io/badge/Use_It-ffffff?style=for-the-badge&labelColor=f3f4f6&color=ffffff" alt="Use It"></a>
  <a href="#check-it-works"><img src="https://img.shields.io/badge/Test_It-ffffff?style=for-the-badge&labelColor=f3f4f6&color=ffffff" alt="Test It"></a>
</p>

## What It Does

- Detects OAuth-looking consent screens across normal websites
- Extracts requested OAuth scopes
- Saves permission history locally
- Shows a before vs after permission diff
- Flags unusual permission expansion
- Shows recent history in the extension popup

## Load The Extension

1. Open Chrome or Edge.
2. Go to:

```text
chrome://extensions
```

3. Turn on Developer mode.
4. Click Load unpacked.
5. Select this project folder:

```text
OAuth Consent Diff
```

6. Pin the extension if you want quick access.

## Use The Extension

1. Load the extension.
2. Open an OAuth login or consent page.
3. The extension shows an overlay on the consent screen.
4. Review the risk level and permission changes.
5. Open the extension popup to see saved history.

## Check It Works

Run the project checks:

```bash
npm test
npm run build
```

Expected result:

```text
5 tests passed
Build check passed
```

## Manual Test Links

Open this GitHub baseline request first:

```text
https://github.com/login/oauth/authorize?client_id=oauth-consent-diff-test&scope=read:user
```

Then open this expanded request:

```text
https://github.com/login/oauth/authorize?client_id=oauth-consent-diff-test&scope=read:user%20repo%20workflow
```

The second request should show a larger permission request because it adds more scopes.

## Expected Behavior

- The overlay appears only on OAuth-looking consent pages.
- Normal GitHub pages do not show the overlay.
- The popup history updates after a detected request.
- The Refresh button shows a circular loader while loading.
- Closing the overlay keeps it closed for the same request.
