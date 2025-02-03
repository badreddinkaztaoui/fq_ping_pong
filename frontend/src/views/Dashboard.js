import { View } from "../core/View";
import { State } from "../core/State";
import { userState } from "../utils/UserState";
import { WelcomeBanner } from "../components/WelcomeBanner";
import { GameModes } from "../components/GameModes";
import { MatchList } from "../components/MatchList";
import "../styles/dashboard/specialsModes.css";

import "../styles/dashboard.css";
import "../styles/dashboard-animation.css";

export class DashboardView extends View {
  constructor() {
    super();
    this.user = userState.state.user;
    this.state = new State({
      stats: null,
      loading: true,
      error: null,
    });
  }

  async render() {
    const template = document.createElement("main");
    template.className = "main-content";
    template.innerHTML = `
      <section class="left-section">
        ${WelcomeBanner(this.user)}
        ${GameModes()}
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
                  <div class="stat-label">Games</div>
                  <div class="stat-value">2</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Prize Coins</div>
                  <div class="stat-value">5,000</div>
                </div>
              </div>
              <button class="tournament-btn gambling-tournament-btn" id="gambling">Compete Now</button>
            </div>
          </div>
        </div>
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
    this.setupGamblingModeListeners();
    await this.loadDashboardData();
    this.setupMatchesToggle();
  }

  setupGameModeListeners() {
    const gameModeCards = this.$$(".game-mode");

    gameModeCards.forEach((card) => {
      card.addEventListener("click", (event) => {
        const mode = event.currentTarget.id;
        this.handleGameModeSelect(mode);
      });
    });
  }

  setupGamblingModeListeners() {
    const specialModeButtons = this.$(".gambling-tournament-btn");
    specialModeButtons.addEventListener("click", () => {
      const mode = specialModeButtons.id;
      this.handleSpecialModeSelect(mode);
    });
  }

  handleGameModeSelect(mode) {
    this.router.navigate(`/dashboard/${mode}`);
  }

  handleSpecialModeSelect(mode) {
    this.router.navigate(`/dashboard/${mode}`);
  }

  async handleLogout() {
    try {
      const logoutBtn = this.$(".logout-btn");
      const originalText = logoutBtn.textContent;
      logoutBtn.textContent = "Logging out...";
      logoutBtn.disabled = true;

      await userState.logout();
      this.router.navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      const logoutBtn = this.$(".logout-btn");
      logoutBtn.textContent = originalText;
      logoutBtn.disabled = false;
      alert("Logout failed. Please try again.");
    }
  }

  updateUI(state) {
    if (state.loading) return;

    if (state.matches) {
      const matchListHTML = createMatchList(state.matches);
      const matchListContainer = this.$(".last-matches");
      if (matchListContainer) {
        matchListContainer.innerHTML = matchListHTML;
      }
    }

    if (state.error) {
      console.error(state.error);
    }
  }

  async loadDashboardData() {}
  setupMatchesToggle() {
    const toggleBtn = this.$(".matches-toggle");
    const rightSection = this.$(".right-section");

    if (toggleBtn && rightSection) {
      toggleBtn.addEventListener("click", () => {
        rightSection.classList.toggle("active");
        // Update aria-expanded for accessibility
        const isExpanded = rightSection.classList.contains("active");
        toggleBtn.setAttribute("aria-expanded", isExpanded);
        if (isExpanded) toggleBtn.textContent = "X";
        else toggleBtn.textContent = "MATCHES";
      });

      // Close panel when clicking outside
      document.addEventListener("click", (e) => {
        if (
          !rightSection.contains(e.target) &&
          !toggleBtn.contains(e.target) &&
          rightSection.classList.contains("active")
        ) {
          rightSection.classList.remove("active");
          toggleBtn.setAttribute("aria-expanded", "false");
        }
      });

      // Close panel on ESC key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && rightSection.classList.contains("active")) {
          rightSection.classList.remove("active");
          toggleBtn.setAttribute("aria-expanded", "false");
        }
      });
    }
  }
}
