import "../styles/dashboard/gamesModes.css";

export function GameModes() {
  const standardModes = [
    {
      title: 'VS AI',
      desc: 'Challenge our advanced AI system',
      theme: 'blue'
    },
    {
      title: '1V1',
      desc: 'Face off against other players',
      theme: 'red'
    },
    {
      title: 'Train Mode',
      desc: 'Perfect your skills',
      theme: 'green'
    }
  ];


  const standardModesHTML = standardModes.map(mode => `
    <div class="game-mode-card ${mode.theme}-theme">
      <div class="mode-overlay"></div>
      <div class="mode-content">
        <div class="mode-info">
          <h3 class="mode-title">${mode.title}</h3>
          <p class="mode-desc">${mode.desc}</p>
          <div class="button-container">
            <button class="play-button">
                P L A Y
                <div id="clip">
                    <div id="leftTop" class="corner"></div>
                    <div id="rightBottom" class="corner"></div>
                    <div id="rightTop" class="corner"></div>
                    <div id="leftBottom" class="corner"></div>
                </div>
                <span id="rightArrow" class="arrow"></span>
                <span id="leftArrow" class="arrow"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');


  return `
    <div class="game-modes-container">
      <section class="standard-modes">
        <h2 class="section-title">SELECT MODE</h2>
        <div class="modes-grid">${standardModesHTML}</div>
      </section>

    </div>
  `;
}