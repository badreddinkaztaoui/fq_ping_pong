import { Router } from './core/Router.js';
import { ErrorBoundary } from './core/ErrorBoundary.js';
import { ValorantPongView } from './views/Home.js';
import { PostsView } from './views/Posts.js';
import { PostDetailView } from './views/PostDetail.js';

const errorBoundary = new ErrorBoundary();

const routes = [
  { path: '/', view: ValorantPongView },
  { path: '/posts', view: PostsView },
  { path: '/posts/:id', view: PostDetailView },
  { path: '*', view: ValorantPongView }
];

const router = new Router(routes);

document.addEventListener('DOMContentLoaded', () => {
  router.handleRoute();
});