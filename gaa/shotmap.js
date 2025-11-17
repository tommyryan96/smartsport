// SHOT MAP TAB
const status = document.getElementById("shotmap-status");

function showShotmapLoading() {
  status.textContent = "Loading shot map…";
  status.className = "status-box status-loading";
  status.style.display = "block";
}

function showShotmapError() {
  status.textContent = "Unable to load shot map data.";
  status.className = "status-box status-error";
  status.style.display = "block";
}

function hideShotmapStatus() {
  status.style.display = "none";
}

const SHOTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=835953916&single=true&output=csv"; // TODO: replace

async function loadShotData() {
  try {
    const res = await fetch(SHOTS_CSV_URL);
    const text = await res.text();
    return parseCsv(text); // parseCsv is defined in overview.js
  } catch (e) {
    console.error("Error loading shots", e);
    return [];
  }
}

function populateShotmapFilters(shots) {
  const teamSelect = document.getElementById("shotmap-team-select");
  if (!teamSelect) return;
  const teams = Array.from(new Set(shots.map((s) => s.Team))).sort();

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

  const teamFilter = document.getElementById("shotmap-team-select")?.value || "ALL";
  const resultFilter = document.getElementById("shotmap-result-select")?.value || "ALL";

  shots.forEach((shot) => {
    const teamOk = teamFilter === "ALL" || shot.Team === teamFilter;
    const resOk = resultFilter === "ALL" || shot.Result === resultFilter;
    if (!teamOk || !resOk) return;

    const x = Number(shot.X || 0); // expected 0–100
    const y = Number(shot.Y || 0);

    const dot = document.createElement("div");
    dot.classList.add("shot-dot");

    const result = (shot.Result || "").toLowerCase();
    if (result.includes("goal")) dot.classList.add("goal");
    else if (result.includes("point")) dot.classList.add("point");
    else if (result.includes("miss")) dot.classList.add("miss");
    else dot.classList.add("blocked");

    dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
    dot.title = `${shot.Team} – ${shot.Player || "Unknown"} (${shot.Result})`;

    layer.appendChild(dot);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  showShotmapLoading();

  try {
    const shots = await loadShotData();
    if (!shots.length) {
      showShotmapError();
      return;
    }
    hideShotmapStatus();
    populateShotmapFilters(shots);
    renderShotMap(shots);
  } catch (e) {
    showShotmapError();
  }
});
