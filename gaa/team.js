// GAA TEAM PROFILE PAGE

// -----------------------------------------------------------
// CONFIG – UPDATE THESE TO MATCH YOUR EXISTING SHEETS
// -----------------------------------------------------------

// 1 row per team (aggregated stats used by comparison & overview).
// Should include columns at least:
//   Team, PointsPerGame, GoalsPerGame, Accuracy, Possession
  const TEAM_STATS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=0&single=true&output=csv"; 
const SHOTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=835953916&single=true&output=csv"; 
const TRENDS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=1798327524&single=true&output=csv"; 
  
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

// -----------------------------------------------------------
// MAIN
// -----------------------------------------------------------

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

    const teamRow = teamStatsAll.find((r) => r.Team === teamName);
    const teamTrends = trendsAll.filter((r) => r.Team === teamName);
    const teamShots = shotsAll.filter((r) => r.Team === teamName);

    if (!teamRow && !teamTrends.length) {
      summaryLoadingEl.textContent = "";
      summaryErrorEl.style.display = "block";
      summaryErrorEl.textContent =
        "No stats found for this team in the dataset.";
      return;
    }

    // ----- SUMMARY CARD -----
    if (teamTrends.length) {
      const games = teamTrends.length;
      const totalActual = teamTrends.reduce(
        (acc, g) => acc + safeNum(g.ActualPoints),
        0
      );
      const totalExpected = teamTrends.reduce(
        (acc, g) => acc + safeNum(g.ExpectedPoints),
        0
      );

      document.getElementById("stat-games").textContent = games;
      document.getElementById("stat-avg-points").textContent = (
        totalActual / games
      ).toFixed(1);
      document.getElementById("stat-avg-xp").textContent = (
        totalExpected / games
      ).toFixed(1);
    } else if (teamRow) {
      document.getElementById("stat-games").textContent =
        teamRow.Games || "–";
      document.getElementById("stat-avg-points").textContent = (
        safeNum(teamRow.PointsPerGame) || 0
      ).toFixed(1);
      document.getElementById("stat-avg-xp").textContent = (
        safeNum(teamRow.ExpectedPointsPerGame) || 0
      ).toFixed(1);
    }

    let accuracyPct = teamRow ? safeNum(teamRow.Accuracy) : 0;
    if (!accuracyPct && teamTrends.length && teamTrends[0].ShotAccuracyPct) {
      accuracyPct =
        teamTrends.reduce(
          (acc, g) => acc + safeNum(g.ShotAccuracyPct),
          0
        ) / teamTrends.length;
    }
    document.getElementById("stat-accuracy").textContent =
      accuracyPct ? accuracyPct.toFixed(1) + "%" : "–";

    summaryLoadingEl.textContent = "";
    summaryContentEl.style.display = "grid";
    summaryNoteEl.textContent = teamTrends.length
      ? `Based on ${teamTrends.length} recorded games.`
      : `Based on aggregated team-level stats.`;

    // ----- CHARTS & MAP -----
    renderTrendChart(teamTrends, teamName);
    renderRadarChart(teamStatsAll, teamName);
    renderShotMap(teamShots, teamName);
  } catch (err) {
    console.error(err);
    summaryLoadingEl.textContent = "";
    summaryErrorEl.style.display = "block";
    summaryErrorEl.textContent =
      "There was a problem loading data for this team.";
  }
});

// -----------------------------------------------------------
// TREND CHART (Expected vs Actual points)
// -----------------------------------------------------------

let trendChartInstance = null;

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
        },
        {
          label: "Expected Points",
          data: expected,
          tension: 0.3,
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 3,
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
  const sign = diff > 0 ? "+" : "";
  noteEl.textContent = `${teamName} were ${sign}${diff.toFixed(
    1
  )} points vs expected in their most recent recorded game.`;
}

// -----------------------------------------------------------
// RADAR CHART (team vs league average)
// -----------------------------------------------------------

let radarChartInstance = null;

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
      return acc;
    },
    { points: 0, goals: 0, acc: 0, poss: 0 }
  );

  const leagueData = [
    leagueAgg.points / n,
    leagueAgg.goals / n,
    leagueAgg.acc / n,
    leagueAgg.poss / n,
  ];

  const teamData = [
    safeNum(thisTeam.PointsPerGame),
    safeNum(thisTeam.GoalsPerGame),
    safeNum(thisTeam.Accuracy),
    safeNum(thisTeam.Possession),
  ];

  const labels = [
    "Points/Game",
    "Goals/Game",
    "Accuracy %",
    "Possession %",
  ];

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
          fill: true,
        },
        {
          label: "League Average",
          data: leagueData,
          borderWidth: 2,
          borderDash: [4, 4],
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
