import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Edit2, Check, X, KeyRound, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { useWishlist, useRemoveFromWishlist } from '../hooks/useWishlist';
import { useCart } from '../contexts/CartContext';
import { authService } from '../services/authService';
import { User, Order, OrderStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Pagination from '../components/shared/Pagination';

type Tab = 'profile' | 'wishlist' | 'orders';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // プロフィール編集
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  // パスワード変更
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { data: ordersData, isLoading: ordersLoading } = useOrders(currentPage, 10);
  const { data: wishlist, isLoading: wishlistLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { addToCart } = useCart();

  if (!isAuthenticated || isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h2>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ログイン
        </button>
      </div>
    );
  }

  const userInfo = user as User;
  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch {
      setIsLoggingOut(false);
    }
  };

  const startEditing = () => {
    setEditName(userInfo.name || '');
    setEditAddress(userInfo.address || '');
    setEditPhone(userInfo.phone || '');
    setSaveMessage('');
    setSaveError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('新しいパスワードは6文字以上で入力してください');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('新しいパスワードが一致しません');
      return;
    }
    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword, newPasswordConfirm);
      setPasswordMessage('パスワードを変更しました');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setIsPasswordOpen(false);
      setTimeout(() => setPasswordMessage(''), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'パスワードの変更に失敗しました';
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await authService.updateUser({
        name: editName,
        address: editAddress,
        phone: editPhone,
      });
      await refreshUser();
      setIsEditing(false);
      setSaveMessage('プロフィールを更新しました');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveError('更新に失敗しました。しばらくしてからお試しください');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'プロフィール' },
    { key: 'wishlist', label: 'ほしい物リスト' },
    { key: 'orders', label: '注文履歴' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ヘッダー */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl select-none">
              {userInfo.name?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{userInfo.name}</h1>
              <p className="text-sm text-gray-500">{userInfo.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-sm text-red-500 hover:text-red-700 px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
          >
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ---- プロフィールタブ ---- */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">個人情報</h2>
              {!isEditing && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  編集
                </button>
              )}
            </div>

            {saveMessage && (
              <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                {saveMessage}
              </div>
            )}

            {isEditing ? (
              /* 編集フォーム */
              <div className="space-y-4">
                {saveError && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {saveError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                  <input
                    type="email"
                    value={userInfo.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">メールアドレスは変更できません</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                  >
                    <X className="w-4 h-4" />
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              /* 表示モード */
              <div className="space-y-4">
                <InfoRow label="名前" value={userInfo.name} />
                <InfoRow label="メールアドレス" value={userInfo.email} />
                <InfoRow label="住所" value={userInfo.address || '未設定'} />
                <InfoRow label="電話番号" value={userInfo.phone || '未設定'} />
                <InfoRow label="登録日" value={formatDate(userInfo.createdAt, 'PPP')} />
              </div>
            )}

            {/* パスワード変更セクション */}
            {!isEditing && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                {passwordMessage && (
                  <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                    {passwordMessage}
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsPasswordOpen((prev) => !prev);
                    setPasswordError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setNewPasswordConfirm('');
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  <KeyRound className="w-4 h-4" />
                  パスワードを変更する
                  <ChevronDown className={`w-4 h-4 transition-transform ${isPasswordOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPasswordOpen && (
                  <div className="mt-4 space-y-3">
                    {passwordError && (
                      <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                        {passwordError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">現在のパスワード</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="6文字以上"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（確認）</label>
                      <input
                        type="password"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        autoComplete="new-password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword || !currentPassword || !newPassword || !newPasswordConfirm}
                        className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        <Check className="w-4 h-4" />
                        {isChangingPassword ? '変更中...' : 'パスワードを変更'}
                      </button>
                      <button
                        onClick={() => {
                          setIsPasswordOpen(false);
                          setPasswordError('');
                        }}
                        disabled={isChangingPassword}
                        className="flex items-center gap-1.5 px-5 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                      >
                        <X className="w-4 h-4" />
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---- ほしい物リストタブ ---- */}
        {activeTab === 'wishlist' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">ほしい物リスト</h2>
              {wishlist && wishlist.length > 0 && (
                <span className="text-sm text-gray-500">{wishlist.length}件</span>
              )}
            </div>

            {wishlistLoading ? (
              <LoadingSpinner message="読み込み中..." />
            ) : !wishlist || wishlist.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">ほしい物リストは空です</p>
                <Link
                  to="/products"
                  className="text-sm text-blue-600 hover:underline"
                >
                  商品を見る
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlist.map((item) => {
                  const mainImage = item.product.images?.[0]?.imageUrl || '/placeholder-product.jpg';
                  const isAvailable = item.product.isActive && !item.product.isSuspended && item.product.stockQuantity > 0;
                  return (
                    <div key={item.id} className="flex gap-3 p-3 border border-gray-100 rounded-xl hover:shadow-sm transition">
                      <Link to={`/products/${item.productId}`} className="flex-shrink-0">
                        <img
                          src={mainImage}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item.productId}`}>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition mb-1">
                            {item.product.name}
                          </p>
                        </Link>
                        <p className="text-base font-bold text-blue-600 mb-2">
                          {formatCurrency(item.product.price)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addToCart(item.productId, 1)}
                            disabled={!isAvailable}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                              isAvailable
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            {isAvailable ? 'カートへ' : '在庫切れ'}
                          </button>
                          <button
                            onClick={() => removeFromWishlist.mutate(item.productId)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---- 注文履歴タブ ---- */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">注文履歴</h2>

            {ordersLoading ? (
              <LoadingSpinner message="読み込み中..." />
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">まだ注文がありません</p>
                <Link
                  to="/products"
                  className="text-sm text-blue-600 hover:underline"
                >
                  商品を見る
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {orders.map((order: Order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

/* ---- サブコンポーネント ---- */

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start py-3 border-b border-gray-50 last:border-0">
    <span className="w-32 text-sm font-medium text-gray-500 flex-shrink-0">{label}</span>
    <span className="text-sm text-gray-900">{value}</span>
  </div>
);

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
    [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [OrderStatus.PAYMENT_FAILED]: 'bg-red-100 text-red-800',
  };

  const statusText: Record<string, string> = {
    [OrderStatus.PENDING]: '処理中',
    [OrderStatus.PROCESSING]: '準備中',
    [OrderStatus.COMPLETED]: '完了',
    [OrderStatus.CANCELLED]: 'キャンセル',
    [OrderStatus.PAYMENT_FAILED]: '支払い失敗',
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-semibold text-gray-900">
                注文番号 #{order.orderNumber}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                {statusText[order.status] || order.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{formatDate(order.createdAt, 'PPP')}</span>
              <span className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-100">
          {order.shippingAddress && (
            <div className="mb-3 text-sm">
              <span className="font-medium text-gray-700">配送先: </span>
              <span className="text-gray-600">{order.shippingAddress}</span>
            </div>
          )}
          {order.items && order.items.length > 0 && (
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.product?.name || item.productName}</p>
                    <p className="text-gray-500 text-xs">
                      {item.quantity}点 × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-sm font-bold">
                <span>合計</span>
                <span className="text-blue-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
