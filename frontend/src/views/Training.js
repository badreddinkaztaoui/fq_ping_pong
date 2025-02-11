// Training.js
import { View } from "../core/View";
import "../styles/dashboard/games/training.css";

export class TrainingView extends View {
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

    // Game settings
    this.ballSpeed = 5;
    this.ballAngle = Math.PI / 4;
    this.ballX = 0;
    this.ballY = 0;
    this.paddleY = 0;
    this.aiPaddleY = 0;
    this.difficulty = "medium";
    this.aiMode = "reactive";
    this.paddleHeight = 80;

    // AI settings
    this.aiPredictionError = 0.1;
    this.aiReactionDelay = 0;
    this.aiLearningRate = 0.01;
    this.aiMemory = [];
    this.aiMaxMemory = 100;

    // Match settings
    this.maxScore = 11;
    this.matchPoint = false;
    this.gameOver = false;

    // Bind methods
    this.gameLoop = this.gameLoop.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.updateTimer = this.updateTimer.bind(this);
    this.startGame = this.startGame.bind(this);
    this.resetGame = this.resetGame.bind(this);
    this.handleModeSelect = this.handleModeSelect.bind(this);
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
            <button class="menu-btn ${
              this.gameMode === "classic" ? "active" : ""
            }" data-mode="classic">
              Classic
            </button>
            <button class="menu-btn ${
              this.gameMode === "speed" ? "active" : ""
            }" data-mode="speed">
              Speed
            </button>
            <button class="menu-btn ${
              this.gameMode === "zigzag" ? "active" : ""
            }" data-mode="zigzag">
              Zigzag
            </button>
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
          <label>Ball Speed: ${this.ballSpeed}</label>
          <input type="range" id="ballSpeed" min="3" max="15" value="${
            this.ballSpeed
          }">
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

  getModeDescription() {
    const descriptions = {
      classic:
        "Classic Pong gameplay. Score points by getting the ball past the AI paddle.",
      speed: "Ball speed increases with each hit. Test your reflexes!",
      zigzag: "Ball follows an unpredictable zigzag pattern. Can you keep up?",
    };
    return descriptions[this.gameMode] || descriptions.classic;
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

    const ballSpeedInput = this.element.querySelector("#ballSpeed");
    if (ballSpeedInput) {
      this.addListener(ballSpeedInput, "input", (e) => {
        this.ballSpeed = parseInt(e.target.value);
        const label = ballSpeedInput.previousElementSibling;
        if (label) {
          label.textContent = `Ball Speed: ${this.ballSpeed}`;
        }
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
    console.log("enter the function ", this.isGameActive);
    if (!this.isGameActive) {
      const startButton = this.element.querySelector("#startGame");
      if (startButton) {
        startButton.textContent = "Pause Game";
        this.isGameActive = true;

        console.log("active game", this.isGameActive);
      }
      this.startTime = Date.now() - this.sessionTime;
      this.updateTimer();

      this.gameLoop();
    } else {
      this.isGameActive = false;

      console.log("else game", this.isGameActive);
      const startButton = this.element.querySelector("#startGame");
      if (startButton) {
        startButton.textContent = "Resume Game";
      }
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
    //  if start the game hide the menu and show the game
    const menu = this.element.querySelector(".game-menu");
    if (menu) {
      menu.classList.add("menu-minimized");
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
      this.gameMode = mode;
      this.resetGame();

      // Update mode description
      const descriptionElement =
        this.element.querySelector(".mode-description");
      if (descriptionElement) {
        descriptionElement.textContent = this.getModeDescription();
      }
    }
  }

  updateTimer() {
    if (!this.isGameActive) return;

    this.sessionTime = Date.now() - this.startTime;
    const timerElement = this.element.querySelector(".game-timer");
    if (timerElement) {
      timerElement.textContent = this.formatTime(this.sessionTime);
    }

    setTimeout(this.updateTimer, 1000);
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
  }

  drawGame() {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
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
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  updateBall() {
    let speedMultiplier = 1;

    // Apply mode-specific modifications
    switch (this.gameMode) {
      case "speed":
        speedMultiplier = 1 + this.totalHits * 0.1;
        break;
      // case "zigzag":
      //   this.ballAngle += Math.sin(this.ballX / 50) * 0.1;
      //   break;
    }

    this.ballX += Math.cos(this.ballAngle) * this.ballSpeed * speedMultiplier;
    this.ballY += Math.sin(this.ballAngle) * this.ballSpeed * speedMultiplier;

    // Ball collision with top and bottom walls
    if (this.ballY <= 0 || this.ballY >= this.canvas.height) {
      this.ballAngle = -this.ballAngle;
      this.ballY = this.ballY <= 0 ? 0 : this.canvas.height;
    }

    // Check paddle collisions
    if (this.checkPaddleCollision()) {
      this.handlePaddleHit();
    }

    // Ball out of bounds - scoring
    if (this.ballX <= 0) {
      this.aiScore++;
      this.updateStats();
      this.checkGameEnd();
      this.resetBall();
    } else if (this.ballX >= this.canvas.width) {
      this.score++;
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

  checkGameEnd() {
    if (this.score >= this.maxScore || this.aiScore >= this.maxScore) {
      const winner = this.score > this.aiScore ? "Player" : "AI";
      alert(
        `Game Over! ${winner} wins with ${
          winner === "Player" ? this.score : this.aiScore
        } points!`
      );
      this.resetGame();
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
    switch (this.aiMode) {
      case "predictive":
        this.updatePredictiveAI();
        break;
      case "adaptive":
        this.updateAdaptiveAI();
        break;
      default:
        this.updateReactiveAI();
    }
  }

  updateReactiveAI() {
    const difficultyFactor = {
      easy: 0.02,
      medium: 0.04,
      hard: 0.08,
      expert: 0.12,
    }[this.difficulty];

    const targetY = this.ballY;
    const diff = targetY - this.aiPaddleY;
    this.aiPaddleY += diff * difficultyFactor;
  }

  updatePredictiveAI() {
    // Predict ball position at paddle x-position
    const timeToIntercept =
      (this.canvas.width - 20 - this.ballX) /
      (Math.cos(this.ballAngle) * this.ballSpeed);
    let predictedY =
      this.ballY + Math.sin(this.ballAngle) * this.ballSpeed * timeToIntercept;

    // Add intentional prediction error based on difficulty
    const maxError = this.canvas.height * this.aiPredictionError;
    predictedY += (Math.random() - 0.5) * maxError;

    // Move towards predicted position
    const diff = predictedY - this.aiPaddleY;
    this.aiPaddleY += diff * 0.1;
  }

  updateAdaptiveAI() {
    // Store player actions in memory
    if (this.ballX < this.canvas.width / 2) {
      this.aiMemory.push({
        ballY: this.ballY,
        paddleY: this.paddleY,
      });
      if (this.aiMemory.length > this.aiMaxMemory) {
        this.aiMemory.shift();
      }
    }

    // Use memory to predict player behavior
    const similarSituations = this.aiMemory.filter(
      (mem) => Math.abs(mem.ballY - this.ballY) < 50
    );

    if (similarSituations.length > 0) {
      const avgPaddleY =
        similarSituations.reduce((sum, mem) => sum + mem.paddleY, 0) /
        similarSituations.length;
      const diff = avgPaddleY - this.aiPaddleY;
      this.aiPaddleY += diff * this.aiLearningRate;
    } else {
      this.updateReactiveAI();
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
