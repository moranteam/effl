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

})();

EFFL.init();
