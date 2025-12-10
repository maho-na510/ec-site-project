// ユーザー
export interface User {
  id: number;
  name: string;
  email: string;
  address: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

// 管理者
export interface Admin {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 商品
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId?: number;
  category?: Category;
  images: ProductImage[];
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

// 商品画像
export interface ProductImage {
  id: number;
  imageUrl: string;
  displayOrder: number;
}

// カテゴリー
export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// カートアイテム
export interface CartItem {
  id: number;
  productId: number;
  product: Product;
  quantity: number;
  subtotal: number;
}

// カート
export interface Cart {
  id: number;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// 注文
export interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  items: OrderItem[];
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

// 注文アイテム
export interface OrderItem {
  id: number;
  product?: {
    id: number;
    name: string;
    price: number;
    mainImage?: string;
  };
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// 支払い
export interface Payment {
  id: number;
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
}

// 在庫ログ
export interface InventoryLog {
  id: number;
  productId: number;
  adminId: number;
  quantityBefore: number;
  quantityAfter: number;
  actionType: InventoryActionType;
  notes?: string;
  createdAt: string;
}

// 注文ステータス
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PAYMENT_FAILED = 'payment_failed',
}

// 支払い方法
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
}

// 支払いステータス
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// 在庫操作タイプ
export enum InventoryActionType {
  SALE = 'sale',
  RESTOCK = 'restock',
  DAMAGE = 'damage',
  THEFT = 'theft',
  CORRECTION = 'correction',
  INITIAL_STOCK = 'initial_stock',
}

// APIレスポンス
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

// ページネーション付きレスポンス
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

// ログインレスポンス
export interface LoginResponse {
  user: User | Admin;
  accessToken: string;
}

// ログインフォーム
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// 会員登録フォーム
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  address: string;
  phone: string;
}

// 商品フォーム
export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  initialStock: number;
  isActive: boolean;
  images?: File[];
}

// チェックアウトフォーム
export interface CheckoutFormData {
  shippingAddress: string;
  paymentMethod: PaymentMethod;
}

// 商品フィルター
export interface ProductFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
}

export type ProductSortBy = 'price_asc' | 'price_desc' | 'newest' | 'name';

// 商品一覧パラメーター
export interface ProductListParams extends ProductFilters {
  page?: number;
  perPage?: number;
  sortBy?: ProductSortBy;
}

// APIエラー
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
