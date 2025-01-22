
import { userState } from '../utils/UserState'

import "../styles/layout.css"

export class Layout {
  constructor(view, layoutType, router) {
    this.view = view;
    this.layoutType = layoutType;
    this.element = null;
    this.contentContainer = null;
    this.userState = userState;
    this.router = router;
    this.boundEventListeners = new Map();
  }

  async createDashboardLayout() {
    const layout = document.createElement('div');
    layout.className = "dashboard-container"
    const nav = document.createElement('nav')
    nav.innerHTML = `
    <nav class="top-nav">
          <div class="nav-left">
            <div class="logo-section">
              <img src="/images/logo.png" alt="logo" class="logo-img" />
            </div>
            
            <!-- Mobile Menu Toggle -->
            <button class="mobile-menu-toggle">
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
            </button>

            <!-- Navigation Links -->
            <div class="nav-container">
              <ul class="nav-links">
                <li class="nav-item">
                  <a  class="nav-link active" data-link="/dashboard">
                    <img src="/images/icons/home.png" alt="Home" class="nav-icon" />
                    <span>Dashboard</span>
                  </a>
                </li>
                <li class="nav-item">
                  <a  class="nav-link" data-link="/dashboard/classment">
                    <img src="/images/icons/Classment.png" alt="Classment" class="nav-icon" />
                    <span>Classment</span>
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" data-link="/dashboard/chat">
                    <img src="/images/icons/chat.png" alt="Chat" class="nav-icon" />
                    <span>Chat</span>
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" data-link="/dashboard/analytics">
                    <img src="/images/icons/Analytics.png" alt="Analytics" class="nav-icon" />
                    <span>Analytics</span>
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" data-link="/dashboard/settings">
                    <img src="/images/icons/settings.png" alt="Settings" class="nav-icon" />
                    <span>Settings</span>
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" data-link="/dashboard/gambling">
                    <img src="/images/icons/casino.png" alt="Gambling" class="nav-icon" />
                    <span>Gambling</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div class="nav-right">
            <div class="user-info">
              <div class="coins">
                <img src="/images/icons/coin.png" alt="Coins" class="coin-icon" />
                <span>1,500</span>
              </div>
                <div class="notifications">
                  <div class="notification-icon-wrapper">
                    <img src="/images/icons/notification.svg" alt="Notifications" class="notification-icon" />
                    <span class="notification-badge">3</span>
                  </div>
                  <div class="notifications-dropdown">
                    <div class="dropdown-header">
                      <h3>Notifications</h3>
                      <button class="mark-all-read">Mark all as read</button>
                    </div>
                    <div class="notifications-list">
                      <div class="notification-item unread">
                        <div class="notification-avatar">
                          <img src="/images/users/player-2.jpeg" alt="Player" />
                        </div>
                        <div class="notification-content">
                          <p class="notification-text"><strong>John Doe</strong> challenged you to a match!</p>
                          <span class="notification-time">2 minutes ago</span>
                        </div>
                        <div class="notification-status"></div>
                      </div>
                      <div class="notification-item unread">
                        <div class="notification-avatar">
                          <img src="/images/trophy.png" alt="Trophy" />
                        </div>
                        <div class="notification-content">
                          <p class="notification-text">You won the tournament! Collect your rewards.</p>
                          <span class="notification-time">1 hour ago</span>
                        </div>
                        <div class="notification-status"></div>
                      </div>
                      <div class="notification-item">
                        <div class="notification-avatar">
                          <img src="/images/coin.png" alt="Coins" />
                        </div>
                        <div class="notification-content">
                          <p class="notification-text">You received 500 coins from daily login!</p>
                          <span class="notification-time">1 day ago</span>
                        </div>
                        <div class="notification-status"></div>
                      </div>
                    </div>
                    <div class="dropdown-footer">
                      <a class="view-all" data-link="/dashboard/notifications" >View All Notifications</a>
                    </div>
                  </div>
              </div>
              <div class="user-profile">
                <img src="/images/users/player-1.jpeg" alt="Avatar" class="avatar" />
                <span class="username">Player123</span>
              </div>
              <a class="logout-btn" id="logoutBtn">
                <img src="/images/icons/logout.png" alt="Logout" class="nav-icon log-out" />
              </a>
            </div>
          </div>
        </nav>
    `

    const content = document.createElement('main');
    content.className = "main-content"

    layout.appendChild(nav)
    layout.appendChild(content)

    this.contentContainer = content

    return layout;
  }

  async createLandingLayout() {
    const layout = document.createElement('div');
    layout.className = 'landing-layout';

    const header = document.createElement('header');
    header.className = 'landing-header';
    header.innerHTML = `
        <header>
        <div id="burger-menu">
          <span></span>
        </div>
        <div id="menu">
          <ul>
            <li style="--i: 1">
              <a  class="navlink" data-link="/">Home</a>
            </li>
            <li style="--i: 2">
              <a  class="navlink" data-link="/heros">Heroes</a>
            </li>
            <li style="--i: 3">
              <a  class="navlink" data-link="/login">Login</a>
            </li>
            <li style="--i: 4">
              <a  class="navlink" data-link="/signup">Sign Up</a>
            </li>
          </ul>
        </div>
      </header>
      `;

    const content = document.createElement('main');
    content.className = 'landing-content';

    layout.appendChild(header);
    layout.appendChild(content);

    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'content-container';
    content.appendChild(this.contentContainer);

    return layout;
  }

  async mount(container) {
    this.element = this.layoutType === 'dashboard'
      ? await this.createDashboardLayout()
      : await this.createLandingLayout();

    container.innerHTML = '';
    container.appendChild(this.element);

    if (this.view) {
      await this.view.mount(this.contentContainer);
    }

    this.setupEventListeners();
  }

  async unmount() {
    if (this.view) {
      await this.view.unmount();
      this.view = null;
    }

    this.removeEventListeners();

    if (this.contentContainer) {
      while (this.contentContainer.firstChild) {
        this.contentContainer.removeChild(this.contentContainer.firstChild);
      }
      this.contentContainer = null;
    }

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  setupEventListeners() {
    if (this.layoutType === 'dashboard') {
      const logoutBtn = this.element.querySelector('#logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault()
          await userState.logout();
          this.router.navigate("/login")
        });
      }
      this.setupMenu();
    } else {
      const burgerMenu = document.getElementById('burger-menu');
      const overlay = document.getElementById('menu');
      const links = document.querySelectorAll(".navlink");

      if (burgerMenu && overlay) {
        burgerMenu.addEventListener('click', () => {
          burgerMenu.classList.toggle('close');
          overlay.classList.toggle('overlay');
        });

        overlay.addEventListener('click', () => {
          burgerMenu.classList.remove('close');
          overlay.classList.remove('overlay');
        });
      }

      links.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const path = link.getAttribute('data-link="/"');
          if (path && this.router) {
            this.router.navigate(path);
            burgerMenu?.classList.remove('close');
            overlay?.classList.remove('overlay');
          }
        });
      });
    }
  }

  removeEventListeners() {
    for (const [key, handler] of this.boundEventListeners) {
      const element = this.element?.querySelector(key === 'logout' ? '#logoutBtn' : key);
      if (element) {
        element.removeEventListener('click', handler);
      }
    }
    this.boundEventListeners.clear();
  }

  setupMenu() {
    const menuToggle = document.querySelector(".mobile-menu-toggle");
    const navContainer = document.querySelector(".nav-container");
    const topNav = document.querySelector(".top-nav");
    const body = document.body;

    if (window.innerWidth <= 992) {
      navContainer.style.display = "none";
    }

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menuToggle.classList.toggle("active");

      if (!navContainer.classList.contains("active")) {
        navContainer.style.display = "flex";
        navContainer.offsetHeight;
        navContainer.classList.add("active");
      } else {
        navContainer.classList.remove("active");
        setTimeout(() => {
          if (!navContainer.classList.contains("active")) {
            navContainer.style.display = "none";
          }
        }, 300);
      }

      topNav.classList.toggle("menu-open");
      body.style.overflow = body.style.overflow === "hidden" ? "" : "hidden";
    });

    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 992) {
          menuToggle.classList.remove("active");
          navContainer.classList.remove("active");
          navContainer.style.display = "flex";
          topNav.classList.remove("menu-open");
          body.style.overflow = "";
        } else if (!navContainer.classList.contains("active")) {
          navContainer.style.display = "none";
        }
      }, 250);
    });

    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 992) {
          menuToggle.classList.remove("active");
          navContainer.classList.remove("active");
          setTimeout(() => {
            navContainer.style.display = "none";
          }, 300);
          topNav.classList.remove("menu-open");
          body.style.overflow = "";
        }
      });
    });

    const currentPath = window.location.pathname;
    navLinks.forEach((link) => {
      if (link.getAttribute("href") === currentPath) {
        link.classList.add("active");
      }
    });

    // *Notifications toggle
    const notifications = document.querySelector(".notifications");
    const notificationIcon = document.querySelector(".notification-icon-wrapper");

    notificationIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      notifications.classList.toggle("active");
    });

    // Close notifications when clicking outside
    document.addEventListener("click", (e) => {
      if (!notifications.contains(e.target)) {
        notifications.classList.remove("active");
      }
    });

    // Mark all as read functionality
    const markAllReadBtn = document.querySelector(".mark-all-read");
    markAllReadBtn.addEventListener("click", () => {
      const unreadItems = document.querySelectorAll(".notification-item.unread");
      unreadItems.forEach((item) => {
        item.classList.remove("unread");
      });
      document.querySelector(".notification-badge").textContent = "0";
    });

    // Individual notification click
    const notificationItems = document.querySelectorAll(".notification-item");
    notificationItems.forEach((item) => {
      item.addEventListener("click", () => {
        item.classList.remove("unread");
        // Update badge count
        const unreadCount = document.querySelectorAll(".notification-item.unread").length;
        document.querySelector(".notification-badge").textContent = unreadCount;
      });
    });
  }

  async handleLogout() {}
}