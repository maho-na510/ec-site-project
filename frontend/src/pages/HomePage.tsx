import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Trophy, Search } from 'lucide-react';
import { useProducts, usePopularProducts, useCategories } from '../hooks/useProducts';
import { useAddToWishlist, useIsInWishlist } from '../hooks/useWishlist';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Product, Category } from '../types';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';

// カテゴリ表示上限
const CATEGORY_DISPLAY_LIMIT = 5;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: newArrivalsData, isLoading: loadingNew } = useProducts({ page: 1, perPage: 6, sortBy: 'newest' });
  const { data: popularProducts, isLoading: loadingPopular } = usePopularProducts(10);
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loadingNew || loadingPopular || loadingCategories) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  const newArrivals = newArrivalsData?.data || [];
  const popular = popularProducts || [];
  const allCategories = categories || [];
  const displayedCategories = showAllCategories ? allCategories : allCategories.slice(0, CATEGORY_DISPLAY_LIMIT);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-10 text-center mb-10 text-white">
        <h1 className="text-4xl font-bold mb-3">mahozonへようこそ</h1>
        <p className="text-lg opacity-90 mb-6">きっとお気に入りが見つかる。こだわりのラインナップ</p>
        <form onSubmit={handleSearch} className="flex items-center max-w-xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="商品名・キーワードで検索..."
            className="flex-1 px-5 py-3 rounded-l-full text-gray-900 text-sm outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-6 py-3 rounded-r-full transition"
          >
            <Search className="w-4 h-4" />
            検索
          </button>
        </form>
      </div>

      {/* ① 新入荷 */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-7 bg-blue-600 rounded-full inline-block" />
            新入荷
          </h2>
          <Link to="/products?sortBy=newest">
            <Button variant="outline" size="sm">すべて見る</Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} compact />
          ))}
        </div>
      </section>

      {/* ② 購入人気ランキングTOP10 */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            購入人気ランキング TOP10
          </h2>
          <Link to="/products">
            <Button variant="outline" size="sm">すべて見る</Button>
          </Link>
        </div>
        <RankingSlider products={popular} />
      </section>

      {/* ③ カテゴリ一覧 */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-7 bg-green-500 rounded-full inline-block" />
            カテゴリから探す
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {displayedCategories.map((cat) => (
            <CategoryButton key={cat.id} category={cat} />
          ))}
          {!showAllCategories && allCategories.length > CATEGORY_DISPLAY_LIMIT && (
            <button
              onClick={() => setShowAllCategories(true)}
              className="px-5 py-2.5 rounded-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition text-sm font-medium"
            >
              すべてのカテゴリを見る ({allCategories.length - CATEGORY_DISPLAY_LIMIT}+)
            </button>
          )}
          {showAllCategories && (
            <button
              onClick={() => setShowAllCategories(false)}
              className="px-5 py-2.5 rounded-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 transition text-sm font-medium"
            >
              閉じる
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

// ---- カテゴリボタン ----
const CategoryButton: React.FC<{ category: Category }> = ({ category }) => (
  <Link
    to={`/products?categoryId=${category.id}`}
    className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-300 text-sm font-medium text-gray-700 transition"
  >
    {category.name}
  </Link>
);

// ---- ランキングスライダー ----
const RankingSlider: React.FC<{ products: Product[] }> = ({ products }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (products.length === 0) {
    return <p className="text-gray-500 text-sm">データを集計中です...</p>;
  }

  return (
    <div className="relative group">
      {/* 左矢印 */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition hover:bg-gray-50"
        aria-label="前へ"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* スライダー本体 */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product, index) => (
          <div key={product.id} className="flex-none w-56">
            <ProductCard product={product} rank={index + 1} />
          </div>
        ))}
      </div>

      {/* 右矢印 */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition hover:bg-gray-50"
        aria-label="次へ"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
};

// ---- 商品カード ----
interface ProductCardProps {
  product: Product;
  rank?: number;
  compact?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, rank, compact }) => {
  const mainImage = product.images?.[0]?.imageUrl || '/placeholder-product.jpg';
  const isOutOfStock = product.stockQuantity === 0;
  const isAvailable = product.isActive && !product.isSuspended && !isOutOfStock;
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const addToWishlist = useAddToWishlist();
  const isInWishlist = useIsInWishlist(product.id);
  const navigate = useNavigate();

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isInWishlist) addToWishlist.mutate(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isAvailable) addToCart(product.id, 1);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 flex flex-col"
    >
      {/* 画像 */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {rank && (
          <div className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow
            ${rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-400' : rank === 3 ? 'bg-amber-600' : 'bg-blue-500'}`}>
            {rank}
          </div>
        )}
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
        {/* ほしい物リストボタン */}
        {isAuthenticated && (
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 p-1.5 rounded-full bg-white shadow transition
              ${isInWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
            aria-label="ほしい物リストに追加"
          >
            <Heart className="w-4 h-4" fill={isInWishlist ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* 情報 */}
      <div className={`${compact ? 'p-2' : 'p-3'} flex flex-col flex-1`}>
        <h3 className={`font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors ${compact ? 'text-xs mb-1' : 'text-sm mb-2'}`}>
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-1">
          <span className={`font-bold text-blue-600 ${compact ? 'text-sm' : 'text-base'}`}>
            {formatCurrency(product.price)}
          </span>
          {!compact && isAvailable && (
            <button
              onClick={handleAddToCart}
              className="p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
              aria-label="カートに追加"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
        {!compact && isAvailable && product.stockQuantity <= 10 && (
          <span className="text-xs text-orange-600 font-medium mt-1">残りわずか</span>
        )}
      </div>
    </Link>
  );
};

export default HomePage;
