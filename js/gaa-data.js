// js/gaa-data.js
// Front-end script to load All-Ireland SFC data from our Vercel API

console.log('[gaa-data] script loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('[gaa-data] DOMContentLoaded');

  const statusEl = document.getElementById('matches-status');
  const tableBody = document.getElementById('matches-table-body');

  if (!statusEl || !tableBody) {
    console.warn('[gaa-data] Table elements not found on this page');
    return;
  }

  statusEl.textContent = 'Loading All-Ireland data...';

  console.log('[gaa-data] Fetching /api/aisfc-2024');

  fetch('/api/aisfc-2024')
    .then((response) => {
      console.log('[gaa-data] Response status:', response.status);
      if (!response.ok) {
        throw new Error('Network error: ' + response.status);
      }
      return response.json();
    })
    .then((data) => {
      console.log('[gaa-data] Data received:', data);
      const matches = data.matches || [];

      if (!matches.length) {
        statusEl.textContent = 'No All-Ireland matches available yet.';
        return;
      }

      // Sort by date descending (latest first)
      matches.sort((a, b) => (a.date < b.date ? 1 : -1));
      const latest = matches; // or matches.slice(0, 10)

      tableBody.innerHTML = latest
        .map((match) => {
          const hg = match.home_goals ?? 0;
          const hp = match.home_points ?? 0;
          const ag = match.away_goals ?? 0;
          const ap = match.away_points ?? 0;

          const scoreHome = `${hg}-${hp}`;
          const scoreAway = `${ag}-${ap}`;

          return `
            <tr>
              <td class="px-4 py-2 whitespace-nowrap">${match.date}</td>
              <td class="px-4 py-2 whitespace-nowrap">${escapeHtml(match.competition)}</td>
              <td class="px-4 py-2 whitespace-nowrap">${escapeHtml(match.home_team)}</td>
              <td class="px-4 py-2 whitespace-nowrap">${escapeHtml(match.away_team)}</td>
              <td class="px-4 py-2 whitespace-nowrap">${scoreHome} : ${scoreAway}</td>
              <td class="px-4 py-2 whitespace-nowrap">${escapeHtml(match.venue)}</td>
            </tr>
          `;
        })
        .join('');

      statusEl.textContent = '';
    })
    .catch((err) => {
      console.error('[gaa-data] Error loading All-Ireland data:', err);
      if (statusEl) {
        statusEl.textContent = 'Could not load All-Ireland match data.';
      }
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
