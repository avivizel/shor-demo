"""דף לימוד מקומי: RSA צעצוע שנפתח בעזרת אלגוריתם שור.

הפעלה:
    python app.py

הדף נפתח בדפדפן בכתובת http://127.0.0.1:5000
הסימולטור רץ על המחשב הזה. אין פנייה ל-IBM Quantum.
"""

import os
import threading
import webbrowser
from pathlib import Path

from flask import Flask, jsonify, render_template, request

from rsa_toy import ToyRsaError, encrypt_message
from shor_local import ShorFailed, run_shor

ROOT = Path(__file__).resolve().parent
app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False
app.config["TEMPLATES_AUTO_RELOAD"] = True


def _source(filename):
    return (ROOT / filename).read_text(encoding="utf-8")


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/favicon.ico")
def favicon():
    return "", 204


@app.post("/api/encrypt")
def encrypt():
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    if not isinstance(text, str):
        return jsonify({"error": "ההודעה צריכה להיות טקסט."}), 400
    try:
        result = encrypt_message(text)
    except ToyRsaError as exc:
        return jsonify({"error": str(exc)}), 400
    result["python_code"] = _source("rsa_toy.py")
    return jsonify(result)


@app.post("/api/shor")
def shor():
    payload = request.get_json(silent=True) or {}
    digits = payload.get("digits")
    if not isinstance(digits, list) or not digits or len(digits) > 240:
        return jsonify({"error": "אין הודעה מוצפנת לפתוח."}), 400
    if any(not isinstance(digit, int) or not 0 <= digit < 15 for digit in digits):
        return jsonify({"error": "המספרים המוצפנים לא תקינים."}), 400
    try:
        result = run_shor(digits)
    except (ToyRsaError, ShorFailed) as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        app.logger.exception("שגיאה בסימולטור")
        return jsonify({"error": "הסימולטור נתקל בבעיה. אפשר לנסות שוב."}), 500
    result["qiskit_code"] = _source("shor_local.py")
    return jsonify(result)


def _open_browser(port):
    webbrowser.open(f"http://127.0.0.1:{port}")


def main():
    port = int(os.environ.get("SHOR_DEMO_PORT", "5000"))
    print(f"הדף זמין בכתובת http://127.0.0.1:{port}")
    if os.environ.get("SHOR_DEMO_NO_BROWSER") != "1":
        threading.Timer(0.8, _open_browser, args=(port,)).start()
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False, threaded=True)


if __name__ == "__main__":
    main()
