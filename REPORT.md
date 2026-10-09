# Analyzing and Securing Browser Storage: From Cookies to IndexedDB and WebCrypto

**Student:** [Your name]  
**Course:** [Course name and code]  
**Instructor:** [Instructor]  
**Submission date:** [Date]

> Draft for personalization. Replace bracketed items, record only experiments you actually ran, and add your own screenshots and results before submission.

## Abstract

This project compares cookies, localStorage, sessionStorage, IndexedDB, and WebCrypto in a small browser application. A localhost Flask demo contrasts deliberately unsafe patterns with safer alternatives. The experiments focus on whether same-origin script can read browser-stored values, how unsafe HTML rendering can expose data during cross-site scripting (XSS), and how server-managed sessions, output encoding, Content Security Policy (CSP), and a CSRF token change the observed outcomes. The project also demonstrates AES-GCM encryption for a fictional note and evaluates its limits. The central finding is that browser storage choice does not replace a threat model: JavaScript-accessible stores are exposed to successful same-origin script injection, while HttpOnly cookies reduce direct cookie theft but do not stop malicious scripts from acting through the page. [Add a concise summary of your observed results.]

## 1. Introduction

Web applications often keep state in both the browser and server. Cookies are sent with matching requests, while Web Storage and IndexedDB expose origin-scoped data to page scripts. This makes the storage mechanism part of the application’s security boundary. A useful design must consider data sensitivity, persistence, JavaScript access, request behavior, and the consequences of script injection.

**Research question:** How do common browser storage mechanisms differ under realistic web threats, and which mitigations reduce the risks demonstrated in a local application?

The objectives are to compare storage properties, model threats to a login/profile/notes application, demonstrate selected unsafe patterns using fictional data, evaluate mitigations, and derive practical developer guidance.

## 2. Background and storage comparison

| Mechanism | Scope and lifetime | JavaScript access | Typical use | Security notes |
|---|---|---|---|---|
| Cookie | Sent to matching requests; lifetime set by expiry or browser session | Unless `HttpOnly` is set | Session identifier and server-managed state | Use `Secure` over HTTPS, `HttpOnly` when script access is unnecessary, and an appropriate `SameSite` policy. Cookies are automatically attached to requests, so CSRF matters. |
| localStorage | Per origin; generally persists across browser restarts | Yes | Non-sensitive preferences | Do not keep session IDs, credentials, or sensitive data here; successful same-origin XSS can read it. |
| sessionStorage | Per origin and top-level tab; normally ends with the tab session | Yes | Short-lived tab-specific state | It remains readable to same-origin scripts and is not a safe place for secrets. |
| IndexedDB | Per origin; persistent structured storage | Yes | Larger structured or offline data | Same-origin scripts can access it; persistence does not provide confidentiality. |
| WebCrypto | Cryptographic operations through browser APIs; does not itself provide persistence | API-mediated | Encrypt/decrypt data or derive keys | It is a crypto API, not a storage system. Key creation, protection, and unlock lifecycle determine whether encryption helps. Active malicious script can often use the unlocked application. |

Storage is partitioned by origin; this limits direct access across origins but does not protect data from code executing within the same origin. `HttpOnly` prevents JavaScript from reading a cookie, not from making authenticated requests when an XSS flaw exists. CSP can limit script execution and resource loading as defense in depth; safe output handling remains essential.

## 3. Threat model

### System and assets

The demo represents a web app with a fictional student account and fictional notes. Assets include the session identifier, authentication state, note contents, and integrity of a state-changing demo action.

### Trust boundaries and assumptions

The browser and Flask server communicate over localhost during the demonstration. The browser is not trusted with secrets merely because data is stored locally. The experiment assumes an attacker may cause a script injection in the app or induce a cross-site request, but does not target any real service, user, or account.

### Threats in scope

- **XSS and data theft:** injected same-origin script reads localStorage, sessionStorage, IndexedDB, or JavaScript-readable cookies.
- **Session hijacking:** a stolen bearer session value may be replayed if the server accepts it.
- **CSRF:** a browser may attach cookies to a cross-site request, depending on cookie policy and request context.
- **Session fixation:** an attacker may attempt to make a victim use a known session identifier if the application does not rotate it after authentication.
- **Clickjacking:** a hostile page may frame a sensitive screen and trick a user into interacting with it.
- **Insecure storage:** sensitive notes, credentials, or tokens may persist in JavaScript-accessible stores.

### Out of scope

This classroom app does not assess browser implementation flaws, real identity providers, production hosting, network interception, or real-world account compromise. The demo login is intentionally fictional and is not production authentication.

## 4. Method and implementation

The application is implemented with Python and Flask, plus standard browser APIs. It runs on `127.0.0.1:5000`. The test account is `student` / `demo-pass`; all information is fictional.

The vulnerable mode includes a readable demonstration cookie, a fake session identifier in localStorage, and note rendering through `innerHTML`. The local XSS proof uses an event handler in an image element to read the fictional note from localStorage and display it in the page. No outbound request or external target is involved.

The secured mode uses Flask’s signed client-side session cookie with JavaScript access disabled, an `Lax` same-site policy, a strict CSP, text-only note rendering, and a CSRF token check on a state-changing demo route. Flask's default session cookie is signed for integrity but is not encrypted and is not a server-side session store; this is a teaching simplification, not a recommendation for production session design. The `Secure` flag is enabled only in HTTPS mode because the default local demo uses HTTP. The sample note is saved to localStorage, sessionStorage, and IndexedDB to compare access and persistence. WebCrypto derives an AES-GCM key from a user-provided demo passphrase and random salt, then stores ciphertext with a random IV.

**Procedure:**

1. Start the app on localhost and verify `/health` returns an OK status.
2. In vulnerable mode, save a fictional note, inspect the storage results, and run the provided local XSS proof. Record what the proof displays.
3. Render the same payload in secured mode. Record that it appears as text and that CSP blocks inline execution.
4. Compare cookie visibility from the JavaScript proof in both modes.
5. Submit the demo action in secured mode before and after sign-in; observe whether the CSRF check allows or rejects it. Repeat in vulnerable mode and record the contrast.
6. Encrypt a fictional note, inspect that ciphertext is stored, decrypt it with the same passphrase, and note the behavior with an incorrect passphrase.
7. Clear browser demo data after the experiment and capture screenshots with no real personal data visible.

## 5. Results

Fill this table only after running the experiments. Add screenshot references or short log excerpts in the last column.

| Experiment | Vulnerable observation | Secured observation | Evidence |
|---|---|---|---|
| JavaScript reads localStorage note | [Record observation] | [Record observation] | [Screenshot/log] |
| Note rendering with XSS proof | [Record observation] | [Record observation] | [Screenshot/log] |
| Cookie visibility to JavaScript | [Record observation] | [Record observation] | [Screenshot/log] |
| Demo action without CSRF token | [Record observation] | [Record observation] | [Screenshot/log] |
| WebCrypto wrong-passphrase attempt | [Record observation] | [Record observation] | [Screenshot/log] |

### Interpretation

[Explain which controls changed each observation and which risks remained. Distinguish prevention from mitigation. For example, HttpOnly limits direct cookie reads but an XSS payload may still issue authenticated requests. CSP is defense in depth and should not replace safe rendering.]

## 6. Discussion

No single browser storage mechanism is universally secure. The data’s sensitivity and how the application uses it matter. JavaScript-readable stores are convenient but should be treated as accessible to any script running in the origin. Cookies can keep session identifiers inaccessible to JavaScript with `HttpOnly`, but browsers attach cookies automatically, which makes CSRF defenses and SameSite policy relevant. CSP and output encoding reduce XSS likelihood and impact, but do not make unsafe application logic safe.

WebCrypto can make a stored note unreadable without a passphrase-derived key, but this example has trade-offs: a weak passphrase can be guessed; a key available to the active page may be abused by malicious script; and the app must handle recovery, rotation, and unlock lifecycle. Client-side encryption is not a substitute for server-side access control or protection from active XSS.

## 7. Developer recommendations

1. Keep session identifiers out of localStorage, sessionStorage, and IndexedDB.
2. Prefer server-managed sessions in cookies marked `HttpOnly`, `Secure` in HTTPS deployments, and an appropriate `SameSite` value.
3. Rotate session identifiers after authentication and invalidate them on logout.
4. Use framework auto-escaping and text APIs; avoid inserting untrusted strings as HTML.
5. Add a restrictive CSP as a second layer, then test it in report-only mode before enforcement on an existing production site.
6. Use CSRF tokens for state-changing actions when needed by the architecture; SameSite is useful but should not be the only reasoning.
7. Store only data that genuinely needs browser persistence, and provide a way to clear it.
8. Use WebCrypto only with a deliberate key management and recovery design; explain its threat-model limits.
9. Set framing protections and other response headers, and keep dependencies updated.
10. Avoid logging credentials, tokens, plaintext secrets, or cryptographic keys.

## 8. Conclusion

This project demonstrates that browser storage features differ in request behavior, persistence, and access model, but JavaScript-accessible storage remains exposed to same-origin script execution. Layered mitigations reduce risks: server-managed HttpOnly cookies reduce token theft through direct reads; safe rendering and CSP reduce XSS risk; CSRF validation protects state-changing actions; and WebCrypto can protect data at rest under a carefully stated key model. [Replace with your evidence-based conclusion after running the demo.]

## References

See [REFERENCES.md](REFERENCES.md). Include the date you accessed sources if required by your course citation style.

## Appendix A: Reproduction notes

- Operating system/browser: [Fill in]
- Python version: [Fill in]
- App version/commit: [Fill in]
- Commands and observations: [Fill in]
- Screenshots: [Add your own images]
