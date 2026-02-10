export default function IrelandSoccerPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Republic of Ireland – Team Stats & Analysis</h1>
      <p>
        Results, trends and performance data for the Irish national soccer team.
      </p>

      <section>
        <h2>Key Stats</h2>
        <ul>
          <li>Matches Played: 10</li>
          <li>Goals Per Game: 1.1</li>
          <li>Clean Sheets: 30%</li>
        </ul>
      </section>

      <section>
        <h2>Recent Matches</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Competition</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mar 2024</td>
              <td>Belgium</td>
              <td>Friendly</td>
              <td>1–1</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
