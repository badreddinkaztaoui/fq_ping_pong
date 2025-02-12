import { userState } from "../utils/UserState";
import "../styles/layout.css";
import { Http } from "../utils/Http";
import { MessageHandler } from "../utils/MessageHandler";

export class Layout {
  constructor(view, layoutType, router) {
    this.view = view;
    this.layoutType = layoutType;
    this.element = null;
    this.contentContainer = null;
    this.userState = userState;
    this.router = router;
    this.boundEventListeners = new Map();

    this.http = new Http();
    this.messageHandler = new MessageHandler();
    this.pollInterval = null;
    this.POLL_INTERVAL = 20000;
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
                    <span>Games</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div class="nav-right">
            <div class="user-info">
              <div class="coins">
                <img src="/images/coin.png" alt="Coins" class="coin-icon" />
                <span>${userState.state.user.coins}</span>
              </div>
               <div class="notifications">
                <div class="notification-icon-wrapper">
                  <img src="/images/icons/notification.svg" alt="Notifications" class="notification-icon" />
                  <span class="notification-badge">0</span>
                </div>
                <div class="notifications-dropdown">
                  <div class="dropdown-header">
                    <h3>Notifications</h3>
                    <button class="mark-all-read">Mark all as read</button>
                  </div>
                  <div class="notifications-list">
                    <!-- Will be populated dynamically -->
                    <div class="notification-item-lay empty">
                      <p class="notification-text">No notifications yet</p>
                    </div>
                  </div>
                  <div class="dropdown-footer">
                    <a class="view-all" data-link="/dashboard/notifications">View All Notifications</a>
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
                  <a data-link="/dashboard/settings" class="menu-item settings">
                    <svg class="icon" viewBox="0 0 24 24">
                      <path d="M12 14a4 4 0 100-8 4 4 0 000 8z"/>
                      <path d="M19.31 14.5a10 10 0 00-1.32-2.56l1.45-1.45a1 1 0 10-1.42-1.42l-1.45 1.45a10 10 0 00-2.56-1.32l.67-1.34a1 1 0 00-1.82-.84l-.67 1.34a10 10 0 00-2.56 1.32L8.98 8.17a1 1 0 00-1.42 1.42l1.45 1.45a10 10 0 00-1.32 2.56l-1.34-.67a1 1 0 00-.84 1.82l1.34.67a10 10 0 00 1.32 2.56l-1.45 1.45a1 1 0 001.42 1.42l1.45-1.45a10 10 0 002.56 1.32l-.67 1.34a1 1 0 001.82.84l.67-1.34a10 10 0 002.56-1.32l1.45 1.45a1 1 0 001.42-1.42l-1.45-1.45a10 10 0 001.32-2.56l1.34.67a1 1 0 00.84-1.82l-1.34-.67zM12 16a4 4 0 110-8 4 4 0 010 8z"/>
                    </svg>
                      Settings
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

    if (this.element && this.element?.parentNode) {
      this.element?.parentNode.removeChild(this.element);
    }
    this.element = null;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
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

  setupEventListeners() {
    if (this.layoutType === "dashboard") {
      const logoutBtn = this.element?.querySelector("#logoutBtn");
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
      const settingsBtn = document.querySelector(".settings");
      if (settingsBtn) {
        settingsBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.router.navigate("/dashboard/settings");
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
            const path = link.dataset.link;
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
        if (window.innerWidth > 992 && topNav !== null) {
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
    const notifications = this.element?.querySelector(".notifications");
    const notificationIcon = this.element?.querySelector(
      ".notification-icon-wrapper"
    );
    const markAllReadBtn = this.element?.querySelector(".mark-all-read");
    const notificationsList = this.element?.querySelector(
      ".notifications-list"
    );
    const viewAllLink = this.element?.querySelector(".view-all");

    if (notificationIcon) {
      notificationIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        notifications.classList.toggle("active");
      });
    }

    document.addEventListener("click", (e) => {
      if (notifications && !notifications.contains(e.target)) {
        notifications.classList.remove("active");
      }
    });

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.markAllAsRead();
      });
    }

    if (notificationsList) {
      notificationsList.addEventListener("click", (e) => {
        const notificationItem = e.target.closest(".notification-item-lay");
        if (notificationItem && !notificationItem.classList.contains("empty")) {
          const id = notificationItem.dataset.id;
          if (id) {
            this.markAsRead(id);
          }
        }
      });
    }

    if (viewAllLink) {
      viewAllLink.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.router.navigate("/dashboard/notifications");
        notifications.classList.remove("active");
      });
    }

    // Start notifications polling
    this.startNotificationsPolling();
  }

  async handleLogout() {}

  async fetchNotifications() {
    try {
      const response = await this.http.get(
        "/auth/notifications/?page=1&per_page=3"
      );
      return response.notifications;
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }
  }

  formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }

    return "Just now";
  }

  async updateNotificationsList() {
    if (!this.element) return;
    const notifications = await this.fetchNotifications();
    const notificationsList = this.element?.querySelector(
      ".notifications-list"
    );
    const badge = this.element?.querySelector(".notification-badge");

    if (!notificationsList || !badge) return;

    const unreadCount = notifications.filter((n) => !n.is_read).length;
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? "flex" : "none";

    if (notifications.length === 0) {
      notificationsList.innerHTML = `
        <div class="notification-item-lay empty">
          <p class="notification-text">No notifications yet</p>
        </div>
      `;
    } else {
      notificationsList.innerHTML = notifications
        .map(
          (notification) => `
        <div class="notification-item-lay ${
          notification.is_read ? "" : "unread"
        }" data-id="${notification.id}">
          <div class="notification-avatar">
            <img src="${
              notification.avatar_url || "/images/users/default-avatar.webp"
            }" alt="Notification" />
          </div>
          <div class="notification-content">
            <p class="notification-text">${notification.message}</p>
            <span class="notification-time">${this.formatTimeAgo(
              notification.created_at
            )}</span>
          </div>
          <div class="notification-status"></div>
        </div>
      `
        )
        .join("");
    }
  }

  async markAsRead(notificationId) {
    try {
      await this.http.post(`/auth/notifications/${notificationId}/read/`);
      await this.updateNotificationsList();
    } catch (error) {
      this.messageHandler.error("Failed to mark notification as read");
    }
  }

  async markAllAsRead() {
    try {
      await this.http.post("/auth/notifications/mark-all-read/");
      await this.updateNotificationsList();
      this.messageHandler.success("All notifications marked as read");
    } catch (error) {
      this.messageHandler.error("Failed to mark all notifications as read");
    }
  }

  startNotificationsPolling() {
    this.updateNotificationsList();

    this.pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        this.updateNotificationsList();
      }
    }, this.POLL_INTERVAL);
  }
}
