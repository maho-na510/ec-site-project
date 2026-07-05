import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useProducts, useCategories } from '../hooks/useProducts';
import { useAddToWishlist, useIsInWishlist } from '../hooks/useWishlist';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Product, Category, ProductSortBy, Cart } from '../types';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';
import Pagination from '../components/shared/Pagination';
import { Heart } from 'lucide-react';

const SORT_OPTIONS: { value: ProductSortBy | ''; label: string }[] = [
  { value: '', label: '標準' },
  { value: 'newest', label: '新着順' },
  { value: 'price_asc', label: '価格が安い順' },
  { value: 'price_desc', label: '価格が高い順' },
  { value: 'name', label: '名前順' },
];

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState(searchParams.get('search') || '');

  // URLパラメータから初期値を取得
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const sortBy = (searchParams.get('sortBy') as ProductSortBy) || undefined;

  // URLパラメータが変わったらページをリセット & inputを同期
  useEffect(() => {
    setPage(1);
    setInputValue(searchParams.get('search') || '');
  }, [searchParams.get('search'), searchParams.get('categoryId'), searchParams.get('sortBy')]);

  const { data, isLoading, error } = useProducts({
    page,
    perPage: 12,
    search: search || undefined,
    categoryId,
    sortBy,
  });

  const { data: categoriesData } = useCategories();
  const { cart, addToCart } = useCart();

  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : [];
  const allProducts: Product[] = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete('page');
    setSearchParams(next);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', inputValue.trim() || null);
  };

  const handleClearSearch = () => {
    setInputValue('');
    updateParam('search', null);
  };

  const handleCategorySelect = (id: number | null) => {
    updateParam('categoryId', id ? String(id) : null);
  };

  const handleSortChange = (value: string) => {
    updateParam('sortBy', value || null);
  };

  const hasActiveFilters = !!(search || categoryId || sortBy);

  const handleClearAll = () => {
    setInputValue('');
    setSearchParams({});
    setPage(1);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ページヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {search ? `「${search}」の検索結果` : '商品一覧'}
          </h1>
          {pagination && (
            <p className="text-sm text-gray-500 mt-1">{pagination.total} 件</p>
          )}
        </div>

        {/* 検索バー */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-5">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="商品名・キーワードで検索..."
              className="w-full pl-9 pr-9 py-2.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition"
          >
            検索
          </button>
        </form>

        {/* フィルターバー */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* カテゴリ */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                !categoryId
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              すべて
            </button>
            {categories.map((cat: Category) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                  categoryId === cat.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 並び替え */}
          <div className="flex items-center gap-1.5 ml-auto">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy || ''}
              onChange={(e) => handleSortChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* フィルタークリア */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition px-2"
            >
              <X className="w-3 h-3" />
              絞り込みをリセット
            </button>
          )}
        </div>

        {/* 商品グリッド */}
        {isLoading ? (
          <LoadingSpinner message="読み込み中..." />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">商品の読み込みに失敗しました</p>
          </div>
        ) : allProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">
              {search ? `「${search}」に一致する商品が見つかりませんでした` : '商品が見つかりませんでした'}
            </p>
            <Link to="/">
              <Button variant="outline">ホームに戻る</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {allProducts.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cart={cart}
                  onAddToCart={() => addToCart(product.id, 1)}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ---- 商品カード ----
interface ProductCardProps {
  product: Product;
  cart: Cart | null;
  onAddToCart: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, cart, onAddToCart }) => {
  const mainImage = product.images?.[0]?.imageUrl || '/placeholder-product.jpg';
  const quantityInCart = cart?.items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const remainingStock = product.stockQuantity - quantityInCart;
  const isOutOfStock = remainingStock <= 0;
  const isAvailable = product.isActive && !product.isSuspended && !isOutOfStock;
  const { isAuthenticated } = useAuth();
  const addToWishlist = useAddToWishlist();
  const isInWishlist = useIsInWishlist(product.id);

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col border border-gray-100">
      <Link to={`/products/${product.id}`} className="block relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-3 py-1 rounded-lg text-xs font-semibold">
              {product.isSuspended ? '販売停止中' : '在庫切れ'}
            </span>
          </div>
        )}
        {isAuthenticated && (
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!isInWishlist) addToWishlist.mutate(product.id);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full bg-white shadow transition
              ${isInWishlist ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
          >
            <Heart className="w-4 h-4" fill={isInWishlist ? 'currentColor' : 'none'} />
          </button>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        {product.category && (
          <p className="text-xs text-gray-400 mb-1">{product.category.name}</p>
        )}
        <Link to={`/products/${product.id}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto">
          <p className="text-base font-bold text-blue-600 mb-2">{formatCurrency(product.price)}</p>
          {isAvailable && product.stockQuantity <= 10 && (
            <p className="text-xs text-orange-500 mb-2">残りわずか（{product.stockQuantity}点）</p>
          )}
          <button
            onClick={onAddToCart}
            disabled={!isAvailable}
            className={`w-full py-2 rounded-lg text-sm font-medium transition ${
              isAvailable
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {product.isSuspended ? '販売停止中' : isOutOfStock ? '在庫切れ' : 'カートに追加'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
