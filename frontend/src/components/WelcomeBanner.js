import "../styles/dashboard/banner.css";

export function WelcomeBanner(user) {
  const template = `
    <div class="vx-banner">
      <div class="vx-banner__inner">
        <div class="vx-banner__content">
          <div class="vx-banner__header">
            <h1 class="vx-banner__welcome">Welcome to</h1>
            <div class="vx-banner__line"></div>
            <h2 class="vx-banner__title" data-text="Valopong">Valopong</h2>
          </div>
          <div class="vx-banner__user">
            <div class="vx-banner__tag-container">
              <div class="vx-banner__tag">
                <span class="vx-banner__tag-text">${
                  user.display_name || "PLAYER"
                }</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return template;
}
