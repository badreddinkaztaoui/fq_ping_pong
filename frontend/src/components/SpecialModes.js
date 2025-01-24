import "../styles/dashboard/specialsModes.css"


export function SpecialModes() {

  return `
       <div class="tournament-grid">
          <div class="tournament-card tournament-card-pro">
            <div class="tournament-content">
              <h2 class="tournament-title">Pro Circuit Tournament</h2>
              <p class="tournament-subtitle">Global Competitive Challenge</p>
              <div class="tournament-stats">
                <div class="stat-item">
                  <div class="stat-label">Players</div>
                  <div class="stat-value">128/256</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Prize Pool</div>
                  <div class="stat-value">$10,000</div>
                </div>
              </div>
              <button class="tournament-btn pro-tournament-btn">Register Now</button>
            </div>
          </div>
  
          <div class="tournament-card tournament-card-gambling">
            <span class="live-badge">Win Coins</span>
            <div class="tournament-content">
              <h2 class="tournament-title">Coin Masters Challenge</h2>
              <p class="tournament-subtitle">Win Big, Risk More</p>
              <div class="tournament-stats">
                <div class="stat-item">
                  <div class="stat-label">Lives</div>
                  <div class="stat-value">7</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Prize Coins</div>
                  <div class="stat-value">5,000</div>
                </div>
              </div>
              <button class="tournament-btn gambling-tournament-btn">Compete Now</button>
            </div>
          </div>
        </div>
    `;
}
