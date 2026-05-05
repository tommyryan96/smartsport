// ===============================
// ÉIRE METRICS – COMPARISON (FIXED)
// ===============================

document.addEventListener("gaa-team-stats-loaded", (e) => {
  const stats = e.detail;
  const canvas = document.getElementById("comparison-chart");
  if (!canvas) return;

  const a = stats[0];
  const b = stats[1] || stats[0];

  // destroy old chart
  Chart.getChart(canvas)?.destroy();

  new Chart(canvas, {
    type: "radar",
    data: {
      labels: ["Points", "Goals", "Accuracy", "Possession"],
      datasets: [
        {
          label: a.Team,
          data: [
            Number(a.PointsPerGame || 0),
            Number(a.GoalsPerGame || 0),
            Number(a.Accuracy || 0),
            Number(a.Possession || 0)
          ],
          borderColor: "#10B981",
          backgroundColor: "rgba(16,185,129,0.25)",
          pointBackgroundColor: "#10B981",
          borderWidth: 2
        },
        {
          label: b.Team,
          data: [
            Number(b.PointsPerGame || 0),
            Number(b.GoalsPerGame || 0),
            Number(b.Accuracy || 0),
            Number(b.Possession || 0)
          ],
          borderColor: "#334155",
          backgroundColor: "rgba(51,65,85,0.2)",
          pointBackgroundColor: "#334155",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // 🔥 CRITICAL
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#64748B" }
        }
      },
      scales: {
        r: {
          min: 0,
          max: 30, // 🔥 keeps chart tight
          ticks: { display: false },
          grid: { color: "#E2E8F0" },
          pointLabels: {
            color: "#64748B",
            font: { size: 12 }
          }
        }
      }
    }
  });
});