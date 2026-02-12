fetch("data/ireland_results.json")
.then(response => response.json())
.then(data => {

    const nextMatchDiv = document.getElementById("next-match");
    const recentDiv = document.getElementById("recent-matches");

    const today = new Date();

    // Sort by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Next Fixture
    const nextMatch = data.find(match => new Date(match.date) > today);

    if (nextMatch) {
        nextMatchDiv.innerHTML = `
            <div class="next-box">
                <h3>Next Fixture</h3>
                <strong>${nextMatch.opponent}</strong><br>
                ${nextMatch.date} | ${nextMatch.venue}
            </div>
        `;
    }

    // Recent Matches (last 5 finished)
    const finishedMatches = data
        .filter(match => match.result !== null)
        .slice(-5)
        .reverse();

    finishedMatches.forEach(match => {

        let resultColor = "";
        if (match.result === "W") resultColor = "green";
        if (match.result === "L") resultColor = "red";
        if (match.result === "D") resultColor = "orange";

        const card = document.createElement("div");
        card.classList.add("match-card");

        card.innerHTML = `
            <div class="result ${resultColor}">${match.result}</div>
            <div>
                <strong>${match.gf}-${match.ga}</strong> vs ${match.opponent}<br>
                ${match.date} | ${match.venue}<br>
                Possession: ${match.possession}%
            </div>
        `;

        recentDiv.appendChild(card);
    });

});
