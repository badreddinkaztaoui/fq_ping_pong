import { userState } from "../utils/UserState";

import "../styles/layout.css";

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
    const layout = document.createElement("div");
    layout.className = "dashboard-layout";

    const nav = document.createElement("nav");
    nav.className = "dashboard-nav";
    nav.innerHTML = `
          <div class="nav-left">
            <div class="logo-section">
              <img src="/images/logo.png" alt="logo" class="logo-img" data-link="/dashboard" />
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
              
              <div class="profile-dropdown">
                <button class="profile-btn">
                  <img src="${
                    userState.state.user.avatar_url ||
                    "/images/users/default-avatar.webp"
                  }" alt="Avatar" class="avatar" />
                  <svg class="arrow-icon" viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                <div class="dropdown-menu">
                  <div class="menu-header">
                    <img src="${
                      userState.state.user.avatar_url ||
                      "/images/users/default-avatar.webp"
                    }" alt="Avatar" class="menu-avatar" />
                    <div class="user-info">
                      <span class="menu-username">${
                        userState.state.user.username
                      }</span>
                    </div>
                  </div>
                  <a data-link="/dashboard/profile" class="menu-item profile">
                    <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8C17 10.7614 14.7614 13 12 13Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 16C17.1429 16 20.1429 17.6667 21 21H3C3.85714 17.6667 6.85714 16 12 16Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>


                    Profile
                  </a>
                  <a data-link="/dashboard/friends" class="menu-item friends">
                    <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <!-- Person 1 (Head) -->
                      <circle cx="8" cy="8" r="3" stroke="white" stroke-width="2" fill="none"/>
                      <!-- Person 2 (Head) -->
                      <circle cx="16" cy="8" r="3" stroke="white" stroke-width="2" fill="none"/>
                      <!-- Body 1 -->
                      <path d="M8 11C8 11 7 13 6 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <!-- Body 2 -->
                      <path d="M16 11C16 11 17 13 18 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <!-- Connecting Line (Representing friendship) -->
                      <path d="M8 11L16 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Friends
                  </a>
                  <a class="menu-item logout" id="logoutBtn">
                    <svg class="icon" viewBox="0 0 24 24">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </a>
                </div>
              </div>
            </div>
          </div>
    `;

    layout.appendChild(nav);

    this.contentContainer = document.createElement("div");
    this.contentContainer.className = "dashboard-content";
    layout.appendChild(this.contentContainer);

    return layout;
  }

  async createLandingLayout() {
    const layout = document.createElement("div");
    layout.className = "landing-layout";

    const header = document.createElement("header");
    header.className = "landing-header";
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

    const content = document.createElement("main");
    content.className = "landing-content";

    layout.appendChild(header);
    layout.appendChild(content);

    this.contentContainer = document.createElement("div");
    this.contentContainer.className = "content-container";
    content.appendChild(this.contentContainer);

    return layout;
  }

  async mount(container) {
    this.element =
      this.layoutType === "dashboard"
        ? await this.createDashboardLayout()
        : await this.createLandingLayout();

    container.innerHTML = "";
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

  handleDashboardRoutes() {
    const dashBoardLinks = document.querySelectorAll(".nav-link");
    const removeActiveClass = () => {
      dashBoardLinks.forEach((link) => link.classList.remove("active"));
    };

    const setActiveLink = (path) => {
      removeActiveClass();
      dashBoardLinks.forEach((link) => {
        if (link.getAttribute("data-link") === path) {
          link.classList.add("active");
        }
      });
    };

    setActiveLink(window.location.pathname);

    const notif = document.querySelector(".view-all");
    notif.addEventListener("click", (e) => {
      e.preventDefault();
      this.router.navigate("/dashboard/notifications");
    });

    const logo = document.querySelector(".logo-img");
    logo.addEventListener("click", (e) => {
      e.preventDefault();
      this.router.navigate("/dashboard");
    });
    dashBoardLinks.forEach((route) => {
      route.addEventListener("click", (e) => {
        e.preventDefault();
        const path = route.getAttribute("data-link");

        if (path && this.router) {
          setActiveLink(path);
          this.router.navigate(path);
        }
      });
    });

    window.addEventListener("popstate", () => {
      setActiveLink(window.location.pathname);
    });
  }
  profileDropDown() {}
  setupEventListeners() {
    if (this.layoutType === "dashboard") {
      const logoutBtn = this.element.querySelector("#logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          await userState.logout();
          this.router.navigate("/login");
        });
      }
      this.handleDashboardRoutes();
      this.setupMenu();
      const dropdown = document.querySelector(".profile-dropdown");
      const button = dropdown.querySelector(".profile-btn");

      button.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("active");
      });

      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("active");
        }
      });

      const profileBtn = document.querySelector(".profile");
      if (profileBtn) {
        profileBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.router.navigate("/dashboard/profile");
        });
      }
      const friendsBtn = document.querySelector(".friends");
      if (friendsBtn) {
        friendsBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.router.navigate("/dashboard/friends");
        });
      }
    } else {
      const burgerMenu = document.getElementById("burger-menu");
      const overlay = document.getElementById("menu");
      const links = document.querySelectorAll(".navlink");

      if (burgerMenu && overlay) {
        burgerMenu.addEventListener("click", () => {
          burgerMenu.classList.toggle("close");
          overlay.classList.toggle("overlay");
        });

        overlay.addEventListener("click", () => {
          burgerMenu.classList.remove("close");
          overlay.classList.remove("overlay");
        });

        links.forEach((link) => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            const path = link.getAttribute('data-link="/"');
            if (path && this.router) {
              this.router.navigate(path);
              burgerMenu?.classList.remove("close");
              overlay?.classList.remove("overlay");
            }
          });
        });
      }
    }
  }

  removeEventListeners() {
    for (const [key, handler] of this.boundEventListeners) {
      const element = this.element?.querySelector(
        key === "logout" ? "#logoutBtn" : key
      );
      if (element) {
        element.removeEventListener("click", handler);
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
      if (topNav) topNav.classList.toggle("menu-open");
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
    const notificationIcon = document.querySelector(
      ".notification-icon-wrapper"
    );

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
      const unreadItems = document.querySelectorAll(
        ".notification-item.unread"
      );
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
        const unreadCount = document.querySelectorAll(
          ".notification-item.unread"
        ).length;
        document.querySelector(".notification-badge").textContent = unreadCount;
      });
    });
  }

  async handleLogout() {}
}
