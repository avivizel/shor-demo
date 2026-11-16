"""התחברות OIDC (למשל IBM App ID או IBMid) לפני הגישה לדף.

ההתחברות פעילה רק אם הוגדרו משתני הסביבה הבאים. כל הערכים מגיעים מהסביבה בלבד:
    OIDC_DISCOVERY_URL   כתובת ה-well-known של ספק הזהויות
    OIDC_CLIENT_ID
    OIDC_CLIENT_SECRET
    OIDC_REDIRECT_URI    הכתובת המלאה של /auth/callback באפליקציה (https)
    SECRET_KEY           מפתח חתימה לעוגיית ההפעלה (ערך אקראי וארוך)
אופציונלי:
    OIDC_ALLOWED_EMAIL_DOMAINS   רשימה מופרדת בפסיקים, למשל il.ibm.com,ibm.com
    SHOR_DEMO_REQUIRE_AUTH=1     אם ההתחברות לא מוגדרת, האפליקציה חוסמת הכול ולא נפתחת לציבור

בלי משתנים אלה (הרצה מקומית על 127.0.0.1) ההתחברות כבויה והדף עובד כמו קודם.
"""

import os
from datetime import timedelta

from authlib.integrations.flask_client import OAuth
from flask import jsonify, redirect, request, session, url_for

PUBLIC_ENDPOINTS = {"login", "auth_callback", "logout"}
REQUIRED_VARS = (
    "OIDC_DISCOVERY_URL",
    "OIDC_CLIENT_ID",
    "OIDC_CLIENT_SECRET",
    "OIDC_REDIRECT_URI",
    "SECRET_KEY",
)
HTTP_TIMEOUT_SECONDS = 10
SESSION_HOURS = 8


def _configured():
    return all(os.environ.get(name) for name in REQUIRED_VARS)


def _allowed_domains():
    raw = os.environ.get("OIDC_ALLOWED_EMAIL_DOMAINS", "")
    return {item.strip().lower() for item in raw.split(",") if item.strip()}


def _denied(message, status):
    if request.path.startswith("/api/"):
        return jsonify({"error": message}), status
    return message, status


def init_auth(app):
    require = os.environ.get("SHOR_DEMO_REQUIRE_AUTH") == "1"
    enabled = _configured()
    app.config["AUTH_ENABLED"] = enabled
    if not enabled and not require:
        return

    if not enabled:
        # אין הגדרות התחברות אבל נדרשת הגנה: חוסמים כל בקשה במקום להישאר פתוחים.
        @app.before_request
        def _block_all():
            return _denied("ההתחברות לא הוגדרה ולכן הגישה חסומה.", 503)

        return

    app.secret_key = os.environ["SECRET_KEY"]
    app.config.update(
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        PERMANENT_SESSION_LIFETIME=timedelta(hours=SESSION_HOURS),
    )
    redirect_uri = os.environ["OIDC_REDIRECT_URI"]
    allowed_domains = _allowed_domains()

    oauth = OAuth(app)
    oauth.register(
        name="oidc",
        server_metadata_url=os.environ["OIDC_DISCOVERY_URL"],
        client_id=os.environ["OIDC_CLIENT_ID"],
        client_secret=os.environ["OIDC_CLIENT_SECRET"],
        client_kwargs={
            "scope": "openid email profile",
            "code_challenge_method": "S256",
            "timeout": HTTP_TIMEOUT_SECONDS,
        },
    )

    @app.before_request
    def _require_login():
        if request.endpoint in PUBLIC_ENDPOINTS:
            return None
        if session.get("user"):
            return None
        if request.path.startswith("/api/"):
            return jsonify({"error": "צריך להתחבר מחדש. רעננו את הדף."}), 401
        return redirect(url_for("login"))

    @app.get("/login")
    def login():
        return oauth.oidc.authorize_redirect(redirect_uri)

    @app.get("/auth/callback", endpoint="auth_callback")
    def auth_callback():
        try:
            token = oauth.oidc.authorize_access_token()
        except Exception:
            app.logger.warning("התחברות נכשלה", exc_info=False)
            return "ההתחברות נכשלה. אפשר לנסות שוב.", 400
        info = token.get("userinfo") or {}
        email = str(info.get("email", "")).lower()
        if allowed_domains:
            domain = email.rpartition("@")[2]
            if not info.get("email_verified", False) or domain not in allowed_domains:
                app.logger.warning("משתמש לא מורשה ניסה להתחבר")
                return "אין לך הרשאה לדף הזה.", 403
        session.clear()
        session.permanent = True
        session["user"] = {"email": email}
        return redirect("/")

    @app.get("/logout")
    def logout():
        session.clear()
        return redirect("/login")
