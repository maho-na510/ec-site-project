import { userApi } from './api';
import { WishlistItem } from '@app-types/index';

export const wishlistService = {
  async getWishlist(): Promise<WishlistItem[]> {
    const response = await userApi.get<WishlistItem[]>('/wishlist/items');
    return response.data;
  },

  async addToWishlist(productId: number): Promise<WishlistItem> {
    const response = await userApi.post<WishlistItem>('/wishlist/items', { product_id: productId });
    return response.data;
  },

  async removeFromWishlist(productId: number): Promise<void> {
    await userApi.delete(`/wishlist/items/${productId}`);
  },
};
