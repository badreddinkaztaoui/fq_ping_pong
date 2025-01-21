import { View } from '../core/View';
import { State } from "../core/State"
import { userState } from "../utils/UserState";

import "../styles/dashboard.css";

export class DashboardView extends View {
    constructor() {
      super();
      this.user = userState.state.user;
      this.state = new State({
        stats: null,
        loading: true,
        error: null
      });

      console.log(this.user);
    }
  
    async render() {
      const template = document.createElement('template');
      template.innerHTML = `
        <main class="dashboard" role="main">
          <!-- Profile Section -->
          <section class="profile-section">
            <div class="profile-info">
              <h1>Welcome, <span class="username">${this.user.username}</span></h1>
            </div>
            
            <!-- Quick Actions -->
            <div class="quick-actions">
              <button class="btn play-btn">Play Game</button>
              <button class="btn logout-btn">Logout</button>
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
      const playBtn = this.$('.play-btn');
      this.addListener(playBtn, 'click', this.handlePlayGame.bind(this));
      
      const logoutBtn = this.$('.logout-btn');
      this.addListener(logoutBtn, 'click', this.handleLogout.bind(this));
  
      this.state.subscribe((state) => this.updateUI(state));
  
      await this.loadDashboardData();
    }
    
    async handleLogout() {
      try {
        const logoutBtn = this.$('.logout-btn');
        const originalText = logoutBtn.textContent;
        logoutBtn.textContent = 'Logging out...';
        logoutBtn.disabled = true;
        
        await userState.logout();
        
        this.router.navigate('/login');
      } catch (error) {
        console.error('Logout failed:', error);
        
        const logoutBtn = this.$('.logout-btn');
        logoutBtn.textContent = originalText;
        logoutBtn.disabled = false;
        
        alert('Logout failed. Please try again.');
      }
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
        console.error(state.error);
      }
    }
  }