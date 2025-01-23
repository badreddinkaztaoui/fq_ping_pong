import { View } from "../core/View"
// CSS
import "../styles/404.css"

export class NotFoundView extends View {
  constructor() {
    super();
    this.handleRefresh = this.handleRefresh.bind(this);
    this.handleNavigate = this.handleNavigate.bind(this);
  }


  handleRefresh(e) {
    e.preventDefault();
    window.location.reload();
  }

  handleNavigate(e) {
    e.preventDefault();
    this.router.navigate("/")
  }

  async setupEventListeners() {
    const refreshButton = this.$('#refresh-btn');
    const goHomeButton = this.$('.btn-home')

    if (goHomeButton) {
        this.addListener(goHomeButton, 'click', this.handleNavigate);
    }

    if (refreshButton) {
      this.addListener(refreshButton, 'click', this.handleRefresh);
    }
  }


  async render() {
    const container = document.createElement('div');
    container.className = 'not-found-page';
    
    container.innerHTML = `
      <div class="error-content">
        <div class="error-code">404</div>
        <div class="error-message">
          <h1>Oops! Page Not Found</h1>
          <p>The page you're looking for seems to have gone off the table.</p>
        </div>
        <div class="error-actions">
          <a data-link class="btn-not-found btn-home">
            Return Home
          </a>
          <button id="refresh-btn" class="btn-not-found btn-refresh">
            Refresh Page
          </button>
        </div>
      </div>
      <div class="background-elements">
        <div class="ping-pong-scene">
          <div class="table"></div>
          <div class="ball"></div>
          <div class="paddle left-paddle"></div>
          <div class="paddle right-paddle"></div>
        </div>
      </div>
      <footer class="error-footer">
        <p>Seems like you've missed the ball</p>
      </footer>
    `;

    return container;
  }

 
  async beforeUnmount() {}
}

export default NotFoundView;