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

/**
 * Permanently save the user's mobile number linked to their account profile.
 */
export const persistUserPhone = (emailOrId: string, phone: string): void => {
  if (typeof window === 'undefined') return;
  const cleanPhone = phone ? phone.trim() : '';
  if (!cleanPhone) return;

  localStorage.setItem('abb_user_profile_phone', cleanPhone);

  const cleanKey = emailOrId ? emailOrId.toLowerCase().trim() : '';
  if (cleanKey) {
    try {
      const map = JSON.parse(localStorage.getItem('abb_account_phones') || '{}');
      map[cleanKey] = cleanPhone;
      localStorage.setItem('abb_account_phones', JSON.stringify(map));
    } catch (e) {
      console.warn('Could not persist account phone:', e);
    }
  }
};

/**
 * Retrieve the saved phone number for the user's account profile.
 */
export const getPersistedUserPhone = (emailOrId?: string): string | null => {
  if (typeof window === 'undefined') return null;
  const current = localStorage.getItem('abb_user_profile_phone');
  if (current && current.trim()) return current.trim();

  const cleanKey = emailOrId ? emailOrId.toLowerCase().trim() : '';
  if (cleanKey) {
    try {
      const map = JSON.parse(localStorage.getItem('abb_account_phones') || '{}');
      const found = map[cleanKey];
      if (found && typeof found === 'string' && found.trim()) {
        localStorage.setItem('abb_user_profile_phone', found.trim());
        return found.trim();
      }
    } catch {}
  }
  return null;
};

