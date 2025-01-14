import { View } from '../core/View';
import { State } from "../core/State"
import "../styles/dashboard.css";

export class DashboardView extends View {
    constructor() {
      super();
      this.state = new State({
        user: null,
        stats: null,
        loading: true,
        error: null
      });
    }
  
    async render() {
      const template = document.createElement('template');
      template.innerHTML = `
        <main class="dashboard" role="main">
          <!-- Profile Section -->
          <section class="profile-section">
            <div class="profile-info">
              <h1>Welcome, <span class="username">Player</span></h1>
            </div>
            
            <!-- Quick Actions -->
            <div class="quick-actions">
              <button class="btn play-btn">Play Game</button>
            </div>
          </section>
  
          <!-- Stats Section -->
          <section class="stats-section">
            <h2>Your Stats</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <h3>Wins</h3>
                <p class="wins">0</p>
              </div>
              <div class="stat-card">
                <h3>Losses</h3>
                <p class="losses">0</p>
              </div>
              <div class="stat-card">
                <h3>Win Rate</h3>
                <p class="winrate">0%</p>
              </div>
            </div>
          </section>
  
          <!-- Recent Matches -->
          <section class="matches-section">
            <h2>Recent Matches</h2>
            <div class="matches-list">
              <!-- Matches will be populated here -->
            </div>
          </section>
        </main>
      `;
  
      return template.content.firstElementChild;
    }
  
    async setupEventListeners() {
      // Play button
      const playBtn = this.$('.play-btn');
      this.addListener(playBtn, 'click', this.handlePlayGame.bind(this));
  
      // Subscribe to state changes
      this.state.subscribe((state) => this.updateUI(state));
  
      // Load initial data
      await this.loadDashboardData();
    }
  
    async loadDashboardData() {
     
    }
  
    async fetchUser() {
  
    }
  
    async handlePlayGame() {
    
    }
  
    updateUI(state) {
      if (state.loading) return;
  
      if (state.user) {
        this.$('.username').textContent = state.user.username;
        const avatar = this.$('.profile-avatar');
        if (state.user.avatar_url) {
          avatar.src = state.user.avatar_url;
        }
      }
  
      if (state.stats) {
        this.$('.wins').textContent = state.stats.wins || '0';
        this.$('.losses').textContent = state.stats.losses || '0';
        this.$('.winrate').textContent = `${state.stats.winrate || '0'}%`;
      }
  
      if (state.error) {
        // Handle error state if needed
        console.error(state.error);
      }
    }
  }