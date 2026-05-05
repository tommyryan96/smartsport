document.addEventListener("gaa-team-stats-loaded", (e) => {
  const stats = e.detail;
  const ctx = document.getElementById("trends-chart");
  if (!ctx) return;

  Chart.getChart(ctx)?.destroy();

  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["R1", "R2", "R3", "R4", "R5"],
      datasets: [{
        label: "Avg Points",
        data: stats.map(t => t.PointsPerGame),
        borderColor: "#10B981",
        backgroundColor: "rgba(16,185,129,0.15)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: "#10B981"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: "#64748B" },
          grid: { display: false }
        },
        y: {
          ticks: { color: "#64748B" },
          grid: { color: "#E2E8F0" }
        }
      }
    }
  });
});