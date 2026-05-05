// ===============================
// ÉIRE METRICS – TRENDS (FIXED)
// ===============================

document.addEventListener("gaa-team-stats-loaded", (e) => {
  const stats = e.detail;
  const canvas = document.getElementById("trends-chart");
  if (!canvas) return;

  // destroy existing chart
  Chart.getChart(canvas)?.destroy();

  const labels = ["R1", "R2", "R3", "R4", "R5"];
  const data = stats.map(t => Number(t.PointsPerGame || 0));

  new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Avg Points",
        data,
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
      maintainAspectRatio: false, // 🔥 KEY FIX
      plugins: {
        legend: { display: false }
      },
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
});