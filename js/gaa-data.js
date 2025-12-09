// js/gaa-data.js
// Front-end script to load All-Ireland SFC data from our Vercel API

document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('matches-status');
  const tableBody = document.getElementById('matches-table-body');

  if (!statusEl || !tableBody) {
    // This page doesn't have the matches table, nothing to do.
    return;
  }

  statusEl.textContent = 'Loading All-Ireland data...';

  fetch('/api/aisfc-2024')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network error: ' + response.status);
      }
      return response.json();
    })
    .then((data) => {
      const matches = data.matches || [];

      if (!matches.length) {
        statusEl.textContent = 'No All-Ireland matches available yet.';
        return;
      }

      // Sort by date descending (latest first)
      matches.sort((a, b) => (a.date < b.date ? 1 : -1));

      // You can slice() here if you only want say the latest 10:
      // const latest = matches.slice(0, 10);
      const latest = matches;

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
              <td>${match.date}</td>
              <td>${escapeHtml(match.competition)}</td>
              <td>${escapeHtml(match.home_team)}</td>
              <td>${escapeHtml(match.away_team)}</td>
              <td>${scoreHome} : ${scoreAway}</td>
              <td>${escapeHtml(match.venue)}</td>
            </tr>
          `;
        })
        .join('');

      statusEl.textContent = ''; // clear "Loading..." message
    })
    .catch((err) => {
      console.error('Error loading All-Ireland data:', err);
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
    .replace(/>/g, '&gt;/')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
