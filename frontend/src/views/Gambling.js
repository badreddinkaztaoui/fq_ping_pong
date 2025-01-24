import { View } from "../core/View";
import "../styles/dashboard/gambling.css";

export class GamblingView extends View {
    constructor() {
        super();
        this.matchData = [
            {
                id: '#12345',
                player1: 'Ali',
                player1Rank: 'Radiant',
                score1: 15,
                image1: 'accounts-image/player-0.webp',
                player2: 'Zoe',
                player2Rank: 'Immortal',
                score2: 12,
                image2: 'accounts-image/player-1.jpeg',
            },
            {
                id: '#67890',
                player1: 'Max',
                player1Rank: 'Immortal',
                score1: 8,
                image1: 'accounts-image/player-0.webp',
                player2: 'Eli',
                player2Rank: 'Radiant',
                score2: 10,
                image2: 'accounts-image/player-1.jpeg',
            },
            {
                id: '#24680',
                player1: 'Leo',
                player1Rank: 'Radiant',
                score1: 13,
                image1: 'accounts-image/player-0.webp',
                player2: 'Ivy',
                player2Rank: 'Immortal',
                score2: 11,
                image2: 'accounts-image/player-1.jpeg',
            },
            {
                id: '#13579',
                player1: 'Nia',
                player1Rank: 'Immortal',
                score1: 9,
                image1: 'accounts-image/player-0.webp',
                player2: 'Kai',
                player2Rank: 'Radiant',
                score2: 14,
                image2: 'accounts-image/player-1.jpeg',
            },
            {
                id: '#11223',
                player1: 'Jay',
                player1Rank: 'Radiant',
                score1: 10,
                image1: 'accounts-image/player-0.webp',
                player2: 'Eve',
                player2Rank: 'Immortal',
                score2: 9,
                image2: 'accounts-image/player-1.jpeg',
            },
            {
                id: '#44556',
                player1: 'Ash',
                player1Rank: 'Immortal',
                score1: 12,
                image1: 'accounts-image/player-0.webp',
                player2: 'Lia',
                player2Rank: 'Radiant',
                score2: 13,
                image2: 'accounts-image/player-1.jpeg',
            },
            {
                id: '#77889',
                player1: 'Mia',
                player1Rank: 'Radiant',
                score1: 11,
                image1: 'accounts-image/player-0.webp',
                player2: 'Sam',
                player2Rank: 'Immortal',
                score2: 10,
                image2: 'accounts-image/player-1.jpeg',
            },
            {
                id: '#11223',
                player1: 'Jay',
                player1Rank: 'Radiant',
                score1: 10,
                image1: 'accounts-image/player-0.webp',
                player2: 'Eve',
                player2Rank: 'Immortal',
                score2: 9,
                image2: 'accounts-image/player-1.jpeg',
            },
            {
                id: '#44556',
                player1: 'Ash',
                player1Rank: 'Immortal',
                score1: 12,
                image1: 'accounts-image/player-0.webp',
                player2: 'Lia',
                player2Rank: 'Radiant',
                score2: 13,
                image2: 'accounts-image/player-1.jpeg',
            },

        ];

        this.itemsPerPage = 6;
        this.currentPage = 1;
        this.totalPages = Math.ceil(this.matchData.length / this.itemsPerPage);
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'gambling-container';

        if (!this.matchData.length) {
            return this.renderEmptyState();
        }

        container.innerHTML = `
            <div class="section-header">
                <h2>Live Matches</h2>
            </div>
            <div class="matches-live-grid" id="matches-live-grid">
                ${this.renderMatchCards()}
            </div>
            <div class="pagination">
                <button class="prev-page" ${this.currentPage === 1 ? "disabled" : ""}>Previous</button>
                <span class="page-info">Page ${this.currentPage} of ${this.totalPages}</span>
                <button class="next-page" ${this.currentPage === this.totalPages ? "disabled" : ""}>Next</button>
            </div>
        `;

        return container;
    }

    renderMatchCards() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageMatches = this.matchData.slice(start, end);

        return pageMatches.map(match => `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-header">
                    <span class="match-time live-tag">
                        <div class="live-indicator pulse"></div>
                        LIVE
                    </span>
                    <span class="match-id">${match.id}</span>
                </div>
                <div class="players-container">
                    <div class="player player-left">
                        <div class="player-avatar-wrapper">
                            <img src="${match.image1}" alt="${match.player1}" class="player-avatar-live">
                            <div class="player-rank">${match.player1Rank}</div>
                        </div>
                        <div class="player-info-gambling">
                            <div class="player-name">${match.player1}</div>
                        </div>
                    </div>
                    <div class="score-gambling">
                        <p class="player-score">${match.score1}</p>                    
                        <span class="vs-badge">VS</span>
                        <p class="player-score">${match.score2}</p>
                    </div>
                    <div class="player player-right">
                        <div class="player-avatar-wrapper">
                            <img src="${match.image2}" alt="${match.player2}" class="player-avatar-live">
                            <div class="player-rank">${match.player2Rank}</div>
                        </div>
                        <div class="player-info-gambling">
                            <div class="player-name">${match.player2}</div>
                        </div>
                    </div>
                </div>
                <div class="betting-container">
                    <div class="coin-input-wrapper">
                        <button class="coin-btn min-btn">MIN</button>
                        <input type="number" class="coin-input" placeholder="Enter coins" min="100" max="10000">
                        <button class="coin-btn max-btn">MAX</button>
                    </div>
                    <div class="multiplier-grid">
                        ${[1, 2, 4, 8, 12].map(x => `
                            <button class="multiplier-btn" data-multiplier="${x}">x${x}</button>
                        `).join('')}
                    </div>
                    <div class="bet-actions">
                        <button class="bet-btn bet-left" data-side="left">
                            <span class="btn-text">Bet ${match.player1}</span>
                            <div class="btn-effect"></div>
                        </button>
                        <div class="potential-win">
                            Potential Win: <span class="win-amount">0</span>
                        </div>
                        <button class="bet-btn bet-right" data-side="right">
                            <span class="btn-text">Bet ${match.player2}</span>
                            <div class="btn-effect"></div>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async setupEventListeners() {
        const prevButton = this.$('.prev-page');
        const nextButton = this.$('.next-page');

        if (prevButton) {
            this.addListener(prevButton, 'click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.updateMatchGrid();
                }
            });
        }

        if (nextButton) {
            this.addListener(nextButton, 'click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.updateMatchGrid();
                }
            });
        }

        const matchCards = this.$$('.match-card');
        matchCards.forEach(card => {
            const matchId = card.dataset.matchId;
            const matchData = this.matchData.find(m => m.id === matchId);
            this.setupCardInteractions(card, matchData);
        });
    }

    setupCardInteractions(card, match) {
        const input = card.querySelector('.coin-input');
        const minBtn = card.querySelector('.min-btn');
        const maxBtn = card.querySelector('.max-btn');
        const multiplierBtns = card.querySelectorAll('.multiplier-btn');
        const winAmount = card.querySelector('.win-amount');
        const betLeftBtn = card.querySelector('.bet-btn.bet-left');
        const betRightBtn = card.querySelector('.bet-btn.bet-right');

        let currentMultiplier = 1;
        let currentBetAmount = 0;
        const maxBetAmount = 1000;
        const minBetAmount = 100;

        const updateWinAmount = () => {
            const win = currentBetAmount * currentMultiplier;
            winAmount.textContent = `$${win.toFixed(2)}`;
        };

        this.addListener(minBtn, 'click', () => {
            currentBetAmount = minBetAmount;
            input.value = currentBetAmount;
            updateWinAmount();
        });

        this.addListener(maxBtn, 'click', () => {
            currentBetAmount = maxBetAmount;
            input.value = currentBetAmount;
            updateWinAmount();
        });

        this.addListener(input, 'input', () => {
            const value = parseFloat(input.value);
            if (!isNaN(value) && value >= minBetAmount && value <= maxBetAmount) {
                currentBetAmount = value;
                updateWinAmount();
            } else {
                input.value = currentBetAmount;
            }
        });

        multiplierBtns.forEach(btn => {
            this.addListener(btn, 'click', () => {
                multiplierBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const multiplier = parseFloat(btn.dataset.multiplier);
                if (multiplier) {
                    currentMultiplier = multiplier;
                    updateWinAmount();
                }
            });
        });

        this.addListener(betLeftBtn, 'click', () => {
            if (currentBetAmount > 0) {
                this.placeBet(match, 'left', currentBetAmount, currentMultiplier);
            }
        });

        this.addListener(betRightBtn, 'click', () => {
            if (currentBetAmount > 0) {
                this.placeBet(match, 'right', currentBetAmount, currentMultiplier);
            }
        });
    }

    updateMatchGrid() {
        const matchGrid = this.$('#matches-live-grid');
        const pagination = this.$('.pagination');

        if (matchGrid && pagination) {
            matchGrid.innerHTML = this.renderMatchCards();
            pagination.innerHTML = `
                <button class="prev-page" ${this.currentPage === 1 ? "disabled" : ""}>Previous</button>
                <span class="page-info">Page ${this.currentPage} of ${this.totalPages}</span>
                <button class="next-page" ${this.currentPage === this.totalPages ? "disabled" : ""}>Next</button>
            `;
            this.setupEventListeners();
        }
    }

    placeBet(match, side, amount, multiplier) {
        // Implement your betting logic here
        console.log(`Placing bet for match ${match.id}:`, { side, amount, multiplier });
        this.showNotification(`Bet placed on ${side === 'left' ? match.player1 : match.player2}: $${amount}`, 'success');
    }

    renderEmptyState() {
        const container = document.createElement('div');
        container.className = 'gambling-container';

        container.innerHTML = `
            <div class="section-header">
                <h2>Live Matches</h2>
            </div>
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="64" height="64">
                    <path fill="#7289da" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    <path fill="#7289da" d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/>
                </svg>
                <h3>No Live Matches</h3>
                <p>Check back later for upcoming matches</p>
            </div>
        `;

        return container;
    }

    showNotification(message, type = 'default') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}