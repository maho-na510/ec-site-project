import React from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';

const HomePage: React.FC = () => {
  const { data, isLoading, error } = useProducts({ page: 1, perPage: 8 });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold text-error mb-4">エラーが発生しました</h2>
        <p className="text-secondary-600">
          {error instanceof Error ? error.message : 'エラーが発生しました'}
        </p>
      </div>
    );
  }

  const products = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-secondary-900 mb-4">
          ECサイトへようこそ
        </h1>
        <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
          あなたの信頼できるオンラインショッピング
        </p>
      </div>

      {/* Featured Products Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900">注目の商品</h2>
          <Link to="/products">
            <Button variant="outline" size="sm">
              すべての商品を見る
            </Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-600">商品が見つかりませんでした</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-primary-50 rounded-lg p-8 text-center mt-12">
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">
          始める
        </h2>
        <p className="text-secondary-600 mb-6">
          カテゴリーから探す
        </p>
        <Link to="/products">
          <Button size="lg">すべての商品を見る</Button>
        </Link>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const mainImage = product.images?.[0]?.imageUrl || '/placeholder-product.jpg';
  const isOutOfStock = product.stockQuantity === 0;
  const isAvailable = product.isActive && !product.isSuspended && !isOutOfStock;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-secondary-100 overflow-hidden">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-secondary-900 px-4 py-2 rounded-lg font-semibold">
              {isOutOfStock ? '在庫切れ' : '在庫切れ'}
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-secondary-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary-600">
            {formatCurrency(product.price)}
          </span>
          {isAvailable && product.stockQuantity <= 10 && (
            <span className="text-xs text-orange-600 font-medium">
              残りわずか
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default HomePage;
