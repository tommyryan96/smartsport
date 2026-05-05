// ===============================
// ÉIRE METRICS – OVERVIEW (SAFE)
// ===============================

const TEAM_STATS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=0&single=true&output=csv";

// ---------- CSV PARSER ----------
function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  if (!headerLine) return [];

  const headers = headerLine.split(",");
  return lines.map(line => {
    const cols = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = cols[i] ? cols[i].trim() : "";
    });
    return obj;
  });
}

// ---------- LOAD DATA ----------
async function loadTeamStats() {
  try {
    const res = await fetch(TEAM_STATS_CSV_URL);
    const text = await res.text();
    return parseCsv(text);
  } catch (err) {
    console.warn("Live data failed:", err);
    return [];
  }
}

// ---------- DEMO DATA ----------
function getDemoData() {
  return [
    { Team: "Dublin", Games: 6, PointsFor: 150, PointsAgainst: 110, TotalPoints: 150, PointsPerGame: 25, GoalsPerGame: 2.1, Accuracy: 82, Possession: 55 },
    { Team: "Kerry", Games: 6, PointsFor: 140, PointsAgainst: 120, TotalPoints: 140, PointsPerGame: 23, GoalsPerGame: 1.8, Accuracy: 80, Possession: 53 },
    { Team: "Mayo", Games: 6, PointsFor: 135, PointsAgainst: 125, TotalPoints: 135, PointsPerGame: 22, GoalsPerGame: 1.6, Accuracy: 78, Possession: 51 },
    { Team: "Galway", Games: 6, PointsFor: 130, PointsAgainst: 115, TotalPoints: 130, PointsPerGame: 21, GoalsPerGame: 1.7, Accuracy: 79, Possession: 50 }
  ];
}

// ---------- RENDER ----------
function renderOverviewCharts(stats) {
  const sorted = [...stats].sort(
    (a, b) => Number(b.PointsFor || 0) - Number(a.PointsFor || 0)
  );

  const labels = sorted.map(t => t.Team);
  const scored = sorted.map(t => Number(t.PointsFor || 0));
  const conceded = sorted.map(t => Number(t.PointsAgainst || 0));

  // KPIs
  const totalGames = stats.reduce((acc, t) => acc + Number(t.Games || 0), 0);
  const totalPoints = stats.reduce((acc, t) => acc + Number(t.TotalPoints || 0), 0);
  const avgPoints = totalGames ? (totalPoints / totalGames).toFixed(1) : "–";

  document.getElementById("kpi-total-games").textContent = totalGames;
  document.getElementById("kpi-avg-points").textContent = avgPoints;
  document.getElementById("kpi-top-team").textContent = sorted[0]?.Team || "–";

  // Chart 1
  new Chart(document.getElementById("overview-top-teams"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Points For", data: scored }]
    },
    options: { responsive: true }
  });

  // Chart 2
  new Chart(document.getElementById("overview-defence"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Points Against", data: conceded }]
    },
    options: { responsive: true }
  });
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", async () => {
  let stats = await loadTeamStats();

  if (!stats || !stats.length) {
    console.log("Using demo data");
    stats = getDemoData();
  }

  renderOverviewCharts(stats);

  // 🔑 This powers EVERYTHING else
  document.dispatchEvent(
    new CustomEvent("gaa-team-stats-loaded", { detail: stats })
  );
});