// -----------------------------------------------------------
// CONFIG — REPLACE THESE WITH YOUR ACTUAL CSV URLS
// -----------------------------------------------------------

const STATS_CSV_URL = "data/gaa_stats.csv";
const SHOTS_CSV_URL = "data/gaa_shots.csv";

// -----------------------------------------------------------
// CSV Parser
// -----------------------------------------------------------

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim());
    const row = {};
    headers.forEach((h, i) => row[h] = cols[i]);
    return row;
  });
}

function getQueryTeam() {
  const p = new URLSearchParams(window.location.search);
  return p.get("team");
}

document.addEventListener("DOMContentLoaded", async () => {
  const team = getQueryTeam();
  const nameEl = document.getElementById("team-name");

  if (!team) {
    nameEl.textContent = "No team selected";
    return;
  }

  nameEl.textContent = `${team} – Team Profile`;

  const [statsResp, shotsResp] = await Promise.all([
    fetch(STATS_CSV_URL),
    fetch(SHOTS_CSV_URL)
  ]);

  const stats = parseCSV(await statsResp.text()).filter(r => r.Team === team);
  const shots = parseCSV(await shotsResp.text()).filter(r => r.Team === team);

  if (!stats.length) {
    document.getElementById("summary-loading").textContent =
      "No data available for this team.";
    return;
  }

  renderSummary(stats);
  renderTrend(stats);
  renderRadar(stats);
  renderShotMap(shots);
});

// -----------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------

function safe(n) { const a = Number(n); return isNaN(a) ? 0 : a; }

function renderSummary(games) {
  const sum = games.reduce((a, g) => ({
    pts: a.pts + safe(g.ActualPoints),
    xp: a.xp + safe(g.ExpectedPoints),
    acc: a.acc + safe(g.ShotAccuracyPct)
  }), { pts: 0, xp: 0, acc: 0 });

  const n = games.length;

  document.getElementById("stat-games").textContent = n;
  document.getElementById("stat-avg-points").textContent = (sum.pts / n).toFixed(1);
  document.getElementById("stat-avg-xp").textContent = (sum.xp / n).toFixed(1);
  document.getElementById("stat-accuracy").textContent = (sum.acc / n).toFixed(1) + "%";

  document.getElementById("summary-content").style.display = "grid";
  document.getElementById("summary-loading").style.display = "none";
}

// -----------------------------------------------------------
// XP TREND
// -----------------------------------------------------------

function renderTrend(games) {
  const ctx = document.getElementById("trend-chart");
  const sorted = [...games].sort((a,b) => new Date(a.Date) - new Date(b.Date));

  const labels = sorted.map(g => g.Date);
  const actual = sorted.map(g => safe(g.ActualPoints));
  const xpts = sorted.map(g => safe(g.ExpectedPoints));

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label:"Actual", data:actual, borderWidth:2, pointRadius:3 },
        { label:"Expected", data:xpts, borderWidth:2, pointRadius:3, borderDash:[5,4] }
      ]
    },
    options: { responsive:true }
  });

  const diff = actual.at(-1) - xpts.at(-1);
  document.getElementById("trend-note").textContent =
    `Latest match: ${diff > 0 ? "+" : ""}${diff.toFixed(1)} vs expected.`;
}

// -----------------------------------------------------------
// RADAR
// -----------------------------------------------------------

function avg(list, field) {
  return list.reduce((a,g)=>a+safe(g[field]),0) / list.length;
}

function renderRadar(games) {
  const ctx = document.getElementById("radar-chart");

  const teamVals = [
    avg(games,"ActualPoints"),
    avg(games,"GoalsPerGame"),
    avg(games,"ShotAccuracyPct"),
    avg(games,"PossessionPct"),
    avg(games,"ExpectedPoints")
  ];

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Points","Goals","Accuracy","Possession","xPoints"],
      datasets: [
        { label:"Team", data:teamVals, borderWidth:2, fill:true }
      ]
    },
    options: { responsive:true }
  });
}

// -----------------------------------------------------------
// SHOT MAP
// -----------------------------------------------------------

function renderShotMap(shots) {
  const canvas = document.getElementById("shot-map");
  const ctx = canvas.getContext("2d");

  const w = canvas.width, h = canvas.height;

  // Pitch border
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(40,30,w-80,h-60);

  // Draw shots
  shots.forEach(s => {
    const x = 40 + (safe(s.X) / 100) * (w - 80);
    const y = 30 + (safe(s.Y) / 100) * (h - 60);

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI*2);
    ctx.fillStyle = (s.Result.toLowerCase() == "score") ? "#22c55e" : "#ef4444";
    ctx.fill();
  });

  document.getElementById("shot-note").textContent =
    `${shots.length} shots recorded.`;
