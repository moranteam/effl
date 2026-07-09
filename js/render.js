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
     SEASON ARCHIVE
     ====================================================================== */
  PAGES.seasons = function () {
    var yrs = EFFL.years();
    var latest = EFFL.latestSeason().year;
    $("#seasons-sub").textContent = yrs[0] + " to " + latest +
      ": final standings, full draft boards, weekly results, and the playoff bracket for every campaign.";

    var current = parseInt(location.hash.replace("#", ""), 10);
    if (yrs.indexOf(current) < 0) current = latest;

    var scroller = $("#year-scroller");
    scroller.innerHTML = yrs.map(function (y) {
      var s = EFFL.seasonByYear(y);
      return '<button class="year-btn" role="tab" data-year="' + y + '" aria-selected="false">' + y +
        '<span class="tt">' + esc(ownerName(s.champion)) + "</span></button>";
    }).join("");

    EFFL.$all(".year-btn", scroller).forEach(function (b) {
      b.addEventListener("click", function () {
        history.replaceState(null, "", "#" + b.dataset.year);
        renderYear(parseInt(b.dataset.year, 10));
      });
    });

    function renderYear(y) {
      EFFL.$all(".year-btn", scroller).forEach(function (b) {
        var on = parseInt(b.dataset.year, 10) === y;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      var s = EFFL.seasonByYear(y);
      var champ = s.teams.filter(function (t) { return t.owner === s.champion; })[0];
      var ru = s.teams.filter(function (t) { return t.owner === s.runner_up; })[0];
      var tallyTeam = s.teams.filter(function (t) { return t.owner === s.tally; })[0];
      var standings = s.teams.slice().sort(function (a, b) { return a.finish - b.finish; });

      var html = "";

      /* banners */
      html += '<div class="grid cols-3">' +
        bannerCell("Champion", s.champion, champ, "var(--gold)") +
        bannerCell("Runner Up", s.runner_up, ru, "var(--muted)") +
        bannerCell("The Tally", s.tally, tallyTeam, "var(--maroon)") +
        "</div>";

      /* standings */
      html += sectionHead("Final Standings", y + " regular season, finish order of record") +
        '<div class="tbl-scroll"><table class="tbl" id="standings-tbl"><thead><tr>' +
        '<th class="num-cell">Finish</th><th>Franchise</th><th>Owner</th><th class="num-cell">Seed</th>' +
        '<th class="num-cell">W</th><th class="num-cell">L</th><th class="num-cell">T</th>' +
        '<th class="num-cell">PF</th><th class="num-cell">PA</th></tr></thead><tbody>' +
        standings.map(function (t) {
          return "<tr" + (t.finish === 1 ? ' class="hl"' : "") + ">" +
            '<td class="num-cell" data-val="' + t.finish + '">' + t.finish + "</td>" +
            '<td class="owner-cell">' + esc(t.team) + "</td>" +
            '<td class="dim">' + esc(ownerName(t.owner)) + "</td>" +
            '<td class="num-cell" data-val="' + t.seed + '">' + t.seed + "</td>" +
            '<td class="num-cell">' + t.w + '</td><td class="num-cell">' + t.l + '</td><td class="num-cell">' + t.t + "</td>" +
            '<td class="num-cell" data-val="' + t.pf + '">' + fmtPts(t.pf) + "</td>" +
            '<td class="num-cell" data-val="' + t.pa + '">' + fmtPts(t.pa) + "</td></tr>";
        }).join("") + "</tbody></table></div>";

      /* bracket */
      var bk = EFFL.bracket(y);
      if (bk) {
        html += sectionHead("The Playoff Bracket", "Reconstructed from the box scores of weeks " + bk.semiWk + " and " + bk.finalWk) +
          '<div class="bracket">' +
            '<div><div class="bracket-round-title">Semifinals · Week ' + bk.semiWk + "</div>" +
              bk.semis.map(function (m) { return bkGame(m, y, false); }).join("") + "</div>" +
            "<div>" +
              '<div class="bracket-round-title">Championship · Week ' + bk.finalWk + "</div>" +
              (bk.final ? bkGame(bk.final, y, true) : "") +
              (bk.third ? '<div class="bracket-round-title mt-2">Third Place Game</div>' + bkGame(bk.third, y, false) : "") +
            "</div>" +
          "</div>";
        if (bk.consolation.length) {
          html += '<details class="round-details mt-2"><summary>Consolation Ladder (' + bk.consolation.length + " games)</summary>" +
            '<div class="pick-grid">' + bk.consolation.map(function (m) {
              return '<div class="pick"><span class="pk">WK ' + m.week + '</span><span class="pl">' +
                esc(ownerName(m.a)) + " " + fmtPts(m.a_pts) + ", " + esc(ownerName(m.b)) + " " + fmtPts(m.b_pts) + "</span></div>";
            }).join("") + "</div></details>";
        }
      }

      /* keepers */
      if (s.keepers && s.keepers.length) {
        html += sectionHead("Keepers", "Declared under the Keeper Codex") +
          '<div class="pick-grid" style="border:1px solid var(--rule)">' +
          s.keepers.map(function (k) {
            return '<div class="pick"><span class="pk">' + esc(String(k.rd || "")) + '</span><span class="pl">' + esc(k.player || "") +
              '</span><span class="ow">' + esc(ownerName(k.owner || "")) + "</span></div>";
          }).join("") + "</div>";
      }

      /* draft board */
      if (s.draft && s.draft.length) {
        var rounds = {};
        s.draft.forEach(function (p) { (rounds[p.rd] = rounds[p.rd] || []).push(p); });
        var rdKeys = Object.keys(rounds).map(Number).sort(function (a, b) { return a - b; });
        html += sectionHead("The Draft Board", y + " draft, " + s.draft.length + " selections across " + rdKeys.length + " rounds") +
          rdKeys.map(function (rd) {
            var picks = rounds[rd].slice().sort(function (a, b) { return a.pk - b.pk; });
            return '<details class="round-details"' + (rd === 1 ? " open" : "") + "><summary>Round " + rd + "</summary>" +
              '<div class="pick-grid">' + picks.map(function (p) {
                return '<div class="pick"><span class="pk">' + p.rd + "." + String(p.pk).padStart(2, "0") + "</span>" +
                  '<span class="pl">' + esc(p.player) + '</span><span class="ow">' + esc(ownerName(p.owner)) + "</span></div>";
              }).join("") + "</div></details>";
          }).join("");
      }

      /* weekly results */
      var weeks = EFFL.seasonWeeks(y);
      html += sectionHead("Weekly Results", "Every game of the " + y + " campaign") +
        weeks.map(function (w) {
          return '<details class="round-details"><summary>Week ' + w.week + (w.playoff ? " · Playoffs" : "") + "</summary>" +
            '<div class="pick-grid">' + w.games.map(function (m) {
              var aWin = m.a_pts > m.b_pts;
              return '<div class="pick"><span class="pl">' +
                (aWin ? "<span class=\"gold\">" : "") + esc(ownerName(m.a)) + " " + fmtPts(m.a_pts) + (aWin ? "</span>" : "") +
                ' <span class="dim">at</span> ' +
                (!aWin ? "<span class=\"gold\">" : "") + esc(ownerName(m.b)) + " " + fmtPts(m.b_pts) + (!aWin ? "</span>" : "") +
                "</span></div>";
            }).join("") + "</div></details>";
        }).join("");

      $("#season-body").innerHTML = html;
      EFFL.makeSortable($("#standings-tbl"));
    }

    function bannerCell(label, ownerKey, team, color) {
      return '<div class="banner-card" style="border-top-color:' + color + '">' +
        '<div class="eyebrow left" style="margin-bottom:6px">' + label + "</div>" +
        '<div class="champ">' + esc(ownerName(ownerKey)) + "</div>" +
        '<div class="team">' + esc(team.team) + "</div>" +
        '<div class="meta"><span>Record <b>' + rec(team) + "</b></span><span>PF <b>" + fmtPts(team.pf) + "</b></span></div></div>";
    }

    function bkGame(m, year, isTitle) {
      var aWin = m.a_pts > m.b_pts;
      function side(k, ptsVal, won) {
        return '<div class="bk-team ' + (won ? "win" : "loss") + '"><span>' + esc(EFFL.teamOf(k, year)) +
          ' <span class="dim">(' + esc(ownerName(k)) + ')</span></span><span class="pts">' + fmtPts(ptsVal) + "</span></div>";
      }
      return '<div class="bk-game' + (isTitle ? " title-game" : "") + '">' +
        (isTitle ? '<div class="bk-tag">For the banner</div>' : "") +
        side(m.a, m.a_pts, aWin) + side(m.b, m.b_pts, !aWin) + "</div>";
    }

    function sectionHead(title, sub) {
      return '<div class="section-head mt-4"><div class="eyebrow left">' + esc(sub) + "</div>" +
        '<h2 class="section-title" style="font-size:clamp(2rem,5vw,3rem)">' + esc(title) + "</h2></div>";
    }

    renderYear(current);
  };

  /* ======================================================================
     THE RECORD BOOK
     ====================================================================== */
  PAGES.records = function () {
    var R = LEAGUE.records;
    $("#records-sub").textContent = "Top tens mined from " + fmtNum(LEAGUE.matchups.length) +
      " games across " + LEAGUE.seasons.length + " seasons. Every line cites its year and week.";

    /* career table */
    $("#career-tbl").innerHTML =
      '<table class="tbl"><thead><tr><th>Owner</th><th class="num-cell">W</th><th class="num-cell">L</th><th class="num-cell">T</th>' +
      '<th class="num-cell">Pct</th><th class="num-cell">PF</th><th class="num-cell">Titles</th>' +
      '<th class="num-cell">Tallies</th><th class="num-cell">Playoffs</th><th class="num-cell">Seasons</th><th class="num-cell">Best</th></tr></thead><tbody>' +
      EFFL.OWNER_ORDER_ALL.map(function (k) {
        var c = LEAGUE.owners[k].career;
        return "<tr" + (k === "perkins" ? ' style="opacity:.6"' : "") + ">" +
          '<td class="owner-cell">' + esc(ownerName(k)) + (k === "perkins" ? ' <span class="dim">(2015 only)</span>' : "") + "</td>" +
          '<td class="num-cell">' + c.w + '</td><td class="num-cell">' + c.l + '</td><td class="num-cell">' + c.t + "</td>" +
          '<td class="num-cell" data-val="' + pct(c.w, c.l, c.t) + '">' + pct(c.w, c.l, c.t) + "</td>" +
          '<td class="num-cell" data-val="' + c.pf + '">' + fmtPts(c.pf) + "</td>" +
          '<td class="num-cell">' + c.titles + '</td><td class="num-cell">' + c.tallies + "</td>" +
          '<td class="num-cell">' + c.playoffs + '</td><td class="num-cell">' + c.seasons + "</td>" +
          '<td class="num-cell" data-val="' + c.best + '">' + EFFL.ordinal(c.best) + "</td></tr>";
      }).join("") + "</tbody></table>";
    EFFL.makeSortable($("#career-tbl table"));

    /* record tables */
    function weekTable(rows, title, sub) {
      return '<div class="section-head mt-4"><div class="eyebrow left">' + esc(sub) + '</div>' +
        '<h2 class="section-title" style="font-size:clamp(2rem,5vw,3rem)">' + esc(title) + "</h2></div>" +
        '<div class="tbl-scroll"><table class="tbl"><thead><tr><th class="num-cell">#</th><th>Owner</th>' +
        '<th class="num-cell">Points</th><th>Opponent</th><th class="num-cell">Opp Pts</th><th class="num-cell">Year</th>' +
        '<th class="num-cell">Week</th><th data-nosort>Stage</th></tr></thead><tbody>' +
        rows.map(function (r, i) {
          return "<tr" + (i === 0 ? ' class="hl"' : "") + '><td class="num-cell" data-val="' + (i + 1) + '">' + (i + 1) + "</td>" +
            '<td class="owner-cell">' + esc(ownerName(r.owner)) + "</td>" +
            '<td class="num-cell" data-val="' + r.pts + '"><b>' + fmtPts(r.pts) + "</b></td>" +
            "<td>" + esc(ownerName(r.opp)) + "</td>" +
            '<td class="num-cell" data-val="' + r.opp_pts + '">' + fmtPts(r.opp_pts) + "</td>" +
            '<td class="num-cell">' + r.year + '</td><td class="num-cell">' + r.week + "</td>" +
            "<td class=\"dim\">" + (r.playoff ? "Playoffs" : "Regular") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }

    function marginTable(rows, title, sub) {
      return '<div class="section-head mt-4"><div class="eyebrow left">' + esc(sub) + '</div>' +
        '<h2 class="section-title" style="font-size:clamp(2rem,5vw,3rem)">' + esc(title) + "</h2></div>" +
        '<div class="tbl-scroll"><table class="tbl"><thead><tr><th class="num-cell">#</th>' +
        '<th class="num-cell">Margin</th><th>Winner</th><th>Loser</th><th class="num-cell">Score</th>' +
        '<th class="num-cell">Year</th><th class="num-cell">Week</th><th data-nosort>Stage</th></tr></thead><tbody>' +
        rows.map(function (m, i) {
          var aWin = m.a_pts > m.b_pts;
          var wKey = aWin ? m.a : m.b, lKey = aWin ? m.b : m.a;
          var wPts = Math.max(m.a_pts, m.b_pts), lPts = Math.min(m.a_pts, m.b_pts);
          var margin = Math.round((wPts - lPts) * 100) / 100;
          return "<tr" + (i === 0 ? ' class="hl"' : "") + '><td class="num-cell" data-val="' + (i + 1) + '">' + (i + 1) + "</td>" +
            '<td class="num-cell" data-val="' + margin + '"><b>' + fmtPts(margin) + "</b></td>" +
            '<td class="owner-cell gold">' + esc(ownerName(wKey)) + "</td>" +
            "<td>" + esc(ownerName(lKey)) + "</td>" +
            '<td class="num-cell nowrap" data-val="' + wPts + '">' + fmtPts(wPts) + " to " + fmtPts(lPts) + "</td>" +
            '<td class="num-cell">' + m.year + '</td><td class="num-cell">' + m.week + "</td>" +
            "<td class=\"dim\">" + (m.playoff ? "Playoffs" : "Regular") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }

    var host = $("#record-tables");
    host.innerHTML =
      weekTable(R.top_weeks, "Highest Weeks Ever", "The Ceiling") +
      weekTable(R.low_weeks, "Lowest Weeks Ever", "The Floor") +
      marginTable(R.blowouts, "Biggest Blowouts", "No Mercy") +
      marginTable(R.nailbiters, "Closest Games", "Decided By Decimal Points") +
      '<div class="section-head mt-4"><div class="eyebrow left">Volume Shooters</div>' +
      '<h2 class="section-title" style="font-size:clamp(2rem,5vw,3rem)">Best Scoring Seasons</h2></div>' +
      '<div class="tbl-scroll"><table class="tbl"><thead><tr><th class="num-cell">#</th><th>Owner</th><th>Franchise</th>' +
      '<th class="num-cell">Year</th><th class="num-cell">PF</th><th class="num-cell">Record</th><th class="num-cell">Finish</th></tr></thead><tbody>' +
      R.best_pf_seasons.map(function (r, i) {
        return "<tr" + (i === 0 ? ' class="hl"' : "") + '><td class="num-cell" data-val="' + (i + 1) + '">' + (i + 1) + "</td>" +
          '<td class="owner-cell">' + esc(ownerName(r.owner)) + "</td>" +
          "<td>" + esc(r.team) + "</td>" +
          '<td class="num-cell">' + r.year + "</td>" +
          '<td class="num-cell" data-val="' + r.pf + '"><b>' + fmtPts(r.pf) + "</b></td>" +
          '<td class="num-cell" data-val="' + r.w + '">' + rec(r) + "</td>" +
          '<td class="num-cell" data-val="' + r.finish + '">' + EFFL.ordinal(r.finish) + "</td></tr>";
      }).join("") + "</tbody></table></div>";

    EFFL.$all("table", host).forEach(EFFL.makeSortable);
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
