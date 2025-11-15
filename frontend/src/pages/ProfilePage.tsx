import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { User, Order, OrderStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';
import Pagination from '../components/shared/Pagination';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: ordersData, isLoading } = useOrders(currentPage, 10);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get success message from navigation state
  const successMessage = (location.state as any)?.message;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated || isAdmin) {
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

  const userInfo = user as User;
  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-secondary-900 mb-8">マイページ</h1>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">
              個人情報
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-secondary-600">名前</label>
                <p className="text-secondary-900">{userInfo.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-600">メールアドレス</label>
                <p className="text-secondary-900">{userInfo.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-600">電話番号</label>
                <p className="text-secondary-900">{userInfo.phoneNumber}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-600">住所</label>
                <p className="text-secondary-900">
                  {userInfo.address}<br />
                  {userInfo.city}, {userInfo.state} {userInfo.postalCode}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-600">
                  登録日
                </label>
                <p className="text-secondary-900">
                  {formatDate(userInfo.createdAt, 'PPP')}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-secondary-200 space-y-3">
              <Button variant="outline" fullWidth>
                プロフィールを編集
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleLogout}
                isLoading={isLoggingOut}
              >
                ログアウト
              </Button>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">
              注文履歴
            </h2>

            {isLoading ? (
              <LoadingSpinner message="読み込み中..." />
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary-600 mb-4">まだ注文がありません</p>
                <Button onClick={() => navigate('/products')}>
                  商品一覧
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {orders.map((order: Order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
    [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [OrderStatus.PAYMENT_FAILED]: 'bg-red-100 text-red-800',
  };

  const statusText = {
    [OrderStatus.PENDING]: '処理中',
    [OrderStatus.PROCESSING]: '準備中',
    [OrderStatus.COMPLETED]: '配達完了',
    [OrderStatus.CANCELLED]: 'キャンセル',
    [OrderStatus.PAYMENT_FAILED]: 'キャンセル',
  };

  return (
    <div className="border border-secondary-200 rounded-lg overflow-hidden">
      {/* Order Header */}
      <div
        className="p-4 bg-secondary-50 cursor-pointer hover:bg-secondary-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <div className="flex items-center space-x-4">
              <h3 className="font-semibold text-secondary-900">
                注文番号 #{order.orderNumber}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusColors[order.status]
                }`}
              >
                {statusText[order.status]}
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm text-secondary-600">
              <span>{formatDate(order.createdAt, 'PPP')}</span>
              <span>{order.items.length} 商品</span>
              <span className="font-semibold text-secondary-900">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          <svg
            className={`w-5 h-5 text-secondary-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Order Details (Expandable) */}
      {isExpanded && (
        <div className="p-4 border-t border-secondary-200">
          {/* Shipping Address */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-secondary-700 mb-2">
              配送先住所
            </h4>
            <p className="text-sm text-secondary-600">
              {order.shippingAddress}<br />
              {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
            </p>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-sm font-medium text-secondary-700 mb-3">
              注文内容の確認
            </h4>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex-grow">
                    <p className="text-secondary-900 font-medium">
                      {item.productName}
                    </p>
                    <p className="text-secondary-600">
                      数量: {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-semibold text-secondary-900">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-secondary-200 flex justify-between items-center">
              <span className="font-semibold text-secondary-900">合計</span>
              <span className="text-lg font-bold text-primary-600">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          {order.payment && (
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">支払い方法</span>
                <span className="text-secondary-900 capitalize">
                  {order.payment.paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-secondary-600">注文状況</span>
                <span className="text-secondary-900 capitalize">
                  {order.payment.status}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
