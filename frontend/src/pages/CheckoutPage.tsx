import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useCreateOrder } from '../hooks/useOrders';
import { CheckoutFormData, PaymentMethod, User } from '../types';
import { formatCurrency } from '../utils/format';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const { mutateAsync: createOrder } = useCreateOrder();
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    defaultValues: user
      ? {
          shippingAddress: (user as User).address,
          shippingCity: (user as User).city,
          shippingState: (user as User).state,
          shippingPostalCode: (user as User).postalCode,
        }
      : undefined,
  });

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
          <Button onClick={() => navigate('/login')}>サインイン</Button>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const isEmpty = cartItems.length === 0;

  if (isEmpty) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-900 mb-4">
            カートは空です
          </h2>
          <p className="text-secondary-600 mb-6">
            カートは空です
          </p>
          <Button onClick={() => navigate('/products')}>商品一覧</Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setError('');
    setIsProcessing(true);

    try {
      const order = await createOrder(data);
      await clearCart();

      // Redirect to order confirmation or profile page
      navigate('/profile', {
        state: { message: `Order #${order.orderNumber} placed successfully!` },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to place order. Please try again.'
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-secondary-900 mb-8">お会計</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                配送先住所
              </h2>

              <div className="space-y-4">
                <Input
                  label="住所"
                  placeholder="住所"
                  error={errors.shippingAddress?.message}
                  fullWidth
                  {...register('shippingAddress', {
                    required: 'この項目は必須です',
                  })}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="住所"
                    placeholder="住所"
                    error={errors.shippingCity?.message}
                    fullWidth
                    {...register('shippingCity', {
                      required: 'この項目は必須です',
                    })}
                  />

                  <Input
                    label="住所"
                    placeholder="住所"
                    error={errors.shippingState?.message}
                    fullWidth
                    {...register('shippingState', {
                      required: 'この項目は必須です',
                    })}
                  />

                  <Input
                    label="住所"
                    placeholder="住所"
                    error={errors.shippingPostalCode?.message}
                    fullWidth
                    {...register('shippingPostalCode', {
                      required: 'この項目は必須です',
                      pattern: {
                        value: /^\d{5}(-\d{4})?$/,
                        message: '無効な形式です',
                      },
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                支払い方法
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-secondary-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <input
                    type="radio"
                    value={PaymentMethod.CREDIT_CARD}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    {...register('paymentMethod', {
                      required: 'Please select a payment method',
                    })}
                  />
                  <span className="ml-3 text-secondary-900 font-medium">
                    クレジットカード
                  </span>
                </label>

                <label className="flex items-center p-4 border-2 border-secondary-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <input
                    type="radio"
                    value={PaymentMethod.DEBIT_CARD}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    {...register('paymentMethod')}
                  />
                  <span className="ml-3 text-secondary-900 font-medium">
                    デビットカード
                  </span>
                </label>

                <label className="flex items-center p-4 border-2 border-secondary-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <input
                    type="radio"
                    value={PaymentMethod.PAYPAL}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    {...register('paymentMethod')}
                  />
                  <span className="ml-3 text-secondary-900 font-medium">
                    PayPal
                  </span>
                </label>
              </div>

              {errors.paymentMethod && (
                <p className="mt-2 text-sm text-error">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>

            {/* Order Review */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                注文内容の確認
              </h2>

              <div className="space-y-4">
                {cartItems.map((item) => {
                  const product = item.product;
                  const mainImage = product.images?.[0]?.imageUrl || '/placeholder-product.jpg';
                  const itemTotal = product.price * item.quantity;

                  return (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-secondary-200 last:border-0">
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-grow">
                        <h3 className="font-medium text-secondary-900">{product.name}</h3>
                        <p className="text-sm text-secondary-600">数量: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-secondary-900">
                          {formatCurrency(itemTotal)}
                        </div>
                        <div className="text-sm text-secondary-600">
                          {formatCurrency(product.price)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-secondary-50 rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                注文概要
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-secondary-600">
                  <span>小計</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-secondary-600">
                  <span>配送先住所</span>
                  <span>処理中...</span>
                </div>
                <div className="flex justify-between text-secondary-600">
                  <span>合計</span>
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
                type="submit"
                fullWidth
                size="lg"
                isLoading={isProcessing}
                disabled={isProcessing}
              >
                {isProcessing ? '処理中...' : '注文を確定する'}
              </Button>

              <p className="text-xs text-secondary-600 mt-4 text-center">
                By placing your order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
