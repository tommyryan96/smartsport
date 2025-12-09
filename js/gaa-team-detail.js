// js/gaa-team-detail.js
// Show fixtures/results for a single team using ?team=Name

console.log('[gaa-team] script loaded');

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const teamName = params.get('team');

  const titleEl = document.getElementById('team-name');
  const statusEl = document.getElementById('team-status');
  const bodyEl = document.getElementById('team-matches-body');

  if (!titleEl || !statusEl || !bodyEl) {
    console.warn('[gaa-team] Required elements missing');
    return;
  }

  if (!teamName) {
    titleEl.textContent = 'Team not specified';
    statusEl.textContent = 'No team parameter provided in URL.';
    return;
  }

  titleEl.textContent = teamName;

  fetch('/api/aisfc-2024')
    .then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then((data) => {
      const matches = (data.matches || []).filter(
        (m) => m.home_team === teamName || m.away_team === teamName
      );

      if (!matches.length) {
        statusEl.textContent = 'No fixtures or results found for this team.';
        bodyEl.innerHTML = '';
        return;
      }

      statusEl.textContent = `${matches.length} game${matches.length !== 1 ? 's' : ''} found.`;

      // Sort by date
      matches.sort((a, b) => (a.date < b.date ? -1 : 1));

      const rows = matches
        .map((m) => {
          const hg = m.home_goals ?? 0;
          const hp = m.home_points ?? 0;
          const ag = m.away_goals ?? 0;
          const ap = m.away_points ?? 0;

          const isHome = m.home_team === teamName;
          const opponent = isHome ? m.away_team : m.home_team;

          const teamScore = isHome ? hg * 3 + hp : ag * 3 + ap;
          const oppScore = isHome ? ag * 3 + ap : hg * 3 + hp;

          let result = 'D';
          if (teamScore > oppScore) result = 'W';
          else if (teamScore < oppScore) result = 'L';

          const scoreText = isHome
            ? `${hg}-${hp} : ${ag}-${ap}`
            : `${ag}-${ap} : ${hg}-${hp}`;

          const resultBadge =
            result === 'W'
              ? '<span class="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Win</span>'
              : result === 'L'
              ? '<span class="inline-flex px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">Loss</span>'
              : '<span class="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">Draw</span>';

          return `
            <tr>
              <td class="px-4 py-2 whitespace-nowrap">${m.date}</td>
              <td class="px-4 py-2 whitespace-nowrap">${escapeHtml(
                m.competition || 'All-Ireland SFC'
              )}</td>
              <td class="px-4 py-2 whitespace-nowrap">${escapeHtml(opponent)}</td>
              <td class="px-4 py-2 whitespace-nowrap">${resultBadge}</td>
              <td class="px-4 py-2 whitespace-nowrap">${scoreText}</td>
              <td class="px-4 py-2 whitespace-nowrap">${escapeHtml(m.venue || '')}</td>
            </tr>
          `;
        })
        .join('');

      bodyEl.innerHTML = rows;
    })
    .catch((err) => {
      console.error('[gaa-team] Error loading team data:', err);
      statusEl.textContent = 'Could not load fixtures.';
      bodyEl.innerHTML = '';
    });
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
