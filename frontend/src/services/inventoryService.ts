import { adminApi } from './api';
import { InventoryLog, InventoryActionType, PaginatedResponse } from '@types/index';

export interface InventoryAdjustmentData {
  productId: number;
  quantityChange: number;
  actionType: InventoryActionType;
  notes?: string;
}

export const inventoryService = {
  async adjustStock(data: InventoryAdjustmentData): Promise<{ message: string; newQuantity: number }> {
    const response = await adminApi.post('/inventory/adjust', data);
    return response.data;
  },

  async getInventoryLogs(
    productId?: number,
    page = 1,
    perPage = 50
  ): Promise<PaginatedResponse<InventoryLog>> {
    const response = await adminApi.get<PaginatedResponse<InventoryLog>>('/inventory/logs', {
      params: { productId, page, perPage },
    });
    return response.data;
  },

  async getLowStockProducts(threshold = 10): Promise<PaginatedResponse<any>> {
    const response = await adminApi.get('/inventory/low-stock', {
      params: { threshold },
    });
    return response.data;
  },

  async downloadInventoryReport(date?: string): Promise<Blob> {
    const response = await adminApi.get('/inventory/reports/download', {
      params: { date },
      responseType: 'blob',
    });
    return response.data;
  },
};
