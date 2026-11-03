import { storefrontWishlistApi } from '../api';
import { isAuthenticated } from './authGuard';

/**
 * Wishlist Storage Utility
 * Manages wishlisted product IDs in localStorage for storefront shopping.
 * Backend wishlist APIs are ONLY hit when the user explicitly clicks the heart/wishlist button!
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
 * Toggle a product ID in wishlist. Returns true if now wishlisted, false if removed.
 * ONLY hits the backend API when explicitly called by user action, NEVER on page load or on admin!
 */
export const toggleWishlistItem = (id: string | number, slug?: string): boolean => {
  const sId = String(id);
  const current = getWishlistIds();
  const exists = current.includes(sId);
  const updated = exists ? current.filter((x) => x !== sId) : [...current, sId];
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save wishlist to localStorage', e);
  }

  // Dispatch custom event so any mounted component updates immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('abb_wishlist_change', {
        detail: { id: sId, isWishlisted: !exists, count: updated.length },
      })
    );
  }

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
 * Never auto-spams POST /wishlist/add!
 */
export const refreshWishlistFromBackend = async () => {
  if (!isAuthenticated() || isAdminRoute()) return;

  try {
    const backendItems = await storefrontWishlistApi.getWishlist();
    if (Array.isArray(backendItems)) {
      const backendIds: string[] = [];
      backendItems.forEach((p: any) => {
        const id = String(p.productId?._id || p.productId || p._id || p.id || '');
        if (id) backendIds.push(id);
      });
      const localIds = getWishlistIds();
      const mergedIds = Array.from(new Set([...localIds, ...backendIds]));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedIds));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('abb_wishlist_change', {
            detail: { count: mergedIds.length },
          })
        );
      }
    }
  } catch {
    // Non-blocking
  }
};

// DO NOT auto-sync or blast POST /wishlist/add on initial page load or import!
// Only refresh count on explicit customer auth change
if (typeof window !== 'undefined') {
  window.addEventListener('abb_auth_change', () => {
    if (isAuthenticated() && !isAdminRoute()) {
      refreshWishlistFromBackend();
    }
  });
}
