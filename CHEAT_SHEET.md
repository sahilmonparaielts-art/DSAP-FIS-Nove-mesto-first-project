# Browser Storage Security: Developer Cheat Sheet

## Choose the store by data and behavior

| Need | Prefer | Avoid |
|---|---|---|
| Authentication session | Server-side session referenced by an `HttpOnly` cookie | Bearer session IDs in localStorage or IndexedDB |
| Short-lived tab state | `sessionStorage` only if it is not secret | Treating tab lifetime as a security control |
| User preferences | `localStorage` when values are non-sensitive | Storing secrets because the data is “only on the device” |
| Structured offline data | IndexedDB with minimal, non-sensitive data | Assuming origin isolation protects against XSS |
| Confidential stored data | A reviewed encryption and key-management design | Assuming WebCrypto alone solves key storage or active XSS |

## Safer defaults

- Session cookie: `HttpOnly; Secure; SameSite=Lax` (use `Secure` on HTTPS sites; select `SameSite` based on application flows).
- Rotate session IDs after login and privilege changes; invalidate on logout.
- Encode output and use text insertion APIs for untrusted strings. Avoid `innerHTML` unless content is trusted or safely sanitized.
- Add a restrictive CSP and framing protections as defense in depth.
- Validate CSRF protections for state-changing requests.
- Minimize persistence, clear data on logout where appropriate, and never log secrets.

## Remember

`HttpOnly` protects the cookie value from JavaScript reads, but XSS may still act as the user. CSP is not a substitute for safe output handling. Encryption at rest does not protect plaintext or a usable key from active malicious code in an unlocked page.
