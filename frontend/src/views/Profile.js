import "../styles/dashboard/profile.css";

import { View } from "../core/View";
import { State } from "../core/State";
import { userState } from "../utils/UserState";

export class ProfileView extends View {
  constructor() {
    super();
    this.user = userState.state.user;
    this.state = new State({
      playerStats: {
        name: this.user.username,
        avatar: this.user.avatar_url || "/images/default-avatar.png",
        matches: {
          total: 100,
          wins: 65,
          losses: 35,
        },
      },
      loading: false,
      error: null,
    });
    console.log({ State });
  }

  async render() {
    const template = document.createElement("section");
    template.className = "ui-val-wrapper";

    template.innerHTML = `
            <div class="ui-val-background"></div>
            <div class="ui-val-container">
                <!-- Profile Card -->
                <div class="ui-val-profile-card">
                    <div class="ui-val-profile-banner"></div>
                    <div class="ui-val-profile-content">
                        <div class="ui-val-avatar-container">
                            <div class="ui-val-avatar">
                                <img src="${this.user.avatar_url}" 
                                     alt="${this.state.state.playerStats.name}" 
                                     id="playerAvatar" />
                            </div>
                        </div>
                        <div class="ui-val-profile-info">
                            <h1 class="ui-val-player-name">${
                              this.state.state.playerStats.name
                            }</h1>
                            <div class="ui-val-player-tag">${
                              userState.state.user.email
                            }</div>
                        </div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="ui-val-stats-grid">
                    <div class="ui-val-stat-card" data-stat="matches">
                        <div class="ui-val-stat-label">Total Matches</div>
                        <div class="ui-val-stat-value">
                            <span class="number">${
                              this.state.state.playerStats.matches.total
                            }</span>
                        </div>
                    </div>
                    <div class="ui-val-stat-card" data-stat="wins">
                        <div class="ui-val-stat-label">Victories</div>
                        <div class="ui-val-stat-value">
                            <span class="number">${
                              this.state.state.playerStats.matches.wins
                            }</span>
                        </div>
                    </div>
                    <div class="ui-val-stat-card" data-stat="losses">
                        <div class="ui-val-stat-label">Defeats</div>
                        <div class="ui-val-stat-value">
                            <span class="number">${
                              this.state.state.playerStats.matches.losses
                            }</span>
                        </div>
                    </div>
                    <div class="ui-val-stat-card" data-stat="winrate">
                        <div class="ui-val-stat-label">Win Rate</div>
                        <div class="ui-val-stat-value">
                            <span class="number">${this.calculateWinRate()}</span>
                            <span class="percent">%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

    this.setupAnimations(template);
    return template;
  }

  setupAnimations(template) {
    const cards = template.querySelectorAll(".ui-val-stat-card");

    cards.forEach((card, index) => {
      setTimeout(() => {
        card.style.animation = `fadeInUp 0.6s ease-out forwards`;
      }, 600 + index * 100);

      const numberElement = card.querySelector(".number");
      if (numberElement) {
        const finalValue = numberElement.textContent;
        this.animateNumber(numberElement, 0, parseFloat(finalValue), 2000);
      }
    });
  }

  animateNumber(element, start, end, duration) {
    const startTimestamp = performance.now();
    const isInteger = Number.isInteger(end);

    const animate = (currentTimestamp) => {
      const progress = Math.min(
        (currentTimestamp - startTimestamp) / duration,
        1
      );
      const currentValue = start + (end - start) * this.easeOutQuart(progress);

      element.textContent = isInteger
        ? Math.floor(currentValue).toString()
        : currentValue.toFixed(1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
  }

  calculateWinRate() {
    const { wins, total } = this.state.state.playerStats.matches;
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  }
}
