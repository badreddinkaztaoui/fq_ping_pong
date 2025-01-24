import { View } from "../core/View";
import "../styles/dashboard/analytics.css"


export class AnalyticsView extends View {
    constructor() {
        super();
        this.player = {
            name: "hicham",
            id: "#541",
            rating: 1875,
            matches: 32,
            peakRating: 2000,
            region: "NA",
            image: "../../../public/images/accounts-image/player-4.jpeg",
            winRate: 72,
            specialSkill: "Killer Serve",
            recentMatches: [
                { opponent: "Jett", result: "Win", score: "11-8" },
                { opponent: "Omen", result: "Loss", score: "8-11" },
                { opponent: "Raze", result: "Win", score: "11-6" },
                { opponent: "Sage", result: "Win", score: "11-4" },
                { opponent: "Cypher", result: "Loss", score: "9-11" }
            ],
            performanceMetrics: {
                avgPointsPerGame: 9.5,
                serviceAccuracy: 78,
                backhandWinRate: 65,
                forehandWinRate: 82,
            }
        };
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'player-analytics-dashboard';

        container.innerHTML = `
     ${this.renderPlayerHeader()}
     ${this.renderPerformanceOverview()}
     <div class="secondary-section">
       ${this.renderSkillBreakdown()}
       ${this.renderRecentMatches()}
     </div>
   `;

        this.initAnimations();
        return container;
    }

    renderPlayerHeader() {
        const { name, id, image, region, specialSkill } = this.player;
        return `
     <div class="player-header" data-aos="fade-down">
       <div class="player-avatar-container">
         <img src="${image}" alt="${name}" class="player-avatar-analytics">
         <div class="player-badge">${id}</div>
         <div class="player-status-indicator"></div>
       </div>
       <div class="player-info-analy">
         <h1 class="glitch" data-text="${name}">${name}</h1>
         <div class="player-stats">
           <div class="stat">
             <span class="stat-label">Region</span>
             <span class="stat-value">${region}</span>
           </div>
           <div class="stat">
             <span class="stat-label">Special Skill</span>
             <span class="stat-value">${specialSkill}</span>
           </div>
         </div>
       </div>
     </div>
   `;
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
             <div class="metric-bar" style="width: ${(rating / 2000) * 100}%"></div>
           </div>
           <div class="metric-item" data-aos="zoom-in" data-aos-delay="200">
             <span class="metric-label">Win Rate</span>
             <div class="metric-value metric-animated" data-target="${winRate}">${winRate}%</div>
             <div class="metric-bar" style="width: ${winRate}%"></div>
           </div>
           <div class="metric-item" data-aos="zoom-in" data-aos-delay="300">
             <span class="metric-label">Matches</span>
             <div class="metric-value metric-animated" data-target="${matches}">${matches}</div>
             <div class="metric-bar" style="width: ${(matches / 50) * 100}%"></div>
           </div>
           <div class="metric-item" data-aos="zoom-in" data-aos-delay="400">
             <span class="metric-label">Peak Rating</span>
             <div class="metric-value metric-animated" data-target="${peakRating}">${peakRating}</div>
             <div class="metric-bar" style="width: ${(peakRating / 2000) * 100}%"></div>
           </div>
         </div>
       </div>
     </div>
   `;
    }

    renderSkillBreakdown() {
        const { serviceAccuracy, backhandWinRate, forehandWinRate } = this.player.performanceMetrics;
        return `
     <div class="skill-breakdown">
       <h2>Skill Breakdown</h2>
       <div class="skill-chart">
         <div class="skill-item" data-aos="slide-right" data-aos-delay="100">
           <span class="skill-label">Service Accuracy</span>
           <div class="skill-value skill-animated" data-target="${serviceAccuracy}">${serviceAccuracy}%</div>
           <div class="skill-meter" style="width: ${serviceAccuracy}%"></div>
         </div>
         <div class="skill-item" data-aos="slide-right" data-aos-delay="200">
           <span class="skill-label">Backhand Win Rate</span>
           <div class="skill-value skill-animated" data-target="${backhandWinRate}">${backhandWinRate}%</div>
           <div class="skill-meter" style="width: ${backhandWinRate}%"></div>
         </div>
         <div class="skill-item" data-aos="slide-right" data-aos-delay="300">
           <span class="skill-label">Forehand Win Rate</span>
           <div class="skill-value skill-animated" data-target="${forehandWinRate}">${forehandWinRate}%</div>
           <div class="skill-meter" style="width: ${forehandWinRate}%"></div>
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
         ${this.player.recentMatches.map((match, index) => `
           <div class="match-item ${match.result.toLowerCase()}" data-aos="fade-left" data-aos-delay="${index * 100}">
             <div class="match-opponent">${match.opponent}</div>
             <div class="match-result">${match.result}</div>
             <div class="match-score">${match.score}</div>
           </div>
         `).join('')}
       </div>
     </div>
   `;
    }

    initAnimations() {
        const animateNumbers = () => {
            document.querySelectorAll('.metric-animated, .skill-animated').forEach(el => {
                const target = parseInt(el.getAttribute('data-target'), 10);
                if (isNaN(target)) return;

                let current = 0;
                const increment = target / 50;

                const updateValue = () => {
                    if (current < target) {
                        current += increment;
                        el.textContent = Math.round(current) + (el.textContent.includes('%') ? '%' : '');
                        requestAnimationFrame(updateValue);
                    } else {
                        el.textContent = target + (el.textContent.includes('%') ? '%' : '');
                    }
                };
                updateValue();
            });
        };

        animateNumbers();
    }


}