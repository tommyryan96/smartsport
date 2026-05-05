function getDemoShots() {
  return [
    { Team: "Dublin", X: 30, Y: 40, Result: "Point" },
    { Team: "Dublin", X: 60, Y: 50, Result: "Goal" },
    { Team: "Kerry", X: 50, Y: 30, Result: "Miss" },
    { Team: "Mayo", X: 70, Y: 60, Result: "Point" },
    { Team: "Galway", X: 40, Y: 70, Result: "Miss" }
  ];
}

function renderShotMap(shots) {
  const layer = document.getElementById("shotmap-layer");
  if (!layer) return;

  layer.innerHTML = "";

  shots.forEach((shot) => {
    const dot = document.createElement("div");

    dot.className = "absolute w-3 h-3 rounded-full";

    if (shot.Result === "Goal") {
      dot.style.background = "#22C55E";
      dot.style.transform = "scale(1.4)";
    } else if (shot.Result === "Point") {
      dot.style.background = "#10B981";
    } else {
      dot.style.background = "#EF4444";
    }

    dot.style.left = `${shot.X}%`;
    dot.style.top = `${shot.Y}%`;
    dot.style.transform += " translate(-50%, -50%)";

    layer.appendChild(dot);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // 🔥 FORCE DEMO DATA FOR PITCH
  const shots = getDemoShots();
  renderShotMap(shots);
});