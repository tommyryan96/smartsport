let players = [];
let currentPlayer = null;

async function loadPlayers() {
    try {

        const response = await fetch("data/players.json");
        players = await response.json();

        if (!players.length) return;

        populateDropdown();

        loadPlayer(players[0].id);

    } catch (err) {

        console.error("Unable to load players.", err);

    }
}

function populateDropdown() {

    const selector = document.getElementById("playerSelector");

    selector.innerHTML = "";

    players.forEach(player => {

        const option = document.createElement("option");

        option.value = player.id;
        option.textContent = player.name;

        selector.appendChild(option);

    });

    selector.addEventListener("change", function () {

        loadPlayer(Number(this.value));

    });

}

function loadPlayer(id) {

    currentPlayer = players.find(p => p.id === id);

    if (!currentPlayer) return;

    document.getElementById("playerName").textContent =
        currentPlayer.name;

    document.getElementById("playerNameCard").textContent =
        currentPlayer.name;

    document.getElementById("playerPosition").textContent =
        currentPlayer.position;

    document.getElementById("playerClub").textContent =
        currentPlayer.club || "ÉireMetrics Demo";

    document.getElementById("playerPhoto").src =
        currentPlayer.photo || "../assets/player-placeholder.png";

    document.getElementById("playerRating").textContent =
        currentPlayer.rating;

    document.getElementById("minutes").textContent =
        currentPlayer.minutes;

    document.getElementById("scores").textContent =
        currentPlayer.scores;

    document.getElementById("assists").textContent =
        currentPlayer.assists;

    document.getElementById("shots").textContent =
        currentPlayer.shots;

    document.getElementById("summary").innerHTML = createSummary(currentPlayer);

    if (typeof drawPassingChart === "function") {

        drawPassingChart(currentPlayer);

    }

    if (typeof drawPerformanceChart === "function") {

        drawPerformanceChart(currentPlayer);

    }
	
	if(typeof drawShotMap==="function"){

    drawShotMap(currentPlayer.shotData);

}

}

function createSummary(player) {

    return `
        <p><strong>Rating:</strong> ${player.rating}/10</p>
        <br>
        <p>${player.name} has played ${player.minutes} minutes this season.</p>
        <br>
        <p>Recorded <strong>${player.scores}</strong> while providing <strong>${player.assists}</strong> assists.</p>
        <br>
        <p>Passing Accuracy: <strong>${player.passing}%</strong></p>
    `;

}

document.addEventListener("DOMContentLoaded", loadPlayers);