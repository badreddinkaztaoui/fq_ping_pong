export function SpecialModes() {
    const specialModes = [
        {
            title: 'Tournament',
            image: '/images/dashboard/tournm3.jpg',
            stats: [
                { label: 'PLAYERS', value: '128/256' },
                { label: 'PRIZE POOL', value: '$10,000' }
            ],
            buttonText: 'REGISTER NOW'
        },
        {
            title: 'Gambling',
            image: '/images/dashboard/gambling.avif',
            stats: [
                { label: 'MATCHES', value: '5 LIVE' },
                { label: 'PRIZE COINS', value: '5,000' }
            ],
            buttonText: 'GAMBLE NOW'
        }
    ];

    const createStatItems = (stats) => stats.map(stat => `
      <div class="stat-item">
        <span class="stat-label">${stat.label}</span>
        <span class="stat-value">${stat.value}</span>
      </div>
    `).join('');

    const modeCards = specialModes.map(mode => `
      <div class="special-mode-card" data-mode="${mode.title.toLowerCase()}">
        <img src="${mode.image}" alt="${mode.title}">
        <div class="special-mode-info">
          <div class="special-mode-stats">
            ${createStatItems(mode.stats)}
          </div>
          <button class="special-mode-button">${mode.buttonText}</button>
        </div>
      </div>
    `).join('');

    return `
      <div class="special-modes">
        ${modeCards}
      </div>
    `;
}
