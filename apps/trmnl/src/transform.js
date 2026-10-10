function transform(input) {
  function json(idx) {
    var v = input[idx];
    return (v && v.result && v.result.data && v.result.data.json) || null;
  }
  var stats = json("IDX_0");
  var standings = json("IDX_1");
  var global = json("IDX_2");
  var latest = json("IDX_3") || [];
  var allTime = json("IDX_4");
  if (!stats) return input;

  var total = stats.currentSeasonWedgies || 0;
  var games = stats.gamesPlayed || 0;
  var record = stats.previousRecord || 0;
  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  var last = null;
  var daysSince = null;
  if (stats.lastWedgie) {
    var d = new Date(stats.lastWedgie);
    last =
      d.getUTCDate() + " " + months[d.getUTCMonth()] + " " + d.getUTCFullYear();
    daysSince = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  }

  // Same fill as the website's Wave: total against a target of 50, capped at 100%.
  // At 0 a low wave still shows along the bottom, as on the website.
  var fill = Math.min((total / 50) * 100, 100);
  var t = 100 - fill;
  function wave(top, shift) {
    var y = top.toFixed(1),
      c = (top - 4).toFixed(1),
      x0 = -shift;
    return (
      "M" +
      x0 +
      " " +
      y +
      " Q" +
      (x0 + 18.75) +
      " " +
      c +
      " " +
      (x0 + 37.5) +
      " " +
      y +
      " T" +
      (x0 + 75) +
      " " +
      y +
      " T" +
      (x0 + 112.5) +
      " " +
      y +
      " T" +
      (x0 + 150) +
      " " +
      y +
      " T" +
      (x0 + 187.5) +
      " " +
      y +
      " V100 H" +
      x0 +
      " Z"
    );
  }
  function sparkle(x, y, r, color) {
    return (
      '<path d="M' +
      x +
      " " +
      (y - r) +
      " Q" +
      x +
      " " +
      y +
      " " +
      (x + r) +
      " " +
      y +
      " Q" +
      x +
      " " +
      y +
      " " +
      x +
      " " +
      (y + r) +
      " Q" +
      x +
      " " +
      y +
      " " +
      (x - r) +
      " " +
      y +
      " Q" +
      x +
      " " +
      y +
      " " +
      x +
      " " +
      (y - r) +
      'Z" fill="' +
      color +
      '"/>'
    );
  }
  var waveSvg;
  if (fill >= 100) {
    // Full tank: solid fill plus sparkles and confetti dots around the edges, like the
    // website's confetti. "slice" keeps the sparkles from being stretched.
    var marks = "";
    [
      [12, 14, 7, "#fff"],
      [138, 12, 6, "#fff"],
      [22, 86, 5, "#fff"],
      [130, 88, 7, "#fff"],
      [8, 50, 4, "#000"],
      [143, 52, 4, "#000"],
      [40, 8, 3, "#000"],
      [112, 92, 3, "#000"],
      [34, 30, 3, "#fff"],
      [118, 26, 3, "#fff"],
    ].forEach(function (s) {
      marks += sparkle(s[0], s[1], s[2], s[3]);
    });
    [
      [26, 12, "#000"],
      [124, 10, "#fff"],
      [6, 30, "#fff"],
      [146, 32, "#000"],
      [10, 72, "#000"],
      [142, 74, "#fff"],
      [44, 92, "#fff"],
      [102, 6, "#000"],
      [58, 94, "#000"],
      [92, 94, "#fff"],
    ].forEach(function (d) {
      marks +=
        '<circle cx="' +
        d[0] +
        '" cy="' +
        d[1] +
        '" r="1.6" fill="' +
        d[2] +
        '"/>';
    });
    waveSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100" preserveAspectRatio="xMidYMid slice">' +
      '<rect x="-50" y="-50" width="250" height="200" fill="#9a9a9a"/>' +
      marks +
      "</svg>";
  } else {
    waveSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100" preserveAspectRatio="none">' +
      '<path d="' +
      wave(Math.min(Math.max(t, 4), 88), 18.75) +
      '" fill="#d9d9d9"/>' +
      '<path d="' +
      wave(Math.min(Math.max(t + 2, 4), 90), 0) +
      '" fill="#9a9a9a"/></svg>';
  }

  var recordLabel =
    total > record
      ? "NEW ALL-TIME RECORD"
      : total === record
        ? "ALL-TIME RECORD TIED"
        : "WE'RE AT";

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }
  var latestWedgies = latest.slice(0, 3).map(function (w) {
    var wd = new Date(w.wedgieDate);
    return {
      number: w.number,
      date:
        pad(wd.getUTCDate()) +
        "." +
        pad(wd.getUTCMonth() + 1) +
        "." +
        String(wd.getUTCFullYear()).slice(2),
      player: w.playerName,
      team: w.teamName,
      against: w.teamAgainstName,
      type: ((w.types && w.types[0] && w.types[0].name) || "").toUpperCase(),
    };
  });

  var players = (standings && standings.players) || [];
  var teams = (standings && standings.teams) || [];

  return {
    season: (global && global.currentSeason && global.currentSeason.name) || "",
    total: total,
    games: games,
    pace: stats.currentPace || 0,
    // The website only shows pace when it differs from the current total.
    show_pace: (stats.currentPace || 0) !== total,
    all_time: typeof allTime === "number" ? allTime : null,
    latest: latestWedgies,
    record: record,
    record_pct:
      record > 0 ? Math.min(100, Math.round((total / record) * 100)) : 0,
    record_broken: record > 0 && total > record,
    record_label: recordLabel,
    wave_svg: waveSvg,
    last_wedgie: last,
    days_since: daysSince,
    live: !!stats.liveGames,
    has_wedgies: total > 0 && !!(standings && standings.hasWedgiesThisSeason),
    players: players.slice(0, 5),
    teams: teams.slice(0, 5),
  };
}
