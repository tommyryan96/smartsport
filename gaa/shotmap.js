// SHOT MAP TAB

// 1) UPDATE THIS URL
const SHOTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=835953916&single=true&output=csv"; // <- your CSV URL

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());
  return lines
    .filter((l) => l.trim().length > 0)
    .map((line) => line.split(","))
    .map((cols) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = (cols[i] || "").trim()));
      return obj;
    });
}

async function loadShotData() {
  try {
    const res = await fetch(SHOTS_CSV_URL);
    const text = await res.text();
    return parseCsv(text);
  } catch (e) {
    console.error("Error loading shots", e);
    return [];
  }
}

function populateShotmapFilters(shots) {
  const teamSelect = document.getElementById("shotmap-team-select");
  if (!teamSelect) return;

  const teams = Array.from(
    new Set(
      shots
        .map((s) => s.Team || "")
        .filter((t) => t.trim().length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  // Start with "All Teams"
  teamSelect.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "ALL";
  allOpt.textContent = "All Teams";
  teamSelect.appendChild(allOpt);

  teams.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    teamSelect.appendChild(opt);
  });
}

function renderShotMap(shots) {
  const layer = document.getElementById("shotmap-layer");
  if (!layer) return;
  layer.innerHTML = "";

  const teamSel = document.getElementById("shotmap-team-select");
  const resultSel = document.getElementById("shotmap-result-select");

  const teamFilter =
    (teamSel && teamSel.value && teamSel.value !== "ALL"
      ? teamSel.value.toLowerCase().trim()
      : "ALL");

  const resultFilter =
    (resultSel && resultSel.value && resultSel.value !== "ALL"
      ? resultSel.value.toLowerCase().trim()
      : "ALL");

  shots.forEach((shot) => {
    const rawTeam = (shot.Team || "").toLowerCase().trim();
    const rawResult = (shot.Result || "").toLowerCase().trim();

    const teamOk = teamFilter === "ALL" || rawTeam === teamFilter;
    const resOk = resultFilter === "ALL" || rawResult === resultFilter;

    if (!teamOk || !resOk) return;

    const x = Number(shot.X || 0); // 0–100
    const y = Number(shot.Y || 0);

    const dot = document.createElement("div");
    dot.classList.add("shot-dot");

    if (rawResult.includes("goal")) dot.classList.add("goal");
    else if (rawResult.includes("point")) dot.classList.add("point");
    else if (rawResult.includes("miss")) dot.classList.add("miss");
    else dot.classList.add("blocked");

    dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
    dot.title = `${shot.Team || "Unknown team"} – ${
      shot.Player || "Unknown player"
    } (${shot.Result || "Shot"})`;

    layer.appendChild(dot);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("shotmap-status");
  if (status) {
    status.textContent = "Loading shot map…";
    status.className = "status-box status-loading";
    status.style.display = "block";
  }

  const shots = await loadShotData();

  if (!shots.length) {
    if (status) {
      status.textContent = "No shot data available.";
      status.className = "status-box status-error";
      status.style.display = "block";
    }
    return;
  }

  if (status) status.style.display = "none";

  populateShotmapFilters(shots);
  renderShotMap(shots);

  const teamSel = document.getElementById("shotmap-team-select");
  const resSel = document.getElementById("shotmap-result-select");

  [teamSel, resSel].forEach((sel) => {
    if (!sel) return;
    sel.addEventListener("change", () => renderShotMap(shots));
  });
});
