# Presentation outline: Browser Storage Security

Suggested 10-slide, 6–8 minute presentation. Replace bracketed notes with your observed results and screenshots.

1. **Title and motivation** — Why client-side storage decisions affect security.
2. **Project question and objectives** — Compare storage, demonstrate risk, test mitigations.
3. **Storage overview** — Cookies, localStorage, sessionStorage, IndexedDB, WebCrypto.
4. **Threat model** — App assets, trust boundary, XSS and CSRF scenarios; state that tests are localhost-only.
5. **Demo architecture** — Flask app, fictional account, vulnerable and secured modes.
6. **XSS experiment** — Screenshot of the harmless local proof displaying the sample note; contrast safe text rendering/CSP.
7. **Cookie and CSRF experiment** — Compare cookie flags and the demo action with/without CSRF validation.
8. **WebCrypto experiment** — Show ciphertext, successful decrypt, wrong-passphrase behavior, and key-management limitation.
9. **Results and recommendations** — Summarize what each control changed and what risks remained.
10. **Conclusion and questions** — Direct answer to research question; lessons for developers.

Keep screenshots limited to the local demo, use no real personal data, and do not present planned tests as completed results.
