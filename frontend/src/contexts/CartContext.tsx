import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Cart, CartItem } from '@types/index';
import { cartService } from '@services/cartService';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, isAdmin } = useAuth();

  // Load cart when user logs in
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, isAdmin]);

  const refreshCart = async () => {
    if (!isAuthenticated || isAdmin) return;

    setIsLoading(true);
    try {
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: number, quantity: number) => {
    setIsLoading(true);
    try {
      const updatedCart = await cartService.addItem(productId, quantity);
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    setIsLoading(true);
    try {
      const updatedCart = await cartService.updateItem(itemId, quantity);
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setIsLoading(true);
    try {
      const updatedCart = await cartService.removeItem(itemId);
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      await cartService.clearCart();
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  const itemCount = cart?.items.reduce((count, item) => count + item.quantity, 0) || 0;
  const subtotal = cart ? cartService.calculateSubtotal(cart.items) : 0;

  const value: CartContextType = {
    cart,
    itemCount,
    subtotal,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
