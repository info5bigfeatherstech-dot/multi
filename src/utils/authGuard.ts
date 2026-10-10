/**
 * Auth Guard Utility
 * Fires a custom DOM event to open the AuthModal from anywhere in the app.
 * App.tsx listens for this event and opens the modal with an optional message.
 */

export interface RequireAuthEventDetail {
  message?: string;
  redirectTo?: string;
}

/**
 * Check if the current user is authenticated.
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('user_access_token'));
};

/**
 * Fire an event to request the auth modal to open.
 * Any component can call this without needing direct access to the modal.
 */
export const requireAuth = (detail?: RequireAuthEventDetail): void => {
  window.dispatchEvent(
    new CustomEvent<RequireAuthEventDetail>('abb_require_auth', {
      detail: detail || {},
    })
  );
};

/**
 * Run an action only if the user is authenticated.
 * If not, fires the auth modal event and returns false.
 */
export const withAuth = (
  action: () => void,
  message?: string
): boolean => {
  if (isAuthenticated()) {
    action();
    return true;
  }
  requireAuth({ message });
  return false;
};
