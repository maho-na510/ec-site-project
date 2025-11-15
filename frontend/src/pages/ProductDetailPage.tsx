import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = parseInt(id || '0');
  const { data: product, isLoading, error } = useProduct(productId);
  const { addToCart, isLoading: isAddingToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAddedMessage, setShowAddedMessage] = useState(false);

  const handleAddToCart = async () => {
    try {
      await addToCart(productId, quantity);
      setShowAddedMessage(true);
      setTimeout(() => setShowAddedMessage(false), 3000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold text-error mb-4">ページが見つかりません</h2>
        <p className="text-secondary-600 mb-6">
          {error instanceof Error ? error.message : 'ページが見つかりません'}
        </p>
        <Link to="/products">
          <Button variant="outline">戻る</Button>
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const mainImage = images[selectedImage]?.imageUrl || '/placeholder-product.jpg';
  const isOutOfStock = product.stockQuantity === 0;
  const isAvailable = product.isActive && !product.isSuspended && !isOutOfStock;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <ol className="flex items-center space-x-2 text-secondary-600">
          <li>
            <Link to="/" className="hover:text-primary-600">ホーム</Link>
          </li>
          <li>/</li>
          <li>
            <Link to="/products" className="hover:text-primary-600">商品一覧</Link>
          </li>
          <li>/</li>
          <li className="text-secondary-900 font-medium">{product.name}</li>
        </ol>
      </nav>

      {/* Product Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div className="relative aspect-square bg-secondary-100 rounded-lg overflow-hidden mb-4">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {!isAvailable && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="bg-white text-secondary-900 px-6 py-3 rounded-lg font-semibold text-lg">
                  {isOutOfStock ? '在庫切れ' : '在庫切れ'}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? 'border-primary-600'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <img
                    src={image.imageUrl}
                    alt={`${product.name} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mb-6">
            <span className="text-4xl font-bold text-primary-600">
              {formatCurrency(product.price)}
            </span>
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            {isAvailable ? (
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-green-700 font-medium">
                  在庫あり ({product.stockQuantity})
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-error rounded-full"></span>
                <span className="text-error font-medium">
                  {isOutOfStock ? '在庫切れ' : '在庫切れ'}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-secondary-900 mb-2">商品説明</h2>
            <p className="text-secondary-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Quantity Selector */}
          {isAvailable && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                数量
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-secondary-300 rounded-lg">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="px-4 py-2 text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-secondary-300 min-w-[60px] text-center font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stockQuantity}
                    className="px-4 py-2 text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                {product.stockQuantity <= 10 && (
                  <span className="text-sm text-orange-600">
                    残りわずか
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {showAddedMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                カートに追加しました
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                isLoading={isAddingToCart}
                size="lg"
                className="flex-1"
              >
                カートに追加
              </Button>
              <Button
                onClick={() => navigate('/cart')}
                variant="outline"
                size="lg"
              >
                カート
              </Button>
            </div>

            <Link to="/products">
              <Button variant="ghost" fullWidth>
                買い物を続ける
              </Button>
            </Link>
          </div>

          {/* Category Info */}
          {product.category && (
            <div className="mt-8 pt-8 border-t border-secondary-200">
              <div className="text-sm text-secondary-600">
                <span className="font-medium">カテゴリー:</span>{' '}
                <span>{product.category.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
