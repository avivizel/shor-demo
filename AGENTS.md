# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands
- Install: `pip install -r requirements.txt` (floor pins only, no lock file; verified on Python 3.12).
- Run: `python app.py` serves http://127.0.0.1:5000 and opens a browser. Env vars: `SHOR_DEMO_PORT` (default 5000), `SHOR_DEMO_NO_BROWSER=1` (skip the browser; use when starting from scripts).
- There is no test runner, linter, or formatter config. For a single check, run one of these:
  - RSA only, fast: `python -c "from rsa_toy import encrypt_message, decrypt_digits, private_exponent as pe; t='שלום אבי'; print(decrypt_digits(encrypt_message(t)['digits'], pe(3, 5)[0]) == t)"` → `True`
  - Full path through the 1024-shot simulator: `python -c "from app import app; c = app.test_client(); t = 'שלום אבי'; e = c.post('/api/encrypt', json={'text': t}).get_json(); s = c.post('/api/shor', json={'digits': e['digits']}).get_json(); print(s.get('plaintext') == t, s.get('error'))"` → `True None`
  - Syntax: `python -m py_compile app.py rsa_toy.py shor_local.py` and `node --check static/app.js`

## Windows Encoding
- On this Windows setup Python defaults to cp1252. When stdout is redirected or captured (pipes, log files, background starts), `print()` of Hebrew raises `UnicodeEncodeError` and `python app.py` dies at startup. Set `PYTHONUTF8=1` for those runs.

## Architecture
- `rsa_toy.py`: pure-Python toy RSA (N=15, E=3, no Qiskit). Each character maps to its alphabet index, is split into two digits, and each digit is encrypted on its own. Entry point: `encrypt_message()`.
- `shor_local.py`: Qiskit order-finding circuit for a=2 mod 15 on `AerSimulator`, then factors → `private_exponent` → `decrypt_digits` (imported from rsa_toy). Entry point: `run_shor()`.
- `app.py`: Flask routes `/`, `POST /api/encrypt`, `POST /api/shor`. Frontend is `templates/index.html` + `static/app.js` (vanilla JS, no build step).
- Import direction is app → shor_local → rsa_toy. rsa_toy must never import shor_local (circular).

## Hard Constraints
- Local only. Never add IBM Quantum calls or `qiskit_ibm_runtime` imports to app code; the UI promises no contact with IBM. `shors-algorithm.ipynb` is reference material with IBM Runtime cells that need credentials, and nothing at runtime depends on it.
- The circuit is hand-built for N=15, a=2. `build_order_finding_circuit()` applies only multipliers 2 and 4 and silently skips any other value. Changing N, A, or TARGET_QUBITS requires rewriting the gates.
- Bind only to 127.0.0.1 (project security rule). Never 0.0.0.0.
- Results are deterministic (fixed seed: `AerSimulator(seed_simulator=15)`). Retrying the same input gives the same result, so assert exact values.
- `.bob/mcp.json` contains a plaintext token header. Never copy its values into code or docs.

## Couplings That Break Silently
- `static/app.js` reads response keys by name (`digits`, `characters`, `attempts`, `plaintext`, `p`, `q`, `d`, `phi`, and others). Renaming a key in `encrypt_message` or `run_shor` breaks the UI with no Python error.
- `app.py` reads `rsa_toy.py` and `shor_local.py` from disk on every request (`_source()`) and shows them in the code modal. They must stay UTF-8, and their comments are student-facing, so write them in Hebrew.
- The 120-character limit and newline normalization are duplicated in `rsa_toy.encrypt_message`, `templates/index.html` (`maxlength`), and `static/app.js` (submit handler and counter). Keep them in sync.
- The allowed-character list appears in `index.html` (step 1 text) and in the `ToyRsaError` message in `rsa_toy.py`. `ALPHABET` order is fixed; asserts at import time enforce it.
- Estimate figures (for example `כ־10 בחזקת 15 שנים`) appear in both `index.html` and `renderCompare()` in `app.js`. Update both.
- Cache busting is manual: bump the `v=` query on `style.css` and `app.js` in `templates/index.html` after editing them.
- The "classical" step is a scripted animation with fixed text, not a computation. Step order is intentional: the Shor button enables only after the classical timer ends.

## Code Style
- Python: 4 spaces, double quotes, no type annotations. JS/HTML/CSS: 2 spaces.
- Language: UI text, Python comments and docstrings, and error messages are Hebrew. Identifiers, JSON keys, and log keys are English.
- Errors: `ToyRsaError` and `ShorFailed` carry student-facing Hebrew and map to HTTP 400 `{"error": ...}`. In `/api/shor`, any other exception is logged with `app.logger.exception` and returned as a generic 500 message. Never send raw exception text for other errors.
- Frontend DOM: never use `innerHTML`. Use `createElement` with `textContent`, or `addParagraph(parent, [{text}, {text, strong: true}])` from `app.js`. Format UI numbers with `toLocaleString("he-IL")`.
- Naming: HTML ids are kebab-case and `app.js` refs are camelCase (`#shor-btn` → `shorBtn`). CSS classes are kebab-case, colors are `:root` variables, and RTL layout uses logical properties (`border-inline-start`).
