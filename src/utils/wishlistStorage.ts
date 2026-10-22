/**
 * Wishlist Storage Utility
 * Manages wishlisted product IDs in localStorage so both guest users and logged-in users
 * can add, remove, and view wishlisted items without being forced to log in.
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
export const toggleWishlistItem = (id: string | number): boolean => {
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

  return !exists;
};

/**
 * Get total number of wishlisted items
 */
export const getWishlistCount = (): number => {
  return getWishlistIds().length;
};
