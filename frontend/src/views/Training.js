// Training.js
import { View } from "../core/View";
import "../styles/dashboard/games/training.css";

export class TrainingView extends View {
  constructor() {
    super();
    this.canvas = null;
    this.ctx = null;
    this.ballSpeed = 5;
    this.ballAngle = Math.PI / 4;
    this.ballX = 0;
    this.ballY = 0;
    this.paddleY = 0;
    this.aiPaddleY = 0;
    this.difficulty = "medium";
    this.trainingMode = "reaction";
    this.score = 0;
    this.consecutiveHits = 0;
    this.totalHits = 0;
    this.totalAttempts = 0;
    this.animationId = null;
    this.isGameActive = false;
    this.startTime = null;
    this.sessionTime = 0;
    this.isBootMode = true;
  }

  async render() {
    const template = document.createElement("div");
    template.className = "pong-trainer";

    if (this.isBootMode) {
      template.innerHTML = this.renderBoot();
    } else {
      template.innerHTML = this.renderTraining();
    }

    return template;
  }

  renderBoot() {
    return `
      <div class="trainer-boot">
        <div class="trainer-boot-content">
          <div class="trainer-boot-header">
            <div class="trainer-boot-stats">
              <div class="trainer-boot-stat">Score: ${this.score}</div>
              <div class="trainer-boot-stat">Streak: ${this.consecutiveHits}</div>
            </div>
          </div>
          
          <div class="trainer-boot-settings">
            <div class="trainer-boot-group">
              <label>Training Mode</label>
              <select id="bootMode" class="trainer-boot-select">
                <option value="reaction">Reaction Training</option>
                <option value="precision">Precision Training</option>
                <option value="endurance">Endurance Training</option>
              </select>
            </div>

            <div class="trainer-boot-group">
              <label>Difficulty</label>
              <select id="bootDifficulty" class="trainer-boot-select">
                <option value="easy">Easy</option>
                <option value="medium" selected>Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div class="trainer-boot-group">
              <label>Ball Speed: <span id="bootSpeedValue">${this.ballSpeed}</span></label>
              <div class="trainer-boot-speed">
                <input type="range" id="bootSpeed" min="1" max="10" value="${this.ballSpeed}">
              </div>
            </div>
          </div>

          <div class="trainer-boot-actions">
            <button id="bootStart" class="trainer-boot-button">Start Training</button>
          </div>
        </div>
      </div>
    `;
  }

  renderTraining() {
    return `
      <div class="trainer-main">
        <canvas id="trainerCanvas"></canvas>
        <div class="trainer-overlay">
          <div class="trainer-score">Score: ${this.score}</div>
          <div class="trainer-streak">Streak: ${this.consecutiveHits}</div>
        </div>
      </div>
      <div class="trainer-sidebar">
        <div class="trainer-stats">
          <h3>Training Stats</h3>
          <div class="trainer-stat-row">Score: <span id="currentScore">0</span></div>
          <div class="trainer-stat-row">Current Streak: <span id="currentStreak">0</span></div>
          <div class="trainer-stat-row">Best Streak: <span id="bestStreak">0</span></div>
          <div class="trainer-stat-row">Hit Rate: <span id="hitRate">0%</span></div>
          <div class="trainer-stat-row">Session Time: <span id="sessionTime">00:00</span></div>
        </div>
        
        <div class="trainer-controls">
          <h3>Training Settings</h3>
          <div class="trainer-control-group">
            <label>Ball Speed</label>
            <div class="trainer-control-wrapper">
              <input type="range" id="trainerBallSpeed" min="1" max="10" value="${this.ballSpeed}">
              <span class="trainer-value">${this.ballSpeed}</span>
            </div>
          </div>
          
          <div class="trainer-control-group">
            <label>Training Mode</label>
            <select id="trainerMode">
              <option value="reaction">Reaction Training</option>
              <option value="precision">Precision Training</option>
              <option value="endurance">Endurance Training</option>
            </select>
          </div>
          
          <div class="trainer-control-group">
            <label>Difficulty</label>
            <select id="trainerDifficulty">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <div class="trainer-buttons">
            <button id="trainerStart" class="trainer-btn">Start Training</button>
            <button id="trainerReset" class="trainer-btn trainer-btn-secondary">Reset</button>
            <button id="backToBoot" class="trainer-btn trainer-btn-secondary">Back</button>
          </div>
        </div>

        <div class="trainer-tips">
          <h3>Training Tips</h3>
          <div id="trainerTips" class="trainer-tips-content"></div>
        </div>
      </div>
    `;
  }

  async setupEventListeners() {
    if (this.isBootMode) {
      this.setupBootListeners();
    } else {
      this.setupTrainingListeners();
    }
  }

  setupBootListeners() {
    this.addListener(this.$("#bootMode"), "change", (e) => {
      this.trainingMode = e.target.value;
    });

    this.addListener(this.$("#bootDifficulty"), "change", (e) => {
      this.difficulty = e.target.value;
    });

    this.addListener(this.$("#bootSpeed"), "input", (e) => {
      this.ballSpeed = parseInt(e.target.value);
      this.$("#bootSpeedValue").textContent = this.ballSpeed;
    });

    this.addListener(this.$("#bootStart"), "click", async () => {
      this.isBootMode = false;
      await this.remount();
      this.updateTips();
    });
  }

  setupTrainingListeners() {
    this.canvas = this.$("#trainerCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.addListener(
      this.$("#trainerBallSpeed"),
      "input",
      this.updateBallSpeed.bind(this)
    );
    this.addListener(
      this.$("#trainerMode"),
      "change",
      this.updateTrainingMode.bind(this)
    );
    this.addListener(
      this.$("#trainerDifficulty"),
      "change",
      this.updateDifficulty.bind(this)
    );
    this.addListener(
      this.$("#trainerStart"),
      "click",
      this.startTraining.bind(this)
    );
    this.addListener(
      this.$("#trainerReset"),
      "click",
      this.resetTraining.bind(this)
    );
    this.addListener(this.$("#backToBoot"), "click", async () => {
      this.isBootMode = true;
      this.resetTraining();
      await this.remount();
    });
    this.addListener(window, "keydown", this.handleKeyDown.bind(this));
    this.addListener(window, "resize", this.resizeCanvas.bind(this));

    // Set initial selections based on boot choices
    this.$("#trainerMode").value = this.trainingMode;
    this.$("#trainerDifficulty").value = this.difficulty;
    this.$("#trainerBallSpeed").value = this.ballSpeed;
    this.$(".trainer-value").textContent = this.ballSpeed;
  }

  async remount() {
    const parent = this.element.parentElement;
    await this.unmount();
    await this.mount(parent);
  }

  updateBallSpeed(event) {
    this.ballSpeed = parseInt(event.target.value);
    this.$(".trainer-value").textContent = this.ballSpeed;
  }

  updateTrainingMode(event) {
    this.trainingMode = event.target.value;
    this.resetTraining();
    this.updateTips();
  }

  updateDifficulty(event) {
    this.difficulty = event.target.value;
    this.resetTraining();
  }

  startTraining() {
    if (!this.isGameActive) {
      this.isGameActive = true;
      this.$("#trainerStart").textContent = "Pause Training";
      this.startTime = Date.now() - this.sessionTime;
      this.updateTimer();
      this.gameLoop();
    } else {
      this.isGameActive = false;
      this.$("#trainerStart").textContent = "Start Training";
      cancelAnimationFrame(this.animationId);
    }
  }

  updateTimer() {
    if (!this.isGameActive) return;

    this.sessionTime = Date.now() - this.startTime;
    const minutes = Math.floor(this.sessionTime / 60000);
    const seconds = Math.floor((this.sessionTime % 60000) / 1000);

    this.$("#sessionTime").textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    setTimeout(() => this.updateTimer(), 1000);
  }

  resetTraining() {
    this.score = 0;
    this.consecutiveHits = 0;
    this.totalHits = 0;
    this.totalAttempts = 0;
    this.sessionTime = 0;
    this.updateStats();
    this.isGameActive = false;
    this.$("#trainerStart").textContent = "Start Training";
    this.$("#sessionTime").textContent = "00:00";
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.resetBall();
    this.drawGame();
  }

  updateStats() {
    this.$("#currentScore").textContent = this.score;
    this.$("#currentStreak").textContent = this.consecutiveHits;
    const currentBest = parseInt(this.$("#bestStreak").textContent) || 0;
    this.$("#bestStreak").textContent = Math.max(
      this.consecutiveHits,
      currentBest
    );

    const hitRate =
      this.totalAttempts > 0
        ? ((this.totalHits / this.totalAttempts) * 100).toFixed(1)
        : "0";
    this.$("#hitRate").textContent = `${hitRate}%`;

    // Update overlay stats
    this.$(".trainer-score").textContent = `Score: ${this.score}`;
    this.$(".trainer-streak").textContent = `Streak: ${this.consecutiveHits}`;
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.drawGame();
  }

  resetBall() {
    if (!this.canvas) return;
    this.ballX = this.canvas.width / 2;
    this.ballY = this.canvas.height / 2;
    this.ballAngle = ((Math.random() - 0.5) * Math.PI) / 2;
  }

  drawGame() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background
    this.ctx.fillStyle = "#1a2634";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw center line
    this.ctx.setLineDash([5, 15]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.stroke();

    // Draw paddles
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(10, this.paddleY - 40, 10, 80); // Player paddle
    this.ctx.fillRect(this.canvas.width - 20, this.aiPaddleY - 40, 10, 80); // AI paddle

    // Draw ball if game is active
    if (this.isGameActive) {
      this.ctx.beginPath();
      this.ctx.arc(this.ballX, this.ballY, 10, 0, Math.PI * 2);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fill();
    }
  }

  gameLoop() {
    if (!this.isGameActive) return;

    this.updateBall();
    this.updateAI();
    this.drawGame();
    this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  updateBall() {
    this.ballX += Math.cos(this.ballAngle) * this.ballSpeed;
    this.ballY += Math.sin(this.ballAngle) * this.ballSpeed;

    if (this.ballY <= 0 || this.ballY >= this.canvas.height) {
      this.ballAngle = -this.ballAngle;
    }

    if (this.checkPaddleCollision()) {
      this.handlePaddleHit();
    }

    if (this.ballX <= 0 || this.ballX >= this.canvas.width) {
      this.handleMiss();
    }
  }

  checkPaddleCollision() {
    const leftPaddleHit =
      this.ballX <= 20 &&
      this.ballY >= this.paddleY - 40 &&
      this.ballY <= this.paddleY + 40;

    const rightPaddleHit =
      this.ballX >= this.canvas.width - 20 &&
      this.ballY >= this.aiPaddleY - 40 &&
      this.ballY <= this.aiPaddleY + 40;

    return leftPaddleHit || rightPaddleHit;
  }

  handlePaddleHit() {
    this.consecutiveHits++;
    this.totalHits++;
    this.totalAttempts++;
    this.score += this.calculateScore();
    this.updateStats();

    this.ballAngle = Math.PI - this.ballAngle + (Math.random() - 0.5) * 0.2;

    if (this.trainingMode === "endurance") {
      this.ballSpeed += 0.1;
    }
  }

  handleMiss() {
    this.consecutiveHits = 0;
    this.totalAttempts++;
    this.updateStats();
    this.resetBall();
  }

  calculateScore() {
    let baseScore = 10;
    const multipliers = {
      easy: 1,
      medium: 1.5,
      hard: 2,
    };
    return Math.floor(
      baseScore *
        multipliers[this.difficulty] *
        (1 + this.consecutiveHits * 0.1)
    );
  }

  updateAI() {
    const difficultyFactor = {
      easy: 0.02,
      medium: 0.04,
      hard: 0.08,
    }[this.difficulty];

    const targetY = this.ballY;
    const diff = targetY - this.aiPaddleY;
    this.aiPaddleY += diff * difficultyFactor;
  }

  updateTips() {
    const tips = {
      reaction:
        "Focus on quick paddle movements. Watch the ball's trajectory carefully.",
      precision:
        "Try to hit the ball with different parts of the paddle to control direction.",
      endurance:
        "Maintain steady rhythm and conserve energy. The game gets faster over time.",
    };
    this.$("#trainerTips").textContent = tips[this.trainingMode] || "";
  }

  handleKeyDown(event) {
    if (!this.isGameActive) return;

    switch (event.key) {
      case "ArrowUp":
        this.paddleY = Math.max(40, this.paddleY - 20);
        break;
      case "ArrowDown":
        this.paddleY = Math.min(this.canvas.height - 40, this.paddleY + 20);
        break;
    }
  }

  async beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.isGameActive = false;
  }

  async afterMount() {
    if (!this.isBootMode) {
      this.paddleY = this.canvas.height / 2;
      this.aiPaddleY = this.canvas.height / 2;
      this.resetBall();
      this.updateTips();
      this.resizeCanvas();
    }
  }
}
