// ===============================
// ÉIRE METRICS – COMPARISON (FINAL)
// ===============================

document.addEventListener("gaa-team-stats-loaded", (e) => {
  const stats = e.detail;
  const canvas = document.getElementById("comparison-chart");
  if (!canvas) return;

  const a = stats[0];
  const b = stats[1] || stats[0];

  // destroy previous chart
  Chart.getChart(canvas)?.destroy();

  // 🔥 NORMALISE DATA (CRITICAL FIX)
  function normalise(team) {
    return [
      Number(team.PointsPerGame || 0),          // ~20
      Number(team.GoalsPerGame || 0) * 10,      // scale goals (~2 → 20)
      Number(team.Accuracy || 0) / 4,           // 80 → 20
      Number(team.Possession || 0) / 2          // 60 → 30
    ];
  }

  new Chart(canvas, {
    type: "radar",
    data: {
      labels: ["Scoring", "Goal Threat", "Efficiency", "Control"],
      datasets: [
        {
          label: a.Team,
          data: normalise(a),
          borderColor: "#10B981",
          backgroundColor: "rgba(16,185,129,0.25)",
          pointBackgroundColor: "#10B981",
          borderWidth: 2
        },
        {
          label: b.Team,
          data: normalise(b),
          borderColor: "#334155",
          backgroundColor: "rgba(51,65,85,0.2)",
          pointBackgroundColor: "#334155",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      layout: {
        padding: 20
      },

      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#64748B",
            boxWidth: 20
          }
        }
      },

      scales: {
        r: {
          min: 0,
          max: 30,
          suggestedMax: 30,

          ticks: {
            display: false
          },

          grid: {
            color: "#E2E8F0"
          },

          angleLines: {
            color: "#E2E8F0"
          },

          pointLabels: {
            color: "#64748B",
            font: { size: 12 },
            padding: 10
          }
        }
      }
    }
  });
});