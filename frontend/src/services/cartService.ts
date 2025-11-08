import { userApi } from './api';
import { Cart, CartItem } from '@types/index';

export const cartService = {
  async getCart(): Promise<Cart> {
    const response = await userApi.get<Cart>('/cart');
    return response.data;
  },

  async addItem(productId: number, quantity: number): Promise<Cart> {
    const response = await userApi.post<Cart>('/cart/items', {
      productId,
      quantity,
    });
    return response.data;
  },

  async updateItem(itemId: number, quantity: number): Promise<Cart> {
    const response = await userApi.put<Cart>(`/cart/items/${itemId}`, {
      quantity,
    });
    return response.data;
  },

  async removeItem(itemId: number): Promise<Cart> {
    const response = await userApi.delete<Cart>(`/cart/items/${itemId}`);
    return response.data;
  },

  async clearCart(): Promise<{ message: string }> {
    const response = await userApi.delete('/cart');
    return response.data;
  },

  calculateSubtotal(items: CartItem[]): number {
    return items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  },

  calculateTotal(items: CartItem[], shipping = 0, tax = 0): number {
    const subtotal = this.calculateSubtotal(items);
    return subtotal + shipping + tax;
  },
};
