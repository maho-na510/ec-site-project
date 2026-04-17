import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist, useRemoveFromWishlist } from '../hooks/useWishlist';
import { useCart } from '../contexts/CartContext';
import { WishlistItem } from '../types';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';

const WishlistPage: React.FC = () => {
  const { data: wishlist, isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { addItem } = useCart();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  const items = wishlist || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-7 h-7 text-red-500" fill="currentColor" />
        <h1 className="text-2xl font-bold text-gray-900">ほしい物リスト</h1>
        <span className="text-sm text-gray-500 font-normal">({items.length}件)</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-6">ほしい物リストは空です</p>
          <Link to="/products">
            <Button>商品を探す</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onRemove={() => removeFromWishlist.mutate(item.productId)}
              onAddToCart={() => {
                const product = item.product;
                if (product.isActive && !product.isSuspended && product.stockQuantity > 0) {
                  addItem(item.productId, 1);
                }
              }}
              onNavigate={() => navigate(`/products/${item.productId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface WishlistCardProps {
  item: WishlistItem;
  onRemove: () => void;
  onAddToCart: () => void;
  onNavigate: () => void;
}

const WishlistCard: React.FC<WishlistCardProps> = ({ item, onRemove, onAddToCart, onNavigate }) => {
  const product = item.product;
  const mainImage = product.images?.[0]?.imageUrl || '/placeholder-product.jpg';
  const isAvailable = product.isActive && !product.isSuspended && product.stockQuantity > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* 画像 */}
      <div
        className="relative aspect-square bg-gray-100 cursor-pointer overflow-hidden group"
        onClick={onNavigate}
      >
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-3 py-1 rounded-lg text-sm font-semibold">在庫切れ</span>
          </div>
        )}
      </div>

      {/* 情報 */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-1">{product.category?.name}</p>
        <h3
          className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 cursor-pointer hover:text-blue-600 transition"
          onClick={onNavigate}
        >
          {product.name}
        </h3>
        <p className="text-lg font-bold text-blue-600 mb-4">{formatCurrency(product.price)}</p>

        {isAvailable && product.stockQuantity <= 10 && (
          <p className="text-xs text-orange-600 font-medium mb-2">残りわずか（{product.stockQuantity}点）</p>
        )}

        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            onClick={onAddToCart}
            disabled={!isAvailable}
            className="flex-1 flex items-center justify-center gap-1"
          >
            <ShoppingCart className="w-4 h-4" />
            カートに追加
          </Button>
          <button
            onClick={onRemove}
            className="p-2 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-400 transition"
            aria-label="リストから削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
