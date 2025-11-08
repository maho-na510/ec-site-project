// Core domain types
export interface User {
  id: number;
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  category?: Category;
  images: ProductImage[];
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  displayOrder: number;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  product: Product;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  items: OrderItem[];
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Payment {
  id: number;
  orderId: number;
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
}

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

// Enums
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PAYMENT_FAILED = 'payment_failed',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum InventoryActionType {
  SALE = 'sale',
  RESTOCK = 'restock',
  DAMAGE = 'damage',
  THEFT = 'theft',
  CORRECTION = 'correction',
  INITIAL_STOCK = 'initial_stock',
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  user: User | Admin;
  token: string;
  refreshToken: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  initialStock: number;
  isActive: boolean;
  images?: File[];
}

export interface CheckoutFormData {
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  paymentMethod: PaymentMethod;
}

// Filter and sort types
export interface ProductFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
}

export type ProductSortBy = 'price_asc' | 'price_desc' | 'newest' | 'name';

export interface ProductListParams extends ProductFilters {
  page?: number;
  perPage?: number;
  sortBy?: ProductSortBy;
}

// Error types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
