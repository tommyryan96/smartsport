// ===============================
// ÉIRE METRICS – COMPARISON (FINAL + VISUAL)
// ===============================

document.addEventListener("gaa-team-stats-loaded", (e) => {
  const stats = e.detail;
  const canvas = document.getElementById("comparison-chart");
  if (!canvas) return;

  const a = stats[0];
  const b = stats[1] || stats[0];

  // destroy previous chart
  Chart.getChart(canvas)?.destroy();

  // 🔥 NORMALISE DATA (CRITICAL)
  function normalise(team) {
    return [
      Number(team.PointsPerGame || 0),          // ~20
      Number(team.GoalsPerGame || 0) * 10,      // ~2 → 20
      Number(team.Accuracy || 0) / 4,           // 80 → 20
      Number(team.Possession || 0) / 2          // 60 → 30
    ];
  }

  // 🔥 VALUE LABEL PLUGIN
  const valueLabelPlugin = {
    id: 'valueLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;

      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);

        meta.data.forEach((point, index) => {
          const value = dataset.data[index];

          ctx.fillStyle = "#0F172A";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.fillText(value.toFixed(1), point.x, point.y - 10);
        });
      });
    }
  };

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
          pointRadius: 5,
          pointHoverRadius: 6
        },
        {
          label: b.Team,
          data: normalise(b),
          borderColor: "#334155",
          backgroundColor: "rgba(51,65,85,0.25)",
          pointBackgroundColor: "#334155",
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 6
        }
      ]
    },
    plugins: [valueLabelPlugin], // 🔥 attach plugin

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
            boxWidth: 20,
            font: {
              size: 12
            }
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
            },
            padding: 12
          }
        }
      }
    }
  });
});