const irelandMatches = [
  {
    date: "2024-03-23",
    competition: "Friendly",
    opponent: "Belgium",
    venue: "Home",
    goalsFor: 1,
    goalsAgainst: 1
  },
  {
    date: "2024-03-26",
    competition: "Friendly",
    opponent: "Switzerland",
    venue: "Away",
    goalsFor: 0,
    goalsAgainst: 1
  },
  {
    date: "2023-11-21",
    competition: "Euro Qualifier",
    opponent: "New Zealand",
    venue: "Home",
    goalsFor: 1,
    goalsAgainst: 1
  },
  {
    date: "2023-11-18",
    competition: "Euro Qualifier",
    opponent: "Netherlands",
    venue: "Away",
    goalsFor: 0,
    goalsAgainst: 1
  }
];

const statusEl = document.getElementById("matches-status");
const tableBody = document.getElementById("matches-table-body");
const competitionFilter = document.getElementById("competition-filter");

function getResult(goalsFor, goalsAgainst) {
  if (goalsFor > goalsAgainst) return "Win";
  if (goalsFor < goalsAgainst) return "Loss";
  return "Draw";
}

function renderTable(data) {
  tableBody.innerHTML = "";

  if (data.length === 0) {
    statusEl.textContent = "No matches found for selected competition.";
    return;
  }

  statusEl.textContent = `Showing ${data.length} matches`;

  data.forEach(match => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="px-4 py-2">${match.date}</td>
      <td class="px-4 py-2">${match.competition}</td>
      <td class="px-4 py-2">${match.opponent}</td>
      <td class="px-4 py-2">${match.venue}</td>
      <td class="px-4 py-2 font-medium">
        ${match.goalsFor}–${match.goalsAgainst}
      </td>
      <td class="px-4 py-2">
        ${getResult(match.goalsFor, match.goalsAgainst)}
      </td>
    `;

    tableBody.appendChild(row);
  });
}

function applyFilters() {
  const competition = competitionFilter.value;

  const filtered = irelandMatches.filter(match =>
    competition === "All" || match.competition === competition
  );

  renderTable(filtered);
}

competitionFilter.addEventListener("change", applyFilters);

// Initial render
renderTable(irelandMatches);
