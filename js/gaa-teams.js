// js/gaa-teams.js
// Build a "Browse Teams" grid from the All-Ireland mock API.

console.log('[gaa-teams] script loaded');

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('teams-grid');
  const statusEl = document.getElementById('teams-status');
  const searchInput = document.getElementById('team-search');

  if (!grid || !statusEl) {
    console.warn('[gaa-teams] Required elements not found');
    return;
  }

  fetch('/api/aisfc-2024')
    .then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then((data) => {
      const matches = data.matches || [];
      if (!matches.length) {
        statusEl.textContent = 'No teams found yet.';
        return;
      }

      // Build map: teamName -> { name, games }
      const teamMap = new Map();

      const addTeam = (name) => {
        if (!name) return;
        const key = name.trim();
        if (!teamMap.has(key)) {
          teamMap.set(key, { name: key, games: 0 });
        }
        teamMap.get(key).games += 1;
      };

      matches.forEach((m) => {
        addTeam(m.home_team);
        addTeam(m.away_team);
      });

      let teams = Array.from(teamMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      const render = (filterText = '') => {
        const q = filterText.trim().toLowerCase();
        const filtered = q
          ? teams.filter((t) => t.name.toLowerCase().includes(q))
          : teams;

        if (!filtered.length) {
          grid.innerHTML =
            '<p class="text-sm text-slate-500 col-span-full">No teams match that search.</p>';
          return;
        }

        grid.innerHTML = filtered
          .map(
            (team) => `
          <a href="/gaa/team.html?team=${encodeURIComponent(team.name)}"
             class="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm
                    hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                ${team.name}
              </h2>
              <span class="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                ${team.games} game${team.games !== 1 ? 's' : ''}
              </span>
            </div>
            <p class="text-xs text-slate-500">
              View fixtures and results from the 2024 All-Ireland SFC.
            </p>
          </a>
        `
          )
          .join('');
      };

      render();
      statusEl.textContent = `${teams.length} teams found`;

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          render(e.target.value);
        });
      }
    })
    .catch((err) => {
      console.error('[gaa-teams] Error loading teams:', err);
      statusEl.textContent = 'Could not load teams.';
    });
});
