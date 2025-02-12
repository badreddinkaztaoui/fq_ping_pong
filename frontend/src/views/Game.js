import { View } from '../core/View';
import { gameWsManager } from "../utils/GameWebSockets"
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
    this.gameState = {
      paddles: { p1_y: 50, p2_y: 50 },
      ball: { x: 50, y: 50 },
      score: { p1: 0, p2: 0 }
    };
    this.playerRole = null;
    this.isGameStarted = false;
    this.gameStatus = 'waiting';
    this.keys = { ArrowUp: false, ArrowDown: false };
    this.lastUpdateTime = 0;
    this.paddleSpeed = 5;
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.handleGameState = this.handleGameState.bind(this);
    this.handleConnectionStatus = this.handleConnectionStatus.bind(this);
  }

  resizeCanvas() {
    const containerWidth = this.canvas.offsetWidth;
    const containerHeight = this.canvas.offsetHeight;
  
    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;
  
    const aspectRatio = 16 / 9;
    let gameWidth = containerWidth;
    let gameHeight = containerHeight;
  
    if (containerWidth / containerHeight > aspectRatio) {
      gameWidth = gameHeight * aspectRatio;
    } else {
      gameHeight = gameWidth / aspectRatio;
    }
  
    const offsetX = (containerWidth - gameWidth) / 2;
    const offsetY = (containerHeight - gameHeight) / 2;
  
    this.gameArea = {
      width: gameWidth,
      height: gameHeight,
      offsetX: offsetX,
      offsetY: offsetY
    };
  
    this.drawGame();
  }

  async render() {
    const template = document.createElement('div');
    template.className = 'pong-container';
    template.innerHTML = `
      <div class="pong-main">
        <canvas id="pongCanvas"></canvas>
        <div class="pong-overlay">
          <div class="score">0 - 0</div>
          <div class="pong-status">
            <button id="startGame" class="start-button">Start Game</button>
            <div class="status-message"></div>
          </div>
        </div>
      </div>
      <div class="pong-sidebar">
        <div class="chat-box">
          <div class="chat-messages"></div>
          <input type="text" class="chat-input" placeholder="Type a message...">
        </div>
        <div class="pong-history">
          <h3>Match History</h3>
          <ul class="history-list"></ul>
        </div>
      </div>
      <div class="pong-controls">
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
    
    gameWsManager.onGameStateUpdate(this.handleGameState);
    gameWsManager.onStatusChange(this.handleConnectionStatus);
    gameWsManager.onGameEnd(this.handleGameEnd.bind(this));

    gameWsManager.onGameStateUpdate((state) => {
      this.handleGameState(state);
  });
  
    gameWsManager.onMatchFound((data) => {
        this.playerRole = data.role;
        this.setStatusMessage(`Match found! You are ${data.role === 'player_1' ? 'Player 1' : 'Player 2'}`);
        this.isGameStarted = true;
        console.log('Player role assigned:', this.playerRole);
    });
    
    gameWsManager.onScoreUpdate((score) => {
        this.gameState.score = score;
        this.updateScore();
    });

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    const startButton = this.$('#startGame');
    if (startButton) {
      startButton.addEventListener('click', this.startGame.bind(this));
    }

    const tableSkinSelect = this.$('#tableSkin');
    const paddleSkinSelect = this.$('#paddleSkin');
    
    if (tableSkinSelect) {
      tableSkinSelect.addEventListener('change', (e) => this.updateSkin('table', e));
    }
    if (paddleSkinSelect) {
      paddleSkinSelect.addEventListener('change', (e) => this.updateSkin('paddle', e));
    }

    window.addEventListener('resize', this.resizeCanvas.bind(this));
    
    requestAnimationFrame(this.gameLoop);
  }

  handleKeyDown(event) {
    if (this.keys.hasOwnProperty(event.code)) {
      event.preventDefault();
      this.keys[event.code] = true;
    }
  }

  handleKeyUp(event) {
    if (this.keys.hasOwnProperty(event.code)) {
      event.preventDefault();
      this.keys[event.code] = false;
    }
  }

  handleGameState(state) {
    const currentRole = this.getPlayerRole();
    if (currentRole) {
      const paddleKey = currentRole === 'player_1' ? 'p1_y' : 'p2_y';
      if (this.keys.ArrowUp || this.keys.ArrowDown) {
        state.paddles[paddleKey] = this.gameState.paddles[paddleKey];
      }
    }
    
    this.gameState = state;
    this.updateScore();
    this.drawGame();
  }

  handleConnectionStatus(status) {
    switch (status) {
      case 'connected':
        this.setStatusMessage('Connected to game server');
        break;
      case 'disconnected':
        this.setStatusMessage('Disconnected from server. Attempting to reconnect...');
        break;
      case 'connecting':
        this.setStatusMessage('Connecting to game server...');
        break;
      case 'error':
        this.setStatusMessage('Error connecting to game server');
        break;
    }
  }

  handleGameEnd(data) {
    this.isGameStarted = false;
    this.gameStatus = 'ended';
    
    const currentPlayer = this.getPlayerRole();
    const winner = data.winner;
    let resultMessage = '';
    
    if (winner) {
        if (winner === currentPlayer) {
            resultMessage = '🎉 Congratulations! You Won! 🎉';
        } else {
            resultMessage = 'Game Over - Better luck next time!';
        }
    } else {
        resultMessage = data.message || 'Game ended unexpectedly';
    }
    
    this.setStatusMessage(resultMessage);
    this.showStartButton();
}

  async startGame() {
    console.log('Starting game, current connection status:', gameWsManager.getConnectionStatus());
    if (gameWsManager.getConnectionStatus() !== 'connected') {
      console.log('Connecting to WebSocket server...');
      await gameWsManager.connect();
    }
    console.log('Connection established, current role:', this.getPlayerRole());
    
    this.isGameStarted = true;
    this.gameStatus = 'playing';
    this.setStatusMessage('Game in progress');
    
    const startButton = this.$('#startGame');
    if (startButton) {
      startButton.style.display = 'none';
    }
  }

  getPlayerRole() {
    if (this.playerRole) {
      return this.playerRole;
    }
    const wsRole = gameWsManager.getPlayerRole();
    if (wsRole) {
      this.playerRole = wsRole;
    }
    return this.playerRole;
  }

  setStatusMessage(message) {
    const statusElement = this.$('.status-message');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  showStartButton() {
    const startButton = this.$('#startGame');
    if (startButton) {
      startButton.style.display = 'block';
    }
  }

  drawGame() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = this.tableSkin === 'neon' ? '#00ff00' : 
                        this.tableSkin === 'retro' ? '#8B4513' : '#1a2634';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.setLineDash([5, 15]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.stroke();
    
    this.ctx.fillStyle = this.paddleSkin === 'fire' ? '#ff4655' :
                        this.paddleSkin === 'ice' ? '#00ffff' : '#ffffff';
    
    const leftPaddleY = (this.gameState.paddles.p1_y / 100) * this.canvas.height;
    this.ctx.fillRect(10, leftPaddleY - 40, 10, 80);
    
    const rightPaddleY = (this.gameState.paddles.p2_y / 100) * this.canvas.height;
    this.ctx.fillRect(this.canvas.width - 20, rightPaddleY - 40, 10, 80);
    
    if (this.isGameStarted) {
      const ballX = (this.gameState.ball.x / 100) * this.canvas.width;
      const ballY = (this.gameState.ball.y / 100) * this.canvas.height;
      this.ctx.beginPath();
      this.ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();
    }

    if (!this.isGameStarted) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  updateScore() {
    const scoreElement = this.$('.score');
    if (scoreElement) {
      scoreElement.textContent = `${this.gameState.score.p1} - ${this.gameState.score.p2}`;
    }
  }

  updateTime() {
    const timeElement = this.$('.timer');
    if (timeElement) {
      const minutes = new Date().getMinutes();
      const seconds = new Date().getSeconds();
      timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }

  updateSkin(type, event) {
    if (type === 'table') {
      this.tableSkin = event.target.value;
    } else if (type === 'paddle') {
      this.paddleSkin = event.target.value;
    }
  }

  gameLoop(timestamp) {
    if (!this.lastUpdateTime) this.lastUpdateTime = timestamp;
    const deltaTime = timestamp - this.lastUpdateTime;
    
    const currentRole = this.getPlayerRole();
    
    if (this.isGameStarted && deltaTime >= 16 && currentRole) {
      this.lastUpdateTime = timestamp;
      
      if (currentRole === 'player_1' || currentRole === 'player_2') {
        const paddleKey = currentRole === 'player_1' ? 'p1_y' : 'p2_y';
        let paddleY = this.gameState.paddles[paddleKey];
        
        if (this.keys.ArrowUp) {
          paddleY = Math.max(0, paddleY - this.paddleSpeed);
        }
        if (this.keys.ArrowDown) {
          paddleY = Math.min(100, paddleY + this.paddleSpeed);
        }
        
        if (paddleY !== this.gameState.paddles[paddleKey]) {
          gameWsManager.sendPlayerMove(paddleY);
        }
      }
    }
    
    this.drawGame();
    requestAnimationFrame(this.gameLoop);
  }

  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
    gameWsManager.disconnect();
  }

  async afterMount() {
    this.drawGame();
  }
}