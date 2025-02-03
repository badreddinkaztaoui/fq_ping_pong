// FlapyBirdGame.js
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
    this.gameOver = false;
    this.hasStarted = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem("flappyHighScore")) || 0;
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
    this.jumpSound = null;
    this.scoreSound = null;
    this.hitSound = null;
    this.buttonSound = null;

    // Load audio
    this.loadAudio();

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
    this.hasStarted = true;
    this.isPlaying = true;
    this.gameOver = false;
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
  }

  handleGameOver() {
    this.isPlaying = false;
    this.gameOver = true;

    // Stop generating pipes
    if (this.pipeGenerationInterval) {
      clearInterval(this.pipeGenerationInterval);
      this.pipeGenerationInterval = null;
    }

    if (this.hitSound) {
      this.playSound(this.hitSound);
    }
  }

  handleClick() {
    if (!this.hasStarted || this.gameOver) {
      this.startGame();
    } else if (this.isPlaying) {
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

    if (!this.hasStarted) {
      // Draw start screen
      this.context.save();
      this.context.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.context.fillRect(0, 0, this.boardWidth, this.boardHeight);

      this.context.font = "bold 48px 'Press Start 2P', cursive";
      this.context.fillStyle = "#00FF00";
      this.context.strokeStyle = "#FFFFFF";
      this.context.lineWidth = 2;
      this.context.textAlign = "center";
      this.context.textBaseline = "middle";

      const x = this.boardWidth / 2;
      const y = this.boardHeight / 2 - 50;

      this.context.shadowColor = "#00FF00";
      this.context.shadowBlur = 15;
      this.context.fillText("START", x, y);
      this.context.strokeText("START", x, y);

      this.context.font = "18px 'Press Start 2P', cursive";
      this.context.fillStyle = "#FFFFFF";
      this.context.shadowBlur = 5;
      this.context.fillText("Press Space to Play", x, y + 50);

      this.context.restore();
      return;
    }

    if (this.gameOver) {
      // Draw game over screen
      this.context.save();
      this.context.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.context.fillRect(0, 0, this.boardWidth, this.boardHeight);

      this.context.font = "bold 48px 'Press Start 2P', cursive";
      this.context.fillStyle = "#FF0000";
      this.context.strokeStyle = "#FFFFFF";
      this.context.lineWidth = 2;
      this.context.textAlign = "center";
      this.context.textBaseline = "middle";

      const x = this.boardWidth / 2;
      const y = this.boardHeight / 2 - 50;

      this.context.shadowColor = "#FF0000";
      this.context.shadowBlur = 15;
      this.context.fillText("GAME OVER", x, y);
      this.context.strokeText("GAME OVER", x, y);

      this.context.font = "24px 'Press Start 2P', cursive";
      this.context.fillStyle = "#FFFFFF";
      this.context.shadowBlur = 5;
      this.context.fillText(`Score: ${this.score}`, x, y + 50);

      this.context.font = "18px 'Press Start 2P', cursive";
      this.context.fillStyle = "#FFFF00";
      this.context.fillText("Press Space to Restart", x, y + 100);

      this.context.restore();
      return;
    }

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
      this.handleGameOver();
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
        this.handleGameOver();
        return;
      }
    }

    // Remove off-screen pipes
    this.pipeArray = this.pipeArray.filter((pipe) => pipe.x > -this.pipeWidth);
  }

  async loadAudio() {
    const audioFiles = {
      jump: "/images/game/flappy-bird/sounds/flap.wav",
      score: "/images/game/flappy-bird/sounds/point.wav",
      hit: "/images/game/flappy-bird/sounds/hit.wav",
      button: "/images/game/flappy-bird/sounds/swooshing.wav",
    };

    try {
      this.jumpSound = await this.createAudio(audioFiles.jump);
      this.scoreSound = await this.createAudio(audioFiles.score);
      this.hitSound = await this.createAudio(audioFiles.hit);
      this.buttonSound = await this.createAudio(audioFiles.button);
    } catch (error) {
      console.warn("Failed to load audio files:", error);
    }
  }

  createAudio(src) {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio();
        audio.addEventListener("canplaythrough", () => resolve(audio), {
          once: true,
        });
        audio.addEventListener(
          "error",
          () => reject(new Error(`Failed to load audio: ${src}`)),
          { once: true }
        );
        audio.src = src;
      } catch (error) {
        reject(error);
      }
    });
  }

  playSound(sound) {
    if (!sound) return;
    try {
      sound.currentTime = 0;
      const playPromise = sound.play();
      if (playPromise) {
        playPromise.catch((error) => {
          console.warn("Sound playback failed:", error);
        });
      }
    } catch (error) {
      console.warn("Sound playback failed:", error);
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
      if (!this.hasStarted || this.gameOver) {
        this.startGame();
      } else if (this.isPlaying) {
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
      <div class="game-layout-bird">
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
        </div>

        <div class="game-container neon-border">
          <canvas id="board"></canvas>
        </div>

        <div class="controls-info neon-box">
          <div class="controls-grid modern">
            <div class="control-item">
              <div class="key-modern">
                <span class="key-cap">Space</span>
                <div class="key-light"></div>
              </div>
            </div>
            <div class="control-item">
              <div class="key-modern">
                <span class="key-cap">↑</span>
                <div class="key-light"></div>
              </div>
            </div>
            <div class="control-item">
              <div class="key-modern">
                <span class="key-cap">X</span>
                <div class="key-light"></div>
              </div>
            </div>
          </div>
          <div class="control-label">JUMP / START</div>
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
