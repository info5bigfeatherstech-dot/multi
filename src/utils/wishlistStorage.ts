import { storefrontWishlistApi } from '../api';
import { isAuthenticated } from './authGuard';

/**
 * Wishlist Storage Utility
 * Manages wishlisted product IDs in localStorage for storefront shopping.
 * Synchronizes with backend for authenticated customers, and keeps header count in sync.
 */

const STORAGE_KEY = 'abb_storefront_wishlist_ids';

const isAdminRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#admin');
};

/**
 * Get all wishlisted product IDs from localStorage
 */
export const getWishlistIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
};

/**
 * Check if a product ID is wishlisted
 */
export const isItemInWishlist = (id: string | number): boolean => {
  const ids = getWishlistIds();
  return ids.includes(String(id));
};

/**
 * Synchronize wishlist IDs in localStorage and dispatch the global event to update Header badge
 */
export const syncWishlistStorage = (validIds: string[]) => {
  if (typeof window === 'undefined') return;
  const unique = Array.from(new Set(validIds.map(String).filter(Boolean)));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch (e) {
    console.warn('Could not save wishlist to localStorage', e);
  }
  window.dispatchEvent(
    new CustomEvent('abb_wishlist_change', {
      detail: { count: unique.length, ids: unique },
    })
  );
};

/**
 * Clear all wishlist items from localStorage and update badge
 */
export const clearWishlistStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch {}
  window.dispatchEvent(
    new CustomEvent('abb_wishlist_change', {
      detail: { count: 0, ids: [] },
    })
  );
};

/**
 * Toggle a product ID in wishlist. Returns true if now wishlisted, false if removed.
 * ONLY hits the backend API when explicitly called by user action, NEVER on admin!
 */
export const toggleWishlistItem = (id: string | number, slug?: string): boolean => {
  const sId = String(id);
  const current = getWishlistIds();
  const exists = current.includes(sId);
  const updated = exists ? current.filter((x) => x !== sId) : [...current, sId];
  
  syncWishlistStorage(updated);

  // Sync change with backend ONLY when explicitly toggled by an authenticated storefront customer (never on admin)
  if (isAuthenticated() && !isAdminRoute()) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(sId);
    const resolvedSlug = String(slug || (!isObjectId ? sId : '')).trim();
    if (resolvedSlug) {
      if (!exists) {
        storefrontWishlistApi.add(resolvedSlug).catch(() => {});
      } else {
        storefrontWishlistApi.remove(resolvedSlug).catch(() => {});
      }
    }
  }

  return !exists;
};

/**
 * Get total number of wishlisted items
 */
export const getWishlistCount = (): number => {
  return getWishlistIds().length;
};

/**
 * Refresh wishlist IDs from backend for logged in storefront user (read-only query)
 */
export const refreshWishlistFromBackend = async () => {
  if (!isAuthenticated() || isAdminRoute()) return;

  try {
    const backendItems = await storefrontWishlistApi.getWishlist();
    if (Array.isArray(backendItems)) {
      const backendIds: string[] = [];
      backendItems.forEach((p: any) => {
        const prod = p?.product || p;
        const id = String(prod?._id || prod?.id || p?.productId?._id || p?.productId || prod?.slug || '');
        if (id) backendIds.push(id);
      });
      syncWishlistStorage(backendIds);
    }
  } catch {
    // Non-blocking
  }
};

// Sync on module load if user is already authenticated
if (typeof window !== 'undefined') {
  if (isAuthenticated() && !isAdminRoute()) {
    refreshWishlistFromBackend();
  }
  window.addEventListener('abb_auth_change', () => {
    if (isAuthenticated() && !isAdminRoute()) {
      refreshWishlistFromBackend();
    }
  });
}
