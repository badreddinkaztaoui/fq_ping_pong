import { View } from "../core/View";
import "../styles/dashboard/games/bird.css";

export class FlapyBirdGameView extends View {
  constructor() {
    super();
    this.container = null;
    this.board = null;
    this.context = null;
    this.boardWidth = 360;
    this.boardHeight = 640;

    // Game state
    this.isPlaying = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem("flappyHighScore")) || 0;
    this.soundEnabled = localStorage.getItem("flappySound") !== "false";
    this.pipeGenerationInterval = null;

    // Bird properties
    this.birdWidth = 34;
    this.birdHeight = 24;
    this.birdX = this.boardWidth / 8;
    this.birdY = this.boardHeight / 2;
    this.bird = {
      x: this.birdX,
      y: this.birdY,
      width: this.birdWidth,
      height: this.birdHeight,
    };

    // Pipe properties
    this.pipeArray = [];
    this.pipeWidth = 64;
    this.pipeHeight = 512;
    this.pipeX = this.boardWidth;
    this.pipeY = 0;

    // Physics
    this.velocityX = -2;
    this.velocityY = 0;
    this.gravity = 0.4;

    // Audio elements
    this.jumpSound = new Audio("/images/game/flappy-bird/sounds/swooshing.wav");
    this.scoreSound = new Audio("/images/game/flappy-bird/sounds/point.wav");
    this.hitSound = new Audio("/images/game/flappy-bird/sounds/hit.wav");
    this.buttonSound = new Audio("/images/game/flappy-bird/button.mp3");

    // Bind methods
    this.update = this.update.bind(this);
    this.moveBird = this.moveBird.bind(this);
    this.placePipes = this.placePipes.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  async loadAssets() {
    const assets = {
      bird: "/images/game/flappy-bird/flappybird.png",
      topPipe: "/images/game/flappy-bird/toppipe.png",
      bottomPipe: "/images/game/flappy-bird/bottompipe.png",
      background: "/images/game/flappy-bird/flappybirdbg.png",
    };

    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });
    };

    try {
      [this.birdImg, this.topPipeImg, this.bottomPipeImg, this.backgroundImg] =
        await Promise.all([
          loadImage(assets.bird),
          loadImage(assets.topPipe),
          loadImage(assets.bottomPipe),
          loadImage(assets.background),
        ]);
    } catch (error) {
      console.error("Failed to load game assets:", error);
    }
  }

  startGame() {
    this.isPlaying = true;
    this.bird.y = this.birdY;
    this.pipeArray = [];
    this.velocityY = 0;
    this.updateScore(0);
    this.playSound(this.buttonSound);

    // Clear existing interval if any
    if (this.pipeGenerationInterval) {
      clearInterval(this.pipeGenerationInterval);
    }

    // Start generating pipes
    this.pipeGenerationInterval = setInterval(this.placePipes, 1500);

    const overlay = this.container.querySelector(".game-overlay");
    if (overlay) {
      overlay.style.display = "none";
    }
  }

  gameOver() {
    this.isPlaying = false;
    this.playSound(this.hitSound);

    // Stop generating pipes
    if (this.pipeGenerationInterval) {
      clearInterval(this.pipeGenerationInterval);
      this.pipeGenerationInterval = null;
    }

    const overlay = this.container.querySelector(".game-overlay");
    if (overlay) {
      overlay.style.display = "flex";
    }
  }

  handleClick() {
    if (!this.isPlaying) {
      this.startGame();
    } else {
      this.velocityY = -6;
      this.playSound(this.jumpSound);
    }
  }

  update() {
    if (!this.context || !this.backgroundImg) return;
    requestAnimationFrame(this.update);

    // Clear and draw background
    this.context.clearRect(0, 0, this.board.width, this.board.height);
    this.context.drawImage(
      this.backgroundImg,
      0,
      0,
      this.board.width,
      this.board.height
    );

    if (!this.isPlaying) return;

    // Update bird
    this.velocityY += this.gravity;
    this.bird.y = Math.max(this.bird.y + this.velocityY, 0);

    if (this.birdImg) {
      this.context.drawImage(
        this.birdImg,
        this.bird.x,
        this.bird.y,
        this.bird.width,
        this.bird.height
      );
    }

    // Check collisions
    if (this.bird.y > this.board.height) {
      this.gameOver();
      return;
    }

    // Update pipes
    for (let pipe of this.pipeArray) {
      pipe.x += this.velocityX;
      if (pipe.img) {
        this.context.drawImage(
          pipe.img,
          pipe.x,
          pipe.y,
          pipe.width,
          pipe.height
        );
      }

      if (!pipe.passed && this.bird.x > pipe.x + pipe.width) {
        pipe.passed = true;
        this.updateScore(this.score + 0.5);
        this.playSound(this.scoreSound);
      }

      if (this.detectCollision(this.bird, pipe)) {
        this.gameOver();
        return;
      }
    }

    // Remove off-screen pipes
    this.pipeArray = this.pipeArray.filter((pipe) => pipe.x > -this.pipeWidth);
  }

  playSound(sound) {
    if (!this.soundEnabled) return;
    try {
      sound.currentTime = 0;
      sound.play();
    } catch (error) {
      console.warn("Sound playback failed:", error);
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem("flappySound", this.soundEnabled.toString());
    const soundButton = this.container.querySelector("#soundToggle");
    if (soundButton) {
      soundButton.innerHTML = this.soundEnabled ? "🔊" : "🔈";
      soundButton.classList.toggle("active", this.soundEnabled);
    }
  }

  updateScore(newScore) {
    this.score = newScore;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("flappyHighScore", this.highScore.toString());
    }
    const scoreDisplay = this.container.querySelector("#currentScore");
    const highScoreDisplay = this.container.querySelector("#highScore");
    if (scoreDisplay) scoreDisplay.textContent = this.formatNumber(this.score);
    if (highScoreDisplay)
      highScoreDisplay.textContent = this.formatNumber(this.highScore);
  }

  formatNumber(number) {
    return new Intl.NumberFormat().format(number);
  }

  moveBird(e) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
      e.preventDefault();
      if (!this.isPlaying) {
        this.startGame();
      } else {
        this.velocityY = -6;
        this.playSound(this.jumpSound);
      }
    }
  }

  placePipes() {
    if (!this.isPlaying) return;

    const randomPipeY =
      this.pipeY - this.pipeHeight / 4 - Math.random() * (this.pipeHeight / 2);
    const openingSpace = this.board.height / 4;

    this.pipeArray.push({
      img: this.topPipeImg,
      x: this.pipeX,
      y: randomPipeY,
      width: this.pipeWidth,
      height: this.pipeHeight,
      passed: false,
    });

    this.pipeArray.push({
      img: this.bottomPipeImg,
      x: this.pipeX,
      y: randomPipeY + this.pipeHeight + openingSpace,
      width: this.pipeWidth,
      height: this.pipeHeight,
      passed: false,
    });
  }

  detectCollision(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  render() {
    this.container = document.createElement("div");
    this.container.className = "flappy-bird-container neon-theme";

    this.container.innerHTML = `
      <div class="game-layout">
        <div class="stats-section neon-box">
          <div class="score-display">
            <div class="current-score">
              <span class="score-label">SCORE</span>
              <span id="currentScore" class="neon-text">${this.formatNumber(
                this.score
              )}</span>
            </div>
            <div class="high-score">
              <span class="score-label">HIGH SCORE</span>
              <span id="highScore" class="neon-text">${this.formatNumber(
                this.highScore
              )}</span>
            </div>
          </div>
          <button id="soundToggle" class="sound-toggle neon-button">
            ${this.soundEnabled ? "🔊" : "🔈"}
          </button>
        </div>

        <div class="game-container neon-border">
          <canvas id="board"></canvas>
          <div class="game-overlay">
            <div class="overlay-content neon-box">
              <h2 class="neon-text">${
                this.score > 0 ? "GAME OVER!" : "READY?"
              }</h2>
              <div class="instructions">
                <p>Press SPACE or ⬆️ to ${
                  this.score > 0 ? "play again" : "start"
                }</p>
              </div>
            </div>
          </div>
        </div>

        <div class="controls-info neon-box">
          <h3 class="neon-text">CONTROLS</h3>
          <div class="controls-grid">
            <div class="control-item">
              <span class="key">SPACE</span>
              <span class="action">Jump</span>
            </div>
            <div class="control-item">
              <span class="key">⬆️</span>
              <span class="action">Jump</span>
            </div>
            <div class="control-item">
              <span class="key">X</span>
              <span class="action">Jump</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupGame();
    return this.container;
  }

  async setupGame() {
    this.board = this.container.querySelector("#board");
    if (!this.board) return;

    this.board.width = this.boardWidth;
    this.board.height = this.boardHeight;
    this.context = this.board.getContext("2d");

    await this.loadAssets();
    this.setupEventListeners();
    requestAnimationFrame(this.update);
  }

  setupEventListeners() {
    document.addEventListener("keydown", this.moveBird);

    const soundToggle = this.container.querySelector("#soundToggle");
    if (soundToggle) {
      soundToggle.addEventListener("click", () => {
        this.playSound(this.buttonSound);
        this.toggleSound();
      });
    }

    if (this.board) {
      this.board.addEventListener("click", this.handleClick);
    }
  }

  destroy() {
    document.removeEventListener("keydown", this.moveBird);
    if (this.board) {
      this.board.removeEventListener("click", this.handleClick);
    }
    if (this.pipeGenerationInterval) {
      clearInterval(this.pipeGenerationInterval);
    }
    super.destroy();
  }
}
