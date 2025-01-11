import { View } from "../core/View.js";
import "../styles/home.css";

export class HomeView extends View {
  constructor() {
    super();
    this.currentStep = 0;
    this.totalSteps = 4;
  }

  async render() {
    const element = document.createElement("div");
    element.classList.add("generator-landing");

    element.innerHTML = `
      <div class="header">
        <div class="logo">
          <div class="logo-icon">🎮</div>
          <h1>ft_transcendence Generator</h1>
        </div>
        <div class="github-link">
          <a href="https://github.com/yourusername/ft_transcendence_generator" target="_blank" class="github-button">
            View on GitHub
          </a>
        </div>
      </div>

      <div class="main-content">
        <div class="intro-section">
          <h2>Create Your Full-Stack Game Platform</h2>
          <p>A powerful generator for building a modern gaming platform with microservices architecture.</p>
          
          <div class="tech-stack">
            <div class="tech-item">
              <span class="tech-icon">🇯‌🇸‌</span>
              <span>Javascript</span>
            </div>
            <div class="tech-item">
              <span class="tech-icon">🐍</span>
              <span>Django</span>
            </div>
            <div class="tech-item">
              <span class="tech-icon">🐳</span>
              <span>Docker</span>
            </div>
            <div class="tech-item">
              <span class="tech-icon">🔄</span>
              <span>WebSocket</span>
            </div>
          </div>
        </div>

        <div class="generator-guide">
          <div class="steps-progress">
            <div class="progress-bar">
              <div class="progress" style="width: 0%"></div>
            </div>
            <div class="steps-counter">Step <span class="current-step">1</span> of ${this.totalSteps}</div>
          </div>

          <div class="steps-container">
            <div class="step active" data-step="0">
              <h3>1. Prerequisites</h3>
              <div class="step-content">
                <p>Ensure you have the following installed:</p>
                <div class="prerequisites-list">
                  <div class="prerequisite-item">
                    <div class="check-icon">✓</div>
                    <div class="prerequisite-details">
                      <h4>Docker & Docker Compose</h4>
                      <code>docker --version</code>
                      <code>docker-compose --version</code>
                    </div>
                  </div>
                  <div class="prerequisite-item">
                    <div class="check-icon">✓</div>
                    <div class="prerequisite-details">
                      <h4>Git</h4>
                      <code>git --version</code>
                    </div>
                  </div>
                  <div class="prerequisite-item">
                    <div class="check-icon">✓</div>
                    <div class="prerequisite-details">
                      <h4>Bash Shell</h4>
                      <code>bash --version</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="step" data-step="1">
              <h3>2. Project Structure</h3>
              <div class="step-content">
                <p>The generator will create the following structure:</p>
                <div class="structure-tree">
                  <pre>
ft_transcendence/
├── frontend/         # React frontend
├── backend/
│   ├── auth/        # Authentication service
│   ├── game/        # Game service
│   └── chat/        # Chat service
├── nginx/           # Reverse proxy
└── docker-compose.yml</pre>
                </div>
              </div>
            </div>

            <div class="step" data-step="2">
              <h3>3. Installation</h3>
              <div class="step-content">
                <div class="installation-steps">
                  <div class="code-block">
                    <div class="code-header">
                      <span>Clone the repository</span>
                      <button class="copy-button" data-code="git clone <repository-url>">Copy</button>
                    </div>
                    <code>git clone &lt;repository-url&gt;</code>
                  </div>

                  <div class="code-block">
                    <div class="code-header">
                      <span>Make scripts executable</span>
                      <button class="copy-button" data-code="chmod +x *.sh">Copy</button>
                    </div>
                    <code>chmod +x *.sh</code>
                  </div>

                  <div class="code-block">
                    <div class="code-header">
                      <span>Run the generator</span>
                      <button class="copy-button" data-code="./generate.sh">Copy</button>
                    </div>
                    <code>./generate.sh</code>
                  </div>
                </div>
              </div>
            </div>

            <div class="step" data-step="3">
              <h3>4. Usage</h3>
              <div class="step-content">
                <div class="usage-guide">
                  <div class="usage-step">
                    <h4>Start the Application</h4>
                    <div class="code-block">
                      <div class="code-header">
                        <span>Navigate and start</span>
                        <button class="copy-button" data-code="cd ft_transcendence && docker-compose up --build">Copy</button>
                      </div>
                      <code>cd ft_transcendence && docker-compose up --build</code>
                    </div>
                  </div>

                  <div class="usage-step">
                    <h4>Access Services</h4>
                    <ul>
                      <li>Frontend: <code>http://localhost:8000</code></li>
                      <li>API Endpoints: <code>http://localhost:8000/api/{service}</code></li>
                      <li>Health Checks: <code>http://localhost:8000/api/{service}/health</code></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="step-navigation">
            <button class="nav-button prev" disabled>Previous</button>
            <button class="nav-button next">Next</button>
          </div>
        </div>
      </div>
    `;

    return element;
  }

  async setupEventListeners() {
    const prevButton = this.$(".nav-button.prev");
    const nextButton = this.$(".nav-button.next");

    this.addListener(prevButton, "click", () => this.navigateStep(-1));
    this.addListener(nextButton, "click", () => this.navigateStep(1));

    // Copy button functionality
    const copyButtons = this.$$(".copy-button");
    copyButtons.forEach((button) => {
      this.addListener(button, "click", (e) => this.handleCopy(e));
    });
  }

  async afterMount() {
    this.updateStepVisibility();
  }

  navigateStep(direction) {
    const newStep = this.currentStep + direction;
    if (newStep >= 0 && newStep < this.totalSteps) {
      this.currentStep = newStep;
      this.updateStepVisibility();
    }
  }

  updateStepVisibility() {
    const steps = this.$$(".step");
    const prevButton = this.$(".nav-button.prev");
    const nextButton = this.$(".nav-button.next");
    const progressBar = this.$(".progress");
    const currentStepElement = this.$(".current-step");

    steps.forEach((step, index) => {
      if (index === this.currentStep) {
        step.classList.add("active");
      } else {
        step.classList.remove("active");
      }
    });

    prevButton.disabled = this.currentStep === 0;
    nextButton.disabled = this.currentStep === this.totalSteps - 1;
    nextButton.textContent =
      this.currentStep === this.totalSteps - 1 ? "Finish" : "Next";

    // Update progress bar and step counter
    progressBar.style.width = `${
      (this.currentStep / (this.totalSteps - 1)) * 100
    }%`;
    currentStepElement.textContent = this.currentStep + 1;
  }

  async handleCopy(e) {
    const code = e.target.dataset.code;
    try {
      await navigator.clipboard.writeText(code);

      // Visual feedback
      const originalText = e.target.textContent;
      e.target.textContent = "Copied!";
      e.target.classList.add("copied");

      setTimeout(() => {
        e.target.textContent = originalText;
        e.target.classList.remove("copied");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }
}
