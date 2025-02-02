import "../styles/dashboard/games/slote.css";
import { View } from "../core/View";

export class SlotMachineGameView extends View {
  constructor() {
    super();
    this.container = null;
    this.isSpinning = false;
    this.coins = parseInt(localStorage.getItem("slotCoins")) || 10000;
    this.betAmount = 100;
    this.minBet = 100;
    this.maxBet = this.coins;
    this.soundEnabled = localStorage.getItem("slotSound") !== "false";
    this.currentJackpot = 1000000;

    // Audio elements
    this.spinSound = new Audio("/assets/sounds/spin.mp3");
    this.winSound = new Audio("/assets/sounds/win.mp3");
    this.buttonSound = new Audio("/assets/sounds/button.mp3");
    this.jackpotSound = new Audio("/assets/sounds/jackpot.mp3");
    this.coinSound = new Audio("/assets/sounds/coin.mp3");

    // Enhanced reel configuration
    this.reels = [
      ["7️⃣", "💎", "⭐", "🎰", "🔔", "🍒", "🍊", "🍋"],
      ["💎", "⭐", "🎰", "🔔", "🍒", "7️⃣", "🍋", "🍊"],
      ["⭐", "🎰", "🔔", "🍒", "7️⃣", "💎", "🍊", "🍋"],
    ];

    // Updated pay table with better rewards
    this.payTable = {
      "7️⃣7️⃣7️⃣": 777,
      "💎💎💎": 500,
      "⭐⭐⭐": 300,
      "🎰🎰🎰": 1000,
      "🔔🔔🔔": 200,
      "🍒🍒🍒": 150,
      "🍊🍊🍊": 100,
      "🍋🍋🍋": 80,
    };

    // Animation settings
    this.spinSettings = {
      duration: 4000,
      symbolHeight: 100,
      blurAmount: "5px",
      easingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
      minSpins: 4,
      maxSpins: 8,
    };

    // Initialize auto-spin feature
    this.isAutoSpinning = false;
    this.autoSpinCount = 0;
    this.maxAutoSpins = 50;
  }

  playSound(sound) {
    if (!this.soundEnabled) return;
    // try {
    //   sound.currentTime = 0;
    //   sound.play();
    // } catch (error) {
    //   console.warn("Sound playback failed:", error);
    // }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem("slotSound", this.soundEnabled.toString());
    const soundButton = this.container.querySelector("#soundToggle");
    if (soundButton) {
      soundButton.innerHTML = this.soundEnabled ? "🔊" : "🔈";
      soundButton.classList.toggle("active", this.soundEnabled);
    }
  }

  updateCoins(newAmount) {
    const oldAmount = this.coins;
    this.coins = Math.max(0, newAmount);
    this.maxBet = this.coins;
    localStorage.setItem("slotCoins", this.coins.toString());

    // Animate coins change
    const coinsDisplay = this.container.querySelector("#coinsAmount");
    if (coinsDisplay) {
      this.animateNumberChange(coinsDisplay, oldAmount, this.coins);
    }

    this.updateBetControls();
  }

  animateNumberChange(element, start, end) {
    const duration = 1000;
    const steps = 20;
    const stepDuration = duration / steps;
    const increment = (end - start) / steps;
    let current = start;
    let step = 0;

    const animate = () => {
      current += increment;
      step++;
      element.textContent = this.formatNumber(Math.round(current));

      if (step < steps) {
        setTimeout(animate, stepDuration);
      } else {
        element.textContent = this.formatNumber(end);
      }
    };

    animate();
  }

  updateBetControls() {
    const elements = {
      decrease: this.container.querySelector('[data-action="decrease"]'),
      increase: this.container.querySelector('[data-action="increase"]'),
      betDisplay: this.container.querySelector("#betAmount"),
      spinButton: this.container.querySelector("#spinButton"),
      autoSpinButton: this.container.querySelector("#autoSpinButton"),
    };

    if (elements.decrease) {
      elements.decrease.disabled =
        this.betAmount <= this.minBet || this.isSpinning;
    }
    if (elements.increase) {
      elements.increase.disabled =
        this.betAmount >= this.coins || this.isSpinning;
    }
    if (elements.betDisplay) {
      elements.betDisplay.textContent = this.formatNumber(this.betAmount);
    }
    if (elements.spinButton) {
      elements.spinButton.disabled =
        this.isSpinning || this.coins < this.betAmount;
    }
    if (elements.autoSpinButton) {
      elements.autoSpinButton.disabled =
        this.isSpinning || this.coins < this.betAmount;
    }
  }

  formatNumber(number) {
    return new Intl.NumberFormat().format(number);
  }

  generateSecureRandomNumber(max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }

  async spin() {
    if (this.isSpinning || this.betAmount > this.coins) return;

    this.isSpinning = true;
    this.updateBetControls();
    this.playSound(this.spinSound);

    // Add spinning effects
    const reelElements = this.container.querySelectorAll(".reel");
    reelElements.forEach((reel) => {
      reel.style.filter = `blur(${this.spinSettings.blurAmount})`;
      reel.classList.add("spinning");
    });

    // Deduct bet and update UI
    this.updateCoins(this.coins - this.betAmount);
    this.resetWinLine();

    const results = [];
    const spinPromises = [];

    // Spin all reels simultaneously with slight delays
    reelElements.forEach((reel, index) => {
      const duration = this.spinSettings.duration + index * 500;
      spinPromises.push(this.spinReel(reel, index, results, duration));
    });

    // Wait for all reels to stop
    await Promise.all(spinPromises);

    // Clean up spinning effects
    reelElements.forEach((reel) => {
      reel.style.filter = "none";
      reel.classList.remove("spinning");
    });

    // Process results
    await this.processSpinResults(results);

    this.isSpinning = false;
    this.updateBetControls();

    // Continue auto-spin if active
    if (this.isAutoSpinning && this.autoSpinCount > 0) {
      this.autoSpinCount--;
      setTimeout(() => this.spin(), 1500);
    }
  }

  async processSpinResults(results) {
    const multiplier = this.checkWin(results);
    if (multiplier) {
      const winAmount = multiplier * this.betAmount;
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (winAmount >= this.betAmount * 10) {
        this.playSound(this.jackpotSound);
        this.showBigWinCelebration(winAmount);
      } else {
        this.playSound(this.winSound);
        this.showWinCelebration(winAmount);
      }

      this.updateCoins(this.coins + winAmount);
      this.highlightWinningSymbols(results);
    }
  }

  spinReel(reelElement, index, results, duration) {
    return new Promise((resolve) => {
      const symbolsContainer = reelElement.querySelector(".symbols-container");
      const result = this.getRandomSymbol(index);

      const spins =
        this.spinSettings.minSpins +
        Math.random() *
          (this.spinSettings.maxSpins - this.spinSettings.minSpins);
      const finalSymbolIndex = this.reels[index].indexOf(result);
      const totalRotation =
        (spins * this.reels[index].length + finalSymbolIndex) *
        this.spinSettings.symbolHeight;

      symbolsContainer.style.transition = `transform ${duration}ms ${this.spinSettings.easingFunction}`;
      symbolsContainer.style.transform = `translateY(-${totalRotation}px)`;

      setTimeout(() => {
        symbolsContainer.style.transition = "none";
        symbolsContainer.style.transform = `translateY(-${
          finalSymbolIndex * this.spinSettings.symbolHeight
        }px)`;
        results[index] = result;
        resolve();
      }, duration);
    });
  }

  getRandomSymbol(reelIndex) {
    return this.reels[reelIndex][
      this.generateSecureRandomNumber(this.reels[reelIndex].length)
    ];
  }

  checkWin(results) {
    if (results.length !== 3) return null;
    const combination = results.join("");
    return this.payTable[combination] || 0;
  }

  resetWinLine() {
    const winLine = this.container.querySelector(".win-line");
    if (winLine) {
      winLine.classList.remove("active");
    }
  }

  showWinCelebration(amount) {
    const overlay = this.container.querySelector("#win-overlay");
    const winAmount = this.container.querySelector("#winAmount");
    const winLine = this.container.querySelector(".win-line");

    if (winAmount) winAmount.textContent = this.formatNumber(amount);
    if (overlay) overlay.classList.add("show");
    if (winLine) winLine.classList.add("active");
  }

  showBigWinCelebration(amount) {
    const overlay = this.container.querySelector("#win-overlay");
    const content = overlay.querySelector(".celebration-content");

    content.classList.add("big-win");
    this.showWinCelebration(amount);
    this.createWinningParticles();
  }

  createWinningParticles() {
    const container = document.createElement("div");
    container.className = "particles-container";

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.setProperty("--delay", `${Math.random() * 2}s`);
      particle.style.setProperty("--x", `${Math.random() * 100}%`);
      container.appendChild(particle);
    }

    this.container.appendChild(container);
    setTimeout(() => container.remove(), 3000);
  }

  highlightWinningSymbols(results) {
    const symbolsContainers =
      this.container.querySelectorAll(".symbols-container");
    symbolsContainers.forEach((container, index) => {
      const symbol = results[index];
      const symbolElement = container.querySelector(
        `.symbol[data-symbol="${symbol}"]`
      );
      if (symbolElement) {
        symbolElement.classList.add("winning-symbol");
        setTimeout(
          () => symbolElement.classList.remove("winning-symbol"),
          3000
        );
      }
    });
  }

  startAutoSpin() {
    if (!this.isAutoSpinning && this.coins >= this.betAmount) {
      this.isAutoSpinning = true;
      this.autoSpinCount = 10; // Default to 10 auto-spins
      this.spin();
    }
  }

  stopAutoSpin() {
    this.isAutoSpinning = false;
    this.autoSpinCount = 0;
  }

  render() {
    this.container = document.createElement("div");
    this.container.className = "slot-machine-container neon-theme";

    this.container.innerHTML = `
      <div class="game-layout-slote">
        <div class="stats-section neon-box-slote">
          <div class="coins-display">
            <span class="coin-icon pulse">🪙</span>
            <span id="coinsAmount" class="neon-text">${this.formatNumber(
              this.coins
            )}</span>
          </div>
          <div class="mega-jackpot neon-box-slote pulse">
            <span class="jackpot-label">MEGA JACKPOT</span>
            <span class="jackpot-amount">${this.formatNumber(
              this.currentJackpot
            )}</span>
          </div>
          <button id="soundToggle" class="sound-toggle neon-button">
            ${this.soundEnabled ? "🔊" : "🔈"}
          </button>
        </div>

        <div class="slot-machine neon-border">
          <div class="reels-container">
            ${this.reels
              .map(
                (reel, index) => `
              <div class="reel" id="reel${index}">
                <div class="glow-overlay"></div>
                <div class="symbols-container">
                  ${[...reel, ...reel]
                    .map(
                      (symbol) => `
                    <div class="symbol neon-symbol" data-symbol="${symbol}">${symbol}</div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
              )
              .join("")}
            <div class="win-line"></div>
          </div>

          <div class="controls-section">
            <div class="bet-controls neon-box-slote">
              <button class="bet-adjust neon-button" data-action="decrease">-</button>
              <span id="betAmount" class="neon-text">${this.formatNumber(
                this.betAmount
              )}</span>
              <button class="bet-adjust neon-button" data-action="increase">+</button>
            </div>
            <div class="spin-buttons">
              <button id="spinButton" class="spin-button neon-button pulse">
                <span class="spin-text">SPIN</span>
                <span class="spin-amount">${this.formatNumber(
                  this.betAmount
                )}</span>
              </button>
              <button id="autoSpinButton" class="auto-spin-button neon-button">
                AUTO SPIN
              </button>
            </div>
          </div>
        </div>

        <div class="pay-table neon-box-slote">
          <h3 class="neon-text">PAY TABLE</h3>
          <div class="pay-table-grid">
            ${Object.entries(this.payTable)
              .map(
                ([combo, multiplier]) => `
              <div class="pay-combo">
                <span class="symbols">${combo}</span>
                <span class="multiplier neon-text">${multiplier}x</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="celebration-overlay" id="win-overlay">
        <div class="celebration-content neon-box-slote">
          <h2 class="neon-text">BIG WIN!</h2>
          <div class="win-amount neon-text">+<span id="winAmount">0</span></div>
          <button class="continue-button neon-button">CONTINUE</button>
        </div>
      </div>
    `;

    this.setupEventListeners();
    return this.container;
  }

  setupEventListeners() {
    if (!this.container) return;

    // Spin button
    const spinButton = this.container.querySelector("#spinButton");
    if (spinButton) {
      spinButton.addEventListener("click", () => {
        if (!this.isSpinning && this.betAmount <= this.coins) {
          this.playSound(this.buttonSound);
          this.spin();
        }
      });
    }

    // Auto-spin button
    const autoSpinButton = this.container.querySelector("#autoSpinButton");
    if (autoSpinButton) {
      autoSpinButton.addEventListener("click", () => {
        if (this.isAutoSpinning) {
          this.stopAutoSpin();
          autoSpinButton.classList.remove("active");
          autoSpinButton.textContent = "AUTO SPIN";
        } else {
          this.startAutoSpin();
          autoSpinButton.classList.add("active");
          autoSpinButton.textContent = "STOP AUTO";
        }
      });
    }

    // Bet controls
    const betAdjustButtons = this.container.querySelectorAll(".bet-adjust");
    betAdjustButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (this.isSpinning) return;

        this.playSound(this.buttonSound);
        const action = button.dataset.action;

        if (action === "increase" && this.betAmount < this.coins) {
          this.betAmount = Math.min(this.betAmount + this.minBet, this.coins);
        } else if (action === "decrease" && this.betAmount > this.minBet) {
          this.betAmount = Math.max(this.betAmount - this.minBet, this.minBet);
        }

        this.updateBetControls();
      });
    });

    // Win overlay continue button
    const continueButton = this.container.querySelector(".continue-button");
    if (continueButton) {
      continueButton.addEventListener("click", () => {
        this.playSound(this.buttonSound);
        const overlay = this.container.querySelector("#win-overlay");
        if (overlay) {
          overlay.classList.remove("show");
        }
      });
    }

    // Sound toggle
    const soundToggle = this.container.querySelector("#soundToggle");
    if (soundToggle) {
      soundToggle.addEventListener("click", () => {
        this.toggleSound();
      });
    }

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      if (this.isSpinning) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (!this.isSpinning && this.betAmount <= this.coins) {
            this.spin();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (this.betAmount < this.coins) {
            this.betAmount = Math.min(this.betAmount + this.minBet, this.coins);
            this.updateBetControls();
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (this.betAmount > this.minBet) {
            this.betAmount = Math.max(
              this.betAmount - this.minBet,
              this.minBet
            );
            this.updateBetControls();
          }
          break;
      }
    });
  }
}
