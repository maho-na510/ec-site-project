import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';

const CartPage: React.FC = () => {
  const { cart, subtotal, updateQuantity, removeItem, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-900 mb-4">
            ログイン
          </h2>
          <p className="text-secondary-600 mb-6">
            ログイン
          </p>
          <Link to="/login">
            <Button>サインイン</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  const cartItems = cart?.items || [];
  const isEmpty = cartItems.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <h1 className="text-3xl font-bold text-secondary-900 mb-8">ショッピングカート</h1>

      {isEmpty ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-secondary-50 rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                注文概要
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-secondary-600">
                  <span>小計 ({cartItems.length} 商品)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-secondary-600">
                  <span>配送先住所</span>
                  <span>処理中...</span>
                </div>
                <div className="border-t border-secondary-300 pt-3">
                  <div className="flex justify-between text-lg font-bold text-secondary-900">
                    <span>合計</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate('/checkout')}
                fullWidth
                size="lg"
                className="mb-4"
              >
                レジに進む
              </Button>

              <Link to="/products">
                <Button variant="outline" fullWidth>
                  買い物を続ける
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Empty Cart Component
const EmptyCart: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <svg
          className="mx-auto h-24 w-24 text-secondary-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-secondary-900 mb-4">カートは空です</h2>
      <p className="text-secondary-600 mb-8">
        買い物を続ける
      </p>
      <Link to="/products">
        <Button size="lg">商品一覧</Button>
      </Link>
    </div>
  );
};

// Cart Item Component
interface CartItemProps {
  item: any;
  onUpdateQuantity: (itemId: number, quantity: number) => Promise<void>;
  onRemove: (itemId: number) => Promise<void>;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const product = item.product;
  const mainImage = product.images?.[0]?.imageUrl || '/placeholder-product.jpg';
  const itemTotal = product.price * item.quantity;

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > product.stockQuantity) return;

    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex gap-6">
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="flex-shrink-0">
        <img
          src={mainImage}
          alt={product.name}
          className="w-24 h-24 object-cover rounded-lg"
        />
      </Link>

      {/* Product Details */}
      <div className="flex-grow">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-lg font-semibold text-secondary-900 hover:text-primary-600 mb-2">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-secondary-600">数量:</span>
            <div className="flex items-center border border-secondary-300 rounded-lg">
              <button
                onClick={() => handleUpdateQuantity(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="px-3 py-1 text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="px-4 py-1 border-x border-secondary-300 min-w-[50px] text-center font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => handleUpdateQuantity(item.quantity + 1)}
                disabled={isUpdating || item.quantity >= product.stockQuantity}
                className="px-3 py-1 text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="text-right">
            <div className="text-sm text-secondary-600">
              {formatCurrency(product.price)}
            </div>
            <div className="text-lg font-bold text-primary-600">
              {formatCurrency(itemTotal)}
            </div>
          </div>
        </div>

        {/* Stock Warning */}
        {product.stockQuantity <= 5 && (
          <p className="text-sm text-orange-600 mt-2">
            残りわずか
          </p>
        )}
      </div>

      {/* Remove Button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-error hover:text-red-700 p-2 disabled:opacity-50"
          title="削除"
        >
          {isRemoving ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default CartPage;
