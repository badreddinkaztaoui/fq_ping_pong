import { View } from "../core/View";
import "../styles/game.css";

export class GameView extends View {
  constructor() {
    super();
    this.canvas = null;
    this.ctx = null;
    this.tableSkin = "default";
    this.paddleSkin = "default";
    this.skins = {
      table: ["default", "neon", "retro"],
      paddle: ["default", "fire", "ice"],
    };
    this.backgroundImages = {};
    this.paddleTextures = {};
    this.ballTextures = {};
    this.loadBackgroundImages();
    this.loadGameTextures();
  }

  loadBackgroundImages() {
    const imageUrls = {
      default: "/images/game/default.jpg",
      neon: "/images/game/neon.jpg",
      retro: "/images/game/retro.jpg",
    };

    Object.entries(imageUrls).forEach(([skin, url]) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.backgroundImages[skin] = img;
        if (skin === this.tableSkin) {
          this.drawGame();
        }
      };
      img.onerror = () => {
        console.error(`Failed to load background image for ${skin} skin`);
      };
    });
  }

  loadGameTextures() {
    const paddleUrls = {
      fire: "/images/game/paddle-fire.jpg",
      ice: "/images/game/paddle-ice.jpg",
    };

    const ballUrls = {
      fire: "/images/game/ball-fire.png",
      ice: "/images/game/ball-ice.png",
      default: "/images/game/ball-fire.png",
    };

    Object.entries(paddleUrls).forEach(([skin, url]) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.paddleTextures[skin] = img;
        if (skin === this.paddleSkin) {
          this.drawGame();
        }
      };
      img.onerror = () => {
        console.error(`Failed to load paddle texture for ${skin} skin`);
      };
    });

    Object.entries(ballUrls).forEach(([skin, url]) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.ballTextures[skin] = img;
        if (skin === this.paddleSkin) {
          this.drawGame();
        }
      };
      img.onerror = () => {
        console.error(`Failed to load ball texture for ${skin} skin`);
      };
    });
  }

  async render() {
    const template = document.createElement("div");
    template.className = "game-container";
    template.innerHTML = `
      <div class="game-main">
        <canvas id="pongCanvas"></canvas>
        <div class="game-overlay">
          <div class="score">0 - 0</div>
          <div class="timer">00:00</div>
        </div>
      </div>
      <div class="game-sidebar">
        <div class="chat-box-game">
          <div class="chat-messages"></div>
          <input type="text" class="chat-input" placeholder="Type a message...">
        </div>
        <div class="game-history">
          <h3>Match History</h3>
          <ul class="history-list"></ul>
        </div>
      </div>
      <div class="game-controls">
        <div class="custom-select">
          <select id="tableSkin">
            ${this.skins.table
              .map((skin) => `<option value="${skin}">${skin}</option>`)
              .join("")}
          </select>
        </div>
        <div class="custom-select">
          <select id="paddleSkin">
            ${this.skins.paddle
              .map((skin) => `<option value="${skin}">${skin}</option>`)
              .join("")}
          </select>
        </div>
      </div>
    `;
    return template;
  }

  async setupEventListeners() {
    this.canvas = this.$("#pongCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.resizeCanvas();

    this.addListener(window, "resize", this.resizeCanvas.bind(this));
    this.addListener(
      this.$("#tableSkin"),
      "change",
      this.updateSkin.bind(this, "table")
    );
    this.addListener(
      this.$("#paddleSkin"),
      "change",
      this.updateSkin.bind(this, "paddle")
    );
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.drawGame();
  }

  drawGame() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background image if available
    const backgroundImage = this.backgroundImages[this.tableSkin];
    if (backgroundImage) {
      this.ctx.drawImage(
        backgroundImage,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    } else {
      this.ctx.fillStyle =
        this.tableSkin === "neon"
          ? "#00ff00"
          : this.tableSkin === "retro"
          ? "#8B4513"
          : "#1a2634";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw net
    this.ctx.setLineDash([5, 15]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.stroke();

    // Draw paddles with textures or colors
    if (this.paddleTextures[this.paddleSkin]) {
      // Left paddle with texture
      this.ctx.drawImage(
        this.paddleTextures[this.paddleSkin],
        10,
        this.canvas.height / 2 - 40,
        10,
        80
      );
      // Right paddle with texture
      this.ctx.drawImage(
        this.paddleTextures[this.paddleSkin],
        this.canvas.width - 20,
        this.canvas.height / 2 - 40,
        10,
        80
      );
    } else {
      // Fallback to colored paddles
      this.ctx.fillStyle =
        this.paddleSkin === "fire"
          ? "#ff4655"
          : this.paddleSkin === "ice"
          ? "#00ffff"
          : "#ffffff";
      this.ctx.fillRect(10, this.canvas.height / 2 - 40, 10, 80); // Left paddle
      this.ctx.fillRect(
        this.canvas.width - 20,
        this.canvas.height / 2 - 40,
        10,
        80
      ); // Right paddle
    }

    // Draw ball with texture or color
    const ballTexture =
      this.ballTextures[this.paddleSkin] || this.ballTextures["default"];
    if (ballTexture) {
      this.ctx.drawImage(
        ballTexture,
        this.canvas.width / 2 - 10,
        this.canvas.height / 2 - 10,
        20,
        20
      );
    } else {
      this.ctx.beginPath();
      this.ctx.arc(
        this.canvas.width / 2,
        this.canvas.height / 2,
        10,
        0,
        Math.PI * 2
      );
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fill();
    }
  }

  updateSkin(type, event) {
    if (type === "table") {
      this.tableSkin = event.target.value;
    } else if (type === "paddle") {
      this.paddleSkin = event.target.value;
    }
    this.drawGame();
  }

  async afterMount() {
    this.drawGame();
  }
}
