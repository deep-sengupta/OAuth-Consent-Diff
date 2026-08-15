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

## Bug Fixes #1

- Removed arbitrary visible-page-text scope inference from the authoritative OAuth permission extraction path.
- OAuth scopes are now taken from the OAuth request parameters instead of unrelated consent-screen descriptions.
- Removed provider page-text parsing that could manufacture Google, GitHub, or GitLab permissions that were not requested.
- Hardened generic OAuth detection so an OAuth-related URL keyword alone is not sufficient without a `client_id` and an OAuth scope or authorization endpoint.
- Changed unknown OAuth scopes to use an explicit medium-risk fallback instead of guessing risk from words such as `admin`, `delete`, `read`, or `write`.
- Bound trusted baselines to the provider, client identity, and authorization endpoint instead of only the `client_id`.
- Bound Approve, Reject, and Ignore decisions to the currently displayed consent fingerprint to prevent stale consent state from being recorded.
- Added regression tests for URL-only scope extraction, unknown-scope handling, authorization-endpoint baseline identity, and page-text inference removal.
- Added sender validation to the background message handler before privileged storage operations are executed.

## Findings

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Arbitrary visible page text could be interpreted as requested OAuth permissions | High | Fixed |
| 2 | Unrelated permission descriptions could create false-positive scope changes | Medium | Fixed |
| 3 | False-positive scopes could affect OAuth risk analysis | Medium | Fixed |
| 4 | False-positive scopes could affect trusted-baseline comparisons | Medium | Fixed |
| 5 | Generic OAuth detection could inspect pages based on OAuth-related URL keywords | Low | Fixed |
| 6 | Trusted baselines could be reused across authorization endpoints sharing a client ID | Medium | Fixed |
| 7 | Dynamic OAuth page changes could leave approval decisions bound to stale consent state | Medium | Fixed |
| 8 | Unknown scope names could receive misleading risk classifications from keyword matching | Medium | Fixed |
| 9 | Background message handling lacked an explicit sender identity check | Medium | Fixed |

## Bug Fix Summary

OAuth Consent Diff now treats the OAuth request as the authoritative source for requested permissions. Page text is no longer converted into scopes, unknown scopes are presented conservatively, trusted baselines are bound to the authorization endpoint, and user decisions are tied to the consent state that is actually displayed. The background service worker also validates message senders before performing privileged storage operations.
