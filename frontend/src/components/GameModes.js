import "../styles/dashboard/gamesModes.css";

export function GameModes() {
  const modes = [
    { title: 'VS AI', image: '/images/dashboard/ai.png', desc: 'Challenge our advanced AI system' },
    { title: '1V1', image: '/images/dashboard/normal.png', desc: 'Face off against other players' },
    { title: 'Train Mode', image: '/images/dashboard/train.png', desc: 'Perfect your skills' },
  ];

  const modeCards = modes.map(
    (mode) => `
    <div class="game-mode-card" data-mode="${mode.title.toLowerCase()}">
      <img src="${mode.image}" alt="${mode.title}">
      <div class="mode-overlay"></div>
      <div class="mode-content">
        <p class="mode-desc">${mode.desc}</p>
        <button class="play-button">
          PLAY
          <div class="button-shine"></div>
        </button>
      </div>
    </div>
  `
  ).join('');

  return `
    <div class="game-section">
      <h2 class="section-title">SELECT MODE</h2>
      <div class="modes-container">${modeCards}</div>
    </div>
  `;
}
