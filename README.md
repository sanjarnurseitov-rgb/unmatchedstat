
# Unmatched Stats — Static project for GitHub Pages

This is a simple static project to collect and visualize match statistics for the board game Unmatched.
It is designed to be deployed to GitHub Pages (or any static host).

## File structure
- index.html — main page
- styles.css — styles
- script.js — client logic (saves to localStorage)
- data/heroes.json — list of heroes (editable)
- data/maps.json — list of maps (editable)

## How to deploy on GitHub Pages
1. Create a new public repository on GitHub.
2. Upload the files from this project to the root of the repository.
3. In repository Settings → Pages select branch `main` (or `gh-pages`) as source.
4. After a minute the site will be available at `https://<username>.github.io/<repo>/`

## Next steps (optional)
- Add server-side storage (Firebase / Supabase) to sync between devices.
- Add user accounts and multi-user stats.
- Add CSV export / import.

