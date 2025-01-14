import { View } from '../core/View';
import { State } from "../core/State"
import "../styles/home.css";

export class HomeView extends View {
  constructor() {
    super();
    this.state = new State({
      topPlayers: [],
      recentMatches: []
    });
  }

  async render() {
    const template = document.createElement('template');
    template.innerHTML = `
      <main class="home-view" role="main">
        <!-- Hero Section -->
        <section class="hero" aria-labelledby="hero-title">
          <h1 id="hero-title" class="hero__title">ft_transcendence</h1>
          <p class="hero__subtitle">Welcome to the Ultimate Pong Experience</p>
          <div class="hero__cta">
            <a href="/login" class="btn btn-primary" role="button">Start Playing</a>
            <a href="/signup" class="btn btn-secondary" role="button">Create Account</a>
          </div>
        </section>

        <!-- Features Section -->
        <section class="features" aria-labelledby="features-title">
          <h2 id="features-title" class="features__title">Game Features</h2>
          <div class="features__grid">
            <div class="feature-card" role="article">
              <h3>Real-time Multiplayer</h3>
              <p>Challenge players worldwide in intense Pong matches</p>
            </div>
            <div class="feature-card" role="article">
              <h3>Global Rankings</h3>
              <p>Compete for the top spot on our global leaderboard</p>
            </div>
            <div class="feature-card" role="article">
              <h3>Tournament Mode</h3>
              <p>Join tournaments and prove your skills</p>
            </div>
          </div>
        </section>

        <!-- Live Matches Section -->
        <section class="live-matches" aria-labelledby="matches-title">
          <h2 id="matches-title">Live Matches</h2>
          <div class="matches-grid" role="list" aria-live="polite"></div>
        </section>
      </main>
    `;

    return template.content.firstElementChild;
  }

  async setupEventListeners() {
    // Subscribe to state changes
    this.state.subscribe((state) => {
      this.updateTopPlayers(state.topPlayers);
      this.updateRecentMatches(state.recentMatches);
    });

    // Load initial data
    await this.loadInitialData();
  }

  async loadInitialData() {
    // try {
    //   const [topPlayers, recentMatches] = await Promise.all([
    //     fetch('/api/leaderboard').then(res => res.json()),
    //     fetch('/api/recent-matches').then(res => res.json())
    //   ]);

    //   this.state.setState({ topPlayers, recentMatches });
    // } catch (error) {
    //   console.error('Failed to load initial data:', error);
    // }
  }

  updateTopPlayers(players) {
    // Update top players section
  }

  updateRecentMatches(matches) {
    // Update recent matches section
  }
}

