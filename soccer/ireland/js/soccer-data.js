fetch("../data/ireland_results.json")
  .then(res => {
    if (!res.ok) throw new Error("Failed to load JSON");
    return res.json();
  })
  .then(data => {

    const status = document.getElementById("matches-status");
    const tableBody = document.getElementById("matches-table-body");
    const nextFixtureDiv = document.getElementById("next-fixture");
    const formDiv = document.getElementById("form-string");
    const goalsDiv = document.getElementById("goals-summary");

    status.textContent = "";

    const parseDate = (d) => new Date(d);

    // Sort ascending
    data.sort((a, b) => parseDate(a.date) - parseDate(b.date));

    const today = new Date();

    // -------- NEXT FIXTURE --------
    const nextMatch = data.find(m => parseDate(m.date) > today);

    if (nextMatch) {
      nextFixtureDiv.innerHTML = `
        <div class="font-semibold">${nextMatch.opponent}</div>
        <div class="text-sm text-slate-500">
          ${nextMatch.date} · ${nextMatch.venue}
        </div>
      `;
    } else {
      nextFixtureDiv.textContent = "No upcoming fixtures";
    }

    // -------- FINISHED MATCHES --------
    const finished = data.filter(m => m.result);

    const lastFive = finished.slice(-5);

    // -------- FORM --------
    formDiv.innerHTML = "";

    lastFive.forEach(match => {
      let color = "bg-slate-300";

      if (match.result === "W") color = "bg-emerald-500";
      if (match.result === "L") color = "bg-red-500";
      if (match.result === "D") color = "bg-amber-400";

      const badge = document.createElement("div");
      badge.className = `${color} w-8 h-8 flex items-center justify-center rounded-md text-white font-semibold`;
      badge.textContent = match.result;

      formDiv.appendChild(badge);
    });

    // -------- GOALS --------
    const goalsFor = lastFive.reduce((sum, m) => sum + (m.gf || 0), 0);
    const goalsAgainst = lastFive.reduce((sum, m) => sum + (m.ga || 0), 0);

    goalsDiv.textContent = `${goalsFor} scored · ${goalsAgainst} conceded`;

    // -------- TABLE --------
    tableBody.innerHTML = "";

    finished.slice().reverse().forEach(match => {

      let resultColor = "text-slate-500";

      if (match.result === "W") resultColor = "text-emerald-600 font-semibold";
      if (match.result === "L") resultColor = "text-red-600 font-semibold";
      if (match.result === "D") resultColor = "text-amber-500 font-semibold";

      const row = document.createElement("tr");

      row.innerHTML = `
        <td class="px-4 py-3">${match.date}</td>
        <td class="px-4 py-3">${match.opponent}</td>
        <td class="px-4 py-3">${match.venue}</td>
        <td class="px-4 py-3">${match.gf ?? "-"}-${match.ga ?? "-"}</td>
        <td class="px-4 py-3 ${resultColor}">${match.result}</td>
      `;

      tableBody.appendChild(row);
    });

  })
  .catch(error => {
    console.error(error);
    document.getElementById("matches-status").textContent =
      "Error loading match data.";
  });