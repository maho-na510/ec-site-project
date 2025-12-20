import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useCategories } from '../hooks/useProducts';
import { Product, Category } from '../types';
import { formatCurrency } from '../utils/format';
import { useCart } from '../contexts/CartContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';
import Pagination from '../components/shared/Pagination';

const ProductsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data, isLoading, error } = useProducts({ page, perPage });
  const { data: categoriesData } = useCategories();
  const { addToCart } = useCart();
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

  const categories: Category[] = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.data || [];

  const allProducts: Product[] = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;

  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch = search === '' || product.name.includes(search) || product.description.includes(search);
    const matchesCategory = selectedCategory === null || product.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = async (productId: number) => {
    setAddingProductId(productId);
    try {
      await addToCart(productId, 1);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingProductId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-600">商品の読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">商品一覧</h1>
        <p className="text-secondary-600">
          {pagination ? `${pagination.total} 商品` : '商品一覧'}
        </p>
      </div>

      {/* 検索バー */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="商品を検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border border-secondary-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* カテゴリーフィルター */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${selectedCategory === null ? 'bg-primary-600 text-white' : 'border-secondary-300 text-secondary-700'}`}
          >
            すべて
          </button>
          {categories.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border ${selectedCategory === cat.id ? 'bg-primary-600 text-white' : 'border-secondary-300 text-secondary-700'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* 商品グリッド */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-secondary-600 mb-4">商品が見つかりませんでした</p>
          <Link to="/">
            <Button variant="outline">ホーム</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredProducts.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isAddingToCart={addingProductId === product.id}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 商品カードコンポーネント
interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
  isAddingToCart: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, isAddingToCart }) => {
  const mainImage = product.images?.[0]?.imageUrl || '/placeholder-product.jpg';
  const isOutOfStock = product.stockQuantity === 0;
  const isAvailable = product.isActive && !product.isSuspended && !isOutOfStock;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square bg-secondary-100 overflow-hidden">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          />
          {!isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-white text-secondary-900 px-4 py-2 rounded-lg font-semibold">
                在庫切れ
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-secondary-600 mb-3 line-clamp-2 flex-grow">
          {product.description}
        </p>

        <div className="mb-3">
          <span className="text-xl font-bold text-primary-600">
            {formatCurrency(product.price)}
          </span>
        </div>

        <Button
          onClick={() => onAddToCart(product.id)}
          disabled={!isAvailable || isAddingToCart}
          isLoading={isAddingToCart}
          fullWidth
          size="sm"
        >
          {isOutOfStock ? '在庫切れ' : 'カートに追加'}
        </Button>
      </div>
    </div>
  );
};

export default ProductsPage;
