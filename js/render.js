/* ==========================================================================
   EFFL render.js
   Page renderers. Each page's body carries data-page="key"; EFFL.init()
   dispatches to PAGES[key]. Every stat on screen originates in LEAGUE or
   SITE. All dynamic strings pass through EFFL.esc before reaching the DOM.
   ========================================================================== */

"use strict";

var PAGES = {};

(function () {
  var $ = EFFL.$, esc = EFFL.esc, fmtPts = EFFL.fmtPts, fmtNum = EFFL.fmtNum;
  var ownerName = EFFL.ownerName, pct = EFFL.pct, rec = EFFL.rec;

  /* page renderers are registered below, one per page */

  /* ======================================================================
     HALL OF CHAMPIONS
     ====================================================================== */
  PAGES.champions = function () {
    var seasons = LEAGUE.seasons.slice().sort(function (a, b) { return b.year - a.year; });
    $("#champ-sub").textContent = "One banner per season since " + EFFL.years()[0] +
      ". Raised at The Estate, defended everywhere.";

    $("#banner-grid").innerHTML = seasons.map(function (s) {
      var t = s.teams.filter(function (x) { return x.owner === s.champion; })[0];
      return '<div class="banner-card reveal">' +
        '<div class="wm">' + s.year + "</div>" +
        '<div class="year">' + s.year + "</div>" +
        '<div class="champ">' + esc(ownerName(s.champion)) + "</div>" +
        '<div class="team">' + esc(t.team) + "</div>" +
        '<div class="meta">' +
          "<span>Record <b>" + rec(t) + "</b></span>" +
          "<span>PF <b>" + fmtPts(t.pf) + "</b></span>" +
          "<span>Over <b>" + esc(ownerName(s.runner_up)) + "</b></span>" +
        "</div></div>";
    }).join("");

    /* dynasty callout, computed */
    var byTitles = EFFL.OWNER_ORDER.map(function (k) {
      var yrs = LEAGUE.seasons.filter(function (s) { return s.champion === k; })
        .map(function (s) { return s.year; }).sort();
      return { k: k, titles: LEAGUE.owners[k].career.titles, years: yrs, tallies: LEAGUE.owners[k].career.tallies };
    }).sort(function (a, b) { return b.titles - a.titles; });
    var top = byTitles[0];
    var b2b = [];
    for (var i = 1; i < top.years.length; i++) {
      if (top.years[i] === top.years[i - 1] + 1) b2b.push(top.years[i - 1] + " and " + top.years[i]);
    }
    $("#dynasty").innerHTML =
      '<div class="panel panel-pad reveal" style="border-top:3px solid var(--gold);text-align:center">' +
        '<div class="eyebrow center" style="margin-bottom:10px">The Dynasty</div>' +
        '<div class="display" style="font-size:clamp(2.6rem,8vw,4.6rem)">' + esc(ownerName(top.k).toUpperCase()) + "</div>" +
        '<p class="muted" style="max-width:560px;margin:10px auto 0">' +
          top.titles + " championships (" + top.years.join(", ") + ")" +
          (b2b.length ? ", including back to back in " + esc(b2b[b2b.length - 1]) : "") +
          ". Career tallies: " + top.tallies + ". " +
          (top.tallies === 0 ? "The ledger of shame has never touched the dynasty." : "") + "</p>" +
        '<div class="grid cols-3 mt-3">' +
          '<div class="stat-card"><div class="num"><em>' + top.titles + '</em></div><span class="label">Titles</span></div>' +
          '<div class="stat-card"><div class="num">' + fmtPts(LEAGUE.owners[top.k].career.pf) + '</div><span class="label">Career PF</span></div>' +
          '<div class="stat-card"><div class="num">' + top.tallies + '</div><span class="label">Tallies</span></div>' +
        "</div></div>";

    /* leaderboard */
    $("#title-board").innerHTML =
      '<table class="tbl"><thead><tr><th>Owner</th><th class="num-cell">Titles</th><th data-nosort>Years</th>' +
      '<th class="num-cell">Runner Up</th><th class="num-cell">Playoff Berths</th></tr></thead><tbody>' +
      byTitles.map(function (o) {
        var ru = LEAGUE.seasons.filter(function (s) { return s.runner_up === o.k; }).length;
        return "<tr" + (o.titles === top.titles && top.titles > 0 ? ' class="hl"' : "") + ">" +
          '<td class="owner-cell">' + esc(ownerName(o.k)) + "</td>" +
          '<td class="num-cell" data-val="' + o.titles + '">' + o.titles + "</td>" +
          '<td class="dim">' + (o.years.join(", ") || "Still hunting") + "</td>" +
          '<td class="num-cell" data-val="' + ru + '">' + ru + "</td>" +
          '<td class="num-cell" data-val="' + LEAGUE.owners[o.k].career.playoffs + '">' + LEAGUE.owners[o.k].career.playoffs + "</td></tr>";
      }).join("") + "</tbody></table>";
    EFFL.makeSortable($("#title-board table"));
  };

  /* ======================================================================
     HOME
     ====================================================================== */
  PAGES.home = function () {
    var meta = LEAGUE.meta;
    var latest = EFFL.latestSeason();

    $("#home-est").textContent = "Est. " + meta.est + " · " + meta.origin;
    $("#home-motto").textContent = meta.motto;
    $("#home-sub").textContent = meta.name + ": the permanent record, the law, and the " +
      "hype engine of " + LEAGUE.seasons.length + " seasons of head to head warfare on the " + meta.platform + " platform.";

    /* stat strip */
    var totalTallies = EFFL.OWNER_ORDER.reduce(function (n, k) { return n + LEAGUE.owners[k].career.tallies; }, 0);
    $("#home-stats").innerHTML = [
      { n: LEAGUE.seasons.length, l: "Seasons", s: EFFL.years()[0] + " to " + latest.year },
      { n: EFFL.OWNER_ORDER.length, l: "Franchises", s: "One division. The East." },
      { n: fmtNum(LEAGUE.matchups.length), l: "Games Played", s: "Every box score preserved" },
      { n: totalTallies, l: "Tallies Owed", s: "Per the Tally Statute" }
    ].map(function (c) {
      return '<div class="stat-card reveal"><div class="num">' + c.n + '</div><span class="label">' + c.l + '</span><div class="sub">' + esc(c.s) + "</div></div>";
    }).join("");

    /* countdown */
    EFFL.countdown($("#draft-count"), SITE.draftDate2026, "Date to be proclaimed");

    /* champion spotlight + latest standings */
    var champTeam = latest.teams.filter(function (t) { return t.owner === latest.champion; })[0];
    var runnerTeam = latest.teams.filter(function (t) { return t.owner === latest.runner_up; })[0];
    var standings = latest.teams.slice().sort(function (a, b) { return a.finish - b.finish; });
    $("#home-feature").innerHTML =
      '<div class="banner-card reveal" style="border-top-width:4px">' +
        '<div class="wm">' + latest.year + "</div>" +
        '<div class="eyebrow left" style="margin-bottom:8px">Reigning Champion</div>' +
        '<div class="year">' + latest.year + "</div>" +
        '<div class="champ">' + esc(ownerName(latest.champion)) + "</div>" +
        '<div class="team">' + esc(champTeam.team) + "</div>" +
        '<div class="meta">' +
          "<span>Record <b>" + rec(champTeam) + "</b></span>" +
          "<span>PF <b>" + fmtPts(champTeam.pf) + "</b></span>" +
          "<span>Seed <b>" + champTeam.seed + "</b></span>" +
          "<span>Def. <b>" + esc(ownerName(latest.runner_up)) + " (" + rec(runnerTeam) + ")</b></span>" +
        "</div>" +
      "</div>" +
      '<div class="panel panel-pad reveal">' +
        '<div class="eyebrow left" style="margin-bottom:14px">' + latest.year + " Final Standings</div>" +
        '<div class="tbl-scroll"><table class="tbl"><thead><tr>' +
        "<th>#</th><th>Franchise</th><th>Owner</th><th class=\"num-cell\">W</th><th class=\"num-cell\">L</th><th class=\"num-cell\">PF</th><th class=\"num-cell\">PA</th>" +
        "</tr></thead><tbody>" +
        standings.map(function (t) {
          return "<tr" + (t.finish === 1 ? ' class="hl"' : "") + "><td data-val=\"" + t.finish + "\">" + t.finish + "</td>" +
            '<td class="owner-cell">' + esc(t.team) + "</td>" +
            '<td class="dim">' + esc(ownerName(t.owner)) + "</td>" +
            '<td class="num-cell">' + t.w + '</td><td class="num-cell">' + t.l + "</td>" +
            '<td class="num-cell">' + fmtPts(t.pf) + '</td><td class="num-cell">' + fmtPts(t.pa) + "</td></tr>";
        }).join("") +
        "</tbody></table></div>" +
        '<div class="mt-2"><a class="btn-ghost" href="seasons.html">Open The Season Archive</a></div>' +
      "</div>";

    /* This Week in EFFL History */
    var twih = EFFL.thisWeekInHistory(3);
    $("#twih-sub").textContent = "Pulled from the vault: week " + twih.week + " games across the ages, rotating daily.";
    $("#twih").innerHTML = twih.games.map(function (m) {
      var aWin = m.a_pts > m.b_pts;
      return '<div class="twih-game reveal">' +
        '<div class="twih-side a' + (aWin ? " win" : "") + '"><div class="o">' + esc(ownerName(m.a)) + '</div><div class="p">' + fmtPts(m.a_pts) + "</div></div>" +
        '<div class="twih-mid">' + m.year + "<br>WK " + m.week + (m.playoff ? "<br>Playoffs" : "") + "</div>" +
        '<div class="twih-side b' + (!aWin ? " win" : "") + '"><div class="o">' + esc(ownerName(m.b)) + '</div><div class="p">' + fmtPts(m.b_pts) + "</div></div>" +
      "</div>";
    }).join("") || '<div class="empty-state">The vault is silent this week.</div>';

    /* section nav cards */
    var cards = [
      ["champions.html", "Hall of Champions", LEAGUE.seasons.length + " banners raised", "tunnel"],
      ["seasons.html", "Season Archive", EFFL.years()[0] + " to " + latest.year + ", every box score", "skyline"],
      ["records.html", "The Record Book", "Top tens across " + fmtNum(LEAGUE.matchups.length) + " games", "vault"],
      ["tally.html", "The Tally Wall", totalTallies + " marks of permanent shame", "wall"],
      ["h2h.html", "Head To Head", "Every rivalry, quantified", "war"],
      ["franchises.html", "Franchises", EFFL.OWNER_ORDER.length + " franchises, one registry", "estate"],
      ["power.html", "The Power Index", "Elo, all play, and the Luck Index", "vault"],
      ["draft.html", "Draft Central", "The Keeper Codex and the countdown", "war"],
      ["mccockner.html", "The McCockner", "The golf record of the Assembly", "dusk"]
    ];
    $("#home-cards").innerHTML = cards.map(function (c) {
      return '<a class="nav-card hero reveal" data-hero="' + c[3] + '" href="' + c[0] + '">' +
        '<span class="go">GO ➔</span>' +
        '<span class="t">' + esc(c[1]) + '</span><span class="d">' + esc(c[2]) + "</span></a>";
    }).join("");
  };

})();

EFFL.init();
