# EFFL · The Estate Fantasy Football League

The permanent record, weekly ammunition, and draft night command center of the
Estate Fantasy Football League. Est. 2015 at The Estate, Tempe, Arizona.
Eight owners, eleven seasons, one Tally Statute.

Live site: https://moranteam.github.io/effl

## Stack (Estate Press v2.1)

- React + Vite SPA, light premium almanac design
- Face-forward command desk: avatars in tables, Shame Watch tiles, Rivalry of the Day, broadcast score bugs, PF bars, photo nav cards
- GitHub Pages deploys built `dist` via Actions
- `data/league-data.js` · ESPN generated stats (`LEAGUE`)
- `data/site-config.js` · curated lore, photos, motions, tally ledger (`SITE`)
- `src/model/league.js` · data load, tally override, search index, rivalry-of-day
- `src/main.jsx` · app shell and pages
- `src/styles.css` · Estate Press design system

## Public identity (fantasy aliases only)

Lop · Chen · Herm · Gov · The Professor · Rogue · Charlie · Gary · Perkins

Cleared nicknames render as secondary labels (for example "Answers to Bill").
Real surnames must never appear in the public UI or repo.

## Local development

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173/

## Production build

```bash
EFFL_BASE=/effl/ npm run build
```

Writes `dist/` with SPA `404.html` fallback, optimized assets, franchise and
trip photos, and alias-edition PDFs. Photo masters in `assets/raw-photos/`
are never copied into `dist`.

## Updating data

1. Rerun `tools/effl_history_export.py` against ESPN (local only).
2. Rerun `tools/transform_espn.py` to regenerate `data/league-data.js`.
3. Hand edit `data/site-config.js` for news, motions, prophecies, awards.
4. Add the season's last place finisher to `SITE.tallyLedger` (authority for ink).
5. `npm run build` and push `main`.

## House rules

- Stats only from `LEAGUE` / `SITE`
- Tally = worst regular season finish via `SITE.tallyLedger`
- McCockiner results hidden unless entered in config
- localStorage prefix: `effl_v1_`
- Keep `tools/`, `sources/`, and raw photo masters out of git

## Deploy

GitHub Actions builds and deploys `dist` through
`.github/workflows/deploy-pages.yml` on pushes to `main`.
