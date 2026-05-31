# Unearthed Festival 2026 Companion App

This repository contains an unofficial festival programme companion app for Unearthed 2026.

## Files

- `index.html` — main app entry point
- `.nojekyll` — ensures GitHub Pages serves the site without Jekyll processing
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow

## GitHub Pages setup

1. Push this repository to GitHub.
2. The Actions workflow deploys automatically on push to `main`.
3. The published site will be available at:
   `https://andyt.github.io/unearthed-festival-programme/`

## Local preview

Open `index.html` in a browser.

## Notes

- The app is fully static and does not require a build step.
- If you want to use the `Subscribe` calendar flow, replace the `WORKER_URL` placeholder in `app/unearthed-2026.html` with your deployed worker URL.
