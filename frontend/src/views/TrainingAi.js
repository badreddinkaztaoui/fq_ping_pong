// Training.js
import { View } from "../core/View";
import "../styles/dashboard/games/trainingAi.css";

export class TrainingAiView extends View {
  constructor() {
    super();
    // Core game elements
    this.canvas = null;
    this.ctx = null;
    // Game state
    this.isGameActive = false;
    this.isPaused = false;
    this.score = 0;
    this.aiScore = 0;
    this.totalHits = 0;
    this.sessionTime = 0;
    this.startTime = null;
    this.animationId = null;
    this.gameMode = "classic";
    this.ghostBalls = [];

    // Game settings
    this.ballSpeed = 20;
    this.ballAngle = Math.PI / 4;
    this.ballX = 0;
    this.ballY = 0;
    this.ballVelocityY = 0;
    this.paddleY = 0;
    this.aiPaddleY = 0;
    this.difficulty = "medium";
    this.aiMode = "reactive";
    this.paddleHeight = 80;

    // AI settings

    this.aiMemory = [];
    this.aiMaxMemory = 100;

    // Match settings
    this.maxScore = 11;
    this.matchPoint = false;
    this.gameOver = false;

    this.aiSkillLevels = {
      easy: {
        reactionSpeed: 0.02,
        predictionError: 0.2,
        learningRate: 0.005,
      },
      medium: {
        reactionSpeed: 0.04,
        predictionError: 0.1,
        learningRate: 0.01,
      },
      hard: {
        reactionSpeed: 0.08,
        predictionError: 0.05,
        learningRate: 0.02,
      },
      expert: {
        reactionSpeed: 0.12,
        predictionError: 0.02,
        learningRate: 0.03,
      },
    };

    // Enhanced game modes
    this.modes = {
      classic: {
        name: "Classic",
        description:
          "Classic Pong gameplay. Score points by getting the ball past the AI paddle.",
        init: () => {
          this.ballSpeed = 5;
          this.paddleHeight = 80;
        },
        updateBall: () => {
          return { speedMultiplier: 1, angleModifier: 0 };
        },
      },
      matrix: {
        name: "Matrix",
        description:
          "The ball splits into multiple ghost balls with unique behaviors!",
        init: () => {
          this.ballSpeed = 5;
          this.paddleHeight = 90;
          this.ghostBalls = [];
          // Create 3 ghost balls with different behaviors
          for (let i = 0; i < 3; i++) {
            this.ghostBalls.push({
              x: this.ballX,
              y: this.ballY,
              speed: this.ballSpeed * (0.8 + Math.random() * 0.4),
              angle: this.ballAngle + (Math.random() * 0.4 - 0.2),
              color: `hsl(${Math.random() * 360}, 70%, 70%)`,
              size: 8 + Math.random() * 4,
              active: true,
              pulsePhase: Math.random() * Math.PI * 2,
            });
          }
        },
        updateBall: () => {
          // Fixed typo here
          // Update ghost balls with unique behaviors
          if (this.ghostBalls && this.ghostBalls.length > 0) {
            this.ghostBalls.forEach((ghost, index) => {
              if (ghost.active) {
                ghost.x += Math.cos(ghost.angle) * ghost.speed;
                ghost.y +=
                  Math.sin(ghost.angle) * ghost.speed +
                  Math.sin(Date.now() / 1000 + index) * 0.5;

                if (
                  ghost.y <= ghost.size ||
                  ghost.y >= this.canvas.height - ghost.size
                ) {
                  ghost.angle = -ghost.angle;
                  ghost.y =
                    ghost.y <= ghost.size
                      ? ghost.size
                      : this.canvas.height - ghost.size;
                }
                ghost.pulsePhase += 0.1;
              }
            });
          }
          return { speedMultiplier: 1, angleModifier: 0 };
        },
        drawExtra: (ctx) => {
          // Draw ghost balls with enhanced effects
          if (this.ghostBalls) {
            this.ghostBalls.forEach((ghost) => {
              if (ghost.active) {
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                // Pulsing size effect
                const pulseSize = ghost.size + Math.sin(ghost.pulsePhase) * 2;
                ctx.arc(ghost.x, ghost.y, pulseSize, 0, Math.PI * 2);
                ctx.fillStyle = ghost.color;
                ctx.fill();

                // Add glow effect
                ctx.shadowBlur = 15;
                ctx.shadowColor = ghost.color;
                ctx.fill();
                ctx.shadowBlur = 0;
              }
            });
            ctx.globalAlpha = 1.0;
          }
        },
      },
    };

    // Enhanced AI behaviors
    this.aiBehaviors = {
      reactive: {
        name: "Reactive",
        description: "AI reacts to ball position in real-time",
        update: (skillLevel) => {
          // Predict ball trajectory
          const ballVelocityX = Math.cos(this.ballAngle) * this.ballSpeed;
          const ballVelocityY = Math.sin(this.ballAngle) * this.ballSpeed;

          // Calculate time to reach AI paddle
          const distanceToAI = this.canvas.width - 20 - this.ballX;
          const timeToReach = distanceToAI / Math.abs(ballVelocityX);

          // Predict ball Y position
          const predictedY = this.ballY + ballVelocityY * timeToReach;

          // Add some randomization based on difficulty
          const randomError =
            (Math.random() - 0.5) * (1 - skillLevel.reactionSpeed) * 100;
          const targetY = predictedY + randomError;

          // Move paddle with improved acceleration
          const diff = targetY - this.aiPaddleY;
          const acceleration =
            Math.min(Math.abs(diff) * 0.1, 1.0) * skillLevel.reactionSpeed;
          this.aiPaddleY += diff * acceleration;

          // Add initial positioning improvement
          if (Math.abs(this.ballX - this.canvas.width / 2) < 50) {
            this.aiPaddleY = this.canvas.height / 2; // Return to center when ball is in middle
          }
        },
      },
      predictive: {
        name: "Predictive",
        description: "AI predicts ball trajectory and moves accordingly",
        update: (skillLevel) => {
          if (!this.canvas) return;

          // Calculate time to intercept with improved accuracy
          const ballVelocityX = Math.cos(this.ballAngle) * this.ballSpeed;
          const timeToIntercept =
            (this.canvas.width - 20 - this.ballX) / Math.abs(ballVelocityX);

          // Predict future position with bounce consideration
          let predictedY =
            this.ballY +
            Math.sin(this.ballAngle) * this.ballSpeed * timeToIntercept;
          const bounces = Math.floor(predictedY / this.canvas.height);
          if (bounces % 2 === 1) {
            predictedY = this.canvas.height - (predictedY % this.canvas.height);
          } else {
            predictedY = predictedY % this.canvas.height;
          }

          // Add intentional prediction error based on difficulty
          const maxError = this.canvas.height * skillLevel.predictionError;
          predictedY += (Math.random() - 0.5) * maxError;

          // Improved movement with acceleration
          const diff = predictedY - this.aiPaddleY;
          const acceleration =
            Math.min(Math.abs(diff) * 0.1, 1.0) * skillLevel.reactionSpeed;
          this.aiPaddleY += diff * acceleration;
        },
      },
      adaptive: {
        name: "Adaptive",
        description: "AI learns and adapts to player patterns",
        update: (skillLevel) => {
          // Store recent player positions
          if (this.ballX < this.canvas.width / 2) {
            this.aiMemory.push({
              ballY: this.ballY,
              paddleY: this.paddleY,
              timestamp: Date.now(),
            });

            if (this.aiMemory.length > 50) this.aiMemory.shift();
          }

          // Find similar situations
          const recentPositions = this.aiMemory.slice(-10);
          if (recentPositions.length > 0) {
            const avgY =
              recentPositions.reduce((sum, pos) => sum + pos.paddleY, 0) /
              recentPositions.length;
            const diff = avgY - this.aiPaddleY;
            this.aiPaddleY += diff * skillLevel.reactionSpeed * 1.2;
          } else {
            // Fallback to reactive behavior
            this.aiBehaviors.reactive.update(skillLevel);
          }
        },
      },
    };

    // Bind methods
    this.gameLoop = this.gameLoop.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.updateTimer = this.updateTimer.bind(this);
    this.startGame = this.startGame.bind(this);
    this.resetGame = this.resetGame.bind(this);
    this.handleModeSelect = this.handleModeSelect.bind(this);
  }

  getModeDescription() {
    return (
      this.modes[this.gameMode]?.description || this.modes.classic.description
    );
  }

  async render() {
    const template = document.createElement("div");
    template.className = "pong-game";
    template.innerHTML = `
      <div class="game-container">
        <canvas id="gameCanvas"></canvas>
        
        <div class="game-overlay">
          <div class="game-header">
            <div class="player-score">${this.score}</div>
            <div class="game-timer">${this.formatTime(this.sessionTime)}</div>
            <div class="ai-score">${this.aiScore}</div>
          </div>
          
          ${
            this.matchPoint ? '<div class="match-point">Match Point!</div>' : ""
          }
          ${this.isPaused ? '<div class="pause-overlay">Paused</div>' : ""}
        </div>
      </div>

      <div class="game-sidebar">
        <div class="game-menu-section">
          <h2>PONG AI</h2>
          <div class="menu-modes">
            ${Object.entries(this.modes)
              .map(
                ([key, mode]) => `
              <button class="menu-btn ${this.gameMode === key ? "active" : ""}" 
                      data-mode="${key}">
                ${mode.name}
              </button>
            `
              )
              .join("")}
          </div>
          
          <div class="menu-actions">
            <button id="startGame" class="primary-btn">
              ${this.isGameActive ? "Resume Game" : "Start Game"}
            </button>
          </div>

          <div class="setting-group">
            <label>Game Mode Description</label>
            <div class="mode-description">
              ${this.getModeDescription()}
            </div>
          </div>
        </div>

        <div class="setting-group">
          <label>AI Difficulty</label>
          <select id="difficulty">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label>AI Behavior</label>
          <select id="aiMode">
            <option value="reactive">Reactive</option>
            <option value="predictive">Predictive</option>
            <option value="adaptive">Adaptive</option>
          </select>
        </div>

        <div class="setting-group">
          <label>Points to Win: ${this.maxScore}</label>
          <input type="range" id="maxScore" min="3" max="21" step="2" value="${
            this.maxScore
          }">
        </div>
          <div class="stats-section-ping">
            <h3>Game Stats</h3>
            <div class="stats-container">
              <div class="scores">
                <div class="stat-box">
                  <span>Me</span>
                  <span id="playerScore">${this.score}</span>
                </div>
                <span class="vs">VS</span>
                <div class="stat-box">
                  <span>AI</span>
                  <span id="aiScore">${this.aiScore}</span>
                </div>
              </div>
              <div class="stat-box session-time">
                <span>Session Time</span>
                <span id="sessionTime">00:00</span>
              </div>
            </div>
          </div>
        </div>
        `;
    return template;
  }

  async setupEventListeners() {
    // Menu controls
    const modeButtons = this.element.querySelectorAll("[data-mode]");
    modeButtons.forEach((button) => {
      this.addListener(button, "click", this.handleModeSelect);
    });

    this.addListener(
      this.element.querySelector("#startGame"),
      "click",
      this.startGame
    );

    // Game controls
    this.addListener(window, "keydown", this.handleKeyDown);
    this.addListener(window, "resize", this.resizeCanvas.bind(this));

    // Initialize canvas
    this.canvas = this.element.querySelector("#gameCanvas");
    if (this.canvas) {
      this.ctx = this.canvas.getContext("2d");
      this.resizeCanvas();
    }

    // Settings inputs
    const difficultySelect = this.element.querySelector("#difficulty");
    if (difficultySelect) {
      this.addListener(difficultySelect, "change", (e) => {
        this.difficulty = e.target.value;
        this.resetGame();
      });
    }

    const aiModeSelect = this.element.querySelector("#aiMode");
    if (aiModeSelect) {
      this.addListener(aiModeSelect, "change", (e) => {
        this.aiMode = e.target.value;
      });
    }

    const maxScoreInput = this.element.querySelector("#maxScore");
    if (maxScoreInput) {
      this.addListener(maxScoreInput, "input", (e) => {
        this.maxScore = parseInt(e.target.value);
        const label = maxScoreInput.previousElementSibling;
        if (label) {
          label.textContent = `Points to Win: ${this.maxScore}`;
        }
      });
    }
  }

  startGame() {
    if (!this.isGameActive) {
      const startButton = this.element.querySelector("#startGame");
      if (startButton) {
        startButton.textContent = "Pause Game";
        this.isGameActive = true;
      }

      // Initialize the current game mode
      const currentMode = this.modes[this.gameMode];
      if (currentMode && currentMode.init) {
        currentMode.init();
      }

      this.startTime = Date.now() - this.sessionTime;
      this.updateTimer();
      this.gameLoop();
    } else {
      this.isGameActive = false;
      const startButton = this.element.querySelector("#startGame");
      if (startButton) {
        startButton.textContent = "Resume Game";
      }
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
  }

  resetGame() {
    this.score = 0;
    this.aiScore = 0;
    this.totalHits = 0;
    this.sessionTime = 0;
    this.matchPoint = false;
    this.updateStats();
    this.isGameActive = false;

    const startButton = this.element.querySelector("#startGame");
    if (startButton) {
      startButton.textContent = "Start Game";
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.resetBall();
    this.drawGame();
  }

  handleModeSelect(event) {
    const mode = event.target.dataset.mode;
    if (mode) {
      // Remove active class from all buttons
      const buttons = this.element.querySelectorAll("[data-mode]");
      buttons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to selected button
      event.target.classList.add("active");

      this.gameMode = mode;

      // Initialize the new mode
      const currentMode = this.modes[mode];
      if (currentMode && currentMode.init) {
        currentMode.init();
      }

      this.resetGame();

      // Update mode description with animation
      const descriptionElement =
        this.element.querySelector(".mode-description");
      if (descriptionElement) {
        descriptionElement.style.opacity = "0";
        setTimeout(() => {
          descriptionElement.textContent = this.getModeDescription();
          descriptionElement.style.opacity = "1";
        }, 200);
      }
    }
  }

  updateTimer() {
    if (!this.isGameActive) return;

    this.sessionTime = Date.now() - this.startTime;
    const timerElement = this.element.querySelector(".game-timer");
    const sessionTimeElement = this.element.querySelector("#sessionTime");

    if (timerElement) {
      timerElement.textContent = this.formatTime(this.sessionTime);
    }
    if (sessionTimeElement) {
      sessionTimeElement.textContent = this.formatTime(this.sessionTime);
    }

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(this.updateTimer);
  }

  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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

    // Reset mode-specific properties
    if (this.gameMode === "matrix") {
      this.ghostBalls = [];
      for (let i = 0; i < 3; i++) {
        this.ghostBalls.push({
          x: this.ballX,
          y: this.ballY,
          angle: this.ballAngle + ((Math.random() - 0.5) * Math.PI) / 4,
        });
      }
    }
  }

  drawGame() {
    if (!this.ctx || !this.canvas) return;

    // Clear and draw background
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
    this.ctx.fillRect(
      10,
      this.paddleY - this.paddleHeight / 2,
      10,
      this.paddleHeight
    );
    this.ctx.fillRect(
      this.canvas.width - 20,
      this.aiPaddleY - this.paddleHeight / 2,
      10,
      this.paddleHeight
    );

    // Draw main ball
    if (this.isGameActive) {
      this.ctx.beginPath();
      this.ctx.arc(this.ballX, this.ballY, 10, 0, Math.PI * 2);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fill();

      // Draw mode-specific effects
      const currentMode = this.modes[this.gameMode];
      if (currentMode && currentMode.drawExtra) {
        currentMode.drawExtra(this.ctx);
      }
    }
  }

  gameLoop() {
    if (!this.isGameActive) return;

    this.updateBall();
    this.updateAI();
    this.drawGame();
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  updateBall() {
    const currentMode = this.modes[this.gameMode];
    if (!currentMode) return;

    const { speedMultiplier = 1, angleModifier = 0 } = currentMode.updateBall();

    // Update ball position
    this.ballX += Math.cos(this.ballAngle) * this.ballSpeed * speedMultiplier;
    this.ballY += Math.sin(this.ballAngle) * this.ballSpeed * speedMultiplier;

    // Edge collision detection with proper bouncing
    const ballRadius = 10;
    if (
      this.ballY <= ballRadius ||
      this.ballY >= this.canvas.height - ballRadius
    ) {
      this.ballAngle = -this.ballAngle; // Reverse vertical direction
      // Keep ball within bounds
      this.ballY =
        this.ballY <= ballRadius ? ballRadius : this.canvas.height - ballRadius;
    }

    // Handle paddle collisions and scoring
    if (this.checkPaddleCollision()) {
      this.handlePaddleHit();
    }

    if (this.ballX <= 0 || this.ballX >= this.canvas.width) {
      if (this.ballX <= 0) this.aiScore++;
      else this.score++;

      this.updateStats();
      this.checkGameEnd();
      this.resetBall();
    }
  }

  checkPaddleCollision() {
    const leftPaddleHit =
      this.ballX <= 20 &&
      this.ballY >= this.paddleY - this.paddleHeight / 2 &&
      this.ballY <= this.paddleY + this.paddleHeight / 2;

    const rightPaddleHit =
      this.ballX >= this.canvas.width - 20 &&
      this.ballY >= this.aiPaddleY - this.paddleHeight / 2 &&
      this.ballY <= this.aiPaddleY + this.paddleHeight / 2;

    return leftPaddleHit || rightPaddleHit;
  }

  handlePaddleHit() {
    this.totalHits++;

    // Add varying angle based on where the ball hits the paddle
    let hitPosition;
    if (this.ballX <= 20) {
      hitPosition = (this.ballY - this.paddleY) / (this.paddleHeight / 2);
    } else {
      hitPosition = (this.ballY - this.aiPaddleY) / (this.paddleHeight / 2);
    }

    // Angle variation based on hit position (-1 to 1)
    const angleVariation = (hitPosition * Math.PI) / 4;
    this.ballAngle = Math.PI - this.ballAngle + angleVariation;
  }

  showGameOverPopup(winner) {
    const overlay = document.createElement("div");
    overlay.className = "game-over-overlay";

    const popup = document.createElement("div");
    popup.className = "game-over-popup";

    const content = `
    <h2 class="game-over-title">${winner} Wins!</h2>
    <div class="game-over-stats">
      <div class="stat-item-ping">
        <span>Final Score</span>
        <div class="score-display">
          <span>You: ${this.score}</span>
          <span>AI: ${this.aiScore}</span>
        </div>
      </div>
      <div class="stat-item-ping">
        <span>Total Hits</span>
        <span>${this.totalHits}</span>
      </div>
      <div class="stat-item-ping">
        <span>Game Time</span>
        <span>${this.formatTime(this.sessionTime)}</span>
      </div>
    </div>
    <div class="game-over-actions">
      <button class="primary-btn restart-btn">Play Again</button>
      <button class="secondary-btn menu-btn">Back to Menu</button>
    </div>
  `;

    popup.innerHTML = content;
    overlay.appendChild(popup);
    this.element.appendChild(overlay);

    // Add event listeners
    const restartBtn = popup.querySelector(".restart-btn");
    const menuBtn = popup.querySelector(".menu-btn");

    restartBtn.addEventListener("click", () => {
      this.element.removeChild(overlay);
      this.resetGame();
      this.startGame();
    });

    menuBtn.addEventListener("click", () => {
      this.element.removeChild(overlay);
      this.resetGame();
    });
  }

  checkGameEnd() {
    if (this.score >= this.maxScore || this.aiScore >= this.maxScore) {
      const winner = this.score > this.aiScore ? "Player" : "AI";
      this.showGameOverPopup(winner);
      this.isGameActive = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    } else if (
      this.score === this.maxScore - 1 ||
      this.aiScore === this.maxScore - 1
    ) {
      this.matchPoint = true;
    }
  }

  updateStats() {
    // Update scores
    const playerScoreElement = this.element.querySelector("#playerScore");
    const aiScoreElement = this.element.querySelector("#aiScore");
    const overlayPlayerScore = this.element.querySelector(".player-score");
    const overlayAiScore = this.element.querySelector(".ai-score");

    if (playerScoreElement) playerScoreElement.textContent = this.score;
    if (aiScoreElement) aiScoreElement.textContent = this.aiScore;
    if (overlayPlayerScore) overlayPlayerScore.textContent = this.score;
    if (overlayAiScore) overlayAiScore.textContent = this.aiScore;
  }

  updateAI() {
    const skillLevel = this.aiSkillLevels[this.difficulty];
    const behavior = this.aiBehaviors[this.aiMode];

    if (behavior && skillLevel) {
      behavior.update(skillLevel);
    }

    // Add natural movement variation
    this.aiPaddleY += Math.sin(Date.now() / 1000) * 0.5;

    // Ensure paddle stays within bounds
    if (this.canvas) {
      this.aiPaddleY = Math.max(
        this.paddleHeight / 2,
        Math.min(this.canvas.height - this.paddleHeight / 2, this.aiPaddleY)
      );
    }
  }

  handleKeyDown(event) {
    if (!this.isGameActive) return;

    switch (event.key) {
      case "ArrowUp":
        this.paddleY = Math.max(this.paddleHeight / 2, this.paddleY - 20);
        break;
      case "ArrowDown":
        this.paddleY = Math.min(
          this.canvas.height - this.paddleHeight / 2,
          this.paddleY + 20
        );
        break;
      case "Escape":
        this.startGame(); // Toggles pause
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
    if (this.canvas) {
      this.paddleY = this.canvas.height / 2;
      this.aiPaddleY = this.canvas.height / 2;
      this.resetBall();
      this.resizeCanvas();
    }
  }
}
