// OVERVIEW TAB



const TEAM_STATS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=0&single=true&output=csv"; // TODO: replace

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines
    .map((line) => line.split(","))
    .map((cols) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h.trim()] = cols[i] ? cols[i].trim() : ""));
      return obj;
    });
}

async function loadTeamStats() {
  try {
    const res = await fetch(TEAM_STATS_CSV_URL);
    const text = await res.text();
    return parseCsv(text);
  } catch (e) {
    console.error("Error loading team stats", e);
    return [];
  }
}

function renderOverviewCharts(stats) {
  const sortedByPoints = [...stats].sort(
    (a, b) => parseFloat(b.PointsFor || 0) - parseFloat(a.PointsFor || 0)
  );

  const topTeams = sortedByPoints.slice(0, 8);
  const labels = topTeams.map((r) => r.Team);
  const points = topTeams.map((r) => Number(r.PointsFor || 0));
  const conceded = topTeams.map((r) => Number(r.PointsAgainst || 0));

  const ctxTop = document.getElementById("overview-top-teams");
  if (ctxTop) {
    new Chart(ctxTop, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Points For",
            data: points,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { display: false },
        },
        responsive: true,
        scales: {
          x: { grid: { display: false } },
          y: { grid: { display: false } },
        },
      },
    });
  }

  const ctxDef = document.getElementById("overview-defence");
  if (ctxDef) {
    new Chart(ctxDef, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Points Conceded",
            data: conceded,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
        },
        responsive: true,
        scales: {
          x: { grid: { display: false } },
          y: { grid: { display: false } },
        },
      },
    });
  }

  // KPIs
  const totalGames = stats.reduce(
    (acc, r) => acc + Number(r.Games || 0),
    0
  );
  const totalPoints = stats.reduce(
    (acc, r) => acc + Number(r.TotalPoints || 0),
    0
  );
  const avgPoints =
    totalGames > 0 ? (totalPoints / totalGames).toFixed(1) : "–";

  const topTeam = sortedByPoints[0]?.Team || "–";

  const kpiGames = document.getElementById("kpi-total-games");
  const kpiAvg = document.getElementById("kpi-avg-points");
  const kpiTop = document.getElementById("kpi-top-team");

  if (kpiGames) kpiGames.textContent = totalGames || "–";
  if (kpiAvg) kpiAvg.textContent = avgPoints;
  if (kpiTop) kpiTop.textContent = topTeam;
}

document.addEventListener("DOMContentLoaded", async () => {
  const stats = await loadTeamStats();
  if (stats.length) {
    renderOverviewCharts(stats);
    // Also share with comparison / trends
    window.__GAA_TEAM_STATS__ = stats;
    document.dispatchEvent(new CustomEvent("gaa-team-stats-loaded", { detail: stats }));
  }
});
