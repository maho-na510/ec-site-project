import { userApi, adminApi } from './api';
import { Product, ProductFormData, ProductListParams, PaginatedResponse, Category } from '@types/index';

export const productService = {
  // User-facing product endpoints
  async getProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
    const response = await userApi.get<PaginatedResponse<Product>>('/products', { params });
    return response.data;
  },

  async getProductById(id: number): Promise<Product> {
    const response = await userApi.get<Product>(`/products/${id}`);
    return response.data;
  },

  async searchProducts(query: string, params?: ProductListParams): Promise<PaginatedResponse<Product>> {
    const response = await userApi.get<PaginatedResponse<Product>>('/products/search', {
      params: { ...params, q: query },
    });
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    const response = await userApi.get<Category[]>('/categories');
    return response.data;
  },

  // Admin product management
  async createProduct(data: ProductFormData): Promise<Product> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach((file) => formData.append('images[]', file));
      } else {
        formData.append(key, String(value));
      }
    });

    const response = await adminApi.post<Product>('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateProduct(id: number, data: Partial<ProductFormData>): Promise<Product> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach((file) => formData.append('images[]', file));
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await adminApi.put<Product>(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteProduct(id: number): Promise<{ message: string }> {
    const response = await adminApi.delete(`/products/${id}`);
    return response.data;
  },

  async suspendProduct(id: number): Promise<Product> {
    const response = await adminApi.post<Product>(`/products/${id}/suspend`);
    return response.data;
  },

  async unsuspendProduct(id: number): Promise<Product> {
    const response = await adminApi.post<Product>(`/products/${id}/unsuspend`);
    return response.data;
  },

  // Admin category management
  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    const response = await adminApi.post<Category>('/categories', data);
    return response.data;
  },

  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    const response = await adminApi.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: number): Promise<{ message: string }> {
    const response = await adminApi.delete(`/categories/${id}`);
    return response.data;
  },
};
