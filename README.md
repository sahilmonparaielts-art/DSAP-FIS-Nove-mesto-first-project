# Analyzing and Securing Browser Storage

A local Flask teaching demo comparing insecure and secured browser storage patterns. It is designed for a student's own computer and uses fictional data only.

## Quick start

1. Install Python 3.10 or newer.
2. In this folder, create and activate a virtual environment (optional but recommended).
3. Install dependencies: `python -m pip install -r requirements.txt`.
4. Start the app: `python app.py`.
5. Open `http://127.0.0.1:5000`.

Demo credentials: `student` / `demo-pass`. These are public test credentials, never use them outside this demo. The development server is bound to localhost. Do not expose it to a network.

## Demo walkthrough

- Choose **Vulnerable** to see the intentionally unsafe patterns: a readable session cookie, a session identifier in localStorage, and an unsanitized note rendered as HTML. Use only the built-in fictional account and harmless demonstration payloads.
- Choose **Secured** to see Flask's signed session cookie with `HttpOnly`, `SameSite=Lax`, and (in HTTPS deployment) `Secure`; escaped note output; and a restrictive CSP. Flask's default session is signed client-side data, not a server-side session store, so this is not a production session design. The demo's local HTTP mode leaves `Secure` off so the cookie works on localhost; set `DEMO_HTTPS=1` only when serving over HTTPS.
- The storage panel demonstrates localStorage, sessionStorage, and IndexedDB using a fictional note. Browser storage is cleared by the **Clear demo data** button.
- The WebCrypto panel encrypts a fictional note with AES-GCM using a key derived from a user-entered demo passphrase. This is an educational illustration, not a production key-management design.
- Save a harmless fictional note, then click **Run local XSS demonstration** for a controlled proof that an injected script can read JavaScript-accessible storage in vulnerable mode. It only displays the result in the page; it does not transmit data. Secured mode renders the payload as text and applies CSP.
- The CSRF section provides in-app buttons to submit with and without a CSRF token. In secured mode, the no-token request should be rejected; in vulnerable mode, it is intentionally accepted.

## Safety and limitations

This application intentionally includes vulnerable behaviors. Run it only on your own machine at `127.0.0.1`, with the provided fake account and data. Do not deploy it publicly or enter real credentials or personal information. The vulnerable mode is for controlled classroom demonstration only.

This is a teaching artifact, not a production authentication system. In particular, it uses a fixed demo account and a development server. Production applications need HTTPS, managed secrets, robust identity/session lifecycle, CSRF defenses appropriate to the architecture, output encoding, dependency maintenance, logging controls, and security review.

WebCrypto can protect stored ciphertext from casual inspection, but it does not prevent an active XSS payload from reading plaintext or using a key while the page is unlocked. `HttpOnly` prevents JavaScript from reading a cookie; it does not stop malicious same-origin scripts from making authenticated requests.

## Project map

- `app.py`: Flask routes, security headers, demo session and CSRF behavior.
- `templates/index.html`: both modes and browser-storage demonstrations.
- `static/styles.css`: responsive local-only lab interface.
- `static/app.js`: local storage, IndexedDB, WebCrypto, and harmless XSS proof.
- `REPORT.md`: report draft and experiment plan.
- `CHEAT_SHEET.md`: one-page developer guidance.
- `PRESENTATION.md`: 10-slide presentation outline.
- `REFERENCES.md`: authoritative sources.

## Suggested two-day completion plan

**Day 1:** Run the demo, capture the vulnerable/secured comparisons, complete the threat model and methodology, and personalize the report with course details.

**Day 2:** Record results, refine conclusions and references, prepare slides, verify the README on a clean environment, then create the GitHub repository and upload this folder.

Before submission, replace the title-page placeholders and add your own screenshots/results. Do not claim a test was successful unless you observed it.

## Put it on GitHub

Create a new empty repository in your GitHub account (choose public only if your course expects public access). From this project folder, run:

```text
git init
git add .
git commit -m "Complete browser storage security project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with the repository URL GitHub gives you. Do not commit passwords, API keys, real personal data, or `.venv`.
