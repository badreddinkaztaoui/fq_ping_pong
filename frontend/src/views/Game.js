import { View } from '../core/View';
import '../styles/game.css';

export class GameView extends View {
  constructor() {
    super();
    this.canvas = null;
    this.ctx = null;
    this.tableSkin = 'default';
    this.paddleSkin = 'default';
    this.skins = {
      table: ['default', 'neon', 'retro'],
      paddle: ['default', 'fire', 'ice']
    };
  }

  async render() {
    const template = document.createElement('div');
    template.className = 'game-container';
    template.innerHTML = `
      <div class="game-main">
        <canvas id="pongCanvas"></canvas>
        <div class="game-overlay">
          <div class="score">0 - 0</div>
          <div class="timer">00:00</div>
        </div>
      </div>
      <div class="game-sidebar">
        <div class="chat-box">
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
            ${this.skins.table.map(skin => `<option value="${skin}">${skin}</option>`).join('')}
        </select>
        </div>
        <div class="custom-select">
        <select id="paddleSkin">
            ${this.skins.paddle.map(skin => `<option value="${skin}">${skin}</option>`).join('')}
        </select>
        </div>
    </div>
    `;
    return template;
  }

  async setupEventListeners() {
    this.canvas = this.$('#pongCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    
    this.addListener(window, 'resize', this.resizeCanvas.bind(this));
    this.addListener(this.$('#tableSkin'), 'change', this.updateSkin.bind(this, 'table'));
    this.addListener(this.$('#paddleSkin'), 'change', this.updateSkin.bind(this, 'paddle'));
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.drawGame();
  }

  drawGame() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw table
    this.ctx.fillStyle = this.tableSkin === 'neon' ? '#00ff00' : 
                         this.tableSkin === 'retro' ? '#8B4513' : '#1a2634';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw net
    this.ctx.setLineDash([5, 15]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.stroke();
    
    // Draw paddles
    this.ctx.fillStyle = this.paddleSkin === 'fire' ? '#ff4655' :
                         this.paddleSkin === 'ice' ? '#00ffff' : '#ffffff';
    this.ctx.fillRect(10, this.canvas.height / 2 - 40, 10, 80); // Left paddle
    this.ctx.fillRect(this.canvas.width - 20, this.canvas.height / 2 - 40, 10, 80); // Right paddle
    
    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
  }

  updateSkin(type, event) {
    if (type === 'table') {
      this.tableSkin = event.target.value;
    } else if (type === 'paddle') {
      this.paddleSkin = event.target.value;
    }
    this.drawGame();
  }

  async afterMount() {
    this.drawGame();
  }
}