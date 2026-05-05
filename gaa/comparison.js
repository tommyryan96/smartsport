// ===============================
// ÉIRE METRICS – COMPARISON (CLEAN FINAL)
// ===============================

document.addEventListener("gaa-team-stats-loaded", (e) => {
  const stats = e.detail;
  const canvas = document.getElementById("comparison-chart");
  if (!canvas) return;

  const a = stats[0];
  const b = stats[1] || stats[0];

  // Destroy previous chart
  Chart.getChart(canvas)?.destroy();

  // 🔥 NORMALISE DATA (important for radar balance)
  function normalise(team) {
    return [
      Number(team.PointsPerGame || 0),          // ~20
      Number(team.GoalsPerGame || 0) * 10,      // ~2 → 20
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
          backgroundColor: "rgba(16,185,129,0.35)",
          pointBackgroundColor: "#10B981",
          borderWidth: 3,
          pointRadius: 5
        },
        {
          label: b.Team,
          data: normalise(b),
          borderColor: "#334155",
          backgroundColor: "rgba(51,65,85,0.25)",
          pointBackgroundColor: "#334155",
          borderWidth: 3,
          pointRadius: 5
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      layout: {
        padding: 30
      },

      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#64748B",
            boxWidth: 20
          }
        },

        // 🔥 CLEAN TOOLTIP (instead of messy labels)
        tooltip: {
          enabled: true,
          backgroundColor: "#0F172A",
          titleColor: "#fff",
          bodyColor: "#fff",
          padding: 10,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ": " + context.raw.toFixed(1);
            }
          }
        }
      },

      scales: {
        r: {
          min: 0,
          max: 30,

          ticks: {
            display: false
          },

          grid: {
            color: "rgba(226,232,240,0.6)"
          },

          angleLines: {
            color: "rgba(226,232,240,0.6)"
          },

          pointLabels: {
            color: "#64748B",
            font: {
              size: 13,
              weight: "500"
            }
          }
        }
      }
    }
  });
});