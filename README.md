# EFFL: The Estate Fantasy Football League

The permanent record, database, and hype engine of the Estate Fantasy Football
League. Est. 2015 at The Estate, Tempe, Arizona. Eight owners, eleven seasons,
one Tally Statute.

Live site: https://moranteam.github.io/effl

## Stack

Vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no npm.
Multi page architecture with shared css/, js/, and data/ layers.

- `data/league-data.js` exposes `const LEAGUE`: the single source of truth for
  every stat on the site (machine generated, do not hand edit). It is kept
  whitespace compact for load performance; if the transform emits pretty
  printed JSON, compact it before committing:
  `node -e "const fs=require('fs');const L=eval(fs.readFileSync('data/league-data.js','utf8')+'; LEAGUE');fs.writeFileSync('data/league-data.js','const LEAGUE = '+JSON.stringify(L)+';\n')"`
- `data/site-config.js` exposes `const SITE`: the curated content layer
  (news ticker, motions, prophecies, awards, transactions, McCockiner Cup)
- `js/app.js` builds the shared chrome (ticker, nav, footer) and computed
  utilities; `js/render.js` holds one renderer per page
- `css/styles.css` is the Primetime design system

The one permitted external runtime dependency is Leaflet (OpenStreetMap tiles)
on the McCockiner Cup page, loaded from unpkg with SRI and a graceful offline
fallback. Fonts load from Google Fonts.

## Updating after a season (or mid season week)

1. Rerun the export script against ESPN (`tools/effl_history_export.py`,
   local only, gitignored)
2. Rerun `tools/transform_espn.py` to regenerate `data/league-data.js`
3. Hand edit `data/site-config.js` for news items, motions, prophecies,
   awards, and announcements. Add the season's last place finisher to
   `tallyLedger`: it is the record of actual ink and overrides whatever
   the transform derives, per the Annotator's ruling of July 2026
4. Commit both data files. Every page recomputes from the data layer;
   no page markup needs to change

## House rules (enforced)

- No em dashes, en dashes, or hyphens used as dashes anywhere.
  Verify before every commit:
  `grep -rP "\x{2014}|\x{2013}" --include="*.html" --include="*.css" --include="*.js" .`
- Public files use fantasy aliases only. Real name mappings live in the
  gitignored `tools/` directory and nowhere else.
- Never hardcode a stat into HTML. Pages render from `LEAGUE` and `SITE`.
- Images are Higgsfield generated art or league photos, optimized via Pillow
  (max 1400px wide, JPEG quality 82 to 84, progressive), committed to
  `/assets/`. No hotlinking.
- Client side state uses the `effl_v1_` localStorage prefix.

## Local preview

    python3 -m http.server 8000

Then open http://localhost:8000

## Deploy

GitHub Pages serves the repo root from the `main` branch
(Settings, then Pages, then Deploy from a branch, `main`, `/ (root)`).

## Phases

- Phase 1 (done): full site, all pages, real data wired, placeholder gradient
  heroes, crest in nav
- Phase 2: Higgsfield hero art, franchise badges, OG share cards
- Phase 3: McCockiner Cup trip data and photos, trophy photography, sanitized
  Constitution and Minutes PDFs into /docs, launch
