// TRENDS / EXPECTED POINTS TAB

const TRENDS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=1798327524&single=true&output=csv"; // TODO: replace if needed

async function loadTrendsData() {
  try {
    const res = await fetch(TRENDS_CSV_URL);
    const text = await res.text();
    return parseCsv(text);
  } catch (e) {
    console.error("Error loading trends", e);
    return [];
  }
}

function initTrends(trends) {
  const teamSelect = document.getElementById("trends-team-select");
  const canvas = document.getElementById("trends-chart");
  const statusEl = document.getElementById("trends-status");

  if (!teamSelect || !canvas) {
    console.warn("Trends elements not found in DOM");
    return;
  }

  const teams = Array.from(new Set(trends.map((t) => t.Team).filter(Boolean))).sort();

  if (!teams.length) {
    if (statusEl) {
      statusEl.textContent = "No trends data available.";
    }
    return;
  }

  teams.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    teamSelect.appendChild(opt);
  });

  if (!teamSelect.value && teams[0]) {
    teamSelect.value = teams[0];
  }

  let chart;

  function render() {
    const team = teamSelect.value;
    const filtered = trends
      .filter((t) => t.Team === team)
      .sort((a, b) => new Date(a.MatchDate) - new Date(b.MatchDate));

    if (!filtered.length) {
      if (statusEl) {
        statusEl.textContent = "No games found for this team.";
      }
      return;
    }

    const labels = filtered.map((t) => t.MatchDate);
    const actual = filtered.map((t) => Number(t.ActualPoints || 0));
    const xp = filtered.map((t) => Number(t.ExpectedPoints || 0));

    const cfg = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Actual Points",
            data: actual,
          },
          {
            label: "Expected Points",
            data: xp,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        stacked: false,
        scales: {
          y: { beginAtZero: true },
        },
      },
    };

    if (chart) {
      chart.data = cfg.data;
      chart.update();
    } else {
      chart = new Chart(canvas, cfg);
    }

    // Simple insight text
    const insightEl = document.getElementById("trends-insight");
    if (insightEl) {
      const lastIdx = filtered.length - 1;
      const lastActual = actual[lastIdx];
      const lastXp = xp[lastIdx];
      const delta = (lastActual - lastXp).toFixed(1);

      let summary = `${team} are tracking close to their expected points.`;
      if (lastActual > lastXp) {
        summary = `${team} outperformed xP in their most recent game (+${delta} points vs expected).`;
      } else if (lastActual < lastXp) {
        summary = `${team} underperformed xP in their most recent game (${delta} points vs expected).`;
      }

      insightEl.textContent = summary;
    }

    if (statusEl) {
      statusEl.textContent = "";
    }
  }

  teamSelect.addEventListener("change", render);
  render();
}

document.addEventListener("DOMContentLoaded", async () => {
  const trends = await loadTrendsData();
  if (!trends.length) return;
  initTrends(trends);
});
