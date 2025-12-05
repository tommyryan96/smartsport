// Populate the "Browse team profiles" card on the overview tab.
// Re-uses the same stats array that powers the comparison tab.

function initBrowseTeams(stats) {
  const select = document.getElementById("browse-team-select");
  const openBtn = document.getElementById("browse-team-open");
  const chipsContainer = document.getElementById("browse-team-chips");

  if (!select || !openBtn) return;

  // Unique sorted team list
  const teams = [...new Set(stats.map((s) => s.Team).filter(Boolean))].sort();
  if (!teams.length) {
    if (chipsContainer) {
      chipsContainer.textContent = "No teams found in the dataset.";
    }
    return;
  }

  // Fill dropdown
  select.innerHTML = "";
  teams.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });

  // Keep "Open profile" button in sync
  const updateLink = () => {
    const team = select.value;
    if (!team) return;
    const encoded = encodeURIComponent(team);
    openBtn.href = `team.html?team=${encoded}`;
  };

  select.addEventListener("change", updateLink);
  updateLink(); // initial state

  // Optional quick-link chips (first 8 teams)
  if (chipsContainer) {
    chipsContainer.innerHTML = "";
    teams.slice(0, 8).forEach((t) => {
      const a = document.createElement("a");
      a.href = `team.html?team=${encodeURIComponent(t)}`;
      a.textContent = t;
      a.className = "team-chip";
      chipsContainer.appendChild(a);
    });
  }
}

// Listen for the same event overview.js uses for team stats
document.addEventListener("gaa-team-stats-loaded", (e) => {
  initBrowseTeams(e.detail || []);
});
