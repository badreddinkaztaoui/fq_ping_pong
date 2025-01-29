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
    const template = document.createElement('main');
    template.className = "main-content"
    template.innerHTML = `
      <section class="left-section">
        ${WelcomeBanner(this.user)}
        ${GameModes()}
        ${SpecialModes()}
      </section>
      
      <section class="right-section">
        <div class="last-matches">
          ${MatchList()}
        </div>
      </section>
      <button class="matches-toggle" aria-label="Toggle Matches">
        MATCHES
      </button>
    `;

    return template;
  }

  async setupEventListeners() {

    this.setupGameModeListeners();
    this.setupSpecialModeListeners();
    await this.loadDashboardData();
    this.setupMatchesToggle();
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
  setupMatchesToggle() {
    const toggleBtn = this.$('.matches-toggle');
    const rightSection = this.$('.right-section');

    if (toggleBtn && rightSection) {
      toggleBtn.addEventListener('click', () => {
        rightSection.classList.toggle('active');
        // Update aria-expanded for accessibility
        const isExpanded = rightSection.classList.contains('active');
        toggleBtn.setAttribute('aria-expanded', isExpanded);
        if (isExpanded)
          toggleBtn.textContent = "X"
        else
          toggleBtn.textContent = "MATCHES"

      });


      // Close panel when clicking outside
      document.addEventListener('click', (e) => {
        if (!rightSection.contains(e.target) &&
          !toggleBtn.contains(e.target) &&
          rightSection.classList.contains('active')) {
          rightSection.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close panel on ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && rightSection.classList.contains('active')) {
          rightSection.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }
}