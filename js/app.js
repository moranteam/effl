/* ==========================================================================
   EFFL app.js
   Shared chrome (ticker, nav, footer), helpers, and computed utilities.
   All stats render from LEAGUE (data/league-data.js) and SITE
   (data/site-config.js). Nothing here hardcodes a number.
   ========================================================================== */

"use strict";

var EFFL = (function () {

  /* ---------- tiny DOM + format helpers ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fmtNum(n) { return Number(n).toLocaleString("en-US"); }

  function fmtPts(n) {
    var v = Number(n);
    return (Math.round(v * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function pct(w, l, t) {
    var g = w + l + (t || 0);
    if (!g) return ".000";
    var p = (w + (t || 0) * 0.5) / g;
    return (p >= 1 ? "1.000" : p.toFixed(3).replace(/^0/, ""));
  }

  function ordinal(n) {
    var s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function rec(o) { return o.w + "-" + o.l + (o.t ? "-" + o.t : ""); }

  /* ---------- localStorage (prefix effl_v1_) ---------- */

  var store = {
    get: function (k, fallback) {
      try {
        var v = localStorage.getItem("effl_v1_" + k);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (k, v) {
      try { localStorage.setItem("effl_v1_" + k, JSON.stringify(v)); } catch (e) { /* private mode */ }
    }
  };

  /* ---------- owners ---------- */

  var OWNER_ORDER = ["lop", "chen", "herm", "gov", "professor", "rogue", "charlie", "gary"];
  var OWNER_ORDER_ALL = OWNER_ORDER.concat(["perkins"]);

  var CHART_COLORS = {
    lop: "var(--chart-3)", chen: "var(--chart-1)", herm: "var(--chart-2)",
    gov: "var(--chart-4)", professor: "var(--chart-6)", rogue: "var(--chart-5)",
    charlie: "var(--chart-7)", gary: "var(--chart-8)", perkins: "var(--chart-9)"
  };

  function ownerName(key) {
    var o = LEAGUE.owners[key];
    return o ? o.display : key;
  }

  function teamOf(key, year) {
    var s = seasonByYear(year);
    if (s) {
      for (var i = 0; i < s.teams.length; i++) {
        if (s.teams[i].owner === key) return s.teams[i].team;
      }
    }
    return ownerName(key);
  }

  function seasonByYear(y) {
    for (var i = 0; i < LEAGUE.seasons.length; i++) {
      if (LEAGUE.seasons[i].year === y) return LEAGUE.seasons[i];
    }
    return null;
  }

  function latestSeason() {
    return LEAGUE.seasons.reduce(function (a, b) { return b.year > a.year ? b : a; });
  }

  function years() {
    return LEAGUE.seasons.map(function (s) { return s.year; }).sort(function (a, b) { return a - b; });
  }

  /* ---------- computed: all time records for the ticker ---------- */

  function computedTickerItems() {
    var r = LEAGUE.records;
    var items = [];
    var top = r.top_weeks[0];
    items.push("ALL TIME HIGH WEEK: <b>" + esc(ownerName(top.owner).toUpperCase()) + " " + fmtPts(top.pts) + "</b> (" + top.year + ", WK " + top.week + ")");
    var low = r.low_weeks[0];
    items.push("ALL TIME LOW WEEK: <b>" + esc(ownerName(low.owner).toUpperCase()) + " " + fmtPts(low.pts) + "</b> (" + low.year + ", WK " + low.week + ")");
    var blow = r.blowouts[0];
    var margin = Math.abs(blow.a_pts - blow.b_pts);
    items.push("BIGGEST BLOWOUT: <b>" + fmtPts(margin) + " PTS</b>, " + esc(ownerName(blow.a_pts > blow.b_pts ? blow.a : blow.b).toUpperCase()) + " OVER " + esc(ownerName(blow.a_pts > blow.b_pts ? blow.b : blow.a).toUpperCase()) + " (" + blow.year + ")");
    var pf = r.best_pf_seasons[0];
    items.push("BEST SCORING SEASON EVER: <b>" + esc(ownerName(pf.owner).toUpperCase()) + ", " + fmtPts(pf.pf) + " PF</b> (" + pf.year + ")");
    var eloLeader = Object.keys(r.elo_final).filter(function (k) { return OWNER_ORDER.indexOf(k) >= 0; })
      .sort(function (a, b) { return r.elo_final[b] - r.elo_final[a]; })[0];
    items.push("CAREER ELO LEADER: <b>" + esc(ownerName(eloLeader).toUpperCase()) + " (" + fmtNum(r.elo_final[eloLeader]) + ")</b>");
    var latest = latestSeason();
    items.push(latest.year + " CHAMPION: <b>" + esc(ownerName(latest.champion).toUpperCase()) + "</b> · TALLY: <b>" + esc(ownerName(latest.tally).toUpperCase()) + "</b>");
    return items;
  }

  /* ---------- chrome: ticker ---------- */

  function buildTicker() {
    var host = $("#ticker");
    if (!host) return;
    var items = (SITE.news || []).map(function (s) { return esc(s); }).concat(computedTickerItems());
    var html = items.map(function (t) {
      return '<span class="ticker-item">' + t + '</span><span class="ticker-sep">◆</span>';
    }).join("");
    var secs = Math.max(40, items.length * 7);
    host.style.setProperty("--ticker-secs", secs + "s");
    host.innerHTML = '<div class="ticker-track">' + html + html + "</div>";
  }

  /* ---------- chrome: nav ---------- */

  var NAV_GROUPS = [
    { title: "History", links: [
      ["champions.html", "Hall of Champions"],
      ["seasons.html", "Season Archive"],
      ["records.html", "The Record Book"],
      ["h2h.html", "Head to Head"],
      ["power.html", "The Power Index"],
      ["awards.html", "Awards"]
    ]},
    { title: "The League", links: [
      ["franchises.html", "Franchises"],
      ["tally.html", "The Tally Wall"],
      ["transactions.html", "Fame and Shame"],
      ["prophecies.html", "Prophecies"]
    ]},
    { title: "Governance", links: [
      ["legislation.html", "Legislation Tracker"],
      ["constitution.html", "The Constitution"],
      ["minutes.html", "Minutes Archive"]
    ]},
    { title: "Events", links: [
      ["draft.html", "Draft Central"],
      ["mccockner.html", "The McCockiner Cup"],
      ["trophy.html", "The Trophy Room"]
    ]}
  ];

  function currentFile() {
    var p = location.pathname.split("/").pop();
    return p === "" ? "index.html" : p;
  }

  function buildNav() {
    var host = $("#site-nav");
    if (!host) return;
    var here = currentFile();
    function link(href, label, cls) {
      var cur = href === here ? ' aria-current="page"' : "";
      return '<a href="' + href + '"' + cur + (cls ? ' class="' + cls + '"' : "") + ">" + esc(label) + "</a>";
    }
    var groups = NAV_GROUPS.map(function (g) {
      var open = g.links.some(function (l) { return l[0] === here; });
      return '<div class="nav-group">' +
        '<button type="button" aria-haspopup="true"' + (open ? ' aria-current="page"' : "") + ">" + esc(g.title) + "</button>" +
        '<div class="nav-drop">' + g.links.map(function (l) { return link(l[0], l[1]); }).join("") + "</div>" +
        "</div>";
    }).join("");
    host.innerHTML =
      '<div class="nav-inner">' +
        '<a class="brand" href="index.html" aria-label="EFFL home">' +
          '<img src="assets/EFFL_Crest.png" alt="EFFL crest" width="44" height="44">' +
          '<span><span class="brand-top">The Estate</span><span class="brand-name">EFFL</span></span>' +
        "</a>" +
        '<div class="nav-groups">' +
          '<div class="nav-group">' + link("index.html", "Home") + "</div>" + groups +
        "</div>" +
        '<button class="nav-burger" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      "</div>" +
      '<div class="nav-overlay" id="nav-overlay">' +
        '<div class="ov-group"><div class="ov-title">Front Office</div>' + link("index.html", "Home") + "</div>" +
        NAV_GROUPS.map(function (g) {
          return '<div class="ov-group"><div class="ov-title">' + esc(g.title) + "</div>" +
            g.links.map(function (l) { return link(l[0], l[1]); }).join("") + "</div>";
        }).join("") +
      "</div>";

    var burger = $(".nav-burger", host);
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $all("#nav-overlay a", host).forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
    });
  }

  /* ---------- chrome: Commissioner's Desk ---------- */

  function buildCommishBar() {
    var host = $("#commish-bar");
    if (!host) return;
    var a = SITE.announcements || [];
    if (!a.length) { host.remove(); return; }
    var latest = a[a.length - 1];
    host.className = "commish-bar";
    host.innerHTML = "<b>Commissioner's Desk</b> " + esc(latest.text) + (latest.date ? ' <span class="muted">(' + esc(latest.date) + ")</span>" : "");
  }

  /* ---------- chrome: footer ---------- */

  function buildFooter() {
    var host = $("#site-footer");
    if (!host) return;
    host.className = "site-footer";
    host.innerHTML =
      '<img src="assets/EFFL_Crest.png" alt="" aria-hidden="true">' +
      '<div class="footer-motto">' + esc(LEAGUE.meta.motto) + "</div>" +
      '<div class="footer-est">Est. ' + LEAGUE.meta.est + " · " + esc(LEAGUE.meta.origin) + "</div>" +
      '<p class="footer-quote">“' + esc(LEAGUE.meta.quote) + "”</p>" +
      '<div class="footer-fine">' + esc(LEAGUE.meta.name) + " · Maintained by the Office of the Annotator · " +
      '<a href="constitution.html">Constitution</a> · <a href="minutes.html">The Record</a></div>';
  }

  /* ---------- countdown ---------- */

  function countdown(host, iso, tbdText) {
    if (!host) return;
    if (!iso) {
      host.innerHTML = '<div class="count-tbd">' + esc(tbdText || "Date to be proclaimed") + "</div>";
      return;
    }
    var target = new Date(iso).getTime();
    function tick() {
      var d = target - Date.now();
      if (d <= 0) {
        host.innerHTML = '<div class="count-tbd">It is draft day.</div>';
        return;
      }
      var days = Math.floor(d / 864e5),
          hrs = Math.floor(d % 864e5 / 36e5),
          min = Math.floor(d % 36e5 / 6e4),
          sec = Math.floor(d % 6e4 / 1e3);
      host.innerHTML = '<div class="countdown">' + [
        [days, "Days"], [hrs, "Hours"], [min, "Minutes"], [sec, "Seconds"]
      ].map(function (u) {
        return '<div class="count-unit"><div class="n">' + String(u[0]).padStart(2, "0") + '</div><div class="u">' + u[1] + "</div></div>";
      }).join("") + "</div>";
      setTimeout(tick, 1000);
    }
    tick();
  }

  /* ---------- sortable tables ---------- */

  function makeSortable(table) {
    var ths = $all("thead th", table);
    ths.forEach(function (th, idx) {
      if (th.dataset.nosort !== undefined) return;
      th.classList.add("sortable");
      th.addEventListener("click", function () {
        var dir = th.classList.contains("desc") ? "asc" : "desc";
        ths.forEach(function (h) { h.classList.remove("asc", "desc"); });
        th.classList.add(dir);
        var tbody = $("tbody", table);
        var rows = $all("tr", tbody);
        rows.sort(function (a, b) {
          var av = cellVal(a, idx), bv = cellVal(b, idx);
          if (typeof av === "number" && typeof bv === "number") return dir === "asc" ? av - bv : bv - av;
          return dir === "asc" ? String(av).localeCompare(bv) : String(bv).localeCompare(av);
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
      });
    });
    function cellVal(tr, idx) {
      var td = tr.children[idx];
      if (!td) return "";
      if (td.dataset.val !== undefined) {
        var n = parseFloat(td.dataset.val);
        return isNaN(n) ? td.dataset.val : n;
      }
      var t = td.textContent.trim().replace(/,/g, "");
      var n2 = parseFloat(t);
      return isNaN(n2) ? t.toLowerCase() : n2;
    }
  }

  /* ---------- computed: matchups helpers ---------- */

  function gamesOf(key) {
    var out = [];
    LEAGUE.matchups.forEach(function (m) {
      if (m.a === key || m.b === key) {
        var me = m.a === key ? m.a_pts : m.b_pts;
        var oppKey = m.a === key ? m.b : m.a;
        var opp = m.a === key ? m.b_pts : m.a_pts;
        out.push({ year: m.year, week: m.week, playoff: m.playoff, pts: me, opp: oppKey, opp_pts: opp, won: me > opp, tied: me === opp });
      }
    });
    return out;
  }

  function rivalryGames(a, b) {
    return LEAGUE.matchups.filter(function (m) {
      return (m.a === a && m.b === b) || (m.a === b && m.b === a);
    });
  }

  function seasonWeeks(year) {
    var byWeek = {};
    LEAGUE.matchups.forEach(function (m) {
      if (m.year !== year) return;
      (byWeek[m.week] = byWeek[m.week] || []).push(m);
    });
    return Object.keys(byWeek).map(Number).sort(function (a, b) { return a - b; })
      .map(function (w) { return { week: w, games: byWeek[w], playoff: byWeek[w].some(function (g) { return g.playoff; }) }; });
  }

  /* Reconstruct the playoff bracket for a season from matchups.
     Semifinal week: earlier playoff week. Championship: final week game
     between the recorded champion and runner up. Third place: final week
     game between the semifinal losers. The rest is the consolation ladder. */
  function bracket(year) {
    var s = seasonByYear(year);
    var po = LEAGUE.matchups.filter(function (m) { return m.year === year && m.playoff; });
    if (!po.length || !s) return null;
    var wks = po.map(function (m) { return m.week; });
    var semiWk = Math.min.apply(null, wks), finalWk = Math.max.apply(null, wks);
    function inGame(m, k) { return m.a === k || m.b === k; }
    var final = po.find(function (m) {
      return m.week === finalWk && inGame(m, s.champion) && inGame(m, s.runner_up);
    }) || null;
    var semis = po.filter(function (m) {
      return m.week === semiWk && (inGame(m, s.champion) || inGame(m, s.runner_up));
    });
    var semiLosers = semis.map(function (m) { return m.a_pts > m.b_pts ? m.b : m.a; });
    var third = po.find(function (m) {
      return m.week === finalWk && semiLosers.length === 2 && inGame(m, semiLosers[0]) && inGame(m, semiLosers[1]);
    }) || null;
    var used = semis.concat(final ? [final] : [], third ? [third] : []);
    var consolation = po.filter(function (m) { return used.indexOf(m) < 0; });
    var champWon = final ? ((final.a === s.champion ? final.a_pts : final.b_pts) > (final.a === s.champion ? final.b_pts : final.a_pts)) : false;
    return { semis: semis, final: final, third: third, consolation: consolation, semiWk: semiWk, finalWk: finalWk, valid: !!final && champWon && semis.length === 2 };
  }

  /* ---------- computed: Elo series per owner ---------- */

  function eloSeries() {
    var series = {};
    OWNER_ORDER_ALL.forEach(function (k) { series[k] = []; });
    var tl = LEAGUE.records.elo_timeline;
    for (var i = 0; i < tl.length; i++) {
      var e = tl[i];
      if (series[e.a]) series[e.a].push({ i: i, y: e.y, r: e.ra });
      if (series[e.b]) series[e.b].push({ i: i, y: e.y, r: e.rb });
    }
    return series;
  }

  /* ---------- computed: This Week in EFFL History ---------- */

  function currentHistoryWeek() {
    /* In season (Sep to Jan) approximate the live NFL week.
       Offseason: rotate through weeks 1 to 17 by day of year. */
    var now = new Date();
    var m = now.getMonth();
    if (m >= 8 || m === 0) {
      var seasonStart = new Date(m === 0 ? now.getFullYear() - 1 : now.getFullYear(), 8, 4);
      var wk = Math.floor((now - seasonStart) / (7 * 864e5)) + 1;
      return Math.min(17, Math.max(1, wk));
    }
    var doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
    return (doy % 17) + 1;
  }

  function thisWeekInHistory(count) {
    var wk = currentHistoryWeek();
    var pool = LEAGUE.matchups.filter(function (m) { return m.week === wk; });
    if (!pool.length) return { week: wk, games: [] };
    /* deterministic daily rotation through the pool */
    var day = Math.floor(Date.now() / 864e5);
    var out = [];
    for (var i = 0; i < Math.min(count, pool.length); i++) {
      out.push(pool[(day * 7 + i * 13) % pool.length]);
    }
    /* dedupe, keep order */
    var seen = {};
    out = out.filter(function (m) {
      var k = m.year + "_" + m.a + "_" + m.b;
      if (seen[k]) return false;
      seen[k] = 1; return true;
    });
    return { week: wk, games: out };
  }

  /* ---------- scroll reveal ---------- */

  function initReveal() {
    var els = $all(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: .08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- boot ---------- */

  function init() {
    buildTicker();
    buildNav();
    buildCommishBar();
    buildFooter();
    var page = document.body.dataset.page;
    if (window.PAGES && typeof PAGES[page] === "function") PAGES[page]();
    initReveal();
  }

  return {
    $: $, $all: $all, esc: esc,
    fmtNum: fmtNum, fmtPts: fmtPts, pct: pct, ordinal: ordinal, rec: rec,
    store: store,
    OWNER_ORDER: OWNER_ORDER, OWNER_ORDER_ALL: OWNER_ORDER_ALL, CHART_COLORS: CHART_COLORS,
    ownerName: ownerName, teamOf: teamOf, seasonByYear: seasonByYear, latestSeason: latestSeason, years: years,
    countdown: countdown, makeSortable: makeSortable,
    gamesOf: gamesOf, rivalryGames: rivalryGames, seasonWeeks: seasonWeeks, bracket: bracket,
    eloSeries: eloSeries, thisWeekInHistory: thisWeekInHistory,
    ornament: '<div class="ornament" aria-hidden="true"><i></i><i></i><i></i></div>',
    init: init
  };
})();
