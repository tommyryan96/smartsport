// TEAM COMPARISON TAB

function initTeamComparison(stats) {
  const selectA = document.getElementById("comp-team-a");
  const selectB = document.getElementById("comp-team-b");
  const ctx = document.getElementById("comparison-chart");
  if (!selectA || !selectB || !ctx) return;

  const teams = stats.map((s) => s.Team).sort();

  [selectA, selectB].forEach((sel) => {
    sel.innerHTML = "";
    teams.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      sel.appendChild(opt);
    });
  });

  selectA.value = teams[0];
  selectB.value = teams[1] || teams[0];

  let chart;

  function updateChart() {
    const aTeam = stats.find((s) => s.Team === selectA.value);
    const bTeam = stats.find((s) => s.Team === selectB.value);
    if (!aTeam || !bTeam) return;

    const labels = [
      "Points/Game",
      "Goals/Game",
      "Accuracy %",
      "Possession %",
    ];

    const dataA = [
      Number(aTeam.PointsPerGame || 0),
      Number(aTeam.GoalsPerGame || 0),
      Number(aTeam.Accuracy || 0),
      Number(aTeam.Possession || 0),
    ];
    const dataB = [
      Number(bTeam.PointsPerGame || 0),
      Number(bTeam.GoalsPerGame || 0),
      Number(bTeam.Accuracy || 0),
      Number(bTeam.Possession || 0),
    ];
	
	onst insightEl = document.getElementById("comparison-insight");
    if (insightEl) {
      let betterCount = 0;
      let worseCount = 0;
      dataA.forEach((val, idx) => {
        if (val > dataB[idx]) betterCount++;
        else if (val < dataB[idx]) worseCount++;
      });

      let summary = `${aTeam.Team} and ${bTeam.Team} are closely matched.`;
      if (betterCount > worseCount) {
        summary = `${aTeam.Team} lead ${bTeam.Team} in ${betterCount} of the 4 key metrics.`;
      } else if (worseCount > betterCount) {
        summary = `${bTeam.Team} lead ${aTeam.Team} in ${worseCount} of the 4 key metrics.`;
      }
      insightEl.textContent = summary;
    }

    const cfg = {
      type: "radar",
      data: {
        labels,
        datasets: [
          {
            label: aTeam.Team,
            data: dataA,
          },
          {
            label: bTeam.Team,
            data: dataB,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          r: {
            angleLines: { display: true },
            grid: { display: true },
          },
        },
      },
    };

    if (chart) {
      chart.data = cfg.data;
      chart.update();
    } else {
      chart = new Chart(ctx, cfg);
    }
  }

  selectA.addEventListener("change", updateChart);
  selectB.addEventListener("change", updateChart);
  updateChart();
}

document.addEventListener("gaa-team-stats-loaded", (e) => {
  initTeamComparison(e.detail || []);
});
