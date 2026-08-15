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

- Fixed OAuth scope detection relying on arbitrary visible page text as if it were an authoritative permission request.
- Fixed unrelated page content containing permission-related phrases from being interpreted as newly requested OAuth scopes.
- Fixed risk analysis being influenced by inferred permissions that were not actually present in the OAuth request.
- Fixed trusted-baseline comparisons being polluted by false-positive scope extraction.
- Improved separation between authoritative OAuth scope parameters and supplemental consent-screen text.
- Reduced false `NEW` and `CHANGED` states caused by unrelated permission descriptions or page content.
- Reduced incorrect risk classifications caused by text-based scope inference.

## Findings

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Arbitrary visible page text could be interpreted as requested OAuth permissions | High | Fixed |
| 2 | Unrelated permission descriptions could create false-positive scope changes | Medium | Fixed |
| 3 | False-positive scopes could affect OAuth risk analysis | Medium | Fixed |
| 4 | False-positive scopes could affect trusted-baseline comparisons | Medium | Fixed |
| 5 | Generic OAuth detection could inspect pages based on OAuth-related URL keywords | Low | Reviewed |

## Bug Fix Summary

The primary fix ensures that OAuth Consent Diff does not treat arbitrary rendered page text as authoritative evidence that an OAuth scope was requested. Permission comparisons and risk analysis should be based on the actual OAuth request wherever possible, preventing unrelated page content from changing the security result.
