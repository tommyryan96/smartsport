document.addEventListener("gaa-team-stats-loaded", (e) => {
  const stats = e.detail;
  const ctx = document.getElementById("comparison-chart");
  if (!ctx) return;

  const a = stats[0];
  const b = stats[1] || stats[0];

  Chart.getChart(ctx)?.destroy();

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Points", "Goals", "Accuracy", "Possession"],
      datasets: [
        {
          label: a.Team,
          data: [
            a.PointsPerGame,
            a.GoalsPerGame,
            a.Accuracy,
            a.Possession
          ],
          borderColor: "#10B981",
          backgroundColor: "rgba(16,185,129,0.25)",
          pointBackgroundColor: "#10B981",
          borderWidth: 2
        },
        {
          label: b.Team,
          data: [
            b.PointsPerGame,
            b.GoalsPerGame,
            b.Accuracy,
            b.Possession
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
      scales: {
        r: {
          min: 0,
          max: 30, // 🔥 KEY FIX (was way too high)
          ticks: {
            display: false
          },
          grid: {
            color: "#E2E8F0"
          },
          pointLabels: {
            color: "#64748B",
            font: { size: 12 }
          }
        }
      },
      plugins: {
        legend: {
          position: "top"
        }
      }
    }
  });
});