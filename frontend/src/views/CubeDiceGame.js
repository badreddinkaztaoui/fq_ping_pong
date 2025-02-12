import { View } from "../core/View";
import "../styles/dashboard/games/cube.css";
import { userState } from "../utils/UserState";

export class CubeDiceGameView extends View {
  constructor() {
    super();
    this.isRolling = false;
    this.selectedNumber = null;
    this.coins = userState.state.user.coins;
    this.betAmount = 100;
    this.interactionLocked = false;
    this.container = null;
    this.rotationMap = {
      1: { x: 0, y: 0, z: 0 },
      2: { x: 0, y: 180, z: 0 },
      3: { x: 0, y: -90, z: 0 },
      4: { x: 0, y: 90, z: 0 },
      5: { x: -90, y: 0, z: 0 },
      6: { x: 90, y: 0, z: 0 },
    };
  }

  getSecureRandomNumber() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % 6) + 1;
  }

  updateCoins(newAmount) {
    this.coins = newAmount;
    localStorage.setItem("diceCoins", this.coins.toString());
    if (this.container) {
      const coinsDisplay = this.container.querySelector("#coinsAmount");
      if (coinsDisplay) {
        coinsDisplay.textContent = this.coins;
      }
    }
  }

  lockInteractions() {
    this.interactionLocked = true;
    if (this.container) {
      this.container
        .querySelectorAll(
          ".number-button, .bet-adjust, .roll-button, .continue-button"
        )
        .forEach((button) => {
          button.disabled = true;
        });
    }
  }

  unlockInteractions() {
    this.interactionLocked = false;
    if (this.container) {
      this.container
        .querySelectorAll(".number-button, .bet-adjust, .continue-button")
        .forEach((button) => {
          button.disabled = false;
        });

      const rollButton = this.container.querySelector("#rollButton");
      if (rollButton) {
        rollButton.disabled = !this.selectedNumber;
      }
    }
  }

  async render() {
    this.container = document.createElement("div");
    this.container.className = "cube-dice-container";

    this.container.innerHTML = `
      <div class="game-layout">
        <div class="cube-section">
          <div class="dice-area">
            <div class="dice" id="dice">
              <div class="face front">
                <span class="dot center"></span>
              </div>
              <div class="face back">
                <span class="dot top-left"></span>
                <span class="dot bottom-right"></span>
              </div>
              <div class="face right">
                <span class="dot top-left"></span>
                <span class="dot center"></span>
                <span class="dot bottom-right"></span>
              </div>
              <div class="face left">
                <span class="dot top-left"></span>
                <span class="dot top-right"></span>
                <span class="dot bottom-left"></span>
                <span class="dot bottom-right"></span>
              </div>
              <div class="face top">
                <span class="dot top-left"></span>
                <span class="dot top-right"></span>
                <span class="dot center"></span>
                <span class="dot bottom-left"></span>
                <span class="dot bottom-right"></span>
              </div>
              <div class="face bottom">
                <span class="dot top-left"></span>
                <span class="dot top-right"></span>
                <span class="dot center-left"></span>
                <span class="dot center-right"></span>
                <span class="dot bottom-left"></span>
                <span class="dot bottom-right"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="betting-section">
          <div class="stats-bar">
            <div class="coins-display">
              <i class="coin-icon">
                <img src="/images/coin.png" alt="Coin Icon" />
              </i>
              <span id="coinsAmount">${this.coins}</span>
            </div>
          </div>

          <div class="bet-options">
            <h3>Select Your Number</h3>
            <div class="number-grid">
              ${[1, 2, 3, 4, 5, 6]
                .map(
                  (num) => `
                <button class="number-button" data-number="${num}">
                  ${num}
                  <span class="payout">2x</span>
                </button>
              `
                )
                .join("")}
            </div>

            <div class="bet-controls">
              <div class="bet-amount">
                <button class="bet-adjust" data-action="decrease">-</button>
                <span id="betAmount">${this.betAmount}</span>
                <button class="bet-adjust" data-action="increase">+</button>
              </div>
              <button id="rollButton" class="roll-button" disabled>
                <span>ROLL DICE</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Win Overlay -->
      <div class="celebration-overlay" id="celebration">
        <div class="celebration-content win">
          <h2>YOU WIN!</h2>
          <div class="win-amount">+<span id="winAmount">0</span></div>
          <button class="continue-button">CONTINUE</button>
        </div>
      </div>

      <!-- Lose Overlay -->
      <div class="celebration-overlay" id="lose-overlay">
        <div class="celebration-content lose">
          <h2 class="manga-text">YOU LOSE!</h2>
          <div class="lose-amount manga-effect">-<span id="loseAmount">0</span></div>
          <div class="manga-bubble">
            <div class="manga-suggestion">
              <span class="manga-bold">شووووويآآ</span>
              <span class="manga-bold">علا</span>
              <div class="manga-number">
                <span id="suggestionNumber" class="manga-highlight"></span>
              </div>
              <div class="manga-sfx">!!!!</div>
            </div>
          </div>
          <button class="continue-button manga-button">CONTINUE</button>
        </div>
      </div>
    `;

    // Add styles for win/lose overlays
    const style = document.createElement("style");
    style.textContent = `
      .celebration-content.win h2 {
        color: #FFD700;
      }
      .celebration-content.lose h2 {
        color: #ff4655;
      }
      .lose-amount {
        font-size: 4rem;
        color: #ff4655;
        margin: 2rem 0;
        font-weight: bold;
        font-family: "Tungsten", sans-serif;
        text-shadow: 0 0 20px rgba(255, 70, 85, 0.5);
      }
    `;
    document.head.appendChild(style);

    this.setupEventListeners();
    return this.container;
  }

  setupEventListeners() {
    if (!this.container) return;

    const numberButtons = this.container.querySelectorAll(".number-button");
    const rollButton = this.container.querySelector("#rollButton");
    const betAdjustButtons = this.container.querySelectorAll(".bet-adjust");
    const celebration = this.container.querySelector("#celebration");
    const loseOverlay = this.container.querySelector("#lose-overlay");
    const continueButtons = this.container.querySelectorAll(".continue-button");

    numberButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (this.isRolling || this.interactionLocked) return;

        numberButtons.forEach((btn) => btn.classList.remove("selected"));
        button.classList.add("selected");
        this.selectedNumber = parseInt(button.dataset.number);
        if (rollButton) rollButton.disabled = false;
      });
    });

    betAdjustButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (this.isRolling || this.interactionLocked) return;

        const action = button.dataset.action;
        const betAmountElement = this.container.querySelector("#betAmount");

        if (action === "increase" && this.betAmount < this.coins) {
          this.betAmount = Math.min(this.betAmount + 100, this.coins);
        } else if (action === "decrease" && this.betAmount > 100) {
          this.betAmount = Math.max(this.betAmount - 100, 100);
        }

        if (betAmountElement) {
          betAmountElement.textContent = this.betAmount;
        }
      });
    });

    if (rollButton) {
      rollButton.addEventListener("click", () => {
        if (
          this.isRolling ||
          this.interactionLocked ||
          !this.selectedNumber ||
          this.betAmount > this.coins
        )
          return;
        this.rollDice();
      });
    }

    continueButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (this.isRolling || this.interactionLocked) return;
        celebration.classList.remove("show");
        loseOverlay.classList.remove("show");
      });
    });
  }

  rollDice() {
    if (this.isRolling || this.interactionLocked || !this.container) return;

    this.isRolling = true;
    this.lockInteractions();

    const dice = this.container.querySelector("#dice");
    if (!dice) return;

    this.updateCoins(this.coins - this.betAmount);

    const result = this.getSecureRandomNumber();
    const baseRotation = this.rotationMap[result];
    const extraSpins =
      (Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] % 2) + 2) * 360;

    const rotation = {
      x: baseRotation.x + extraSpins,
      y: baseRotation.y + extraSpins,
      z: baseRotation.z,
    };

    dice.style.transform = `
      rotateX(${rotation.x}deg)
      rotateY(${rotation.y}deg)
      rotateZ(${rotation.z}deg)
    `;

    setTimeout(() => {
      this.handleResult(result);
    }, 3000);
  }

  handleResult(result) {
    if (!this.container) return;

    const celebration = this.container.querySelector("#celebration");
    const loseOverlay = this.container.querySelector("#lose-overlay");
    const winAmount = this.container.querySelector("#winAmount");
    const loseAmount = this.container.querySelector("#loseAmount");

    if (result === this.selectedNumber) {
      // Win!
      const prize = this.betAmount * 2;
      this.updateCoins(this.coins + prize);

      if (winAmount) {
        winAmount.textContent = prize;
      }
      celebration.classList.add("show");
    } else {
      if (loseAmount) {
        loseAmount.textContent = this.betAmount;
      }
      // Update the suggestion number with the dice result
      const suggestionNumber =
        this.container.querySelector("#suggestionNumber");
      if (suggestionNumber) {
        suggestionNumber.textContent = result;
      }
      loseOverlay.classList.add("show");
    }

    this.isRolling = false;
    this.unlockInteractions();
  }
}
