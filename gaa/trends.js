document.addEventListener("gaa-team-stats-loaded", (e) => {
  const stats = e.detail;

  const canvas = document.getElementById("trends-chart");
  if (!canvas) return;

  new Chart(canvas, {
    type: "line",
    data: {
      labels: ["R1", "R2", "R3", "R4", "R5"],
      datasets: [{
        label: "Avg Points Trend",
        data: stats.map(t => t.PointsPerGame)
      }]
    }
  });
});