import { userApi, adminApi } from './api';
import { LoginFormData, RegisterFormData, LoginResponse, User, Admin } from '@types/index';

export const authService = {
  // User authentication
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    const response = await userApi.post<LoginResponse>('/auth/login', credentials);
    this.setTokens(response.data.token, response.data.refreshToken);
    return response.data;
  },

  async register(data: RegisterFormData): Promise<{ message: string; userId: number }> {
    const response = await userApi.post('/users/register', data);
    return response.data;
  },

  async confirmEmail(token: string): Promise<{ message: string }> {
    const response = await userApi.post('/users/confirm', { token });
    return response.data;
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await userApi.post('/auth/password-reset/request', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await userApi.post('/auth/password-reset/confirm', {
      token,
      newPassword,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await userApi.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await userApi.get<User>('/users/me');
    return response.data;
  },

  // Admin authentication
  async adminLogin(credentials: LoginFormData): Promise<LoginResponse> {
    const response = await adminApi.post<LoginResponse>('/auth/login', credentials);
    this.setTokens(response.data.token, response.data.refreshToken);
    return response.data;
  },

  async adminLogout(): Promise<void> {
    try {
      await adminApi.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  },

  async getCurrentAdmin(): Promise<Admin> {
    const response = await adminApi.get<Admin>('/admins/me');
    return response.data;
  },

  // Token management
  setTokens(token: string, refreshToken: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  },

  clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
