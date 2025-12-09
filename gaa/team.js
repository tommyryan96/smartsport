// GAA TEAM PROFILE PAGE

// -----------------------------------------------------------
// CONFIG – your existing Google Sheets CSVs
// -----------------------------------------------------------

// 1 row per team (aggregated stats used by comparison & overview).
// Columns: Team, Games, PointsPerGame, ExpectedPointsPerGame, GoalsPerGame, Accuracy, Possession
const TEAM_STATS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=0&single=true&output=csv";

const SHOTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=835953916&single=true&output=csv";

const TRENDS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=1798327524&single=true&output=csv";

// Simple team colour mapping – tweak to taste
const TEAM_COLOURS = {
  Dublin: "#0f9cf5",
  Kerry: "#16a34a",
  Armagh: "#ea580c",
  Mayo: "#22c55e",
  Tyrone: "#dc2626",
  Galway: "#7c3aed",
};

// -----------------------------------------------------------
// CSV PARSER & HELPERS
// -----------------------------------------------------------

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines
    .slice(1)
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      const row = {};
      headers.forEach((h, i) => {
        row[h] = cols[i];
      });
      return row;
    });
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getTeamFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get("team");
  return t ? decodeURIComponent(t) : null;
}

function getTeamColour(teamName) {
  return TEAM_COLOURS[teamName] || "#2563eb";
}

// -----------------------------------------------------------
// MAIN
// -----------------------------------------------------------

let trendChartInstance = null;
let radarChartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  const teamName = getTeamFromQuery();
  const nameEl = document.getElementById("team-name");
  const summaryLoadingEl = document.getElementById("summary-loading");
  const summaryErrorEl = document.getElementById("summary-error");
  const summaryContentEl = document.getElementById("summary-content");
  const summaryNoteEl = document.getElementById("summary-note");

  if (!teamName) {
    nameEl.textContent = "No team selected";
    summaryLoadingEl.textContent =
      "Open this page via the dashboard so it has ?team= in the URL.";
    return;
  }

  nameEl.textContent = teamName + " – Team Profile";

  try {
    const [teamStatsRes, trendsRes, shotsRes] = await Promise.all([
      fetch(TEAM_STATS_CSV_URL),
      fetch(TRENDS_CSV_URL),
      fetch(SHOTS_CSV_URL),
    ]);

    if (!teamStatsRes.ok) throw new Error("Team stats CSV failed");
    if (!trendsRes.ok) throw new Error("Trends CSV failed");
    if (!shotsRes.ok) throw new Error("Shots CSV failed");

    const [teamStatsText, trendsText, shotsText] = await Promise.all([
      teamStatsRes.text(),
      trendsRes.text(),
      shotsRes.text(),
    ]);

    const teamStatsAll = parseCSV(teamStatsText);
    const trendsAll = parseCSV(trendsText);
    const shotsAll = parseCSV(shotsText);

    // Fill team switcher
    initTeamSwitcher(teamStatsAll, teamName);

    const teamRow = teamStatsAll.find((r) => r.Team === teamName);
    const teamTrends = trendsAll.filter((r) => r.Team === teamName);
    const teamShots = shotsAll.filter((r) => r.Team === teamName);

    if (!teamRow && !teamTrends.length) {
      summaryLoadingEl.textContent = "";
      summaryErrorEl.classList.remove("hidden");
      summaryErrorEl.textContent =
        "No stats found for this team in the dataset.";
      return;
    }

    // ----- SUMMARY CARD -----
    const agg = computeAggregates(teamTrends, teamRow);
    document.getElementById("stat-games").textContent =
      agg.games || teamTrends.length || teamRow?.Games || "–";
    document.getElementById("stat-avg-points").textContent =
      agg.avgActual ? agg.avgActual.toFixed(1) : "–";
    document.getElementById("stat-avg-xp").textContent =
      agg.avgExpected ? agg.avgExpected.toFixed(1) : "–";
    document.getElementById("stat-accuracy").textContent =
      agg.avgAccuracy ? agg.avgAccuracy.toFixed(1) + "%" : "–";

    summaryLoadingEl.textContent = "";
    summaryContentEl.classList.remove("hidden");
    summaryContentEl.classList.add("grid");
    summaryNoteEl.textContent = teamTrends.length
      ? `Based on ${teamTrends.length} recorded games.`
      : `Based on aggregated team-level stats.`;

    // ----- CHARTS & MAP & RECENT MATCHES -----
    renderTrendChart(teamTrends, teamName);
    renderRadarChart(teamStatsAll, teamName);
    renderShotMap(teamShots, teamName);
    renderRecentMatches(teamTrends, teamName);
  } catch (err) {
    console.error(err);
    summaryLoadingEl.textContent = "";
    summaryErrorEl.classList.remove("hidden");
    summaryErrorEl.textContent =
      "There was a problem loading data for this team.";
  }
});

// -----------------------------------------------------------
// AGGREGATIONS
// -----------------------------------------------------------

function computeAggregates(teamTrends, teamRow) {
  const result = {
    games: 0,
    avgActual: 0,
    avgExpected: 0,
    avgAccuracy: 0,
  };

  if (teamTrends && teamTrends.length) {
    const games = teamTrends.length;
    const sums = teamTrends.reduce(
      (acc, g) => {
        acc.actual += safeNum(g.ActualPoints);
        acc.expected += safeNum(g.ExpectedPoints);
        acc.accPct += safeNum(g.ShotAccuracyPct || g.Accuracy);
        return acc;
      },
      { actual: 0, expected: 0, accPct: 0 }
    );

    result.games = games;
    result.avgActual = sums.actual / games;
    result.avgExpected = sums.expected / games;
    result.avgAccuracy = sums.accPct / games;
    return result;
  }

  if (teamRow) {
    result.games = safeNum(teamRow.Games);
    result.avgActual = safeNum(teamRow.PointsPerGame);
    result.avgExpected = safeNum(teamRow.ExpectedPointsPerGame);
    result.avgAccuracy = safeNum(teamRow.Accuracy);
  }

  return result;
}

// -----------------------------------------------------------
// TREND CHART (Expected vs Actual points)
// -----------------------------------------------------------

function renderTrendChart(teamTrends, teamName) {
  const ctx = document.getElementById("trend-chart");
  const noteEl = document.getElementById("trend-note");
  if (!ctx) return;

  if (!teamTrends.length) {
    noteEl.textContent =
      "No game-by-game expected points data available for this team yet.";
    return;
  }

  const sorted = [...teamTrends].sort(
    (a, b) => new Date(a.MatchDate) - new Date(b.MatchDate)
  );

  const labels = sorted.map((g) => g.MatchDate);
  const actual = sorted.map((g) => safeNum(g.ActualPoints));
  const expected = sorted.map((g) => safeNum(g.ExpectedPoints));
  const colour = getTeamColour(teamName);

  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Actual Points",
          data: actual,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          borderColor: colour,
          backgroundColor: colour + "33",
          fill: true,
        },
        {
          label: "Expected Points",
          data: expected,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          borderDash: [6, 4],
          borderColor: "#6b7280",
          backgroundColor: "#6b728020",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: { position: "top" },
      },
    },
  });

  const last = sorted[sorted.length - 1];
  const diff = safeNum(last.ActualPoints) - safeNum(last.ExpectedPoints);
  const sign = diff > 0 ? "+" : diff < 0 ? "" : "";
  noteEl.textContent = `${teamName} were ${sign}${diff.toFixed(
    1
  )} points vs expected in their most recent recorded game.`;
}

// -----------------------------------------------------------
// RADAR CHART (team vs league average)
// -----------------------------------------------------------

function renderRadarChart(allTeamStats, teamName) {
  const ctx = document.getElementById("radar-chart");
  if (!ctx) return;

  const thisTeam = allTeamStats.find((r) => r.Team === teamName);
  if (!thisTeam) return;

  const teams = allTeamStats.filter((r) => r.Team);
  const n = teams.length || 1;

  const leagueAgg = teams.reduce(
    (acc, t) => {
      acc.points += safeNum(t.PointsPerGame);
      acc.goals += safeNum(t.GoalsPerGame);
      acc.acc += safeNum(t.Accuracy);
      acc.poss += safeNum(t.Possession);
      acc.xp += safeNum(t.ExpectedPointsPerGame);
      return acc;
    },
    { points: 0, goals: 0, acc: 0, poss: 0, xp: 0 }
  );

  const leagueData = [
    leagueAgg.points / n,
    leagueAgg.goals / n,
    leagueAgg.acc / n,
    leagueAgg.poss / n,
    leagueAgg.xp / n,
  ];

  const teamData = [
    safeNum(thisTeam.PointsPerGame),
    safeNum(thisTeam.GoalsPerGame),
    safeNum(thisTeam.Accuracy),
    safeNum(thisTeam.Possession),
    safeNum(thisTeam.ExpectedPointsPerGame),
  ];

  const labels = [
    "Points/Game",
    "Goals/Game",
    "Accuracy %",
    "Possession %",
    "xPoints/Game",
  ];

  const colour = getTeamColour(teamName);

  if (radarChartInstance) radarChartInstance.destroy();

  radarChartInstance = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: teamName,
          data: teamData,
          borderWidth: 2,
          borderColor: colour,
          backgroundColor: colour + "33",
          fill: true,
        },
        {
          label: "League Average",
          data: leagueData,
          borderWidth: 2,
          borderDash: [4, 4],
          borderColor: "#6b7280",
          backgroundColor: "#6b728020",
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          ticks: { display: false },
        },
      },
      plugins: {
        legend: { position: "top" },
      },
    },
  });
}

// -----------------------------------------------------------
// SHOT MAP
// -----------------------------------------------------------

function renderShotMap(shots, teamName) {
  const canvas = document.getElementById("shot-map");
  const noteEl = document.getElementById("shot-note");
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  const padX = 40;
  const padY = 30;
  const left = padX;
  const right = w - padX;
  const top = padY;
  const bottom = h - padY;

  ctx.clearRect(0, 0, w, h);

  if (!shots.length) {
    noteEl.textContent = `No shot-level data recorded for ${teamName} yet.`;
    return;
  }

  shots.forEach((s) => {
    const xPct = safeNum(s.X); // 0–100
    const yPct = safeNum(s.Y); // 0–100

    const x = left + (xPct / 100) * (right - left);
    const y = top + (yPct / 100) * (bottom - top);

    const result = (s.Result || "").toLowerCase();

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle =
      result === "point" || result === "score" || result === "goal"
        ? "#22c55e"
        : "#ef4444";
    ctx.fill();
  });

  noteEl.textContent = `${shots.length} shots plotted for ${teamName}.`;
}

// -----------------------------------------------------------
// RECENT MATCHES
// -----------------------------------------------------------

function renderRecentMatches(teamTrends, teamName) {
  const listEl = document.getElementById("recent-matches-list");
  const emptyEl = document.getElementById("recent-matches-empty");
  if (!listEl || !emptyEl) return;

  if (!teamTrends.length) {
    listEl.innerHTML = "";
    emptyEl.textContent =
      "Game-by-game data not available yet for this team.";
    return;
  }

  const sorted = [...teamTrends]
    .sort((a, b) => new Date(b.MatchDate) - new Date(a.MatchDate))
    .slice(0, 5);

  listEl.innerHTML = "";
  emptyEl.textContent = "";

  sorted.forEach((g) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    const right = document.createElement("div");

    const date = g.MatchDate || "";
    const opp = g.Opponent || "";
    const comp = g.Competition || "";

    const title = document.createElement("div");
    title.textContent = opp ? `${teamName} vs ${opp}` : teamName;
    title.className = "font-medium";

    const meta = document.createElement("div");
    meta.className = "recent-matches-meta";
    meta.textContent = [date, comp].filter(Boolean).join(" · ");

    left.appendChild(title);
    left.appendChild(meta);

    const actual = safeNum(g.ActualPoints);
    const expected = safeNum(g.ExpectedPoints);
    const diff = actual - expected;

    const scoreEl = document.createElement("div");
    scoreEl.textContent = `${actual.toFixed(1)} pts`;

    const diffEl = document.createElement("div");
    diffEl.textContent =
      diff > 0
        ? `+${diff.toFixed(1)} vs xP`
        : diff < 0
        ? `${diff.toFixed(1)} vs xP`
        : "Even vs xP";

    diffEl.className =
      diff > 0
        ? "xp-diff-positive"
        : diff < 0
        ? "xp-diff-negative"
        : "xp-diff-even";

    right.className = "text-right";
    right.appendChild(scoreEl);
    right.appendChild(diffEl);

    li.appendChild(left);
    li.appendChild(right);
    listEl.appendChild(li);
  });
}

// -----------------------------------------------------------
// TEAM SWITCHER
// -----------------------------------------------------------

function initTeamSwitcher(teamStatsAll, currentTeam) {
  const select = document.getElementById("team-switch-select");
  if (!select) return;

  const teams = [...new Set(teamStatsAll.map((t) => t.Team).filter(Boolean))].sort();

  select.innerHTML = "";
  teams.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    if (t === currentTeam) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    const t = select.value;
    if (!t) return;
    window.location.href = `team.html?team=${encodeURIComponent(t)}`;
  });
}
