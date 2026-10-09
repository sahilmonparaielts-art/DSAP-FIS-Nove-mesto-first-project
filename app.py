import os
import secrets
from flask import Flask, jsonify, make_response, render_template, request, session

app = Flask(__name__)
app.secret_key = os.environ.get("DEMO_SECRET_KEY", "local-demo-only-change-me")
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax")
HTTPS_MODE = os.environ.get("DEMO_HTTPS") == "1"


@app.after_request
def security_headers(response):
    mode = request.args.get("mode", "secure")
    if mode != "vulnerable":
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.get("/")
def index():
    mode = request.args.get("mode", "secure")
    if mode not in ("secure", "vulnerable"):
        mode = "secure"
    csrf_token = session.setdefault("csrf_token", secrets.token_urlsafe(24))
    response = make_response(render_template("index.html", mode=mode, csrf_token=csrf_token,
                                             username=session.get("username")))
    response.set_cookie("demo_session", session.get("username", "guest"), httponly=(mode != "vulnerable"),
                        secure=HTTPS_MODE, samesite="Lax", path="/")
    return response


@app.post("/login")
def login():
    data = request.get_json(silent=True) or request.form
    if data.get("username") != "student" or data.get("password") != "demo-pass":
        return jsonify(ok=False, message="Use the published fictional demo credentials."), 401
    session.clear()
    session["username"] = "student"
    session["csrf_token"] = secrets.token_urlsafe(24)
    return jsonify(ok=True, username="student", csrf_token=session["csrf_token"])


@app.post("/demo-action")
def demo_action():
    mode = request.args.get("mode", "secure")
    if mode != "vulnerable":
        token = request.headers.get("X-CSRF-Token", "")
        if not session.get("username") or not secrets.compare_digest(token, session.get("csrf_token", "")):
            return jsonify(ok=False, message="Blocked: sign in and provide the session CSRF token."), 403
    return jsonify(ok=True, message="Fictional demo action accepted. No external data was changed.")


@app.post("/logout")
def logout():
    mode = request.args.get("mode", "secure")
    if mode != "vulnerable":
        token = request.headers.get("X-CSRF-Token", "")
        if not secrets.compare_digest(token, session.get("csrf_token", "")):
            return jsonify(ok=False, message="Blocked: provide the session CSRF token."), 403
    session.clear()
    response = jsonify(ok=True, message="Demo session cleared.")
    response.delete_cookie("demo_session", path="/", secure=HTTPS_MODE,
                           httponly=(mode != "vulnerable"), samesite="Lax")
    return response


@app.get("/health")
def health():
    return jsonify(status="ok", app="browser-storage-security-demo")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
