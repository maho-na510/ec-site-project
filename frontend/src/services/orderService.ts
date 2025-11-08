import { userApi } from './api';
import { Order, CheckoutFormData, PaginatedResponse } from '@types/index';

export const orderService = {
  async createOrder(data: CheckoutFormData): Promise<Order> {
    const response = await userApi.post<Order>('/orders', data);
    return response.data;
  },

  async getOrders(page = 1, perPage = 20): Promise<PaginatedResponse<Order>> {
    const response = await userApi.get<PaginatedResponse<Order>>('/orders', {
      params: { page, perPage },
    });
    return response.data;
  },

  async getOrderById(id: number): Promise<Order> {
    const response = await userApi.get<Order>(`/orders/${id}`);
    return response.data;
  },

  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await userApi.get<Order>(`/orders/number/${orderNumber}`);
    return response.data;
  },

  async reorder(orderId: number): Promise<{ message: string; cartItemsAdded: number }> {
    const response = await userApi.post(`/orders/${orderId}/reorder`);
    return response.data;
  },
};
