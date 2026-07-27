const response = await fetch("data/matches.json");
const matches = await response.json();

document.getElementById("matchesPlayed").textContent = dashboardData.matches;
document.getElementById("wins").textContent = dashboardData.wins;
document.getElementById("scoresFor").textContent = dashboardData.scoresFor;
document.getElementById("scoresAgainst").textContent = dashboardData.scoresAgainst;
document.getElementById("pointsDifference").textContent = dashboardData.pointsDifference;
document.getElementById("winRate").textContent = dashboardData.winRate;