document.addEventListener("gaa-team-stats-loaded", (e) => {
  const stats = e.detail;

  const canvas = document.getElementById("comparison-chart");
  if (!canvas) return;

  const teams = stats.map(t => t.Team);

  new Chart(canvas, {
    type: "radar",
    data: {
      labels: ["Points/Game", "Goals/Game", "Accuracy", "Possession"],
      datasets: [
        {
          label: teams[0],
          data: [
            stats[0].PointsPerGame,
            stats[0].GoalsPerGame,
            stats[0].Accuracy,
            stats[0].Possession
          ]
        },
        {
          label: teams[1] || teams[0],
          data: [
            stats[1]?.PointsPerGame || 0,
            stats[1]?.GoalsPerGame || 0,
            stats[1]?.Accuracy || 0,
            stats[1]?.Possession || 0
          ]
        }
      ]
    }
  });
});