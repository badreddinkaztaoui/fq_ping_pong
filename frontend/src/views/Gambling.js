import "../styles/dashboard/gambling.css";
import { View } from "../core/View";

export class GamblingView extends View {
  constructor() {
    super();
    this.gameData = [
      {
        id: "cube-dice",
        name: "Cube Dice",
        description: "A game where you roll dice and match the numbers to win",
        image: "/images/game/cube.avif",
      },
      {
        id: "flapy-bird",
        name: "Flappy bird",
        description:
          "A game where you control a bird and avoid obstacles to reach",
        image: "/images/game/Flappy-bird.avif",
      },
      {
        id: "slot-machine",
        name: "Spin the wheel",
        description: "A game where you pull the lever and match symbols to win",
        image: "/images/game/spin.jpg",
      },
    ];
  }

  renderGameBoxes() {
    return this.gameData
      .map(
        (game, index) => `
          <div class="game-wrapper" data-game-id="${game.id}" style="--order: ${index}">
            <div class="game-box">
                <div class="game-image-container">
                    <img src="${game.image}" alt="${game.name}" class="game-image">
                    <div class="game-overlay">
                    <button class="play-button" aria-label="Play ${game.name}">
                        <span>
                        PLAY
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z" />
                        </svg>
                        </span>
                    </button>
                    <p class="game-description">${game.description}</p>
                    </div>
                </div>
            </div>
            <h3 class="game-name">${game.name}</h3> 
          </div>
        `
      )
      .join("");
  }

  async render() {
    const container = document.createElement("div");
    container.className = "gambling-container";

    if (!this.gameData.length) {
      return this.renderEmptyState();
    }

    container.innerHTML = `
      <div class="section-header">
        <h2 class="gambling-title">Games</h2>
      </div>
      <div class="games-grid" id="games-grid">
        ${this.renderGameBoxes()}
      </div>
    `;

    this.setupAnimations(container);
    this.setupInteractions(container);
    return container;
  }

  setupAnimations(container) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    container.querySelectorAll(".game-wrapper").forEach((box) => {
      observer.observe(box);
    });
  }

  setupInteractions(container) {
    container.querySelectorAll(".game-wrapper").forEach((wrapper) => {
      const gameBox = wrapper.querySelector(".game-box");
      const playButton = wrapper.querySelector(".play-button");
      const image = wrapper.querySelector(".game-image");

      // Parallax effect on mouse move
      gameBox.addEventListener("mousemove", (e) => {
        const rect = gameBox.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const moveX = (x - rect.width / 2) / 30;
        const moveY = (y - rect.height / 2) / 30;

        image.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
      });

      // Reset transforms on mouse leave
      gameBox.addEventListener("mouseleave", () => {
        image.style.transform = "scale(1)";
      });

      // Handle play button click
      playButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const gameId = wrapper.dataset.gameId;
        this.handleGameSelect(gameId);
      });

      // Handle game box click
      gameBox.addEventListener("click", () => {
        const gameId = wrapper.dataset.gameId;
        this.handleGameSelect(gameId);
      });
    });
  }

  handleGameSelect(gameId) {
    const selectedGame = this.gameData.find((game) => game.id === gameId);
    if (selectedGame) {
      this.router.navigate(`/dashboard/${gameId}`);
    }
  }

  renderEmptyState() {
    const container = document.createElement("div");
    container.className = "gambling-container";

    container.innerHTML = `
      <div class="section-header">
        <h2 class="gambling-title">Featured Games</h2>
      </div>
      <div class="empty-state">
        <h3>No Games Available</h3>
        <p>Check back soon for new games</p>
      </div>
    `;

    return container;
  }
}
