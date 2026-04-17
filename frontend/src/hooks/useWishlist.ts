import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '@services/wishlistService';
import { useAuth } from '../contexts/AuthContext';

export const useWishlist = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistService.getWishlist(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => wishlistService.addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => wishlistService.removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

// 特定の商品がほしい物リストに入っているか確認するフック
export const useIsInWishlist = (productId: number) => {
  const { data: wishlist } = useWishlist();
  return wishlist?.some((item) => item.productId === productId) ?? false;
};
