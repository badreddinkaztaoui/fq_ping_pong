import { Router } from "./core/Router.js";
import { ErrorBoundary } from "./core/ErrorBoundary.js";
import { AuthGuard } from "./utils/AuthGuard.js";

import { HomeView } from "./views/Home.js";
import { LoginView } from "./views/Login.js";
import { SignupView } from "./views/Register.js";
import { HerosView } from "./views/Heros.js";
import { DashboardView } from "./views/Dashboard.js";
import { ChatView } from "./views/Chat.js";
import { ClassmentView } from "./views/Classment.js";
import { AnalyticsView } from "./views/Analytics.js";
import { GamblingView } from "./views/Gambling.js";
import { ProfileView } from "./views/Profile.js";
import { FriendsView } from "./views/Friends.js";
import { BlockedFriendsView } from "./views/BlockedFriends.js";
import { NotificationsView } from "./views/Notifications";

import { OAuthCallbackView } from "./views/OAuthCallback.js";
import { NotFoundView } from "./views/404.js";
import { GameView } from "./views/Game.js";
import { ResetPasswordView } from "./views/ResetPassword.js";
import { ResetPasswordConfirmView } from "./views/ResetPasswordConfirm.js";
import { SlotMachineGameView } from "./views/SlotMachineGame.js";
import { FlapyBirdGameView } from "./views/FlapyBirdGame.js";
import { CubeDiceGameView } from "./views/CubeDiceGame.js";

const errorBoundary = new ErrorBoundary();

const routes = [
  {
    path: "/login",
    view: LoginView,
    handler: AuthGuard.requireGuest,
  },
  {
    path: "/signup",
    view: SignupView,
    handler: AuthGuard.requireGuest,
  },
  {
    path: "/reset-password",
    view: ResetPasswordView,
    handler: AuthGuard.requireGuest,
  },
  {
    path: "/reset-password/:uidb64/:token/",
    view: ResetPasswordConfirmView,
    handler: AuthGuard.requireGuest,
  },
  {
    path: "/",
    view: HomeView,
  },
  {
    path: "/heros",
    view: HerosView,
  },
  {
    path: "/auth/callback",
    view: OAuthCallbackView,
  },
  {
    path: "/dashboard",
    view: DashboardView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/game",
    view: GameView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/chat",
    view: ChatView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/chat/:id",
    view: ChatView,
    paramKey: "id",
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/friends",
    view: FriendsView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/notifications",
    view: NotificationsView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/blocked-friends",
    view: BlockedFriendsView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/classment",
    view: ClassmentView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/analytics",
    view: AnalyticsView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/gambling",
    view: GamblingView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/cube-dice",
    view: CubeDiceGameView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/flapy-bird",
    view: FlapyBirdGameView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/slot-machine",
    view: SlotMachineGameView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/profile",
    view: ProfileView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "/dashboard/*",
    view: DashboardView,
    handler: AuthGuard.requireAuth,
  },
  {
    path: "*",
    view: NotFoundView,
  },
];

const router = new Router(routes);

window.addEventListener("DOMContentLoaded", () => {
  router.handleRoute();
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  errorBoundary.handleError(event.reason);
});

export default router;
