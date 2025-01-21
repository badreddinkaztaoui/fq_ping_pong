
import { userState } from '../utils/UserState'
import "../styles/layout.css"

export class Layout {
    constructor(view, layoutType) {
      this.view = view;
      this.layoutType = layoutType;
      this.element = null;
      this.contentContainer = null;
      this.userState = userState;
    }
  
    async createDashboardLayout() {
      const layout = document.createElement('div');
      layout.className = 'dashboard-layout';
      
      const sidebar = document.createElement('aside');
      sidebar.className = 'dashboard-sidebar';
      sidebar.innerHTML = `
        <nav>
          <ul>
            <li><a href="/dashboard">Dashboard Home</a></li>
            <li><a href="/dashboard/profile">Profile</a></li>
            <li><a href="/dashboard/settings">Settings</a></li>
          </ul>
        </nav>
      `;
  
      const content = document.createElement('main');
      content.className = 'dashboard-content';
      
      const header = document.createElement('header');
      header.className = 'dashboard-header';
      header.innerHTML = `
        <div class="header-content">
          <h1>Dashboard</h1>
          <div class="user-menu">
            <button id="logoutBtn">Logout</button>
          </div>
        </div>
      `;
  
      layout.appendChild(sidebar);
      layout.appendChild(content);
      content.appendChild(header);
  
      this.contentContainer = document.createElement('div');
      this.contentContainer.className = 'content-container';
      content.appendChild(this.contentContainer);
  
      return layout;
    }
  
    async createLandingLayout() {
      const layout = document.createElement('div');
      layout.className = 'landing-layout';
  
      const header = document.createElement('header');
      header.className = 'landing-header';
      header.innerHTML = `
        <nav>
          <a href="/" class="logo">Your Logo</a>
          <ul>
            <li><a href="/features">Features</a></li>
            <li><a href="/pricing">Pricing</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/signup">Sign Up</a></li>
          </ul>
        </nav>
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
      }
  
      this.removeEventListeners();
  
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
  
      this.element = null;
      this.contentContainer = null;
    }
  
    setupEventListeners() {
      if (this.layoutType === 'dashboard') {
        const logoutBtn = this.element.querySelector('#logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', this.handleLogout);
        }
      }
    }
  
    removeEventListeners() {
      if (this.layoutType === 'dashboard') {
        const logoutBtn = this.element.querySelector('#logoutBtn');
        if (logoutBtn) {
          logoutBtn.removeEventListener('click', this.handleLogout);
        }
      }
    }
  
    handleLogout = async () => {
      try {
        await this.userState.logout();
        this.view.router.navigate('/login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  }