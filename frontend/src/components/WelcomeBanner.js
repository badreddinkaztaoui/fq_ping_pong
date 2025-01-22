import "../styles/dashboard/banner.css";

class Particle {
  constructor(x, y, container) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 4 - 2;
    this.speedY = Math.random() * 4 - 2;
    this.life = 1;
    this.element = document.createElement('div');
    this.element.className = 'particle';
    this.element.style.width = this.element.style.height = `${this.size}px`;
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    container.appendChild(this.element);
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 0.02;
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
    this.element.style.opacity = this.life;
    return this.life <= 0;
  }

  destroy(container) {
    container.removeChild(this.element);
  }
}

export function WelcomeBanner(user) {
  const template = `
    <div class="welcome-banner">
      <div class="banner-overlay"></div>
      <div class="banner-content">
        <h1 class="welcome-title">WELCOME TO</h1>
        <h2 class="game-title">VALOPONG</h2>
        <div class="user-info">
          <div class="user-tag">${user.display_name}</div>
          <div class="user-rank">#RADIANT</div>
        </div>
      </div>
      <img src="/images/dashboard/welcom_banner.png" alt="Game Characters" class="banner-characters">
      <div class="particles"></div>
    </div>
  `;

  // Insert the template into the DOM
  const container = document.createElement('div');
  container.innerHTML = template;
  const banner = container.firstElementChild;

  // Initialize particles
  const particles = [];
  const particlesContainer = banner.querySelector('.particles');

  // Add particle effect to user tag
  const userTag = banner.querySelector('.user-tag');
  userTag.addEventListener('mousemove', (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    particles.push(new Particle(x, y, particlesContainer));
  });

  // Add enhanced glitch effect to game title
  const gameTitle = banner.querySelector('.game-title');
  gameTitle.addEventListener('mouseover', () => {
    gameTitle.style.animation = 'none';
    gameTitle.offsetHeight; // Trigger reflow
    gameTitle.style.animation = 'glitchText 0.3s infinite';
  });

  gameTitle.addEventListener('mouseout', () => {
    gameTitle.style.animation = 'glitchText 5s infinite';
  });

  // Animate particles
  function updateParticles() {
    particles.forEach((particle, index) => {
      if (particle.update()) {
        particle.destroy(particlesContainer);
        particles.splice(index, 1);
      }
    });
    requestAnimationFrame(updateParticles);
  }
  updateParticles();

  return banner.outerHTML;
}