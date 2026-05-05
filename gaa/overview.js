// ===============================
// ÉIRE METRICS – PREMIUM OVERVIEW
// ===============================

const TEAM_STATS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=0&single=true&output=csv";

// ---------- CSV ----------
function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
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

// ---------- LOAD ----------
async function loadTeamStats() {
  try {
    const res = await fetch(TEAM_STATS_CSV_URL);
    const text = await res.text();
    return parseCsv(text);
  } catch {
    return [];
  }
}

// ---------- DEMO ----------
function getDemoData() {
  return [
    { Team: "Dublin", Games: 6, PointsFor: 150, PointsAgainst: 110, TotalPoints: 150, PointsPerGame: 25, GoalsPerGame: 2.1, Accuracy: 82, Possession: 55 },
    { Team: "Kerry", Games: 6, PointsFor: 140, PointsAgainst: 120, TotalPoints: 140, PointsPerGame: 23, GoalsPerGame: 1.8, Accuracy: 80, Possession: 53 },
    { Team: "Mayo", Games: 6, PointsFor: 135, PointsAgainst: 125, TotalPoints: 135, PointsPerGame: 22, GoalsPerGame: 1.6, Accuracy: 78, Possession: 51 },
    { Team: "Galway", Games: 6, PointsFor: 130, PointsAgainst: 115, TotalPoints: 130, PointsPerGame: 21, GoalsPerGame: 1.7, Accuracy: 79, Possession: 50 }
  ];
}

// ---------- RENDER ----------
function renderOverview(stats) {
  const sorted = [...stats].sort(
    (a, b) => Number(b.PointsFor) - Number(a.PointsFor)
  );

  const labels = sorted.map(t => t.Team);
  const scored = sorted.map(t => Number(t.PointsFor));
  const conceded = sorted.map(t => Number(t.PointsAgainst));

  // KPIs
  const totalGames = stats.reduce((a, t) => a + Number(t.Games), 0);
  const totalPoints = stats.reduce((a, t) => a + Number(t.TotalPoints), 0);
  const avgPoints = (totalPoints / totalGames).toFixed(1);

  document.getElementById("kpi-total-games").textContent = totalGames;
  document.getElementById("kpi-avg-points").textContent = avgPoints;
  document.getElementById("kpi-top-team").textContent = sorted[0].Team;

  // DESTROY existing charts if reload
  Chart.getChart("overview-top-teams")?.destroy();
  Chart.getChart("overview-defence")?.destroy();

  // -------- TOP TEAMS --------
  new Chart(document.getElementById("overview-top-teams"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Points For",
        data: scored,
        backgroundColor: scored.map((v, i) =>
          i === 0 ? "#10B981" : "#94A3B8"
        ),
        borderRadius: 10,
        barThickness: 20
      }]
    },
    options: {
      animation: { duration: 1200 },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#64748B" }
        },
        y: {
          grid: { color: "#E2E8F0" },
          ticks: { color: "#64748B" }
        }
      }
    }
  });

  // -------- DEFENCE --------
  new Chart(document.getElementById("overview-defence"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Points Against",
        data: conceded,
        backgroundColor: "#0F172A",
        borderRadius: 10,
        barThickness: 20
      }]
    },
    options: {
      animation: { duration: 1200 },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#64748B" }
        },
        y: {
          grid: { color: "#E2E8F0" },
          ticks: { color: "#64748B" }
        }
      }
    }
  });

  // -------- INSIGHT --------
  const insight = document.getElementById("overview-insight");
  if (insight) {
    insight.textContent =
      `${sorted[0].Team} lead scoring with ${scored[0]} points, showing the strongest attacking performance in the dataset.`;
  }
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", async () => {
  let stats = await loadTeamStats();
  if (!stats.length) stats = getDemoData();

  renderOverview(stats);

  document.dispatchEvent(
    new CustomEvent("gaa-team-stats-loaded", { detail: stats })
  );
});