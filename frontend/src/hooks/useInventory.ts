import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, InventoryAdjustmentData } from '@services/inventoryService';

export const useInventoryLogs = (productId?: number, page = 1, perPage = 50) => {
  return useQuery({
    queryKey: ['inventory', 'logs', productId, page, perPage],
    queryFn: () => inventoryService.getInventoryLogs(productId, page, perPage),
  });
};

export const useLowStockProducts = (threshold = 10) => {
  return useQuery({
    queryKey: ['inventory', 'low-stock', threshold],
    queryFn: () => inventoryService.getLowStockProducts(threshold),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InventoryAdjustmentData) => inventoryService.adjustStock(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'logs'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'low-stock'] });
    },
  });
};

export const useDownloadInventoryReport = () => {
  return useMutation({
    mutationFn: (date?: string) => inventoryService.downloadInventoryReport(date),
  });
};
