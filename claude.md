# Claude Project Notes

This project is an unofficial Unearthed Festival 2026 companion app built as a single-page HTML experience.

## What it contains

- `index.html` — the main festival programme app
  - Grid, Timeline, Now & Next, and My Programme views
  - Search, day and stage filters
  - Save to localStorage and reminder scheduling
  - PWA manifest and inline service worker
- `claude.ai.session` — copied chat session history and development notes from Claude

## Purpose

The app is designed to let festival-goers browse acts, save favourites, and get reminders before selected performances. It also supports an optional calendar subscription flow via a worker URL placeholder.

## Notes

- The current version uses hard-coded schedule data in the `ACTS` array inside `index.html`.
- Stage colours and tag styling are driven by the `STAGE_COLOURS` object in the same file.
- Notification scheduling is based on the festival dates `19–21 June 2026`.
- The calendar subscription URL is a placeholder and requires a deployed worker at `WORKER_URL`.

## GitHub & Deployment

- Repository: `https://github.com/andyt/unearthed-festival-programme`
- Default branch: `main`
- Hosted on GitHub Pages at: `https://andyt.github.io/unearthed-festival-programme/`
- Deployment is automatic via `.github/workflows/pages.yml` on push to `main`
- Pages source is set to GitHub Actions (not branch/folder mode)
- `private/` and `assets/` directories are in `.gitignore` and not published

## Next steps

- Verify the schedule data against the official programme images or source.
- Update the calendar worker endpoint if shared calendar functionality is needed.
- Add any missing `Kids & Youth` or workshop data from the official schedule.
