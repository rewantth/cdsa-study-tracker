# Contributing

Thanks for helping. This is a small project with a few firm rules.

## Rules

- **Vanilla JS only.** No framework, no dependencies, no build tools beyond `src/build.py`.
- **Edit `src/`, never `index.html`.** Then rebuild and commit both:
  ```
  python3 src/build.py
  ```
  CI fails if the committed `index.html` does not match the sources.
- **No network.** The CSP forbids it and the tests check for it. No analytics, no accounts, no backend, no third-party fonts or scripts.
- **No HTB Academy course text.** Titles stay as they are, guides and hints are original. Do not paste lab write-ups or answers.
- **Do not claim lab links are verified.** Keep the "check before you rely on it" wording.
- **Keep saved data backward compatible.** Do not rename the `cdsa-tracker-v4` key or change the shape of existing fields; add new ones with safe defaults.
- **Accessibility.** Keyboard reachable, visible focus, text contrast at WCAG AA in light and dark, and respect `prefers-reduced-motion`.
- **No Hack The Box logos or artwork.** Colours and style only.

## Running the checks

`tests/e2e.js` uses Playwright with the Chrome or Edge you already have:

```
npm i playwright-core      # in any folder outside this project
NODE_PATH=<that folder>/node_modules node tests/e2e.js
```

Add a check to it when you add behaviour. Celebrations in particular must fire once, only on a real user action, never on load or restore.

## Privacy when you contribute

Do not commit backups, screenshots with personal notes, or anything from your own `localStorage`.
