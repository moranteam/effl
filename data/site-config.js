// EFFL site-config.js
// Hand-edited content layer. league-data.js is machine-generated; this file is curated.
// TODO markers indicate content pending from the Annotator.

const SITE = {
  draftDate2026: null, // ISO string when announced; null renders "Date to be proclaimed"
  nextMeetingDate: null,

  news: [
    "EST. 2015 AT THE ESTATE, TEMPE, ARIZONA",
    "CHEN: FOUR TITLES, ZERO TALLIES. THE DYNASTY IS REAL",
    "GOV: 2025 CHAMPION. TALLY IN 2023. REDEMPTION COMPLETE",
    "ALL-TIME SINGLE WEEK: ROGUE, 267.0 (2015 PLAYOFFS)",
    "CLOSEST GAME EVER: ROGUE 113.54, CHEN 113.48 (2024)",
    "THE POWER INDEX SAYS HERM IS THE GREATEST OF ALL TIME. DISCUSS",
    "ROGUE OWES THE LEAGUE ONE TALLY. THE RECORD AWAITS PROOF OF INK",
    "VICTORIA AUT TATTOO"
  ],

  announcements: [], // Commissioner's Desk: {date, text}

  recaps: [], // The Booth: {season, week, title, body_html} newest first

  motions: [
    { id: "2025-I", title: "On the Scoring Format of the League", status: "FAILED",
      summary: "Motion to abandon Standard scoring for Half PPR. Deadlocked 4 to 4. Standard retained.",
      votes: { lop: "Half PPR", gov: "Half PPR", chen: "Standard", herm: "Half PPR", professor: "Standard", rogue: "Standard", charlie: "Half PPR", gary: "Standard" } },
    { id: "2025-II", title: "On the Adoption of an Auction Draft", status: "FAILED",
      summary: "Auction carried 6 to 2 but failed under the unanimity rule then in force. Snake retained.",
      votes: { lop: "Snake", gov: "Snake", chen: "Auction", herm: "Auction", professor: "Auction", rogue: "Auction", charlie: "Auction", gary: "Auction" } },
    { id: "2025-III", title: "On the Removal of Kris (Ceremonial)", status: "TABLED",
      summary: "Ceremonial motion, brought in the spirit of the bit. Postponed indefinitely, as is tradition. Honoree went on to win the 2025 championship.",
      votes: {} },
    { id: "2025-IV", title: "On the Amendment of the Voting Threshold", status: "RATIFIED",
      summary: "Unanimity abolished. League law now passes with 7 of 8 votes. The only unanimous vote of the session was the vote to abolish unanimity.",
      votes: { lop: "Yes", gov: "Yes", chen: "Yes", herm: "Yes", professor: "Yes", rogue: "Yes", charlie: "Yes", gary: "Yes" } },
    { id: "2025-V", title: "On the Tattoo Mandate for Incoming Owners", status: "FAILED",
      summary: "Rejected 3 to 5. No tattoo required for entry. The Tally Statute remains fully in force.",
      votes: { lop: "Yes", gov: "No", chen: "No", herm: "No", professor: "No", rogue: "Yes", charlie: "No", gary: "Yes" } },
    { id: "2025-VI", title: "On Expansion With a Tattoo Penalty for Losing", status: "UNRESOLVED",
      summary: "Met with near total silence. One recorded vote. History will note who stood alone.",
      votes: { rogue: "Yes" } },
    { id: "2025-VII", title: "On Expansion From 8 to 10 Owners", status: "FAILED",
      summary: "The league remains at 8 owners.",
      votes: { lop: "No", chen: "No", charlie: "Yes" } },
    { id: "2025-VIII", title: "On the Institution of the Keeper Rule", status: "RATIFIED",
      summary: "Keepers permitted, 7 to 1, effective the 2025 draft. The first law passed under the modern threshold, by exactly 7 votes. Chen dissented and was constitutionally overruled.",
      votes: { lop: "Yes", gov: "Yes", chen: "No", herm: "Yes", professor: "Yes", rogue: "Yes", charlie: "Yes", gary: "Yes" } }
  ],

  prophecies: { 2026: [] }, // {owner, text, verdict: null|"RIGHT"|"WRONG"}

  awards: [], // curated: {title, recipient, year, citation}

  transactions: [], // {year, headline, parties: [], details, verdict: "FAME"|"SHAME", annotator_note}

  mccockner: {
    name: "The McCockiner Cup", // spelling per the founding documents, confirmed by the Annotator July 2026
    origin: "Born a few years into the league from the desire to hold the draft live and in person each year, complete with a blowup draft board and every name posted in order. Each edition grew bigger, more serious, and more sophisticated in location, golf, and competition.",
    format: "Ryder Cup style. Teams drafted fresh every year, led by captains. The fantasy draft is held on site.",
    ethos: "Getting together with the boys in person, drafting, making fun of each other, and having a good laugh. Side bets and games are all part of the game.",
    trophy: "A large trophy, created by the league a couple years back.", // photos pending
    attendees_note: "Attendance has been the same crew every year.",
    trips: [
      { year: 2020, location: "Isle of Palms, South Carolina", courses: [], lodging: null,
        result: null, legend: "The inaugural McCockiner Cup, where Charlie achieved league-wide fame for a historic case of swamp ass in heat he had never before experienced." },
      { year: 2021, location: "Lake Tahoe (Incline Village, Nevada)",
        courses: ["Coyote Moon (Truckee)", "Incline Village Championship", "Incline Village Mountain"],
        lodging: "Lakefront house on Lakeshore Blvd, Incline Village, Nevada",
        teams: { a: ["gov", "chen", "lop", "professor"], b: ["charlie", "rogue", "herm", "gary"] },
        format_note: "Per the official memo and itinerary: a scramble at Coyote Moon, team play on the Championship course, singles on the Mountain course, with the draft held on site and Fred's steak at the residence.",
        result: null, legend: "The crew flew in from all over the country and landed directly into the Caldor Fire. Dense, eventually dangerous smoke ended the trip early, but every planned round was somehow played. The Cup that the mountain tried and failed to refuse." },
      { year: 2022, location: "Boyne, Michigan", courses: [],
        lodging: null,
        format_note: "Team Pervert against Team Sicko. Ten points across three days: two person aggregate, scramble, and alternate shot on day one, best ball on day two, singles match play on day three. A tie is settled by which team finishes a case of Heineken faster.",
        result: null, legend: "Arguably the greatest McCockiner Cup ever played. So good the league later returned for Chen's bachelor party." },
      { year: 2023, location: "Streamsong, Florida", courses: [],
        lodging: "Streamsong Resort, four Sunrise View studio suites, August 9 to 13",
        result: null, legend: "The hottest weekend on record. A feels-like temperature of 120 degrees, and one owner's composure did not survive it." }
    ],
    gap_note: "Dark years: 2015 to 2019 (the league had not yet organized the trip) and 2024 to 2026 (the weddings era). The record awaits the Return.",
    dream_venues: ["Pinehurst", "Pebble Beach", "Payne's Valley"],
    quotes: [
      { text: "She's fat naked", attribution: null },
      { text: "Check out my bets", attribution: null }
    ],
    revival: { planned: null, target: null }
  }
};
