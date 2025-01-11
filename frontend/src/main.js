import { Router } from './core/Router.js';
import { ErrorBoundary } from './core/ErrorBoundary.js';
import { HomeView } from './views/Home.js';
import { PostsView } from './views/Posts.js';
import { PostDetailView } from './views/PostDetail.js';

const errorBoundary = new ErrorBoundary();

const routes = [
  { path: '/', view: HomeView },
  { path: '/posts', view: PostsView },
  { path: '/posts/:id', view: PostDetailView },
  { path: '*', view: HomeView }
];

const router = new Router(routes);

document.addEventListener('DOMContentLoaded', () => {
  router.handleRoute();
});