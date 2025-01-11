import { View } from "../core/View.js";
import { Http } from "../utils/http.js";
import { State } from "../core/State.js";
import "../styles/posts.css";

export class PostsView extends View {
  constructor(params) {
    super();
    this.params = params;
    this.state = new State({
      posts: [],
      isLoading: true,
      error: null,
    });

    this.state.subscribe(this.updateView.bind(this));
  }

  async render() {
    const element = document.createElement("div");
    element.className = "posts-container";

    const state = this.state.getState();

    if (state.isLoading) {
      element.innerHTML = `
        <div class="loading">Loading posts...</div>
      `;
      return element;
    }

    if (state.error) {
      element.innerHTML = `
        <div class="error">
          <p>Error: ${state.error}</p>
          <button id="retry-button">Retry</button>
        </div>
      `;
      return element;
    }

    element.innerHTML = `
      <h1>Posts</h1>
      <div class="posts-grid">
        ${state.posts
          .map(
            (post) => `
          <article class="post-card" data-post-id="${post.id}">
            <h2>${post.title}</h2>
            <p>${post.body.slice(0, 100)}...</p>
            <button class="read-more" data-post-id="${
              post.id
            }">Read More</button>
          </article>
        `
          )
          .join("")}
      </div>
    `;

    return element;
  }

  async setupEventListeners() {
    if (!this.element) return;

    // Delegate click events for post cards
    this.addListener(this.element, "click", this.handlePostClick.bind(this));

    // Retry button if there's an error
    const retryButton = this.$("#retry-button");
    if (retryButton) {
      this.addListener(retryButton, "click", this.fetchPosts.bind(this));
    }
  }

  handlePostClick(event) {
    const target = event.target;
    if (!this.router) {
      console.error("Router not initialized");
      return;
    }

    if (target.matches(".read-more") || target.matches(".post-card")) {
      const postId =
        target.dataset.postId || target.closest(".post-card")?.dataset.postId;
      if (postId) {
        this.router.navigate(`/posts/${postId}`);
      }
    }
  }

  async afterMount() {
    await this.fetchPosts();
  }

  async fetchPosts() {
    try {
      this.state.setState({ isLoading: true, error: null });
      const posts = await Http.get(
        "https://jsonplaceholder.typicode.com/posts"
      );
      this.state.setState({ posts, isLoading: false });
    } catch (error) {
      this.state.setState({
        error: "Failed to fetch posts. Please try again.",
        isLoading: false,
      });
    }
  }

  async updateView() {
    if (!this.element || !this.element.parentElement) return;

    const parent = this.element.parentElement;
    const oldElement = this.element;
    this.element = await this.render();
    await this.setupEventListeners();
    parent.replaceChild(this.element, oldElement);
  }
}
