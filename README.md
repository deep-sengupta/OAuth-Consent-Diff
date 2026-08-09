<p align="center">
  <img src="assets/icons/icon-128.png" width="96" height="96" alt="OAuth Consent Diff extension icon">
</p>

<h1 align="center">OAuth Consent Diff</h1>

<p align="center">
  A local browser security extension that watches OAuth consent screens, compares requests against trusted application baselines, and explains what new permissions can actually do.
</p>

<p align="center">
  It separates observed OAuth requests from trusted permissions. A request can be <strong>NEW</strong>, <strong>KNOWN</strong>, or <strong>CHANGED</strong>, and only an explicit approval updates the trusted baseline.
</p>

## What It Does

- Detects OAuth-looking consent screens across normal websites
- Extracts and normalizes requested OAuth scopes
- Stores OAuth observations locally
- Maintains an explicit trusted permission baseline for each application
- Shows requests as NEW, KNOWN, or CHANGED
- Lets you Approve & Trust, Reject, or Ignore a request
- Updates the trusted baseline only after an explicit approval
- Shows semantic explanations of newly requested permissions
- Groups permissions by risk
- Keeps observed history separate from approved permissions

## Trusted Baseline Flow

```text
OAuth request
     ↓
Identify application
     ↓
Find trusted baseline
     ↓
Compare permissions
     ↓
Risk + semantic analysis
     ↓
User decision
     ↓
Approve / Reject / Ignore
     ↓
Only Approve updates trusted baseline
```

### Baseline states

```text
NEW
No trusted baseline exists for this application.

KNOWN
The request exactly matches the trusted baseline.

CHANGED
The request differs from the trusted baseline.
```

An observed request is never automatically promoted to a trusted baseline.

## Semantic Permission Analysis

Instead of only showing raw scopes such as:

```text
repo
workflow
```

the extension explains the practical capability of newly requested permissions.

For example:

```text
GitHub — Private repositories

• Read private repositories
• Modify repository contents
• Access repository metadata

Risk: HIGH
```

For Google Drive:

```text
Google Drive — Full Google Drive access

• Read Drive files
• Modify Drive files
• Create Drive files
• Delete Drive files

Risk: CRITICAL
```

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
3. Review the baseline state, risk level, and semantic permission explanation.
4. Choose one:
   - **Approve & Trust** to create the first baseline.
   - **Approve & update baseline** when a changed request is intentionally accepted.
   - **Reject** to record that you rejected the request.
   - **Ignore** to dismiss the request without changing the trusted baseline.
5. Open the extension popup to review saved history.

> Reject records your decision inside OAuth Consent Diff. It does not automatically click the provider's Allow/Deny controls.

## Check It Works

Run the project checks:

```bash
npm test
npm run build
```

The test suite covers trusted baseline states, permission drift, and semantic capability explanations.

## Manual Test Links

Open this GitHub baseline request first:

```text
https://github.com/login/oauth/authorize?client_id=oauth-consent-diff-test&scope=read:user
```

The overlay should show:

```text
NEW
```

Choose **Approve & Trust**.

Then open this expanded request:

```text
https://github.com/login/oauth/authorize?client_id=oauth-consent-diff-test&scope=read:user%20repo%20workflow
```

The overlay should now show:

```text
CHANGED
```

and explain the new GitHub repository and workflow capabilities.

Choose **Ignore** or **Reject** and verify that the trusted baseline remains the original `read:user` permission.

Choose **Approve & update baseline** and the new permissions become the trusted baseline for future requests.

## Expected Behavior

- The overlay appears only on OAuth-looking consent pages.
- Normal GitHub pages do not show the overlay.
- The first observed request is not automatically trusted.
- Only an explicit approval creates or changes a trusted baseline.
- Known requests are shown as KNOWN.
- Permission drift is shown as CHANGED.
- Semantic explanations are shown for newly added permissions.
- Closing the overlay keeps it closed for the same request.
