import { userState } from './UserState.js';

export class AuthGuard {
  static async requireAuth(params, router) {
    const state = userState.getState();
    
    if (!state.isAuthenticated) {
      router.navigate('/login');
      return false;
    }
    
    return true;
  }
  
  static async requireGuest(params, router) {
    const state = userState.getState();
    
    if (state.isAuthenticated) {
      router.navigate('/dashboard');
      return false;
    }
    
    return true;
  }
}