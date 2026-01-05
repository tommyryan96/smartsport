// ===========================================================
// GAA TEAM PROFILE PAGE – FIXED & HARDENED
// ===========================================================

// ---------------- CONFIG ----------------

const TEAM_STATS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=0&single=true&output=csv";

const SHOTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=835953916&single=true&output=csv";

const TRENDS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=1798327524&single=true&output=csv";

const TEAM_COLOURS = {
  Dublin: "#0f9cf5",
  Kerry: "#16a34a",
  Armagh: "#ea580c",
  Mayo: "#22c55e",
  Tyrone: "#dc2626",
  Galway: "#7c3aed",
};

// ---------------- HELPERS ----------------

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    let values = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.replace(/^"|"$/g, "").trim();
    });
    rows.push(row);
  }
  return rows;
}

const safeNum = v => Number.isFinite(+v) ? +v : 0;

const sameTeam = (a, b) =>
  a?.trim().toLowerCase() === b?.trim().toLowerCase();

function getTeamFromQuery() {
  const t = new URLSearchParams(window.location.search).get("team");
  return t ? decodeURIComponent(t) : null;
}

const getTeamColour = t => TEAM_COLOURS[t] || "#2563eb";

// ---------------- STATE ----------------

let trendChart = null;
let radarChart = null;

// ---------------- MAIN ----------------

document.addEventListener("DOMContentLoaded", async () => {
  const teamName = getTeamFromQuery();
  const nameEl = document.getElementById("team-name");
  const loadingEl = document.getElementById("summary-loading");
  const errorEl = document.getElementById("summary-error");
  const contentEl = document.getElementById("summary-content");
  const noteEl = document.getElementById("summary-note");

  if (!teamName) {
    nameEl.textContent = "No team selected";
    loadingEl.textContent = "Open this page via the dashboard.";
    return;
  }

  nameEl.textContent = `${teamName} – Team Profile`;

  try {
    const [statsTxt, trendsTxt, shotsTxt] = await Promise.all([
      fetch(TEAM_STATS_CSV_URL).then(r => r.text()),
      fetch(TRENDS_CSV_URL).then(r => r.text()),
      fetch(SHOTS_CSV_URL).then(r => r.text()),
    ]);

    const stats = parseCSV(statsTxt);
    const trends = parseCSV(trendsTxt);
    const shots = parseCSV(shotsTxt);

    const teamRow = stats.find(r => sameTeam(r.Team, teamName));
    const teamTrends = trends.filter(r => sameTeam(r.Team, teamName));
    const teamShots = shots.filter(r => sameTeam(r.Team, teamName));

    if (!teamRow && !teamTrends.length) {
      throw new Error("No team data found");
    }

    const agg = computeAggregates(teamTrends, teamRow);

    document.getElementById("stat-games").textContent = agg.games || "–";
    document.getElementById("stat-avg-points").textContent =
      agg.avgActual ? agg.avgActual.toFixed(1) : "–";
    document.getElementById("stat-avg-xp").textContent =
      agg.avgExpected ? agg.avgExpected.toFixed(1) : "–";
    document.getElementById("stat-accuracy").textContent =
      agg.avgAccuracy ? agg.avgAccuracy.toFixed(1) + "%" : "–";

    loadingEl.textContent = "";
    contentEl.classList.remove("hidden");
    noteEl.textContent = teamTrends.length
      ? `Based on ${teamTrends.length} recorded games`
      : "Based on team aggregates";

    renderTrendChart(teamTrends, teamName);
    renderRadarChart(stats, teamName);
    renderShotMap(teamShots, teamName);
    renderRecentMatches(teamTrends, teamName);

  } catch (err) {
    console.error(err);
    loadingEl.textContent = "";
    errorEl.classList.remove("hidden");
    errorEl.textContent = "Failed to load team data.";
  }
});

// ---------------- AGGREGATES ----------------

function computeAggregates(trends, row) {
  if (trends.length) {
    const n = trends.length;
    return {
      games: n,
      avgActual: trends.reduce((s, g) => s + safeNum(g.ActualPoints), 0) / n,
      avgExpected: trends.reduce((s, g) => s + safeNum(g.ExpectedPoints), 0) / n,
      avgAccuracy: trends.reduce((s, g) => s + safeNum(g.ShotAccuracyPct), 0) / n,
    };
  }

  return {
    games: safeNum(row.Games),
    avgActual: safeNum(row.PointsPerGame),
    avgExpected: safeNum(row.ExpectedPointsPerGame),
    avgAccuracy: safeNum(row.Accuracy),
  };
}

// ---------------- TREND CHART ----------------

function renderTrendChart(trends, teamName) {
  const ctx = document.getElementById("trend-chart");
  if (!ctx || !trends.length) return;

  const sorted = [...trends].sort(
    (a, b) => new Date(a.MatchDate) - new Date(b.MatchDate)
  );

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: sorted.map(g => g.MatchDate),
      datasets: [
        {
          label: "Actual",
          data: sorted.map(g => safeNum(g.ActualPoints)),
          borderColor: getTeamColour(teamName),
          tension: 0.3,
        },
        {
          label: "Expected",
          data: sorted.map(g => safeNum(g.ExpectedPoints)),
          borderDash: [5, 5],
          borderColor: "#6b7280",
          tension: 0.3,
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

// ---------------- RADAR ----------------

function renderRadarChart(stats, teamName) {
  const ctx = document.getElementById("radar-chart");
  if (!ctx) return;

  const team = stats.find(r => sameTeam(r.Team, teamName));
  if (!team) return;

  const avg = stats.reduce(
    (a, t) => {
      a.p += safeNum(t.PointsPerGame);
      a.g += safeNum(t.GoalsPerGame);
      a.a += safeNum(t.Accuracy);
      a.x += safeNum(t.ExpectedPointsPerGame);
      return a;
    },
    { p: 0, g: 0, a: 0, x: 0 }
  );

  const n = stats.length || 1;

  if (radarChart) radarChart.destroy();

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Points", "Goals", "Accuracy", "xPoints"],
      datasets: [
        {
          label: teamName,
          data: [
            safeNum(team.PointsPerGame),
            safeNum(team.GoalsPerGame),
            safeNum(team.Accuracy),
            safeNum(team.ExpectedPointsPerGame),
          ],
          borderColor: getTeamColour(teamName),
          fill: true,
        },
        {
          label: "League Avg",
          data: [avg.p / n, avg.g / n, avg.a / n, avg.x / n],
          borderColor: "#6b7280",
          borderDash: [4, 4],
          fill: true,
        },
      ],
    },
    options: { responsive: true },
  });
}

// ---------------- SHOT MAP ----------------

function renderShotMap(shots, teamName) {
  const canvas = document.getElementById("shot-map");
  if (!canvas || !shots.length) return;

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  shots.forEach(s => {
    const x = (safeNum(s.X) / 100) * canvas.width;
    const y = (safeNum(s.Y) / 100) * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle =
      ["point", "goal", "score"].includes((s.Result || "").toLowerCase())
        ? "#22c55e"
        : "#ef4444";
    ctx.fill();
  });
}

// ---------------- RECENT MATCHES ----------------

function renderRecentMatches(trends, teamName) {
  const list = document.getElementById("recent-matches-list");
  const empty = document.getElementById("recent-matches-empty");

  if (!list || !trends.length) {
    empty.textContent = "No recent match data.";
    return;
  }

  list.innerHTML = "";
  empty.textContent = "";

  trends
    .sort((a, b) => new Date(b.MatchDate) - new Date(a.MatchDate))
    .slice(0, 5)
    .forEach(g => {
      const li = document.createElement("li");
      li.textContent = `${teamName} vs ${g.Opponent || "?"} – ${safeNum(
        g.ActualPoints
      )} pts`;
      list.appendChild(li);
    });
}
