import leagueRaw from "../../data/league-data.js?raw";
import siteRaw from "../../data/site-config.js?raw";

const parsedLeague = new Function(`${leagueRaw}; return LEAGUE;`)();
export const SITE = new Function(`${siteRaw}; return SITE;`)();

// Public display names: fantasy aliases only. Nicknames live as secondary labels.
export const ownerRegistry = {
  lop: {
    display: "Bill",
    slug: "lop",
    aliases: ["Lop", "Lord Blake", "Bill", "Lord", "Blaze"],
    photoKey: "lop"
  },
  chen: {
    display: "Glen",
    slug: "chen",
    aliases: ["Chen", "Glen", "Commish", "Coach Balls"],
    photoKey: "chen"
  },
  herm: {
    display: "Ski",
    slug: "herm",
    aliases: ["Herm", "Coach Ski", "Dpatt"],
    photoKey: "herm"
  },
  gov: {
    display: "Gov",
    slug: "gov",
    aliases: ["Gov", "Kris", "Gov's Office"],
    photoKey: "gov"
  },
  professor: {
    display: "Tav",
    slug: "professor",
    aliases: ["Tav", "The Professor", "Smith", "Go Dare", "Smith U", "Professor's Tavern"],
    photoKey: "professor"
  },
  rogue: {
    display: "Rogue",
    slug: "rogue",
    aliases: ["Rogue", "Mitch Rodgers", "McCray", "Roguey", "Go Pats"],
    photoKey: "rogue"
  },
  charlie: {
    display: "The Broker",
    slug: "charlie",
    aliases: ["Charlie", "Charles", "The Broker", "VP", "Matt Millen"],
    photoKey: "charlie"
  },
  gary: {
    display: "Gary",
    slug: "gary",
    aliases: ["Gary", "Gary's Grinders"],
    photoKey: "gary"
  },
  perkins: {
    display: "Perkins",
    slug: "perkins",
    aliases: ["Perkins", "Founding Seat"],
    photoKey: null
  }
};

export const activeOwners = ["lop", "chen", "herm", "gov", "professor", "rogue", "charlie", "gary"];
export const allOwners = [...activeOwners, "perkins"];

// Tally ledger of record: worst regular season finish, not consolation ladder.
const tallyLedger = SITE.tallyLedger || {
  2015: "professor",
  2016: "gov",
  2017: "gary",
  2018: "rogue",
  2019: "rogue",
  2020: "lop",
  2021: "professor",
  2022: "charlie",
  2023: "rogue",
  2024: "gov",
  2025: "rogue"
};

export const tallyLedgerPublic = tallyLedger;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const LEAGUE = clone(parsedLeague);
LEAGUE.seasons.forEach((season) => {
  if (tallyLedger[season.year]) season.tally = tallyLedger[season.year];
});
Object.keys(LEAGUE.owners).forEach((key) => {
  LEAGUE.owners[key].career.tallies = LEAGUE.seasons.filter((season) => season.tally === key).length;
});

export const seasonsAsc = LEAGUE.seasons.slice().sort((a, b) => a.year - b.year);
export const seasonsDesc = LEAGUE.seasons.slice().sort((a, b) => b.year - a.year);
export const years = seasonsAsc.map((season) => season.year);

export function asset(path) {
  const base = import.meta.env.BASE_URL || "./";
  const clean = String(path || "").replace(/^\//, "");
  if (base === "./" || base === ".") return `./${clean}`;
  return `${base.replace(/\/?$/, "/")}${clean}`;
}

export function getOwner(key) {
  const base = LEAGUE.owners[key] || {};
  const registry = ownerRegistry[key] || { display: key, aliases: [], slug: key };
  const photo = registry.photoKey ? SITE.franchisePhotos?.[registry.photoKey] : null;
  const nick = SITE.nicknames?.[key] || [];
  const favoriteNflTeam = SITE.favoriteNflTeams?.[key] || "TBD";
  const aliases = Array.from(new Set([...(registry.aliases || []), ...nick, ...(base.aliases || [])]));
  return {
    ...base,
    ...registry,
    aliases,
    favoriteNflTeam,
    photo
  };
}

export function ownerName(key) {
  return getOwner(key).display;
}

export function ownerSlug(key) {
  return getOwner(key).slug;
}

export function slugToOwner(slug) {
  return Object.keys(ownerRegistry).find((key) => ownerRegistry[key].slug === slug) || null;
}

export function getSeason(year) {
  return LEAGUE.seasons.find((season) => season.year === Number(year));
}

export function championTeam(season) {
  return season.teams.find((team) => team.owner === season.champion);
}

export function ownerTeam(ownerKey, year) {
  const team = getSeason(year)?.teams.find((t) => t.owner === ownerKey);
  return sanitizeText(team?.team || getOwner(ownerKey).franchise_2025 || ownerName(ownerKey));
}

export function rec(row) {
  return `${row.w}-${row.l}${row.t ? `-${row.t}` : ""}`;
}

export function careerRecord(ownerKey) {
  const c = getOwner(ownerKey).career;
  return `${c.w}-${c.l}${c.t ? `-${c.t}` : ""}`;
}

export function fmtPts(value) {
  return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function fmtPct(w, l, t = 0) {
  const total = w + l + t;
  if (!total) return ".000";
  const p = (w + t * 0.5) / total;
  return p >= 1 ? "1.000" : p.toFixed(3).replace(/^0/, "");
}

export function h2hRecord(a, b) {
  return LEAGUE.h2h[a]?.[b] || { w: 0, l: 0, t: 0 };
}

export function rivalGames(a, b) {
  return LEAGUE.matchups.filter((game) => (game.a === a && game.b === b) || (game.a === b && game.b === a));
}

export function ownerGames(ownerKey) {
  return LEAGUE.matchups.map((game) => {
    if (game.a === ownerKey) {
      return { raw: game, pts: game.a_pts, opp: game.b, won: game.a_pts > game.b_pts, year: game.year, week: game.week };
    }
    if (game.b === ownerKey) {
      return { raw: game, pts: game.b_pts, opp: game.a, won: game.b_pts > game.a_pts, year: game.year, week: game.week };
    }
    return null;
  }).filter(Boolean);
}

export function sortOwnersByTitles() {
  return activeOwners.slice().sort((a, b) => getOwner(b).career.titles - getOwner(a).career.titles || getOwner(b).career.w - getOwner(a).career.w);
}

export function sortOwnersByTallies() {
  return activeOwners.slice().sort((a, b) => getOwner(b).career.tallies - getOwner(a).career.tallies || getOwner(a).display.localeCompare(getOwner(b).display));
}

export function talliesByOwner(ownerKey) {
  return Object.entries(tallyLedger)
    .filter(([, key]) => key === ownerKey)
    .map(([year]) => Number(year))
    .sort((a, b) => a - b);
}

export function currentHistory(count = 4) {
  const now = new Date();
  // Rough NFL week proxy outside season falls back to high scoring history slices.
  const month = now.getMonth() + 1;
  const currentWeek = month >= 9 ? Math.min(17, Math.max(1, (month - 8) * 4 + Math.ceil(now.getDate() / 8))) : 1;
  const games = LEAGUE.matchups
    .filter((game) => game.week === currentWeek)
    .sort((a, b) => Math.abs(b.a_pts - b.b_pts) - Math.abs(a.a_pts - a.b_pts))
    .slice(0, count);
  if (games.length) return { week: currentWeek, games };
  return {
    week: currentWeek,
    games: LEAGUE.records.top_weeks.slice(0, count).map((row) => ({
      year: row.year,
      week: row.week,
      playoff: false,
      a: row.owner,
      a_pts: row.pts,
      b: row.owner,
      b_pts: 0,
      _synthetic: true
    }))
  };
}

// Strip real surnames and first names that should not appear publicly.
// Do not rename public aliases to alternate nicknames.
const replacements = [
  [/\bTeam Moran\b/gi, "Team The Broker"],
  [/\bChen\b/g, "Glen"],
  [/\bHerm\b/g, "Ski"],
  [/\bThe Professor\b/g, "Tav"],
  [/\bProfessor\b/g, "Tav"],
  [/\bLop\b/g, "Bill"],
  [/\bMoran\b/gi, "The Broker"],
  [/\bLord Blake\b/g, "Bill"],
  [/\bBlake\b/g, "Bill"],
  [/\bDylan\b/g, "Ski"],
  [/\bMitch Rodgers\b/g, "Rogue"],
  [/\bMitch\b/g, "Rogue"],
  [/\bKris\b/g, "Gov"],
  [/\bCharles\b/g, "The Broker"],
  [/\bCharlie\b/g, "The Broker"]
];

export function sanitizeText(value) {
  if (value == null) return "";
  let out = String(value);
  replacements.forEach(([pattern, replacement]) => {
    out = out.replace(pattern, replacement);
  });
  return out;
}

function searchItems() {
  const items = [];
  allOwners.forEach((key) => {
    const owner = getOwner(key);
    items.push({
      type: "Owner",
      title: ownerName(key),
      description: `${careerRecord(key)} career record, ${owner.career.titles} titles, ${owner.career.tallies} tallies, NFL: ${owner.favoriteNflTeam}`,
      keywords: `${owner.aliases.join(" ")} ${owner.favoriteNflTeam}`,
      path: `/owners/${ownerSlug(key)}`
    });
  });
  LEAGUE.seasons.forEach((season) => {
    items.push({
      type: "Season",
      title: `${season.year} Season`,
      description: `Champion ${ownerName(season.champion)}, Tally ${ownerName(season.tally)}`,
      keywords: `${ownerName(season.runner_up)} ${season.teams.map((team) => sanitizeText(team.team)).join(" ")}`,
      path: `/seasons/${season.year}`
    });
  });
  LEAGUE.records.top_weeks.slice(0, 12).forEach((row) => {
    items.push({
      type: "Record",
      title: `${ownerName(row.owner)} ${fmtPts(row.pts)} points`,
      description: `All-time top week, ${row.year} Week ${row.week}`,
      keywords: "highest week top score record",
      path: "/records"
    });
  });
  // Index a sampled set of matchups so search stays snappy.
  LEAGUE.matchups.filter((_, index) => index % 8 === 0).forEach((game) => {
    items.push({
      type: "Matchup",
      title: `${ownerName(game.a)} ${fmtPts(game.a_pts)} vs ${ownerName(game.b)} ${fmtPts(game.b_pts)}`,
      description: `${game.year} Week ${game.week}${game.playoff ? " playoff" : ""}`,
      keywords: `${ownerName(game.a)} ${ownerName(game.b)} rivalry game`,
      path: `/seasons/${game.year}`
    });
  });
  LEAGUE.seasons.forEach((season) => {
    season.draft.filter((pick) => pick.rd <= 3).forEach((pick) => {
      items.push({
        type: "Draft",
        title: `${sanitizeText(pick.player)} · Pick ${pick.pk}`,
        description: `${season.year} round ${pick.rd}, ${ownerName(pick.owner)}`,
        keywords: "draft pick board keeper",
        path: `/seasons/${season.year}`
      });
    });
  });
  SITE.motions.forEach((motion) => {
    items.push({
      type: "Motion",
      title: `${motion.id}: ${sanitizeText(motion.title)}`,
      description: sanitizeText(motion.summary),
      keywords: `${motion.status} governance vote rule law`,
      path: "/law"
    });
  });
  SITE.mccockner.trips.forEach((trip) => {
    items.push({
      type: "McCockiner",
      title: `${trip.year}: ${sanitizeText(trip.location)}`,
      description: sanitizeText(trip.legend),
      keywords: `${(trip.courses || []).map(sanitizeText).join(" ")} golf trip draft`,
      path: "/mccockiner"
    });
  });
  [
    ["Constitution", "The law of the league", "/law"],
    ["Official Minutes", "July 21 2025 Assembly session", "/law"],
    ["Tally Wall", "Official shame ledger and proof of ink", "/tally"],
    ["Trophy Room", "Champions and hardware", "/trophy"],
    ["Power Index", "Elo, all-play, luck", "/power"],
    ["Awards", "Computed and curated superlatives", "/law"],
    ["Transactions", "Hall of fame and shame case files", "/law"],
    ["Prophecies", "Sealed predictions and verdicts", "/draft"],
    ["Draft Central", "Countdown, keepers, boards", "/draft"]
  ].forEach(([title, description, path]) => {
    items.push({ type: "Page", title, description, keywords: title, path });
  });
  return items;
}

export const searchIndex = searchItems();
