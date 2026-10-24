import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { storefrontCartApi } from '../api';
import { isAuthenticated } from '../utils/authGuard';

export interface CartItem {
  id: string;
  cartItemId?: string;
  productId?: string;
  variantId?: string;
  slug?: string;
  title: string;
  price: number;
  originalPrice: number;
  image: string;
  qty: number;
  category: string;
}

interface AddProductInput {
  id: string;
  slug?: string;
  title: string;
  currentPrice?: number;
  price?: number;
  originalPrice?: number;
  image: string;
  category?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (product: AddProductInput, qty?: number, options?: { silent?: boolean }) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  totalOriginal: number;
  totalSavings: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const extractCartItemImage = (i: any): string => {
  if (!i) return '';
  const prod = i.product || (typeof i.productId === 'object' ? i.productId : null) || {};
  const variantId = String(i.variantId?._id || i.variantId || '');

  // 1. Variant matching variantId inside product.variants
  const variants = Array.isArray(prod.variants) ? prod.variants : [];
  const matchedVariant = variants.find((v: any) => String(v._id || v.id) === variantId) || variants[0] || i.variant || {};

  if (Array.isArray(matchedVariant.images) && matchedVariant.images.length > 0) {
    const firstImg = matchedVariant.images[0];
    if (typeof firstImg === 'string' && firstImg.trim()) return firstImg.trim();
    if (firstImg?.url && typeof firstImg.url === 'string' && firstImg.url.trim()) return firstImg.url.trim();
  }

  // 2. First variant images
  if (variants[0] && Array.isArray(variants[0].images) && variants[0].images.length > 0) {
    const firstImg = variants[0].images[0];
    if (typeof firstImg === 'string' && firstImg.trim()) return firstImg.trim();
    if (firstImg?.url && typeof firstImg.url === 'string' && firstImg.url.trim()) return firstImg.url.trim();
  }

  // 3. Product SEO og_image
  if (prod.seo?.og_image && typeof prod.seo.og_image === 'string' && prod.seo.og_image.trim()) {
    return prod.seo.og_image.trim();
  }

  // 4. Product cardImage
  if (prod.cardImage?.url && typeof prod.cardImage.url === 'string') {
    return prod.cardImage.url.trim();
  }

  // 5. Product images array
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    const firstImg = prod.images[0];
    if (typeof firstImg === 'string' && firstImg.trim()) return firstImg.trim();
    if (firstImg?.url && typeof firstImg.url === 'string' && firstImg.url.trim()) return firstImg.url.trim();
  }

  // 6. Direct image strings
  if (typeof prod.image === 'string' && prod.image.trim()) return prod.image.trim();
  if (typeof i.image === 'string' && i.image.trim()) return i.image.trim();

  return '';
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('apna_bharat_cart');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apna_bharat_cart', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  // Sync with backend cart if authenticated
  useEffect(() => {
    const syncBackendCart = async (isAuthChange = false) => {
      const token = localStorage.getItem('user_access_token') || localStorage.getItem('user_refresh_token');
      if (!token) return;

      // When newly logging in, merge any guest cart items that were added while unauthenticated
      if (isAuthChange) {
        try {
          const guestRaw = localStorage.getItem('apna_bharat_guest_cart');
          if (guestRaw) {
            const guestList: Array<{ id: string; slug?: string; qty: number }> = JSON.parse(guestRaw);
            localStorage.removeItem('apna_bharat_guest_cart');
            for (const g of guestList) {
              if (g?.id) {
                await storefrontCartApi.addItem(g.id, g.qty || 1, undefined, g.slug).catch(() => {});
              }
            }
          }
        } catch {
          // ignore
        }
      }

      // Fetch official cart state from backend (Source of Truth)
      storefrontCartApi.getCart()
        .then((res) => {
          const rawItems = res?.cart?.items || res?.items || (Array.isArray(res) ? res : []);
          const apiItems: CartItem[] = Array.isArray(rawItems) ? rawItems.map((i: any) => {
            const prod = i.product || (typeof i.productId === 'object' ? i.productId : null) || {};
            const variant = i.variant || {};
            const cartItemId = String(i._id || '');
            const productId = String(i.productId?._id || i.productId || prod._id || '');
            const variantId = String(i.variantId?._id || i.variantId || variant._id || prod.variants?.[0]?._id || '');
            const slug = prod.slug || i.slug || '';
            const id = productId || slug || cartItemId || String(i.id || '');
            const title = prod.title || prod.name || i.title || 'Cart Item';
            const price = i.price?.current ?? i.price?.base ?? (typeof i.price === 'number' ? i.price : 0);
            const originalPrice = i.price?.base ?? (typeof i.originalPrice === 'number' ? i.originalPrice : price * 1.5);
            const image = extractCartItemImage(i) || prod.image || i.image || '';
            const qty = i.quantity || i.qty || 1;
            let category = prod.category?.name || prod.category || i.category || 'General';
            if (typeof category === 'string' && /^[0-9a-fA-F]{24}$/.test(category)) {
              category = 'Audio & Electronics';
            }
            return { id, cartItemId, productId, variantId, slug, title, price, originalPrice, image, qty, category };
          }).filter((it) => it.id) : [];

          setCartItems(apiItems);
          try {
            localStorage.setItem('apna_bharat_cart', JSON.stringify(apiItems));
          } catch {}
        })
        .catch(() => {
          // Fallback safely to existing local cart on offline/network errors
        });
    };

    syncBackendCart(false);

    const handleAuthChange = () => syncBackendCart(true);
    window.addEventListener('abb_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('abb_auth_change', handleAuthChange);
    };
  }, []);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = (product: AddProductInput, qty = 1, options?: { silent?: boolean }) => {
    const itemPrice = product.currentPrice ?? product.price ?? 0;
    const itemOriginalPrice = product.originalPrice ?? itemPrice * 1.5;

    let category = product.category || 'General';
    if (typeof category === 'string' && /^[0-9a-fA-F]{24}$/.test(category)) {
      category = 'Audio & Electronics';
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => 
        item.id === product.id || 
        (product.slug && item.slug === product.slug) ||
        (item.title && product.title && item.title.trim().toLowerCase() === product.title.trim().toLowerCase())
      );
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          productId: /^[0-9a-fA-F]{24}$/.test(product.id) ? product.id : undefined,
          slug: product.slug,
          title: product.title,
          price: itemPrice,
          originalPrice: itemOriginalPrice,
          image: product.image,
          qty,
          category,
        },
      ];
    });

    if (isAuthenticated()) {
      storefrontCartApi.addItem(product.id, qty, undefined, product.slug)
        .then((res) => {
          const rawItems = res?.cart?.items || res?.items;
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const apiItems: CartItem[] = rawItems.map((i: any) => {
              const prod = i.product || (typeof i.productId === 'object' ? i.productId : null) || {};
              const variant = i.variant || {};
              const cartItemId = String(i._id || '');
              const productId = String(i.productId?._id || i.productId || prod._id || '');
              const variantId = String(i.variantId?._id || i.variantId || variant._id || prod.variants?.[0]?._id || '');
              const slug = prod.slug || i.slug || '';
              const id = productId || slug || cartItemId || String(i.id || '');
              const title = prod.title || prod.name || i.title || 'Cart Item';
              const price = i.price?.current ?? i.price?.base ?? (typeof i.price === 'number' ? i.price : 0);
              const originalPrice = i.price?.base ?? (typeof i.originalPrice === 'number' ? i.originalPrice : price * 1.5);
              const image = extractCartItemImage(i) || prod.image || i.image || '';
              const itemQty = i.quantity || i.qty || 1;
              let cat = prod.category?.name || prod.category || i.category || 'General';
              if (typeof cat === 'string' && /^[0-9a-fA-F]{24}$/.test(cat)) {
                cat = 'Audio & Electronics';
              }
              return { id, cartItemId, productId, variantId, slug, title, price, originalPrice, image, qty: itemQty, category: cat };
            }).filter((it) => it.id);

            setCartItems(apiItems);
            try {
              localStorage.setItem('apna_bharat_cart', JSON.stringify(apiItems));
            } catch {}
          }
        })
        .catch(() => {});
    } else {
      // Record unmerged guest item so it can merge on future login
      try {
        const guestSaved = localStorage.getItem('apna_bharat_guest_cart');
        const guestList: any[] = guestSaved ? JSON.parse(guestSaved) : [];
        const existingIdx = guestList.findIndex((g) => g.id === product.id || (product.slug && g.slug === product.slug));
        if (existingIdx !== -1) {
          guestList[existingIdx].qty += qty;
        } else {
          guestList.push({ id: product.id, slug: product.slug, qty });
        }
        localStorage.setItem('apna_bharat_guest_cart', JSON.stringify(guestList));
      } catch {}
    }

    // Show toaster notification without opening the drawer
    if (!options?.silent) {
      const displayTitle = product.title 
        ? (product.title.length > 36 ? `${product.title.slice(0, 36)}...` : product.title)
        : 'Product';
      toast.success(`${displayTitle} added to cart!`, {
        id: `cart-add-${product.id}`,
        position: 'bottom-right',
      });
    }
  };

  const removeFromCart = (id: string) => {
    let targetItem: CartItem | undefined;
    setCartItems((prev) => {
      targetItem = prev.find((item) => item.id === id || item.cartItemId === id || item.productId === id);
      return prev.filter((item) => item.id !== id && item.cartItemId !== id && item.productId !== id);
    });

    if (isAuthenticated() && targetItem) {
      const prodId = targetItem.productId || targetItem.id;
      const varId = targetItem.variantId;
      storefrontCartApi.removeItem({ productId: prodId, variantId: varId }).catch(() => {});
    }
  };

  const updateQty = (id: string, delta: number) => {
    let finalQty = 1;
    let targetItem: CartItem | undefined;

    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id || item.cartItemId === id || item.productId === id) {
            targetItem = item;
            const newQty = item.qty + delta;
            finalQty = newQty;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );

    if (isAuthenticated() && targetItem) {
      const prodId = targetItem.productId || targetItem.id;
      const varId = targetItem.variantId;
      if (finalQty > 0) {
        storefrontCartApi.updateQuantity({
          productId: prodId,
          variantId: varId,
          quantity: finalQty
        }).catch(() => {});
      } else {
        storefrontCartApi.removeItem({
          productId: prodId,
          variantId: varId
        }).catch(() => {});
      }
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (isAuthenticated()) {
      storefrontCartApi.clearCart().catch(() => {});
    }
  };

  const totalCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalOriginal = cartItems.reduce(
    (acc, item) => acc + item.originalPrice * item.qty,
    0
  );
  const totalSavings = totalOriginal - subtotal;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        totalCount,
        subtotal,
        totalOriginal,
        totalSavings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
