import { View } from "../core/View";
import "../styles/dashboard/analytics.css";
import { userState } from "../utils/UserState";

export class AnalyticsView extends View {
  constructor() {
    super();
    this.user = userState.state.user;

    this.player = {
      id: "#541",
      rating: 1875,
      matches: 32,
      peakRating: 2000,
      winRate: 72,
      recentMatches: [
        { opponent: "Jett", result: "Win", score: "11-8" },
        { opponent: "Omen", result: "Loss", score: "8-11" },
        { opponent: "Raze", result: "Win", score: "11-6" },
        { opponent: "Sage", result: "Win", score: "11-4" },
        { opponent: "Cypher", result: "Loss", score: "9-11" },
      ],
      performanceMetrics: {
        GoalScores: 85,
        goalsConceded: 15,
      },
    };
  }

  async render() {
    const container = document.createElement("div");
    container.className = "player-analytics-dashboard";

    container.innerHTML = `
      ${this.renderPerformanceOverview()}
      <div class="secondary-section">
        ${this.renderSkillBreakdown()}
        ${this.renderRecentMatches()}
      </div>
    `;

    container.appendChild(this.renderProgressChart());

    this.initAnimations();
    return container;
  }

  renderPerformanceOverview() {
    const { rating, matches, winRate, peakRating } = this.player;
    return `
      <div class="performance-overview">
        <div class="performance-card" data-aos="fade-up">
          <h2>Performance Metrics</h2>
          <div class="metrics-grid">
            <div class="metric-item" data-aos="zoom-in" data-aos-delay="100">
              <span class="metric-label">Rating</span>
              <div class="metric-value metric-animated" data-target="${rating}">${rating}</div>
              <div class="metric-bar" style="width: ${
                (rating / 2000) * 100
              }%"></div>
            </div>
            <div class="metric-item" data-aos="zoom-in" data-aos-delay="200">
              <span class="metric-label">Win Rate</span>
              <div class="metric-value metric-animated" data-target="${winRate}">${winRate}%</div>
              <div class="metric-bar" style="width: ${winRate}%"></div>
            </div>
            <div class="metric-item" data-aos="zoom-in" data-aos-delay="300">
              <span class="metric-label">Matches</span>
              <div class="metric-value metric-animated" data-target="${matches}">${matches}</div>
              <div class="metric-bar" style="width: ${
                (matches / 50) * 100
              }%"></div>
            </div>
            <div class="metric-item" data-aos="zoom-in" data-aos-delay="400">
              <span class="metric-label">Peak Rating</span>
              <div class="metric-value metric-animated" data-target="${peakRating}">${peakRating}</div>
              <div class="metric-bar" style="width: ${
                (peakRating / 2000) * 100
              }%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSkillBreakdown() {
    const { GoalScores, goalsConceded } = this.player.performanceMetrics;
    return `
      <div class="skill-breakdown">
        <h2>Skill Breakdown</h2>
        <div class="skill-chart">
          <div class="skill-item" data-aos="slide-right" data-aos-delay="100">
            <span class="skill-label">GoalScores</span>
            <div class="skill-value skill-animated" data-target="${GoalScores}">${GoalScores}%</div>
            <div class="skill-meter" style="width: ${GoalScores}%"></div>
          </div>
          <div class="skill-item" data-aos="slide-right" data-aos-delay="200">
            <span class="skill-label">goals Conceded</span>
            <div class="skill-value skill-animated" data-target="${goalsConceded}">${goalsConceded}%</div>
            <div class="skill-meter" style="width: ${goalsConceded}%"></div>
          </div>
          
        </div>
      </div>
    `;
  }

  renderRecentMatches() {
    return `
      <div class="recent-matches">
        <h2>Recent Matches</h2>
        <div class="matches-list">
          ${this.player.recentMatches
            .map(
              (match, index) => `
            <div class="match-item ${match.result.toLowerCase()}" data-aos="fade-left" data-aos-delay="${
                index * 100
              }">
              <div class="match-opponent">${match.opponent}</div>
              <div class="match-result">${match.result}</div>
              <div class="match-score">${match.score}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  renderProgressChart() {
    const container = document.createElement("div");
    container.className = "progress-chart-section";

    container.innerHTML = "<h2>Progress Timeline</h2>";

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;
    canvas.className = "progress-chart";
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const data = [
      { month: "Jan", rating: 1200 },
      { month: "Feb", rating: 1350 },
      { month: "Mar", rating: 1450 },
      { month: "Apr", rating: 1400 },
      { month: "May", rating: 1600 },
      { month: "Jun", rating: 1750 },
      { month: "Jul", rating: 1875 },
    ];

    let progress = 0;
    const maxRating = Math.max(...data.map((d) => d.rating));
    const minRating = Math.min(...data.map((d) => d.rating));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = "#1a2634";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      const gridLines = 5;
      ctx.strokeStyle = "rgba(17, 255, 228, 0.1)";
      ctx.lineWidth = 1;

      for (let i = 0; i <= gridLines; i++) {
        const y = canvas.height - (i * canvas.height) / gridLines;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        // Rating labels
        ctx.fillStyle = "#11ffe4";
        ctx.font = '12px "VALORANT"';
        const rating = minRating + ((maxRating - minRating) * i) / gridLines;
        ctx.fillText(Math.round(rating), 10, y - 5);
      }

      // Draw line
      ctx.beginPath();
      ctx.strokeStyle = "#ff4655";
      ctx.lineWidth = 3;

      data.forEach((point, i) => {
        const x = (canvas.width / (data.length - 1)) * i;
        const y =
          canvas.height -
          ((point.rating - minRating) / (maxRating - minRating)) *
            canvas.height *
            progress;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Month labels
        ctx.fillStyle = "#11ffe4";
        ctx.font = '14px "VALORANT"';
        ctx.fillText(point.month, x - 15, canvas.height - 10);
      });

      ctx.stroke();

      // Draw points
      data.forEach((point, i) => {
        const x = (canvas.width / (data.length - 1)) * i;
        const y =
          canvas.height -
          ((point.rating - minRating) / (maxRating - minRating)) *
            canvas.height *
            progress;

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ff4655";
        ctx.fill();
        ctx.strokeStyle = "#11ffe4";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      if (progress < 1) {
        progress += 0.02;
        requestAnimationFrame(draw);
      }
    };

    requestAnimationFrame(draw);
    return container;
  }

  initAnimations() {
    const animateNumbers = () => {
      document
        .querySelectorAll(".metric-animated, .skill-animated")
        .forEach((el) => {
          const target = parseInt(el.getAttribute("data-target"), 10);
          if (isNaN(target)) return;

          let current = 0;
          const increment = target / 50;

          const updateValue = () => {
            if (current < target) {
              current += increment;
              el.textContent =
                Math.round(current) + (el.textContent.includes("%") ? "%" : "");
              requestAnimationFrame(updateValue);
            } else {
              el.textContent =
                target + (el.textContent.includes("%") ? "%" : "");
            }
          };
          updateValue();
        });
    };

    animateNumbers();
  }
  setupEventListeners() {
    const matchItems = document.querySelectorAll(".match-item");
    matchItems.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        item.style.transform = "scale(1.02)";
      });

      item.addEventListener("mouseleave", () => {
        item.style.transform = "";
      });
    });

    this.initAnimations();
  }
}
