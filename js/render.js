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
     THE TALLY WALL
     ====================================================================== */
  PAGES.tally = function () {
    var latest = EFFL.latestSeason();
    var pendingOwner = latest.tally; /* newest obligation, pending proof of ink */

    var rows = EFFL.OWNER_ORDER.map(function (k) {
      var yrs = LEAGUE.seasons.filter(function (s) { return s.tally === k; })
        .map(function (s) { return s.year; }).sort();
      return { k: k, count: LEAGUE.owners[k].career.tallies, years: yrs };
    }).sort(function (a, b) { return b.count - a.count || a.k.localeCompare(b.k); });

    var total = rows.reduce(function (n, r) { return n + r.count; }, 0);
    var clean = rows.filter(function (r) { return r.count === 0; });

    $("#tally-sub").textContent = "The crown jewel of shame. " + total +
      " tally marks owed across " + LEAGUE.seasons.length + " seasons, one per last place finish, " +
      "permanent by constitutional mandate.";

    $("#tally-stats").innerHTML = [
      { n: total, l: "Tallies Owed", s: "All time, all owners" },
      { n: rows[0].count, l: "Most By One Owner", s: rows.filter(function (r) { return r.count === rows[0].count; }).map(function (r) { return ownerName(r.k); }).join(" and ") },
      { n: clean.length, l: "Clean Owners", s: clean.map(function (r) { return ownerName(r.k); }).join(", ") || "Nobody" },
      { n: 1, l: "Pending Proof", s: ownerName(pendingOwner) + ", " + latest.year }
    ].map(function (c) {
      return '<div class="stat-card reveal"><div class="num">' + c.n + '</div><span class="label">' + c.l + '</span><div class="sub">' + esc(c.s) + "</div></div>";
    }).join("");

    $("#tally-wall").innerHTML = rows.map(function (r) {
      var strokes = "";
      if (r.count === 0) {
        strokes = '<div class="tally-zero">UNMARKED · THE SKIN IS CLEAN</div>';
      } else {
        var groups = [];
        var pendingIdx = r.years.indexOf(latest.year) >= 0 && r.k === pendingOwner ? r.count - 1 : -1;
        var idx = 0;
        while (idx < r.count) {
          var g = Math.min(5, r.count - idx);
          var group = '<div class="tally-group">';
          for (var j = 0; j < Math.min(g, 4); j++) {
            group += '<div class="tally-stroke' + ((idx + j) === pendingIdx ? " pending" : "") + '"></div>';
          }
          if (g === 5) group += '<div class="tally-slash"></div>';
          group += "</div>";
          groups.push(group);
          idx += g === 5 ? 5 : g;
        }
        strokes = groups.join("");
      }
      var chips = r.years.map(function (y) {
        var pending = (r.k === pendingOwner && y === latest.year);
        return '<span class="year-chip' + (pending ? " pending" : "") + '">' + y + (pending ? " · PENDING PROOF OF INK" : "") + "</span>";
      }).join("");
      return '<div class="tally-card reveal' + (r.count === 0 ? " clean" : "") + '">' +
        '<div class="tally-count">' + r.count + "</div>" +
        '<div class="tally-name">' + esc(ownerName(r.k)) + "</div>" +
        '<div class="tally-strokes">' + strokes + "</div>" +
        '<div class="tally-years">' + chips + "</div>" +
      "</div>";
    }).join("");
  };

  /* ======================================================================
     HEAD TO HEAD MATRIX
     ====================================================================== */
  PAGES.h2h = function () {
    $("#h2h-sub").textContent = "All time records including playoffs, " +
      EFFL.years()[0] + " to " + EFFL.latestSeason().year + ". Read a row owner's record against each column.";

    var showPerkins = !!EFFL.store.get("h2h_perkins", false);
    var toggle = $("#perkins-toggle");

    function keys() {
      return showPerkins ? EFFL.OWNER_ORDER_ALL : EFFL.OWNER_ORDER;
    }

    function cellColor(w, l, t) {
      var g = w + l + t;
      if (!g) return "var(--panel-2)";
      var p = (w + t * 0.5) / g;
      if (p >= 0.5) {
        var a = 0.08 + (p - 0.5) * 0.9;
        return "rgba(255, 198, 39, " + a.toFixed(2) + ")";
      }
      var a2 = 0.12 + (0.5 - p) * 1.2;
      return "rgba(140, 29, 64, " + Math.min(a2, 0.75).toFixed(2) + ")";
    }

    function renderMatrix() {
      toggle.textContent = showPerkins ? "Hide The Perkins Registry" : "Show The Perkins Registry";
      var ks = keys();
      var html = '<table class="h2h-grid"><thead><tr><th></th>' +
        ks.map(function (k) { return "<th>" + esc(ownerName(k)) + "</th>"; }).join("") + "</tr></thead><tbody>";
      ks.forEach(function (a) {
        html += '<tr><th class="row-head">' + esc(ownerName(a)) + "</th>";
        ks.forEach(function (b) {
          if (a === b) { html += '<td class="h2h-cell self" aria-hidden="true"></td>'; return; }
          var r = (LEAGUE.h2h[a] && LEAGUE.h2h[a][b]) || { w: 0, l: 0, t: 0 };
          html += '<td class="h2h-cell" tabindex="0" role="button" data-a="' + a + '" data-b="' + b + '"' +
            ' style="background:' + cellColor(r.w, r.l, r.t) + '"' +
            ' aria-label="' + esc(ownerName(a)) + " versus " + esc(ownerName(b)) + ", " + rec(r) + '">' +
            rec(r) + "</td>";
        });
        html += "</tr>";
      });
      html += "</tbody></table>";
      $("#h2h-matrix").innerHTML = html;

      EFFL.$all(".h2h-cell[data-a]").forEach(function (td) {
        function open() {
          EFFL.$all(".h2h-cell.active").forEach(function (c) { c.classList.remove("active"); });
          td.classList.add("active");
          renderDetail(td.dataset.a, td.dataset.b);
        }
        td.addEventListener("click", open);
        td.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      });
    }

    function renderDetail(a, b) {
      var r = (LEAGUE.h2h[a] && LEAGUE.h2h[a][b]) || { w: 0, l: 0, t: 0 };
      var games = EFFL.rivalryGames(a, b).slice().sort(function (x, y) { return x.year - y.year || x.week - y.week; });
      var last = games[games.length - 1];
      var biggest = null, bigMargin = -1;
      games.forEach(function (m) {
        var margin = Math.abs(m.a_pts - m.b_pts);
        if (margin > bigMargin) { bigMargin = margin; biggest = m; }
      });
      function line(m) {
        if (!m) return '<span class="dim">No meetings on record.</span>';
        var aWin = m.a_pts > m.b_pts;
        var wKey = aWin ? m.a : m.b, lKey = aWin ? m.b : m.a;
        return "<b>" + esc(ownerName(wKey)) + "</b> " + fmtPts(Math.max(m.a_pts, m.b_pts)) +
          ", " + esc(ownerName(lKey)) + " " + fmtPts(Math.min(m.a_pts, m.b_pts)) +
          ' <span class="dim">(' + m.year + ", wk " + m.week + (m.playoff ? ", playoffs" : "") + ")</span>";
      }
      $("#h2h-detail").innerHTML =
        '<div class="panel panel-pad" style="border-top:3px solid var(--maroon)">' +
          '<div class="eyebrow left" style="margin-bottom:10px">The Rivalry File</div>' +
          '<div class="display" style="font-size:clamp(1.8rem,6vw,3rem)">' +
            esc(ownerName(a).toUpperCase()) + ' <span class="gold">vs</span> ' + esc(ownerName(b).toUpperCase()) + "</div>" +
          '<div class="grid cols-3 mt-2">' +
            '<div class="stat-card"><div class="num">' + rec(r) + '</div><span class="label">' + esc(ownerName(a)) + "&#39;s Record" + '</span>' +
              '<div class="sub">' + (r.w > r.l ? esc(ownerName(a)) + " leads the series" : r.w < r.l ? esc(ownerName(b)) + " leads the series" : "Dead even") + "</div></div>" +
            '<div class="stat-card"><div class="num">' + games.length + '</div><span class="label">Meetings</span>' +
              '<div class="sub">' + games.filter(function (g) { return g.playoff; }).length + " in the playoffs</div></div>" +
            '<div class="stat-card"><div class="num">' + (biggest ? fmtPts(bigMargin) : "0") + '</div><span class="label">Biggest Margin</span>' +
              '<div class="sub">The most lopsided result</div></div>' +
          "</div>" +
          '<div class="mt-2"><div class="kv"><span class="k">Last meeting</span><span class="v">' + line(last) + "</span></div>" +
          '<div class="kv"><span class="k">Biggest win in the rivalry</span><span class="v">' + line(biggest) + "</span></div></div>" +
        "</div>";
      $("#h2h-detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    toggle.addEventListener("click", function () {
      showPerkins = !showPerkins;
      EFFL.store.set("h2h_perkins", showPerkins);
      renderMatrix();
    });

    renderMatrix();
  };

  /* ======================================================================
     FRANCHISES
     ====================================================================== */
  PAGES.franchises = function () {
    var yrs = EFFL.years();
    $("#fr-sub").textContent = EFFL.OWNER_ORDER.length + " franchises of record, " +
      yrs[0] + " to " + EFFL.latestSeason().year + ". Badges arrive with the Phase 2 art drop.";

    function sparkline(k) {
      var pts = [], W = 320, H = 74, padX = 12, padY = 10;
      var x0 = yrs[0], x1 = yrs[yrs.length - 1];
      function X(y) { return padX + (y - x0) / (x1 - x0) * (W - padX * 2); }
      function Y(f) { return padY + (f - 1) / 7 * (H - padY * 2); }
      var dots = "";
      yrs.forEach(function (y) {
        var s = EFFL.seasonByYear(y);
        var t = s.teams.filter(function (x) { return x.owner === k; })[0];
        if (!t) return;
        pts.push(X(y).toFixed(1) + "," + Y(t.finish).toFixed(1));
        var cls = s.champion === k ? "title" : (s.tally === k ? "tally" : "");
        dots += '<circle class="dot ' + cls + '" cx="' + X(y).toFixed(1) + '" cy="' + Y(t.finish).toFixed(1) + '" r="' + (cls ? 4 : 2.5) + '">' +
          "<title>" + y + ": finished " + EFFL.ordinal(t.finish) + "</title></circle>";
      });
      return '<svg class="spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="Finish by year for ' + esc(ownerName(k)) + '">' +
        '<line class="axis" x1="' + padX + '" y1="' + Y(1) + '" x2="' + (W - padX) + '" y2="' + Y(1) + '"></line>' +
        '<line class="axis" x1="' + padX + '" y1="' + Y(8) + '" x2="' + (W - padX) + '" y2="' + Y(8) + '"></line>' +
        '<polyline class="line" points="' + pts.join(" ") + '"></polyline>' + dots + "</svg>";
    }

    function oppSplits(k) {
      var list = EFFL.OWNER_ORDER_ALL.filter(function (o) { return o !== k; }).map(function (o) {
        var r = (LEAGUE.h2h[k] && LEAGUE.h2h[k][o]) || { w: 0, l: 0, t: 0 };
        var g = r.w + r.l + r.t;
        return { o: o, r: r, g: g, p: g ? (r.w + r.t * 0.5) / g : 0 };
      }).filter(function (x) { return x.g >= 5; });
      list.sort(function (a, b) { return a.p - b.p || b.g - a.g; });
      return { nemesis: list[0], favorite: list[list.length - 1] };
    }

    function sigGames(k) {
      var games = EFFL.gamesOf(k);
      var best = games.slice().sort(function (a, b) { return b.pts - a.pts; })[0];
      var worstBeat = games.filter(function (g) { return !g.won && !g.tied; })
        .sort(function (a, b) { return b.pts - a.pts; })[0];
      var blow = games.slice().sort(function (a, b) {
        return Math.abs(b.pts - b.opp_pts) - Math.abs(a.pts - a.opp_pts);
      })[0];
      function line(g, verb) {
        if (!g) return "";
        return fmtPts(g.pts) + " " + verb + " " + esc(ownerName(g.opp)) + " (" + fmtPts(g.opp_pts) + "), " +
          g.year + " wk " + g.week + (g.playoff ? ", playoffs" : "");
      }
      return (
        '<div class="sig-game"><b>Best Week</b>' + line(best, "on") + "</div>" +
        (worstBeat ? '<div class="sig-game"><b>Worst Beat</b>' + line(worstBeat, "was not enough against") + "</div>" : "") +
        (blow ? '<div class="sig-game"><b>Biggest Margin Involved</b>' + (blow.won ? line(blow, "over") : line(blow, "run over by")) + "</div>" : "")
      );
    }

    $("#fr-grid").innerHTML = EFFL.OWNER_ORDER.map(function (k) {
      var o = LEAGUE.owners[k], c = o.career;
      var sp = oppSplits(k);
      var initials = o.display.replace(/^The /, "").slice(0, 2).toUpperCase();
      var offices = (o.offices || []).join(", ");
      return '<div class="fr-card reveal">' +
        '<div class="fr-head">' +
          '<div class="fr-badge" title="Franchise badge arrives in Phase 2">' + esc(initials) + "</div>" +
          '<div><div class="fr-name">' + esc(o.display) + "</div>" +
          '<div class="fr-team">' + esc(o.franchise_2025 || "") + (offices ? " · " + esc(offices) : "") + "</div></div>" +
        "</div>" +
        '<div class="fr-line">' +
          "<span>Career <b>" + rec(c) + "</b></span>" +
          "<span>Pct <b>" + pct(c.w, c.l, c.t) + "</b></span>" +
          "<span>PF <b>" + fmtPts(c.pf) + "</b></span>" +
          "<span>Titles <b>" + c.titles + "</b></span>" +
          "<span>Tallies <b>" + c.tallies + "</b></span>" +
          "<span>Playoffs <b>" + c.playoffs + "</b></span>" +
        "</div>" +
        sparkline(k) +
        '<div class="fr-line" style="margin-top:2px">' +
          (sp.nemesis ? "<span>Nemesis <b>" + esc(ownerName(sp.nemesis.o)) + " (" + rec(sp.nemesis.r) + ")</b></span>" : "") +
          (sp.favorite ? "<span>Favorite Opponent <b>" + esc(ownerName(sp.favorite.o)) + " (" + rec(sp.favorite.r) + ")</b></span>" : "") +
        "</div>" +
        sigGames(k) +
      "</div>";
    }).join("");

    /* Perkins registry footnote */
    var p = LEAGUE.owners.perkins, pc = p.career;
    $("#perkins-panel").innerHTML =
      '<div class="panel panel-pad reveal" style="border-left:3px solid var(--gold-dim);max-width:820px;margin:0 auto">' +
        '<div class="eyebrow left" style="margin-bottom:10px">Registry Footnote</div>' +
        '<div class="fr-name">' + esc(p.display) + "</div>" +
        '<p class="muted mt-1">' + esc((p.offices || []).join("; ")) + ". Career line: " + rec(pc) +
        ", " + fmtPts(pc.pf) + " PF, finished " + EFFL.ordinal(pc.best) + " in " + EFFL.years()[0] +
        ". One season, one playoff run, and a permanent line in the registry.</p>" +
      "</div>";
  };

  /* ======================================================================
     LEGISLATION TRACKER
     ====================================================================== */
  PAGES.legislation = function () {
    var motions = SITE.motions || [];
    var sessions = {};
    motions.forEach(function (m) { sessions[m.id.split("-")[0]] = 1; });
    $("#leg-sub").textContent = motions.length + " motions on the permanent record across " +
      Object.keys(sessions).length + " session" + (Object.keys(sessions).length === 1 ? "" : "s") +
      " of the Assembly. Vote tables as recorded by the Office of the Annotator.";

    var counts = { RATIFIED: 0, FAILED: 0, TABLED: 0, UNRESOLVED: 0 };
    motions.forEach(function (m) { counts[m.status] = (counts[m.status] || 0) + 1; });
    $("#leg-stats").innerHTML = [
      ["RATIFIED", "Ratified", "Now league law"],
      ["FAILED", "Failed", "The Assembly said no"],
      ["TABLED", "Tabled", "Postponed, as is tradition"],
      ["UNRESOLVED", "Unresolved", "History will note the silence"]
    ].map(function (s) {
      return '<div class="stat-card reveal"><div class="num">' + (counts[s[0]] || 0) +
        '</div><span class="label">' + s[1] + '</span><div class="sub">' + s[2] + "</div></div>";
    }).join("");

    function motionCard(m) {
      var voteKeys = Object.keys(m.votes || {});
      var tallyCounts = {};
      voteKeys.forEach(function (k) {
        var v = m.votes[k];
        tallyCounts[v] = (tallyCounts[v] || 0) + 1;
      });
      var tallyLine = Object.keys(tallyCounts).map(function (v) {
        return tallyCounts[v] + " " + esc(v);
      }).join(", ");
      var votes = voteKeys.length ?
        '<div class="vote-grid">' + EFFL.OWNER_ORDER.map(function (k) {
          var v = m.votes[k];
          return '<div class="vote-cell"><span class="who">' + esc(ownerName(k)) + '</span><span class="what' +
            (v === undefined ? " dim" : "") + '">' + (v === undefined ? "Not recorded" : esc(v)) + "</span></div>";
        }).join("") + "</div>" +
        '<div class="fr-line" style="margin-top:10px"><span>Tally <b>' + tallyLine + "</b></span></div>"
        : '<div class="empty-state mt-2" style="padding:16px">No votes were recorded, and none were expected.</div>';
      return '<div class="panel panel-pad motion-card reveal" data-search="' +
        esc((m.id + " " + m.title + " " + m.summary + " " + m.status).toLowerCase()) + '">' +
        '<div class="motion-head">' +
          '<span class="motion-id">' + esc(m.id) + "</span>" +
          '<span class="motion-title">' + esc(m.title) + "</span>" +
          '<span class="chip ' + esc(m.status.toLowerCase()) + '">' + esc(m.status) + "</span>" +
        "</div>" +
        '<p class="muted mt-1" style="font-size:.92rem">' + esc(m.summary) + "</p>" + votes +
      "</div>";
    }

    $("#motions").innerHTML = motions.map(motionCard).join("") ||
      '<div class="empty-state"><b>No Motions Yet</b>The Assembly has not convened.</div>';

    $("#leg-search").addEventListener("input", function () {
      var q = this.value.trim().toLowerCase();
      EFFL.$all("#motions .motion-card").forEach(function (card) {
        card.style.display = !q || card.dataset.search.indexOf(q) >= 0 ? "" : "none";
      });
    });
  };

  /* ======================================================================
     THE CONSTITUTION (document text lives in the HTML; dynamic bits here)
     ====================================================================== */
  PAGES.constitution = function () {
    $("#con-sub").textContent = "Twelve articles of league law, consolidated by the Office of the Annotator. " +
      "Est. " + LEAGUE.meta.est + " at " + LEAGUE.meta.origin + ".";

    /* Article X, Section 4: current pending obligation, from the data layer */
    var latest = EFFL.latestSeason();
    var t = latest.teams.filter(function (x) { return x.owner === latest.tally; })[0];
    $("#tally-obligation").textContent = "The " + latest.year + " obligation of " + t.team +
      " (" + t.w + " and " + t.l + ") is pending as of this writing.";

    /* signature seats, aliases only */
    $("#signature-seats").innerHTML = EFFL.OWNER_ORDER.map(function (k) {
      var offices = (LEAGUE.owners[k].offices || [])[0];
      return '<div class="panel" style="padding:18px 12px 12px;text-align:center">' +
        '<div class="hairline" style="margin-bottom:10px"></div>' +
        '<div class="display" style="font-size:1.4rem">' + esc(ownerName(k)) + "</div>" +
        '<div class="muted" style="font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;font-family:var(--font-label)">' +
        esc(offices || "Owner of Record") + "</div></div>";
    }).join("");
  };

  /* ======================================================================
     MINUTES ARCHIVE
     ====================================================================== */
  PAGES.minutes = function () {
    $("#min-owners").textContent = EFFL.OWNER_ORDER.map(function (k) { return ownerName(k); }).join(", ");
  };

  /* ======================================================================
     DRAFT CENTRAL
     ====================================================================== */
  PAGES.draft = function () {
    var nextYear = EFFL.latestSeason().year + 1;
    $("#draft-sub").textContent = "Snake format, 60 seconds a pick, " + LEAGUE.meta.platform +
      " platform of record. The " + nextYear + " board awaits.";
    EFFL.countdown($("#draft-countdown"), SITE.draftDate2026, "Date to be proclaimed");

    /* Codex summary cards */
    $("#codex-cards").innerHTML = [
      ["RB / WR / TE", "Eligibility", "Only running backs, wide receivers, and tight ends may be kept. Everyone else re-enters the pool."],
      ["RD 3+", "Round Restriction", "No player drafted in the 1st or 2nd round may be kept. Eligibility begins in the 3rd."],
      ["1", "Per Franchise", "Each franchise keeps a maximum of one player per season."],
      ["+1", "Escalation", "The cost is the round originally drafted, escalating one round per consecutive year kept."],
      ["6TH", "Free Agents", "A player acquired as a free agent may be kept at the cost of a 6th round pick."],
      ["3 YRS", "Term Limit", "No player may be kept more than 3 consecutive years. All dynasties end."]
    ].map(function (c) {
      return '<div class="stat-card reveal"><div class="num" style="font-size:2.2rem">' + c[0] +
        '</div><span class="label">' + c[1] + '</span><div class="sub">' + c[2] + "</div></div>";
    }).join("");

    /* calculator */
    var saved = EFFL.store.get("keeper_calc", { round: "8", years: "1" });
    var roundSel = $("#calc-round"), yearSel = $("#calc-years");
    var opts = "";
    for (var r = 3; r <= 16; r++) opts += '<option value="' + r + '">Round ' + r + "</option>";
    opts += '<option value="FA">Free Agent Pickup</option>';
    roundSel.innerHTML = opts;
    yearSel.innerHTML = [1, 2, 3].map(function (y) {
      return '<option value="' + y + '">Year ' + y + (y === 3 ? " (final year permitted)" : "") + "</option>";
    }).join("");
    roundSel.value = saved.round;
    yearSel.value = saved.years;
    if (roundSel.selectedIndex < 0) roundSel.value = "8";
    if (yearSel.selectedIndex < 0) yearSel.value = "1";

    function calc() {
      var rv = roundSel.value, yv = parseInt(yearSel.value, 10);
      EFFL.store.set("keeper_calc", { round: rv, years: String(yv) });
      var base = rv === "FA" ? 6 : parseInt(rv, 10);
      var owed = Math.max(1, base - (yv - 1));
      var basis = rv === "FA"
        ? "Free agent keepers cost a 6th round pick (Section 6)"
        : "He was drafted in round " + base + ", so year one costs that round (Section 5)";
      var esc5 = yv > 1 ? ", escalating one round per consecutive year kept" : "";
      $("#calc-out").innerHTML =
        '<div class="calc-result">' +
          '<div class="label" style="display:block;margin-bottom:8px">You Owe Your</div>' +
          '<div class="big">' + EFFL.ordinal(owed).toUpperCase() + " ROUND PICK</div>" +
          '<p class="expl">' + basis + esc5 + ". " +
          (yv === 3 ? "This is his final permitted year: the Codex allows no fourth (Section 7)." : "") + "</p>" +
        "</div>";
    }
    roundSel.addEventListener("change", calc);
    yearSel.addEventListener("change", calc);
    calc();

    /* keeper history from the data layer */
    var rows = [];
    LEAGUE.seasons.forEach(function (s) {
      (s.keepers || []).forEach(function (k) { rows.push({ year: s.year, k: k }); });
    });
    $("#keeper-history").innerHTML = rows.length
      ? '<div class="tbl-scroll"><table class="tbl"><thead><tr><th class="num-cell">Year</th><th>Player</th><th>Owner</th><th class="num-cell">Round Paid</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td class="num-cell">' + r.year + '</td><td class="owner-cell">' + esc(r.k.player || "") +
            "</td><td>" + esc(ownerName(r.k.owner || "")) + '</td><td class="num-cell">' + esc(String(r.k.rd || "")) + "</td></tr>";
        }).join("") + "</tbody></table></div>"
      : '<div class="empty-state"><b>No Keepers Declared Yet</b>The Codex took effect with the ' +
        LEAGUE.seasons.filter(function (s) { return s.year >= 2025; })[0].year +
        " draft and no franchise has yet paid the price. The first entry in this ledger will be historic.</div>";
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
