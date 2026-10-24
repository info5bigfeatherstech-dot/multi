import { storefrontWishlistApi } from '../api';
import { isAuthenticated } from './authGuard';

/**
 * Wishlist Storage Utility
 * Manages wishlisted product IDs in localStorage so guest users can wishlist items,
 * and seamlessly merges guest wishlist with backend wishlist upon login.
 */

const STORAGE_KEY = 'abb_storefront_wishlist_ids';

/**
 * Get all wishlisted product IDs from localStorage
 */
export const getWishlistIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
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

  // If user is authenticated, sync change with backend
  if (isAuthenticated()) {
    if (!exists) {
      storefrontWishlistApi.toggle(sId, slug).catch(() => {});
    } else {
      storefrontWishlistApi.remove(slug || sId).catch(() => {});
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
 * Sync guest wishlist from localStorage with backend account wishlist
 */
export const syncWishlistWithBackend = async () => {
  if (!isAuthenticated()) return;

  try {
    const localIds = getWishlistIds();
    const backendItems = await storefrontWishlistApi.getWishlist();

    const backendIds: string[] = [];
    if (Array.isArray(backendItems)) {
      backendItems.forEach((p: any) => {
        const id = String(p.productId?._id || p.productId || p._id || p.id || '');
        if (id) backendIds.push(id);
      });
    }

    // Merge guest local IDs and backend IDs
    const mergedIds = Array.from(new Set([...localIds, ...backendIds]));

    // Update localStorage with merged list
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedIds));

    // Push any guest items that were not on backend yet
    for (const localId of localIds) {
      if (!backendIds.includes(localId)) {
        storefrontWishlistApi.toggle(localId).catch(() => {});
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('abb_wishlist_change', {
          detail: { count: mergedIds.length },
        })
      );
    }
  } catch (err) {
    console.warn('Wishlist backend sync note:', err);
  }
};

// Automatically sync on initial load and whenever auth state changes (login)
if (typeof window !== 'undefined') {
  syncWishlistWithBackend();
  window.addEventListener('abb_auth_change', syncWishlistWithBackend);
}
