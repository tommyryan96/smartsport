document.addEventListener("gaa-team-stats-loaded", (e) => {
  const stats = e.detail;
  const ctx = document.getElementById("trends-chart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["R1", "R2", "R3", "R4", "R5"],
      datasets: [{
        label: "Avg Points Trend",
        data: stats.map(t => t.PointsPerGame),
        borderColor: "#10B981",
        tension: 0.4,
        fill: true,
        backgroundColor: "rgba(16,185,129,0.1)"
      }]
    },
    options: {
      animation: { duration: 1200 },
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#64748B" } },
        y: {
          grid: { color: "#E2E8F0" },
          ticks: { color: "#64748B" }
        }
      }
    }
  });
});