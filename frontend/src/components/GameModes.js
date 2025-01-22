export function GameModes() {
    const modes = [
        { title: 'VS AI', image: '/images/dashboard/ai.png' },
        { title: '1V1', image: '/images/dashboard/normal.png' },
        { title: 'Train Mode', image: '/images/dashboard/train.png' }
    ];

    const modeCards = modes.map(mode => `
      <div class="game-mode-card" data-mode="${mode.title.toLowerCase()}">
        <img src="${mode.image}" alt="${mode.title}">
        <span class="game-mode-title">${mode.title}</span>
      </div>
    `).join('');

    return `
      <div class="game-modes">
        <h2 class="game-modes-title">Game Modes</h2>
        <div class="game-modes-grid">
          ${modeCards}
        </div>
      </div>
    `;
}
