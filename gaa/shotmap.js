// SHOT MAP TAB – Éire Metrics (GAA)

// 1) UPDATE THIS URL TO YOUR REAL GOOGLE SHEETS CSV
const SHOTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=835953916&single=true&output=csv"; // <- change this

// ---------- CSV PARSING ----------
function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  if (!headerLine) return [];

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

// ---------- HELPERS ----------
function normaliseResult(raw) {
  if (!raw) return "";
  const v = raw.toLowerCase();
  if (v.startsWith("g")) return "Goal";
  if (v.startsWith("p")) return "Point";
  if (v.includes("miss") || v.includes("wide")) return "Miss";
  if (v.includes("block")) return "Blocked";
  return raw;
}

function getTeam(shot) {
  return (shot.Team || shot.team || "").trim();
}

function getResult(shot) {
  return normaliseResult(shot.Result || shot.result || "");
}

function getCoords(shot) {
  // Expect 0–100 scale for both X and Y
  const xRaw = shot.X ?? shot.x ?? shot.ShotX ?? shot.Shot_X;
  const yRaw = shot.Y ?? shot.y ?? shot.ShotY ?? shot.Shot_Y;

  const x = Number(xRaw);
  const y = Number(yRaw);

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
  };
}

function uniqueTeams(shots) {
  const set = new Set();
  shots.forEach((s) => {
    const t = getTeam(s);
    if (t) set.add(t);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// ---------- FILTERS ----------
function populateShotmapFilters(shots) {
  const teamSelect = document.getElementById("shotmap-team-select");
  if (!teamSelect) return;

  const teams = uniqueTeams(shots);
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

function filterShots(shots) {
  const teamSel = document.getElementById("shotmap-team-select");
  const resSel = document.getElementById("shotmap-result-select");

  const teamFilter = (teamSel?.value || "ALL").toLowerCase();
  const resFilter = (resSel?.value || "ALL").toLowerCase();

  return shots.filter((shot) => {
    const team = getTeam(shot).toLowerCase();
    const res = getResult(shot).toLowerCase();

    const teamOk = teamFilter === "all" || team === teamFilter;
    const resOk = resFilter === "all" || res === resFilter;
    return teamOk && resOk;
  });
}

// ---------- RENDERING ----------
function renderShotMap(shots) {
  const layer = document.getElementById("shotmap-layer");
  if (!layer) return;

  const filtered = filterShots(shots);

  // Clear previous dots
  layer.innerHTML = "";

  filtered.forEach((shot) => {
    const coords = getCoords(shot);
    if (!coords) return;

    const res = getResult(shot);
    const dot = document.createElement("div");
    dot.classList.add("shot-dot");

    if (res === "Goal") dot.classList.add("goal");
    else if (res === "Point") dot.classList.add("point");
    else if (res === "Miss") dot.classList.add("miss");
    else dot.classList.add("blocked");

    dot.style.left = `${coords.x}%`; // 0–100 across pitch.svg viewBox
    dot.style.top = `${coords.y}%`;  // 0–100 down pitch.svg viewBox

    const team = getTeam(shot) || "Unknown team";
    const player = (shot.Player || shot.player || "Unknown player").trim();
    const label = player ? `${team} – ${player}` : team;
    dot.title = `${label} (${res || "Shot"})`;

    layer.appendChild(dot);
  });
}

// ---------- INIT ----------
async function loadShotsCsv() {
  const resp = await fetch(SHOTS_CSV_URL);
  if (!resp.ok) {
    throw new Error(`Failed to load CSV: ${resp.status}`);
  }
  const text = await resp.text();
  return parseCsv(text);
}

document.addEventListener("DOMContentLoaded", async () => {
  // Only run if the shotmap tab exists on this page
  const statusBox = document.getElementById("shotmap-status");
  const layer = document.getElementById("shotmap-layer");
  if (!layer) return;

  if (statusBox) {
    statusBox.textContent = "Loading shot data…";
    statusBox.classList.add("status-loading");
  }

  let shots = [];

  try {
    shots = await loadShotsCsv();
  } catch (err) {
    console.error(err);
    if (statusBox) {
      statusBox.textContent = "Could not load shot data.";
      statusBox.classList.remove("status-loading");
      statusBox.classList.add("status-error");
    }
    return;
  }

  if (statusBox) {
    statusBox.style.display = "none";
  }

  populateShotmapFilters(shots);
  renderShotMap(shots);

  const teamSel = document.getElementById("shotmap-team-select");
  const resSel = document.getElementById("shotmap-result-select");

  [teamSel, resSel].forEach((sel) => {
    if (!sel) return;
    sel.addEventListener("change", () => renderShotMap(shots));
  });

  // Optional: re-render on window resize if you ever switch to canvas etc.
});
