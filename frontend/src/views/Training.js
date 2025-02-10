// Training.js
import { View } from "../core/View";
import "../styles/dashboard/games/training.css";

const CONSTANTS = {
  FPS: 60,
  FRAME_TIME: 1000 / 60,
  PADDLE_HEIGHT: 80,
  PADDLE_WIDTH: 10,
  BALL_RADIUS: 10,
  MAX_ANGLE: Math.PI / 3,
  AI_UPDATE_INTERVAL: 16.67,
};

export class TrainingView extends View {
  constructor() {
    super();
    // Core game properties
    this.canvas = null;
    this.ctx = null;
    this.lastFrameTime = 0;
    this.deltaTime = 0;

    // Game state
    this.ballSpeed = 5;
    this.ballAngle = Math.PI / 4;
    this.ballX = 0;
    this.ballY = 0;
    this.ballVelocityX = 0;
    this.ballVelocityY = 0;
    this.paddleY = 0;
    this.aiPaddleY = 0;
    this.difficulty = "medium";
    this.trainingMode = "reaction";

    // Score tracking
    this.score = 0;
    this.consecutiveHits = 0;
    this.totalHits = 0;
    this.totalAttempts = 0;

    // Game control
    this.animationId = null;
    this.isGameActive = false;
    this.startTime = null;
    this.sessionTime = 0;
    this.isBootMode = true;

    // Input handling
    this.keys = new Set();
    this.mouseY = 0;
    this.inputMethod = "keyboard";

    // Bind methods
    this.gameLoop = this.gameLoop.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  createBootElement() {
    const bootContainer = document.createElement("div");
    bootContainer.className = "trainer-boot";

    const content = document.createElement("div");
    content.className = "trainer-boot-content";

    // Header with stats
    const header = document.createElement("div");
    header.className = "trainer-boot-header";
    header.innerHTML = `
      <div class="trainer-boot-stats">
        <div class="trainer-boot-stat">Score: ${this.score}</div>
        <div class="trainer-boot-stat">Streak: ${this.consecutiveHits}</div>
      </div>
    `;

    // Settings section
    const settings = document.createElement("div");
    settings.className = "trainer-boot-settings";
    settings.innerHTML = `
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
    `;

    // Actions section
    const actions = document.createElement("div");
    actions.className = "trainer-boot-actions";
    actions.innerHTML = `
      <button id="bootStart" class="trainer-boot-button">Start Training</button>
    `;

    content.appendChild(header);
    content.appendChild(settings);
    content.appendChild(actions);
    bootContainer.appendChild(content);

    return bootContainer;
  }

  createTrainingElement() {
    const container = document.createElement("div");
    container.className = "pong-trainer";

    // Main game area
    const main = document.createElement("div");
    main.className = "trainer-main";

    const canvas = document.createElement("canvas");
    canvas.id = "trainerCanvas";

    const overlay = document.createElement("div");
    overlay.className = "trainer-overlay";
    overlay.innerHTML = `
      <div class="trainer-score">Score: ${this.score}</div>
      <div class="trainer-streak">Streak: ${this.consecutiveHits}</div>
    `;

    main.appendChild(canvas);
    main.appendChild(overlay);

    // Sidebar
    const sidebar = document.createElement("div");
    sidebar.className = "trainer-sidebar";
    sidebar.innerHTML = `
      <div class="trainer-stats">
        <h3>Training Stats</h3>
        <div class="trainer-stat-row">Score: <span id="currentScore">${
          this.score
        }</span></div>
        <div class="trainer-stat-row">Current Streak: <span id="currentStreak">${
          this.consecutiveHits
        }</span></div>
        <div class="trainer-stat-row">Best Streak: <span id="bestStreak">${
          this.consecutiveHits
        }</span></div>
        <div class="trainer-stat-row">Hit Rate: <span id="hitRate">${this.calculateHitRate()}%</span></div>
        <div class="trainer-stat-row">Session Time: <span id="sessionTime">00:00</span></div>
      </div>
      
      <div class="trainer-controls">
        <h3>Training Settings</h3>
        <div class="trainer-control-group">
          <label>Ball Speed</label>
          <div class="trainer-control-wrapper">
            <input type="range" id="trainerBallSpeed" min="1" max="10" value="${
              this.ballSpeed
            }">
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
    `;

    container.appendChild(main);
    container.appendChild(sidebar);

    return container;
  }

  async render() {
    const element = this.isBootMode
      ? this.createBootElement()
      : this.createTrainingElement();
    return element;
  }

  resetTraining() {
    this.score = 0;
    this.consecutiveHits = 0;
    this.totalHits = 0;
    this.totalAttempts = 0;
    this.sessionTime = 0;
    this.isGameActive = false;

    const startButton = this.$("#trainerStart");
    const sessionTime = this.$("#sessionTime");

    if (startButton) startButton.textContent = "Start Training";
    if (sessionTime) sessionTime.textContent = "00:00";

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.resetBall();
    this.updateStats();
  }

  resetBall() {
    if (!this.canvas) return;

    this.ballX = this.canvas.width / 2;
    this.ballY = this.canvas.height / 2;

    // Randomize direction
    const angle =
      (Math.random() * Math.PI) / 2 -
      Math.PI / 4 +
      (Math.random() < 0.5 ? 0 : Math.PI);
    this.ballAngle = angle;

    this.updateBallVelocity();
  }

  updateBallVelocity() {
    const speed = this.ballSpeed * (1 + this.consecutiveHits * 0.02);
    this.ballVelocityX = Math.cos(this.ballAngle) * speed;
    this.ballVelocityY = Math.sin(this.ballAngle) * speed;
  }

  calculateHitRate() {
    if (this.totalAttempts === 0) return "0.0";
    return ((this.totalHits / this.totalAttempts) * 100).toFixed(1);
  }

  // Game loop and animation methods
  startTraining() {
    if (!this.isGameActive) {
      this.isGameActive = true;
      const startButton = this.$("#trainerStart");
      if (startButton) {
        startButton.textContent = "Pause Training";
      }
      this.startTime = performance.now() - this.sessionTime;
      this.lastFrameTime = performance.now();
      this.updateTimer();
      this.gameLoop();
    } else {
      this.isGameActive = false;
      const startButton = this.$("#trainerStart");
      if (startButton) {
        startButton.textContent = "Start Training";
      }
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
  }

  gameLoop(timestamp) {
    if (!this.isGameActive) return;

    // Calculate delta time
    this.deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Update game state
    this.update();
    this.render();

    // Request next frame
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  update() {
    const deltaFactor = this.deltaTime / CONSTANTS.FRAME_TIME;

    // Update ball position
    this.ballX += this.ballVelocityX * deltaFactor;
    this.ballY += this.ballVelocityY * deltaFactor;

    // Update paddle positions
    this.updatePlayerPaddle();
    this.updateAI();

    // Handle collisions
    this.handleCollisions();
  }

  updatePlayerPaddle() {
    const moveAmount = 10 * (this.deltaTime / CONSTANTS.FRAME_TIME);

    if (this.inputMethod === "keyboard") {
      if (this.keys.has("ArrowUp")) {
        this.paddleY = Math.max(
          CONSTANTS.PADDLE_HEIGHT / 2,
          this.paddleY - moveAmount
        );
      }
      if (this.keys.has("ArrowDown")) {
        this.paddleY = Math.min(
          this.canvas.height - CONSTANTS.PADDLE_HEIGHT / 2,
          this.paddleY + moveAmount
        );
      }
    } else {
      // Smooth mouse movement
      this.paddleY += (this.mouseY - this.paddleY) * 0.15;
      this.paddleY = Math.max(
        CONSTANTS.PADDLE_HEIGHT / 2,
        Math.min(this.canvas.height - CONSTANTS.PADDLE_HEIGHT / 2, this.paddleY)
      );
    }
  }

  updateAI() {
    if (!this.canvas) return;

    const difficultyFactors = {
      easy: 0.6,
      medium: 0.8,
      hard: 0.95,
    };

    // Predict ball position
    const factor = difficultyFactors[this.difficulty];
    const prediction = this.predictBallPath();
    const targetY = prediction.y;

    // Add human-like movement and reaction time
    const diff = targetY - this.aiPaddleY;
    const maxSpeed = 10 * (this.deltaTime / CONSTANTS.FRAME_TIME);
    const randomFactor = 1 + (Math.random() * 0.2 - 0.1);

    this.aiPaddleY +=
      Math.sign(diff) *
      Math.min(Math.abs(diff), maxSpeed * factor * randomFactor);

    // Clamp AI paddle position
    this.aiPaddleY = Math.max(
      CONSTANTS.PADDLE_HEIGHT / 2,
      Math.min(this.canvas.height - CONSTANTS.PADDLE_HEIGHT / 2, this.aiPaddleY)
    );
  }

  predictBallPath() {
    let simX = this.ballX;
    let simY = this.ballY;
    let simVX = this.ballVelocityX;
    let simVY = this.ballVelocityY;

    while (simX < this.canvas.width - CONSTANTS.PADDLE_WIDTH * 2) {
      simX += simVX;
      simY += simVY;

      if (
        simY <= CONSTANTS.BALL_RADIUS ||
        simY >= this.canvas.height - CONSTANTS.BALL_RADIUS
      ) {
        simVY = -simVY;
      }
    }

    return { x: simX, y: simY };
  }

  handleCollisions() {
    // Wall collisions
    if (
      this.ballY <= CONSTANTS.BALL_RADIUS ||
      this.ballY >= this.canvas.height - CONSTANTS.BALL_RADIUS
    ) {
      this.ballVelocityY = -this.ballVelocityY;
      this.ballY =
        this.ballY <= CONSTANTS.BALL_RADIUS
          ? CONSTANTS.BALL_RADIUS
          : this.canvas.height - CONSTANTS.BALL_RADIUS;
    }

    // Paddle collisions
    this.checkPaddleCollisions();

    // Scoring
    if (this.ballX <= 0 || this.ballX >= this.canvas.width) {
      this.handleMiss();
    }
  }

  checkPaddleCollisions() {
    // Player paddle collision
    if (
      this.ballX <= CONSTANTS.PADDLE_WIDTH * 2 &&
      this.ballX >= CONSTANTS.PADDLE_WIDTH &&
      this.ballY >= this.paddleY - CONSTANTS.PADDLE_HEIGHT / 2 &&
      this.ballY <= this.paddleY + CONSTANTS.PADDLE_HEIGHT / 2
    ) {
      this.handlePaddleHit("player");
    }

    // AI paddle collision
    if (
      this.ballX >= this.canvas.width - CONSTANTS.PADDLE_WIDTH * 2 &&
      this.ballX <= this.canvas.width - CONSTANTS.PADDLE_WIDTH &&
      this.ballY >= this.aiPaddleY - CONSTANTS.PADDLE_HEIGHT / 2 &&
      this.ballY <= this.aiPaddleY + CONSTANTS.PADDLE_HEIGHT / 2
    ) {
      this.handlePaddleHit("ai");
    }
  }

  handlePaddleHit(paddle) {
    // Calculate relative impact point (-1 to 1)
    const relativeIntersectY =
      paddle === "player"
        ? (this.paddleY - this.ballY) / (CONSTANTS.PADDLE_HEIGHT / 2)
        : (this.aiPaddleY - this.ballY) / (CONSTANTS.PADDLE_HEIGHT / 2);

    // Calculate new angle based on impact point
    const bounceAngle = relativeIntersectY * CONSTANTS.MAX_ANGLE;

    // Update velocities with increased speed
    const speed = this.ballSpeed * (1 + this.consecutiveHits * 0.02);
    this.ballVelocityX =
      paddle === "player"
        ? Math.abs(speed * Math.cos(bounceAngle))
        : -Math.abs(speed * Math.cos(bounceAngle));
    this.ballVelocityY = -speed * Math.sin(bounceAngle);

    // Update game state
    this.consecutiveHits++;
    this.totalHits++;
    this.score += this.calculateScore();

    // Handle endurance mode
    if (this.trainingMode === "endurance") {
      this.ballSpeed = Math.min(this.ballSpeed + 0.1, 10);
      const speedInput = this.$("#trainerBallSpeed");
      const speedValue = this.$(".trainer-value");
      if (speedInput) speedInput.value = this.ballSpeed;
      if (speedValue) speedValue.textContent = this.ballSpeed.toFixed(1);
    }

    // Update UI with animation
    this.updateStats();
    const scoreElement = this.$(".trainer-score");
    if (scoreElement) {
      scoreElement.classList.add("highlight");
      setTimeout(() => scoreElement.classList.remove("highlight"), 500);
    }
  }

  handleMiss() {
    this.consecutiveHits = 0;
    this.totalAttempts++;
    this.updateStats();
    this.resetBall();
  }

  calculateScore() {
    const baseScore = 10;
    const multipliers = {
      easy: 1,
      medium: 1.5,
      hard: 2.5,
    };

    return Math.floor(
      baseScore *
        multipliers[this.difficulty] *
        (1 + this.consecutiveHits * 0.15)
    );
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas with background
    this.ctx.fillStyle = "#1a2634";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw center line
    this.ctx.setLineDash([5, 15]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw paddles
    this.ctx.fillStyle = "#ffffff";

    // Player paddle
    this.ctx.fillRect(
      CONSTANTS.PADDLE_WIDTH,
      this.paddleY - CONSTANTS.PADDLE_HEIGHT / 2,
      CONSTANTS.PADDLE_WIDTH,
      CONSTANTS.PADDLE_HEIGHT
    );

    // AI paddle
    this.ctx.fillRect(
      this.canvas.width - CONSTANTS.PADDLE_WIDTH * 2,
      this.aiPaddleY - CONSTANTS.PADDLE_HEIGHT / 2,
      CONSTANTS.PADDLE_WIDTH,
      CONSTANTS.PADDLE_HEIGHT
    );

    // Draw ball with anti-aliasing
    this.ctx.beginPath();
    this.ctx.arc(
      Math.round(this.ballX),
      Math.round(this.ballY),
      CONSTANTS.BALL_RADIUS,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  updateTimer() {
    if (!this.isGameActive) return;

    this.sessionTime = performance.now() - this.startTime;
    const minutes = Math.floor(this.sessionTime / 60000);
    const seconds = Math.floor((this.sessionTime % 60000) / 1000);

    const timeDisplay = this.$("#sessionTime");
    if (timeDisplay) {
      timeDisplay.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    setTimeout(() => this.updateTimer(), 1000);
  }

  updateStats() {
    const elements = {
      currentScore: this.$("#currentScore"),
      currentStreak: this.$("#currentStreak"),
      bestStreak: this.$("#bestStreak"),
      hitRate: this.$("#hitRate"),
      scoreOverlay: this.$(".trainer-score"),
      streakOverlay: this.$(".trainer-streak"),
    };

    if (elements.currentScore) elements.currentScore.textContent = this.score;
    if (elements.currentStreak)
      elements.currentStreak.textContent = this.consecutiveHits;
    if (elements.bestStreak) {
      const currentBest = parseInt(elements.bestStreak.textContent) || 0;
      elements.bestStreak.textContent = Math.max(
        this.consecutiveHits,
        currentBest
      );
    }
    if (elements.hitRate)
      elements.hitRate.textContent = `${this.calculateHitRate()}%`;
    if (elements.scoreOverlay)
      elements.scoreOverlay.textContent = `Score: ${this.score}`;
    if (elements.streakOverlay)
      elements.streakOverlay.textContent = `Streak: ${this.consecutiveHits}`;
  }

  updateTips() {
    const tips = {
      reaction:
        "Focus on quick paddle movements. Watch the ball's trajectory and anticipate its path. Try to maintain a steady position and make small, precise adjustments.",
      precision:
        "Practice hitting the ball with different parts of the paddle to control direction. The closer to the edge, the sharper the angle. Master both defensive and offensive positioning.",
      endurance:
        "Focus on consistency and energy conservation. The game gets progressively faster, so maintain a rhythm and stay focused. Take breaks between sessions to prevent fatigue.",
    };

    const tipsElement = this.$("#trainerTips");
    if (tipsElement) {
      tipsElement.textContent = tips[this.trainingMode] || "";
    }
  }

  resizeCanvas() {
    if (!this.canvas) return;

    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    this.paddleY = this.canvas.height / 2;
    this.aiPaddleY = this.canvas.height / 2;
    this.resetBall();
  }

  async beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.isGameActive = false;

    // Clean up event listeners
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    }
  }

  async afterMount() {
    if (!this.isBootMode) {
      this.canvas = this.$("#trainerCanvas");
      if (this.canvas) {
        this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.paddleY = this.canvas.height / 2;
        this.aiPaddleY = this.canvas.height / 2;
        this.resetBall();
        this.updateTips();
        this.resizeCanvas();
      }
    }
  }
}
