import { View } from '../core/View';
import { State } from "../core/State"
import { userState } from "../utils/UserState";
import { WelcomeBanner } from '../components/WelcomeBanner';
import { GameModes } from '../components/GameModes';
import { SpecialModes } from '../components/SpecialModes';
import { MatchList } from '../components/MatchList';

import "../styles/dashboard.css";
import "../styles/dashboard-animation.css"

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
      <section class="left-section">
        ${WelcomeBanner(this.user)}
        ${GameModes()}
        ${SpecialModes()}
      </section>

      <section class="right-section">
        <div class="last-matches">
          <h3 class="last-matches-title">Last Matches</h3>
          ${MatchList()}
        </div>
      </section>
    `;

    return template.content;
  }

  async setupEventListeners() {

    this.setupGameModeListeners();
    this.setupSpecialModeListeners();
    await this.loadDashboardData();
  }

  setupGameModeListeners() {
    const gameModeCards = this.$$('.game-mode-card');
    gameModeCards.forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        this.handleGameModeSelect(mode);
      });
    });
  }

  setupSpecialModeListeners() {
    const specialModeButtons = this.$$('.special-mode-button');
    specialModeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const mode = e.target.closest('.special-mode-card').dataset.mode;
        this.handleSpecialModeSelect(mode);
      });
    });
  }

  handleGameModeSelect(mode) {
    console.log(`Selected game mode: ${mode}`);
    // Add your game mode selection logic here
  }

  handleSpecialModeSelect(mode) {
    console.log(`Selected special mode: ${mode}`);
    // Add your special mode selection logic here
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

  updateUI(state) {
    if (state.loading) return;

    if (state.matches) {
      const matchListHTML = createMatchList(state.matches);
      const matchListContainer = this.$('.last-matches');
      if (matchListContainer) {
        matchListContainer.innerHTML = matchListHTML;
      }
    }

    if (state.error) {
      console.error(state.error);
    }
  }

  async loadDashboardData() {

  }


}

