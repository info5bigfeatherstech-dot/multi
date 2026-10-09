import React, { createContext, useContext, useState, useEffect } from 'react';
import { storefrontCartApi } from '../api';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  image: string;
  qty: number;
  category: string;
}

interface AddProductInput {
  id: string;
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
  addToCart: (product: AddProductInput, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  totalOriginal: number;
  totalSavings: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: 'prod-1',
    title: 'Tri-Ply Heavy Bottom Stainless Steel Induction Pressure Cooker 3L',
    price: 399,
    originalPrice: 899,
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=400&q=80',
    qty: 1,
    category: 'Home & Kitchen',
  },
  {
    id: 'prod-2',
    title: 'True Wireless Magnetic Touch Bluetooth Earbuds with Digital Display',
    price: 248,
    originalPrice: 799,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80',
    qty: 1,
    category: 'Smart Gadgets',
  },
];

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
    return INITIAL_CART_ITEMS;
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
    const syncBackendCart = () => {
      const token = localStorage.getItem('user_access_token');
      if (!token) return;

      storefrontCartApi.getCart()
        .then((res) => {
          const items = res?.items || res;
          if (Array.isArray(items) && items.length > 0) {
            const apiItems = items.map((i: any) => ({
              id: i.productId || i.id,
              title: i.title || 'Cart Item',
              price: i.price || 0,
              originalPrice: i.originalPrice || i.price * 1.5,
              image: i.image || '',
              qty: i.quantity || i.qty || 1,
              category: i.category || 'General',
            }));
            setCartItems(apiItems);
          }
        })
        .catch(() => {
          // Token invalid or offline, fallback safely to local cart
        });
    };

    syncBackendCart();
    window.addEventListener('abb_auth_change', syncBackendCart);
    return () => {
      window.removeEventListener('abb_auth_change', syncBackendCart);
    };
  }, []);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = (product: AddProductInput, qty = 1) => {
    const itemPrice = product.currentPrice ?? product.price ?? 0;
    const itemOriginalPrice = product.originalPrice ?? itemPrice * 1.5;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          price: itemPrice,
          originalPrice: itemOriginalPrice,
          image: product.image,
          qty,
          category: product.category || 'General',
        },
      ];
    });

    // Call storefrontCartApi in background
    storefrontCartApi.addItem(product.id, qty).catch(() => {});

    // Automatically slide drawer open when item is added!
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    storefrontCartApi.removeItem(id).catch(() => {});
  };

  const updateQty = (id: string, delta: number) => {
    let finalQty = 1;
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            finalQty = newQty;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );

    if (finalQty > 0) {
      storefrontCartApi.updateQuantity(id, finalQty).catch(() => {});
    } else {
      storefrontCartApi.removeItem(id).catch(() => {});
    }
  };

  const clearCart = () => {
    setCartItems([]);
    storefrontCartApi.clearCart().catch(() => {});
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
