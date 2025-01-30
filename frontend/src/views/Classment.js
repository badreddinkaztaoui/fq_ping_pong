import { View } from "../core/View";
import "../styles/dashboard/classment.css";

export class ClassmentView extends View {
  constructor() {
    super();
    this.itemsPerPage = 6;
    this.currentPage = 1;
    this.trophyPng = [
      "/images/dashboard/trophies/gold-trophy.png",
      "/images/dashboard/trophies/silver-trophy.png",
      "/images/dashboard/trophies/bronze-trophy.png"
    ];
    this.players = this.sortPlayers(this.getPlayersList());
    this.totalPages = Math.ceil(this.players.length / this.itemsPerPage);
  }

  getPlayersList() {
    return [
      {
        name: "Liam",
        id: "#541",
        rating: 1875,
        matches: 32,
        peakRating: 2000,
        region: "NA",
        image: "/images/users/player-0.webp",
        winRate: 72,

      },
      {
        name: "Ethan",
        id: "#542",
        rating: 1780,
        matches: 29,
        peakRating: 1920,
        region: "EU",
        image: "/images/users/player-0.webp",
        winRate: 64,
      },
      {
        name: "Akira",
        id: "#543",
        rating: 1700,
        matches: 27,
        peakRating: 1800,
        region: "APAC",
        image: "/images/users/player-0.webp",
        winRate: 58,
      },
      {
        name: "Lucas",
        id: "#544",
        rating: 1650,
        matches: 23,
        peakRating: 1750,
        region: "SA",
        image: "/images/users/player-0.webp",
        winRate: 53,
      },
      {
        name: "Khalid",
        id: "#545",
        rating: 1600,
        matches: 21,
        peakRating: 1700,
        region: "ME",
        image: "/images/users/player-0.webp",
        winRate: 48,
      },
      {
        name: "Noah",
        id: "#546",
        rating: 1820,
        matches: 30,
        peakRating: 1950,
        region: "NA",
        image: "/images/users/player-0.webp",
        winRate: 70,
      },
      {
        name: "Sophie",
        id: "#547",
        rating: 1755,
        matches: 28,
        peakRating: 1900,
        region: "EU",
        image: "/images/users/player-0.webp",
        winRate: 63,
      },
      {
        name: "Raj",
        id: "#548",
        rating: 1690,
        matches: 26,
        peakRating: 1800,
        region: "APAC",
        image: "/images/users/player-0.webp",
        winRate: 57,
      },
    ];
  }

  sortPlayers(players) {
    return players
      .sort((a, b) => b.rating - a.rating)
      .map((player, index) => ({
        ...player,
        rank: `#${index + 1}`,
        trophyImage: index < 3 ? this.trophyPng[index] : null
      }));
  }
  renderTable() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedPlayers = this.players.slice(startIndex, endIndex);

    const rows = paginatedPlayers
      .map(
        (player, index) => `
          <tr class="${index < 3 ? ["gold", "silver", "bronze"][index] : ""}">
            <td class="rank-cell">${player.rank}</td>
            <td class="player-cell">
              <img class="player-avatar" src="${player.image}" alt="${player.name}">
              <div class="player-details">
                <span class="player-name">${player.name}</span>
              </div>
            </td>
            <td class="matches-cell">
              <div class="stat-tile">
                <span class="stat-value">${player.matches}</span>
                <div class="stat-bar" style="width: ${(player.matches / 50) * 100
          }%"></div>
              </div>
            </td>
            <td class="rating-cell">
              <div class="stat-tile">
                <span class="stat-value">${player.rating}</span>
                <div class="stat-bar" style="width: ${(player.rating / 2000) * 100
          }%"></div>
              </div>
            </td>
            <td class="peak-cell">
              <div class="stat-tile">
                <span class="stat-value">${player.peakRating}</span>
                <div class="stat-bar" style="width: ${(player.peakRating / 2000) * 100
          }%"></div>
              </div>
            </td>
          </tr>
        `
      )
      .join("");

    return `
          <table class="leaderboard-table valorant-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Matches</th>
                <th>Rating</th>
                <th>Peak</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="pagination-class">
            <button class="prev-page" ${this.currentPage === 1 ? "disabled" : ""}>
                Previous
            </button>
            <span class="page-info">Page ${this.currentPage} of ${this.totalPages}</span>
            <button class="next-page" ${this.currentPage === this.totalPages ? "disabled" : ""}>
                Next
            </button>
          </div>
        `;
  }
  renderTopThree() {
    const topThree = this.players.slice(0, 3);
    const rankLabels = ["1", "2", "3"];


    return `
          <div class="top-three-container">
            ${topThree.map((player, index) => `
              <div class="top-player top-${["first", "second", "third"][index]} valorant-card" data-rank="${rankLabels[index]}">
                <div class="top-player-badge absolute-badge">${rankLabels[index]}</div>
                <div class="trophy-overlay">
                  <img src="${player.trophyImage}" class="trophy-icon" alt="Trophy">
                </div>
                <div class="player-card">
                  <img class="player-image" src="${player.image}" alt="${player.name}">
                  <div class="player-overlay">
                    <div class="player-details">
                      <h2>${player.name}</h2>
                      <div class="player-stats">
                        <div class="stat">
                          <span class="stat-label">Region</span>
                          <span class="stat-value">${player.region}</span>
                        </div>
                        <div class="stat">
                          <span class="stat-label">Matches</span>
                          <span class="stat-value">${player.matches}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `;
  }
  async render() {
    const container = document.createElement('section');
    container.className = 'leaderboard-modern valorant-leaderboard';

    container.innerHTML = `
          <div class="top-three">${this.renderTopThree()}</div>
          <div class="table-container">${this.renderTable()}</div>
        `;

    // Bind events after content rendered
    const prevBtn = container.querySelector('.prev-page');
    const nextBtn = container.querySelector('.next-page');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        console.log('prev clicked');
        if (this.currentPage > 1) {
          this.currentPage--;
          this.updateLeaderboard();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        console.log('next clicked');
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.updateLeaderboard();
        }
      });
    }

    return container;
  }

  updateTable() {
    const tableContainer = this.$('.table-container');
    tableContainer.innerHTML = this.renderTable();
    this.updateLeaderboard(); // Reattach listeners
  }
  updateLeaderboard() {
    const tableContainer = this.$('.table-container');
    if (!tableContainer) return;

    tableContainer.innerHTML = this.renderTable();

    // Reattach event listeners after HTML update
    const prevBtn = tableContainer.querySelector('.prev-page');
    const nextBtn = tableContainer.querySelector('.next-page');

    prevBtn.addEventListener('click', () => {
      console.log('prev clicked');
      if (this.currentPage > 1) {
        this.currentPage--;
        this.updateTable();
      }
    });

    nextBtn.addEventListener('click', () => {
      console.log('next clicked');
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.updateTable();
      }
    });
  }
}