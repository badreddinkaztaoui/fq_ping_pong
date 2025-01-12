import { View } from '../core/View.js';
import "../styles/home.css"

export class ValorantPongView extends View {
  constructor() {
    super();
    this.isAnimating = false;
  }

  async render() {
    const element = document.createElement("div");
    element.classList.add("valorant-pong-landing");

    element.innerHTML = `
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-background">
          ${Array.from({ length: 20 }, (_, i) => `
            <div class="bg-line" style="--index: ${i}"></div>
          `).join('')}
        </div>
        
        <div class="hero-content">
          <h1 class="hero-title">TACTICAL PONG</h1>
          <p class="hero-subtitle">Where precision meets power</p>
          <button class="play-button">
            PLAY NOW
            <svg class="play-icon" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="features-grid">
        ${[
          {
            icon: '👥',
            title: 'Multiplayer Battles',
            description: 'Challenge your friends in intense 1v1 matches'
          },
          {
            icon: '⚔️',
            title: 'Tournament Mode',
            description: 'Compete in ranked tournaments to prove your skills'
          },
          {
            icon: '🏆',
            title: 'Global Rankings',
            description: 'Climb the leaderboards and become a Pong champion'
          }
        ].map(feature => `
          <div class="feature-card">
            <div class="feature-icon">${feature.icon}</div>
            <h3 class="feature-title">${feature.title}</h3>
            <p class="feature-description">${feature.description}</p>
          </div>
        `).join('')}
      </div>

      <!-- Call to Action -->
      <div class="cta-section">
        <h2>Ready to Challenge?</h2>
        <button class="start-button">
          START GAME
          <svg class="arrow-icon" viewBox="0 0 24 24">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </button>
      </div>
    `;

    return element;
  }

  async setupEventListeners() {
    const playButton = this.$('.play-button');
    const startButton = this.$('.start-button');
    const featureCards = this.$$('.feature-card');

    this.addListener(playButton, 'click', () => this.handlePlayClick());
    this.addListener(startButton, 'click', () => this.handleStartClick());

    featureCards.forEach(card => {
      this.addListener(card, 'mouseenter', (e) => this.handleCardHover(e, true));
      this.addListener(card, 'mouseleave', (e) => this.handleCardHover(e, false));
    });
  }

  async afterMount() {
    // Trigger entrance animations
    this.element.classList.add('mounted');
    
    // Animate features sequentially
    const features = this.$$('.feature-card');
    features.forEach((feature, index) => {
      setTimeout(() => {
        feature.classList.add('visible');
      }, 200 + (index * 150));
    });
  }

  handlePlayClick() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    const button = this.$('.play-button');
    button.classList.add('clicked');
    
    setTimeout(() => {
      button.classList.remove('clicked');
      this.isAnimating = false;
    }, 500);
    
    // Trigger game start logic here
  }

  handleStartClick() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    const button = this.$('.start-button');
    button.classList.add('clicked');
    
    setTimeout(() => {
      button.classList.remove('clicked');
      this.isAnimating = false;
    }, 500);
    
    // Trigger game start logic here
  }

  handleCardHover(event, isEntering) {
    const card = event.currentTarget;
    if (isEntering) {
      card.classList.add('hovered');
    } else {
      card.classList.remove('hovered');
    }
  }
}