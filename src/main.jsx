import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Archive, ArrowRight, CalendarDays, Clock, Crown, FileText, Gavel, Home, Landmark, LineChart, Menu, Search, Shield, Swords, Trophy, Users, X } from "lucide-react";
import {
  LEAGUE,
  SITE,
  activeOwners,
  allOwners,
  asset,
  careerRecord,
  championTeam,
  currentHistory,
  fmtPct,
  fmtPts,
  getOwner,
  getSeason,
  h2hRecord,
  ownerGames,
  ownerName,
  ownerSlug,
  ownerTeam,
  rec,
  rivalGames,
  sanitizeText,
  seasonsAsc,
  seasonsDesc,
  searchIndex,
  slugToOwner,
  sortOwnersByTitles,
  tallyLedgerPublic,
  years
} from "./model/league.js";
import "./styles.css";

const routes = [
  { path: "/", label: "Command", icon: Home },
  { path: "/owners", label: "Owners", icon: Users },
  { path: "/seasons", label: "Seasons", icon: CalendarDays },
  { path: "/records", label: "Records", icon: Trophy },
  { path: "/h2h", label: "H2H", icon: Swords },
  { path: "/draft", label: "Draft", icon: Clock },
  { path: "/power", label: "Power", icon: LineChart },
  { path: "/governance", label: "Governance", icon: Landmark },
  { path: "/archive", label: "Archive", icon: Archive },
  { path: "/mccockiner", label: "McCockiner", icon: Shield },
  { path: "/trophy", label: "Trophy", icon: Crown }
];

function pathNow() {
  const base = import.meta.env.BASE_URL === "./" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");
  let path = window.location.pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length);
  return path || "/";
}

function navigate(path) {
  const base = import.meta.env.BASE_URL === "./" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");
  window.history.pushState({}, "", base + path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function App() {
  const [path, setPath] = useState(pathNow());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onPop = () => setPath(pathNow());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (event.key === "/" && tag !== "input" && tag !== "textarea" && tag !== "select") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const page = renderPage(path, () => setSearchOpen(true));

  return (
    <div className="app-shell">
      <TopTicker />
      <Header
        path={path}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        openSearch={() => setSearchOpen(true)}
      />
      <main>{page}</main>
      <SiteFooter />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function renderPage(path, openSearch) {
  if (path.startsWith("/owners/")) return <OwnerDetail ownerKey={slugToOwner(path.split("/").pop())} />;
  if (path.startsWith("/seasons/")) return <SeasonDetail year={Number(path.split("/").pop())} />;
  if (path === "/owners") return <OwnersPage />;
  if (path === "/seasons") return <SeasonsPage />;
  if (path === "/records") return <RecordsPage />;
  if (path === "/h2h") return <H2HPage />;
  if (path === "/draft") return <DraftPage />;
  if (path === "/power") return <PowerPage />;
  if (path === "/governance") return <GovernancePage />;
  if (path === "/archive") return <ArchivePage />;
  if (path === "/mccockiner") return <MccockinerPage />;
  if (path === "/trophy") return <TrophyPage />;
  return <CommandCenter openSearch={openSearch} />;
}

function TopTicker() {
  const record = LEAGUE.records.top_weeks[0];
  const items = [
    "EFFL record is live",
    `${ownerName(record.owner)} holds the all-time single week at ${fmtPts(record.pts)}`,
    `Current champion: ${ownerName(seasonsDesc[0].champion)}`,
    `Tally of record: ${ownerName(seasonsDesc[0].tally)}, ${seasonsDesc[0].year}`,
    "McCockiner Cup archive open"
  ];
  return (
    <div className="top-ticker" aria-label="League ticker">
      <div className="ticker-track">
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`}>
            <b>EFFL</b> {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Header({ path, menuOpen, setMenuOpen, openSearch }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => navigate("/")} aria-label="EFFL Command Center">
        <img src={asset("assets/EFFL_Crest.png")} alt="" />
        <span>
          <small>The Estate</small>
          <strong>EFFL</strong>
        </span>
      </button>
      <nav className="desktop-nav" aria-label="Primary">
        {routes.slice(0, 9).map((route) => (
          <NavButton key={route.path} route={route} active={path === route.path || (route.path !== "/" && path.startsWith(route.path))} />
        ))}
      </nav>
      <div className="header-actions">
        <button className="search-trigger" onClick={openSearch}>
          <Search size={17} />
          <span>Search the record</span>
          <kbd>/</kbd>
        </button>
        <button className="icon-button mobile-only" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile">
          {routes.map((route) => (
            <NavButton key={route.path} route={route} active={path === route.path || (route.path !== "/" && path.startsWith(route.path))} />
          ))}
        </nav>
      )}
    </header>
  );
}

function NavButton({ route, active }) {
  const Icon = route.icon;
  return (
    <button className={active ? "nav-link active" : "nav-link"} onClick={() => navigate(route.path)}>
      <Icon size={15} />
      <span>{route.label}</span>
    </button>
  );
}

function CommandCenter({ openSearch }) {
  const latest = seasonsDesc[0];
  const standings = latest.teams.slice().sort((a, b) => a.finish - b.finish);
  const titleLeaders = sortOwnersByTitles().slice(0, 4);
  const twih = currentHistory(4);

  return (
    <div className="page home-page">
      <section className="home-showcase">
        <div className="showcase-media">
          <img src={asset(heroPhoto(0))} alt="" />
          <img src={asset(heroPhoto(1))} alt="" />
          <img src={asset(heroPhoto(2))} alt="" />
          <img src={asset(heroPhoto(3))} alt="" />
        </div>
        <div className="showcase-scrim" />
        <div className="showcase-content">
          <div className="showcase-kicker">
            <span>Estate Fantasy Football League</span>
            <b>Living archive since 2015</b>
          </div>
          <div>
            <h1>The permanent record, finally built like the record matters.</h1>
            <p>Owner dossiers, season covers, Tally rulings, McCockiner trip evidence, and every searchable argument-ending stat in one official league database.</p>
          </div>
          <div className="showcase-actions">
            <button className="hero-search" onClick={openSearch}>
              <Search size={20} />
              <span>Search owners, records, seasons, draft picks, rulings, trips...</span>
              <kbd>/</kbd>
            </button>
            <button className="hero-link" onClick={() => navigate("/archive")}>Open the archive <ArrowRight size={16} /></button>
          </div>
        </div>
        <div className="showcase-ledger">
          <Metric label={`${latest.year} Champion`} value={ownerName(latest.champion)} sub={championTeam(latest)?.team} />
          <Metric label="Tally Of Record" value={ownerName(latest.tally)} sub={`${latest.year} official ledger`} />
          <Metric label="Games Indexed" value={LEAGUE.matchups.length} sub="Regular season and playoffs" />
        </div>
      </section>

      <section className="evidence-strip">
        <button onClick={() => navigate("/owners")}>
          <span>Owner Registry</span>
          <strong>{activeOwners.length} active dossiers</strong>
        </button>
        <button onClick={() => navigate("/seasons")}>
          <span>Season Covers</span>
          <strong>{years[0]}-{latest.year}</strong>
        </button>
        <button onClick={() => navigate("/mccockiner")}>
          <span>McCockiner Cup</span>
          <strong>{SITE.mccockner.trips.length} trip chapters</strong>
        </button>
        <button onClick={() => navigate("/governance")}>
          <span>Official Tally</span>
          <strong>Ledger authoritative</strong>
        </button>
      </section>

      <section className="dashboard-grid premium-grid">
        <Panel title="Latest Standings" action={`${latest.year} season`} onAction={() => navigate(`/seasons/${latest.year}`)}>
          <div className="standings-feature">
            <img src={asset(seasonCover(latest))} alt="" />
            <CompactTable
              columns={["#", "Owner", "W-L", "PF"]}
              rows={standings.map((team) => [
                team.finish,
                ownerName(team.owner),
                rec(team),
                fmtPts(team.pf)
              ])}
            />
          </div>
        </Panel>
        <Panel title="Owner Board" action="All owners" onAction={() => navigate("/owners")}>
          <div className="owner-strip portrait-strip">
            {activeOwners.map((key) => (
              <OwnerMini key={key} ownerKey={key} />
            ))}
          </div>
        </Panel>
        <Panel title="Dynasty Watch" action="Records" onAction={() => navigate("/records")}>
          <div className="rank-list">
            {titleLeaders.map((key, index) => (
              <RankRow key={key} rank={index + 1} label={ownerName(key)} value={`${getOwner(key).career.titles} titles`} sub={`${getOwner(key).career.playoffs} playoff trips`} />
            ))}
          </div>
        </Panel>
        <Panel title="Official Rulings" action="Governance" onAction={() => navigate("/governance")}>
          <div className="ruling-list">
            {Object.entries(tallyLedgerPublic).slice(-4).reverse().map(([year, key]) => (
              <div className="ruling-row" key={year}>
                <Gavel size={17} />
                <span>{year} Tally</span>
                <strong>{ownerName(key)}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="split-layout">
        <Panel title="This Week In EFFL History" action="Season archive" onAction={() => navigate("/seasons")}>
          <div className="record-grid">
            {twih.games.map((game) => (
              <GameCard key={`${game.year}-${game.week}-${game.a}-${game.b}`} game={game} />
            ))}
          </div>
        </Panel>
        <Panel title="Top Receipts" action="Archive" onAction={() => navigate("/archive")}>
          <ArchiveRail />
        </Panel>
      </section>
    </div>
  );
}

function OwnersPage() {
  return (
    <PageFrame eyebrow="Registry" title="Owner Dossiers" intro="Eight active owners, one legacy seat, and every season of evidence behind them.">
      <section className="owner-ledger-intro">
        <div>
          <span>Public record protocol</span>
          <strong>Approved names lead. Historic aliases stay searchable.</strong>
        </div>
        <p>These files use the official public owner names while keeping the old labels in the archive index for receipts, draft boards, and arguments from previous eras.</p>
      </section>
      <div className="owner-grid dossier-grid">
        {activeOwners.map((key) => (
          <OwnerCard key={key} ownerKey={key} />
        ))}
      </div>
      <Panel title="Legacy Seat">
        <OwnerCard ownerKey="perkins" compact />
      </Panel>
    </PageFrame>
  );
}

function OwnerDetail({ ownerKey }) {
  const key = ownerKey || activeOwners[0];
  const owner = getOwner(key);
  const games = ownerGames(key);
  const best = games.slice().sort((a, b) => b.pts - a.pts)[0];
  const heartbreak = games.filter((g) => !g.won).sort((a, b) => b.pts - a.pts)[0];
  const yearsPlayed = seasonsAsc.filter((season) => season.teams.some((team) => team.owner === key));
  const rivals = allOwners
    .filter((other) => other !== key)
    .map((other) => ({ key: other, ...h2hRecord(key, other) }))
    .filter((r) => r.w + r.l + r.t > 0)
    .sort((a, b) => b.w - a.w);

  return (
    <PageFrame eyebrow="Owner File" title={ownerName(key)} intro={`${careerRecord(key)} career record. ${owner.career.titles} titles, ${owner.career.tallies} tallies, ${owner.career.playoffs} playoff appearances.`}>
      <section className="profile-hero dossier-hero">
        <div className="profile-photo">
          {owner.photo ? <img src={asset(owner.photo.src)} alt={owner.photo.alt} style={{ objectPosition: owner.photo.pos }} /> : <Shield size={54} />}
        </div>
        <div className="dossier-copy">
          <span className="eyebrow">Franchise dossier</span>
          <h2>{ownerName(key)}</h2>
          <p>{owner.career.titles ? "A title-bearing file with enough evidence to enter every debate armed." : "A volatile file: part standings evidence, part future discovery request."}</p>
          <div className="alias-line">
            <span>Archive aliases</span>
            <strong>{owner.aliases.filter((name) => name !== ownerName(key)).slice(0, 5).join(" / ") || "None"}</strong>
          </div>
          <div className="alias-line nfl-line">
            <span>Favorite NFL team</span>
            <strong>{owner.favoriteNflTeam}</strong>
          </div>
          <div className="profile-stats">
            <Metric label="Career W-L" value={careerRecord(key)} sub={`${fmtPct(owner.career.w, owner.career.l, owner.career.t)} win pct`} />
            <Metric label="Points For" value={fmtPts(owner.career.pf)} sub={`${owner.career.seasons} seasons`} />
            <Metric label="Best Finish" value={ordinal(owner.career.best)} sub={`Worst: ${ordinal(owner.career.worst)}`} />
            <Metric label="Titles / Tallies" value={`${owner.career.titles} / ${owner.career.tallies}`} sub="Official record" />
          </div>
        </div>
      </section>
      <section className="dashboard-grid">
        <Panel title="Finish Timeline">
          <FinishTimeline ownerKey={key} />
        </Panel>
        <Panel title="Rivalry Ledger">
          <div className="rank-list">
            {rivals.slice(0, 6).map((rival, index) => (
              <RankRow key={rival.key} rank={index + 1} label={ownerName(rival.key)} value={`${rival.w}-${rival.l}${rival.t ? `-${rival.t}` : ""}`} sub={`${rival.w + rival.l + rival.t} meetings`} />
            ))}
          </div>
        </Panel>
        <Panel title="Signature Games">
          <div className="record-grid">
            {best && <GameCard game={best.raw} label="Highest Score" ownerKey={key} />}
            {heartbreak && <GameCard game={heartbreak.raw} label="Worst Beat" ownerKey={key} />}
          </div>
        </Panel>
        <Panel title="Season File">
          <div className="chip-cloud">
            {yearsPlayed.map((season) => (
              <button className="year-chip" key={season.year} onClick={() => navigate(`/seasons/${season.year}`)}>
                {season.year}
              </button>
            ))}
          </div>
        </Panel>
      </section>
    </PageFrame>
  );
}

function SeasonsPage() {
  return (
    <PageFrame eyebrow="Almanac" title="Seasons" intro="Every campaign since 2015, with standings, champions, draft boards, playoff results, and weekly matchups.">
      <div className="season-grid cover-grid">
        {seasonsDesc.map((season) => (
          <button className="season-tile season-cover" key={season.year} onClick={() => navigate(`/seasons/${season.year}`)}>
            <img src={asset(seasonCover(season))} alt="" />
            <span>{season.year}</span>
            <strong>{ownerName(season.champion)}</strong>
            <small>{sanitizeText(championTeam(season)?.team)}</small>
            <i>Tally: {ownerName(season.tally)}</i>
          </button>
        ))}
      </div>
    </PageFrame>
  );
}

function SeasonDetail({ year }) {
  const season = getSeason(year) || seasonsDesc[0];
  const standings = season.teams.slice().sort((a, b) => a.finish - b.finish);
  const weeks = Array.from(new Set(LEAGUE.matchups.filter((game) => game.year === season.year).map((game) => game.week))).sort((a, b) => a - b);
  const firstDraftRounds = season.draft.filter((pick) => pick.rd <= 3);
  return (
    <PageFrame eyebrow="Season File" title={`${season.year} Season`} intro={`${ownerName(season.champion)} won the title. ${ownerName(season.runner_up)} finished runner up. ${ownerName(season.tally)} holds the Tally of record.`}>
      <section className="triple-card">
        <Metric label="Champion" value={ownerName(season.champion)} sub={championTeam(season)?.team} />
        <Metric label="Runner Up" value={ownerName(season.runner_up)} sub={ownerTeam(season.runner_up, season.year)} />
        <Metric label="Tally" value={ownerName(season.tally)} sub="Official ledger" />
      </section>
      <section className="dashboard-grid">
        <Panel title="Final Standings">
          <ResponsiveTable>
            <thead><tr><th>Finish</th><th>Owner</th><th>Franchise</th><th>Seed</th><th>W</th><th>L</th><th>PF</th><th>PA</th></tr></thead>
            <tbody>
              {standings.map((team) => (
                <tr key={team.owner}>
                  <td>{team.finish}</td><td>{ownerName(team.owner)}</td><td>{sanitizeText(team.team)}</td><td>{team.seed || ""}</td><td>{team.w}</td><td>{team.l}</td><td>{fmtPts(team.pf)}</td><td>{fmtPts(team.pa)}</td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </Panel>
        <Panel title="Draft Board: Opening Rounds">
          <CompactTable
            columns={["Pick", "Round", "Player", "Owner"]}
            rows={firstDraftRounds.map((pick) => [pick.pk, pick.rd, sanitizeText(pick.player), ownerName(pick.owner)])}
          />
        </Panel>
        <Panel title="Weekly Matchups">
          <div className="chip-cloud">
            {weeks.map((week) => (
              <span className="year-chip muted" key={week}>Week {week}</span>
            ))}
          </div>
          <div className="record-grid mt">
            {LEAGUE.matchups.filter((game) => game.year === season.year).slice(0, 8).map((game) => (
              <GameCard key={`${game.week}-${game.a}-${game.b}`} game={game} />
            ))}
          </div>
        </Panel>
      </section>
    </PageFrame>
  );
}

function RecordsPage() {
  const R = LEAGUE.records;
  return (
    <PageFrame eyebrow="Chiseled" title="Records" intro="Career tables, all-time explosions, robberies, heartbreaks, blowouts, and the evidence needed to end the argument.">
      <Panel title="Career Table">
        <ResponsiveTable>
          <thead><tr><th>Owner</th><th>W</th><th>L</th><th>Pct</th><th>PF</th><th>Titles</th><th>Tallies</th><th>Playoffs</th><th>Best</th></tr></thead>
          <tbody>
            {allOwners.map((key) => {
              const c = getOwner(key).career;
              return <tr key={key}><td>{ownerName(key)}</td><td>{c.w}</td><td>{c.l}</td><td>{fmtPct(c.w, c.l, c.t)}</td><td>{fmtPts(c.pf)}</td><td>{c.titles}</td><td>{c.tallies}</td><td>{c.playoffs}</td><td>{ordinal(c.best)}</td></tr>;
            })}
          </tbody>
        </ResponsiveTable>
      </Panel>
      <section className="dashboard-grid">
        <RecordPanel title="Highest Weeks" rows={R.top_weeks} render={(row) => [ownerName(row.owner), fmtPts(row.pts), `${row.year} W${row.week}`]} />
        <RecordPanel title="Lowest Weeks" rows={R.low_weeks} render={(row) => [ownerName(row.owner), fmtPts(row.pts), `${row.year} W${row.week}`]} />
        <RecordPanel title="Heartbreaks" rows={R.heartbreaks} render={(row) => [ownerName(row.owner), `${fmtPts(row.pts)} loss`, `${row.year} W${row.week}`]} />
        <RecordPanel title="Robberies" rows={R.robberies} render={(row) => [ownerName(row.owner), `${fmtPts(row.pts)} win`, `${row.year} W${row.week}`]} />
        <Panel title="Biggest Blowouts">
          <div className="rank-list">
            {R.blowouts.slice(0, 8).map((game, index) => (
              <RankRow key={`${game.year}-${game.week}-${game.a}`} rank={index + 1} label={`${ownerName(game.a)} vs ${ownerName(game.b)}`} value={fmtPts(Math.abs(game.a_pts - game.b_pts))} sub={`${game.year} Week ${game.week}`} />
            ))}
          </div>
        </Panel>
        <Panel title="Best PF Seasons">
          <div className="rank-list">
            {R.best_pf_seasons.slice(0, 8).map((row, index) => (
              <RankRow key={`${row.year}-${row.owner}`} rank={index + 1} label={`${ownerName(row.owner)}, ${row.year}`} value={fmtPts(row.pf)} sub={sanitizeText(row.team)} />
            ))}
          </div>
        </Panel>
      </section>
    </PageFrame>
  );
}

function H2HPage() {
  const [active, setActive] = useState([activeOwners[0], activeOwners[1]]);
  const a = active[0] || activeOwners[0];
  const b = active[1] || activeOwners[1];
  const details = rivalGames(a, b).slice().sort((x, y) => y.year - x.year || y.week - x.week);
  return (
    <PageFrame eyebrow="Rivalry Desk" title="Head To Head" intro="Every owner matchup, all-time record, last meeting, and rivalry receipt in one place.">
      <div className="h2h-layout">
        <div className="matrix-card">
          <table className="h2h-table">
            <thead><tr><th></th>{activeOwners.map((key) => <th key={key}>{ownerName(key)}</th>)}</tr></thead>
            <tbody>
              {activeOwners.map((row) => (
                <tr key={row}>
                  <th>{ownerName(row)}</th>
                  {activeOwners.map((col) => {
                    if (row === col) return <td key={col} className="dead-cell">-</td>;
                    const r = h2hRecord(row, col);
                    return <td key={col}><button className={a === row && b === col ? "matrix-cell active" : "matrix-cell"} onClick={() => setActive([row, col])}>{r.w}-{r.l}{r.t ? `-${r.t}` : ""}</button></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Panel title={`${ownerName(a)} vs ${ownerName(b)}`}>
          <div className="triple-stat small">
            <Metric label={ownerName(a)} value={h2hRecord(a, b).w} sub="wins" />
            <Metric label={ownerName(b)} value={h2hRecord(a, b).l} sub="wins" />
            <Metric label="Meetings" value={details.length} sub={`${details.filter((g) => g.playoff).length} playoffs`} />
          </div>
          <div className="record-grid mt">
            {details.slice(0, 6).map((game) => <GameCard key={`${game.year}-${game.week}-${game.a}-${game.b}`} game={game} />)}
          </div>
        </Panel>
      </div>
    </PageFrame>
  );
}

function DraftPage() {
  const [round, setRound] = useState(() => localStorage.getItem("effl_v2_keeper_round") || "6");
  const [yearsKept, setYearsKept] = useState(() => localStorage.getItem("effl_v2_keeper_years") || "1");
  useEffect(() => {
    localStorage.setItem("effl_v2_keeper_round", round);
    localStorage.setItem("effl_v2_keeper_years", yearsKept);
  }, [round, yearsKept]);
  const owed = keeperCost(round, Number(yearsKept));
  return (
    <PageFrame eyebrow="League Ops" title="Draft Central" intro="Keeper calculator, draft archive, countdown, and the living slot for weekly draft operations.">
      <section className="dashboard-grid">
        <Panel title="2026 Draft Clock">
          <Countdown iso={SITE.draftDate2026} />
        </Panel>
        <Panel title="Keeper Cost Calculator">
          <div className="form-grid">
            <label>Original round<select value={round} onChange={(e) => setRound(e.target.value)}><option value="FA">Free Agent</option>{Array.from({ length: 16 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
            <label>Consecutive years<select value={yearsKept} onChange={(e) => setYearsKept(e.target.value)}>{[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          </div>
          <div className="result-box">
            <span>Pick owed</span>
            <strong>{owed}</strong>
          </div>
        </Panel>
        <Panel title="Recent Draft Boards">
          <div className="rank-list">
            {seasonsDesc.slice(0, 5).map((season) => (
              <RankRow key={season.year} rank={season.year} label={`${season.draft.length} picks`} value={ownerName(season.champion)} sub="champion that year" />
            ))}
          </div>
        </Panel>
      </section>
    </PageFrame>
  );
}

function PowerPage() {
  const R = LEAGUE.records;
  const elo = allOwners.slice().sort((a, b) => R.elo_final[b] - R.elo_final[a]);
  const luck = activeOwners.slice().sort((a, b) => R.allplay_luck[b].luck - R.allplay_luck[a].luck);
  return (
    <PageFrame eyebrow="Analytics" title="Power Index" intro="Elo, all-play, and luck metrics translated into league-table evidence.">
      <section className="dashboard-grid">
        <Panel title="Career Elo">
          <div className="rank-list">{elo.map((key, index) => <RankRow key={key} rank={index + 1} label={ownerName(key)} value={R.elo_final[key]} sub="rating" />)}</div>
        </Panel>
        <Panel title="Luck Index">
          <div className="bar-list">
            {luck.map((key) => {
              const value = R.allplay_luck[key].luck;
              return <div className="bar-row" key={key}><span>{ownerName(key)}</span><div><i style={{ width: `${Math.min(100, Math.abs(value) * 8)}%` }} className={value >= 0 ? "lucky" : "unlucky"} /></div><strong>{value > 0 ? "+" : ""}{value}</strong></div>;
            })}
          </div>
        </Panel>
        <Panel title="All-Play Standings">
          <CompactTable columns={["Owner", "All-Play", "Expected W"]} rows={activeOwners.map((key) => [ownerName(key), `${R.allplay_luck[key].allplay_w}-${R.allplay_luck[key].allplay_l}`, R.allplay_luck[key].expected_w])} />
        </Panel>
      </section>
    </PageFrame>
  );
}

function GovernancePage() {
  return (
    <PageFrame eyebrow="Record Of Law" title="Governance" intro="Constitution, minutes, motions, prophecies, transaction case files, and official league rulings.">
      <section className="dashboard-grid">
        <Panel title="Official Documents">
          <div className="doc-grid">
            <DocLink title="EFFL Constitution" href={asset("docs/EFFL_Constitution.pdf")} />
            <DocLink title="Official Minutes, July 21 2025" href={asset("docs/EFFL_Official_Minutes_7-21-25.pdf")} />
          </div>
        </Panel>
        <Panel title="Motions">
          <div className="motion-list">
            {SITE.motions.map((motion) => (
              <div className="motion-row" key={motion.id}>
                <span className={`status ${motion.status.toLowerCase()}`}>{motion.status}</span>
                <strong>{motion.id}: {sanitizeText(motion.title)}</strong>
                <p>{sanitizeText(motion.summary)}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Prophecies">
          <div className="empty-card">{sanitizeText(SITE.propheciesNote)}</div>
        </Panel>
        <Panel title="Transactions And Awards">
          <div className="split-list">
            <EmptyState label="Awards" text="Curated Assembly awards are ready for entries." />
            <EmptyState label="Transactions" text="Fame and shame case files are ready for nominations." />
          </div>
        </Panel>
      </section>
    </PageFrame>
  );
}

function ArchivePage() {
  return (
    <PageFrame eyebrow="Curated Receipts" title="Archive" intro="The cleaned public archive: photos, PDFs, power rankings, draft artifacts, Tally proof, and trip records.">
      <section className="archive-wall">
        {(SITE.archiveFeatures?.archiveWall || []).map((src, index) => (
          <figure key={src} className={index % 5 === 0 ? "feature" : ""}>
            <img src={asset(src)} alt="" />
          </figure>
        ))}
      </section>
      <section className="dashboard-grid">
        <Panel title="Power Rankings, October 2022">
          <p className="archive-copy">The first EFFL power rankings committed to writing, preserved as a curated publication edition.</p>
          <button className="text-action" onClick={() => navigate("/records")}>Cross-check against the record <ArrowRight size={16} /></button>
        </Panel>
        <Panel title="Tally Proof">
          <div className="photo-pair">
            {(SITE.tallyProof || []).map((src) => <img key={src} src={asset(src)} alt="Tally proof of record" />)}
          </div>
        </Panel>
        <Panel title="McCockiner Cup">
          <ArchiveRail />
        </Panel>
        <Panel title="Share Cards">
          <div className="share-card-preview">
            <img src={asset("assets/EFFL_Crest.png")} alt="" />
            <span>EFFL Records</span>
            <strong>{ownerName(LEAGUE.records.top_weeks[0].owner)} · {fmtPts(LEAGUE.records.top_weeks[0].pts)}</strong>
          </div>
        </Panel>
      </section>
    </PageFrame>
  );
}

function MccockinerPage() {
  const mc = SITE.mccockner;
  return (
    <PageFrame eyebrow="Annual Trip Archive" title="McCockiner Cup" intro={sanitizeText(mc.origin)}>
      <section className="cup-hero">
        <img src={asset("assets/archive/streamsong-sunset-group.jpg")} alt="" />
        <div>
          <span className="eyebrow">Draft trip of record</span>
          <h2>{mc.name}</h2>
          <p>{sanitizeText(mc.format)} {sanitizeText(mc.ethos)}</p>
          <div className="status-row">
            <StatusPill tone="gold">{mc.trips.length} chapters</StatusPill>
            <StatusPill tone="green">Live draft culture</StatusPill>
            <StatusPill tone="maroon">Official spelling</StatusPill>
          </div>
        </div>
      </section>
      <section className="mcc-grid trip-chapters">
        {mc.trips.map((trip) => (
          <article className="trip-chapter" key={trip.year}>
            <div className="trip-cover">
              {(trip.cover || trip.gallery || []).slice(0, 3).map((src) => <img src={asset(src)} alt={`${trip.year} McCockiner Cup`} key={src} />)}
            </div>
            <div className="trip-story">
              <span>{trip.year}</span>
              <h2>{sanitizeText(trip.location)}</h2>
              <p>{sanitizeText(trip.legend)}</p>
              {trip.format_note && <small>{sanitizeText(trip.format_note)}</small>}
              <div className="chip-cloud">
                {(trip.courses || []).map((course) => <span className="year-chip muted" key={course}>{sanitizeText(course)}</span>)}
              </div>
            </div>
          </article>
        ))}
      </section>
      <section className="return-note">
        <strong>The Return</strong>
        <span>{sanitizeText(mc.gap_note)}</span>
      </section>
    </PageFrame>
  );
}

function TrophyPage() {
  return (
    <PageFrame eyebrow="Hardware" title="Trophy Room" intro="Champions engraved into the permanent record while trophy photography awaits the next artifact pass.">
      <section className="dashboard-grid">
        <Panel title="Engraved Champions">
          <div className="rank-list">
            {seasonsAsc.map((season) => <RankRow key={season.year} rank={season.year} label={ownerName(season.champion)} value={sanitizeText(championTeam(season)?.team)} sub={`Runner up: ${ownerName(season.runner_up)}`} />)}
          </div>
        </Panel>
        <Panel title="Trophy Photo Slot">
          <div className="artifact-placeholder"><Trophy size={54} /><span>Actual trophy photography pending</span></div>
        </Panel>
      </section>
    </PageFrame>
  );
}

function SearchDialog({ open, onClose }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchIndex.slice(0, 12);
    return searchIndex
      .map((item) => ({ item, score: scoreSearch(item, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 28)
      .map((x) => x.item);
  }, [query]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        document.querySelector("#global-search")?.focus();
      }
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (open) setTimeout(() => document.querySelector("#global-search")?.focus(), 20);
  }, [open]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div className="search-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <div className="search-field">
          <Search size={22} />
          <input id="global-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Bill, 2025, highest week, keeper, McCockiner..." />
          <button className="icon-button" onClick={onClose} aria-label="Close search"><X size={19} /></button>
        </div>
        <div className="search-results">
          {results.map((item) => (
            <button key={`${item.type}-${item.title}-${item.path}`} className="search-result" onClick={() => { onClose(); navigate(item.path); }}>
              <span>{item.type}</span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageFrame({ eyebrow, title, intro, children }) {
  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </section>
      {children}
    </div>
  );
}

function Panel({ title, children, action, onAction }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {action && <button onClick={onAction}>{action}<ArrowRight size={15} /></button>}
      </div>
      {children}
    </section>
  );
}

function OwnerCard({ ownerKey, compact }) {
  const owner = getOwner(ownerKey);
  const aliases = owner.aliases.filter((name) => name !== ownerName(ownerKey)).slice(0, 3);
  return (
    <button className={compact ? "owner-card compact" : "owner-card"} onClick={() => navigate(`/owners/${ownerSlug(ownerKey)}`)}>
      <div className="owner-image">{owner.photo ? <img src={asset(owner.photo.src)} alt="" style={{ objectPosition: owner.photo.pos }} /> : <Shield size={28} />}</div>
      <div>
        <strong>{ownerName(ownerKey)}</strong>
        <em className="nfl-team">NFL: {owner.favoriteNflTeam}</em>
        {aliases.length > 0 && <span>Archive aliases: {aliases.join(" / ")}</span>}
        <small>{careerRecord(ownerKey)} · {owner.career.titles} titles · {owner.career.tallies} tallies</small>
      </div>
    </button>
  );
}

function OwnerMini({ ownerKey }) {
  const owner = getOwner(ownerKey);
  return (
    <button className="owner-mini" onClick={() => navigate(`/owners/${ownerSlug(ownerKey)}`)}>
      <span>{ownerName(ownerKey)}</span>
      {owner.photo && <img src={asset(owner.photo.src)} alt="" style={{ objectPosition: owner.photo.pos }} />}
      <strong>{owner.career.titles}</strong>
      <small>titles</small>
    </button>
  );
}

function Metric({ label, value, sub }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong>{sub && <small>{sanitizeText(sub)}</small>}</div>;
}

function StatusPill({ children, tone }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

function RankRow({ rank, label, value, sub }) {
  return <div className="rank-row"><span>{rank}</span><strong>{sanitizeText(label)}</strong><b>{sanitizeText(value)}</b>{sub && <small>{sanitizeText(sub)}</small>}</div>;
}

function CompactTable({ columns, rows }) {
  return (
    <ResponsiveTable>
      <thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{sanitizeText(String(cell ?? ""))}</td>)}</tr>)}</tbody>
    </ResponsiveTable>
  );
}

function ResponsiveTable({ children }) {
  return <div className="table-scroll"><table>{children}</table></div>;
}

function GameCard({ game, label, ownerKey }) {
  const aWon = game.a_pts > game.b_pts;
  const bWon = game.b_pts > game.a_pts;
  const chosen = ownerKey ? ownerKey === game.a ? game.a_pts : game.b_pts : null;
  return (
    <article className="game-card">
      <span>{label || `${game.year} · Week ${game.week}${game.playoff ? " · Playoff" : ""}`}</span>
      <div><strong className={aWon ? "winner" : ""}>{ownerName(game.a)}</strong><b>{fmtPts(game.a_pts)}</b></div>
      <div><strong className={bWon ? "winner" : ""}>{ownerName(game.b)}</strong><b>{fmtPts(game.b_pts)}</b></div>
      {chosen != null && <small>{fmtPts(chosen)} points</small>}
    </article>
  );
}

function RecordPanel({ title, rows, render }) {
  return (
    <Panel title={title}>
      <div className="rank-list">
        {rows.slice(0, 8).map((row, index) => {
          const [label, value, sub] = render(row);
          return <RankRow key={`${title}-${index}`} rank={index + 1} label={label} value={value} sub={sub} />;
        })}
      </div>
    </Panel>
  );
}

function heroPhoto(index) {
  const photos = SITE.archiveFeatures?.homeHero || [
    "assets/mccockiner/2023/09.jpg",
    "assets/mccockiner/2022/06.jpg",
    "assets/tally/01.jpg"
  ];
  return photos[index % photos.length];
}

function seasonCover(season) {
  return SITE.archiveFeatures?.seasonCovers?.[season.year] ||
    season.cover ||
    "assets/archive/tahoe-draft-board.jpg";
}

function ArchiveRail() {
  const photos = [
    "assets/mccockiner/2021/08.jpg",
    "assets/mccockiner/2022/06.jpg",
    "assets/mccockiner/2023/09.jpg"
  ];
  return <div className="archive-rail">{photos.map((src) => <img key={src} src={asset(src)} alt="League archive" />)}</div>;
}

function FinishTimeline({ ownerKey }) {
  const played = seasonsAsc.map((season) => {
    const team = season.teams.find((t) => t.owner === ownerKey);
    return { year: season.year, finish: team?.finish };
  }).filter((row) => row.finish);
  return (
    <div className="timeline-bars">
      {played.map((row) => <div key={row.year}><span>{row.year}</span><i style={{ height: `${Math.max(18, 100 - row.finish * 9)}%` }} /><b>{ordinal(row.finish)}</b></div>)}
    </div>
  );
}

function DocLink({ title, href }) {
  return <a className="doc-link" href={href} target="_blank" rel="noreferrer"><FileText size={22} /><span>{title}</span><ArrowRight size={15} /></a>;
}

function EmptyState({ label, text }) {
  return <div className="empty-card"><strong>{label}</strong><span>{text}</span></div>;
}

function Countdown({ iso }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(iso).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000) % 60;
  const seconds = Math.floor(diff / 1000) % 60;
  return <div className="countdown">{[["Days", days], ["Hours", hours], ["Min", minutes], ["Sec", seconds]].map(([label, value]) => <Metric key={label} label={label} value={String(value).padStart(2, "0")} />)}</div>;
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <img src={asset("assets/EFFL_Crest.png")} alt="" />
      <div>
        <strong>Victoria Aut Tattoo</strong>
        <span>Only way out is through.</span>
      </div>
    </footer>
  );
}

function scoreSearch(item, query) {
  const hay = `${item.title} ${item.description} ${item.keywords || ""}`.toLowerCase();
  if (hay === query) return 100;
  if (hay.startsWith(query)) return 60;
  if (hay.includes(query)) return 25;
  return query.split(/\s+/).reduce((score, part) => score + (hay.includes(part) ? 5 : 0), 0);
}

function keeperCost(round, yearsKept) {
  if (round === "FA") return "6th round";
  const rd = Number(round);
  if (rd <= 2) return "Not keeper eligible";
  if (yearsKept >= 3) return "Final eligible year";
  return `${Math.max(1, rd - yearsKept)}${ordinalSuffix(Math.max(1, rd - yearsKept))} round`;
}

function ordinal(n) {
  if (!Number.isFinite(n) || n >= 90) return "N/A";
  return `${n}${ordinalSuffix(n)}`;
}

function ordinalSuffix(n) {
  if ([11, 12, 13].includes(n % 100)) return "th";
  return ["th", "st", "nd", "rd"][Math.min(n % 10, 4)] || "th";
}

createRoot(document.getElementById("root")).render(<App />);
