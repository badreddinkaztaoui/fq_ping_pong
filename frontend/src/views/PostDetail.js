import { View } from '../core/View.js';
import { Http } from '../utils/http.js';
import { State } from '../core/State.js';

export class PostDetailView extends View {
  constructor(params) {
    super();
    this.postId = params.id;
    this.state = new State({
      post: null,
      comments: [],
      isLoading: true,
      error: null
    });
    
    this.state.subscribe(this.updateView.bind(this));
  }

  async render() {
    const element = document.createElement('div');
    element.className = 'post-detail-container';
    
    const state = this.state.getState();
    
    if (state.isLoading) {
      element.innerHTML = `
        <div class="loading">Loading post...</div>
      `;
      return element;
    }

    if (state.error) {
      element.innerHTML = `
        <div class="error">
          <p>Error: ${state.error}</p>
          <button id="retry-button">Retry</button>
          <button id="back-button">Back to Posts</button>
        </div>
      `;
      return element;
    }

    const { post, comments } = state;

    element.innerHTML = `
      <div class="post-detail">
        <button id="back-button" class="back-button">← Back to Posts</button>
        
        <article class="post-content">
          <h1>${post.title}</h1>
          <p>${post.body}</p>
        </article>
        
        <section class="comments-section">
          <h2>Comments</h2>
          <div class="comments-list">
            ${comments.map(comment => `
              <div class="comment">
                <h3>${comment.name}</h3>
                <p class="comment-email">${comment.email}</p>
                <p>${comment.body}</p>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;

    return element;
  }

  async setupEventListeners() {
    const backButton = this.$('#back-button');
    if (backButton) {
      this.addListener(backButton, 'click', () => {
        window.history.pushState({}, '', '/posts');
        this.router.handleRoute();
      });
    }

    const retryButton = this.$('#retry-button');
    if (retryButton) {
      this.addListener(retryButton, 'click', this.fetchPostData);
    }
  }

  async afterMount() {
    await this.fetchPostData();
  }

  async fetchPostData() {
    try {
      this.state.setState({ isLoading: true, error: null });
      
      const [post, comments] = await Promise.all([
        Http.get(`https://jsonplaceholder.typicode.com/posts/${this.postId}`),
        Http.get(`https://jsonplaceholder.typicode.com/posts/${this.postId}/comments`)
      ]);
      
      this.state.setState({
        post,
        comments,
        isLoading: false
      });
    } catch (error) {
      this.state.setState({
        error: 'Failed to fetch post details. Please try again.',
        isLoading: false
      });
    }
  }

  async updateView() {
    const parent = this.element.parentElement;
    const oldElement = this.element;
    this.element = await this.render();
    await this.setupEventListeners();
    parent.replaceChild(this.element, oldElement);
  }
}