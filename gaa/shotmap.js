// ===============================
// ÉIRE METRICS – SHOT MAP (FIXED)
// ===============================

function getDemoShots() {
  return [
    { Team: "Dublin", X: 30, Y: 40, Result: "Point" },
    { Team: "Dublin", X: 60, Y: 50, Result: "Goal" },
    { Team: "Kerry", X: 50, Y: 30, Result: "Miss" },
    { Team: "Mayo", X: 70, Y: 60, Result: "Point" },
    { Team: "Galway", X: 40, Y: 70, Result: "Miss" }
  ];
}

// ---------- Render ----------
function renderShotMap(shots) {
  const layer = document.getElementById("shotmap-layer");
  if (!layer) return;

  layer.innerHTML = "";

  shots.forEach((shot) => {
    const dot = document.createElement("div");

    dot.className = "absolute w-3 h-3 rounded-full";

    // Colour coding
    if (shot.Result === "Goal") {
      dot.style.background = "#22C55E";
      dot.style.transform = "scale(1.4)";
    } else if (shot.Result === "Point") {
      dot.style.background = "#10B981";
    } else {
      dot.style.background = "#EF4444";
    }

    // Position
    dot.style.left = `${shot.X}%`;
    dot.style.top = `${shot.Y}%`;

    dot.style.transform += " translate(-50%, -50%)";

    // Tooltip
    dot.title = `${shot.Team} – ${shot.Result}`;

    layer.appendChild(dot);
  });
}

// ---------- Load ----------
async function loadShots() {
  try {
    const res = await fetch(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmw8a9a0VG4En221pebLbwX_1eWc7HgcUaObHlT2U33-10HFDRKTqAHfJgcQBqGg7zT2ZL7mLFIu_c/pub?gid=835953916&single=true&output=csv"
    );

    const text = await res.text();

    const lines = text.split("\n").slice(1);

    return lines.map((l) => {
      const [Team, X, Y, Result] = l.split(",");
      return {
        Team,
        X: Number(X),
        Y: Number(Y),
        Result
      };
    });
  } catch {
    return [];
  }
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", async () => {
  let shots = await loadShots();

  if (!shots.length) {
    console.log("Using demo shot data");
    shots = getDemoShots();
  }

  renderShotMap(shots);
});