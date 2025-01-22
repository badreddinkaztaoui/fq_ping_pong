import { matches } from '../utils/sampleData.js';

export function MatchList() {
    if (!matches || matches.length === 0) {
        return `
      <div class="no-matches">
        <p class="empty-message">No matches played yet. Start your first game!</p>
      </div>
    `;
    }

    const matchItems = matches.map(match => `
    <div class="match-item">
      <div class="player">
        <img src="${match.player1.avatar}" alt="${match.player1.name}" class="player-avatar">
        <span>${match.player1.name}</span>
      </div>
      <span class="match-score">${match.score}</span>
      <div class="player">
        <span>${match.player2.name}</span>
        <img src="${match.player2.avatar}" alt="${match.player2.name}" class="player-avatar">
      </div>
    </div>
  `).join('');

    return `
    <div class="match-list">
      ${matchItems}
    </div>
  `;
}