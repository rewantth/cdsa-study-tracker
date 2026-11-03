# Security

## What this app is

A static, single-file study tracker. It has no server, no accounts, no analytics and makes no network requests. Everything you enter stays in your own browser (`localStorage`, key `cdsa-tracker-v4`).

## How it is hardened

- **Content-Security-Policy** (a `<meta>` tag written by `src/build.py`): `default-src 'none'`, `connect-src 'none'`, no frames, no forms, no `<base>`, no plugins, no `eval`. Inline script and style blocks are allowed only by their SHA-256 hash, so injected markup cannot run script.
- **No third-party requests.** No CDN, no web fonts, no trackers. System fonts are used.
- **Escaped output.** Everything that comes from saved data (notes, dates, ids) is HTML-escaped before it is rendered.
- **Hostile backups.** Restoring a backup validates its shape, drops unknown section ids and ignores `__proto__` style keys. `tests/e2e.js` restores a deliberately malicious backup and checks that nothing is injected or executed.
- **`rel="noopener"`** on every external link, plus `Referrer-Policy: no-referrer` via a meta tag.

## Limits you should know about

- **Browser storage is not encrypted.** Anyone with access to your browser profile can read your progress and notes. Do not put secrets (passwords, exam credentials, flags you are not allowed to share) in your notes.
- **Static hosting cannot set HTTP headers.** On GitHub Pages the CSP is delivered as a `<meta>` tag, which cannot express `frame-ancestors`. Another site could embed the page in a frame. The risk is low (there is nothing to click that spends money or sends data), but if you self-host behind your own server, add `Content-Security-Policy: frame-ancestors 'none'` and `X-Content-Type-Options: nosniff`.
- **Progress is per browser and per address.** Opening the file from a different path, or from a different site address, starts with empty progress. Use Settings, Download backup, to move or protect your data.

## Reporting a vulnerability

Please report privately, not in a public issue. On GitHub use **Security, Report a vulnerability** on this repository. Include the browser, the steps and what you saw. You will get a reply as soon as the maintainer can, and a fix will be credited unless you prefer otherwise.

If you fork and host this yourself, keep `src/build.py`'s CSP step: it is what pins the allowed scripts.
